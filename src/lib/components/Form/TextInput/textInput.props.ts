import type { InputProps } from '../Field/field.js';
import type { TextInputThemeProps } from './textInput.theme.js';
import type { HTMLInputAttributes } from 'svelte/elements';

export type TextInputType = 'text' | 'email' | 'url';
export type TextInputAttributes = Omit<
	HTMLInputAttributes,
	'class' | 'disabled' | 'id' | 'name' | 'placeholder' | 'required' | 'type' | 'value'
>;

export type TextInputProps = InputProps<TextInputType> & {
	/** Native input type and validation schema used by FieldState. */
	type?: TextInputType;
	/** Hint text shown in the empty text input. */
	placeholder?: string;
	/** Native attributes applied to the underlying input control. */
	inputAttrs?: TextInputAttributes;
	/** Theme overrides for the text input element and its field container. */
	theme?: TextInputThemeProps & InputProps<TextInputType>['theme'];
};
