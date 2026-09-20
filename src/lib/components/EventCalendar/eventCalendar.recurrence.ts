import {
	addCivilDays,
	assertDateOnly,
	assertRenderableDateOnly,
	assertValidInstant,
	assertValidRange,
	assertValidTimeZone,
	civilDayDifference,
	getCivilWeekday,
	getZonedDay,
	getZonedParts,
	isSupportedDateDomainError,
	MIN_EVENT_CALENDAR_DAY,
	parseDateOnly,
	resolveZonedDateTime,
	startOfZonedDay,
	toDateOnly
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type {
	EventCalendarDateOnly,
	EventCalendarExpandedOccurrence,
	EventCalendarItem,
	EventCalendarRange,
	EventCalendarRecurrenceExpander,
	EventCalendarRecurrenceRule,
	EventCalendarWeekday
} from './eventCalendar.types.js';

export const EVENT_CALENDAR_RECURRENCE_LIMIT = 1_000;

type RecurrenceValue = Date | EventCalendarDateOnly;
export type EventCalendarRecurrenceValue = RecurrenceValue;
type RuntimeRecurrenceIdentity = {
	id?: unknown;
	recurrence?: unknown;
	recurrenceTimeZone?: unknown;
	recurringItemId?: unknown;
	originalStart?: unknown;
};
type RecurrenceWeekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
type NormalizedWeekday = { day: RecurrenceWeekday; ordinal: number | null };
type NormalizedRule = {
	freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	interval: number;
	count: number | null;
	until: RecurrenceValue | null;
	byWeekday: readonly NormalizedWeekday[];
	byMonthDay: readonly number[];
	byMonth: readonly number[];
	weekStart: RecurrenceWeekday;
	exDates: readonly RecurrenceValue[];
	rDates: readonly RecurrenceValue[];
};

export type ExpandEventCalendarRecurrenceOptions<TItemFields extends object> = {
	item: EventCalendarItem<TItemFields>;
	range: EventCalendarRange;
	displayTimeZone: string;
	expandRecurrence?: EventCalendarRecurrenceExpander<TItemFields>;
};

const WEEKDAY_INDEX: Readonly<Record<RecurrenceWeekday, EventCalendarWeekday>> = {
	SU: 0,
	MO: 1,
	TU: 2,
	WE: 3,
	TH: 4,
	FR: 5,
	SA: 6
};
const RECURRENCE_WEEKDAYS = new Set(Object.keys(WEEKDAY_INDEX));
const RECURRENCE_FREQUENCIES = ['daily', 'weekly', 'monthly', 'yearly'] as const;
const RAW_RRULE_PARTS = new Set([
	'FREQ',
	'INTERVAL',
	'COUNT',
	'UNTIL',
	'BYDAY',
	'BYMONTHDAY',
	'BYMONTH',
	'WKST'
]);
const MAX_COMPLEX_COUNT_WORK = 250_000;

/** Returns the collision-safe identity shared by recurrence, projection, and mutation paths. */
export function canonicalEventCalendarRecurrenceOrigin(
	value: EventCalendarRecurrenceValue
): string {
	return value instanceof Date ? `instant:${value.getTime()}` : `day:${value}`;
}

export function hasEventCalendarRecurrenceDateSelectors(
	rule: Pick<EventCalendarRecurrenceRule, 'byWeekday' | 'byMonthDay' | 'byMonth'>
): boolean {
	return Boolean(rule.byWeekday?.length || rule.byMonthDay?.length || rule.byMonth?.length);
}

/** Expands one source series. Consumer expander failures intentionally propagate unchanged. */
export function expandEventCalendarRecurrence<TItemFields extends object>(
	options: ExpandEventCalendarRecurrenceOptions<TItemFields>
): readonly EventCalendarExpandedOccurrence[] {
	const { item, range, displayTimeZone, expandRecurrence } = options;
	assertRecurringSource(item);
	const identity = item as unknown as RuntimeRecurrenceIdentity;
	const recurrence = identity.recurrence as EventCalendarRecurrenceRule | string;
	assertValidRange(range, 'recurrence range');
	assertValidTimeZone(displayTimeZone);
	const recurrenceTimeZone = item.allDay === true ? null : (identity.recurrenceTimeZone as string);
	if (expandRecurrence) {
		const expanded = expandRecurrence({ item, range, displayTimeZone, recurrenceTimeZone });
		return validateExpandedOccurrences(item, expanded, range, displayTimeZone);
	}

	const rule = normalizeRule(recurrence, item.allDay === true, recurrenceTimeZone);
	return expandBuiltIn(item, rule, range, displayTimeZone, recurrenceTimeZone);
}

export function validateEventCalendarRecurrence<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): void {
	assertRecurringSource(item);
	const identity = item as unknown as RuntimeRecurrenceIdentity;
	normalizeRule(
		identity.recurrence as EventCalendarRecurrenceRule | string,
		item.allDay === true,
		item.allDay === true ? null : (identity.recurrenceTimeZone as string)
	);
}

