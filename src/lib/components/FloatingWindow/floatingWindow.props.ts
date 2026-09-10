import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { FloatingWindowThemeProps } from './floatingWindow.theme.js';

export type FloatingWindowDragFrom = 'header' | 'window';

export type FloatingWindowDockPlacement =
	| 'bottom-left'
	| 'bottom-right'
	| 'top-left'
	| 'top-right'
	| 'left-top'
	| 'left-bottom'
	| 'right-top'
	| 'right-bottom';

export type FloatingWindowPosition = {
	x: number;
	y: number;
};

export type FloatingWindowDimensionTuple = readonly [width: number, height: number];

export type FloatingWindowDimensions = {
	width: number;
	height: number;
	min?: FloatingWindowDimensionTuple;
	max?: FloatingWindowDimensionTuple;
};

export type FloatingWindowResizeDirection =
	'north' | 'northEast' | 'east' | 'southEast' | 'south' | 'southWest' | 'west' | 'northWest';

export type FloatingWindowPayload = {
	readonly id: string;
	readonly isOpen: boolean;
	readonly isMinimized: boolean;
	readonly isDragging: boolean;
	readonly isResizing: boolean;
	readonly dockPlacement: FloatingWindowDockPlacement;
	readonly position: FloatingWindowPosition | undefined;
	readonly dimensions: FloatingWindowDimensions;
	close: () => void;
	minimize: () => void;
	restore: () => void;
	bringToFront: () => void;
};

export type FloatingWindowMovePayload = {
	position: FloatingWindowPosition;
	window: FloatingWindowPayload;
};

export type FloatingWindowResizePayload = {
	dimensions: FloatingWindowDimensions;
	window: FloatingWindowPayload;
};

export type FloatingWindowProps = WithAttachments<{
	/** Stable DOM id. A generated id is used when omitted. */
	id?: string;
	/** Bindable reference to the visible window or minimized dock item. */
	ref?: HTMLDivElement | null;
	/** Controls whether the window is rendered. Bindable. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/** Collapses the window into its configured viewport-edge dock. Bindable. */
	minimized?: boolean;
	/** Viewport edge and alignment used by the minimized dock. */
	dockPlacement?: FloatingWindowDockPlacement;
	/** Window title. Accepts a string or a snippet receiving the window payload. */
	title: Slot<FloatingWindowPayload>;
	/** Main window content. */
	children?: Slot<FloatingWindowPayload>;
	/** Drag from only the header or any non-interactive part of the window. */
	dragFrom?: FloatingWindowDragFrom;
	/** Enables pointer dragging. */
	draggable?: boolean;
	/** Enables edge and corner resizing. */
	resizable?: boolean;
	/** Shows the minimize control. */
	minimizable?: boolean;
	/** Shows the close control. */
	closable?: boolean;
	/** Closes the topmost expanded floating window when Escape is pressed. */
	closeOnEscape?: boolean;
	/** Bindable viewport-relative top-left position in pixels. Defaults to centered. */
	position?: FloatingWindowPosition;
	/** Bindable width and height in pixels, with optional [width, height] constraint tuples. */
	dimensions?: FloatingWindowDimensions;
	/** Additional classes merged onto the visible window surface. */
	class?: string;
	/** Per-instance theme overrides. */
	theme?: FloatingWindowThemeProps;
	/** Called once when the library requests an open-state change. */
	onOpenChange?: (open: boolean) => void;
	/** Called after the open transition finishes. */
	onAfterOpen?: (window: FloatingWindowPayload) => void;
	/** Called after the close transition finishes. */
	onAfterClose?: (window: FloatingWindowPayload) => void;
	/** Called after the minimize command updates state. */
	onMinimize?: (window: FloatingWindowPayload) => void;
	/** Called after the restore command updates state. */
	onRestore?: (window: FloatingWindowPayload) => void;
	/** Called when a pointer or keyboard move commits. */
	onMove?: (payload: FloatingWindowMovePayload) => void;
	/** Called when a pointer or keyboard resize commits. */
	onResize?: (payload: FloatingWindowResizePayload) => void;
}>;
