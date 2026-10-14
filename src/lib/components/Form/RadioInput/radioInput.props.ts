import type { Slot } from '../../Slot/slot.js';
import type { InputProps } from '../Field/field.js';
import type { RadioInputThemeProps } from './radioInput.theme.js';

export type RadioOption<Value extends string = string> = {
	/** Display text for the option, rendered inside the option button. */
	label?: string;
	/** Unique value of this option, committed when it is selected. */
	value: Value;
	/** Optional icon snippet shown before the option label. */
	icon?: Slot;
	/** Supporting text rendered below the option label. */
	description?: string;
	/**
	 * Prevents selecting this individual option. A native `<form>` leaves a disabled selected
	 * option out of its submission, while the field value (and so an entasis Form's value) keeps it.
	 */
	disabled?: boolean;
};
export type RadioInputProps<
	T extends RadioOption = RadioOption,
	Value extends string = T['value']
> = Omit<InputProps<'radio'>, 'theme' | 'value' | 'defaultValue' | 'onValueChange'> & {
	/** Visual layout style for the radio group (`normal` or `card`). */
	mode?: 'card' | 'normal';
	/** Items to render as radio choices. */
	items: readonly (T & RadioOption<Value>)[];
	/**
	 * Selected option value, bindable with `bind:value`; `null` while nothing is selected. Typed
	 * from the options' `value`s, so literal values (`items` declared `as const`, or with literal
	 * `value`s) give a union of them.
	 */
	value?: Value | null;
	/** Initial selected value when `value` is omitted. */
	defaultValue?: Value | null;
	/** Called when the user selects another option. */
	onValueChange?: (value: Value) => void;
	/**
	 * Theme overrides for the radio group's own slots plus the Field parts (label,
	 * inputContainer, error, ...) the group is wrapped in.
	 */
	theme?: RadioInputThemeProps & InputProps<'radio'>['theme'];
};
