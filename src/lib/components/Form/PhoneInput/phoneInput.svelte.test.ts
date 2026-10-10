import '@testing-library/jest-dom/vitest';
import { screen } from '@testing-library/svelte';
import { describe, expect, test } from 'vitest';
import PhoneInput from './PhoneInput.svelte';
import { renderInTheme } from '../../Theme/renderInTheme.test-helper.js';

describe('PhoneInput password-manager interop', () => {
	test('leaves password managers and autofill enabled on the number input', () => {
		renderInTheme(PhoneInput, { label: 'Phone' });

		const input = document.querySelector('input[type="tel"]');
		expect(input).toBeInstanceOf(HTMLInputElement);
		expect(input).not.toHaveAttribute('data-1p-ignore');
		expect(screen.getByLabelText('Phone')).toBe(input);
	});
});
