import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { ToggleButtonProps, ToggleButtonVariant } from '../ToggleButton/index.js';
import type { ToggleButtonGroupThemeProps } from './toggleButtonGroup.theme.js';

export type ToggleButtonGroupType = 'single' | 'multiple';

export type ToggleButtonGroupItem = Omit<
	WithoutAttachments<ToggleButtonProps>,
	'value' | 'defaultValue' | 'variant' | 'color' | 'size'
> & {
	/** Value identifying this button inside the group value. Must be unique. */
	value: string;
};

export type ToggleButtonGroupItems = readonly ToggleButtonGroupItem[];

/**
 * `'multiple'` groups hold every pressed value; `'single'` groups hold the one checked value.
 */
export type ToggleButtonGroupValue<
	Items extends ToggleButtonGroupItems = ToggleButtonGroupItems,
	Type extends ToggleButtonGroupType = ToggleButtonGroupType
> = Type extends 'single' ? Items[number]['value'] | undefined : Items[number]['value'][];

export type ToggleButtonGroupProps<
	Items extends ToggleButtonGroupItems = ToggleButtonGroupItems,
	Type extends ToggleButtonGroupType = ToggleButtonGroupType
> = WithAttachments<{
	/** Ordered button configurations. Each item carries its own `value`; pressed state lives on the group value. */
	items: Items;
	/** Accessible name for the group. */
	label: string;
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
	/**
	 * `'multiple'` (default): any number of buttons can be pressed (`aria-pressed`).
	 * `'single'`: at most one is checked at a time, exposed as a radio group.
	 * @default 'multiple'
	 */
	type?: Type;
	/** Class name on the root group container element. */
	class?: string;
	/** Theme overrides for the group container layout. */
	theme?: ToggleButtonGroupThemeProps;
	/** Bindable pressed values: an array when `type` is `'multiple'`, the checked value when `'single'`. */
	value?: ToggleButtonGroupValue<Items, Type>;
	/** Initial pressed values when `value` is omitted. */
	defaultValue?: ToggleButtonGroupValue<Items, Type>;
	/** Called once when any button toggles, with the updated group value. */
	onValueChange?: (value: ToggleButtonGroupValue<Items, Type>) => void;
}>;
