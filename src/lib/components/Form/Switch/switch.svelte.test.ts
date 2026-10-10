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
const nativeSwitch = () => within(nativeForm()).getByRole('switch');
const submitNative = () => nativeForm().requestSubmit();

describe('Switch native form participation', () => {
	test('submits its name with "true" only while it is on', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit } });

		submitNative();
		expect(onNativeSubmit).toHaveBeenCalledTimes(1);
		expect(onNativeSubmit.mock.calls[0][0].has('alerts')).toBe(false);

		await fireEvent.click(nativeSwitch());
		submitNative();
		expect(onNativeSubmit.mock.calls[1][0].getAll('alerts')).toEqual(['true']);

		await fireEvent.click(nativeSwitch());
		submitNative();
		expect(onNativeSubmit.mock.calls[2][0].has('alerts')).toBe(false);
	});

	test('submits a custom inputValue', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, inputValue: '1' } });

		await fireEvent.click(nativeSwitch());
		submitNative();
		expect(onNativeSubmit.mock.calls[0][0].get('alerts')).toBe('1');
	});

	test('a required switch that is off blocks native submission and reports on the switch', async () => {
		const onNativeSubmit = vi.fn();
		render(SwitchForms, { props: { onNativeSubmit, nativeRequired: true } });
		const hiddenInput = nativeForm().querySelector<HTMLInputElement>('input[name="alerts"]');
		expect(hiddenInput).toBeRequired();

		submitNative();
		expect(onNativeSubmit).not.toHaveBeenCalled();
		expect(nativeSwitch()).toHaveFocus();
		await waitFor(() => expect(nativeSwitch()).toHaveAttribute('aria-invalid', 'true'));
		expect(within(nativeForm()).getByRole('alert')).toBeInTheDocument();

		await fireEvent.click(nativeSwitch());
		submitNative();
		expect(onNativeSubmit).toHaveBeenCalledOnce();
		expect(onNativeSubmit.mock.calls[0][0].get('alerts')).toBe('true');
	});
});

test('several required switches that are off focus the first one, as the browser would', async () => {
	render(SwitchForms, { props: { nativeRequired: true, secondRequired: true } });
	const [alerts, updates] = within(nativeForm()).getAllByRole('switch');

	submitNative();
	expect(alerts).toHaveFocus();
	await waitFor(() => expect(updates).toHaveAttribute('aria-invalid', 'true'));
	expect(alerts).toHaveAttribute('aria-invalid', 'true');

	// The next validation pass is independent of the previous one.
	await fireEvent.click(alerts);
	submitNative();
	expect(updates).toHaveFocus();
});

describe('Switch required validation', () => {
	const formSwitch = () => screen.getByRole('switch', { name: 'Accept the terms' });
	const submitForm = () => fireEvent.click(screen.getByRole('button', { name: 'Submit form' }));

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
});
