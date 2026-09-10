import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { on } from 'svelte/events';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import { bind } from '$lib/utils/state.svelte.js';
import { useTheme } from '../Theme/theme.state.svelte.js';
import type { FloatingWindowSurface } from '../Theme/theme.floatingWindows.js';
import { FloatingWindowDockState } from './floatingWindow.dock.svelte.js';
import { FLOATING_WINDOW_VIEWPORT_GAP, FloatingWindowGeometry } from './floatingWindow.geometry.js';
import type {
	FloatingWindowDimensions,
	FloatingWindowDockPlacement,
	FloatingWindowDragFrom,
	FloatingWindowPayload,
	FloatingWindowPosition,
	FloatingWindowResizeDirection
} from './floatingWindow.props.js';

type FloatingWindowStateOptions = {
	id: string;
	open: boolean;
	minimized: boolean;
	dockPlacement: FloatingWindowDockPlacement;
	dragFrom: FloatingWindowDragFrom;
	draggable: boolean;
	resizable: boolean;
	minimizable: boolean;
	closable: boolean;
	closeOnEscape: boolean;
	position?: FloatingWindowPosition;
	dimensions: FloatingWindowDimensions;
	onOpenChange?: (open: boolean) => void;
	onMinimize?: (window: FloatingWindowPayload) => void;
	onRestore?: (window: FloatingWindowPayload) => void;
	onMove?: (payload: { position: FloatingWindowPosition; window: FloatingWindowPayload }) => void;
	onResize?: (payload: {
		dimensions: FloatingWindowDimensions;
		window: FloatingWindowPayload;
	}) => void;
};

export interface FloatingWindowState extends FloatingWindowStateOptions {}

const KEYBOARD_STEP = 10;

const samePosition = (
	a: FloatingWindowPosition | undefined,
	b: FloatingWindowPosition | undefined
) => a?.x === b?.x && a?.y === b?.y;

const sameDimensions = (a: FloatingWindowDimensions, b: FloatingWindowDimensions) =>
	a.width === b.width && a.height === b.height;

const isInteractiveTarget = (target: EventTarget | null) =>
	target instanceof Element &&
	!!target.closest(
		'button, a, input, select, textarea, [contenteditable="true"], [data-floating-window-no-drag], [data-floating-window-resize-handle]'
	);

export class FloatingWindowState {
	readonly theme = useTheme();
	rootNode = $state<HTMLDivElement | null>(null);
	dockNode = $state<HTMLDivElement | null>(null);
	zIndex = $state(1001);
	isDragging = $state(false);
	isResizing = $state(false);
	viewportWidth = $state(0);
	viewportHeight = $state(0);

	private geometry: FloatingWindowGeometry;
	private docking: FloatingWindowDockState;
	private observedOpen: boolean;
	private returnFocusElement: HTMLElement | null = null;
	private moveStartPosition: FloatingWindowPosition = { x: 0, y: 0 };
	private resizeStartPosition: FloatingWindowPosition = { x: 0, y: 0 };
	private resizeStartDimensions: FloatingWindowDimensions = { width: 0, height: 0 };
	private activeResizeDirection: FloatingWindowResizeDirection | null = null;
	private resizeAttachments = new Map<FloatingWindowResizeDirection, Attachment<HTMLElement>>();

	constructor(options: FloatingWindowStateOptions) {
		bind(this, options);
		this.geometry = new FloatingWindowGeometry(this);
		this.docking = new FloatingWindowDockState(this);
		this.observedOpen = this.open;

		if (typeof window !== 'undefined') {
			if (this.open) this.captureReturnFocus();
			this.updateViewport();
			this.geometry.sync(this.dimensions, this.position);
		}

		$effect(() => {
			const rootNode = this.rootNode;
			const dimensions = this.dimensions;
			const position = this.position;
			const open = this.open;
			const minimized = this.minimized;
			if (!rootNode || !open || minimized) return;
			untrack(() => this.geometry.sync(dimensions, position));
		});

		$effect(() => {
			const open = this.open;
			if (open === this.observedOpen) return;
			untrack(() => {
				this.observedOpen = open;
				if (open) this.captureReturnFocus();
				else this.restoreFocus();
			});
		});
	}

	get payload(): FloatingWindowPayload {
		return {
			id: this.id,
			isOpen: this.open,
			isMinimized: this.minimized,
			isDragging: this.isDragging,
			isResizing: this.isResizing,
			dockPlacement: this.dockPlacement,
			position: this.position,
			dimensions: this.dimensions,
			close: () => this.close(),
			minimize: () => this.minimize(),
			restore: () => this.restore(),
			bringToFront: () => this.bringToFront()
		};
	}

