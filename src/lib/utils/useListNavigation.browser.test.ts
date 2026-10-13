// useListNavigation in real engines (Chromium and WebKit): highlighting scrolls only the list,
// never the page around it, and a typed query returns the list to its first match.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame } from '$lib/testing/browser.test-helper.js';
import ListNavigationHarness from './ListNavigationHarness.test.svelte';

const el = (testId: string) => page.getByTestId(testId).element() as HTMLElement;
const settle = async () => {
	await nextFrame();
	await nextFrame();
};

describe('scrolling', () => {
	test('arrowing to a row below the fold scrolls the list and not the page', async () => {
		await render(ListNavigationHarness);
		el('search').focus();
		const pageScroll = el('page').scrollTop;
		await userEvent.keyboard('{End}');
		await settle();
		expect(el('list').scrollTop).toBeGreaterThan(0);
		expect(el('page').scrollTop).toBe(pageScroll);
		const active = document.getElementById(el('search').getAttribute('aria-activedescendant')!)!;
		const box = active.getBoundingClientRect();
		const view = el('list').getBoundingClientRect();
		expect(box.bottom).toBeLessThanOrEqual(view.bottom + 1);
		expect(box.top).toBeGreaterThanOrEqual(view.top - 1);
	});

	test('typing after scrolling returns the list to the first match', async () => {
		await render(ListNavigationHarness);
		el('search').focus();
		await userEvent.keyboard('{End}');
		await settle();
		expect(el('list').scrollTop).toBeGreaterThan(0);
		await userEvent.keyboard('1');
		await settle();
		expect(el('list').scrollTop).toBe(0);
		const active = document.getElementById(el('search').getAttribute('aria-activedescendant')!)!;
		expect(active.textContent?.trim()).toBe('Item 1');
	});
});
