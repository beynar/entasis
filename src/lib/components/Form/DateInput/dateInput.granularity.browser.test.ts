// A DateInput typing and picking a week, a month or a year.
import { expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './GranularityHarness.test.svelte';

const box = () => page.getByRole('textbox', { name: 'Period' });
const input = () => box().element() as HTMLInputElement;
const local = (date: Date | null | undefined) =>
	date
		? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
		: null;

const mount = async (props: Record<string, unknown>) => {
	const seen: (Date | null)[] = [];
	await render(Harness, {
		props: {
			granularity: 'day',
			...props,
			onValueChange: (value: Date | null) => seen.push(value)
		}
	});
	return seen;
};

test('a month is typed mm/yyyy and stands for its first day at midnight', async () => {
	const seen = await mount({ granularity: 'month' });
	expect(input().placeholder).toBe('mm/yyyy');
	await userEvent.type(box(), '032026');
	await expect.poll(() => input().value).toBe('03/2026');
	await expect.poll(() => local(seen.at(-1))).toBe('2026-03-01 00:00');
});

test('a year-first locale types the year first', async () => {
	await mount({ granularity: 'month', locale: 'ja-JP' });
	expect(input().placeholder).toBe('yyyy/mm');
});

test('a year is typed yyyy', async () => {
	const seen = await mount({ granularity: 'year' });
	expect(input().placeholder).toBe('yyyy');
	await userEvent.type(box(), '2031');
	await expect.poll(() => local(seen.at(-1))).toBe('2031-01-01 00:00');
});

test('a value set from outside shows its period', async () => {
	await mount({ granularity: 'month', value: new Date(2026, 6, 19, 15) });
	await expect.poll(() => input().value).toBe('07/2026');
});

test('a week is typed as any of its days, then shows its Monday and its number', async () => {
	const seen = await mount({ granularity: 'week' });
	await userEvent.type(box(), '18032026');
	await expect.poll(() => local(seen.at(-1))).toBe('2026-03-16 00:00');
	await userEvent.click(page.getByRole('button', { name: 'Elsewhere' }));
	await expect.poll(() => input().value).toBe('16/03/2026');
	await expect
		.poll(() => document.querySelector('[data-week-number]')?.textContent?.trim())
		.toBe('W12');
});

test('a Sunday week start moves a typed day to its Sunday', async () => {
	const seen = await mount({ granularity: 'week', weekStartsOnMonday: false });
	await userEvent.type(box(), '18032026');
	await expect.poll(() => local(seen.at(-1))).toBe('2026-03-15 00:00');
});

test('the calendar popup picks a month', async () => {
	const seen = await mount({ granularity: 'month', value: new Date(2026, 2, 1) });
	await userEvent.click(box());
	await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
	await userEvent.click(page.getByRole('gridcell', { name: 'May 2026' }));
	await expect.poll(() => local(seen.at(-1))).toBe('2026-05-01 00:00');
	await expect.poll(() => input().value).toBe('05/2026');
});

test('ArrowDown opens the year grid on the selected year', async () => {
	await mount({ granularity: 'year', value: new Date(2024, 0, 1) });
	input().focus();
	await userEvent.keyboard('{ArrowDown}');
	await expect
		.poll(() => (document.activeElement as HTMLElement | null)?.dataset.date)
		.toBe('2024-01-01');
});

test('the calendar popup picks a week and keeps the time zone', async () => {
	const seen = await mount({
		granularity: 'week',
		timeZone: 'Asia/Tokyo',
		value: new Date('2026-03-01T15:00:00.000Z')
	});
	// 15:00 UTC on 1 March is 00:00 on 2 March in Tokyo: the week of Monday 2 March.
	await expect.poll(() => input().value).toBe('02/03/2026');
	await userEvent.click(box());
	await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
	await userEvent.click(
		document.querySelector<HTMLElement>('dialog[open] [data-date="2026-03-12"]')!
	);
	await expect.poll(() => seen.at(-1)?.toISOString()).toBe('2026-03-08T15:00:00.000Z');
});
