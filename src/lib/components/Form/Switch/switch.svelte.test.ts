import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import SwitchForms from './SwitchForms.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const nativeForm = () => screen.getByTestId('native-form') as HTMLFormElement;
const nativeSwitch = () => within(nativeForm()).getByRole('switch', { name: 'Alerts' });
const hiddenInput = (name = 'alerts') =>
	nativeForm().querySelector<HTMLInputElement>(`input[name="${name}"]`)!;
const saveButton = () => within(nativeForm()).getByRole('button', { name: 'Save native' });
const submitNative = () => fireEvent.click(saveButton());

describe('Switch native form participation', () => {
	test('submits its name with "true" only while it is on', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit } });

		await submitNative();
		expect(onNativeSubmit).toHaveBeenCalledTimes(1);
		expect(onNativeSubmit.mock.calls[0][0].has('alerts')).toBe(false);

		await fireEvent.click(nativeSwitch());
		await submitNative();
		expect(onNativeSubmit.mock.calls[1][0].getAll('alerts')).toEqual(['true']);

		await fireEvent.click(nativeSwitch());
		await submitNative();
		expect(onNativeSubmit.mock.calls[2][0].has('alerts')).toBe(false);
	});

	test('submits a custom inputValue', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, inputValue: '1' } });

		await fireEvent.click(nativeSwitch());
		await submitNative();
		expect(onNativeSubmit.mock.calls[0][0].get('alerts')).toBe('1');
	});

	test('a switch without a name submits nothing, like a checkbox without one', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, withUnnamed: true } });
		const unnamed = within(nativeForm()).getByRole('switch', { name: 'Advanced options' });

		await fireEvent.click(unnamed);
		expect(unnamed).toHaveAttribute('aria-checked', 'true');
		await submitNative();
		expect([...onNativeSubmit.mock.calls[0][0].keys()]).toEqual([]);
	});

	test('a required switch that is off blocks native submission', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, nativeRequired: true } });
		expect(hiddenInput()).toBeRequired();

		await submitNative();
		expect(onNativeSubmit).not.toHaveBeenCalled();

		await fireEvent.click(nativeSwitch());
		await submitNative();
		expect(onNativeSubmit).toHaveBeenCalledOnce();
		expect(onNativeSubmit.mock.calls[0][0].get('alerts')).toBe('true');
	});

	test('the hidden input stays reportable: focusable, out of the tab order and the a11y tree', () => {
		render(SwitchForms, { props: { nativeRequired: true } });
		const input = hiddenInput();

		expect(input).not.toHaveAttribute('hidden');
		expect(input).toHaveAttribute('tabindex', '-1');
		expect(input).toHaveAttribute('aria-hidden', 'true');
		// The browser picks the first invalid control to report: the switch never cancels that.
		const invalid = new Event('invalid', { cancelable: true });
		input.dispatchEvent(invalid);
		expect(invalid.defaultPrevented).toBe(false);
	});

	test('the browser report lands on the switch: it takes focus and shows its error', async () => {
		render(SwitchForms, { props: { nativeRequired: true } });

		// A blocked submit (or reportValidity) focuses the first invalid control, as here.
		hiddenInput().focus();
		await waitFor(() => expect(nativeSwitch()).toHaveFocus());
		await waitFor(() => expect(nativeSwitch()).toHaveAttribute('aria-invalid', 'true'));
		expect(within(nativeForm()).getByRole('alert')).toBeInTheDocument();
	});

	test("the browser's own bubble has no message to show: the switch's error is the only one", async () => {
		render(SwitchForms, { props: { nativeRequired: true } });
		const input = hiddenInput();

		input.focus();
		// Browsers trim the message before showing their bubble: a blank one shows nothing.
		expect(input.validationMessage.trim()).toBe('');
		// The constraint itself stays: the input is still invalid and still blocks the submit.
		expect(input).toBeRequired();
		expect(input.validity.valueMissing).toBe(true);
		expect(input.validity.valid).toBe(false);

		await waitFor(() => expect(nativeSwitch()).toHaveFocus());
		expect(nativeForm().checkValidity()).toBe(false);
		expect(within(nativeForm()).getByRole('alert')).toBeInTheDocument();
	});

	test('submits sent back to back while the report moves to the switch stay blocked', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, nativeRequired: true } });

		// The first blocked submit focuses the hidden input; the next ones follow in the same task.
		hiddenInput().focus();
		nativeForm().requestSubmit();
		nativeForm().requestSubmit();
		await submitNative();
		expect(onNativeSubmit).not.toHaveBeenCalled();

		await waitFor(() => expect(nativeSwitch()).toHaveFocus());
		await submitNative();
		expect(onNativeSubmit).not.toHaveBeenCalled();
	});

	test('the blank report clears with the constraint: an on or optional switch is valid', async () => {
		const { rerender } = render(SwitchForms, { props: { nativeRequired: true } });
		const input = hiddenInput();
		expect(input.validity.customError).toBe(true);

		await fireEvent.click(nativeSwitch());
		expect(input.validity.valid).toBe(true);
		expect(input.validationMessage).toBe('');

		await fireEvent.click(nativeSwitch());
		expect(input.validity.valid).toBe(false);
		await rerender({ nativeRequired: false });
		expect(input.validity.valid).toBe(true);
		expect(input.validity.customError).toBe(false);
	});

	test('a silent checkValidity() moves no focus and shows no error', async () => {
		render(SwitchForms, { props: { nativeRequired: true, secondRequired: true } });
		saveButton().focus();

		expect(nativeForm().checkValidity()).toBe(false);
		expect(hiddenInput('updates').checkValidity()).toBe(false);
		await Promise.resolve();
		expect(saveButton()).toHaveFocus();
		for (const control of within(nativeForm()).getAllByRole('switch')) {
			expect(control).not.toHaveAttribute('aria-invalid');
		}
		expect(within(nativeForm()).queryByRole('alert')).toBeNull();
	});
});

