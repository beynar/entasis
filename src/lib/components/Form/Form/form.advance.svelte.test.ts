import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import type { FormState } from './form.state.svelte.js';
import FormAdvanceHarness from './FormAdvanceHarness.test.svelte';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const nameInput = () => screen.getByRole('textbox', { name: 'Name' });
const notesInput = () => screen.getByRole('textbox', { name: 'Notes' });
const subscribe = () => screen.getByRole('checkbox', { name: 'Subscribe' });

const mount = (props: { notesDisabled?: boolean; onSubmit?: (value: unknown) => void } = {}) => {
	let form: FormState | undefined;
	const onNativeSubmit = vi.fn();
	render(FormAdvanceHarness, {
		props: {
			...props,
			onNativeSubmit,
			get form() {
				return form;
			},
			set form(next) {
				form = next;
			}
		}
	});
	return { form: () => form!, onNativeSubmit };
};

describe('FormState.advanceFrom', () => {
	test('Enter on a choice control moves to the next field without changing it', async () => {
		mount();
		await fireEvent.input(nameInput(), { target: { value: 'Ada' } });
		subscribe().focus();

		await fireEvent.keyDown(subscribe(), { key: 'Enter' });
		expect(notesInput()).toHaveFocus();
		expect(subscribe()).toHaveAttribute('aria-checked', 'false');
	});

	test('an invalid field keeps focus and shows its errors', async () => {
		const { form } = mount();
		const name = form().fields.get('name')!;

		expect(form().advanceFrom(name)).toBe(true);
		expect(nameInput()).toHaveFocus();
		await waitFor(() => expect(nameInput()).toHaveAttribute('aria-invalid', 'true'));
	});

	test('the last navigable field submits the form', async () => {
		const onSubmit = vi.fn();
		const { form } = mount({ notesDisabled: true, onSubmit });
		await fireEvent.input(nameInput(), { target: { value: 'Ada' } });
		subscribe().focus();

		// Notes is disabled and Hidden is not visible: Subscribe is the last field.
		await fireEvent.keyDown(subscribe(), { key: 'Enter' });
		await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
		expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ada' }));
		expect(form().advanceFrom(form().fields.get('subscribe')!)).toBe(true);
	});

	test('returns false for a field that takes no part in navigation', () => {
		const { form } = mount({ notesDisabled: true });
		expect(form().advanceFrom(form().fields.get('notes')!)).toBe(false);
	});

	test('outside an entasis Form, Enter falls back to the native form submit', async () => {
		const { onNativeSubmit } = mount();
		await fireEvent.keyDown(screen.getByRole('checkbox', { name: 'Native choice' }), {
			key: 'Enter'
		});
		expect(onNativeSubmit).toHaveBeenCalledOnce();
	});

	test('Enter in a text field still validates and moves on', async () => {
		mount();
		nameInput().focus();
		await fireEvent.keyDown(nameInput(), { key: 'Enter' });
		expect(nameInput()).toHaveFocus();
		await waitFor(() => expect(nameInput()).toHaveAttribute('aria-invalid', 'true'));

		await fireEvent.input(nameInput(), { target: { value: 'Ada' } });
		await fireEvent.keyDown(nameInput(), { key: 'Enter' });
		expect(subscribe()).toHaveFocus();
	});
});
