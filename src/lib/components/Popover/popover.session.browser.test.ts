// The open-only machinery of a popover (CX-10) in real browsers: it lives until the closing
// transition has finished, while what depends on the open state (the scroll lock, the layer's
// place in the open stack) lets go as soon as the popover closes.
import { afterEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import PopoverSessionHarness from './PopoverSessionHarness.test.svelte';
import PopoverSheetFieldHarness from './PopoverSheetFieldHarness.test.svelte';
import ThemeProviderHarness from '../Theme/ThemeProviderHarness.test.svelte';
import type { FieldState } from '../Form/Field/field.state.svelte.js';
import type { FieldType } from '../Form/Field/field.js';
import { popoverInternals } from './popover.state.svelte.js';
import type { PopoverApi } from './popover.api.js';
import type { Component } from 'svelte';

const LOCK = 'data-entasis-scroll-lock';

const initialViewport = { width: window.innerWidth, height: window.innerHeight };

afterEach(async () => {
	if (window.innerWidth !== initialViewport.width || window.innerHeight !== initialViewport.height)
		await page.viewport(initialViewport.width, initialViewport.height);
});

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

	test('a mobile sheet built while closed still counts as inside the field that owns it', async () => {
		await page.viewport(400, 800);
		let field!: FieldState<FieldType>;
		render(ThemeProviderHarness, {
			props: {
				component: PopoverSheetFieldHarness as unknown as Component<Record<string, unknown>>,
				onField: (next: FieldState<FieldType>) => (field = next)
			}
		});
		const root = page.getByTestId('field-root');
		await userEvent.click(page.getByTestId('control'));
		await expect.element(root).toHaveAttribute('data-focused');

		await userEvent.click(page.getByRole('button', { name: 'Suggestions' }));
		const inside = page.getByRole('button', { name: 'Inside sheet' });
		await expect.element(inside).toBeVisible();
		(inside.element() as HTMLElement).focus();
		await expect.element(inside).toHaveFocus();
		expect(field.focused).toBe(true);
		expect(field.touched).toBe(false);

		// The sheet is modal and keeps focus: close it before leaving the field.
		await userEvent.keyboard('{Escape}');
		await expect.element(inside).not.toBeInTheDocument();
		(page.getByRole('button', { name: 'After', exact: true }).element() as HTMLElement).focus();
		await expect.poll(() => field.focused).toBe(false);
		expect(field.touched).toBe(true);
	});
});