function assertRecurringSource<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): void {
	const identity = item as unknown as RuntimeRecurrenceIdentity;
	if (!item || typeof item !== 'object' || identity.recurrence === undefined) {
		throwInvalidRecurrence('Recurrence expansion requires a recurring source item.', {
			id: item?.id
		});
	}
	if (identity.recurringItemId !== undefined || identity.originalStart !== undefined) {
		throwInvalidRecurrence(
			`Exception item ${String(identity.id)} cannot define a recurrence rule.`,
			{
				id: identity.id
			}
		);
	}
	if (item.allDay === true) {
		if (identity.recurrenceTimeZone !== undefined) {
			throwInvalidRecurrence(
				`All-day recurring item ${String(identity.id)} cannot define recurrenceTimeZone.`,
				{ id: identity.id }
			);
		}
		return;
	}
	if (typeof identity.recurrenceTimeZone !== 'string') {
		throwInvalidRecurrence(
			`Timed recurring item ${String(identity.id)} requires recurrenceTimeZone.`,
			{
				id: identity.id
			}
		);
	}
	try {
		assertValidTimeZone(identity.recurrenceTimeZone);
	} catch (error) {
		if (!(error instanceof EventCalendarError)) throw error;
		throwInvalidRecurrence(
			`Timed recurring item ${String(identity.id)} has an invalid recurrenceTimeZone.`,
			{ id: identity.id, recurrenceTimeZone: identity.recurrenceTimeZone }
		);
	}
}

function normalizeRule(
	rule: EventCalendarRecurrenceRule | string,
	isAllDay: boolean,
	recurrenceTimeZone: string | null
): NormalizedRule {
	if (typeof rule === 'string') return parseRawRule(rule, isAllDay, recurrenceTimeZone);
	if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
		throwInvalidRecurrence('The recurrence rule must be a structured rule or RRULE string.');
	}
	const freq = rule.freq;
	if (!RECURRENCE_FREQUENCIES.includes(freq)) {
		throwInvalidRecurrence('The recurrence frequency is invalid.', { freq });
	}
	const interval = rule.interval ?? 1;
	assertPositiveInteger(interval, 'interval');
	const count = rule.count ?? null;
	if (count !== null) {
		assertPositiveInteger(count, 'count');
		if (rule.until !== undefined) {
			throwInvalidRecurrence('A recurrence rule cannot define both count and until.');
		}
	}
	const until =
		rule.until === undefined ? null : normalizeRecurrenceValue(rule.until, isAllDay, 'until');
	const byWeekday = normalizeWeekdays(rule.byWeekday ?? []);
	const byMonthDay = normalizeIntegerList(rule.byMonthDay ?? [], 'byMonthDay', -31, 31, true);
	const byMonth = normalizeIntegerList(rule.byMonth ?? [], 'byMonth', 1, 12, false);
	const weekStart = rule.weekStart ?? 'MO';
	assertWeekdayName(weekStart, 'weekStart');
	validateSelectorCombination(freq, byWeekday);
	const exDates = normalizeDateList(rule.exDates, isAllDay, 'exDates');
	const rDates = normalizeDateList(rule.rDates, isAllDay, 'rDates');
	return {
		freq,
		interval,
		count,
		until,
		byWeekday,
		byMonthDay,
		byMonth,
		weekStart,
		exDates,
		rDates
	};
}

function parseRawRule(
	rawRule: string,
	isAllDay: boolean,
	recurrenceTimeZone: string | null
): NormalizedRule {
	const trimmed = rawRule.trim();
	if (trimmed.length === 0) throwInvalidRecurrence('The RRULE string cannot be empty.');
	const body = trimmed.toUpperCase().startsWith('RRULE:') ? trimmed.slice(6) : trimmed;
	if (body.includes('\n') || body.includes('\r')) {
		throwUnsupportedRecurrence('Multi-line recurrence properties are not supported.');
	}
	const entries = new Map<string, string>();
	for (const part of body.split(';')) {
		const separator = part.indexOf('=');
		if (separator <= 0 || separator === part.length - 1) {
			throwInvalidRecurrence('Every RRULE part must have a non-empty name and value.', { part });
		}
		const name = part.slice(0, separator).toUpperCase();
		const value = part.slice(separator + 1).toUpperCase();
		if (!RAW_RRULE_PARTS.has(name)) {
			throwUnsupportedRecurrence(`Unsupported RRULE part: ${name}.`, { part: name });
		}
		if (entries.has(name)) throwInvalidRecurrence(`Duplicate RRULE part: ${name}.`, { part: name });
		entries.set(name, value);
	}
	const rawFrequency = entries.get('FREQ');
	if (!rawFrequency) throwInvalidRecurrence('RRULE requires FREQ.');
	const freq = rawFrequency.toLowerCase() as NormalizedRule['freq'];
	if (!RECURRENCE_FREQUENCIES.includes(freq)) {
		throwUnsupportedRecurrence(`Unsupported RRULE frequency: ${rawFrequency}.`);
	}
	const interval = parseRawPositiveInteger(entries.get('INTERVAL') ?? '1', 'INTERVAL');
	const countValue = entries.get('COUNT');
	const count = countValue === undefined ? null : parseRawPositiveInteger(countValue, 'COUNT');
	const rawUntil = entries.get('UNTIL');
	if (count !== null && rawUntil !== undefined) {
		throwInvalidRecurrence('RRULE cannot define both COUNT and UNTIL.');
	}
	const until = rawUntil ? parseRawUntil(rawUntil, isAllDay, recurrenceTimeZone) : null;
	const byWeekday = entries.has('BYDAY') ? parseRawWeekdays(entries.get('BYDAY') as string) : [];
	const byMonthDay = parseRawIntegerSelectors(entries, 'BYMONTHDAY', -31, 31, true);
	const byMonth = parseRawIntegerSelectors(entries, 'BYMONTH', 1, 12, false);
	const weekStart = (entries.get('WKST') ?? 'MO') as RecurrenceWeekday;
	assertWeekdayName(weekStart, 'WKST');
	validateSelectorCombination(freq, byWeekday);
	return {
		freq,
		interval,
		count,
		until,
		byWeekday,
		byMonthDay,
		byMonth,
		weekStart,
		exDates: [],
		rDates: []
	};
}

