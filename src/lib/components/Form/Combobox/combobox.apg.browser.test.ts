// Combobox's popup list against the APG listbox pattern, left to right and right to left, in Chromium and WebKit
// (see `$lib/testing/apg.test-helper.ts`).
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import ApgHarness from '$lib/testing/ApgHarness.test.svelte';

describe.each(['ltr', 'rtl'] as const)('APG listbox pattern (%s)', (dir) => {
	test('the open list follows the listbox pattern', async () => {
		await render(ApgHarness, { props: { scenario: 'combobox', dir } });
		await checkPattern(page.getByRole('combobox', { name: 'Fruit' }).element(), 'listbox', { dir });
	});
});
