import { render } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './NetworkIndicatorHarness.test.svelte';
import { hideNetworkIndicator, showNetworkIndicator } from './NetworkIndicator.svelte';

// The show and hide helpers reach the mounted indicator through a document event, typed locally
// since the global Document augmentation was removed. This keeps that event path covered.
describe('NetworkIndicator document event', () => {
	test('showNetworkIndicator and hideNetworkIndicator toggle the mounted indicator', () => {
		const { container } = render(Harness);
		const loading = () =>
			container.querySelector('[data-slot="network-indicator"]')?.getAttribute('data-loading');

		showNetworkIndicator();
		flushSync();
		expect(loading()).toBe('true');

		hideNetworkIndicator();
		flushSync();
		expect(loading()).not.toBe('true');
	});
});
