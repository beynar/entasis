import type { Sizes, Colors } from '$lib/types/theme.js';
import type { WithAttachments, WithoutAttachments } from '$lib/types/props.js';
import type { ToggleButtonProps, ToggleButtonVariant } from '../ToggleButton/index.js';
import type { ToggleButtonGroupThemeProps } from './toggleButtonGroup.theme.js';

export type ToggleButtonGroupOrientation = 'horizontal' | 'vertical';

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
	/**
	 * When true, disables all buttons in the group. A disabled group has no tab stop, unless an
	 * item sets `focusableWhenDisabled`.
	 */
	disabled?: boolean;
	/** When true, renders the buttons as contiguous segments. */
	joined?: boolean;
	/**
	 * Axis of the group: `'horizontal'` lays the buttons out in a row and moves between them with
	 * ArrowLeft and ArrowRight; `'vertical'` stacks them and uses ArrowUp and ArrowDown. Keys of
	 * the other axis are ignored. Exposed as `data-orientation`; a `type="single"` group (`radiogroup`)
	 * also sets `aria-orientation`, the `group` role of a multiple group never does.
	 * @default 'horizontal'
	 */
	orientation?: ToggleButtonGroupOrientation;
	/**
	 * Whether the arrow keys wrap from the last button to the first and back. When false, focus
	 * stops at the ends.
	 * @default true
	 */
	loopFocus?: boolean;
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
