import type { Snippet } from 'svelte';
import type { PopoverState } from './popover.state.svelte.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import { type Alignment, type Placement, type VirtualElement } from '@floating-ui/dom';
import type { WithAttachments } from '$lib/types/props.js';
import type { PopupPlacementSide } from '$lib/utils/stateAttributes.js';
import type { PopoverThemeProps } from './popover.theme.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { FocusOnClose } from '$lib/utils/useFocusScope.svelte.js';

/**
 * How an open popover was opened: `hover` (the pointer rested on the trigger), `press` (a click
 * or tap on the trigger), `keyboard` (Enter, Space or an arrow key on the trigger), or
 * `programmatic` (`open()` from code, the `open` prop, `defaultOpen`).
 */
export type PopoverOpenReason = 'hover' | 'press' | 'keyboard' | 'programmatic';

/**
 * A side named by reading direction: `inline-start` is the left side in a left-to-right document
 * and the right side in a right-to-left one; `inline-end` is the other.
 */
export type PopoverLogicalSide = 'inline-start' | 'inline-end';

/**
 * Where the panel goes relative to its reference: a floating-ui placement (`bottom-start`), or a
 * logical side with an optional alignment (`inline-end`, `inline-end-start`). The `start` / `end`
 * alignment of `top` and `bottom` already follows the reading direction.
 */
export type PopoverPlacement =
	Placement | PopoverLogicalSide | `${PopoverLogicalSide}-${Alignment}`;

/**
 * The side a placed panel sits on, written as `data-side` on the panel and `data-popup-side` on
 * its trigger: the physical side, the logical one when a logical side was requested, or `none`
 * when `positionPanel` placed the panel.
 */
export type PopoverSide = PopupPlacementSide;

/** The viewport `shift` keeps a floating panel inside; see `collisionBoundary`. */
export type PopoverCollisionBoundary = 'visualViewport' | 'layoutViewport';

/** Perpendicular sides a panel falls back to; see `fallbackAxisSide`. */
export type PopoverFallbackAxisSide = 'start' | 'end' | 'none';

/** What a panel anchors to on a reference that wraps across lines; see `anchorTo`. */
export type PopoverAnchorTo = 'box' | 'line';

