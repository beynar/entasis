// Collapsible in real engines: find-in-page reveal, what the tab order can reach while closed,
// and the peek variant's clipped controls. jsdom lays out nothing, so none of this shows there.
import { afterEach, expect, test, vi } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import CollapsibleHarness from './CollapsibleHarness.test.svelte';

const trigger = () => page.getByRole('button', { name: 'Details' });
const active = () => document.activeElement as HTMLElement | null;

afterEach(() => {
	history.replaceState(null, '', location.pathname + location.search);
});

test('closed content is skipped by Tab, with or without keepMounted and hiddenUntilFound', async () => {
	for (const props of [{}, { keepMounted: true }, { hiddenUntilFound: true }]) {
		const screen = await render(CollapsibleHarness, { props: { ...props } });
		(trigger().element() as HTMLElement).focus();
		await tab();
		// Focus leaves the collapsible (to the page) rather than entering its hidden content.
		expect(active()?.closest('[id$="-content"]')).toBeNull();
		await screen.unmount();
	}
});

test('a closed hiddenUntilFound collapsible takes no space and opens on a fragment navigation', async () => {
	const onOpenChange = vi.fn();
	await render(CollapsibleHarness, { props: { hiddenUntilFound: true, onOpenChange } });
	const panel = document.querySelector<HTMLElement>('[id$="-content"]')!;
	expect(panel.getAttribute('hidden')).toBe('until-found');
	expect(panel.getBoundingClientRect().height).toBe(0);

	// Navigating to an element inside the panel fires `beforematch`, like find-in-page does.
	location.hash = '#closed-secret';
	await expect.poll(() => trigger().element().getAttribute('aria-expanded')).toBe('true');
	expect(panel.hasAttribute('hidden')).toBe(false);
	expect(onOpenChange).toHaveBeenCalledOnce();
	expect(onOpenChange.mock.calls[0][0]).toBe(true);
	expect(onOpenChange.mock.calls[0][1].reason).toBe('find-in-page');
	await expect.element(page.getByText('Closed secret')).toBeVisible();
});

test('a closed peek collapsible makes the controls below its preview inert', async () => {
	await render(CollapsibleHarness, { props: { variant: 'peek', peekHeight: 80 } });
	const near = page.getByRole('link', { name: 'Secret link' }).element();
	const far = page.getByRole('link', { name: 'Far link' }).element();
	await expect.poll(() => far.hasAttribute('inert')).toBe(true);
	expect(near.hasAttribute('inert')).toBe(false);

	// Tab from the preview never lands on the clipped link.
	(near as HTMLElement).focus();
	for (let i = 0; i < 4; i++) {
		await tab();
		expect(active()).not.toBe(far);
	}

	(trigger().element() as HTMLElement).click();
	await expect.poll(() => far.hasAttribute('inert')).toBe(false);
});
