// Picking weeks, months and years: grids, selection shapes, keyboard and right-to-left.
import { describe, expect, test } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import Harness from './GranularityHarness.test.svelte';

type Props = Record<string, unknown> & { granularity: 'day' | 'week' | 'month' | 'year' };

const mount = async (props: Props) => {
	const values: unknown[] = [];
	await render(Harness, {
		props: { ...props, onValueChange: (value: unknown) => values.push(value) }
	});
	return values;
};

const cell = (key: string) => document.querySelector<HTMLElement>(`[data-date="${key}"]`);
const keyOf = (date: Date | null | undefined) =>
	date
		? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
		: null;
const tabStop = () => document.querySelector<HTMLElement>('[data-date][tabindex="0"]');
const focusedKey = () => (document.activeElement as HTMLElement | null)?.dataset.date ?? null;
const header = () => document.querySelector('[aria-live="polite"]')?.textContent?.trim();

async function focusTabStop() {
	const stop = tabStop();
	expect(stop).not.toBeNull();
	stop!.focus();
	await expect.poll(focusedKey).toBe(stop!.dataset.date);
}

async function press(key: string, expected: string) {
	await userEvent.keyboard(key);
	await expect.poll(focusedKey).toBe(expected);
}

describe('month granularity', () => {
	test('renders the twelve months of a year as a 3×4 grid with readable names', async () => {
		await mount({ granularity: 'month' });
		const grid = page.getByRole('grid', { name: '2026' });
		await expect.element(grid).toBeInTheDocument();
		const rows = grid.element().querySelectorAll('[role="row"]');
		expect(rows).toHaveLength(4);
		expect(rows[0].querySelectorAll('[role="gridcell"]')).toHaveLength(3);
		await expect
			.element(page.getByRole('gridcell', { name: 'March 2026' }))
			.toHaveAttribute('aria-current', 'date');
		expect(header()).toBe('2026');
		// The current month holds the tab stop when nothing is selected.
		expect(tabStop()?.dataset.date).toBe('2026-03-01');
	});

	test('a click selects the month as its first day', async () => {
		const values = await mount({ granularity: 'month' });
		await userEvent.click(page.getByRole('gridcell', { name: 'May 2026' }));
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-05-01');
		expect((values.at(-1) as Date).getHours()).toBe(12);
		await expect
			.element(page.getByRole('gridcell', { name: 'May 2026' }))
			.toHaveAttribute('aria-selected', 'true');
	});

	test('a value set from outside is read by its month', async () => {
		await mount({ granularity: 'month', value: new Date(2026, 9, 17, 12) });
		await expect
			.element(page.getByRole('gridcell', { name: 'October 2026' }))
			.toHaveAttribute('aria-selected', 'true');
		expect(tabStop()?.dataset.date).toBe('2026-10-01');
	});

	test('a range runs from the first day of its first month to the last day of its last', async () => {
		const values = await mount({ granularity: 'month', mode: 'range' });
		await userEvent.click(page.getByRole('gridcell', { name: 'May 2026' }));
		await userEvent.click(page.getByRole('gridcell', { name: 'February 2026' }));
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2026-02-01', '2026-05-31']);
		expect(cell('2026-03-01')?.dataset.inRange).toBe('true');
		expect(cell('2026-04-01')?.dataset.inRange).toBe('true');
		expect(cell('2026-02-01')?.dataset.startOfRange).toBe('true');
		expect(cell('2026-05-01')?.dataset.endOfRange).toBe('true');
		expect(cell('2026-06-01')?.dataset.inRange).toBeUndefined();
	});

	test('multiple toggles months', async () => {
		const values = await mount({ granularity: 'month', mode: 'multiple' });
		await userEvent.click(page.getByRole('gridcell', { name: 'February 2026' }));
		await userEvent.click(page.getByRole('gridcell', { name: 'August 2026' }));
		await userEvent.click(page.getByRole('gridcell', { name: 'February 2026' }));
		await expect.poll(() => (values.at(-1) as Date[]).map(keyOf)).toEqual(['2026-08-01']);
	});

	test('bounds disable whole months and the pages beyond them', async () => {
		await mount({
			granularity: 'month',
			minDate: new Date(2026, 2, 15),
			maxDate: new Date(2026, 10, 2)
		});
		expect(cell('2026-02-01')?.hasAttribute('disabled')).toBe(true);
		// A month with one available day stays selectable.
		expect(cell('2026-03-01')?.hasAttribute('disabled')).toBe(false);
		expect(cell('2026-11-01')?.hasAttribute('disabled')).toBe(false);
		expect(cell('2026-12-01')?.hasAttribute('disabled')).toBe(true);
		await expect.element(page.getByRole('button', { name: 'Previous year' })).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'Next year' })).toBeDisabled();
	});

	test('arrows move by one month and one row; PageUp/PageDown by year; Home/End by row', async () => {
		const values = await mount({ granularity: 'month' });
		await focusTabStop();
		await press('{ArrowRight}', '2026-04-01');
		await press('{ArrowDown}', '2026-07-01');
		await press('{ArrowUp}', '2026-04-01');
		await press('{PageDown}', '2027-04-01');
		await expect.poll(header).toBe('2027');
		await press('{End}', '2027-06-01');
		await press('{Home}', '2027-04-01');
		await press('{ArrowLeft}', '2027-03-01');
		await press('{PageUp}', '2026-03-01');
		await expect.poll(header).toBe('2026');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-03-01');
		// One tab stop survives the re-render.
		await expect.poll(() => document.querySelectorAll('[data-date][tabindex="0"]').length).toBe(1);
		expect(focusedKey()).toBe('2026-03-01');
	});

	test('the page buttons change the year', async () => {
		await mount({ granularity: 'month' });
		await userEvent.click(page.getByRole('button', { name: 'Next year' }));
		await expect.poll(header).toBe('2027');
		expect(cell('2027-01-01')).not.toBeNull();
	});

	test('right to left, ArrowLeft moves to the next month', async () => {
		await mount({ granularity: 'month', dir: 'rtl', arabic: true });
		await focusTabStop();
		await press('{ArrowLeft}', '2026-04-01');
		await press('{ArrowRight}', '2026-03-01');
		await expect.element(page.getByRole('button', { name: 'السنة التالية' })).toBeInTheDocument();
	});
});

