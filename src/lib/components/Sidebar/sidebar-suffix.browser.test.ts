// A row's `suffix` in a real browser: the label truncates before it, it ends before the row's
// action and stays visible while the action shows, and nothing overlaps, on desktop and in the
// mobile drawer below `md`, where the action is always shown.
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import SidebarSuffixHarness from './SidebarSuffixHarness.test.svelte';

const longLabel = 'Dossiers clients archivés depuis le début de l’année fiscale';
const initialViewport = { width: window.innerWidth, height: window.innerHeight };

const rect = (element: Element) => element.getBoundingClientRect();
const rowLink = (label: string) => {
	const label_ = [...document.querySelectorAll('a span')].find(
		(span) => span.textContent === label
	);
	const link = label_?.closest('a');
	if (!(link instanceof HTMLElement) || !(label_ instanceof HTMLElement))
		throw new Error(`no row ${label}`);
	return { link, label: label_ };
};
const suffixOf = (link: HTMLElement) =>
	document.getElementById(link.getAttribute('aria-describedby') ?? '') as HTMLElement;
const actionOf = (link: HTMLElement) =>
	link.parentElement!.querySelector<HTMLElement>(
		'[data-sidebar="menu-action"], [data-sidebar="menu-sub-action"]'
	);
const visible = (element: Element) =>
	Number(getComputedStyle(element).opacity) > 0.99 && rect(element).width > 0;

/** The label, the in-flow badge, the suffix and the action stay apart and inside the row. */
const expectNoOverlap = (labelText: string) => {
	const { link, label } = rowLink(labelText);
	const suffix = suffixOf(link);
	const row = rect(link);
	const suffixBox = rect(suffix);
	const inFlow = [label, ...link.querySelectorAll('[data-sidebar="menu-badge"]')];
	for (const part of inFlow) expect(rect(part).right).toBeLessThanOrEqual(suffixBox.left + 0.5);
	expect(suffixBox.width).toBeGreaterThan(0);
	expect(suffixBox.left).toBeGreaterThanOrEqual(row.left);
	expect(suffixBox.right).toBeLessThanOrEqual(row.right + 0.5);
	const action = actionOf(link);
	if (action) {
		expect(rect(action).left).toBeGreaterThanOrEqual(suffixBox.right - 0.5);
		expect(rect(action).right).toBeLessThanOrEqual(row.right + 0.5);
	}
	return { link, label, suffix, action };
};

beforeEach(async () => {
	await userEvent.hover(document.documentElement, {
		position: { x: window.innerWidth - 2, y: window.innerHeight - 2 }
	});
});

afterEach(async () => {
	if (window.innerWidth !== initialViewport.width || window.innerHeight !== initialViewport.height)
		await page.viewport(initialViewport.width, initialViewport.height);
});

describe('row suffix geometry', () => {
	test('a long label truncates before the suffix', async () => {
		render(SidebarSuffixHarness, { props: { label: longLabel } });
		await animationsSettled();
		const { label } = expectNoOverlap(longLabel);
		expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
		expectNoOverlap('Archive');
	});

	test('with an action, the suffix stays visible before it while the row is hovered', async () => {
		render(SidebarSuffixHarness);
		await animationsSettled();
		for (const label of ['Clients', 'Brouillons partagés avec toute l’équipe']) {
			const { link, suffix, action } = expectNoOverlap(label);
			await userEvent.hover(link);
			await expect.poll(() => visible(action!)).toBe(true);
			expect(visible(suffix)).toBe(true);
			expectNoOverlap(label);
			// Hovering the suffix itself keeps the row's tint and the action shown.
			await userEvent.hover(suffix);
			await expect.poll(() => getComputedStyle(link, '::before').opacity).not.toBe('0');
			expect(visible(action!)).toBe(true);
		}
	});

	test('below md, in the mobile drawer, it shows beside the always-visible action', async () => {
		await page.viewport(400, 800);
		render(SidebarSuffixHarness, { props: { label: longLabel } });
		await userEvent.click(page.getByRole('button', { name: 'Open navigation' }));
		await expect.poll(() => document.querySelector('[data-mobile="true"]')).not.toBeNull();
		await animationsSettled();
		for (const label of [
			longLabel,
			'Clients',
			'Archive',
			'Brouillons partagés avec toute l’équipe'
		]) {
			const { suffix, action } = expectNoOverlap(label);
			expect(visible(suffix)).toBe(true);
			if (action) expect(visible(action)).toBe(true);
		}
	});

	test('collapsed to icons, the suffix is hidden', async () => {
		render(SidebarSuffixHarness, { props: { displayState: 'collapsed' } });
		await animationsSettled();
		const suffix = document.querySelector('[data-sidebar="menu-suffix"]') as HTMLElement;
		expect(rect(suffix).width).toBe(0);
	});
});
