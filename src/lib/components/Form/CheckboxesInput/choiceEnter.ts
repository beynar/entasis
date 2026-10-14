// Enter on a choice control. A native checkbox or radio does not toggle on Enter: it submits its
// form through the form's default button, as a text field does. Checkbox, CheckboxesInput and
// RadioInput are buttons, so they mirror that here: inside an entasis Form Enter moves on to the
// next field (the last one submits), and inside a plain <form> it requests the native submission.
import { requestNativeSubmit } from '$lib/utils/requestNativeSubmit.js';
import type { FieldType } from '../Field/field.js';
import type { FieldState } from '../Field/field.state.svelte.js';

/**
 * Handles a plain Enter key press on a choice control's element: the toggle or selection is left
 * alone and the form moves on instead. Returns whether the key was handled, so a caller can skip
 * its own work. A key a handler already cancelled, a repeat, an IME composition and a press with
 * a modifier are not handled.
 */
export const continueFormFromChoice = <T extends FieldType>(
	event: KeyboardEvent & { currentTarget: EventTarget & Element },
	field: FieldState<T>
): boolean => {
	if (
		event.key !== 'Enter' ||
		event.defaultPrevented ||
		event.repeat ||
		event.isComposing ||
		event.shiftKey ||
		event.altKey ||
		event.ctrlKey ||
		event.metaKey
	) {
		return false;
	}
	event.preventDefault();
	if (!field.form?.advanceFrom(field)) requestNativeSubmit(event.currentTarget);
	return true;
};
