// Validation on blur in real engines: opening the popup of a Select does not leave the field,
// and moving focus elsewhere does.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import type { FormInputs } from './form.js';
import FormValidationHarness from './FormValidationHarness.test.svelte';

const inputs = {
	plan: {
		type: 'select',
		label: 'Plan',
		required: true,
		items: [
			{ label: 'Free', value: 'free' },
			{ label: 'Pro', value: 'pro' }
		]
	},
	name: { type: 'text', label: 'Name' }
} as const;

test('blur validation ignores focus that moves into the popup the field opened', async () => {
	await render(FormValidationHarness, {
		props: { inputs: inputs as unknown as FormInputs, validationMode: 'blur' }
	});
	await userEvent.click(page.getByRole('combobox', { name: /Plan/ }));
	await expect.element(page.getByRole('option', { name: 'Free' })).toBeVisible();
	await new Promise((resolve) => setTimeout(resolve, 100));
	expect(document.querySelector('[role="alert"]')).toBeNull();

	await userEvent.keyboard('{Escape}');
	await new Promise((resolve) => setTimeout(resolve, 100));
	expect(document.querySelector('[role="alert"]')).toBeNull();

	await userEvent.click(page.getByRole('textbox', { name: /Name/ }));
	await expect.element(page.getByText('This field is required')).toBeVisible();
});

test('a text field validates when focus leaves it, and not before', async () => {
	await render(FormValidationHarness, {
		props: {
			inputs: { name: { type: 'text', label: 'Name', required: true } },
			validationMode: 'blur'
		}
	});
	const field = page.getByRole('textbox', { name: /Name/ });
	await userEvent.click(field);
	await userEvent.keyboard('a{Backspace}');
	await new Promise((resolve) => setTimeout(resolve, 100));
	expect(document.querySelector('[role="alert"]')).toBeNull();

	await userEvent.tab();
	await expect.element(page.getByText('This field is required')).toBeVisible();
});