function expandBuiltIn<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	rule: NormalizedRule,
	range: EventCalendarRange,
	displayTimeZone: string,
	recurrenceTimeZone: string | null
): readonly EventCalendarExpandedOccurrence[] {
	const isAllDay = item.allDay === true;
	const anchorDay = isAllDay ? item.start : getZonedDay(item.start, recurrenceTimeZone as string);
	const duration = isAllDay
		? civilDayDifference(item.start, item.end)
		: item.end.getTime() - item.start.getTime();
	let rangeStart: EventCalendarDateOnly;
	try {
		rangeStart = isAllDay
			? addCivilDays(getZonedDay(range.start, displayTimeZone), -Math.max(0, duration - 1))
			: getZonedDay(new Date(range.start.getTime() - duration), recurrenceTimeZone as string);
	} catch (error) {
		if (isSupportedDateDomainError(error)) rangeStart = MIN_EVENT_CALENDAR_DAY;
		else throw error;
	}
	const rangeEnd = getZonedDay(
		new Date(Math.max(range.start.getTime(), range.end.getTime() - 1)),
		recurrenceTimeZone ?? displayTimeZone
	);
	const scanStart = rangeStart > anchorDay ? rangeStart : anchorDay;
	const generated: EventCalendarExpandedOccurrence[] = [];
	const origins = new Set<string>();
	const exclusions = new Set(rule.exDates.map(canonicalEventCalendarRecurrenceOrigin));
	let generatedByRule =
		rule.count === null ? 0 : countRuleOccurrencesBefore(scanStart, anchorDay, rule);
	const appendOccurrence = (originalStart: RecurrenceValue): void => {
		const occurrence = createExpandedOccurrence(item, originalStart, duration);
		if (occurrence)
			addExpandedOccurrence(generated, origins, exclusions, occurrence, range, displayTimeZone);
	};

	for (
		let day = scanStart;
		day <= rangeEnd && (rule.count === null || generatedByRule < rule.count);
		day = addCivilDays(day, 1)
	) {
		const isAnchor = day === anchorDay;
		if (!isAnchor && !matchesRuleDay(day, anchorDay, rule)) continue;
		const originalStart = createOriginalStart(item, day, recurrenceTimeZone);
		if (compareRecurrenceValues(originalStart, item.start) < 0) continue;
		if (rule.until && compareRecurrenceValues(originalStart, rule.until) > 0) break;
		generatedByRule += 1;
		if (rule.count !== null && generatedByRule > rule.count) break;
		appendOccurrence(originalStart);
	}

	for (const originalStart of rule.rDates) {
		appendOccurrence(originalStart);
	}
	generated.sort(compareExpandedOccurrences);
	return generated;
}

function countRuleOccurrencesBefore(
	exclusiveDay: EventCalendarDateOnly,
	anchorDay: EventCalendarDateOnly,
	rule: NormalizedRule
): number {
	if (exclusiveDay <= anchorDay) return 0;
	const limit = rule.count as number;
	if (rule.freq === 'daily')
		return countDailyOccurrencesBefore(exclusiveDay, anchorDay, rule, limit);
	if (rule.freq === 'weekly') {
		return countWeeklyOccurrencesBefore(exclusiveDay, anchorDay, rule, limit);
	}
	return countPeriodOccurrencesBefore(exclusiveDay, anchorDay, rule, limit);
}

function countDailyOccurrencesBefore(
	exclusiveDay: EventCalendarDateOnly,
	anchorDay: EventCalendarDateOnly,
	rule: NormalizedRule,
	limit: number
): number {
	const candidateCount = Math.floor(
		(civilDayDifference(anchorDay, exclusiveDay) - 1) / rule.interval
	);
	if (candidateCount <= 0) return 1;
	if (rule.byMonth.length === 0 && rule.byMonthDay.length === 0) {
		if (rule.byWeekday.length === 0) return Math.min(limit, candidateCount + 1);
		const weekdaySelectors = new Set(rule.byWeekday.map((weekday) => WEEKDAY_INDEX[weekday.day]));
		let dividend = Math.abs(rule.interval);
		let divisor = 7;
		while (divisor !== 0) {
			const remainder = dividend % divisor;
			dividend = divisor;
			divisor = remainder;
		}
		const cycleLength = 7 / dividend;
		const weekdayStep = rule.interval % 7;
		const anchorWeekday = getCivilWeekday(anchorDay);
		const countMatches = (length: number): number => {
			let count = 0;
			for (let index = 1; index <= length; index += 1) {
				const weekday = modulo(anchorWeekday + index * weekdayStep, 7) as EventCalendarWeekday;
				if (weekdaySelectors.has(weekday)) count += 1;
			}
			return count;
		};
		const fullCycles = Math.floor(candidateCount / cycleLength);
		const count =
			1 + fullCycles * countMatches(cycleLength) + countMatches(candidateCount % cycleLength);
		return Math.min(limit, count);
	}

	let count = 1;
	let work = 0;
	for (let index = 1; index <= candidateCount && count < limit; index += 1) {
		work += 1;
		if (work > MAX_COMPLEX_COUNT_WORK) throwInternalRecurrenceLimit(rule, work);
		const day = addCivilDays(anchorDay, index * rule.interval);
		if (matchesRuleDay(day, anchorDay, rule)) count += 1;
	}
	return count;
}

