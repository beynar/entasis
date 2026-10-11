// Field interaction state in real engines: focus that moves into a popup the field opened, a
// control disabled or removed while focused (Chromium sends no blur), and label clicks.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../../Theme/ThemeProviderHarness.test.svelte';
import FieldHarness from './FieldHarness.test.svelte';
import type { FieldState } from './field.state.svelte.js';
import type { FieldType } from './field.js';

type HarnessProps = NonNullable<Parameters<typeof FieldHarness>[1]>;

const mountField = async (props: HarnessProps = {}) => {
	let field!: FieldState<FieldType>;
	const view = await render(ThemeProviderHarness, {
		props: {
			component: FieldHarness as unknown as Component<Record<string, unknown>>,
			...props,
			onField: (next: FieldState<FieldType>) => {
				field = next;
			}
		}
	});
	return { ...view, field };
};

test('focus inside a popup the field opened does not count as leaving the field', async () => {
	const { field } = await mountField({ scenario: 'popup' });
	const root = page.getByTestId('field-root');
	await userEvent.click(page.getByTestId('control'));
	await expect.element(root).toHaveAttribute('data-focused');

	await userEvent.click(page.getByRole('button', { name: 'Suggestions' }));
	const inside = page.getByRole('button', { name: 'Inside popup' });
	await expect.element(inside).toBeVisible();
	// WebKit does not focus a clicked button, so move focus the way a Tab into the panel would.
	(inside.element() as HTMLElement).focus();
	await expect.element(inside).toHaveFocus();
	expect(field.focused).toBe(true);
	expect(field.touched).toBe(false);

	(page.getByRole('button', { name: 'After' }).element() as HTMLElement).focus();
	await expect.poll(() => field.focused).toBe(false);
	expect(field.touched).toBe(true);
	await expect.element(root).toHaveAttribute('data-touched');
	await expect.element(root).not.toHaveAttribute('data-focused');
});

test('a focused control that becomes disabled stops reporting focus', async () => {
	const { field, rerender } = await mountField();
	await userEvent.click(page.getByTestId('control'));
	await expect.poll(() => field.focused).toBe(true);
	await rerender({ disabled: true });
	await expect.poll(() => field.focused).toBe(false);
});

test('a focused control that is removed stops reporting focus', async () => {
	const { field, rerender } = await mountField();
	await userEvent.click(page.getByTestId('control'));
	await expect.poll(() => field.focused).toBe(true);
	await rerender({ showControl: false });
	await expect.poll(() => field.focused).toBe(false);
});

test('clicking a labelFor={false} label focuses the control', async () => {
	await mountField({ labelFor: false, controlRole: 'combobox' });
	await userEvent.click(page.getByText('Name'));
	await expect.element(page.getByTestId('control')).toHaveFocus();
});
