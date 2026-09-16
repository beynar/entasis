import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ToggleButtonThemeProps } from './toggleButton.theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';

export type ToggleButtonVariant = 'outline' | 'ghost';
export type ToggleButtonProps = WithAttachments<
	WithSlot<
		{
			/** Bindable reference to the root button element. */
			ref?: HTMLButtonElement | null;
			/** Native button type. Defaults to `button` so toggles never submit a form accidentally. */
			type?: HTMLButtonAttributes['type'];
			/** Accessible name, required when the button has no visible text. */
			label?: string;
			/**
			 * `'radio'` exposes the pressed state as `aria-checked` (inside a single-select
			 * group); the default is a toggle button with `aria-pressed`.
			 */
			role?: 'radio';
			/** Theme color token applied to the button styling. */
			color?: Colors;
			/** Visual style variant of the toggle button. */
			variant?: ToggleButtonVariant;
			/** Size token controlling padding, height, and typography. */
			size?: Sizes;
			/** When true, prevents toggling and applies disabled styles. */
			disabled?: boolean;
			/**
			 * The class name of the button. First element that the component outputs in the DOM.
			 */
			class?: string;
			/** Theme overrides for the button, prefix, and suffix parts. */
			theme?: ToggleButtonThemeProps;
			/** Bindable pressed state toggled on each click when not disabled. */
			value?: boolean;
			/** Initial pressed state when `value` is omitted. */
			defaultValue?: boolean;
			/** Called once after a user interaction changes `value`. */
			onValueChange?: ((value: boolean) => void) | null | undefined;
		},
		'prefix' | 'children' | 'suffix'
	>
>;