function countWeeklyOccurrencesBefore(
	exclusiveDay: EventCalendarDateOnly,
	anchorDay: EventCalendarDateOnly,
	rule: NormalizedRule,
	limit: number
): number {
	const weekStart = WEEKDAY_INDEX[rule.weekStart];
	const anchorWeekStart = getRecurrenceWeekStart(anchorDay, weekStart);
	const weekdays =
		rule.byWeekday.length === 0
			? [getCivilWeekday(anchorDay)]
			: rule.byWeekday.map((weekday) => WEEKDAY_INDEX[weekday.day]);
	const weekStep =
		rule.interval > Math.floor(Number.MAX_SAFE_INTEGER / 7)
			? Number.POSITIVE_INFINITY
			: rule.interval * 7;
	const uniqueWeekdays = new Set(weekdays);
	if (rule.byMonth.length === 0 && rule.byMonthDay.length === 0) {
		const anchorOffset = civilDayDifference(anchorWeekStart, anchorDay);
		const exclusiveOffset = civilDayDifference(anchorWeekStart, exclusiveDay);
		let count = 1;
		for (const weekday of uniqueWeekdays) {
			const offset = modulo(weekday - weekStart, 7);
			const firstIndex = Math.max(0, Math.ceil((anchorOffset + 1 - offset) / weekStep));
			const lastIndex = Math.floor((exclusiveOffset - 1 - offset) / weekStep);
			if (lastIndex >= firstIndex) count += lastIndex - firstIndex + 1;
		}
		return Math.min(limit, count);
	}

	const weekSpan = civilDayDifference(anchorWeekStart, exclusiveDay);
	const weekCount =
		weekSpan <= 0
			? 0
			: weekStep === Number.POSITIVE_INFINITY
				? 1
				: Math.floor((weekSpan - 1) / weekStep) + 1;
	let count = 1;
	let work = 0;
	for (let weekIndex = 0; weekIndex < weekCount && count < limit; weekIndex += 1) {
		work += 1;
		if (work > MAX_COMPLEX_COUNT_WORK) throwInternalRecurrenceLimit(rule, work);
		const currentWeek = addCivilDays(anchorWeekStart, weekIndex * rule.interval * 7);
		for (const weekday of uniqueWeekdays) {
			const day = addCivilDays(currentWeek, modulo(weekday - weekStart, 7));
			if (day <= anchorDay || day >= exclusiveDay) continue;
			if (matchesRuleDay(day, anchorDay, rule)) count += 1;
			if (count >= limit) break;
		}
	}
	return count;
}

function countPeriodOccurrencesBefore(
	exclusiveDay: EventCalendarDateOnly,
	anchorDay: EventCalendarDateOnly,
	rule: NormalizedRule,
	limit: number
): number {
	const anchor = parseDateOnly(anchorDay);
	const exclusive = parseDateOnly(exclusiveDay);
	const periodCount =
		rule.freq === 'monthly'
			? Math.floor(
					((exclusive.year - anchor.year) * 12 + exclusive.month - anchor.month) / rule.interval
				) + 1
			: Math.floor((exclusive.year - anchor.year) / rule.interval) + 1;
	if (periodCount > MAX_COMPLEX_COUNT_WORK) throwInternalRecurrenceLimit(rule, periodCount);
	let count = 1;
	for (let period = 0; period < periodCount && count < limit; period += 1) {
		let months: readonly { year: number; month: number }[];
		if (rule.freq === 'monthly') {
			const monthIndex = anchor.year * 12 + anchor.month - 1 + period * rule.interval;
			months = [{ year: Math.floor(monthIndex / 12), month: modulo(monthIndex, 12) + 1 }];
		} else {
			const year = anchor.year + period * rule.interval;
			const hasDaySelector = rule.byMonthDay.length > 0 || rule.byWeekday.length > 0;
			const selectedMonths =
				rule.byMonth.length > 0
					? [...rule.byMonth].sort((left, right) => left - right)
					: hasDaySelector
						? Array.from({ length: 12 }, (_, index) => index + 1)
						: [anchor.month];
			months = selectedMonths.map((month) => ({ year, month }));
		}
		for (const { year, month } of months) {
			for (const dayOfMonth of getPeriodCandidateDays(year, month, anchor.day, rule)) {
				const day = toDateOnly({ year, month, day: dayOfMonth });
				if (day <= anchorDay || day >= exclusiveDay) continue;
				if (matchesRuleDay(day, anchorDay, rule)) count += 1;
				if (count >= limit) break;
			}
			if (count >= limit) break;
		}
	}
	return count;
}

