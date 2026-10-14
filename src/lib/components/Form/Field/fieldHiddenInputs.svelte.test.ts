import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import HiddenInputsForm from './HiddenInputsForm.test.svelte';

const form = () => screen.getByTestId('form') as HTMLFormElement;
const entries = (target = form()) =>
	[...new FormData(target).entries()].map(([key, value]) => `${key}=${String(value)}`);
const control = (name = 'Control') => screen.getByRole('button', { name });
const hiddenInputs = () =>
	Array.from(document.querySelectorAll<HTMLInputElement>('[data-field-hidden-input]'));
const reportable = () => hiddenInputs().find((input) => input.type !== 'hidden')!;
const fieldOf = (element: HTMLElement) => element.closest('[id$="-field"]') as HTMLElement;

afterEach(() => {
	vi.restoreAllMocks();
});

describe('FieldHiddenInputs: checked', () => {
	test('submits its value only while checked, like a native checkbox', async () => {
		render(HiddenInputsForm, { props: { name: 'alerts', value: false } });
		expect(entries()).toEqual([]);

		await fireEvent.click(control());
		expect(entries()).toEqual(['alerts=yes']);
		await fireEvent.click(control());
		expect(entries()).toEqual([]);
	});

	test('a field without a name submits nothing: the generated name never leaks', async () => {
		render(HiddenInputsForm, { props: { value: true } });
		expect(reportable()).not.toHaveAttribute('name');
		expect(entries()).toEqual([]);
	});

	test('sits beside the control, out of the tab order and the accessibility tree', () => {
		render(HiddenInputsForm, { props: { name: 'alerts', value: false } });
		const input = reportable();
		expect(input.closest('button')).toBeNull();
		expect(input).toHaveAttribute('tabindex', '-1');
		expect(input).toHaveAttribute('aria-hidden', 'true');
		expect(input).not.toHaveAttribute('hidden');
		expect(input.id).toMatch(/-input$/);
	});

	test('a change that reaches the input directly is undone: the input mirrors the field', async () => {
		render(HiddenInputsForm, { props: { name: 'alerts', value: false } });
		await fireEvent.click(reportable());
		expect(reportable().checked).toBe(false);
		expect(control()).toHaveAttribute('aria-pressed', 'false');
	});
});

describe('FieldHiddenInputs: values', () => {
	test('one input per value under the same name, in order', async () => {
		render(HiddenInputsForm, { props: { mode: 'values', name: 'colors', value: ['red'] } });
		await fireEvent.click(control());
		expect(new FormData(form()).getAll('colors')).toEqual(['red', 'green']);
		expect(hiddenInputs().every((input) => input.type === 'hidden')).toBe(true);
	});

	test('null submits nothing, an empty string submits an empty value', async () => {
		const { rerender } = render(HiddenInputsForm, {
			props: { mode: 'values', name: 'plan', value: null }
		});
		expect(entries()).toEqual([]);
		await rerender({ value: '' });
		expect(entries()).toEqual(['plan=']);
		await rerender({ value: 'pro' });
		expect(entries()).toEqual(['plan=pro']);
	});

	test('disabled values are left out of the form', async () => {
		render(HiddenInputsForm, {
			props: { mode: 'values', name: 'colors', value: ['red'], disabled: true }
		});
		expect(entries()).toEqual([]);
		expect(form().checkValidity()).toBe(true);
	});
});

describe('FieldHiddenInputs: required', () => {
	test('an unchecked required field blocks the native submit until it is checked', async () => {
		const onSubmit = vi.fn();
		render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true, onSubmit } });
		expect(reportable()).toBeRequired();

		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(onSubmit).not.toHaveBeenCalled();

		await fireEvent.click(control());
		await fireEvent.click(screen.getByRole('button', { name: 'Save' }));
		expect(onSubmit).toHaveBeenCalledOnce();
	});

	test('an empty required multi-value field blocks the submit through a nameless input', async () => {
		render(HiddenInputsForm, {
			props: { mode: 'values', name: 'colors', value: [], required: true }
		});
		const proxy = reportable();
		expect(proxy).toBeRequired();
		expect(proxy).not.toHaveAttribute('name');
		expect(form().checkValidity()).toBe(false);
		expect(entries()).toEqual([]);

		await fireEvent.click(control());
		expect(reportable()).toBeUndefined();
		expect(form().checkValidity()).toBe(true);
		expect(entries()).toEqual(['colors=red']);
	});

	test('the report moves to the control: it takes focus and shows the field error', async () => {
		render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true } });

		// A blocked submit (or reportValidity) focuses the first invalid control, as here.
		reportable().focus();
		await waitFor(() => expect(control()).toHaveFocus());
		expect(control()).toHaveAttribute('aria-invalid', 'true');
		expect(within(fieldOf(control())).getByRole('alert')).toBeInTheDocument();
	});

	test("the browser's bubble has no message: the field's error is the only one", async () => {
		render(HiddenInputsForm, {
			props: { mode: 'values', name: 'colors', value: [], required: true }
		});
		const proxy = reportable();
		expect(proxy.validationMessage.trim()).toBe('');
		expect(proxy.validity.valueMissing).toBe(true);
		expect(proxy.validity.valid).toBe(false);
	});

	test('a silent checkValidity() moves no focus and shows no error', async () => {
		render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true } });
		screen.getByRole('button', { name: 'Save' }).focus();

		expect(form().checkValidity()).toBe(false);
		await new Promise((resolve) => setTimeout(resolve));
		expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
		expect(control()).not.toHaveAttribute('aria-invalid');
	});

	test('the invalid event is never cancelled, so the browser still picks the first one', () => {
		render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true } });
		const invalid = new Event('invalid', { cancelable: true });
		reportable().dispatchEvent(invalid);
		expect(invalid.defaultPrevented).toBe(false);
	});
});

