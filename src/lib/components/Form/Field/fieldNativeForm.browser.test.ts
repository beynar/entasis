// Native form behaviour that needs a real engine: interactive constraint validation focuses the
// first invalid control and shows a bubble, a reset button resets the form, Enter is a trusted
// key press. Chromium and WebKit.
import { expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { requestNativeSubmit } from '$lib/utils/requestNativeSubmit.js';
import HiddenInputsForm from './HiddenInputsForm.test.svelte';
import NativeFormHarness from './NativeFormHarness.test.svelte';

const form = () => page.getByTestId('form').element() as HTMLFormElement;
const entries = () =>
	[...new FormData(form()).entries()].map(([key, value]) => `${key}=${String(value)}`);

test('a blocked submit lands on the visible control, which shows the field error', async () => {
	const onSubmit = vi.fn();
	render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true, onSubmit } });
	const control = page.getByTestId('control');

	await userEvent.click(page.getByRole('button', { name: 'Save' }));
	await expect.poll(() => document.activeElement).toBe(control.element());
	await expect.element(control).toHaveAttribute('aria-invalid', 'true');
	await expect.element(page.getByRole('alert')).toBeVisible();
	expect(onSubmit).not.toHaveBeenCalled();

	await userEvent.click(control);
	await userEvent.click(page.getByRole('button', { name: 'Save' }));
	expect(onSubmit).toHaveBeenCalledOnce();
});

test('an empty required multi-value field reports through its control too', async () => {
	render(HiddenInputsForm, {
		props: { mode: 'values', name: 'colors', value: [], required: true }
	});
	const control = page.getByTestId('control');
	expect(form().reportValidity()).toBe(false);
	await expect.poll(() => document.activeElement).toBe(control.element());
});

test('the reportable input sits where the control is, so reporting it scrolls nowhere else', async () => {
	render(HiddenInputsForm, { props: { name: 'terms', value: false, required: true } });
	const input = document.querySelector<HTMLInputElement>('[data-field-hidden-input]')!;
	const field = input.closest('[id$="-field"]')!.getBoundingClientRect();
	const box = input.getBoundingClientRect();
	expect(box.width).toBeLessThanOrEqual(1);
	expect(box.top).toBeGreaterThanOrEqual(field.top - 1);
	expect(box.bottom).toBeLessThanOrEqual(field.bottom + 1);
});

test('a reset button returns the built-in controls to their initial values', async () => {
	render(NativeFormHarness, { props: { switchDefault: true } });
	const initial = entries();
	const name = page.getByRole('textbox', { name: 'Name' });
	await userEvent.fill(name, 'Grace');
	await userEvent.click(page.getByRole('switch', { name: 'Alerts' }));
	await userEvent.click(page.getByRole('checkbox', { name: 'Green' }));
	expect(entries()).not.toEqual(initial);

	await userEvent.click(page.getByRole('button', { name: 'Reset' }));
	await expect.poll(entries).toEqual(initial);
	await expect.element(name).toHaveValue('Ada');
	await expect
		.element(page.getByRole('switch', { name: 'Alerts' }))
		.toHaveAttribute('aria-checked', 'true');
	await expect
		.element(page.getByRole('checkbox', { name: 'Green' }))
		.toHaveAttribute('aria-checked', 'false');
});

test('Enter on a custom control submits through the default button', async () => {
	const onSubmit = vi.fn();
	render(HiddenInputsForm, { props: { name: 'alerts', value: true, onSubmit } });
	const control = page.getByTestId('control').element() as HTMLElement;
	control.addEventListener('keydown', (event) => {
		if (event.key !== 'Enter') return;
		event.preventDefault();
		requestNativeSubmit(event.currentTarget as Element);
	});
	control.focus();

	await userEvent.keyboard('{Enter}');
	expect(onSubmit).toHaveBeenCalledOnce();
	expect(control).toHaveAttribute('aria-pressed', 'true');
	expect((onSubmit.mock.calls[0][0] as FormData).get('alerts')).toBe('yes');
});
