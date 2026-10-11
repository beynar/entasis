import type { Snippet } from 'svelte';
import type { PopoverState } from './popover.state.svelte.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import { type Placement, type VirtualElement } from '@floating-ui/dom';
import type { WithAttachments } from '$lib/types/props.js';
import type { PopoverThemeProps } from './popover.theme.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';

/**
 * How an open popover was opened: `hover` (the pointer rested on the trigger), `press` (a click
 * or tap on the trigger), `keyboard` (Enter, Space or an arrow key on the trigger), or
 * `programmatic` (`open()` from code, the `open` prop, `defaultOpen`).
 */
export type PopoverOpenReason = 'hover' | 'press' | 'keyboard' | 'programmatic';

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
	/** Preferred placement relative to the reference element; supports responsive values. */
	position?: ResponsiveProps<Placement>;
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
	 */
	openOnHover?: boolean;
	/**
	 * Delay in milliseconds before opening on hover when `openOnHover` is enabled. Default `100`.
	 * Leaving the trigger, or any other open or close meanwhile, cancels the pending open.
	 */
	delay?: number;
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
	/** When true, locks page scroll while a root-level popover is open, unless hovering opened it. */
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