describe('FieldHiddenInputs: form attribute', () => {
	test("inputs carry Field's form prop", () => {
		render(HiddenInputsForm, {
			props: { mode: 'values', name: 'colors', value: ['red'], form: 'elsewhere' }
		});
		expect(hiddenInputs()[0]).toHaveAttribute('form', 'elsewhere');
		expect(entries()).toEqual([]);
		expect(entries(screen.getByTestId('elsewhere') as HTMLFormElement)).toEqual(['colors=red']);
	});

	test('an explicit form prop wins', () => {
		render(HiddenInputsForm, {
			props: { name: 'alerts', value: true, form: 'native', hiddenForm: 'elsewhere' }
		});
		expect(reportable()).toHaveAttribute('form', 'elsewhere');
	});
});

describe('FieldHiddenInputs: autofill', () => {
	const options = [
		{ value: 'ca', label: 'Canada' },
		{ value: 'ci', label: "Côte d'Ivoire" }
	];
	const autofill = async (text: string) => {
		const input = reportable();
		input.value = text;
		await fireEvent.input(input);
		await fireEvent.change(input);
	};

	test('a text input the browser can fill, carrying the name and autocomplete token', () => {
		render(HiddenInputsForm, {
			props: { mode: 'autofill', name: 'country', value: 'ca', autocomplete: 'country', options }
		});
		const input = reportable();
		expect(input.type).toBe('text');
		expect(input).toHaveAttribute('autocomplete', 'country');
		expect(entries()).toEqual(['country=ca']);
	});

	test('a filled label, or a value, selects its option', async () => {
		const onValueChange = vi.fn();
		render(HiddenInputsForm, {
			props: {
				mode: 'autofill',
				name: 'country',
				value: null,
				autocomplete: 'country',
				options,
				onValueChange
			}
		});

		await autofill('Canada');
		await waitFor(() => expect(entries()).toEqual(['country=ca']));
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('ca');

		await autofill('ci');
		await waitFor(() => expect(entries()).toEqual(['country=ci']));
	});

	test('labels match regardless of case and accents', async () => {
		render(HiddenInputsForm, {
			props: { mode: 'autofill', name: 'country', value: null, autocomplete: 'country', options }
		});
		await autofill("cote d'ivoire");
		await waitFor(() => expect(entries()).toEqual(['country=ci']));
	});

	test('text that names no option is ignored, and the input shows the value again', async () => {
		render(HiddenInputsForm, {
			props: { mode: 'autofill', name: 'country', value: 'ca', autocomplete: 'country', options }
		});
		await autofill('Atlantis');
		await waitFor(() => expect(reportable()).toHaveValue('ca'));
		expect(entries()).toEqual(['country=ca']);
	});

	test('read-only and disabled fields ignore autofill', async () => {
		const { rerender } = render(HiddenInputsForm, {
			props: {
				mode: 'autofill',
				name: 'country',
				value: 'ca',
				autocomplete: 'country',
				options,
				readOnly: true
			}
		});
		await autofill('ci');
		await waitFor(() => expect(reportable()).toHaveValue('ca'));

		await rerender({ readOnly: false, disabled: true });
		await autofill('ci');
		await waitFor(() => expect(reportable()).toHaveValue('ca'));
	});

	test('onAutofill receives the matched value instead of the field', async () => {
		const onAutofill = vi.fn();
		render(HiddenInputsForm, {
			props: {
				mode: 'autofill',
				name: 'country',
				value: null,
				autocomplete: 'country',
				options,
				onAutofill
			}
		});
		await autofill('Canada');
		expect(onAutofill).toHaveBeenCalledExactlyOnceWith('ca');
		await waitFor(() => expect(reportable()).toHaveValue(''));
	});
});

describe('FieldHiddenInputs: placement', () => {
	test('warns in development when rendered inside a button', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		render(HiddenInputsForm, { props: { name: 'alerts', value: false, insideButton: true } });
		expect(warn).toHaveBeenCalledWith(expect.stringContaining('inside a <button>'));
	});
});
