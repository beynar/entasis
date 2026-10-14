// Enter on a choice control. A native checkbox or radio does not toggle on Enter: it submits its
// form through the form's default button, as a text field does. Checkbox, CheckboxesInput and
// RadioInput are buttons, so they mirror that here: inside an entasis Form Enter moves on to the
// next field (the last one submits), and inside a plain <form> it requests the native submission.
import { requestNativeSubmit } from '$lib/utils/requestNativeSubmit.js';
import type { FieldType } from '../Field/field.js';
import type { FieldState } from '../Field/field.state.svelte.js';

/**
 * Handles an Enter key press on a choice control's element. Enter never toggles or selects, so
 * every Enter nobody cancelled is cancelled here (a button would click on it, and again on each
 * auto-repeat). Only a plain press moves the form on; a repeat, an IME composition and a press
 * with a modifier are swallowed without submitting. Returns whether the form was continued.
 */
export const continueFormFromChoice = <T extends FieldType>(
	event: KeyboardEvent & { currentTarget: EventTarget & Element },
	field: FieldState<T>
): boolean => {
	if (event.key !== 'Enter' || event.defaultPrevented) return false;
	event.preventDefault();
	if (
		event.repeat ||
		event.isComposing ||
		event.shiftKey ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey
	) {
		return false;
	}
	if (!field.form?.advanceFrom(field)) requestNativeSubmit(event.currentTarget);
	return true;
};
