import type { Slot } from '../../Slot/slot.js';
import type { FieldProps, InputProps } from '../Field/field.js';
import type { CheckboxesInputThemeProps } from './checkboxesInput.theme.js';

export type CheckboxOption = {
	/** Display content for the option, rendered as the option label. */
	label?: Slot;
	/** Unique value for the option, used as the checkbox value and selection key. */
	value: string;
	/** Supporting content rendered below the option label. */
	description?: Slot;
	/** Prevents toggling this individual option. */
	disabled?: boolean;
};
export type CheckboxMode = 'card' | 'normal';

export type CheckboxesInputProps<T extends CheckboxOption = CheckboxOption> = Omit<
	InputProps<'checkboxes'>,
	'theme' | 'value' | 'defaultValue' | 'onValueChange'
> & {
	/** Selected option values, bindable with `bind:value`. */
	value?: string[];
	/** Initial selected option values when `value` is omitted. */
	defaultValue?: string[];
	/** Called when the selected option values change. */
	onValueChange?: (value: string[]) => void;
	/** Visual layout style for the checkbox group (`normal` or `card`). */
	mode?: CheckboxMode;
	/** Items to render as checkbox choices. */
	items: T[];
	/** Theme overrides for the checkbox group and shared field parts. */
	theme?: CheckboxesInputThemeProps & InputProps<'checkboxes'>['theme'];
} & Partial<Omit<FieldProps<'checkboxes'>, 'children' | 'field' | 'type' | 'theme'>>;
