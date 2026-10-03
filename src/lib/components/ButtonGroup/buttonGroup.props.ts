import type { Snippet } from 'svelte';
import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ButtonProps, ButtonVariant } from '../Button/index.js';
import type { ButtonGroupThemeProps } from './buttonGroup.theme.js';

type ButtonGroupContent =
	| {
			/** Items rendered in order inside the group. */
			items: ButtonProps[];
			children?: never;
	  }
	| {
			items?: never;
			/**
			 * Buttons (or Tooltip and Popover triggers, which render one) composed directly. Each
			 * direct child is joined to its neighbours; set size, color and variant on each one.
			 */
			children: Snippet;
	  };

export type ButtonGroupProps = WithAttachments<
	ButtonGroupContent & {
		/** Accessible name of the group. */
		label?: string;
		/** Size applied to every item in the group. */
		size?: Sizes;
		/** Color applied to every item in the group. */
		color?: Colors;
		/** Visual variant applied to every item in the group. */
		variant?: ButtonVariant;
		/** When true, disables every item in the group, whatever the item says. */
		disabled?: boolean;
		/** Class name on the root group container element. */
		class?: string;
		/** Theme overrides for the group container layout. */
		theme?: ButtonGroupThemeProps;
	}
>;
