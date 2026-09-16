// The calendar owns three roving-focus registries — month/agenda day cells, time-grid targets and
// occurrence controls. Each one keeps a single tab stop, re-homes it when the focused node
// unmounts, and restores DOM focus on a scheduled flush. These tests pin that observable
// behaviour (tab stop, arrow navigation, restore after paging, restore after a removal, and the
// announcement) so it can be verified unchanged across refactors of the registries.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render } from '@testing-library/svelte';
import { tick } from 'svelte';
import { describe, expect, test } from 'vitest';
import Harness from './EventCalendarFocusHarness.test.svelte';

/** The registries restore focus from a microtask, and Svelte re-renders from one too. */
const flush = async () => {
	for (let round = 0; round < 4; round += 1) {
		await tick();
		await Promise.resolve();
	}
};

const items = [
	{
		id: 'planning',
		title: 'Planning',
		start: new Date('2026-07-15T09:00:00.000Z'),
		end: new Date('2026-07-15T10:00:00.000Z')
	},
	{
		id: 'review',
		title: 'Review',
		start: new Date('2026-07-16T09:00:00.000Z'),
		end: new Date('2026-07-16T10:00:00.000Z')
	}
];

const dayCells = () => [
	...document.querySelectorAll<HTMLElement>('[data-event-calendar-part="month-cell"]')
];

const dayCell = (day: string) => {
	const node = document.querySelector<HTMLElement>(
		`[data-event-calendar-part="month-cell"][data-day="${day}"]`
	);
	if (!node) throw new Error(`no month cell for ${day}`);
	return node;
};

const dayTabStops = () =>
	dayCells()
		.filter((cell) => cell.tabIndex === 0)
		.map((cell) => cell.dataset.day);

/** The keyboard-reachable time-grid targets, in DOM order, labelled for readability. */
const timeTargets = () =>
	[...document.querySelectorAll<HTMLElement>('[data-event-calendar-part] [tabindex], [tabindex]')]
		.filter((node) => node.closest('[data-event-calendar-part="time-grid"]'))
		.map((node) => node);

const occurrenceControl = (occurrenceKey: string) => {
	const node = document.querySelector<HTMLElement>(
		`[data-occurrence-key="${occurrenceKey}"] button`
	);
	if (!node) throw new Error(`no control for ${occurrenceKey}`);
	return node;
};

/**
 * The live region is rewritten for every announcement (and blanked in between), so collect the
 * texts it passes through instead of reading whichever one happens to be last.
 */
const trackAnnouncements = () => {
	const region = document.querySelector<HTMLElement>(
		'[data-event-calendar-part="root"] [role="status"][aria-atomic="true"]'
	);
	if (!region) throw new Error('no live region');
	const seen: string[] = [];
	const observer = new MutationObserver(() => {
		const text = region.textContent?.trim() ?? '';
		if (text && seen.at(-1) !== text) seen.push(text);
	});
	observer.observe(region, { characterData: true, childList: true, subtree: true });
	return seen;
};

describe('event calendar day registry', () => {
	test('starts with a single tab stop on the first day of the grid', () => {
		render(Harness);

		expect(dayCells().length).toBe(42);
		expect(dayTabStops()).toEqual(['2026-06-28']);
	});

	test('moves the tab stop and DOM focus with the arrow keys', async () => {
		render(Harness);
		const start = dayCell('2026-07-15');
		start.focus();
		await flush();
		expect(dayTabStops()).toEqual(['2026-07-15']);

		await fireEvent.keyDown(start, { key: 'ArrowRight' });
		await flush();
		expect(document.activeElement).toBe(dayCell('2026-07-16'));
		expect(dayTabStops()).toEqual(['2026-07-16']);

		await fireEvent.keyDown(dayCell('2026-07-16'), { key: 'ArrowDown' });
		await flush();
		expect(document.activeElement).toBe(dayCell('2026-07-23'));
		expect(dayTabStops()).toEqual(['2026-07-23']);
	});

	test('restores focus onto the equivalent day once the next month registers', async () => {
		render(Harness);
		const start = dayCell('2026-07-15');
		start.focus();
		await flush();

		await fireEvent.keyDown(start, { key: 'PageDown' });
		await flush();

		expect(document.activeElement).toBe(dayCell('2026-08-15'));
		expect(dayTabStops()).toEqual(['2026-08-15']);
	});

	test('does not focus a detached node when the calendar unmounts mid-restore', async () => {
		const view = render(Harness);
		const start = dayCell('2026-07-15');
		start.focus();
		await flush();

		await fireEvent.keyDown(start, { key: 'PageDown' });
		view.unmount();
		await expect(flush()).resolves.toBeUndefined();

		expect(document.activeElement).toBe(document.body);
	});
});

describe('event calendar occurrence registry', () => {
	test('follows focus onto the registered occurrence control', async () => {
		render(Harness, { props: { items: [...items] } });
		const control = occurrenceControl('planning');
		control.focus();
		await flush();

		expect(document.activeElement).toBe(control);
		// The occurrence owns the focused day now, so the day registry hands it its tab stop.
		expect(dayTabStops()).toEqual(['2026-07-15']);
	});

	test('falls back to the nearest day cell when the focused occurrence is removed', async () => {
		const view = render(Harness, { props: { items: [...items] } });
		occurrenceControl('planning').focus();
		await flush();

		await view.rerender({ items: items.filter((item) => item.id !== 'planning') });
		await flush();

		expect(document.querySelector('[data-occurrence-key="planning"]')).toBeNull();
		expect(document.activeElement).toBe(dayCell('2026-07-15'));
	});

	test('re-homes the focused occurrence across a view change and announces it', async () => {
		const view = render(Harness, { props: { items: [...items] } });
		occurrenceControl('planning').focus();
		await flush();
		const announcements = trackAnnouncements();

		await view.rerender({ items: [...items], view: 'agenda' as const });
		await flush();

		expect(announcements).toContain('Focus restored to Planning');
		expect(document.activeElement).toBe(occurrenceControl('planning'));
	});
});

describe('event calendar time target registry', () => {
	test('starts with a single tab stop on the first time-grid target', async () => {
		render(Harness, { props: { view: 'week' as const } });
		await flush();

		const stops = timeTargets().filter((node) => node.tabIndex === 0);
		expect(stops.length).toBe(1);
		expect(stops[0]?.getAttribute('aria-label')).toBe('Sunday, July 12, 2026');
	});

	test('moves the tab stop down its column with the arrow keys', async () => {
		render(Harness, { props: { view: 'week' as const } });
		await flush();
		const header = timeTargets().find((node) => node.tabIndex === 0);
		if (!header) throw new Error('no time target tab stop');
		header.focus();

		await fireEvent.keyDown(header, { key: 'ArrowDown' });
		await flush();

		const focused = document.activeElement as HTMLElement;
		expect(focused.getAttribute('aria-label')).toBe('All day, Sunday, July 12, 2026');
		expect(focused.tabIndex).toBe(0);
		expect(header.tabIndex).toBe(-1);

		await fireEvent.keyDown(focused, { key: 'ArrowDown' });
		await flush();
		expect((document.activeElement as HTMLElement).getAttribute('aria-label')).toBe(
			'Sunday, July 12, 2026, 8:00 AM GMT+0'
		);
	});
});
