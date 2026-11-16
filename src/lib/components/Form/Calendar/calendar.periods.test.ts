import { describe, expect, test } from 'vitest';
import {
	addPeriods,
	formatPeriod,
	getIsoWeek,
	getPeriodEnd,
	getPeriodStart,
	getWeekNumber,
	getYearPageStart,
	isPeriodDisabled,
	isSamePeriod
} from './calendar.periods.js';
import { defaultGranularityFormat } from '../DateInput/dateInput.format.js';

const day = (year: number, month: number, date: number, hour = 12) =>
	new Date(year, month - 1, date, hour);
const key = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}@${date.getHours()}`;

describe('period start and end', () => {
	test('a day is itself, at local noon', () => {
		expect(key(getPeriodStart(day(2026, 3, 18, 23), 'day'))).toBe('2026-03-18@12');
		expect(key(getPeriodEnd(day(2026, 3, 18, 0), 'day'))).toBe('2026-03-18@12');
	});

	test('a week starts on Monday by default, on Sunday when asked', () => {
		// Wednesday 18 March 2026.
		expect(key(getPeriodStart(day(2026, 3, 18), 'week'))).toBe('2026-03-16@12');
		expect(key(getPeriodEnd(day(2026, 3, 18), 'week'))).toBe('2026-03-22@12');
		expect(key(getPeriodStart(day(2026, 3, 18), 'week', 0))).toBe('2026-03-15@12');
		expect(key(getPeriodEnd(day(2026, 3, 18), 'week', 0))).toBe('2026-03-21@12');
		// A Sunday is the last day of a Monday week and the first of a Sunday week.
		expect(key(getPeriodStart(day(2026, 3, 22), 'week', 1))).toBe('2026-03-16@12');
		expect(key(getPeriodStart(day(2026, 3, 22), 'week', 0))).toBe('2026-03-22@12');
	});

	test('a week crosses month and year boundaries', () => {
		expect(key(getPeriodStart(day(2027, 1, 1), 'week'))).toBe('2026-12-28@12');
		expect(key(getPeriodEnd(day(2026, 12, 30), 'week'))).toBe('2027-01-03@12');
	});

	test('a month and a year', () => {
		expect(key(getPeriodStart(day(2026, 2, 17), 'month'))).toBe('2026-02-01@12');
		expect(key(getPeriodEnd(day(2026, 2, 17), 'month'))).toBe('2026-02-28@12');
		expect(key(getPeriodEnd(day(2028, 2, 3), 'month'))).toBe('2028-02-29@12');
		expect(key(getPeriodStart(day(2026, 7, 4), 'year'))).toBe('2026-01-01@12');
		expect(key(getPeriodEnd(day(2026, 7, 4), 'year'))).toBe('2026-12-31@12');
	});

	test('years below 100 stay themselves', () => {
		const date = new Date(0);
		date.setFullYear(42, 5, 9);
		expect(getPeriodStart(date, 'year').getFullYear()).toBe(42);
	});

	test('adding periods lands on the start of the target period', () => {
		expect(key(addPeriods(day(2026, 1, 31), 'month', 1))).toBe('2026-02-01@12');
		expect(key(addPeriods(day(2026, 11, 15), 'month', 3))).toBe('2027-02-01@12');
		expect(key(addPeriods(day(2026, 3, 18), 'week', -1))).toBe('2026-03-09@12');
		expect(key(addPeriods(day(2026, 3, 18), 'year', 10))).toBe('2036-01-01@12');
	});

	test('same period', () => {
		expect(isSamePeriod(day(2026, 3, 16), day(2026, 3, 22), 'week')).toBe(true);
		expect(isSamePeriod(day(2026, 3, 22), day(2026, 3, 23), 'week')).toBe(false);
		expect(isSamePeriod(day(2026, 3, 22), day(2026, 3, 23), 'week', 0)).toBe(true);
		expect(isSamePeriod(day(2026, 3, 1), day(2026, 3, 31), 'month')).toBe(true);
		expect(isSamePeriod(day(2026, 1, 1), day(2027, 1, 1), 'year')).toBe(false);
	});
});

describe('ISO week numbers', () => {
	test.each([
		// [date, week, week-year]
		[day(2026, 1, 1), 1, 2026], // Thursday: week 1 of its own year
		[day(2025, 12, 29), 1, 2026], // Monday of 2026's week 1
		[day(2021, 1, 1), 53, 2020], // Friday: last week of 2020
		[day(2021, 1, 3), 53, 2020],
		[day(2021, 1, 4), 1, 2021],
		[day(2020, 12, 31), 53, 2020],
		[day(2024, 12, 30), 1, 2025],
		[day(2027, 1, 1), 53, 2026], // 2026 has 53 weeks (starts on a Thursday)
		[day(2026, 3, 18), 12, 2026]
	])('%s is week %i of %i', (date, week, year) => {
		expect(getIsoWeek(date)).toEqual({ week, year });
	});

	test('a Sunday-start row takes the ISO week of its Thursday', () => {
		// Row Sunday 15 – Saturday 21 March 2026 shares six days with ISO week 12.
		expect(getWeekNumber(day(2026, 3, 15), 0)).toEqual({ week: 12, year: 2026 });
		expect(getWeekNumber(day(2026, 3, 21), 0)).toEqual({ week: 12, year: 2026 });
		// Row Sunday 28 December 2025 – Saturday 3 January 2026: week 1 of 2026.
		expect(getWeekNumber(day(2025, 12, 28), 0)).toEqual({ week: 1, year: 2026 });
		// Row Sunday 3 – Saturday 9 January 2021: week 1 of 2021.
		expect(getWeekNumber(day(2021, 1, 3), 0)).toEqual({ week: 1, year: 2021 });
	});

	test('a Monday-start row is its ISO week', () => {
		expect(getWeekNumber(day(2021, 1, 3), 1)).toEqual({ week: 53, year: 2020 });
		expect(getWeekNumber(day(2026, 12, 31), 1)).toEqual({ week: 53, year: 2026 });
	});
});

describe('disabled periods', () => {
	const noneDisabled = { isDayDisabled: () => false };

	test('a period is disabled only when every day is', () => {
		const disabledKeys = new Set(['2026-03-16', '2026-03-17', '2026-03-18', '2026-03-19']);
		const isDayDisabled = (date: Date) =>
			disabledKeys.has(
				`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
			);
		expect(isPeriodDisabled(day(2026, 3, 18), 'week', 1, { isDayDisabled })).toBe(false);
		['2026-03-20', '2026-03-21', '2026-03-22'].forEach((value) => disabledKeys.add(value));
		expect(isPeriodDisabled(day(2026, 3, 18), 'week', 1, { isDayDisabled })).toBe(true);
	});

	test('bounds disable the periods entirely outside them', () => {
		const minDate = day(2026, 3, 31);
		const maxDate = day(2026, 6, 1);
		const isDayDisabled = (date: Date) => date < day(2026, 3, 31) || date > day(2026, 6, 1);
		const bounds = { minDate, maxDate, isDayDisabled };
		expect(isPeriodDisabled(day(2026, 2, 1), 'month', 1, bounds)).toBe(true);
		expect(isPeriodDisabled(day(2026, 3, 1), 'month', 1, bounds)).toBe(false);
		expect(isPeriodDisabled(day(2026, 6, 1), 'month', 1, bounds)).toBe(false);
		expect(isPeriodDisabled(day(2026, 7, 1), 'month', 1, bounds)).toBe(true);
		expect(isPeriodDisabled(day(2025, 1, 1), 'year', 1, bounds)).toBe(true);
		expect(isPeriodDisabled(day(2026, 1, 1), 'year', 1, bounds)).toBe(false);
	});

	test('a day period follows its day', () => {
		expect(isPeriodDisabled(day(2026, 3, 18), 'day', 1, noneDisabled)).toBe(false);
		expect(isPeriodDisabled(day(2026, 3, 18), 'day', 1, { isDayDisabled: () => true })).toBe(true);
	});
});

