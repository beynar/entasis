import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createPointerDrag } from '$lib/utils/pointerDrag.js';
import { rubberBand } from '$lib/utils/rubberBand.js';
import { withOptions } from '$lib/utils/state.svelte.js';
import type {
	SidebarCollapsible,
	SidebarDisplayState,
	SidebarResizable,
	SidebarResizableOptions,
	SidebarSide
} from './sidebar.props.js';
import {
	readSidebarStoredWidth,
	SIDEBAR_DEFAULT_MAX_WIDTH,
	SIDEBAR_DEFAULT_MIN_WIDTH,
	writeSidebarStoredWidth
} from './sidebar.resize.persistence.js';

type SidebarResizeStateOptions = {
	width: string;
	resizable?: SidebarResizable;
	side: SidebarSide;
	displayState: SidebarDisplayState;
	edgeRevealed: boolean;
	collapsible: SidebarCollapsible;
	setWidth: (width: string) => void;
	setDisplayState: (state: SidebarDisplayState) => void;
};

const DEFAULT_KEYBOARD_STEP = 16;
const DEFAULT_COLLAPSE_DRAG_RATIO = 0.75;
/** The furthest the panel follows a drag past `minWidth` or `maxWidth`, in px. */
const OVERDRAG_EXTENT = 48;
/** How long the spring back after an overdrag runs: the panel's `duration-normal`. */
const SETTLE_DURATION = 220;
/** How much of an overdrag the panel's content follows. */
const CONTENT_FOLLOW = 0.4;

export class SidebarResizeState extends withOptions<SidebarResizeStateOptions>() {
	panelNode = $state<HTMLElement | null>(null);
	isDragging = $state(false);
	isKeyboardResizing = $state(false);
	isStateTransitioning = $state(false);
	isWidthInitializing = $state(false);
	isEdgeRevealSuppressed = $state(false);
	/**
	 * How far a drag pulls the expanded panel past its bounds, in px: positive past `maxWidth`,
	 * negative below `minWidth`. It resists more the further it goes and springs back on release;
	 * the width itself (and what `onWidthChange` reports and storage keeps) stays within bounds.
	 */
	overdrag = $state(0);
	/** Set while the panel springs back from an overdrag, so it eases out rather than linearly. */
	isSettling = $state(false);
	/**
	 * `--sidebar-width` while a resize runs: the width it started from. Every element inside the
	 * wrapper, the page included, inherits the variable; changed on each pointer move, it made
	 * WebKit restyle all of them per step and keep each restyle in its style cache. The spacer and
	 * the container take the live width as their own `width` instead (`liveWidth`).
	 */
	private resizeStartWidth = $state<string | null>(null);
	private startWidth = 0;
	private didDrag = false;
	private suppressNextClick = false;
	private initialStorageKey: string | null = null;
	private initialStoredWidth: number | null = null;
	private keyboardResizeTimeout: ReturnType<typeof setTimeout> | null = null;
	private stateTransitionTimeout: ReturnType<typeof setTimeout> | null = null;
	private settleTimeout: ReturnType<typeof setTimeout> | null = null;
	private isRestoringWidth = false;
	private loadedStorageKeys: string[] = [];

	constructor(options: SidebarResizeStateOptions) {
		super(options);
		this.initialStorageKey = this.resizeOptions?.storageKey ?? null;
		if (this.initialStorageKey) {
			this.initialStoredWidth = readSidebarStoredWidth(this.initialStorageKey);
			this.isWidthInitializing = this.initialStoredWidth !== null;
		}

		$effect(() => {
			const storageKey = this.resizeOptions?.storageKey;
			const panelNode = this.panelNode;
			const configured = this.configured;
			untrack(() => {
				if (!configured || !panelNode || !storageKey) return;
				this.loadStoredWidth(storageKey);
			});
		});
	}

	get configured() {
		return !!this.resizable;
	}

	get enabled() {
		if (!this.configured) return false;
		if (this.displayState === 'expanded') return true;
		if (this.displayState === 'collapsed') return true;
		return this.displayState === 'hidden' && this.edgeRevealed;
	}

	get isResizing() {
		return this.isDragging || this.isKeyboardResizing;
	}

	get shouldSuppressTransitions() {
		return this.isResizing && !this.isStateTransitioning;
	}

	get currentWidth() {
		return Math.round(this.getCurrentWidth());
	}

	get renderWidth() {
		if (this.resizeStartWidth !== null) return this.resizeStartWidth;
		return this.restingWidth;
	}

