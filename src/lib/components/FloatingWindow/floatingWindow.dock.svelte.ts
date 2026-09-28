import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import type { FloatingWindowState } from './floatingWindow.state.svelte.js';
import type { FloatingWindowDockPlacement } from './floatingWindow.props.js';

const DOCK_ITEM_WIDTH = 176;
const DOCK_ITEM_HEIGHT = 36;
const DOCK_GAP = 8;
const DOCK_INLINE_GAP = 8;
const DOCK_DRAG_ACTIVATION = Object.freeze({
	distancePx: 4,
	touchDelayMs: 300,
	touchTolerancePx: 8
});

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export class FloatingWindowDockState {
	index = $state(0);
	private mainPositionOverride = $state<number | null>(null);
	private startMainPosition = 0;
	private suppressClick = false;
	private observedPlacement: FloatingWindowDockPlacement;

	constructor(private readonly windowState: FloatingWindowState) {
		this.observedPlacement = windowState.dockPlacement;
		$effect(() => {
			const placement = windowState.dockPlacement;
			if (placement === this.observedPlacement) return;
			untrack(() => {
				this.observedPlacement = placement;
				this.mainPositionOverride = null;
				windowState.theme.floatingWindows.updateDock(windowState.id, placement);
			});
		});
	}

	get width() {
		return this.orientation === 'horizontal'
			? Math.max(0, Math.min(DOCK_ITEM_WIDTH, this.windowState.viewportWidth - DOCK_INLINE_GAP * 2))
			: DOCK_ITEM_HEIGHT;
	}

	get height() {
		return this.orientation === 'horizontal'
			? DOCK_ITEM_HEIGHT
			: Math.max(
					0,
					Math.min(DOCK_ITEM_WIDTH, this.windowState.viewportHeight - DOCK_INLINE_GAP * 2)
				);
	}

	get left() {
		if (this.orientation === 'horizontal') {
			return this.clampMainPosition(this.mainPositionOverride ?? this.getAutomaticMainPosition());
		}

		const crossIndex = Math.floor(this.index / this.slotsPerLine);
		return this.side === 'left'
			? crossIndex * (this.width + DOCK_GAP)
			: this.windowState.viewportWidth - this.width - crossIndex * (this.width + DOCK_GAP);
	}

	get top() {
		if (this.orientation === 'vertical') {
			return this.clampMainPosition(this.mainPositionOverride ?? this.getAutomaticMainPosition());
		}

		const crossIndex = Math.floor(this.index / this.slotsPerLine);
		return this.side === 'top'
			? crossIndex * (this.height + DOCK_GAP)
			: this.windowState.viewportHeight - this.height - crossIndex * (this.height + DOCK_GAP);
	}

	get orientation() {
		return this.side === 'top' || this.side === 'bottom' ? 'horizontal' : 'vertical';
	}

	get side() {
		return this.windowState.dockPlacement.split('-')[0] as 'top' | 'right' | 'bottom' | 'left';
	}

	get alignment() {
		return this.windowState.dockPlacement.split('-')[1] as 'top' | 'right' | 'bottom' | 'left';
	}

	attachment: Attachment<HTMLDivElement> = (node) => {
		this.windowState.dockNode = node;
		this.windowState.updateViewport();
		this.windowState.activateSurface('dock');
		const unregisterDock = this.windowState.theme.floatingWindows.registerDock({
			id: this.windowState.id,
			placement: this.windowState.dockPlacement,
			setIndex: (index) => (this.index = index)
		});
		const offPointerDown = on(node, 'pointerdown', () => this.windowState.activateSurface('dock'), {
			capture: true
		});
		const offResize = on(window, 'resize', () => {
			this.windowState.updateViewport();
			this.clampOverride();
		});
		queueMicrotask(() => {
			if (!node.isConnected || !this.windowState.open || !this.windowState.minimized) return;
			node.querySelector<HTMLButtonElement>('button')?.focus({
				preventScroll: true
			});
		});

		return () => {
			offPointerDown();
			offResize();
			unregisterDock();
			this.windowState.theme.floatingWindows.unregisterSurface(this.windowState.id, 'dock');
			if (this.windowState.dockNode === node) this.windowState.dockNode = null;
		};
	};

	drag = createPointerDrag({
		disabled: () => !this.windowState.draggable || !this.windowState.minimized,
		// The item is the title button's container, not a handle: a press that never travels must
		// keep the pointer on the button, or its click lands on the item and never restores.
		capture: 'on-activate',
		activation: () => DOCK_DRAG_ACTIVATION,
		onStart: (payload) => this.startMove(payload),
		onMove: (payload) => this.updateMove(payload),
		onEnd: (payload) => this.endMove(payload)
	});

	restore() {
		if (this.suppressClick) return;
		this.windowState.restore();
	}

	private get slotsPerLine() {
		const availableLength =
			this.orientation === 'horizontal'
				? this.windowState.viewportWidth
				: this.windowState.viewportHeight;
		const itemLength = this.orientation === 'horizontal' ? this.width : this.height;
		return Math.max(
			1,
			Math.floor((availableLength - DOCK_INLINE_GAP * 2 + DOCK_GAP) / (itemLength + DOCK_GAP))
		);
	}

	private startMove(payload: PointerDragPayload) {
		if (
			payload.startTarget instanceof Element &&
			payload.startTarget.closest('[data-floating-window-dock-actions]')
		) {
			return false;
		}
		this.windowState.activateSurface('dock');
		this.startMainPosition = this.orientation === 'horizontal' ? this.left : this.top;
		this.windowState.isDragging = true;
		return true;
	}

	private updateMove(payload: PointerDragPayload) {
		if (!this.windowState.isDragging || !payload.hasMoved) return;
		const delta = this.orientation === 'horizontal' ? payload.deltaX : payload.deltaY;
		this.mainPositionOverride = this.clampMainPosition(this.startMainPosition + delta);
	}

	private endMove(payload: PointerDragPayload) {
		if (!this.windowState.isDragging) return;
		this.windowState.isDragging = false;
		if (!payload.hasMoved || this.mainPositionOverride === null) return;

		this.windowState.theme.floatingWindows.reorderDock(this.windowState.id, this.getDropIndex());
		this.mainPositionOverride = null;
		this.suppressClick = true;
		window.setTimeout(() => (this.suppressClick = false));
	}

	private getDropIndex() {
		const itemLength = this.orientation === 'horizontal' ? this.width : this.height;
		const viewportLength =
			this.orientation === 'horizontal'
				? this.windowState.viewportWidth
				: this.windowState.viewportHeight;
		const position = this.mainPositionOverride ?? this.getAutomaticMainPosition();
		const isStartAligned = this.alignment === 'left' || this.alignment === 'top';
		const distance = isStartAligned
			? position - DOCK_INLINE_GAP
			: viewportLength - DOCK_INLINE_GAP - itemLength - position;
		const mainIndex = clamp(
			Math.round(distance / (itemLength + DOCK_GAP)),
			0,
			this.slotsPerLine - 1
		);
		const lineIndex = Math.floor(this.index / this.slotsPerLine);
		const count = this.windowState.theme.floatingWindows.getDockCount(
			this.windowState.dockPlacement
		);
		return clamp(lineIndex * this.slotsPerLine + mainIndex, 0, Math.max(0, count - 1));
	}

	private getAutomaticMainPosition() {
		const mainIndex = this.index % this.slotsPerLine;
		const itemLength = this.orientation === 'horizontal' ? this.width : this.height;
		const viewportLength =
			this.orientation === 'horizontal'
				? this.windowState.viewportWidth
				: this.windowState.viewportHeight;
		const isStartAligned = this.alignment === 'left' || this.alignment === 'top';

		return isStartAligned
			? DOCK_INLINE_GAP + mainIndex * (itemLength + DOCK_GAP)
			: viewportLength - DOCK_INLINE_GAP - itemLength - mainIndex * (itemLength + DOCK_GAP);
	}

	private clampOverride() {
		if (this.mainPositionOverride === null) return;
		this.mainPositionOverride = this.clampMainPosition(this.mainPositionOverride);
	}

	private clampMainPosition(position: number) {
		const viewportLength =
			this.orientation === 'horizontal'
				? this.windowState.viewportWidth
				: this.windowState.viewportHeight;
		const itemLength = this.orientation === 'horizontal' ? this.width : this.height;
		return Math.round(
			clamp(
				position,
				DOCK_INLINE_GAP,
				Math.max(DOCK_INLINE_GAP, viewportLength - itemLength - DOCK_INLINE_GAP)
			)
		);
	}
}
