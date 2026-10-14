// PinInput in real engines: the cells keep their left-to-right order in right-to-left documents,
// and the caret over the transparent input agrees with them.
import { afterEach, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { Component } from 'svelte';
import { render } from 'vitest-browser-svelte';
import ThemeProviderHarness from '../../Theme/ThemeProviderHarness.test.svelte';
import PinInput from './PinInput.svelte';

afterEach(() => {
	document.documentElement.dir = 'ltr';
});

const mount = () =>
	render(ThemeProviderHarness, {
		props: { component: PinInput as unknown as Component<Record<string, unknown>>, label: 'Code' }
	});

const cellLefts = () =>
	Array.from(document.querySelectorAll('[data-slot="pin-input-cell"]')).map(
		(cell) => cell.getBoundingClientRect().left
	);

test('pin-input:ltr-cells the cells read left to right in a right-to-left document', async () => {
	document.documentElement.dir = 'rtl';
	await mount();
	const input = page.getByRole('textbox', { name: 'Code' });
	await userEvent.click(input);
	await userEvent.keyboard('123456');
	const lefts = cellLefts();
	expect(lefts).toHaveLength(6);
	expect([...lefts].sort((a, b) => a - b)).toEqual(lefts);
	const characters = Array.from(document.querySelectorAll('[data-slot="pin-input-character"]')).map(
		(node) => node.textContent?.trim()
	);
	expect(characters.join('')).toBe('123456');
	expect(getComputedStyle(input.element()).direction).toBe('ltr');
});
