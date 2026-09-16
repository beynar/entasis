import type { Placement } from '@floating-ui/dom';
import type { Attachment } from 'svelte/attachments';
import type { Snippet } from 'svelte';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { FSOProps } from '$lib/transitions/transition.js';
import type { Slot } from '../Slot/slot.js';
import type { ButtonProps } from '../Button/index.js';
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
	/** Gap from the attached element in pixels. */
	offset?: number;
	/** Opening and closing transition overrides. */
	transition?: FSOProps;
	/** Theme overrides for the tooltip surface. */
	theme?: TooltipThemeProps;

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
	/** Called whenever the tooltip becomes visible or hidden, hover and focus included. */
	onOpenChange?: (open: boolean) => void;
};