	get dockIndex() {
		return this.docking.index;
	}

	get dockWidth() {
		return this.docking.width;
	}

	get dockHeight() {
		return this.docking.height;
	}

	get dockLeft() {
		return this.docking.left;
	}

	get dockTop() {
		return this.docking.top;
	}

	get dockOrientation() {
		return this.docking.orientation;
	}

	get dockSide() {
		return this.docking.side;
	}

	root: Attachment<HTMLDivElement> = (node) => {
		this.rootNode = node;
		this.updateViewport();
		this.geometry.sync(this.dimensions, this.position);
		this.activateSurface('window');
		const offPointerDown = on(node, 'pointerdown', () => this.activateSurface('window'), {
			capture: true
		});
		const offResize = on(window, 'resize', () => {
			this.updateViewport();
			this.geometry.sync(this.dimensions, this.position);
		});
		const offKeydown = on(window, 'keydown', (event) => {
			if (event.key !== 'Escape') return;
			queueMicrotask(() => this.handleEscape(event));
		});
		queueMicrotask(() => {
			if (
				!node.isConnected ||
				!this.open ||
				this.minimized ||
				node.contains(document.activeElement)
			) {
				return;
			}
			node.focus({ preventScroll: true });
		});

		return () => {
			offPointerDown();
			offResize();
			offKeydown();
			this.theme.floatingWindows.unregisterSurface(this.id, 'window');
			if (this.rootNode === node) this.rootNode = null;
		};
	};

	dock = (node: HTMLDivElement) => this.docking.attachment(node);
	dockDrag = (node: HTMLElement) => this.docking.drag(node);

	headerDrag = createPointerDrag({
		disabled: () => !this.draggable || this.minimized || this.dragFrom !== 'header',
		onStart: (payload) => this.startMove(payload),
		onMove: (payload) => this.updateMove(payload),
		onEnd: () => this.endMove()
	});

	windowDrag = createPointerDrag({
		disabled: () => !this.draggable || this.minimized || this.dragFrom !== 'window',
		onStart: (payload) => this.startMove(payload),
		onMove: (payload) => this.updateMove(payload),
		onEnd: () => this.endMove()
	});

	resize(direction: FloatingWindowResizeDirection) {
		const cached = this.resizeAttachments.get(direction);
		if (cached) return cached;
		const attachment = createPointerDrag({
			disabled: () => !this.resizable || this.minimized,
			onStart: (payload) => this.startResize(payload, direction),
			onMove: (payload) => this.updateResize(payload, direction),
			onEnd: () => this.endResize()
		});
		this.resizeAttachments.set(direction, attachment);
		return attachment;
	}

	activateSurface(type: FloatingWindowSurface) {
		this.zIndex = this.theme.floatingWindows.activate(this.id, type);
	}

	bringToFront() {
		this.activateSurface(this.minimized ? 'dock' : 'window');
	}

	close() {
		if (!this.closable) return;
		this.minimized = false;
		this.setOpen(false);
	}

	minimize() {
		if (!this.minimizable || this.minimized) return;
		this.minimized = true;
		this.onMinimize?.(this.payload);
	}

	restore() {
		if (!this.minimized) return;
		this.minimized = false;
		this.onRestore?.(this.payload);
	}

	restoreFromDock() {
		this.docking.restore();
	}

	handleWindowKeydown(event: KeyboardEvent) {
		if (!this.draggable || !event.altKey || event.ctrlKey || event.metaKey || !this.position)
			return;
		const step = event.shiftKey ? KEYBOARD_STEP * 5 : KEYBOARD_STEP;
		let deltaX = 0;
		let deltaY = 0;

		if (event.key === 'ArrowLeft') deltaX = -step;
		else if (event.key === 'ArrowRight') deltaX = step;
		else if (event.key === 'ArrowUp') deltaY = -step;
		else if (event.key === 'ArrowDown') deltaY = step;
		else return;

		event.preventDefault();
		const previousPosition = this.position;
		this.geometry.move({ x: previousPosition.x + deltaX, y: previousPosition.y + deltaY });
		if (!samePosition(previousPosition, this.position) && this.position) {
			this.onMove?.({ position: this.position, window: this.payload });
		}
	}

