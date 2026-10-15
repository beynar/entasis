// The open-only machinery of a popover (CX-10) in real browsers: it lives until the closing
// transition has finished, while what depends on the open state (the scroll lock, the layer's
// place in the open stack) lets go as soon as the popover closes.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import PopoverSessionHarness from './PopoverSessionHarness.test.svelte';
import { popoverInternals } from './popover.state.svelte.js';
import type { PopoverApi } from './popover.api.js';

const LOCK = 'data-entasis-scroll-lock';

describe('popover session (CX-10)', () => {
	test('closing releases the scroll lock at once and drops the layer when the exit ends', async () => {
		let api: PopoverApi | undefined;
		render(PopoverSessionHarness, {
			props: { scenario: 'slow', onApi: (_name, popover) => (api = popover) }
		});
		const state = () => popoverInternals(api!);
		await userEvent.click(page.getByRole('button', { name: 'Slow' }));
		await expect.element(page.getByRole('button', { name: 'Inside slow' })).toBeVisible();
		await expect.poll(() => document.documentElement.hasAttribute(LOCK)).toBe(true);
		expect(state().layer?.isOpen).toBe(true);

		await userEvent.keyboard('{Escape}');
		await nextFrame();
		// Still exiting: the panel and its session are there, the page is no longer locked.
		expect(state().status).toBe('exiting');
		expect(document.body.textContent).toContain('Inside slow');
		expect(document.documentElement.hasAttribute(LOCK)).toBe(false);
		expect(state().layer).not.toBeNull();
		expect(state().layer?.isOpen).toBe(false);

		await expect.poll(() => state().status, { timeout: 3000 }).toBe('closed');
		await expect.poll(() => state().layer).toBeNull();
		expect(document.body.textContent).not.toContain('Inside slow');
	});

	test('reopening during the exit keeps the same session', async () => {
		let api: PopoverApi | undefined;
		render(PopoverSessionHarness, {
			props: { scenario: 'slow', onApi: (_name, popover) => (api = popover) }
		});
		const state = () => popoverInternals(api!);
		const trigger = page.getByRole('button', { name: 'Slow' });
		await userEvent.click(trigger);
		await expect.poll(() => state().status).toBe('open');
		const layer = state().layer;
		await userEvent.keyboard('{Escape}');
		await nextFrame();
		expect(state().status).toBe('exiting');
		state().open();
		await expect.poll(() => state().isOpen).toBe(true);
		await nextFrame();
		expect(state().layer).toBe(layer);
		expect(state().layer?.isOpen).toBe(true);
	});
});
