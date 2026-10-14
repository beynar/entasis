import type { Placement } from '@floating-ui/dom';
import type { Attachment } from 'svelte/attachments';
import type { Snippet } from 'svelte';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { Slot } from '../Slot/slot.js';
import type { ButtonProps } from '../Button/index.js';
import type { OpenChangeHandler } from '$lib/utils/openChange.js';
import type { TooltipThemeProps } from './tooltip.theme.js';

/** Everything the `tooltip()` attachment accepts; the component spreads the same options. */
export type TooltipOptions = {
	/** Typography, icon, and surface geometry scale. */
	size?: Sizes;
	/** Classes applied to the tooltip surface. */
	class?: string;
	/** Text or snippet displayed inside the tooltip. */
	content: Slot;
	/** Preferred placement relative to the attached element. */
	position?: Placement;
	/** Semantic palette role for the tooltip surface. */
	color?: Colors;
	/** Tooltip surface treatment. */
	variant?: 'solid' | 'outline' | 'soft';
	/** Hover delay in milliseconds; zero shows immediately. Defaults to 400. */
	delay?: number;
	/**
	 * Milliseconds between the pointer leaving the trigger (or the content) and the tooltip
	 * closing. Defaults to 0. With `hoverable` content the pointer always gets at least 100 ms to
	 * cross the gap to it. Moving to another tooltip trigger within this time hands the surface
	 * over without closing it.
	 */
	closeDelay?: number;
	/**
	 * Keeps the tooltip open while the pointer is over its content, so a user can read it, select
	 * text or reach a link (WCAG 1.4.13). Defaults to true. `false` makes the content ignore the
	 * pointer, so it never covers what is behind it, and the tooltip closes as soon as the pointer
	 * leaves the trigger.
	 */
	hoverable?: boolean;
	/**
	 * Closes the tooltip when the trigger is pressed. It stays closed until the pointer leaves the
	 * trigger or focus moves away. Defaults to true; `false` leaves it open after a press.
	 */
	closeOnClick?: boolean;
	/**
	 * Turns the tooltip off: hover and focus do not open it and an open one closes. Read live.
	 * Also drops `aria-describedby` from the trigger.
	 */
	disabled?: boolean;
	/** Gap from the attached element in pixels. */
	offset?: number;
	/** Opening and closing transition overrides. */
	transition?: FSOProps;
	/** Theme overrides for the tooltip surface. */
	theme?: TooltipThemeProps;

	/**
	 * Called before the tooltip shows or hides, with the requested state and the change details:
	 * `reason` (`'trigger-hover'`, `'trigger-focus'`, `'trigger-press'`, `'outside-press'`,
	 * `'escape-key'`), the originating `event` and `trigger`, and `cancel()` to keep the tooltip as
	 * it was. When another tooltip takes the shared surface, the one it leaves is told with a
	 * change that cannot be cancelled.
	 */
	onOpenChange?: OpenChangeHandler;
	/** Called after the opening transition completes. */
	onAfterOpen?: () => void;
	/** Called after the closing transition completes. */
	onAfterClose?: () => void;
};

/**
 * Trigger content. A snippet receives the tooltip attachment and must spread it on the element
 * the tooltip anchors to (`{@attach attach}`); Button props render a Button carrying it.
 */
export type TooltipTrigger =
	Snippet<[Attachment<HTMLElement>]> | (ButtonProps & { content?: string });

export type TooltipProps = TooltipOptions & {
	/** Element the tooltip anchors to: a snippet handed the attachment, or Button props. */
	trigger: TooltipTrigger;
	/**
	 * Shows the tooltip without hover or focus; bindable. One surface is shared by every tooltip,
	 * so an open tooltip hands it over when another one is hovered.
	 */
	open?: boolean;
	/** Initial open state when `open` is not provided. */
	defaultOpen?: boolean;
};