	handleResizeKeydown(event: KeyboardEvent, direction: FloatingWindowResizeDirection) {
		if (!this.resizable || event.altKey || event.ctrlKey || event.metaKey) return;
		const isHorizontal = direction === 'east' || direction === 'west';
		const step = event.shiftKey ? KEYBOARD_STEP * 5 : KEYBOARD_STEP;
		let deltaX = 0;
		let deltaY = 0;

		if (isHorizontal && event.key === 'ArrowLeft') deltaX = -step;
		else if (isHorizontal && event.key === 'ArrowRight') deltaX = step;
		else if (!isHorizontal && event.key === 'ArrowUp') deltaY = -step;
		else if (!isHorizontal && event.key === 'ArrowDown') deltaY = step;
		else return;

		event.preventDefault();
		const previousDimensions = this.dimensions;
		const previousPosition = this.position;
		this.resizeStartPosition = this.position ?? {
			x: FLOATING_WINDOW_VIEWPORT_GAP,
			y: FLOATING_WINDOW_VIEWPORT_GAP
		};
		this.resizeStartDimensions = this.dimensions;
		this.geometry.resize(
			this.resizeStartPosition,
			this.resizeStartDimensions,
			direction,
			deltaX,
			deltaY
		);
		if (
			!sameDimensions(previousDimensions, this.dimensions) ||
			!samePosition(previousPosition, this.position)
		) {
			this.onResize?.({ dimensions: this.dimensions, window: this.payload });
		}
	}

	updateViewport() {
		this.viewportWidth = window.innerWidth;
		this.viewportHeight = window.innerHeight;
	}

	private handleEscape(event: KeyboardEvent) {
		if (
			event.defaultPrevented ||
			!this.open ||
			this.minimized ||
			!this.closeOnEscape ||
			!this.closable ||
			!this.theme.floatingWindows.isTopWindow(this.id)
		) {
			return;
		}
		this.close();
	}

	private startMove(payload: PointerDragPayload) {
		if (isInteractiveTarget(payload.event.target)) return false;
		this.activateSurface('window');
		this.moveStartPosition = this.position ?? {
			x: FLOATING_WINDOW_VIEWPORT_GAP,
			y: FLOATING_WINDOW_VIEWPORT_GAP
		};
		this.isDragging = true;
		return true;
	}

	private updateMove(payload: PointerDragPayload) {
		if (!this.isDragging) return;
		this.geometry.move({
			x: this.moveStartPosition.x + payload.deltaX,
			y: this.moveStartPosition.y + payload.deltaY
		});
	}

	private endMove() {
		if (!this.isDragging) return;
		this.isDragging = false;
		if (!samePosition(this.moveStartPosition, this.position) && this.position) {
			this.onMove?.({ position: this.position, window: this.payload });
		}
	}

	private startResize(_payload: PointerDragPayload, direction: FloatingWindowResizeDirection) {
		this.activateSurface('window');
		this.activeResizeDirection = direction;
		this.resizeStartPosition = this.position ?? {
			x: FLOATING_WINDOW_VIEWPORT_GAP,
			y: FLOATING_WINDOW_VIEWPORT_GAP
		};
		this.resizeStartDimensions = this.dimensions;
		this.isResizing = true;
		return true;
	}

	private updateResize(payload: PointerDragPayload, direction: FloatingWindowResizeDirection) {
		if (!this.isResizing || this.activeResizeDirection !== direction) return;
		this.geometry.resize(
			this.resizeStartPosition,
			this.resizeStartDimensions,
			direction,
			payload.deltaX,
			payload.deltaY
		);
	}

	private endResize() {
		if (!this.isResizing) return;
		this.isResizing = false;
		this.activeResizeDirection = null;
		if (!sameDimensions(this.resizeStartDimensions, this.dimensions)) {
			this.onResize?.({ dimensions: this.dimensions, window: this.payload });
		}
	}

	private setOpen(nextOpen: boolean) {
		if (this.open === nextOpen) return;
		this.open = nextOpen;
		this.onOpenChange?.(nextOpen);
	}

	private captureReturnFocus() {
		const activeElement = document.activeElement;
		this.returnFocusElement =
			activeElement instanceof HTMLElement && activeElement !== document.body
				? activeElement
				: null;
	}

	private restoreFocus() {
		const target = this.returnFocusElement;
		this.returnFocusElement = null;
		if (!target?.isConnected) return;
		const activeElement = document.activeElement;
		const shouldRestore =
			activeElement === document.body ||
			this.rootNode?.contains(activeElement) ||
			this.dockNode?.contains(activeElement);
		if (!shouldRestore) return;
		queueMicrotask(() => target.isConnected && target.focus({ preventScroll: true }));
	}
}
