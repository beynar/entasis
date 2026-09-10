import type { InputProps, KeyValuePair } from '../Field/field.js';
import type { Messages } from '$lib/i18n/en.js';
import type { KeyValueInputThemeProps } from './keyValueInput.theme.js';

export type KeyValueInputProps = Omit<InputProps<'keyvalue'>, 'onValueChange'> & {
	/** Called when the pairs change, with the new array of key/value pairs. */
	onValueChange?: (value: KeyValuePair[]) => void;
	/** Placeholder shown in the key input of each row. Defaults to the localized "Key" label. */
	keyPlaceholder?: string;
	/** Placeholder shown in the value input of each row. Defaults to the localized "Value" label. */
	valuePlaceholder?: string;
	/** Label for the Add button. Defaults to the localized "Add" label. */
	addLabel?: string;
	/** Maximum number of rows; the Add button is disabled once reached. */
	maxRows?: number;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
	/** Theme overrides for the container, rows, inputs, remove button, add button, and field parts. */
	theme?: KeyValueInputThemeProps & InputProps<'keyvalue'>['theme'];
};
