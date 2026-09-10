import type { InputProps } from '../Field/field.js';
import type { TextAreaThemeProps } from './textArea.theme.js';
import type { FieldState } from '../Field/field.state.svelte.js';
import type { HTMLTextareaAttributes } from 'svelte/elements';

export type TextAreaAttributes = Omit<
	HTMLTextareaAttributes,
	'class' | 'disabled' | 'id' | 'maxlength' | 'name' | 'placeholder' | 'required' | 'rows' | 'value'
>;

export type TextAreaProps = InputProps<'textarea'> & {
	/** Hint text shown in the empty textarea. */
	placeholder?: string;
	/** Theme overrides for the textarea element and its field container. */
	theme?: TextAreaThemeProps & InputProps<'textarea'>['theme'];
	/** Number of visible text rows in the textarea. */
	rows?: number;
	/** Maximum number of characters the user may enter. */
	maxLength?: number;
	/** Native attributes applied to the underlying textarea control. */
	textareaAttrs?: TextAreaAttributes;
	/** Called when Enter is pressed without Shift; default submission is prevented. */
	onPressEnter?: (field: FieldState<'textarea'>) => void;
};
