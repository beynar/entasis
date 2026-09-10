import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import { bind } from '$lib/utils/state.svelte.js';
import { ResizableLayoutAnimation } from './resizable.animation.svelte.js';
import {
	SIZE_EPSILON,
	TOTAL_SIZE,
	areNumberArraysEqual,
	areStringArraysEqual,
	clamp,
	getAllowedCollapsedPanelIds,
	getCollapseBreakpoint,
	getCollapsedSize,
	getInitialSizes,
	getNormalizedSizes,
	getPanelMax,
	getPanelMin,
	getPanelResizeMin,
	getSizeValuePercent,
	isFiniteNumber,
	roundSize,
	type ResizableLayoutPanel,
	validatePanelConstraints
} from './resizable.layout.js';
import { readResizableStoredLayout, writeResizableStoredLayout } from './resizable.persistence.js';
import type {
	ResizableDir,
	ResizableDisabledHandles,
	ResizableHandleAriaLabel,
	ResizableHandlePayload,
	ResizableLayoutCommitPayload,
	ResizableOrientation,
	ResizablePanelPayload,
	ResizablePanelItem
} from './resizable.props.js';

type ResizableStateOptions = {
	id: string;
	panels: ResizablePanelItem[];
	sizes?: number[];
	collapsedPanels: string[];
	storageKey?: string;
	orientation: ResizableOrientation;
	dir?: ResizableDir;
	disabled?: boolean;
	disabledHandles?: ResizableDisabledHandles;
	keyboardStep?: number;
	onResize?: (sizes: number[]) => void;
	onLayoutChange?: (sizes: number[]) => void;
	onLayoutCommit?: (payload: ResizableLayoutCommitPayload) => void;
	onCollapsedPanelsChange?: (panelIds: string[]) => void;
};

export interface ResizableState extends ResizableStateOptions {}

type PairResizeResult = {
	sizeA: number;
	sizeB: number;
	collapsedIndex: number | null;
	expandedIndexes: number[];
};

const DEFAULT_KEYBOARD_STEP = 10;

export class ResizableState {
	groupNode = $state<HTMLElement | null>(null);
	dragIndex = $state<number | null>(null);
	resolvedDir = $state<ResizableDir>('ltr');
	private startSizes: number[] = [];
	private groupSize = 0;
	private defaultCollapsedPanelIds = new Set<string>();
	private dragMoved = false;
	private ignoreNextClick = false;
	private handleAttachments = new Map<number, Attachment<HTMLElement>>();
	private resizeObserver: ResizeObserver | null = null;
	private animation = new ResizableLayoutAnimation();

	constructor(options: ResizableStateOptions) {
		bind(this, options);
		this.loadStoredLayout(this.storageKey);
		this.syncLayout();

		$effect(() => {
			const panels = this.panels;
			const sizes = this.sizes;
			const collapsedPanels = this.collapsedPanels;
			untrack(() => this.syncLayout(panels, sizes, collapsedPanels));
		});

		$effect(() => {
			const dir = this.dir;
			const groupNode = this.groupNode;
			untrack(() => this.syncDirection(groupNode, dir));
		});
	}

	get separatorOrientation(): ResizableOrientation {
		return this.orientation === 'horizontal' ? 'vertical' : 'horizontal';
	}

	get isDragging() {
		return this.dragIndex !== null;
	}

	get isAnimating() {
		return this.animation.active;
	}

	get isRtl() {
		return this.resolvedDir === 'rtl';
	}