	/** The width the expanded panel follows while a resize runs, set on the spacer and container. */
	get liveWidth() {
		if (this.resizeStartWidth === null || this.displayState !== 'expanded') return undefined;
		if (this.overdrag === 0) return this.width;
		const offset = Math.round(this.overdrag);
		return `calc(${this.width} ${offset < 0 ? '-' : '+'} ${Math.abs(offset)}px)`;
	}

	private get restingWidth() {
		if (!this.isWidthInitializing || this.initialStoredWidth === null) return this.width;
		return `${Math.round(this.initialStoredWidth)}px`;
	}

	get displayWidth() {
		if (this.displayState !== 'collapsed') return this.currentWidth;
		if (!this.panelNode || typeof window === 'undefined') return this.currentWidth;

		const iconWidth = window
			.getComputedStyle(this.panelNode)
			.getPropertyValue('--sidebar-width-icon')
			.trim();
		if (!iconWidth) return this.currentWidth;
		return Math.round(resolveLengthToPixels(iconWidth, this.panelNode, 'widthIcon'));
	}

	get displayMinWidth() {
		return this.displayState === 'collapsed' ? this.displayWidth : this.minWidth;
	}

	get minWidth() {
		return Math.round(this.getBounds().min);
	}

	get maxWidth() {
		return Math.round(this.getBounds().max);
	}

	handleKeydown(event: KeyboardEvent) {
		if (!this.enabled) return;

		const step = this.keyboardStep;
		const rightDelta = this.side === 'left' ? step : -step;
		const leftDelta = this.side === 'left' ? -step : step;
		const expandKey = this.side === 'left' ? 'ArrowRight' : 'ArrowLeft';
		let nextWidth: number | null = null;

		if (this.displayState === 'collapsed' && event.key === expandKey) {
			event.preventDefault();
			this.markKeyboardResizing();
			this.expandFromCollapsed(this.minWidth, true);
			return;
		}

		if (event.key === 'ArrowRight') {
			nextWidth = this.getCurrentWidth() + rightDelta;
		} else if (event.key === 'ArrowLeft') {
			nextWidth = this.getCurrentWidth() + leftDelta;
		} else if (event.key === 'Home') {
			nextWidth = this.getBounds().min;
		} else if (event.key === 'End') {
			nextWidth = this.getBounds().max;
		}

		if (nextWidth === null) return;
		event.preventDefault();
		this.markKeyboardResizing();
		this.resizeToRequestedWidth(nextWidth, true);
	}

	/**
	 * Pointer drag for the resize handle. `createPointerDrag` owns pointer capture, so a drag
	 * survives the pointer leaving the document, and releases it on end/cancel/lost capture.
	 * Width only starts tracking after the 3px `didDrag` threshold (see `updateDrag`), which is
	 * what separates a resize from a click on a combined rail handle.
	 */
	handleAttachment: Attachment<HTMLElement> = createPointerDrag({
		disabled: () => !this.enabled,
		onStart: ({ node }) => {
			const panelNode = this.resolvePanelNode(node);
			if (!panelNode) return false;

			node.focus();
			this.resizeStartWidth ??= this.restingWidth;
			this.startWidth = panelNode.getBoundingClientRect().width;
			this.didDrag = false;
			this.suppressNextClick = false;
			this.isDragging = true;
		},
		onMove: ({ deltaX }) => this.updateDrag(deltaX),
		onEnd: ({ node }) => this.endDrag(node)
	});

	/**
	 * On the panel: its direct children (header, rows, footer) follow part of an overdrag, so the
	 * content gives with the stretching edge instead of sitting still, and springs back with it.
	 * Written on those few elements rather than through an inherited variable, which every row
	 * inside would restyle for on each pointer move.
	 */
	contentAttachment: Attachment<HTMLElement> = (panel) => {
		$effect(() => {
			const shift = this.overdrag * CONTENT_FOLLOW * (this.side === 'left' ? 1 : -1);
			const transition = this.isDragging
				? 'none'
				: this.isSettling
					? 'translate var(--duration-normal) var(--ease-enter)'
					: '';
			for (const child of panel.children) {
				if (!(child instanceof HTMLElement)) continue;
				child.style.translate = shift ? `${shift.toFixed(1)}px 0` : '';
				child.style.transition = transition;
			}
		});
	};

