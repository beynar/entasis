// Selectable Timeline in real engines (Chromium and WebKit): the selection button spans the item, so
// a click on the title, the description or the marker selects; content links stay clickable above
// it. Real Tab reaches one stop, real arrows follow the writing direction, and keyboard focus rings
// the item surface.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { nextFrame, tab } from '$lib/testing/browser.test-helper.js';
import type { TimelineItem } from './timeline.props.js';
import TimelineSelectionThemeHarness from './TimelineSelectionThemeHarness.test.svelte';

const steps: TimelineItem[] = [
	{ id: 'opened', title: 'Opened', description: 'Mar 3', progress: 'done' },
	{ id: 'documents', title: 'Documents', description: 'Mar 9', progress: 'done' },
	{ id: 'appraisal', title: 'Appraisal', description: 'Under way', progress: 'current' },
	{ id: 'report', title: 'Report', progress: 'upcoming' }
];

const settle = async () => {
	await nextFrame();
	await nextFrame();
};
const button = (name: string) =>
	page.getByRole('button', { name, exact: true }).element() as HTMLButtonElement;
const row = (name: string) => button(name).closest<HTMLElement>('[data-slot="timeline-item"]')!;
const part = (name: string, slot: string) =>
	row(name).querySelector<HTMLElement>(`[data-slot="${slot}"]`)!;
const value = () => page.getByTestId('value').element().textContent;

describe('click target', () => {
	test('the button covers the whole item', async () => {
		await render(TimelineSelectionThemeHarness, { items: steps });
		await settle();
		const item = row('Documents').getBoundingClientRect();
		const target = button('Documents').getBoundingClientRect();
		expect(target.width).toBeGreaterThan(0);
		expect(Math.abs(target.left - item.left)).toBeLessThan(1);
		expect(Math.abs(target.top - item.top)).toBeLessThan(1);
		expect(Math.abs(target.width - item.width)).toBeLessThan(1);
		expect(Math.abs(target.height - item.height)).toBeLessThan(1);
	});

	test.each([
		['the title', 'timeline-title-row'],
		['the marker', 'timeline-marker'],
		['the content surface', 'timeline-content']
	])('a click on %s selects the item', async (_label, slot) => {
		await render(TimelineSelectionThemeHarness, { items: steps });
		await settle();
		const target = part('Appraisal', slot);
		const box = target.getBoundingClientRect();
		const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
		expect(hit).toBe(button('Appraisal'));
		await userEvent.click(target, { force: true });
		expect(value()).toBe('appraisal');
		expect(button('Appraisal').getAttribute('aria-pressed')).toBe('true');
	});

	test('a link inside a custom item stays clickable and does not select', async () => {
		await render(TimelineSelectionThemeHarness, { items: steps, custom: true });
		await settle();
		const link = page.getByTestId('custom-link').nth(1).element() as HTMLElement;
		const box = link.getBoundingClientRect();
		expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(
			link
		);
	});
});

describe('keyboard', () => {
	test('Tab lands on the one stop (the current step) and leaves in one more Tab', async () => {
		await render(TimelineSelectionThemeHarness, { items: steps });
		await settle();
		button('Before').focus();
		await tab();
		expect(document.activeElement).toBe(button('Appraisal'));
		await tab();
		expect(document.activeElement).toBe(button('After'));
		expect(value()).toBe('');
	});

	test('arrows follow the writing direction; Enter selects', async () => {
		await render(TimelineSelectionThemeHarness, { items: steps, dir: 'rtl' });
		await settle();
		button('Appraisal').focus();
		await userEvent.keyboard('{ArrowLeft}');
		expect(document.activeElement).toBe(button('Report'));
		await userEvent.keyboard('{ArrowRight}{ArrowRight}');
		expect(document.activeElement).toBe(button('Documents'));
		await userEvent.keyboard('{Enter}');
		expect(value()).toBe('documents');
	});

	test('keyboard focus rings the item surface', async () => {
		await render(TimelineSelectionThemeHarness, { items: steps });
		await settle();
		const surface = part('Appraisal', 'timeline-content');
		expect(getComputedStyle(surface).boxShadow).toBe('none');
		button('Before').focus();
		await tab();
		await settle();
		expect(button('Appraisal').matches(':focus-visible')).toBe(true);
		expect(getComputedStyle(surface).boxShadow).not.toBe('none');
	});
});
