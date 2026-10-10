import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import * as v from 'valibot';
import PasswordInput from './Password.svelte';
import PasswordForm from './PasswordForm.test.svelte';
import CustomPasswordField from './CustomPasswordField.test.svelte';
import { fieldSchemas } from '../Field/index.js';
import type { FormState } from '../Form/form.state.svelte.js';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';
import { fr } from '$lib/i18n/fr.js';

const scrollIntoView = Element.prototype.scrollIntoView;
beforeAll(() => {
	Element.prototype.scrollIntoView = vi.fn();
});
afterAll(() => {
	Element.prototype.scrollIntoView = scrollIntoView;
});

const passwordInput = () => screen.getByLabelText('Password') as HTMLInputElement;

const submitPassword = async (password: string) => {
	await fireEvent.input(passwordInput(), { target: { value: password } });
	await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
};

describe('PasswordInput password-manager interop', () => {
	test('leaves password managers enabled by default', () => {
		renderInTheme(PasswordInput, { label: 'Password' });

		expect(passwordInput()).not.toHaveAttribute('data-1p-ignore');
		expect(passwordInput()).not.toHaveAttribute('autocomplete');
	});

	test('renders the autocomplete hint', () => {
		renderInTheme(PasswordInput, { label: 'Password', autocomplete: 'current-password' });

		expect(passwordInput()).toHaveAttribute('autocomplete', 'current-password');
	});

	test('forwards native attributes and events through inputAttrs', async () => {
		const onkeydown = vi.fn();
		renderInTheme(PasswordInput, {
			label: 'Password',
			autocomplete: 'new-password',
			inputAttrs: { 'data-1p-ignore': true, maxlength: 64, onkeydown }
		});

		const input = passwordInput();
		expect(input).toHaveAttribute('data-1p-ignore');
		expect(input).toHaveAttribute('maxlength', '64');
		expect(input).toHaveAttribute('autocomplete', 'new-password');
		expect(input).toHaveAttribute('type', 'password');
		await fireEvent.keyDown(input, { key: 'a' });
		expect(onkeydown).toHaveBeenCalledOnce();
	});

	test('keeps the value binding when inputAttrs supplies its own input handler', async () => {
		const oninput = vi.fn();
		const onValueChange = vi.fn();
		renderInTheme(PasswordInput, { label: 'Password', inputAttrs: { oninput }, onValueChange });

		await fireEvent.input(passwordInput(), { target: { value: 'hunter22' } });

		expect(oninput).toHaveBeenCalledOnce();
		expect(onValueChange).toHaveBeenCalledExactlyOnceWith('hunter22');
	});
});

describe('PasswordInput minimum length', () => {
	test('accepts a short saved password on a current-password field', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, { props: { autocomplete: 'current-password', onSubmit } });

		await submitPassword('abc');

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ password: 'abc' }));
		expect(screen.queryByRole('alert')).not.toBeInTheDocument();
	});

	test('keeps the six-character default and reports it from the catalog', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, { props: { onSubmit } });

		await submitPassword('abc');

		const alert = await screen.findByRole('alert');
		expect(alert).toHaveTextContent('Password must be at least 6 characters');
		expect(alert).not.toHaveTextContent('Invalid length');
		expect(onSubmit).not.toHaveBeenCalled();

		await submitPassword('abcdef');
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ password: 'abcdef' }));
	});

	test('applies an explicit minLength, even on a current-password field', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, {
			props: { autocomplete: 'current-password', minLength: 8, onSubmit }
		});

		await submitPassword('abcdefg');

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Password must be at least 8 characters'
		);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('drops the rule with minLength 0', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, { props: { autocomplete: 'new-password', minLength: 0, onSubmit } });

		await submitPassword('a');

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ password: 'a' }));
	});

	test('reports one message for a cleared required password', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, { props: { onSubmit } });

		await fireEvent.input(passwordInput(), { target: { value: 'a' } });
		await submitPassword('');

		const alert = await screen.findByRole('alert');
		// Only the presence message: the length rule waits for a value.
		expect(alert.childElementCount).toBe(1);
		expect(alert).not.toHaveTextContent('at least 6');
		expect(alert).not.toHaveTextContent('>=6');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('skips the rule for an empty optional password', async () => {
		const onSubmit = vi.fn();
		render(PasswordForm, { props: { required: false, onSubmit } });

		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ password: null }));
	});

	test('runs onValidate only once the length rule passes', async () => {
		const onSubmit = vi.fn();
		const onValidate = vi.fn((value: string) => (/\d/.test(value) ? null : 'Add a digit'));
		render(PasswordForm, { props: { onValidate, onSubmit } });

		await submitPassword('abc');
		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Password must be at least 6 characters'
		);
		expect(onValidate).not.toHaveBeenCalled();

		await submitPassword('abcdefg');
		await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Add a digit'));
		expect(onValidate).toHaveBeenCalledWith('abcdefg');
		expect(onSubmit).not.toHaveBeenCalled();
	});

	test('uses the active locale for the length message', async () => {
		render(PasswordForm, { props: { messages: fr, onSubmit: vi.fn() } });

		await submitPassword('abc');

		expect(await screen.findByRole('alert')).toHaveTextContent(
			'Le mot de passe doit contenir au moins 6 caractères'
		);
	});
});

describe('PasswordInput minimum and the shared password schema', () => {
	test('reports the same validity from isValid as from validation', async () => {
		let form: FormState | undefined;
		render(PasswordForm, { props: { onSubmit: vi.fn(), onForm: (state) => (form = state) } });
		await fireEvent.input(passwordInput(), { target: { value: 'abc' } });

		const field = form?.fields.get('password');
		expect(field?.isValid).toBe(false);
		expect(field?.validate()[0]).toBe(true);

		await fireEvent.input(passwordInput(), { target: { value: 'abcdef' } });
		expect(field?.isValid).toBe(true);
	});

	test('a current-password field is valid with a short saved password', async () => {
		let form: FormState | undefined;
		render(PasswordForm, {
			props: {
				autocomplete: 'current-password',
				onSubmit: vi.fn(),
				onForm: (state) => (form = state)
			}
		});
		await fireEvent.input(passwordInput(), { target: { value: 'abc' } });

		expect(form?.fields.get('password')?.isValid).toBe(true);
	});

	test('the public fieldSchemas keep the 6-character minimum', () => {
		expect(v.safeParse(fieldSchemas.required.password, 'abc').success).toBe(false);
		expect(v.safeParse(fieldSchemas.required.password, 'abcdef').success).toBe(true);
		expect(v.safeParse(fieldSchemas.optional.password, 'abc').success).toBe(false);
		expect(v.safeParse(fieldSchemas.optional.password, '').success).toBe(true);
	});

	test('a custom password control keeps the 6-character minimum', async () => {
		let form: FormState | undefined;
		const onSubmit = vi.fn();
		render(CustomPasswordField, { props: { onSubmit, onForm: (state) => (form = state) } });

		await fireEvent.input(screen.getByLabelText('Secret'), { target: { value: 'a' } });
		expect(form?.fields.get('secret')?.isValid).toBe(false);
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		expect(await screen.findByRole('alert')).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();

		await fireEvent.input(screen.getByLabelText('Secret'), { target: { value: 'abcdef' } });
		await fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ secret: 'abcdef' }));
	});
});
