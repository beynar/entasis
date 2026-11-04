import type { FormFieldInput, FormInput, FormValueRecord } from './form.js';
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
/**
 * The props Form hands an input. Deliberately not inferred: spreading the union of every input's
 * props emits 440 KB of declaration, for a value each branch of FormInputRenderer casts anyway.
 */
export type PreparedInputProps = Record<string, unknown> & {
	size: Sizes;
	labelPosition?: FieldLabelPosition;
	visible?: boolean;
};

export function prepareInputProps(
	input: FormFieldInput,
	size: Sizes,
	labelPosition?: FieldLabelPosition
): PreparedInputProps {
	// `type` and `display` pick the component in Form.svelte; they are not props.
	const { type, visible, ...rest } = input as FormFieldInput & { display?: string };
	void type;
	if ('display' in rest) delete (rest as { display?: string }).display;
	// Only include visible if it's a boolean, not a function
	const defaults = labelPosition ? { size, labelPosition } : { size };
	return typeof visible === 'boolean'
		? { ...defaults, ...rest, visible }
		: { ...defaults, ...rest };
}
