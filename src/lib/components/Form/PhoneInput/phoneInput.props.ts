import type { InputProps } from '../Field/field.js';
import type { IntlTelInputInstance } from './phoneInput-cdn.js';
import type { PhoneInputThemeProps } from './phoneInput.theme.js';

export type PhoneInputProps = InputProps<'phone'> & {
	/** Hint text shown in the empty phone input. */
	placeholder?: string;
	/** Initial or bindable ISO country code for the country selector. */
	country?: string;
	/** When true, enables intl-tel-input strict mode for number validation. */
	strict?: boolean;
	/** Placeholder text for the country dropdown search field. */
	searchPlaceholder?: string;
	/** Bindable intl-tel-input instance created when the input mounts. */
	iti?: IntlTelInputInstance;
	/** Theme overrides for the phone input element and its field container. */
	theme?: PhoneInputThemeProps & InputProps<'phone'>['theme'];
};
