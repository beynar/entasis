// An animation that never ends cannot hold a phase open: an Overlay holding a Spinner still reports
// its open and its close.
import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import OverlaySpinnerHarness from './OverlaySpinnerHarness.test.svelte';

test('an Overlay holding a spinner finishes its open and its close', async () => {
	const onAfterOpen = vi.fn();
	const onAfterClose = vi.fn();
	const screen = await render(OverlaySpinnerHarness, { open: false, onAfterOpen, onAfterClose });

	await screen.rerender({ open: true, onAfterOpen, onAfterClose });
	const overlay = document.querySelector('[data-entasis-overlay]')!;
	const endless = () =>
		overlay
			.getAnimations({ subtree: true })
			.filter((animation) => animation.effect?.getComputedTiming().iterations === Infinity);
	await expect.poll(() => endless().length).toBeGreaterThan(0);
	await expect.poll(() => onAfterOpen.mock.calls.length, { timeout: 2000 }).toBe(1);
	expect(overlay.hasAttribute('data-entering')).toBe(false);

	await screen.rerender({ open: false, onAfterOpen, onAfterClose });
	await expect.poll(() => onAfterClose.mock.calls.length, { timeout: 2000 }).toBe(1);
	expect(overlay.hasAttribute('data-exiting')).toBe(false);
});
