import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Sizes } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { ButtonProps } from '../Button/index.js';
import type { OverlayThemeProps } from './overlay.theme.js';

export type OverlayPosition = 'fill' | 'top' | 'bottom';
export type OverlayAlign = 'start' | 'center' | 'end';
export type OverlayShowOn = 'always' | 'hover' | 'focus';

/** A button rendered in the actions row: Button props plus its label as `content`. */
export type OverlayAction = ButtonProps & { content?: string };

export type OverlayProps = WithAttachments<
	WithSlot<
		{
			/** Bindable reference to the overlay root. */
			ref?: HTMLDivElement | null;
			/** Additional classes merged onto the overlay root. */
			class?: string;
			/** Placement of the content and scrim treatment. */
			position?: OverlayPosition;
			/** Horizontal alignment of the composed content. */
			align?: OverlayAlign;
			/** Reveal condition. `hover` also reveals on focus for keyboard access. */
			showOn?: OverlayShowOn;
			/** Controls whether the overlay can be shown. */
			open?: boolean;
			/** Initial open state when `open` is not provided. */
			defaultOpen?: boolean;
			/** Called once when the library requests an open-state change. */
			onOpenChange?: (open: boolean) => void;
			/** Called after the open transition finishes. */
			onAfterOpen?: () => void;
			/** Called after the close transition finishes. */
			onAfterClose?: () => void;
			/** Renders the dark fill or directional gradient behind the content. */
			scrim?: boolean;
			/** Size token controlling padding, gaps, and typography. */
			size?: Sizes;
			/** Buttons rendered below the content. */
			actions?: OverlayAction[];
			/** Fully custom composition replacing title, description, content, and actions. */
			children?: Snippet;
			/** Theme overrides for the overlay parts. */
			theme?: OverlayThemeProps;
		},
		'title' | 'description' | 'content'
	>
>;
