// A diff rendered on the client gives each overflowing code column a name and a tab stop
// (axe: scrollable-region-focusable), even though @pierre/diffs fills its shadow root after the
// render call returns.
import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Harness from './DiffScrollHarness.test.svelte';

const regions = () =>
	[...document.querySelectorAll('diffs-container')].flatMap((host) => [
		...(host.shadowRoot?.querySelectorAll<HTMLElement>('code[role="region"]') ?? [])
	]);

test('an overflowing code column rendered on mount is a named, focusable region', async () => {
	render(Harness);
	await expect.poll(() => regions().length, { timeout: 4000 }).toBeGreaterThan(0);
	const [region] = regions();
	expect(region.getAttribute('tabindex')).toBe('0');
	expect(region.getAttribute('aria-label')).toBeTruthy();
});
