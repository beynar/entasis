// Date granularity: the period a calendar picks (a day, a week, a month or a year).
//
// A period is identified by its first day. Calendar dates are host-local-noon snapshots (see
// `createCalendarDate`), so every date returned here is noon of a local calendar day; DateInput
// moves its own values to midnight. A range covers whole days, from the first day of its first
// period to the last day of its last period, so it stays a valid inclusive day range.

/** The period a calendar selects: one cell is a day, a week row, a month, or a year. */
export type CalendarGranularity = 'day' | 'week' | 'month' | 'year';

/** First weekday, 0 (Sunday) to 6 (Saturday), as `Date.prototype.getDay()` counts. */
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_MS = 24 * 60 * 60 * 1000;

const calendarDay = (year: number, month: number, day: number) => {
	// setFullYear preserves years 0-99, which the Date constructor would map to 1900-1999.
	const date = new Date(0);
	date.setFullYear(year, month, day);
	date.setHours(12, 0, 0, 0);
	return date;
};

const shiftDays = (date: Date, amount: number) =>
	calendarDay(date.getFullYear(), date.getMonth(), date.getDate() + amount);

/** The first day of the period containing `date`. */
export const getPeriodStart = (
	date: Date,
	granularity: CalendarGranularity,
	weekStartsOn: CalendarWeekStart = 1
): Date => {
	const year = date.getFullYear();
	const month = date.getMonth();
	switch (granularity) {
		case 'year':
			return calendarDay(year, 0, 1);
		case 'month':
			return calendarDay(year, month, 1);
		case 'week': {
			const offset = (date.getDay() - weekStartsOn + 7) % 7;
			return calendarDay(year, month, date.getDate() - offset);
		}
		default:
			return calendarDay(year, month, date.getDate());
	}
};

/** The last day of the period containing `date`. */
export const getPeriodEnd = (
	date: Date,
	granularity: CalendarGranularity,
	weekStartsOn: CalendarWeekStart = 1
): Date => {
	const start = getPeriodStart(date, granularity, weekStartsOn);
	switch (granularity) {
		case 'year':
			return calendarDay(start.getFullYear(), 11, 31);
		case 'month':
			return calendarDay(start.getFullYear(), start.getMonth() + 1, 0);
		case 'week':
			return shiftDays(start, 6);
		default:
			return start;
	}
};

/** The first day of the period `amount` periods after the one containing `date`. */
export const addPeriods = (
	date: Date,
	granularity: CalendarGranularity,
	amount: number,
	weekStartsOn: CalendarWeekStart = 1
): Date => {
	const start = getPeriodStart(date, granularity, weekStartsOn);
	switch (granularity) {
		case 'year':
			return calendarDay(start.getFullYear() + amount, 0, 1);
		case 'month':
			return calendarDay(start.getFullYear(), start.getMonth() + amount, 1);
		case 'week':
			return shiftDays(start, amount * 7);
		default:
			return shiftDays(start, amount);
	}
};

/** Whether two dates fall in the same period. */
export const isSamePeriod = (
	first: Date,
	second: Date,
	granularity: CalendarGranularity,
	weekStartsOn: CalendarWeekStart = 1
) =>
	getPeriodStart(first, granularity, weekStartsOn).getTime() ===
	getPeriodStart(second, granularity, weekStartsOn).getTime();

/**
 * The ISO 8601 week of `date`: weeks start on Monday and week 1 holds the year's first Thursday,
 * so the first days of January can belong to the previous year's last week, and the last days of
 * December to the next year's week 1. `year` is that week-numbering year.
 */
export const getIsoWeek = (date: Date): { week: number; year: number } => {
	const thursday = new Date(0);
	thursday.setUTCFullYear(date.getFullYear(), date.getMonth(), date.getDate());
	const isoWeekday = thursday.getUTCDay() || 7;
	thursday.setUTCDate(thursday.getUTCDate() + 4 - isoWeekday);
	const weekYear = thursday.getUTCFullYear();
	const yearStart = new Date(0);
	yearStart.setUTCFullYear(weekYear, 0, 1);
	const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / DAY_MS + 1) / 7);
	return { week, year: weekYear };
};

/**
 * The ISO week number shown for a calendar week row that starts on `weekStartsOn`. A row that
 * does not start on Monday takes the ISO week of its Thursday, the week it shares most days with.
 */
export const getWeekNumber = (
	date: Date,
	weekStartsOn: CalendarWeekStart = 1
): { week: number; year: number } => {
	const start = getPeriodStart(date, 'week', weekStartsOn);
	return getIsoWeek(shiftDays(start, (4 - weekStartsOn + 7) % 7));
};

/** First year of the 12-year page showing `year`: the decade with one year on each side. */
export const getYearPageStart = (year: number) => Math.floor(year / 10) * 10 - 1;

/** Number of cells on a month or year page. */
export const PERIOD_PAGE_SIZE = 12;
/** Columns of the month and year grids. */
export const PERIOD_GRID_COLUMNS = 3;

export type PeriodBounds = {
	minDate?: Date | null;
	maxDate?: Date | null;
	/** Whether one day cannot be picked (bounds, disabled dates or a disabled calendar). */
	isDayDisabled: (date: Date) => boolean;
};

/**
 * Whether the period containing `date` cannot be picked: every one of its days is disabled.
 * A period with at least one available day stays selectable.
 */
export const isPeriodDisabled = (
	date: Date,
	granularity: CalendarGranularity,
	weekStartsOn: CalendarWeekStart,
	{ minDate, maxDate, isDayDisabled }: PeriodBounds
) => {
	let day = getPeriodStart(date, granularity, weekStartsOn);
	const end = getPeriodEnd(date, granularity, weekStartsOn);
	if (granularity === 'day') return isDayDisabled(day);
	// Skip the part of the period outside the bounds before walking its days.
	if (minDate) {
		const min = calendarDay(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
		if (end < min) return true;
		if (day < min) day = min;
	}
	if (maxDate) {
		const max = calendarDay(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
		if (day > max) return true;
	}
	while (day <= end) {
		if (!isDayDisabled(day)) return false;
		day = shiftDays(day, 1);
	}
	return true;
};

export type PeriodLabelOptions = {
	locale?: string;
	weekStartsOn?: CalendarWeekStart;
	/** Wording of a week, e.g. the catalog's `calendarWeekLabel`. */
	weekLabel: (week: number, year: number) => string;
};

/** The readable name of the period containing `date`: "March 2026", "Week 12, 2026", "2026". */
export const formatPeriod = (
	date: Date,
	granularity: CalendarGranularity,
	{ locale, weekStartsOn = 1, weekLabel }: PeriodLabelOptions
) => {
	switch (granularity) {
		case 'year':
			return date.toLocaleDateString(locale, { year: 'numeric' });
		case 'month':
			return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
		case 'week': {
			const { week, year } = getWeekNumber(date, weekStartsOn);
			return weekLabel(week, year);
		}
		default:
			return date.toLocaleDateString(locale);
	}
};
