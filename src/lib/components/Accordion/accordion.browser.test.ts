// Accordion in real engines: collapsed content is out of the tab order, find-in-page opens a
// hidden-until-found item, and arrow keys stay with the page.
import { afterEach, expect, test, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { tab } from '$lib/testing/browser.test-helper.js';
import AccordionHarness from './AccordionHarness.test.svelte';

const trigger = (name: string) => page.getByRole('button', { name }).element() as HTMLElement;
const active = () => document.activeElement as HTMLElement | null;

afterEach(() => {
	history.replaceState(null, '', location.pathname + location.search);
});

test('Tab moves from trigger to trigger, never into collapsed content', async () => {
	for (const props of [{}, { keepMounted: true }, { hiddenUntilFound: true }]) {
		const screen = await render(AccordionHarness, { props: { anchors: true, ...props } });
		trigger('First').focus();
		await tab();
		expect(active()).toBe(trigger('Second'));
		await tab();
		expect(active()).toBe(trigger('Third'));
		await screen.unmount();
	}
});

test('Tab enters the open item content between its trigger and the next trigger', async () => {
	await render(AccordionHarness, { props: { anchors: true, defaultValue: ['one'] } });
	trigger('First').focus();
	await tab();
	expect(active()?.textContent).toBe('First link');
	await tab();
	expect(active()).toBe(trigger('Second'));
});

test('a hiddenUntilFound item opens on a fragment navigation and closes the open one', async () => {
	const onItemOpenChange = vi.fn();
	await render(AccordionHarness, {
		props: { anchors: true, hiddenUntilFound: true, defaultValue: ['one'], onItemOpenChange }
	});
	const region = document.getElementById('body-two')!.closest('[hidden]') as HTMLElement;
	expect(region.getAttribute('hidden')).toBe('until-found');
	expect(region.getBoundingClientRect().height).toBe(0);

	location.hash = '#body-two';
	await expect.poll(() => trigger('Second').getAttribute('aria-expanded')).toBe('true');
	expect(trigger('First').getAttribute('aria-expanded')).toBe('false');
	expect(region.hasAttribute('hidden')).toBe(false);
	expect(onItemOpenChange).toHaveBeenCalledOnce();
	expect(onItemOpenChange.mock.calls[0][0].details.reason).toBe('find-in-page');
	await expect.element(page.getByText('Second body')).toBeVisible();
});

test('arrow keys on a trigger do not move focus or block the page', async () => {
	await render(AccordionHarness, { props: { nested: true, defaultValue: ['outer'] } });
	trigger('Outer').focus();
	const seen: boolean[] = [];
	const record = (event: KeyboardEvent) => seen.push(event.defaultPrevented);
	document.addEventListener('keydown', record);
	await userEvent.keyboard('{ArrowDown}{ArrowUp}{End}{Home}');
	document.removeEventListener('keydown', record);
	expect(seen).toEqual([false, false, false, false]);
	expect(active()).toBe(trigger('Outer'));
});
