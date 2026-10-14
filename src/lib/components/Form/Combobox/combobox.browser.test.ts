// Combobox and TagsInput in real engines: where focus goes on Escape, on a choice, on a press
// inside the list, and through the tab order.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import ComboboxDialogHarness from './ComboboxDialogHarness.test.svelte';
import ComboboxHarness from './ComboboxHarness.test.svelte';

const items = Array.from({ length: 30 }, (_, index) => ({
	value: `item-${index}`,
	label: `Item ${String(index).padStart(2, '0')}`
}));

const activeElement = () => document.activeElement as HTMLElement | null;
const input = () => page.getByRole('combobox', { name: 'Fruit' });

test('Escape closes the list and a choice by click keeps focus on the input', async () => {
	await render(ComboboxHarness, { props: { items } });
	await userEvent.click(input());
	await userEvent.keyboard('item');
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
	expect(activeElement()).toBe(input().element());
	await userEvent.keyboard('{ArrowDown}');
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await userEvent.click(page.getByRole('option', { name: 'Item 03' }));
	await expect.element(page.getByTestId('value')).toHaveTextContent('"item-3"');
	expect(activeElement()).toBe(input().element());
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
});

test('a press on the list scrollbar or padding does not take focus off the input', async () => {
	await render(ComboboxHarness, { props: { items, openOnFocus: true } });
	await userEvent.click(input());
	const listbox = page.getByRole('listbox');
	await expect.element(listbox).toBeVisible();
	const box = listbox.element().getBoundingClientRect();
	// The right edge of the list: padding and the scrollbar track.
	document
		.elementFromPoint(box.right - 2, box.top + 10)
		?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
	expect(activeElement()).toBe(input().element());
	await expect.element(listbox).toBeVisible();
});

test('Tab leaves the field: the list holds no tab stop of its own', async () => {
	await render(ComboboxHarness, { props: { items, openOnFocus: true } });
	await userEvent.click(page.getByRole('button', { name: 'Before' }));
	await tab();
	await expect.element(input()).toHaveFocus();
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await tab();
	await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
});

test('Clear keeps focus in the input', async () => {
	await render(ComboboxHarness, { props: { items, defaultValue: 'item-2' } });
	await userEvent.click(page.getByRole('button', { name: 'Clear selection' }));
	await expect.element(page.getByTestId('value')).toHaveTextContent('null');
	expect(activeElement()).toBe(input().element());
});

test('TagsInput: the tags are one tab stop, between the previous control and the input', async () => {
	await render(ComboboxHarness, {
		props: {
			kind: 'tags',
			items,
			defaultValue: ['item-1', 'item-2', 'item-3']
		}
	});
	await userEvent.click(page.getByRole('button', { name: 'Before' }));
	await tab();
	const first = page.getByRole('button', { name: 'Remove Item 01' });
	await expect.element(first).toHaveFocus();
	await userEvent.keyboard('{ArrowRight}');
	await expect.element(page.getByRole('button', { name: 'Remove Item 02' })).toHaveFocus();
	await tab();
	await expect.element(input()).toHaveFocus();
	// Shift+Tab returns to the toolbar's single tab stop.
	await tab({ shift: true });
	const stops = Array.from(document.querySelectorAll('[role="toolbar"] button')).filter(
		(button) => button.getAttribute('tabindex') === '0'
	);
	expect(stops).toHaveLength(1);
	expect(document.activeElement).toBe(stops[0]);
	await userEvent.keyboard('{Backspace}');
	await expect.element(page.getByTestId('value')).toHaveTextContent('["item-2","item-3"]');
});

test('inside a Dialog, Escape closes the list, then clears the text, then closes the dialog', async () => {
	await render(ComboboxDialogHarness);
	await expect.element(page.getByRole('dialog')).toBeVisible();
	await userEvent.click(input());
	await userEvent.keyboard('an');
	await expect.element(page.getByRole('listbox')).toBeVisible();
	await userEvent.keyboard('{Escape}');
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
	await expect.element(page.getByTestId('dialog-open')).toHaveTextContent('true');
	expect(activeElement()).toBe(input().element());
	await userEvent.keyboard('{Escape}');
	await expect.element(input()).toHaveValue('');
	await expect.element(page.getByTestId('dialog-open')).toHaveTextContent('true');
	await userEvent.keyboard('{Escape}');
	await expect.element(page.getByTestId('dialog-open')).toHaveTextContent('false');
});
