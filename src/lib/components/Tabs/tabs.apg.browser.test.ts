// Tabs against the APG tabs pattern, left to right and right to left, in Chromium and WebKit
// (see `$lib/testing/apg.test-helper.ts`).
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import ApgHarness from '$lib/testing/ApgHarness.test.svelte';

describe.each(['ltr', 'rtl'] as const)('APG tabs pattern (%s)', (dir) => {
	test('the tablist follows the tabs pattern', async () => {
		await render(ApgHarness, { props: { scenario: 'tabs', dir } });
		await checkPattern(page.getByRole('tablist').element(), 'tabs', { dir });
	});
});
