// Native <form> participation shared by every Field: the `form` attribute for controls placed
// outside their form, and the form's `reset` event. Field wires both onto its root element;
// FieldHiddenInputs reads the same `form` attribute for the inputs it renders.
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import type { FieldType } from './field.js';
import type { FieldState } from './field.state.svelte.js';

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const formAttributes = new WeakMap<object, () => string | undefined>();

/** @internal Field registers the `form` prop it received for its controller. */
export const setFieldFormAttribute = (field: object, read: () => string | undefined): void => {
	formAttributes.set(field, read);
};

/** The id of the native form a field submits with, from its Field's `form` prop. */
export const getFieldFormAttribute = (field: object): string | undefined =>
	formAttributes.get(field)?.();

// Inputs, selects and textareas, plus the buttons that submit or reset on their own say-so. A
// button without a `type` is left alone: with a `form` attribute it would turn into a submit
// button of that form, and a button needs none to work as `type="button"`.
const formControls =
	'input, select, textarea, button[type="submit" i], button[type="reset" i], button[type="image" i]';

// Gives the form controls inside the field root the `form` attribute, now and as the control
// renders more of them (a hidden input per value). Controls that set their own `form` attribute
// keep it.
const mirrorFormAttribute = (root: HTMLElement, form: string) => {
	const marked: Element[] = [];
	const mark = () => {
		for (const element of root.querySelectorAll(formControls)) {
			if (element.hasAttribute('form')) continue;
			element.setAttribute('form', form);
			marked.push(element);
		}
	};
	mark();
	const observer = new MutationObserver(mark);
	observer.observe(root, { childList: true, subtree: true });
	return () => {
		observer.disconnect();
		for (const element of marked) {
			if (element.getAttribute('form') === form) element.removeAttribute('form');
		}
	};
};

// A field belongs to the form its `form` attribute names, else to the form around it.
const belongsTo = (field: object, root: HTMLElement, form: HTMLFormElement) => {
	const attribute = getFieldFormAttribute(field);
	return attribute ? root.ownerDocument.getElementById(attribute) === form : form.contains(root);
};

// The browser resets each control to its default (the `value`/`checked` attributes), which says
// nothing about the field: Svelte sets live properties, and it only writes them again when the
// value it renders changes. Pinning every default to the live state first turns the native reset
// into a no-op for the field's controls, so they always show what the field holds; the field then
// returns to its initial value and renders it.
// The text box of a combobox or a tags input holds a search draft, not the field's value: it is
// left to the native reset, which clears it like any text input, and the control's own binding
// follows.
const draftTypes: ReadonlySet<string> = new Set(['combobox', 'tag']);

const holdNativeState = (root: HTMLElement, form: HTMLFormElement, type: string) => {
	for (const element of root.querySelectorAll<FormControl>('input, select, textarea')) {
		if (element.form !== form) continue;
		if (element.localName === 'select') {
			for (const option of (element as HTMLSelectElement).options) {
				option.defaultSelected = option.selected;
			}
		} else if (element.type === 'checkbox' || element.type === 'radio') {
			(element as HTMLInputElement).defaultChecked = (element as HTMLInputElement).checked;
		} else if (element.type !== 'file' && !draftTypes.has(type)) {
			(element as HTMLInputElement | HTMLTextAreaElement).defaultValue = element.value;
		}
	}
};

/**
 * Field root attachment. A control rendered outside its form joins it through Field's `form`
 * prop, and a native reset of that form returns the field to the value it mounted with and
 * clears its errors, as the browser does for its own controls. The reset is cancelable by any
 * listener, so the field follows one task later, once the reset has run.
 */
export const fieldNativeForm =
	<T extends FieldType>(field: FieldState<T>): Attachment<HTMLElement> =>
	(root) => {
		// The value the field mounted with, read once its owners settled it: a Form applies its
		// `value` and entry defaults in an effect that runs before this one.
		let initialValue = untrack(() => field.value);
		$effect(() => {
			initialValue = untrack(() => field.value);
		});

		$effect(() => {
			const form = getFieldFormAttribute(field);
			if (form) return mirrorFormAttribute(root, form);
		});

		let timer: ReturnType<typeof setTimeout> | undefined;
		const onreset = (event: Event) => {
			const form = event.target as HTMLFormElement | null;
			if (form?.localName !== 'form' || !belongsTo(field, root, form)) return;
			holdNativeState(root, form, field.type);
			clearTimeout(timer);
			timer = setTimeout(() => {
				if (event.defaultPrevented) return;
				if (field.hasError) field.errors = [];
				field.touched = false;
				field.setValue(initialValue);
			});
		};
		// Capture on the document: the reset reaches it first, and a form attribute can name a form
		// the field is not inside.
		const doc = root.ownerDocument;
		doc.addEventListener('reset', onreset, true);
		return () => {
			clearTimeout(timer);
			doc.removeEventListener('reset', onreset, true);
		};
	};
