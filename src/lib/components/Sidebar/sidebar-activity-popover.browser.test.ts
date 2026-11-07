// An activity bar item that opens a Popover is that popover's trigger: it carries the popup ARIA,
// toggles the panel (a press on it is not an outside press), gets focus back on Escape, and hides
// its tooltip while the panel is open.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import SidebarActivityPopoverHarness from './SidebarActivityPopoverHarness.test.svelte';

const tooltipShown = () =>
	[...document.querySelectorAll('[role="tooltip"]')].some(
		(node) =>
			node.textContent?.trim() === 'Notifications' && (node as HTMLElement).checkVisibility()
	);

test('an activity bar item opens and closes its popover as its trigger', async () => {
	await page.viewport(1280, 720);
	const reasons: string[] = [];
	await render(SidebarActivityPopoverHarness, { reasons });
	const square = page.getByRole('button', { name: 'Notifications' });
	const element = square.element() as HTMLElement;

	expect(element.getAttribute('aria-haspopup')).toBe('dialog');
	expect(element.getAttribute('aria-expanded')).toBe('false');

	// Closed, its tooltip shows.
	await userEvent.hover(element);
	await expect.poll(tooltipShown, { timeout: 2000 }).toBe(true);

	await square.click();
	await expect.element(page.getByRole('button', { name: 'Mark all read' })).toBeVisible();
	expect(element.getAttribute('aria-expanded')).toBe('true');
	const panel = document.getElementById(element.getAttribute('aria-controls')!);
	expect(panel?.contains(page.getByRole('button', { name: 'Mark all read' }).element())).toBe(true);
	await animationsSettled();
	await userEvent.hover(element);
	await new Promise((resolve) => setTimeout(resolve, 800));
	expect(tooltipShown()).toBe(false);

	// A second press on the square closes it, and it stays closed.
	await square.click();
	await expect.poll(() => element.getAttribute('aria-expanded')).toBe('false');
	await animationsSettled();
	await new Promise((resolve) => setTimeout(resolve, 100));
	expect(page.getByTestId('open').element().textContent).toBe('false');
	expect(reasons).toEqual(['trigger-press', 'trigger-press']);

	// Escape closes it and gives focus back to the square.
	await square.click();
	await expect.element(page.getByRole('button', { name: 'Mark all read' })).toBeVisible();
	await animationsSettled();
	await userEvent.keyboard('{Escape}');
	await expect.poll(() => element.getAttribute('aria-expanded')).toBe('false');
	await expect.poll(() => document.activeElement).toBe(element);
	expect(reasons.at(-1)).toBe('escape-key');
});