	private resolvePanelNode(handleNode: HTMLElement) {
		if (this.panelNode) return this.panelNode;

		const panelNode = handleNode
			.closest('[data-slot="sidebar"]')
			?.querySelector<HTMLElement>('[data-slot="sidebar-container"]');
		this.panelNode = panelNode ?? null;
		return this.panelNode;
	}

	private updateDrag(deltaX: number) {
		if (!this.isDragging) return;
		if (!this.didDrag && Math.abs(deltaX) < 3) return;

		this.didDrag = true;
		const delta = this.side === 'left' ? deltaX : -deltaX;
		const requestedWidth = this.startWidth + delta;
		this.resizeToRequestedWidth(requestedWidth, false);
		this.overdrag = this.overdragFor(requestedWidth);
	}

	/** How far past its bounds the expanded panel follows a drag that asks for `requestedWidth`. */
	private overdragFor(requestedWidth: number) {
		if (this.displayState !== 'expanded') return 0;
		const { min, max } = this.getBounds();
		if (requestedWidth > max) return rubberBand(requestedWidth - max, OVERDRAG_EXTENT);
		if (requestedWidth < min) return -rubberBand(min - requestedWidth, OVERDRAG_EXTENT);
		return 0;
	}

	private endDrag(node: HTMLElement) {
		if (!this.isDragging) return;

		this.isDragging = false;
		if (this.overdrag !== 0) this.settle();
		if (!this.isKeyboardResizing) this.resizeStartWidth = null;
		this.suppressNextClick = this.didDrag;
		if (this.didDrag) this.commitWidth();
		if (document.activeElement === node) node.blur();
	}

	consumeClickAfterResize() {
		const shouldHandleClick = !this.suppressNextClick;
		this.suppressNextClick = false;
		return shouldHandleClick;
	}

	releaseEdgeRevealSuppression() {
		this.isEdgeRevealSuppressed = false;
	}

	private setWidthPixels(width: number, commit: boolean) {
		const bounds = this.getBounds();
		const nextWidth = clamp(width, bounds.min, bounds.max);
		const widthValue = `${Math.round(nextWidth)}px`;
		if (widthValue === this.width) return;

		this.setWidth(widthValue);
		this.resizeOptions?.onWidthChange?.({
			width: widthValue,
			isUserInteraction: !this.isRestoringWidth
		});
		if (commit) {
			this.commitWidth();
		}
	}

	private resizeToRequestedWidth(requestedWidth: number, commit: boolean) {
		if (this.displayState === 'collapsed') {
			if (requestedWidth >= this.collapseThreshold) {
				this.expandFromCollapsed(requestedWidth, commit);
			}
			return;
		}

		if (this.displayState === 'expanded' && this.shouldCollapse(requestedWidth)) {
			const collapsedState = this.collapsedState;
			if (this.isDragging && collapsedState === 'hidden') {
				this.isEdgeRevealSuppressed = true;
			}
			this.startStateTransition();
			this.setDisplayState(collapsedState);
			this.commitWidth();
			return;
		}

		this.setWidthPixels(requestedWidth, commit);
	}

	private expandFromCollapsed(requestedWidth: number, commit: boolean) {
		this.startStateTransition();
		this.setDisplayState('expanded');
		this.setWidthPixels(Math.max(requestedWidth, this.minWidth), commit);
	}

	private shouldCollapse(requestedWidth: number) {
		return this.collapsible !== 'none' && requestedWidth < this.collapseThreshold;
	}

	private get collapsedState(): SidebarDisplayState {
		return this.collapsible === 'icon' ? 'collapsed' : 'hidden';
	}

	private commitWidth() {
		this.writeStoredWidth();
	}

	private getCurrentWidth() {
		return resolveLengthToPixels(this.width, this.panelNode, 'width');
	}

	private markKeyboardResizing() {
		this.resizeStartWidth ??= this.restingWidth;
		this.isKeyboardResizing = true;
		if (this.keyboardResizeTimeout) {
			clearTimeout(this.keyboardResizeTimeout);
		}
		this.keyboardResizeTimeout = setTimeout(() => {
			this.isKeyboardResizing = false;
			this.keyboardResizeTimeout = null;
			if (!this.isDragging) this.resizeStartWidth = null;
		}, 120);
	}

	private settle() {
		this.overdrag = 0;
		this.isSettling = true;
		if (this.settleTimeout) clearTimeout(this.settleTimeout);
		this.settleTimeout = setTimeout(() => {
			this.isSettling = false;
			this.settleTimeout = null;
		}, SETTLE_DURATION);
	}