describe('year granularity', () => {
	test('renders a decade with a year on each side', async () => {
		await mount({ granularity: 'year' });
		const cells = [...document.querySelectorAll<HTMLElement>('[role="gridcell"]')];
		expect(cells.map((node) => node.textContent?.trim())).toEqual(
			Array.from({ length: 12 }, (_, index) => String(2019 + index))
		);
		expect(cell('2019-01-01')?.dataset.outside).toBe('true');
		expect(cell('2030-01-01')?.dataset.outside).toBe('true');
		expect(header()).toMatch(/2020\s*[–-]\s*2029/);
		await expect
			.element(page.getByRole('gridcell', { name: '2026' }))
			.toHaveAttribute('aria-current', 'date');
	});

	test('a click selects the year as its first day', async () => {
		const values = await mount({ granularity: 'year' });
		await userEvent.click(page.getByRole('gridcell', { name: '2028' }));
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2028-01-01');
	});

	test('picking a neighbouring year keeps the page', async () => {
		await mount({ granularity: 'year' });
		await userEvent.click(page.getByRole('gridcell', { name: '2030' }));
		await expect
			.element(page.getByRole('gridcell', { name: '2030' }))
			.toHaveAttribute('aria-selected', 'true');
		expect(cell('2019-01-01')).not.toBeNull();
	});

	test('a year range covers whole years', async () => {
		const values = await mount({ granularity: 'year', mode: 'range' });
		await userEvent.click(page.getByRole('gridcell', { name: '2022' }));
		await userEvent.click(page.getByRole('gridcell', { name: '2025' }));
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2022-01-01', '2025-12-31']);
		expect(cell('2023-01-01')?.dataset.inRange).toBe('true');
	});

	test('multiple toggles years', async () => {
		const values = await mount({ granularity: 'year', mode: 'multiple' });
		await userEvent.click(page.getByRole('gridcell', { name: '2024' }));
		await userEvent.click(page.getByRole('gridcell', { name: '2021' }));
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2021-01-01', '2024-01-01']);
	});

	test('arrows move by year and row, PageUp/PageDown by decade', async () => {
		const values = await mount({ granularity: 'year' });
		await focusTabStop();
		await press('{ArrowDown}', '2029-01-01');
		await press('{ArrowRight}', '2030-01-01');
		// 2031 is on the next page.
		await press('{ArrowRight}', '2031-01-01');
		await expect.poll(header).toMatch(/2030\s*[–-]\s*2039/);
		await press('{PageUp}', '2021-01-01');
		await expect.poll(header).toMatch(/2020\s*[–-]\s*2029/);
		await press('{Home}', '2019-01-01');
		await press('{End}', '2021-01-01');
		await userEvent.keyboard(' ');
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2021-01-01');
	});

	test('years outside the bounds are disabled and skipped', async () => {
		await mount({
			granularity: 'year',
			minDate: new Date(2024, 5, 1),
			maxDate: new Date(2027, 0, 10)
		});
		expect(cell('2023-01-01')?.hasAttribute('disabled')).toBe(true);
		expect(cell('2024-01-01')?.hasAttribute('disabled')).toBe(false);
		expect(cell('2027-01-01')?.hasAttribute('disabled')).toBe(false);
		expect(cell('2028-01-01')?.hasAttribute('disabled')).toBe(true);
		await focusTabStop();
		await press('{ArrowRight}', '2027-01-01');
		// Nothing selectable beyond 2027: focus stays.
		await userEvent.keyboard('{ArrowRight}');
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(focusedKey()).toBe('2027-01-01');
		await expect.element(page.getByRole('button', { name: 'Next decade' })).toBeDisabled();
	});
});