function getPeriodCandidateDays(
	year: number,
	month: number,
	anchorDayOfMonth: number,
	rule: NormalizedRule
): readonly number[] {
	const monthLength = daysInMonth(year, month);
	if (rule.byMonthDay.length > 0) {
		return [
			...new Set(
				rule.byMonthDay
					.map((selector) => (selector > 0 ? selector : monthLength + selector + 1))
					.filter((day) => day >= 1 && day <= monthLength)
			)
		].sort((left, right) => left - right);
	}
	if (rule.byWeekday.length === 0) {
		return anchorDayOfMonth <= monthLength ? [anchorDayOfMonth] : [];
	}

	const days = new Set<number>();
	const firstWeekday = getCivilWeekday(toDateOnly({ year, month, day: 1 }));
	const lastWeekday = getCivilWeekday(toDateOnly({ year, month, day: monthLength }));
	for (const selector of rule.byWeekday) {
		const targetWeekday = WEEKDAY_INDEX[selector.day];
		if (rule.freq === 'yearly' && rule.byMonth.length === 0 && selector.ordinal !== null) {
			const ordinalDate = getYearlyOrdinalWeekdayDate(year, targetWeekday, selector.ordinal);
			if (ordinalDate?.month === month) days.add(ordinalDate.day);
			continue;
		}
		if (selector.ordinal === null) {
			const firstMatch = 1 + modulo(targetWeekday - firstWeekday, 7);
			for (let day = firstMatch; day <= monthLength; day += 7) days.add(day);
			continue;
		}
		const day =
			selector.ordinal > 0
				? 1 + modulo(targetWeekday - firstWeekday, 7) + (selector.ordinal - 1) * 7
				: monthLength - modulo(lastWeekday - targetWeekday, 7) + (selector.ordinal + 1) * 7;
		if (day >= 1 && day <= monthLength) days.add(day);
	}
	return [...days].sort((left, right) => left - right);
}

function getYearlyOrdinalWeekdayDate(
	year: number,
	weekday: EventCalendarWeekday,
	ordinal: number
): { month: number; day: number } | null {
	const yearLength = isLeapYear(year) ? 366 : 365;
	let dayOfYear: number;
	if (ordinal > 0) {
		const firstWeekday = getCivilWeekday(toDateOnly({ year, month: 1, day: 1 }));
		dayOfYear = 1 + modulo(weekday - firstWeekday, 7) + (ordinal - 1) * 7;
	} else {
		const lastWeekday = getCivilWeekday(toDateOnly({ year, month: 12, day: 31 }));
		dayOfYear = yearLength - modulo(lastWeekday - weekday, 7) + (ordinal + 1) * 7;
	}
	if (dayOfYear < 1 || dayOfYear > yearLength) return null;

	let month = 1;
	while (dayOfYear > daysInMonth(year, month)) {
		dayOfYear -= daysInMonth(year, month);
		month += 1;
	}
	return { month, day: dayOfYear };
}

function getRecurrenceWeekStart(
	day: EventCalendarDateOnly,
	weekStart: EventCalendarWeekday
): EventCalendarDateOnly {
	return addCivilDays(day, -modulo(getCivilWeekday(day) - weekStart, 7));
}

function throwInternalRecurrenceLimit(rule: NormalizedRule, work: number): never {
	throw new EventCalendarError(
		'recurrence-limit',
		'Recurrence COUNT evaluation exceeded the safe internal candidate-work limit.',
		{ frequency: rule.freq, internalCandidateCount: work, limit: MAX_COMPLEX_COUNT_WORK }
	);
}

function matchesRuleDay(
	day: EventCalendarDateOnly,
	anchorDay: EventCalendarDateOnly,
	rule: NormalizedRule
): boolean {
	const dayParts = parseDateOnly(day);
	const anchorParts = parseDateOnly(anchorDay);
	if (rule.byMonth.length > 0 && !rule.byMonth.includes(dayParts.month)) return false;
	if (rule.freq === 'daily') {
		if (modulo(civilDayDifference(anchorDay, day), rule.interval) !== 0) return false;
	} else if (rule.freq === 'weekly') {
		const weekStart = WEEKDAY_INDEX[rule.weekStart];
		const dayWeekStart = getRecurrenceWeekStart(day, weekStart);
		const anchorWeekStart = getRecurrenceWeekStart(anchorDay, weekStart);
		if (modulo(civilDayDifference(anchorWeekStart, dayWeekStart) / 7, rule.interval) !== 0) {
			return false;
		}
	} else if (rule.freq === 'monthly') {
		const months = (dayParts.year - anchorParts.year) * 12 + dayParts.month - anchorParts.month;
		if (months < 0 || modulo(months, rule.interval) !== 0) return false;
	} else {
		const years = dayParts.year - anchorParts.year;
		if (years < 0 || modulo(years, rule.interval) !== 0) return false;
	}
	if (rule.byMonthDay.length > 0) {
		const monthLength = daysInMonth(dayParts.year, dayParts.month);
		if (
			!rule.byMonthDay.some(
				(selector) => (selector > 0 ? selector : monthLength + selector + 1) === dayParts.day
			)
		) {
			return false;
		}
	}
	if (rule.byWeekday.length === 0) {
		if (rule.freq === 'weekly' && getCivilWeekday(day) !== getCivilWeekday(anchorDay)) return false;
	} else {
		const weekday = getCivilWeekday(day);
		const matchesWeekday = rule.byWeekday.some((selector) => {
			if (WEEKDAY_INDEX[selector.day] !== weekday) return false;
			if (selector.ordinal === null) return true;
			return rule.freq === 'monthly' || rule.byMonth.length > 0
				? matchesWeekdayOrdinalInMonth(dayParts, selector.ordinal)
				: matchesWeekdayOrdinalInYear(day, dayParts.year, selector.ordinal);
		});
		if (!matchesWeekday) return false;
	}

	const hasDaySelector = rule.byMonthDay.length > 0 || rule.byWeekday.length > 0;
	if (!hasDaySelector) {
		if (rule.freq === 'monthly') return dayParts.day === anchorParts.day;
		if (rule.freq === 'yearly') {
			return (
				dayParts.day === anchorParts.day &&
				(rule.byMonth.length > 0 || dayParts.month === anchorParts.month)
			);
		}
	}
	return true;
}

