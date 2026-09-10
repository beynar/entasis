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
			 * Corner anchor that turns the chip into an absolutely positioned overlay.
			 * The containing element must establish a positioning context.
			 */
			position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
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
			/** Pressed state for selectable chip buttons. */
			'aria-pressed'?: HTMLButtonAttributes['aria-pressed'];
			/** ARIA disabled marker for selectable chip buttons. */
			'aria-disabled'?: HTMLButtonAttributes['aria-disabled'];
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