	root = (node: HTMLElement) => {
		this.resizeObserver?.disconnect();
		this.groupNode = node;
		this.syncDirection(node, this.dir);
		queueMicrotask(() => this.groupNode === node && this.syncLayout());
		this.resizeObserver =
			typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.syncLayout());
		this.resizeObserver?.observe(node);
		return () => {
			this.resizeObserver?.disconnect();
			this.animation.destroy();
			this.resizeObserver = null;
			this.groupNode = null;
			this.dragIndex = null;
		};
	};

	handle(index: number) {
		const cachedAttachment = this.handleAttachments.get(index);
		if (cachedAttachment) return cachedAttachment;

		const attachment: Attachment<HTMLElement> = (node) => {
			const drag = createPointerDrag({
				onStart: (payload) => this.startDrag(payload, index),
				onMove: (payload) => this.updateDrag(payload, index),
				onEnd: () => this.endDrag()
			});
			return drag(node);
		};

		this.handleAttachments.set(index, attachment);
		return attachment;
	}

	panelStyle(index: number) {
		return `flex: ${this.layoutSizes[index] ?? 0} 1 0px;`;
	}

	panelId(index: number) {
		return this.panels[index]?.id ?? `${this.id}-panel-${index + 1}`;
	}

	isPanelCollapsed(index: number) {
		return this.collapsedPanels.includes(this.panelId(index));
	}

	panelPayload(index: number): ResizablePanelPayload {
		const panel = this.layoutPanels[index];
		return {
			id: this.panelId(index),
			index,
			size: roundSize(this.layoutSizes[index] ?? 0),
			min: roundSize(getPanelMin(panel)),
			max: roundSize(getPanelMax(panel)),
			collapsed: this.isPanelCollapsed(index),
			disabled: !!panel?.disabled,
			dragging: this.dragIndex === index || this.dragIndex === index - 1
		};
	}

	handlePayload(index: number): ResizableHandlePayload {
		const range = this.getHandleRange(index);
		return {
			index,
			size: Math.round(this.layoutSizes[index] ?? 0),
			min: Math.round(range.min),
			max: Math.round(range.max),
			disabled: this.isHandleDisabled(index),
			dragging: this.dragIndex === index,
			separatorOrientation: this.separatorOrientation,
			collapsedBefore: this.isPanelCollapsed(index),
			collapsedAfter: this.isPanelCollapsed(index + 1)
		};
	}

	handleAriaLabelPayload(index: number): ResizableHandleAriaLabel {
		const payload = this.handlePayload(index);
		return {
			index: payload.index,
			size: payload.size,
			min: payload.min,
			max: payload.max,
			orientation: this.orientation,
			separatorOrientation: payload.separatorOrientation,
			collapsedBefore: payload.collapsedBefore,
			collapsedAfter: payload.collapsedAfter
		};
	}

	startDrag(payload: PointerDragPayload, index: number) {
		if (this.dragIndex !== null || this.isHandleDisabled(index) || !this.groupNode) return false;

		payload.node.focus();
		this.animation.stop();
		this.dragIndex = index;
		this.dragMoved = false;
		this.startSizes = [...this.layoutSizes];
		const rect = this.groupNode.getBoundingClientRect();
		const axisSize = this.orientation === 'horizontal' ? rect.width : rect.height;
		this.groupSize = axisSize - this.getHandleAxisSize();
		return true;
	}

	updateDrag(payload: PointerDragPayload, index: number) {
		if (this.dragIndex !== index || this.groupSize <= 0) return;

		this.dragMoved = payload.hasMoved;
		let delta = this.orientation === 'horizontal' ? payload.deltaX : payload.deltaY;
		if (this.orientation === 'horizontal' && this.isRtl) {
			delta = -delta;
		}
		this.setHandle(index, this.startSizes[index] + (delta / this.groupSize) * TOTAL_SIZE, {
			commit: false,
			isUserInteraction: true
		});
	}

	endDrag() {
		if (this.dragIndex === null) return;

		this.dragIndex = null;
		this.ignoreNextClick = this.dragMoved;
		this.dragMoved = false;
		this.commitChange(true);
	}

	handleClick(index: number) {
		if (this.ignoreNextClick) {
			this.ignoreNextClick = false;
			return;
		}
		if (this.isHandleDisabled(index)) return;
		if (this.isPanelCollapsed(index) || this.isPanelCollapsed(index + 1)) {
			this.resetHandle(index);
		}
	}

	resetHandle(index: number) {
		if (this.isHandleDisabled(index)) return;
		const pairSum = (this.layoutSizes[index] ?? 0) + (this.layoutSizes[index + 1] ?? 0);
		const defaultSizes = this.getDefaultLayoutSizes();
		const defaultA = defaultSizes[index] ?? this.layoutSizes[index] ?? 0;
		const defaultB = defaultSizes[index + 1] ?? this.layoutSizes[index + 1] ?? 0;
		const defaultSum = defaultA + defaultB;
		if (pairSum <= 0 || defaultSum <= 0) return;
		this.animation.start();
		this.setHandle(index, (pairSum * defaultA) / defaultSum, {
			commit: true,
			isUserInteraction: true
		});
	}

	handleKeydown(event: KeyboardEvent, index: number) {
		if (this.isHandleDisabled(index)) return;

		const horizontal = this.orientation === 'horizontal';
		const growKey = horizontal ? 'ArrowRight' : 'ArrowDown';
		const shrinkKey = horizontal ? 'ArrowLeft' : 'ArrowUp';
		const rtlMultiplier = horizontal && this.isRtl ? -1 : 1;
		const step = this.getKeyboardStep();
		let nextSize: number | null = null;

		if (event.key === growKey) {
			nextSize = (this.layoutSizes[index] ?? 0) + step * rtlMultiplier;
		} else if (event.key === shrinkKey) {
			nextSize = (this.layoutSizes[index] ?? 0) - step * rtlMultiplier;
		} else if (event.key === 'Home') {
			nextSize = this.getHandleRange(index).min;
		} else if (event.key === 'End') {
			nextSize = this.getHandleRange(index).max;
		}

		if (nextSize === null) return;
		event.preventDefault();
		this.setHandle(index, nextSize, { commit: true, isUserInteraction: true });
	}

	private get layoutSizes() {
		return this.sizes ?? [];
	}

	private get layoutPanels() {
		return this.getLayoutPanels(this.panels);
	}

	private syncDirection(node: HTMLElement | null, explicitDir: ResizableDir | undefined) {
		if (explicitDir) {
			this.resolvedDir = explicitDir;
			return;
		}

		this.resolvedDir = node && getComputedStyle(node).direction === 'rtl' ? 'rtl' : 'ltr';
	}

	private syncLayout(
		panels = this.panels,
		currentSizes = this.sizes,
		currentCollapsedPanels = this.collapsedPanels
	) {
		const layoutPanels = this.getLayoutPanels(panels);
		validatePanelConstraints(layoutPanels);
		const collapsedPanelIds = this.getNormalizedCollapsedPanelIds(
			layoutPanels,
			currentCollapsedPanels
		);
		if (!areStringArraysEqual(collapsedPanelIds, currentCollapsedPanels)) {
			this.setCollapsedPanelIds(collapsedPanelIds);
		}
		const nextSizes = getNormalizedSizes(
			currentSizes?.length === layoutPanels.length ? currentSizes : getInitialSizes(layoutPanels),
			layoutPanels,
			collapsedPanelIds,
			this.panelIdFor
		);

		if (areNumberArraysEqual(nextSizes, currentSizes ?? [])) return;
		this.sizes = nextSizes;
		this.onLayoutChange?.([...nextSizes]);
		this.onLayoutCommit?.({ sizes: [...nextSizes], isUserInteraction: false });
	}

	private setHandle(
		index: number,
		targetSize: number,
		options: { commit: boolean; isUserInteraction: boolean }
	) {
		const nextSizes = [...this.layoutSizes];
		const resize = this.resolvePairResize(index, targetSize);
		if (!resize) return;

		const changesCollapsedState =
			resize.collapsedIndex !== null ||
			resize.expandedIndexes.some((panelIndex) => this.isPanelCollapsed(panelIndex));
		if (options.commit && changesCollapsedState) {
			this.animation.start();
		}
		nextSizes[index] = roundSize(resize.sizeA);
		nextSizes[index + 1] = roundSize(resize.sizeB);
		this.applyPairCollapsedState(index, resize, nextSizes);
		this.sizes = nextSizes;
		this.onLayoutChange?.([...nextSizes]);

		if (options.commit) {
			this.commitChange(options.isUserInteraction);
		}
	}

	private resolvePairResize(index: number, targetSize: number): PairResizeResult | null {
		const hardRange = this.getHandleRange(index);
		if (hardRange.min > hardRange.max) return null;

		const pairSum = (this.layoutSizes[index] ?? 0) + (this.layoutSizes[index + 1] ?? 0);
		const sizeA = clamp(targetSize, hardRange.min, hardRange.max);
		const collapsedA = this.getCollapsedPairResize(index, index, sizeA, pairSum);
		if (collapsedA) return collapsedA;

		const sizeB = pairSum - sizeA;
		const collapsedB = this.getCollapsedPairResize(index + 1, index, sizeB, pairSum);
		if (collapsedB) return collapsedB;

		const expandedRange = this.getExpandedHandleRange(index);
		if (expandedRange.min > expandedRange.max) return null;

		const expandedSizeA = clamp(sizeA, expandedRange.min, expandedRange.max);
		return {
			sizeA: expandedSizeA,
			sizeB: pairSum - expandedSizeA,
			collapsedIndex: null,
			expandedIndexes: [index, index + 1]
		};
	}

	private getCollapsedPairResize(
		panelIndex: number,
		handleIndex: number,
		targetPanelSize: number,
		pairSum: number
	): PairResizeResult | null {
		const panel = this.layoutPanels[panelIndex];
		if (!panel?.collapsible || targetPanelSize > getCollapseBreakpoint(panel)) {
			return null;
		}

		const collapsedSize = getCollapsedSize(panel);
		const sizeA = panelIndex === handleIndex ? collapsedSize : pairSum - collapsedSize;
		const sizeB = panelIndex === handleIndex ? pairSum - collapsedSize : collapsedSize;
		if (!this.canUsePairSizes(handleIndex, sizeA, sizeB, panelIndex)) return null;

		return {
			sizeA,
			sizeB,
			collapsedIndex: panelIndex,
			expandedIndexes: [panelIndex === handleIndex ? handleIndex + 1 : handleIndex]
		};
	}

	private applyPairCollapsedState(
		handleIndex: number,
		resize: PairResizeResult,
		nextSizes: number[]
	) {
		const nextCollapsedPanelIds = new Set(this.collapsedPanels);
		const panels = this.layoutPanels;
		for (const panelIndex of [handleIndex, handleIndex + 1]) {
			const panel = panels[panelIndex];
			const panelId = this.panelId(panelIndex);
			if (resize.collapsedIndex === panelIndex) {
				nextCollapsedPanelIds.add(panelId);
				continue;
			}
			if (
				resize.expandedIndexes.includes(panelIndex) ||
				nextSizes[panelIndex] > getCollapsedSize(panel)
			) {
				nextCollapsedPanelIds.delete(panelId);
			}
		}
		this.setCollapsedPanelIds([...nextCollapsedPanelIds]);
	}

	private commitChange(isUserInteraction: boolean) {
		const nextSizes = [...this.layoutSizes];
		this.onResize?.(nextSizes);
		this.onLayoutCommit?.({ sizes: nextSizes, isUserInteraction });
		this.writeStoredLayout();
	}

	private getHandleRange(index: number) {
		return this.getPairRange(index, true);
	}

	private getExpandedHandleRange(index: number) {
		return this.getPairRange(index, false);
	}

	private getPairRange(index: number, allowCollapse: boolean) {
		const sizes = this.layoutSizes;
		const panels = this.layoutPanels;
		const pairSum = (sizes[index] ?? 0) + (sizes[index + 1] ?? 0);
		const panelA = panels[index];
		const panelB = panels[index + 1];
		const minA = allowCollapse ? getPanelResizeMin(panelA) : getPanelMin(panelA);
		const maxA = getPanelMax(panelA);
		const minB = allowCollapse ? getPanelResizeMin(panelB) : getPanelMin(panelB);
		const maxB = getPanelMax(panelB);

		return {
			min: Math.max(minA, pairSum - maxB),
			max: Math.min(maxA, pairSum - minB)
		};
	}

	private isHandleDisabled(index: number) {
		return (
			!!this.disabled ||
			this.isHandleIndexDisabled(index) ||
			!!this.panels[index]?.disabled ||
			!!this.panels[index + 1]?.disabled
		);
	}

	private isHandleIndexDisabled(index: number) {
		const disabledHandles = this.disabledHandles;
		if (!disabledHandles) return false;
		if (typeof disabledHandles === 'function') return disabledHandles(index);
		if ('has' in disabledHandles) return disabledHandles.has(index);
		return disabledHandles.includes(index);
	}

	private getNormalizedCollapsedPanelIds(panels: ResizableLayoutPanel[], panelIds: string[]) {
		const requestedIds = new Set(panelIds);
		for (let index = 0; index < panels.length; index += 1) {
			const panel = panels[index];
			const panelId = this.panelIdFor(panels, index);
			if (!panel?.defaultCollapsed || this.defaultCollapsedPanelIds.has(panelId)) continue;
			this.defaultCollapsedPanelIds.add(panelId);
			if (panel.collapsible) requestedIds.add(panelId);
		}
		return getAllowedCollapsedPanelIds(panels, [...requestedIds], this.panelIdFor);
	}

	private setCollapsedPanelIds(panelIds: string[]) {
		const nextPanelIds = getAllowedCollapsedPanelIds(this.layoutPanels, panelIds, this.panelIdFor);
		if (areStringArraysEqual(nextPanelIds, this.collapsedPanels)) return;

		this.collapsedPanels = nextPanelIds;
		this.onCollapsedPanelsChange?.([...nextPanelIds]);
	}

	private canUsePairSizes(
		handleIndex: number,
		sizeA: number,
		sizeB: number,
		collapsedIndex: number | null
	) {
		return (
			this.canUsePanelSize(handleIndex, sizeA, collapsedIndex === handleIndex) &&
			this.canUsePanelSize(handleIndex + 1, sizeB, collapsedIndex === handleIndex + 1)
		);
	}

	private canUsePanelSize(index: number, size: number, collapsed: boolean) {
		const panel = this.layoutPanels[index];
		const min = collapsed ? getCollapsedSize(panel) : getPanelMin(panel);
		const max = collapsed ? getCollapsedSize(panel) : getPanelMax(panel);
		return size >= min - SIZE_EPSILON && size <= max + SIZE_EPSILON;
	}

	private panelIdFor = (panels: ResizableLayoutPanel[], index: number) => {
		return panels[index]?.id ?? `${this.id}-panel-${index + 1}`;
	};

	private getLayoutPanels(panels: ResizablePanelItem[]): ResizableLayoutPanel[] {
		const axisSize = this.getLayoutAxisSize();
		return panels.map((panel) => ({
			...panel,
			collapsedSize: getSizeValuePercent(panel.collapsedSize, axisSize, 'collapsedSize')
		}));
	}

	private getDefaultLayoutSizes() {
		const panels = this.layoutPanels;
		return getNormalizedSizes(getInitialSizes(panels), panels, [], this.panelIdFor);
	}

	private loadStoredLayout(storageKey?: string) {
		if (!storageKey) return;

		const storedLayout = readResizableStoredLayout(storageKey);
		const panelIds = this.layoutPanels.map((_, index) => this.panelId(index));
		if (!storedLayout || !areStringArraysEqual(storedLayout.panelIds, panelIds)) return;

		this.sizes = storedLayout.sizes;
		this.collapsedPanels = getAllowedCollapsedPanelIds(
			this.layoutPanels,
			storedLayout.collapsedPanels,
			this.panelIdFor
		);
		this.syncLayout();
	}

	private writeStoredLayout() {
		const storageKey = this.storageKey;
		if (!storageKey) return;

		writeResizableStoredLayout(storageKey, {
			panelIds: this.layoutPanels.map((_, index) => this.panelId(index)),
			sizes: [...this.layoutSizes],
			collapsedPanels: [...this.collapsedPanels]
		});
	}

	private getKeyboardStep() {
		return isFiniteNumber(this.keyboardStep) && this.keyboardStep > 0
			? this.keyboardStep
			: DEFAULT_KEYBOARD_STEP;
	}

	private getHandleAxisSize() {
		if (!this.groupNode) return 0;

		let size = 0;
		for (const child of this.groupNode.children) {
			if (!(child instanceof HTMLElement) || child.dataset.slot !== 'resizable-handle') {
				continue;
			}
			const rect = child.getBoundingClientRect();
			size += this.orientation === 'horizontal' ? rect.width : rect.height;
		}
		return size;
	}

	private getLayoutAxisSize() {
		if (!this.groupNode) return this.groupSize;

		const rect = this.groupNode.getBoundingClientRect();
		const axisSize = this.orientation === 'horizontal' ? rect.width : rect.height;
		return Math.max(0, axisSize - this.getHandleAxisSize());
	}
}
