import type { Slot } from '../../Slot/slot.js';
import type { FieldProps, InputProps } from '../Field/field.js';
import type { CheckboxesInputThemeProps } from './checkboxesInput.theme.js';

export type CheckboxOption<Value extends string = string> = {
	/** Display content for the option, rendered as the option label. */
	label?: Slot;
	/** Unique value for the option, used as the checkbox value and selection key. */
	value: Value;
	/** Supporting content rendered below the option label. */
	description?: Slot;
	/**
	 * Prevents toggling this individual option. A native `<form>` leaves a disabled option out of
	 * its submission, while the field value (and so an entasis Form's value) keeps it when selected.
	 */
	disabled?: boolean;
};
export type CheckboxMode = 'card' | 'normal';

export type CheckboxesInputProps<
	T extends CheckboxOption = CheckboxOption,
	Value extends string = T['value']
> = Omit<InputProps<'checkboxes'>, 'theme' | 'value' | 'defaultValue' | 'onValueChange'> & {
	/**
	 * Selected option values, bindable with `bind:value`. Typed from the options' `value`s, so
	 * literal values (`items` declared `as const`, or with literal `value`s) give a union of them.
	 */
	value?: Value[];
	/** Initial selected option values when `value` is omitted. */
	defaultValue?: Value[];
	/** Called when the selected option values change. */
	onValueChange?: (value: Value[]) => void;
	/** Visual layout style for the checkbox group (`normal` or `card`). */
	mode?: CheckboxMode;
	/** Items to render as checkbox choices. */
	items: readonly (T & CheckboxOption<Value>)[];
	/**
	 * Adds a select-all checkbox above the options. It is mixed while some, but not all, of the
	 * enabled options are selected. A click selects every enabled option, the next clears them,
	 * and the next gives back the partial selection the row started from (with no partial
	 * selection it toggles between all and none). Disabled options keep their state, and the
	 * field value stays the list of option values.
	 */
	selectAll?: boolean;
	/** Label of the select-all checkbox. Defaults to the localized "Select all". */
	selectAllLabel?: Slot;
	/** Theme overrides for the checkbox group and shared field parts. */
	theme?: CheckboxesInputThemeProps & InputProps<'checkboxes'>['theme'];
} & Partial<Omit<FieldProps<'checkboxes'>, 'children' | 'field' | 'type' | 'theme'>>;
