import type { InputProps } from '../Field/field.js';
import type { PasswordInputThemeProps } from './passwordInput.theme.js';
import type { HTMLInputAttributes } from 'svelte/elements';

/** What a password field holds, as browsers and password managers read it. */
export type PasswordInputAutocomplete = 'current-password' | 'new-password' | 'off';

export type PasswordInputAttributes = Omit<
	HTMLInputAttributes,
	| 'autocomplete'
	| 'class'
	| 'disabled'
	| 'id'
	| 'name'
	| 'placeholder'
	| 'required'
	| 'type'
	| 'value'
>;

export type PasswordInputProps = InputProps<'password'> & {
	/** Hint text shown in the empty password input. */
	placeholder?: string;
	/**
	 * Tells browsers and password managers what the field holds, rendered as the input's
	 * `autocomplete` attribute. Use `current-password` on sign-in forms so a saved password is
	 * offered, `new-password` on sign-up and change-password forms so a strong one is suggested,
	 * and `off` only where no manager should fill the field. Omitted, the attribute is left off and
	 * the browser decides.
	 */
	autocomplete?: PasswordInputAutocomplete;
	/**
	 * Fewest characters a non-empty value accepts during validation. Defaults to 6, or to no
	 * minimum when `autocomplete` is `current-password`: a sign-in form must accept whatever
	 * password the account already has. An explicit value always applies; `0` drops the rule.
	 */
	minLength?: number;
	/**
	 * Native attributes applied to the underlying input, such as `aria-*`, `data-*` (for example
	 * `data-1p-ignore` to keep 1Password away), `maxlength` or event handlers.
	 */
	inputAttrs?: PasswordInputAttributes;
	/** Theme overrides for the password input and its field container. */
	theme?: PasswordInputThemeProps & InputProps<'password'>['theme'];
};
