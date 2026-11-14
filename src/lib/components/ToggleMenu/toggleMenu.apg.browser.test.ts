// ToggleMenu against the APG toolbar pattern, left to right and right to left, in Chromium and WebKit
// (see `$lib/testing/apg.test-helper.ts`).
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import ApgHarness from '$lib/testing/ApgHarness.test.svelte';

describe.each(['ltr', 'rtl'] as const)('APG toolbar pattern (%s)', (dir) => {
	test('the toggle menu follows the toolbar pattern', async () => {
		await render(ApgHarness, { props: { scenario: 'toolbar', dir } });
		await checkPattern(page.getByRole('toolbar').element(), 'toolbar', { dir });
	});
});
