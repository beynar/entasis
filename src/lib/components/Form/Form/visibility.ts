import type { FormFieldInput, FormInput, FormValueInput, FormValueRecord } from './form.js';
import type { Sizes } from '$lib/types/theme.js';
import type { FieldLabelPosition } from '../Field/field.js';

/**
 * Evaluates whether a form field should be visible based on its visibility configuration.
 *
 * @param input - The form input configuration
 * @param formValue - The current form values (used for dynamic visibility functions)
 * @returns `true` if the field should be visible, `false` otherwise
 *
 * @example
 * ```ts
 * // Static visibility
 * isFieldVisible({ type: 'text', visible: true }, formValue) // true
 * isFieldVisible({ type: 'text', visible: false }, formValue) // false
 *
 * // Dynamic visibility
 * isFieldVisible(
 *   { type: 'text', visible: (value) => value.showField === true },
 *   { showField: true }
 * ) // true
 * ```
 */
export function isFieldVisible(input: FormInput, formValue: FormValueRecord): boolean {
	if (input.visible === undefined) {
		return true; // Default to visible if not specified
	}

	if (typeof input.visible === 'boolean') {
		return input.visible;
	}

	if (typeof input.visible === 'function') {
		return input.visible(formValue);
	}

	return true; // Fallback to visible
}

/**
 * Prepares input props by removing function-based visibility.
 * Only boolean visibility is passed to individual input components.
 *
 * @param input - The form input configuration
 * @returns Input props without function-based visibility
 */
export function prepareInputProps(
	input: FormFieldInput,
	size: Sizes,
	labelPosition?: FieldLabelPosition
) {
	// `type` and `display` pick the component in Form.svelte; they are not props.
	const { type, visible, tool, ...rest } = input as FormValueInput & { display?: string };
	void type;
	void tool;
	if ('display' in rest) delete (rest as { display?: string }).display;
	// Only include visible if it's a boolean, not a function
	const defaults = labelPosition ? { size, labelPosition } : { size };
	return typeof visible === 'boolean'
		? { ...defaults, ...rest, visible }
		: { ...defaults, ...rest };
}
