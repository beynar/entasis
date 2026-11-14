// SegmentedControl against the APG radiogroup pattern, left to right and right to left, in Chromium and WebKit
// (see `$lib/testing/apg.test-helper.ts`).
import { describe, test } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { checkPattern } from '$lib/testing/apg.test-helper.js';
import ApgHarness from '$lib/testing/ApgHarness.test.svelte';

describe.each(['ltr', 'rtl'] as const)('APG radiogroup pattern (%s)', (dir) => {
	test('the control follows the radio group pattern', async () => {
		await render(ApgHarness, { props: { scenario: 'segmented', dir } });
		await checkPattern(page.getByRole('radiogroup').element(), 'radiogroup', { dir });
	});
});
