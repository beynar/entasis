// Rich menu rows in a real browser: the face fills the media box, the row takes the two-line
// height, the label truncates before its meta, which ends before the suffix, and the description
// holds one line. Collapsed to icons, the face stays centred in the icon button.
import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { animationsSettled } from '$lib/testing/browser.test-helper.js';
import SidebarRichRowHarness from './SidebarRichRowHarness.test.svelte';

const longName = 'Ada, the research agent that reads every quarterly report';
const rect = (element: Element) => element.getBoundingClientRect();
const row = (href: string) => document.querySelector<HTMLElement>(`a[href="${href}"]`)!;
const part = (link: HTMLElement, name: string) =>
	link.querySelector<HTMLElement>(`[data-slot="sidebar-menu-${name}"]`)!;

describe('rich menu rows', () => {
	test('the face fills the media box and the row takes the two-line height', async () => {
		render(SidebarRichRowHarness);
		await animationsSettled();
		const link = row('#ada');
		const media = part(link, 'media');
		const face = media.querySelector('svg')!;
		expect(rect(link).height).toBe(56);
		expect(rect(media).width).toBe(32);
		expect(rect(face).width).toBe(32);
		expect(rect(face).height).toBe(32);
		// Centred on the row's height.
		expect(rect(media).top - rect(link).top).toBeCloseTo(rect(link).bottom - rect(media).bottom, 0);
	});

	test('iconSize large gives a 36px face', async () => {
		render(SidebarRichRowHarness, { iconSize: 'large' });
		await animationsSettled();
		expect(rect(part(row('#ada'), 'media').querySelector('svg')!).width).toBe(36);
	});

	test('the label truncates before its meta', async () => {
		render(SidebarRichRowHarness, { name: longName });
		await animationsSettled();
		const link = row('#ada');
		const label = part(link, 'label');
		const meta = part(link, 'meta');
		expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
		expect(rect(label).right).toBeLessThanOrEqual(rect(meta).left + 0.5);
		expect(rect(meta).width).toBeGreaterThan(0);
	});

	test('the meta ends on one column, whether the row has a suffix, a badge or neither', async () => {
		render(SidebarRichRowHarness);
		await animationsSettled();
		const ends = ['#ada', '#brune', '#dora'].map((href) => rect(part(row(href), 'meta')).right);
		expect(ends[1]).toBeCloseTo(ends[0]!, 0);
		expect(ends[2]).toBeCloseTo(ends[0]!, 0);
		// The row's own end padding: no suffix room is reserved on the label's line.
		const dora = row('#dora');
		expect(ends[0]).toBeCloseTo(
			rect(dora).right - parseFloat(getComputedStyle(dora).paddingRight),
			0
		);
	});

	test('the suffix and the badge sit on the description line, after the description', async () => {
		render(SidebarRichRowHarness);
		await animationsSettled();
		const middle = (box: DOMRect) => box.top + box.height / 2;
		const ada = row('#ada');
		const description = rect(part(ada, 'description'));
		const suffix = rect(document.getElementById(ada.getAttribute('aria-describedby')!)!);
		expect(middle(suffix)).toBeCloseTo(middle(description), 0);
		expect(description.right).toBeLessThanOrEqual(suffix.left + 0.5);
		expect(suffix.right).toBeCloseTo(rect(part(ada, 'meta')).right, 0);

		const brune = row('#brune');
		const badge = rect(brune.querySelector('[data-sidebar="menu-badge"]')!);
		const preview = rect(part(brune, 'description'));
		expect(middle(badge)).toBeCloseTo(middle(preview), 0);
		expect(preview.right).toBeLessThanOrEqual(badge.left + 0.5);
		expect(badge.right).toBeCloseTo(rect(part(brune, 'meta')).right, 0);
	});

	test('the description holds one line, under the label, lighter and not bold', async () => {
		render(SidebarRichRowHarness);
		await animationsSettled();
		const link = row('#ada');
		const label = part(link, 'label');
		const description = part(link, 'description');
		expect(rect(description).top).toBeGreaterThanOrEqual(rect(label).bottom - 0.5);
		expect(description.scrollWidth).toBeGreaterThan(description.clientWidth);
		expect(rect(description).height).toBeLessThanOrEqual(20);
		expect(rect(description).bottom).toBeLessThanOrEqual(rect(link).bottom);
		expect(getComputedStyle(description).fontWeight).toBe('400');
		expect(getComputedStyle(link).fontWeight).toBe('500');
	});

	test('a sub entry with a description fits both lines in its row', async () => {
		render(SidebarRichRowHarness);
		await animationsSettled();
		const link = row('#cyrus');
		expect(rect(link).height).toBe(48);
		const media = part(link, 'media');
		expect(rect(media).height).toBeLessThanOrEqual(rect(link).height);
		expect(rect(part(link, 'description')).bottom).toBeLessThanOrEqual(rect(link).bottom);
	});

	test('collapsed to icons, the face stays visible and centred in the icon button', async () => {
		render(SidebarRichRowHarness, { displayState: 'collapsed' });
		await animationsSettled();
		const link = row('#ada');
		const media = part(link, 'media');
		expect(rect(media).width).toBe(32);
		const left = rect(media).left - rect(link).left;
		const right = rect(link).right - rect(media).right;
		expect(left).toBeGreaterThanOrEqual(0);
		expect(left).toBeCloseTo(right, 0);
		expect(Number(getComputedStyle(part(link, 'text')).opacity)).toBe(0);
	});
});