describe('week granularity', () => {
	test('leads each row with its ISO week number', async () => {
		await mount({ granularity: 'week' });
		await expect
			.element(page.getByRole('columnheader', { name: 'Week number' }))
			.toHaveTextContent('Wk');
		const weekHeaders = [...document.querySelectorAll('[role="rowheader"]')];
		expect(weekHeaders.map((node) => node.textContent?.trim())).toEqual([
			'9',
			'10',
			'11',
			'12',
			'13',
			'14'
		]);
		expect(weekHeaders[3].getAttribute('aria-label')).toBe('Week 12, 2026');
		expect(cell('2026-03-18')?.getAttribute('aria-label')).toContain('Week 12, 2026');
	});

	test('a Sunday start shifts the rows and keeps ISO numbers', async () => {
		const values = await mount({ granularity: 'week', weekStartsOnMonday: false });
		await userEvent.click(cell('2026-03-18')!);
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-03-15');
		const row = cell('2026-03-15')!.parentElement!;
		expect(row.querySelector('[role="rowheader"]')?.textContent?.trim()).toBe('12');
	});

	test('a click selects the whole week as its Monday', async () => {
		const values = await mount({ granularity: 'week' });
		await userEvent.click(cell('2026-03-19')!);
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-03-16');
		const selected = [...document.querySelectorAll<HTMLElement>('[aria-selected="true"]')];
		expect(selected.map((node) => node.dataset.date)).toEqual([
			'2026-03-16',
			'2026-03-17',
			'2026-03-18',
			'2026-03-19',
			'2026-03-20',
			'2026-03-21',
			'2026-03-22'
		]);
	});

	test('hovering a day highlights its whole week', async () => {
		await mount({ granularity: 'week' });
		await userEvent.hover(cell('2026-03-25')!);
		await expect
			.poll(() =>
				[...document.querySelectorAll<HTMLElement>('[data-highlighted="true"]')].map(
					(node) => node.dataset.date
				)
			)
			.toEqual([
				'2026-03-23',
				'2026-03-24',
				'2026-03-25',
				'2026-03-26',
				'2026-03-27',
				'2026-03-28',
				'2026-03-29'
			]);
	});

	test('a range spans whole weeks', async () => {
		const values = await mount({ granularity: 'week', mode: 'range' });
		await userEvent.click(cell('2026-03-18')!);
		await userEvent.click(cell('2026-03-04')!);
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2026-03-02', '2026-03-22']);
		expect(cell('2026-03-10')?.dataset.inRange).toBe('true');
		expect(cell('2026-03-02')?.dataset.startOfRange).toBe('true');
		expect(cell('2026-03-22')?.dataset.endOfRange).toBe('true');
	});

	test('multiple toggles weeks', async () => {
		const values = await mount({ granularity: 'week', mode: 'multiple' });
		await userEvent.click(cell('2026-03-03')!);
		await userEvent.click(cell('2026-03-26')!);
		await userEvent.click(cell('2026-03-08')!);
		await expect.poll(() => (values.at(-1) as Date[]).map(keyOf)).toEqual(['2026-03-23']);
	});

	test('a week is disabled only when all its days are', async () => {
		const values = await mount({
			granularity: 'week',
			disabledDates: [
				[new Date(2026, 2, 9), new Date(2026, 2, 15)],
				[new Date(2026, 2, 16), new Date(2026, 2, 20)]
			]
		});
		expect(cell('2026-03-11')?.hasAttribute('disabled')).toBe(true);
		expect(cell('2026-03-17')?.hasAttribute('disabled')).toBe(false);
		expect(cell('2026-03-17')?.dataset.unavailable).toBe('true');
		await userEvent.click(cell('2026-03-17')!);
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-03-16');
	});

	test('ArrowUp/ArrowDown move by week and skip disabled weeks', async () => {
		const values = await mount({
			granularity: 'week',
			disabledDates: [[new Date(2026, 2, 9), new Date(2026, 2, 15)]]
		});
		await focusTabStop();
		expect(focusedKey()).toBe('2026-03-18');
		await press('{ArrowDown}', '2026-03-25');
		await press('{ArrowUp}', '2026-03-18');
		await press('{ArrowUp}', '2026-03-08');
		await userEvent.keyboard('{Enter}');
		await expect.poll(() => keyOf(values.at(-1) as Date)).toBe('2026-03-02');
	});

	test('right to left, the week labels are Arabic and ArrowLeft moves forward', async () => {
		await mount({ granularity: 'week', dir: 'rtl', arabic: true });
		expect(document.querySelectorAll('[role="rowheader"]')[3].getAttribute('aria-label')).toBe(
			'الأسبوع 12، 2026'
		);
		await focusTabStop();
		await press('{ArrowLeft}', '2026-03-19');
	});
});

