// Autocomplete in real engines: the selected completion and what a key does to it, Enter in a
// form, the tab order, and what a native submit sends.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import AutocompleteHarness from './AutocompleteHarness.test.svelte';

const items = ['Apple', 'Apricot', 'Banana', 'Cherry'];
const input = () => page.getByRole('combobox', { name: 'Fruit' });
const element = () => input().element() as HTMLInputElement;
const selection = () => [element().selectionStart, element().selectionEnd];

test('typing completes with the untyped part selected, and the next key replaces it', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'both', autoHighlight: true } });
	await userEvent.click(input());
	await userEvent.keyboard('ap');
	await expect.poll(() => element().value).toBe('apple');
	expect(selection()).toEqual([2, 5]);
	// The value is still what was typed.
	await expect.element(page.getByTestId('value')).toHaveTextContent('"ap"');
	await userEvent.keyboard('r');
	await expect.poll(() => element().value).toBe('apricot');
	expect(selection()).toEqual([3, 7]);
});

test('Backspace removes the completion and leaves the typed text alone', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'both', autoHighlight: true } });
	await userEvent.click(input());
	await userEvent.keyboard('ap');
	await expect.poll(() => element().value).toBe('apple');
	await userEvent.keyboard('{Backspace}');
	await expect.poll(() => element().value).toBe('ap');
	await new Promise((resolve) => setTimeout(resolve, 50));
	expect(element().value).toBe('ap');
	await expect.element(page.getByTestId('value')).toHaveTextContent('"ap"');
});

test('Escape puts the typed text back and closes the list; focus stays', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'both', autoHighlight: true } });
	await userEvent.click(input());
	await userEvent.keyboard('ban');
	await expect.poll(() => element().value).toBe('banana');
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => element().value).toBe('ban');
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
	expect(document.activeElement).toBe(element());
});

test('ArrowRight accepts the completion as the text', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'both', autoHighlight: true } });
	await userEvent.click(input());
	await userEvent.keyboard('che');
	await expect.poll(() => element().value).toBe('cherry');
	await userEvent.keyboard('{ArrowRight}');
	await expect.element(page.getByTestId('value')).toHaveTextContent('"cherry"');
	expect(element().value).toBe('cherry');
	expect(selection()).toEqual([6, 6]);
});

test('Tab accepts the completion and moves on', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'both', autoHighlight: true } });
	await userEvent.click(input());
	await userEvent.keyboard('ban');
	await expect.poll(() => element().value).toBe('banana');
	await tab();
	await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();
	await expect.element(page.getByTestId('value')).toHaveTextContent('"banana"');
	expect(element().value).toBe('banana');
});

test('Tab without a completion keeps the typed text', async () => {
	await render(AutocompleteHarness, { props: { items, mode: 'list', openOnFocus: true } });
	await userEvent.click(input());
	await userEvent.keyboard('Dragon');
	await tab();
	await expect.element(page.getByRole('button', { name: 'After' })).toHaveFocus();
	await expect.element(page.getByTestId('value')).toHaveTextContent('"Dragon"');
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
});

test('Enter with nothing highlighted submits the form with the typed text', async () => {
	await render(AutocompleteHarness, { props: { items, name: 'fruit' } });
	await userEvent.click(input());
	await userEvent.keyboard('Dragon fruit{Enter}');
	await expect.element(page.getByTestId('submitted')).toHaveTextContent('{"fruit":"Dragon fruit"}');
});

test('Enter on a highlighted suggestion chooses it and does not submit', async () => {
	await render(AutocompleteHarness, { props: { items, name: 'fruit' } });
	await userEvent.click(input());
	await userEvent.keyboard('an{ArrowDown}{Enter}');
	await expect.element(page.getByTestId('value')).toHaveTextContent('"Banana"');
	expect(page.getByTestId('submitted').element().textContent).toBe('');
	expect(element().value).toBe('Banana');
	expect(selection()).toEqual([6, 6]);
	await userEvent.keyboard('{Enter}');
	await expect.element(page.getByTestId('submitted')).toHaveTextContent('{"fruit":"Banana"}');
});

test('a click on a suggestion keeps focus in the input', async () => {
	await render(AutocompleteHarness, { props: { items } });
	await userEvent.click(input());
	await userEvent.keyboard('c');
	await userEvent.click(page.getByRole('option', { name: 'Cherry' }));
	await expect.element(page.getByTestId('value')).toHaveTextContent('"Cherry"');
	expect(document.activeElement).toBe(element());
	await expect.element(input()).toHaveAttribute('aria-expanded', 'false');
});

test('clicking away submits the typed text, not a preview', async () => {
	await render(AutocompleteHarness, {
		props: { items, mode: 'both', autoHighlight: true, name: 'fruit' }
	});
	await userEvent.click(input());
	await userEvent.keyboard('ban');
	await expect.poll(() => element().value).toBe('banana');
	await userEvent.click(page.getByRole('button', { name: 'After' }));
	await expect.poll(() => element().value).toBe('ban');
	expect(new FormData(element().form!).get('fruit')).toBe('ban');
});
