import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { ToggleButtonProps, ToggleButtonVariant } from '../ToggleButton/index.js';
import type { ToggleButtonGroupThemeProps } from './toggleButtonGroup.theme.js';

export type ToggleButtonGroupItem = Omit<
	WithoutAttachments<ToggleButtonProps>,
	'value' | 'defaultValue' | 'variant' | 'color' | 'size'
>;

export type ToggleButtonGroupItems = Record<string, ToggleButtonGroupItem>;

export type ToggleButtonGroupValue<Items extends ToggleButtonGroupItems> = Partial<
	Record<keyof Items, boolean>
>;

export type ToggleButtonGroupProps<Items extends ToggleButtonGroupItems = ToggleButtonGroupItems> =
	WithAttachments<{
		/** Items keyed by value, excluding group-level checked, variant, color, and size. */
		items: Items;
		/** Accessible name for the group. */
		ariaLabel: string;
		/** Size applied to every button in the group. */
		size?: Sizes;
		/** Color applied to every button in the group. */
		color?: Colors;
		/** Visual variant applied to every button in the group. */
		variant?: ToggleButtonVariant;
		/** When true, disables all buttons in the group. */
		disabled?: boolean;
		/** When true, renders the buttons as contiguous segments. */
		joined?: boolean;
		/** Class name on the root group container element. */
		class?: string;
		/** Theme overrides for the group container layout. */
		theme?: ToggleButtonGroupThemeProps;
		/** Bindable checked state keyed by each entry in `items`. */
		value?: ToggleButtonGroupValue<Items>;
		/** Initial checked state when `value` is omitted. */
		defaultValue?: ToggleButtonGroupValue<Items>;
		/** Called once when any button toggles, with the updated checked map. */
		onValueChange?: (value: ToggleButtonGroupValue<Items>) => void;
	}>;