	private startStateTransition() {
		this.isStateTransitioning = true;
		if (this.stateTransitionTimeout) {
			clearTimeout(this.stateTransitionTimeout);
		}
		this.stateTransitionTimeout = setTimeout(() => {
			this.isStateTransitioning = false;
			this.stateTransitionTimeout = null;
		}, 220);
	}

	private getBounds() {
		const min = resolveLengthToPixels(
			this.resizeOptions?.minWidth ?? SIDEBAR_DEFAULT_MIN_WIDTH,
			this.panelNode,
			'minWidth'
		);
		const max = resolveLengthToPixels(
			this.resizeOptions?.maxWidth ?? SIDEBAR_DEFAULT_MAX_WIDTH,
			this.panelNode,
			'maxWidth'
		);

		if (max < min) {
			throw new Error(`Sidebar resizable maxWidth ${max}px is lower than minWidth ${min}px.`);
		}

		return { min, max };
	}

	private get keyboardStep() {
		const step = this.resizeOptions?.keyboardStep;
		return isFinitePositiveNumber(step) ? step : DEFAULT_KEYBOARD_STEP;
	}

	private get collapseThreshold() {
		const configuredThreshold = this.resizeOptions?.collapseThreshold;
		if (configuredThreshold !== undefined) {
			return Math.round(
				resolveLengthToPixels(configuredThreshold, this.panelNode, 'collapseThreshold')
			);
		}

		return Math.max(1, Math.round(this.minWidth * (1 - DEFAULT_COLLAPSE_DRAG_RATIO)));
	}

	private get resizeOptions(): SidebarResizableOptions | undefined {
		return typeof this.resizable === 'object' ? this.resizable : undefined;
	}

	private loadStoredWidth(storageKey: string) {
		if (this.loadedStorageKeys.includes(storageKey)) return;
		this.loadedStorageKeys.push(storageKey);

		try {
			const storedWidth =
				storageKey === this.initialStorageKey
					? this.initialStoredWidth
					: readSidebarStoredWidth(storageKey);
			if (!storedWidth) return;
			this.isRestoringWidth = true;
			this.setWidthPixels(storedWidth, false);
			this.commitWidth();
		} finally {
			this.isRestoringWidth = false;
			this.releaseWidthPrehydrationLock();
		}
	}

	private releaseWidthPrehydrationLock() {
		const root = this.panelNode?.closest<HTMLElement>('[data-slot="sidebar-wrapper"]');
		if (!this.isWidthInitializing && !root?.dataset.widthPrehydrating) return;

		requestAnimationFrame(() => {
			this.isWidthInitializing = false;
			root?.removeAttribute('data-width-prehydrating');
		});
	}

	private writeStoredWidth() {
		const storageKey = this.resizeOptions?.storageKey;
		if (!storageKey) return;
		writeSidebarStoredWidth(storageKey, this.getCurrentWidth());
	}
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const isFinitePositiveNumber = (value: unknown): value is number =>
	typeof value === 'number' && Number.isFinite(value) && value > 0;

const resolveLengthToPixels = (
	value: string | number,
	contextNode: HTMLElement | null,
	propertyName: string
) => {
	if (isFinitePositiveNumber(value)) return value;
	if (typeof value !== 'string') {
		throw new Error(`Sidebar resizable ${propertyName} must be a positive number or CSS length.`);
	}

	const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*(px|rem|em|%)$/);
	if (!match) {
		throw new Error(
			`Sidebar resizable ${propertyName} must use px, rem, em, or %; received "${value}".`
		);
	}

	const amount = Number(match[1]);
	if (!Number.isFinite(amount) || amount <= 0) {
		throw new Error(`Sidebar resizable ${propertyName} must be positive; received "${value}".`);
	}

	const unit = match[2];
	if (unit === 'px') return amount;
	if (unit === 'rem') return amount * getRootFontSize();
	if (unit === 'em') return amount * getContextFontSize(contextNode);

	const containerWidth =
		contextNode?.parentElement?.getBoundingClientRect().width ||
		contextNode?.getBoundingClientRect().width ||
		0;
	return (containerWidth * amount) / 100;
};

const getRootFontSize = () => {
	if (typeof window === 'undefined') return 16;
	return Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16;
};

const getContextFontSize = (contextNode: HTMLElement | null) => {
	if (!contextNode || typeof window === 'undefined') return getRootFontSize();
	return Number.parseFloat(window.getComputedStyle(contextNode).fontSize) || getRootFontSize();
};
