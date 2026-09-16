import type { Snippet } from 'svelte';
import type { PopoverState } from './popover.state.svelte.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { Sizes } from '$lib/types/theme.js';
import type { ButtonProps } from '../Button/index.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import { type Placement, type VirtualElement } from '@floating-ui/dom';
import type { WithAttachments } from '$lib/types/props.js';
import type { PopoverThemeProps } from './popover.theme.js';

export type PopoverProps = WithAttachments<{
	/** Stable DOM id for the popover dialog; falls back to a generated id when omitted. */
	id?: string;
	/** Controls whether the popover is open; bindable for two-way control. */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
	/** Called once when the library requests an open-state change. */
	onOpenChange?: (open: boolean) => void;
	/** Called after the open transition finishes. */
	onAfterOpen?: (payload: PopoverState) => void;
	/** Called after the close transition finishes. */
	onAfterClose?: (payload: PopoverState) => void;
	/** Popover panel size variant; supports responsive values. */
	size?: ResponsiveProps<Sizes>;
	/** Gap in pixels between the reference element and the popover panel. */
	offset?: number;
	/**
	 * External positioning reference instead of the built-in trigger. An HTMLElement, or a
	 * floating-ui virtual element — an object with `getBoundingClientRect()` returning a rect at a
	 * point, e.g. `{ getBoundingClientRect: () => new DOMRect(x, y, 0, 0) }` to anchor a context
	 * menu at the cursor.
	 */
	ref?: HTMLElement | VirtualElement | null;
	/** Preferred placement relative to the reference element; supports responsive values. */
	position?: ResponsiveProps<Placement>;
	/** When true, clicking the trigger toggles the popover open and closed. */
	openOnClick?: boolean;
	/** When true, hovering the trigger opens the popover after `delay`. */
	openOnHover?: boolean;
	/** Delay in milliseconds before opening on hover when `openOnHover` is enabled. */
	delay?: number;
	/** When true, enter and exit transitions slide from the placement direction. */
	directedTransition?: boolean;
	/** Fly/scale opacity transition overrides for open and close; supports responsive values. */
	transition?: ResponsiveProps<FSOProps>;
	/** Snippet for popover panel content; receives the popover state instance. */
	children?: Snippet<[PopoverState]>;
	/** Snippet, button props, or `false` to render, customize, or hide the trigger control. */
	trigger?: Snippet<[PopoverState]> | (ButtonProps & { content?: string }) | false;
	/**
	 * Where focus goes when the panel opens: `'first'` (autofocus target or first tabbable),
	 * `'container'` (the panel itself), or `false` (stay on the trigger). Focus always returns
	 * to the trigger when the popover closes.
	 * @default false
	 */
	focusOnOpen?: 'first' | 'container' | false;
	/**
	 * Value of `aria-haspopup` applied to the trigger, describing what the panel contains.
	 * `aria-expanded` and `aria-controls` are managed automatically alongside it.
	 * @default 'dialog'
	 */
	haspopup?: 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid' | true;
	/** When true, clicking outside the popover closes it. */
	closeOnClickOutside?: boolean;
	/** When true, pressing Escape closes the topmost open popover. */
	closeOnEscape?: boolean;
	/** When true, moving the pointer outside the hover safe area closes the popover. The safe area is the trigger, the panel, and a prediction cone toward the panel, so a diagonal move to the panel keeps it open. */
	closeOnMouseLeave?: boolean;
	/** When true, renders debug overlays for the hover safe-area rectangles (blue) and the prediction cone toward the panel (orange). */
	debugSafeArea?: boolean;
	/** When true, locks page scroll while a root-level popover is open. */
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