describe('labels and pages', () => {
	const weekLabel = (week: number, year: number) => `Week ${week}, ${year}`;

	test('period names', () => {
		expect(formatPeriod(day(2026, 3, 18), 'month', { locale: 'en-US', weekLabel })).toBe(
			'March 2026'
		);
		expect(formatPeriod(day(2026, 3, 18), 'year', { locale: 'en-US', weekLabel })).toBe('2026');
		expect(formatPeriod(day(2026, 3, 18), 'week', { locale: 'en-US', weekLabel })).toBe(
			'Week 12, 2026'
		);
		expect(formatPeriod(day(2026, 3, 18), 'month', { locale: 'fr', weekLabel })).toBe('mars 2026');
	});

	test('a year page is a decade with a neighbour on each side', () => {
		expect(getYearPageStart(2026)).toBe(2019);
		expect(getYearPageStart(2020)).toBe(2019);
		expect(getYearPageStart(2019)).toBe(2009);
		expect(getYearPageStart(2030)).toBe(2029);
	});

	test('the default DateInput mask follows the granularity and the locale order', () => {
		expect(defaultGranularityFormat('month', 'en-US')).toBe('mm/yyyy');
		expect(defaultGranularityFormat('month', 'fr')).toBe('mm/yyyy');
		expect(defaultGranularityFormat('month', 'ja')).toBe('yyyy/mm');
		expect(defaultGranularityFormat('month', 'zh')).toBe('yyyy/mm');
		expect(defaultGranularityFormat('year', 'en')).toBe('yyyy');
		expect(defaultGranularityFormat('week', 'en')).toBe('dd/mm/yyyy');
	});
});
