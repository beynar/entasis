// A server render keeps no Theme in module-level state. Svelte renders a page twice when a child
// writes a bound prop (`bind:api`), and never runs the discarded pass's `onDestroy`: a Theme that
// registered itself there stayed in memory for good, one per request, and its nonce or motion
// setting was read by later requests.
import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import { getCspNonce } from '$lib/utils/cspNonce.js';
import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
import Harness from './ThemeServerRenderHarness.test.svelte';

describe('Theme server rendering', () => {
	test('leaves no Theme registered after rendering, even when the page renders twice', () => {
		for (let request = 0; request < 20; request += 1) {
			const { body } = render(Harness);
			expect(body).toContain('child');
		}
		expect(getCspNonce()).toBeUndefined();
		expect(prefersReducedMotion()).toBe(false);
	});
});
