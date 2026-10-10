import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import TextInput from './TextInput.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';

describe('TextInput password-manager interop', () => {
	test('leaves password managers and autofill enabled by default', () => {
		renderInTheme(TextInput, { label: 'Email', type: 'email' });

		expect(screen.getByRole('textbox', { name: 'Email' })).not.toHaveAttribute('data-1p-ignore');
	});

	test('honours an opt-out passed through inputAttrs', () => {
		renderInTheme(TextInput, {
			label: 'Search the docs',
			inputAttrs: { 'data-1p-ignore': true, autocomplete: 'off' }
		});

		const input = screen.getByRole('textbox', { name: 'Search the docs' });
		expect(input).toHaveAttribute('data-1p-ignore');
		expect(input).toHaveAttribute('autocomplete', 'off');
	});

	test('forwards the autocomplete token a sign-in form needs', () => {
		renderInTheme(TextInput, {
			label: 'Email',
			type: 'email',
			inputAttrs: { autocomplete: 'username' }
		});

		expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute(
			'autocomplete',
			'username'
		);
	});
});