export type PopoverProps = WithAttachments<{
	/** Stable DOM id for the popover dialog; falls back to a generated id when omitted. */
	id?: string;
	/** Controls whether the popover is open; bindable for two-way control. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/**
	 * Called before the popover opens or closes, with the requested state and the change details:
	 * `reason` (`'trigger-press'`, `'trigger-hover'`, `'outside-press'`, `'escape-key'`,
	 * `'trigger-unmount'`, `'imperative-action'`…), the originating `event`, the `trigger`
	 * element, the `interaction` type and `cancel()`. Calling `details.cancel()` keeps the popover
	 * as it is and leaves the event untouched. Inside the callback, `open` still holds the
	 * previous state.
	 */
	onOpenChange?: OpenChangeHandler;
	/** Called once per open, after the open transition finishes (right away when none plays, e.g. `defaultOpen`). */
	onAfterOpen?: (payload: PopoverState) => void;
	/** Called once per close, after the close transition finishes. */
	onAfterClose?: (payload: PopoverState) => void;
	/** Popover panel size variant; supports responsive values. */
	size?: ResponsiveProps<Sizes>;
	/** Gap in pixels between the reference element and the popover panel. */
	offset?: number;
	/**
	 * External positioning reference instead of the built-in trigger. An HTMLElement, or a
	 * floating-ui virtual element — an object with `getBoundingClientRect()` returning a rect at a
	 * point, e.g. `{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }` to anchor a context
	 * menu at the cursor. An open popover closes when this element leaves the document.
	 */
	ref?: HTMLElement | VirtualElement | null;
	/**
	 * Preferred placement relative to the reference element; supports responsive values. Takes a
	 * floating-ui placement (`bottom-start`) or a logical side (`inline-end`, `inline-end-start`)
	 * that resolves with the reading direction. The panel flips to the opposite side when the
	 * preferred one has no room; the side it lands on is written as `data-side`.
	 */
	position?: ResponsiveProps<PopoverPlacement>;
	/**
	 * The viewport the panel is shifted back into when it would cross an edge. `'visualViewport'`
	 * is the visible area, which shrinks under an on-screen keyboard and follows pinch-zoom;
	 * `'layoutViewport'` ignores pinch-zoom, so panning a zoomed page doesn't drag the panel
	 * along. Flipping and the `--available-*` sizes always use the visual viewport. ContextMenu
	 * uses `'layoutViewport'`.
	 * @default 'visualViewport'
	 */
	collisionBoundary?: PopoverCollisionBoundary;
	/**
	 * When the panel fits neither on its side nor on the opposite one, also try the perpendicular
	 * axis: `'end'` tries bottom (or the inline end) first, `'start'` top (or the inline start),
	 * `'none'` stays on the axis. A panel placed beside its reference (left or right) tries only
	 * the side asked for, so it never jumps over the reference's own row and menu. Submenus use
	 * `'end'`: a submenu with no room beside its menu opens below its row, sliding back into the
	 * viewport if that is still too tight.
	 * @default 'none'
	 */
	fallbackAxisSide?: PopoverFallbackAxisSide;
	/**
	 * What the panel anchors to when its reference wraps across lines (a link in prose): `'box'`
	 * is the whole bounding box; `'line'` is the line the pointer was on when the panel opened,
	 * kept while it stays open. Without a pointer (a keyboard open) the panel takes the first
	 * line above the reference and the last line below it.
	 * @default 'box'
	 */
	anchorTo?: PopoverAnchorTo;
	/**
	 * Places the panel yourself instead of floating-ui: return its viewport coordinates (the
	 * panel is `position: fixed`) and optionally a `minWidth` in px that replaces `fitTrigger`'s,
	 * or `null` to fall back to `position`. Called when the panel mounts and whenever floating-ui
	 * would reposition it (scroll, resize, size changes), with the positioned panel wrapper and the
	 * reference element in one payload. Select uses it to open over its trigger with the selected
	 * option on the value.
	 */
	positionPanel?: (payload: {
		panel: HTMLElement;
		reference: HTMLElement | VirtualElement;
	}) => { x: number; y: number; minWidth?: number } | null;
	/** When true, clicking the trigger toggles the popover open and closed. */
	openOnClick?: boolean;
	/**
	 * When true, hovering the trigger opens the popover after `delay`, including one that started
	 * open. A hover-opened popover does not lock page scroll; pressing its trigger pins it open.
	 * Touch taps and disabled triggers never hover-open it, and a trigger that appears under a
	 * resting pointer waits for the pointer to move. Right after another hover popover, tooltip
	 * or hover card was open, a root popover opens without the delay.
	 */
	openOnHover?: boolean;
	/**
	 * Delay in milliseconds before opening on hover when `openOnHover` is enabled. Default `100`.
	 * Leaving the trigger, or any other open or close meanwhile, cancels the pending open.
	 */
	delay?: number;
	/**
	 * Milliseconds the pointer may spend outside the hover safe area before `closeOnMouseLeave`
	 * closes the popover. A longer delay forgives a pointer that overshoots on its way to the
	 * panel. Default `120`.
	 */
	closeDelay?: number;
	/** When true, enter and exit transitions slide from the placement direction. */
	directedTransition?: boolean;
	/** Fly/scale opacity transition overrides for open and close; supports responsive values. */
	transition?: ResponsiveProps<FSOProps>;
	/** Snippet for popover panel content; receives the popover state instance. */
	children?: Snippet<[PopoverState]>;
	/**
	 * Snippet, button props, or `false` to render, customize, or hide the trigger control. The
	 * trigger that opened the popover anchors it and gets focus back; an open popover closes when
	 * that trigger unmounts (`reason: 'trigger-unmount'`), and a trigger re-rendered as a new
	 * element keeps it open. The built-in button's `onclick` runs first: calling
	 * `event.preventDefault()` there stops the toggle.
	 */
	trigger?: Snippet<[PopoverState]> | (ButtonProps & { content?: string }) | false;
	/**
	 * Where focus goes when the panel opens: `'first'` (autofocus target or first tabbable),
	 * `'container'` (the panel itself), or `false` (stay on the trigger). When the popover
	 * closes, focus returns to the trigger that opened it, or after a programmatic open to the
	 * element that had focus when it opened.
	 * @default false
	 */
	focusOnOpen?: 'first' | 'container' | false;
	/**
	 * Where focus goes when the popover closes with focus inside it or after a trigger opened it.
	 * By default it returns to the trigger (with a visible focus ring after Escape or another
	 * keyboard close); when that control is gone or disabled, to the most recent element that is
	 * still on the page. `false` leaves focus where it is, an element receives it, and a function
	 * is called with the change details (`reason`, `interaction`…) and returns one of these, or
	 * nothing to restore as usual. A close because focus moved on (`'focus-out'`) never moves it.
	 * @default true
	 */
	focusOnClose?: FocusOnClose;
	/**
	 * Value of `aria-haspopup` applied to the trigger, describing what the panel contains.
	 * `aria-expanded` and `aria-controls` are managed automatically alongside it. A `'dialog'`
	 * popup renders in a `<dialog>`; any other value renders a plain wrapper, points
	 * `aria-controls` at the element inside with the matching role (`role="menu"` for `menu` and
	 * `true`) and labels that element by the trigger unless it has an `aria-label`.
	 * @default 'dialog'
	 */
	haspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true;
	/** When true, pressing outside the popover closes it. A press that began before it opened does not count, and on touch screens only a tap does (a finger that starts scrolling the page does not). */
	closeOnClickOutside?: boolean;
	/** When true, pressing Escape closes the topmost open popover. */
	closeOnEscape?: boolean;
	/** When true, moving the pointer outside the hover safe area closes a popover that hovering opened. The safe area is the trigger, the panel, and a prediction cone toward the panel, so a diagonal move to the panel keeps it open. A popover opened by a press, the keyboard or code stays open. */
	closeOnMouseLeave?: boolean;
	/** When true, renders debug overlays for the hover safe-area rectangles (blue) and the prediction cone toward the panel (orange). */
	debugSafeArea?: boolean;
	/**
	 * When true, locks page scroll while a root-level popover is open, unless hovering opened it or
	 * a finger did and the panel is narrower than the viewport (the page still scrolls under it).
	 */
	lockScroll?: boolean;
	/** Additional CSS classes merged onto the popover dialog element. */
	class?: string;
	/**
	 * When true, the panel is at least as wide as the trigger and grows to fit its content (up to
	 * the `size` cap), so a narrow trigger never forces its options to wrap or scroll sideways.
	 */
	fitTrigger?: boolean;
	/** When true, renders the popover as a bottom sheet on mobile viewports (<768px).
	 *  Default `false`, so existing popovers stay anchored on every screen size. */
	mobileSheet?: boolean;
	/**
	 * When true, the panel renders in normal document flow where the component sits instead of
	 * portaling to the viewport-fixed layer: no floating-ui positioning, no scroll lock, no
	 * outside-press dismissal (Escape still closes it). Same panel classes and motion, so it
	 * looks identical; the trigger still toggles it. Use it to show an open panel statically,
	 * e.g. in docs or visual tests. Wins over `mobileSheet`.
	 * @default false
	 */
	inline?: boolean;
	/** When true, mobile-sheet panels animate intrinsic height changes. */
	mobileSheetSizeTransition?: boolean;
	/** Per-instance theme overrides for popover layout and styling class names. */
	theme?: PopoverThemeProps;
}>;