function createOriginalStart<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	day: EventCalendarDateOnly,
	recurrenceTimeZone: string | null
): RecurrenceValue {
	if (item.allDay === true) return day;
	const sourceWall = getZonedParts(item.start, recurrenceTimeZone as string);
	const parts = parseDateOnly(day);
	return resolveZonedDateTime(
		{
			...parts,
			hour: sourceWall.hour,
			minute: sourceWall.minute,
			second: sourceWall.second,
			millisecond: sourceWall.millisecond
		},
		recurrenceTimeZone as string
	);
}

function createExpandedOccurrence<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	originalStart: RecurrenceValue,
	duration: number
): EventCalendarExpandedOccurrence | null {
	if (item.allDay === true) {
		if (typeof originalStart !== 'string')
			throwInvalidRecurrence('All-day origin must be date-only.');
		let end: EventCalendarDateOnly;
		try {
			end = addCivilDays(originalStart, duration);
		} catch (error) {
			if (isSupportedDateDomainError(error)) return null;
			throw error;
		}
		return { allDay: true, start: originalStart, end, originalStart };
	}
	if (!(originalStart instanceof Date)) throwInvalidRecurrence('Timed origin must be an instant.');
	const start = new Date(originalStart);
	return {
		allDay: false,
		start,
		end: new Date(start.getTime() + duration),
		originalStart: new Date(start)
	};
}

function addExpandedOccurrence(
	occurrences: EventCalendarExpandedOccurrence[],
	origins: Set<string>,
	exclusions: ReadonlySet<string>,
	occurrence: EventCalendarExpandedOccurrence,
	range: EventCalendarRange,
	displayTimeZone: string
): void {
	const origin = canonicalEventCalendarRecurrenceOrigin(occurrence.originalStart);
	if (origins.has(origin) || exclusions.has(origin)) return;
	if (!expandedOccurrenceIntersects(occurrence, range, displayTimeZone)) return;
	origins.add(origin);
	occurrences.push(occurrence);
	if (occurrences.length > EVENT_CALENDAR_RECURRENCE_LIMIT) throwRecurrenceLimit();
}

function validateExpandedOccurrences<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	expanded: readonly EventCalendarExpandedOccurrence[],
	range: EventCalendarRange,
	displayTimeZone: string
): readonly EventCalendarExpandedOccurrence[] {
	if (!Array.isArray(expanded)) {
		throwInvalidRecurrence(`The recurrence expander for ${item.id} must return an array.`, {
			id: item.id
		});
	}
	if (expanded.length > EVENT_CALENDAR_RECURRENCE_LIMIT) {
		throwRecurrenceLimit({ id: item.id, count: expanded.length });
	}
	const origins = new Set<string>();
	const validated = expanded.map((occurrence, index) => {
		if (
			!occurrence ||
			typeof occurrence !== 'object' ||
			occurrence.allDay !== (item.allDay === true)
		) {
			throwInvalidRecurrence(`Expanded occurrence ${index} for ${item.id} has the wrong kind.`, {
				id: item.id,
				index
			});
		}
		const validatedOccurrence = validateExpandedOccurrence(item.id, occurrence, index);
		if (!expandedOccurrenceIntersects(validatedOccurrence, range, displayTimeZone)) {
			throwInvalidRecurrence(
				`Expanded occurrence ${index} for ${item.id} is outside the requested range.`,
				{
					id: item.id,
					index
				}
			);
		}
		const origin = canonicalEventCalendarRecurrenceOrigin(validatedOccurrence.originalStart);
		if (origins.has(origin)) {
			const diagnosticOrigin = formatRecurrenceOriginForError(validatedOccurrence.originalStart);
			throwInvalidRecurrence(
				`The recurrence expander returned duplicate origin ${diagnosticOrigin}.`,
				{
					id: item.id,
					origin: diagnosticOrigin
				}
			);
		}
		origins.add(origin);
		return validatedOccurrence;
	});
	validated.sort(compareExpandedOccurrences);
	return validated;
}

function validateExpandedOccurrence(
	itemId: string,
	occurrence: EventCalendarExpandedOccurrence,
	index: number
): EventCalendarExpandedOccurrence {
	const kind = occurrence.allDay ? 'all-day' : 'timed';
	try {
		if (occurrence.allDay) {
			assertRenderableDateOnly(occurrence.start, 'expanded.start');
			assertDateOnly(occurrence.end, 'expanded.end');
			assertRenderableDateOnly(occurrence.originalStart, 'expanded.originalStart');
		} else {
			assertValidInstant(occurrence.start, 'expanded.start');
			assertValidInstant(occurrence.end, 'expanded.end');
			assertValidInstant(occurrence.originalStart, 'expanded.originalStart');
		}
	} catch (error) {
		if (!(error instanceof EventCalendarError)) throw error;
		throwInvalidRecurrence(`Expanded ${kind} occurrence ${index} for ${itemId} is invalid.`, {
			id: itemId,
			index
		});
	}
	const invalidRangeOrOrigin = occurrence.allDay
		? occurrence.end <= occurrence.start || occurrence.start !== occurrence.originalStart
		: occurrence.end.getTime() < occurrence.start.getTime() ||
			occurrence.start.getTime() !== occurrence.originalStart.getTime();
	if (invalidRangeOrOrigin) {
		throwInvalidRecurrence(
			`Expanded ${kind} occurrence ${index} for ${itemId} has an invalid range or origin.`,
			{
				id: itemId,
				index
			}
		);
	}
	return occurrence.allDay
		? { ...occurrence }
		: {
				allDay: false,
				start: new Date(occurrence.start),
				end: new Date(occurrence.end),
				originalStart: new Date(occurrence.originalStart)
			};
}