describe('day granularity', () => {
	test('stays a plain day grid', async () => {
		const values = await mount({ granularity: 'day', mode: 'range' });
		expect(document.querySelector('[role="rowheader"]')).toBeNull();
		await userEvent.click(cell('2026-03-18')!);
		await userEvent.click(cell('2026-03-20')!);
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2026-03-18', '2026-03-20']);
	});
});

describe('DateSelector', () => {
	const trigger = () => page.getByRole('button', { name: /20\d\d|Choose dates|Week/ }).first();

	test('names the selected month, week, year and range in its trigger', async () => {
		await mount({ component: 'selector', granularity: 'month', value: new Date(2026, 2, 18) });
		await expect.element(trigger()).toHaveTextContent('March 2026');
	});

	test('a week value reads as its ISO week', async () => {
		await mount({ component: 'selector', granularity: 'week', value: new Date(2026, 2, 18) });
		await expect.element(trigger()).toHaveTextContent('Week 12, 2026');
	});

	test('a year range reads as its two years and normalises its picks', async () => {
		const values = await mount({
			component: 'selector',
			granularity: 'year',
			mode: 'range',
			value: [new Date(2022, 4, 3), new Date(2024, 1, 1)]
		});
		await expect.element(trigger()).toHaveTextContent('2022 – 2024');
		await userEvent.click(trigger());
		await expect.poll(() => document.querySelector('dialog[open]')).not.toBeNull();
		await userEvent.click(page.getByRole('gridcell', { name: '2021' }));
		await userEvent.click(page.getByRole('gridcell', { name: '2023' }));
		await expect
			.poll(() => (values.at(-1) as Date[]).map(keyOf))
			.toEqual(['2021-01-01', '2023-12-31']);
	});
});
