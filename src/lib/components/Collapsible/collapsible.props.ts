import type { DisclosureIndicator, Sizes } from '$lib/types/theme.js';
import type { ResponsiveProps } from '$lib/components/Theme/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { WithSlot, Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { CollapsibleThemeProps } from './collapsible.theme.js';

type CollapsibleBaseProps = {
	/**
	 * Bindable reference to the root collapsible container element.
	 */
	ref?: HTMLElement | null;
	/**
	 * The class name of the collapsible container.
	 */
	class?: string;
	/**
	 * Current open state. Bindable.
	 */
	open?: boolean;
	/**
	 * Initial open state when `open` is omitted.
	 */
	defaultOpen?: boolean;
	/**
	 * Whether the collapsible is disabled.
	 */
	disabled?: boolean;
	/**
	 * Called before the open state changes, whenever the user (a trigger press, or the browser's
	 * find-in-page reaching hidden content) or an imperative call asks to open or close it.
	 * `details.reason` says why, `details.event` carries the DOM event, and `details.cancel()`
	 * keeps the collapsible as it was. Inside the callback `open` still holds the previous state.
	 * Not called for initialization or for changes the parent assigns to `open`.
	 */
	onOpenChange?: OpenChangeHandler | null | undefined;
	/**
	 * Called once each time an open finishes: after the slide, or at once when no animation runs
	 * (reduced motion, a zero duration, find-in-page). Not called for the initial state.
	 */
	onAfterOpen?: () => void;
	/**
	 * Called once each time a close finishes: after the slide, at once when no animation runs, or
	 * when the panel is removed mid-close. Not called for the initial state.
	 */
	onAfterClose?: () => void;
	/**
	 * Keeps the closed content in the DOM under `hidden="until-found"`, so the browser's
	 * find-in-page, text fragments and `#id` links can reach it and open the collapsible
	 * (reason `find-in-page`, no animation). Closed content is hidden from assistive technology
	 * and from the tab order until then. A parent that refuses the change leaves it closed. A disabled
	 * collapsible is not findable: its closed content stays under plain `hidden`.
	 * Applies to the `default` variant; `peek` always keeps its content mounted.
	 * @default false
	 */
	hiddenUntilFound?: boolean;
	/**
	 * Keeps the closed content mounted under `hidden`, preserving its state (form values, scroll,
	 * media). It is not findable by the browser; use `hiddenUntilFound` for that. Applies to the
	 * `default` variant.
	 * @default false
	 */
	keepMounted?: boolean;
	/**
	 * Size variant of the collapsible.
	 */
	size?: Sizes;
	/**
	 * The disclosure indicator: `chevron` rotates a chevron, `plus-minus` swaps a
	 * plus/minus glyph, `none` hides it. Pass a Slot for a custom icon (receives `{ open }`).
	 */
	icon?: DisclosureIndicator | Slot;
	/**
	 * Theme configuration overrides.
	 */
	theme?: CollapsibleThemeProps;

	/**
	 * Visual variant. `default` toggles the content in and out with a slide.
	 * `peek` keeps the content mounted, clips it to `peekHeight` and fades the
	 * edge while closed, with the trigger floating as a pill over the fade; links and controls
	 * below the visible preview are inert until it opens.
	 */
	variant?: 'default' | 'peek';
	/**
	 * Height of the collapsed preview for the `peek` variant. A number is px.
	 */
	peekHeight?: number | string;
	/**
	 * Slide transition overrides for the content; supports responsive values and wins
	 * over the `motion` theme slot.
	 */
	transition?: ResponsiveProps<FSOProps>;
};

type CollapsibleSlotProps = WithSlot<
	CollapsibleBaseProps,
	'trigger' | 'children',
	{ open: boolean }
>;

export type CollapsibleProps = WithAttachments<CollapsibleSlotProps>;