function expandedOccurrenceIntersects(
	occurrence: EventCalendarExpandedOccurrence,
	range: EventCalendarRange,
	displayTimeZone: string
): boolean {
	const start = occurrence.allDay
		? startOfZonedDay(occurrence.start, displayTimeZone)
		: occurrence.start;
	const end = occurrence.allDay ? startOfZonedDay(occurrence.end, displayTimeZone) : occurrence.end;
	if (start.getTime() === end.getTime()) {
		return start.getTime() >= range.start.getTime() && start.getTime() < range.end.getTime();
	}
	return start.getTime() < range.end.getTime() && range.start.getTime() < end.getTime();
}

function parseRawUntil(
	value: string,
	isAllDay: boolean,
	recurrenceTimeZone: string | null
): RecurrenceValue {
	if (isAllDay) {
		const match = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
		if (!match) throwInvalidRecurrence('All-day RRULE UNTIL must use YYYYMMDD.');
		try {
			const date = toDateOnly({
				year: Number(match[1]),
				month: Number(match[2]),
				day: Number(match[3])
			});
			assertRenderableDateOnly(date, 'UNTIL');
			return date;
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			throwInvalidRecurrence('All-day RRULE UNTIL must be a selectable Gregorian calendar day.', {
				value
			});
		}
	}
	const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
	if (!match) throwInvalidRecurrence('Timed RRULE UNTIL must use YYYYMMDDTHHMMSS or UTC Z form.');
	const wallTime = {
		year: Number(match[1]),
		month: Number(match[2]),
		day: Number(match[3]),
		hour: Number(match[4]),
		minute: Number(match[5]),
		second: Number(match[6])
	};
	validateRawWallTime(wallTime, value);
	if (match[7] === 'Z') {
		const date = new Date(0);
		date.setUTCFullYear(wallTime.year, wallTime.month - 1, wallTime.day);
		date.setUTCHours(wallTime.hour, wallTime.minute, wallTime.second, 0);
		return date;
	}
	return resolveZonedDateTime(wallTime, recurrenceTimeZone as string);
}

function validateRawWallTime(
	parts: { year: number; month: number; day: number; hour: number; minute: number; second: number },
	value: string
): void {
	try {
		toDateOnly(parts);
	} catch (error) {
		if (!(error instanceof EventCalendarError)) throw error;
		throwInvalidRecurrence('Timed RRULE UNTIL has an invalid calendar date.', { value });
	}
	if (parts.hour > 23 || parts.minute > 59 || parts.second > 59) {
		throwInvalidRecurrence('Timed RRULE UNTIL has an invalid clock time.', { value });
	}
}

function parseRawWeekdays(value: string): readonly NormalizedWeekday[] {
	const weekdays = value.split(',').map((token) => {
		const match = /^([+-]?\d{1,2})?(MO|TU|WE|TH|FR|SA|SU)$/.exec(token);
		if (!match) throwInvalidRecurrence(`Invalid BYDAY value: ${token}.`);
		const ordinal = match[1] === undefined ? null : Number(match[1]);
		if (ordinal !== null && (ordinal === 0 || Math.abs(ordinal) > 53)) {
			throwInvalidRecurrence(`Invalid BYDAY ordinal: ${token}.`);
		}
		return { day: match[2] as RecurrenceWeekday, ordinal };
	});
	assertUniqueWeekdays(weekdays, 'BYDAY');
	return weekdays;
}

function normalizeWeekdays(
	values: NonNullable<EventCalendarRecurrenceRule['byWeekday']>
): readonly NormalizedWeekday[] {
	if (!Array.isArray(values)) throwInvalidRecurrence('byWeekday must be an array.');
	const weekdays = values.map((value) => {
		if (typeof value === 'string') {
			assertWeekdayName(value, 'byWeekday');
			return { day: value, ordinal: null };
		}
		if (!value || typeof value !== 'object') throwInvalidRecurrence('byWeekday is invalid.');
		assertWeekdayName(value.day, 'byWeekday.day');
		if (!Number.isInteger(value.ordinal) || value.ordinal === 0 || Math.abs(value.ordinal) > 53) {
			throwInvalidRecurrence('byWeekday ordinal must be a non-zero integer from -53 through 53.');
		}
		return { day: value.day, ordinal: value.ordinal };
	});
	assertUniqueWeekdays(weekdays, 'byWeekday');
	return weekdays;
}

function validateSelectorCombination(
	frequency: NormalizedRule['freq'],
	weekdays: readonly NormalizedWeekday[]
): void {
	if (
		(frequency === 'daily' || frequency === 'weekly') &&
		weekdays.some((weekday) => weekday.ordinal !== null)
	) {
		throwUnsupportedRecurrence(`Ordinal BYDAY is unsupported with ${frequency} frequency.`);
	}
}

function normalizeIntegerList(
	values: readonly number[],
	name: string,
	minimum: number,
	maximum: number,
	excludeZero: boolean
): readonly number[] {
	if (!Array.isArray(values)) throwInvalidRecurrence(`${name} must be an array.`);
	for (const value of values) {
		if (
			!Number.isInteger(value) ||
			value < minimum ||
			value > maximum ||
			(excludeZero && value === 0)
		) {
			throwInvalidRecurrence(`${name} contains an out-of-range integer.`, { value });
		}
	}
	assertUnique(values, name);
	return [...values];
}

