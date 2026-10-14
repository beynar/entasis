// Implicit submission for custom controls. A native checkbox or radio submits its form on Enter
// through the form's default button, the way a text field does, and does nothing when the form has
// none (or when that button is disabled). Controls built on buttons and divs mirror that here.

/** A form-associated element: its `form` property is its form owner, `form` attribute included. */
type FormAssociatedElement = Element & { form: HTMLFormElement | null };

const isFormAssociated = (element: Element): element is FormAssociatedElement =>
	'form' in element && element.localName !== 'form';

/**
 * The form an element submits with: its form owner when it is a form control (which honours a
 * `form` attribute, and is null when that attribute names no form), else the closest ancestor form.
 */
export const getNativeForm = (element: Element | null | undefined): HTMLFormElement | null => {
	if (!element) return null;
	if (element.localName === 'form') return element as HTMLFormElement;
	if (isFormAssociated(element) && (element.form || element.hasAttribute('form'))) {
		return element.form;
	}
	return element.closest('form');
};

/**
 * The button a browser clicks for implicit submission: the first submit button of the form in tree
 * order, counting buttons placed outside it with a `form` attribute. It may be disabled.
 */
export const getDefaultSubmitter = (
	form: HTMLFormElement | null
): HTMLButtonElement | HTMLInputElement | null => {
	if (!form) return null;
	for (const element of Array.from(form.elements)) {
		if (
			(element.localName === 'button' || element.localName === 'input') &&
			(element as HTMLButtonElement | HTMLInputElement).type === 'submit'
		) {
			return element as HTMLButtonElement | HTMLInputElement;
		}
	}
	return null;
};

/**
 * Submits the form that owns `element` as Enter does on a native checkbox: by clicking the form's
 * default button, so its click handlers, `formaction`/`formmethod` and `SubmitEvent.submitter` all
 * take part and constraint validation runs. Without an enabled default button nothing happens,
 * like a native checkbox. Returns whether a submission was requested.
 */
export const requestNativeSubmit = (element: Element | null | undefined): boolean => {
	const submitter = getDefaultSubmitter(getNativeForm(element));
	// `:disabled` also covers a button inside a disabled fieldset, which `.disabled` misses.
	if (!submitter || submitter.matches(':disabled')) return false;
	submitter.click();
	return true;
};