describe('Switch required validation', () => {
	const formSwitch = () => screen.getByRole('switch', { name: 'Accept the terms' });
	const submitForm = () => fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));

	test('a required switch is announced as required', () => {
		render(SwitchForms, { props: { nativeRequired: true } });
		expect(nativeSwitch()).toHaveAttribute('aria-required', 'true');
		expect(formSwitch()).toHaveAttribute('aria-required', 'true');
	});

	test('a switch that is not required carries no aria-required', () => {
		render(SwitchForms);
		expect(nativeSwitch()).not.toHaveAttribute('aria-required');
	});

	test('a required switch that is off fails Form validation until it is turned on', async () => {
		const onFormSubmit = vi.fn();
		render(SwitchForms, { props: { onFormSubmit } });

		await submitForm();
		expect(onFormSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(formSwitch()).toHaveAttribute('aria-invalid', 'true'));

		await fireEvent.click(formSwitch());
		await waitFor(() => expect(formSwitch()).not.toHaveAttribute('aria-invalid'));
		await submitForm();
		await waitFor(() => expect(onFormSubmit).toHaveBeenCalledWith({ terms: true }));
	});

	test('turning a required switch back off makes it invalid again', async () => {
		const onFormSubmit = vi.fn();
		render(SwitchForms, { props: { onFormSubmit, formDefaultValue: true } });

		await fireEvent.click(formSwitch());
		expect(formSwitch()).toHaveAttribute('aria-checked', 'false');
		await submitForm();
		expect(onFormSubmit).not.toHaveBeenCalled();
		await waitFor(() => expect(formSwitch()).toHaveAttribute('aria-invalid', 'true'));
	});

	test('an untouched and a turned-off required switch report the same error', async () => {
		const errorText = async () => {
			await submitForm();
			await waitFor(() => expect(formSwitch()).toHaveAttribute('aria-invalid', 'true'));
			const errorId = formSwitch().closest('[id$="-field"]')!.querySelector('[role="alert"]')!;
			return errorId.textContent?.trim();
		};

		const untouched = render(SwitchForms, { props: { formDefaultValue: null } });
		const untouchedError = await errorText();
		untouched.unmount();

		render(SwitchForms, { props: { formDefaultValue: true } });
		await fireEvent.click(formSwitch());
		const turnedOffError = await errorText();

		expect(untouchedError).toBe(turnedOffError);
		expect(untouchedError).not.toMatch(/Expected boolean/);
	});
});

describe('Switch inline label', () => {
	test('clicking the label text focuses the switch without toggling it', async () => {
		render(SwitchForms);
		const control = nativeSwitch();
		expect(control).not.toHaveFocus();

		await fireEvent.click(within(nativeForm()).getByText('Alerts'));

		expect(control).toHaveFocus();
		expect(control).toHaveAttribute('aria-checked', 'false');
	});

	test('a disabled switch ignores a label click', async () => {
		render(SwitchForms, { props: { nativeDisabled: true } });

		await fireEvent.click(within(nativeForm()).getByText('Alerts'));

		expect(nativeSwitch()).not.toHaveFocus();
		expect(nativeSwitch()).toHaveAttribute('aria-checked', 'false');
	});
});
