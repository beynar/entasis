import type { HTMLInputAttributes } from 'svelte/elements';
import type { FieldType } from './field.js';
import type { FieldState } from './field.state.svelte.js';

/** One submitted value; numbers are submitted as their string form. */
export type FieldHiddenInputValue = string | number;

/** An option an autofilled text can name, by its value or by its label. */
export type FieldHiddenInputOption = {
	/** Value committed when the autofilled text names this option. */
	value: string;
	/** Text the browser may fill in place of the value, such as a country name. */
	label?: string;
};

export type FieldHiddenInputsProps<T extends FieldType = FieldType> = {
	/**
	 * The field the inputs submit for. Its name, required and disabled state are the defaults
	 * below, and its control takes focus when the browser reports an input invalid.
	 */
	field: FieldState<T>;
	/**
	 * Submitted value. A string or number renders one input, an array one input per entry under
	 * the same name (read them with `FormData.getAll`), and `null` or `undefined` submits nothing.
	 * With `checked`, the value a checked input submits (default `'on'`).
	 *
	 * @readonly-value The submitted value mirrors the field; the inputs never edit it.
	 */
	value?: FieldHiddenInputValue | readonly FieldHiddenInputValue[] | null;
	/** Renders one checkbox input that submits `value` only while checked, like a native checkbox. */
	checked?: boolean;
	/**
	 * Submitted name. Defaults to the field's name when the app gave one, directly or through
	 * Form; a field without a name submits nothing.
	 */
	name?: string;
	/**
	 * Blocks a native submit while nothing is submitted (unchecked, or no non-empty value) and
	 * hands the browser's report to the field's control. Defaults to the field's required state.
	 */
	required?: boolean;
	/** Leaves the inputs out of submission and validation. Defaults to the field's disabled state. */
	disabled?: boolean;
	/** Id of the form the inputs belong to when the control sits outside it. Defaults to Field's `form`. */
	form?: string;
	/** Id of the input the browser reports invalid. Defaults to `${field.id}-input`. */
	id?: string;
	/**
	 * Autofill token, such as `country` or `address-level1`. Renders the single value as a
	 * visually hidden text input the browser can autofill; an autofilled text goes through
	 * `options` and `onAutofill`.
	 */
	autocomplete?: HTMLInputAttributes['autocomplete'];
	/**
	 * Options an autofilled text is matched against: by value, then by label, then by label
	 * ignoring case and accents. Text that names no option is ignored. Without options, the text
	 * itself is the value.
	 */
	options?: readonly FieldHiddenInputOption[];
	/** Receives the value an autofill names. Defaults to committing it with `field.setValue`. */
	onAutofill?: (value: string) => void;
	/** Ignores autofill while true. Defaults to the field's read-only state. */
	readOnly?: boolean;
};
