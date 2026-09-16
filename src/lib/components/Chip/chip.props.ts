import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ChipThemeProps } from './chip.theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type ChipProps = WithAttachments<
	WithSlot<
		{
			/**
			 * The class name of the chip. First element that the component outputs in the DOM.
			 */
			class?: string;
			/** Theme color token applied to the chip styling. */
			color?: Colors;
			/** Size token controlling padding, height, and typography. */
			size?: Sizes;
			/** Visual style variant of the chip. */
			variant?: 'solid' | 'outline' | 'soft';
			/**
			 * Selected state. Sets `data-selected` and paints the shared soft selected fill on top
			 * of `variant`, so a chip list marks its chosen entries without a theme override. It is
			 * also the chip's accessible state: `aria-pressed` when the chip resolves to a button,
			 * `aria-current` when it resolves to a link. A chip with neither `onclick` nor `href`
			 * has no interactive role to carry a state, so there it stays paint-only.
			 */
			selected?: boolean;
			/**
			 * Corner anchor that turns the chip into an absolutely positioned overlay.
			 * The containing element must establish a positioning context.
			 */
			position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
			/** URL rendered as a link when set; chip becomes an anchor. */
			href?: string;
			/** Link target attribute when href is set. */
			target?: string;
			/** Link rel attribute when href is set. */
			rel?: string;
			/** Native click handler; renders as a button when set without href. */
			onclick?: (event: MouseEvent) => void;
			/** Native button type when the chip renders as a button. */
			type?: HTMLButtonAttributes['type'];
			/** Disabled state when the chip renders as a button. */
			disabled?: HTMLButtonAttributes['disabled'];
			/** Native pointer enter handler. */
			onpointerenter?: (event: PointerEvent) => void;
			/** Native pointer leave handler. */
			onpointerleave?: (event: PointerEvent) => void;
			/** Theme overrides for the chip, prefix, and suffix parts. */
			theme?: ChipThemeProps;
		},
		'children' | 'suffix' | 'prefix'
	>
>;