function normalizeDateList(
	values: readonly RecurrenceValue[] | undefined,
	isAllDay: boolean,
	name: string
): readonly RecurrenceValue[] {
	if (values === undefined) return [];
	if (!Array.isArray(values)) throwInvalidRecurrence(`${name} must be an array.`);
	const normalized = values.map((value) => normalizeRecurrenceValue(value, isAllDay, name));
	assertUnique(normalized.map(canonicalEventCalendarRecurrenceOrigin), name);
	return normalized;
}

function normalizeRecurrenceValue(
	value: unknown,
	isAllDay: boolean,
	name: string
): RecurrenceValue {
	if (isAllDay) {
		try {
			assertRenderableDateOnly(value, name);
			return value;
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			throwInvalidRecurrence(`${name} must contain canonical date-only values.`);
		}
	}
	if (value instanceof Date && Number.isFinite(value.getTime())) return new Date(value);
	throwInvalidRecurrence(`${name} must contain valid Date instants.`);
}

function parseRawPositiveInteger(value: string, name: string): number {
	if (!/^[1-9]\d*$/.test(value)) throwInvalidRecurrence(`${name} must be a positive integer.`);
	const parsed = Number(value);
	assertPositiveInteger(parsed, name);
	return parsed;
}

function parseRawIntegerSelectors(
	entries: ReadonlyMap<string, string>,
	name: string,
	minimum: number,
	maximum: number,
	excludeZero: boolean
): readonly number[] {
	const value = entries.get(name);
	return value === undefined
		? []
		: normalizeIntegerList(
				value.split(',').map((entry) => {
					if (!/^[+-]?\d+$/.test(entry)) {
						throwInvalidRecurrence(`${name} contains an invalid integer.`);
					}
					return Number(entry);
				}),
				name,
				minimum,
				maximum,
				excludeZero
			);
}

function assertPositiveInteger(value: number, name: string): void {
	if (Number.isSafeInteger(value) && value > 0) return;
	throwInvalidRecurrence(`${name} must be a positive safe integer.`, { value });
}

function assertWeekdayName(value: unknown, name: string): asserts value is RecurrenceWeekday {
	if (typeof value === 'string' && RECURRENCE_WEEKDAYS.has(value)) return;
	throwInvalidRecurrence(`${name} must be an RFC weekday name.`, { value });
}

function assertUnique(values: readonly (string | number)[], name: string): void {
	if (new Set(values).size === values.length) return;
	throwInvalidRecurrence(`${name} cannot contain duplicate values.`);
}

function assertUniqueWeekdays(values: readonly NormalizedWeekday[], name: string): void {
	assertUnique(
		values.map((weekday) => `${weekday.ordinal ?? ''}${weekday.day}`),
		name
	);
}

function matchesWeekdayOrdinalInMonth(
	parts: ReturnType<typeof parseDateOnly>,
	ordinal: number
): boolean {
	const positive = Math.floor((parts.day - 1) / 7) + 1;
	const negative = -Math.floor((daysInMonth(parts.year, parts.month) - parts.day) / 7) - 1;
	return ordinal === positive || ordinal === negative;
}

function matchesWeekdayOrdinalInYear(
	day: EventCalendarDateOnly,
	year: number,
	ordinal: number
): boolean {
	const yearStart = toDateOnly({ year, month: 1, day: 1 });
	const positive = Math.floor(civilDayDifference(yearStart, day) / 7) + 1;
	const dayOfYear = civilDayDifference(yearStart, day);
	const daysRemaining = (isLeapYear(year) ? 366 : 365) - dayOfYear - 1;
	const negative = -Math.floor(daysRemaining / 7) - 1;
	return ordinal === positive || ordinal === negative;
}

function daysInMonth(year: number, month: number): number {
	if (month === 2) return isLeapYear(year) ? 29 : 28;
	return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number): boolean {
	return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function formatRecurrenceOriginForError(value: RecurrenceValue): string {
	return value instanceof Date ? `i${value.getTime()}` : `d${value.length}:${value}`;
}

function compareRecurrenceValues(left: RecurrenceValue, right: RecurrenceValue): number {
	if (left instanceof Date && right instanceof Date) return left.getTime() - right.getTime();
	if (typeof left === 'string' && typeof right === 'string') return compareStrings(left, right);
	throwInvalidRecurrence('Recurrence values have mixed representations.');
}

function compareExpandedOccurrences(
	left: EventCalendarExpandedOccurrence,
	right: EventCalendarExpandedOccurrence
): number {
	if (left.allDay !== right.allDay) return left.allDay ? -1 : 1;
	return compareRecurrenceValues(left.start, right.start);
}

function modulo(value: number, divisor: number): number {
	return ((value % divisor) + divisor) % divisor;
}

function compareStrings(left: string, right: string): number {
	return left < right ? -1 : left > right ? 1 : 0;
}

function throwInvalidRecurrence(
	message: string,
	details?: Readonly<Record<string, unknown>>
): never {
	throw new EventCalendarError('invalid-recurrence', message, details);
}

function throwUnsupportedRecurrence(
	message: string,
	details?: Readonly<Record<string, unknown>>
): never {
	throw new EventCalendarError('unsupported-recurrence', message, details);
}

function throwRecurrenceLimit(details?: Readonly<Record<string, unknown>>): never {
	throw new EventCalendarError(
		'recurrence-limit',
		`Recurrence expansion exceeded ${EVENT_CALENDAR_RECURRENCE_LIMIT} occurrences.`,
		details
	);
}
