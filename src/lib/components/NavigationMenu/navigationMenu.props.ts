import type { Snippet } from 'svelte';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { OpenChangeDetails } from '$lib/utils/openChange.js';
import type { Slot } from '../Slot/slot.js';
import type { NavigationMenuThemeProps } from './navigationMenu.theme.js';

/** A link: a top-level entry of the bar, or a row inside a panel. */
export type NavigationMenuLink = {
	/** Text or snippet shown for the link. */
	label: Slot;
	/** Where the link goes. */
	href: string;
	/** Secondary text under the label. Shown inside panels only. */
	description?: Slot;
	/** Content before the label, usually an icon. */
	prefix?: Slot;
	/**
	 * Paints only `prefix`. The string `label` is then spoken instead of painted, as the accessible
	 * name of an icon-only top-level link.
	 */
	iconOnly?: boolean;
	/** Marks the link of the current page: renders `aria-current="page"` and the selected look. */
	active?: boolean;
	/** The link cannot be followed: it drops its `href`, leaves the tab order and renders `aria-disabled`. */
	disabled?: boolean;
	/** Link `target`. */
	target?: string;
	/** Link `rel`. */
	rel?: string;
	/**
	 * Native click handler. It runs before the built-in close, and `event.preventDefault()` there
	 * skips it (and the navigation itself).
	 */
	onclick?: (event: MouseEvent) => void;
};

/** What a snippet panel receives. */
export type NavigationMenuPanelApi = {
	/** Closes the open panel and every nested level, reported as `close-press`. */
	close: () => void;
};

/** A disclosure button in the bar that shows a panel. */
export type NavigationMenuPanel<Value extends string = string> = {
	type: 'panel';
	/** Identifies the panel in `value`, `defaultValue` and `onValueChange`. Unique among panels. */
	value: Value;
	/** Text or snippet shown on the trigger. */
	label: Slot;
	/** Content before the label, usually an icon. */
	prefix?: Slot;
	/**
	 * Paints only `prefix` (and the caret). The string `label` is then spoken instead of painted, as
	 * the accessible name of an icon-only trigger.
	 */
	iconOnly?: boolean;
	/** A disabled trigger never opens: it renders `disabled` and `data-disabled`. */
	disabled?: boolean;
	/** The panel's body: a list of links, or a snippet that renders anything. */
	content?: NavigationMenuLink[] | Snippet<[NavigationMenuPanelApi]>;
	/**
	 * A nested level rendered inline under `content`: links, and further panels that expand in
	 * place (an inline disclosure, not another floating layer). A link press anywhere in the tree
	 * closes every level.
	 */
	items?: NavigationMenuItem<Value>[];
};

/** One entry of the bar or of a nested level. */
export type NavigationMenuItem<Value extends string = string> =
	({ type: 'link' } & NavigationMenuLink) | NavigationMenuPanel<Value>;

/** Payload of `onValueChange`: the panel the menu is about to show and why. */
export type NavigationMenuValueChangePayload<Value extends string = string> = {
	/** The panel that will be open, `null` when every panel closes. */
	value: Value | null;
	/** Reason, originating event and `cancel()`. */
	details: OpenChangeDetails;
};

export type NavigationMenuProps<Value extends string = string> = WithAttachments<{
	/** The entries of the bar, in order. */
	items: NavigationMenuItem<Value>[];
	/** Accessible name of the `nav` landmark. Give it when the page has more than one. */
	label?: string;
	/** Bindable reference to the `nav` element. */
	ref?: HTMLElement | null;
	/** The open panel's `value`, `null` while all are closed. Bindable. */
	value?: Value | null;
	/** The open panel when `value` is omitted. */
	defaultValue?: Value | null;
	/**
	 * Called before the open panel changes: a trigger press, hovering, ArrowDown on a trigger,
	 * Escape, an outside press, focus leaving, a link press, or the open panel being
	 * removed. `details.reason` (in the `{ value, details }` payload) says why, `details.event` carries the DOM event, and
	 * `details.cancel()` keeps the current panel. Inside the callback `value` still holds the
	 * previous panel. A link press closes every level and calls this once with `null`. Not called
	 * for the initial state or for changes the parent assigns to `value`.
	 */
	onValueChange?: (payload: NavigationMenuValueChangePayload<Value>) => void;
	/** Opens a panel when the pointer rests on its trigger. Touch never hovers. @default true */
	openOnHover?: boolean;
	/** Milliseconds the pointer rests on a trigger before its panel opens; switching between triggers is immediate. @default 50 */
	delay?: number;
	/** Milliseconds the pointer may stay outside the triggers and the panel before a hover-opened panel closes. @default 100 */
	closeDelay?: number;
	/**
	 * Keeps every panel in the DOM under `hidden`, so crawlers and the server-rendered HTML see
	 * their links. A kept-mounted popup hides at once when closed (it has no exit animation).
	 * @default false
	 */
	keepMounted?: boolean;
	/** Called once each time a panel finishes opening: after the animation, or at once when none plays. Not called for the initial state. */
	onAfterOpen?: () => void;
	/** Called once each time the panel area finishes closing. Not called for the initial state. */
	onAfterClose?: () => void;
	/** Size of the triggers, links and panel text. @default 'normal' */
	size?: Sizes;
	/** Spacing inside the panel area and between its rows. @default 'normal' */
	density?: Density;
	/** Semantic role of the triggers and of the selected look. Falls back to the Theme's default color. */
	color?: Colors;
	/** Text direction; mirrors the arrow keys and the panel alignment. Follows the i18n direction or the element's computed direction when omitted. */
	dir?: 'ltr' | 'rtl';
	/** Popup enter and exit overrides; supports responsive values and wins over the `motion` theme slot. Only numeric `x` and `y` apply. */
	transition?: ResponsiveProps<FSOProps>;
	/** Class name of the `nav` root. */
	class?: string;
	/** Theme overrides for the bar, the triggers and the panel parts. */
	theme?: NavigationMenuThemeProps;
}>;
