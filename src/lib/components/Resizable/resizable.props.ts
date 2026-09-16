import type { Snippet } from 'svelte';
import type { WithAttachments } from '$lib/types/props.js';
import type { ResizableThemeProps } from './resizable.theme.js';

export type ResizableOrientation = 'horizontal' | 'vertical';
export type ResizableDirection = ResizableOrientation;
export type ResizableDir = 'ltr' | 'rtl';
export type ResizableVariant = 'default' | 'splitted';
export type ResizableHandleVariant = 'grip' | 'thumb';
export type ResizableSizeValue = number | `${number}%` | `${number}px`;
export type ResizableDisabledHandles =
	readonly number[] | ReadonlySet<number> | ((index: number) => boolean);

export type ResizablePanelPayload = {
	id: string;
	index: number;
	size: number;
	min: number;
	max: number;
	collapsed: boolean;
	disabled: boolean;
	dragging: boolean;
};

export type ResizablePanelItem = {
	/**
	 * Stable panel id. Used for data attributes and future persisted layouts.
	 */
	id?: string;
	/**
	 * Panel content.
	 */
	content: Snippet<[ResizablePanelPayload]>;
	/**
	 * Initial panel size in percent. Panels without a default size split the remainder.
	 */
	defaultSize?: number;
	/**
	 * Minimum panel size in percent. Defaults to 10.
	 */
	minSize?: number;
	/**
	 * Maximum panel size in percent. Defaults to 100.
	 */
	maxSize?: number;
	/**
	 * Allows this panel to collapse below its normal minimum size.
	 */
	collapsible?: boolean;
	/**
	 * Initial collapsed state. Applies once for collapsible panels.
	 */
	defaultCollapsed?: boolean;
	/**
	 * Size used while collapsed. Numbers are percentages; strings may use px or %. Defaults to 0.
	 */
	collapsedSize?: ResizableSizeValue;
	/**
	 * Drag threshold in percent at or below which this panel collapses. Defaults to 0.
	 */
	collapseBreakpoint?: number;
	/**
	 * Prevents this panel from being resized by adjacent handles.
	 */
	disabled?: boolean;
	/**
	 * Applied to the panel element.
	 */
	class?: string;
};

export type ResizableChangeMeta = {
	isUserInteraction: boolean;
};

/** Final layout and its interaction source reported by `onLayoutCommit`. */
export type ResizableLayoutCommitPayload = Readonly<{
	sizes: number[];
	isUserInteraction: boolean;
}>;

export type ResizableHandleAriaLabel = {
	index: number;
	size: number;
	min: number;
	max: number;
	orientation: ResizableOrientation;
	separatorOrientation: ResizableOrientation;
	collapsedBefore: boolean;
	collapsedAfter: boolean;
};

export type ResizableHandlePayload = {
	index: number;
	size: number;
	min: number;
	max: number;
	disabled: boolean;
	dragging: boolean;
	separatorOrientation: ResizableOrientation;
	collapsedBefore: boolean;
	collapsedAfter: boolean;
};

export type ResizableProps = WithAttachments<{
	/**
	 * Root id. Also prefixes generated fallback panel ids.
	 */
	id?: string;
	/**
	 * Bindable reference to the root panel group.
	 */
	ref?: HTMLElement | null;
	/**
	 * Panels rendered in order. A handle is inserted between each pair.
	 */
	panels: ResizablePanelItem[];
	/**
	 * Bindable layout sizes in percentages.
	 */
	sizes?: number[];
	/**
	 * Bindable list of collapsed panel ids.
	 */
	collapsedPanels?: string[];
	/**
	 * localStorage key used to persist sizes and collapsed panel ids.
	 * Use stable panel ids when enabling persistence.
	 */
	storageKey?: string;
	/**
	 * Resize orientation. Horizontal means panels sit left-to-right.
	 */
	orientation?: ResizableOrientation;
	/**
	 * Backward-compatible alias for orientation.
	 */
	direction?: ResizableDirection;
	/**
	 * Show a visible grip inside each handle.
	 */
	handle?: boolean;
	/**
	 * Visual style for the optional handle affordance.
	 */
	handleVariant?: ResizableHandleVariant;
	/**
	 * Show the visible separator line while keeping the resize rail active.
	 */
	showLines?: boolean;
	/**
	 * Visual style. `splitted` separates panels as softly raised surfaces.
	 */
	variant?: ResizableVariant;
	/**
	 * Text direction. Horizontal resize keys and pointer deltas are mirrored in rtl.
	 */
	dir?: ResizableDir;
	/**
	 * Disables all resize handles.
	 */
	disabled?: boolean;
	/**
	 * Disables specific resize handles by zero-based handle index.
	 */
	disabledHandles?: ResizableDisabledHandles;
	/**
	 * Keyboard resize increment in percentage points.
	 */
	keyboardStep?: number;
	/**
	 * Reset adjacent panels to their default sizes when a separator is double-clicked.
	 */
	resetOnDoubleClick?: boolean;
	/**
	 * Additional CSS classes applied to the root group.
	 */
	class?: string;
	/**
	 * Theme overrides for root, panel, handle, and grip parts.
	 */
	theme?: ResizableThemeProps;
	/**
	 * Fires after a drag ends or keyboard resize commits.
	 */
	onResize?: (sizes: number[]) => void;
	/**
	 * Fires while the layout changes.
	 */
	onLayoutChange?: (sizes: number[]) => void;
	/**
	 * Fires after the layout commits.
	 */
	onLayoutCommit?: (payload: ResizableLayoutCommitPayload) => void;
	/**
	 * Fires when collapsed panel ids change.
	 */
	onCollapsedPanelsChange?: (panelIds: string[]) => void;
	/**
	 * Returns an accessible label for a resize separator.
	 */
	getHandleAriaLabel?: (payload: ResizableHandleAriaLabel) => string;
}>;
