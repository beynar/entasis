import type { InputProps } from '../Field/field.js';
import type { PasswordInputThemeProps } from './passwordInput.theme.js';

export type PasswordInputProps = InputProps<'password'> & {
	/** Hint text shown in the empty password input. */
	placeholder?: string;
	/** Theme overrides for the password input and its field container. */
	theme?: PasswordInputThemeProps & InputProps<'password'>['theme'];
};
