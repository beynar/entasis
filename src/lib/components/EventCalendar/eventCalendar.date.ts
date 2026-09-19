import {
	CivilDateError,
	addCivilDateDays,
	addCivilDateMonths,
	formatCivilDate,
	getCivilDateDifference,
	getCivilDateWeekday,
	getCivilDaysInMonth,
	modulo,
	parseCivilDate,
	startOfCivilDateWeek,
	type CivilDate
} from '$lib/scheduling/civilDate.js';
import {
	assertScheduleInstant,
	assertScheduleRange,
	intersectScheduleRanges,
	scheduleRangesIntersect
} from '$lib/scheduling/scheduleRange.js';
import {
	ZonedTimeError,
	assertIanaTimeZone,
	getDateTimeFormatter,
	getInstantZonedDay,
	getInstantZonedParts,
	normalizeFormattingLocale,
	resolveZonedMinuteOnDay,
	resolveZonedWallTime,
	snapInstantWithinZonedDay,
	startOfZonedCivilDay
} from '$lib/scheduling/zonedTime.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type {
	EventCalendarDateOnly,
	EventCalendarOffDaysConfig,
	EventCalendarRange,
	EventCalendarRangeChangeInfo,
	EventCalendarView,
	EventCalendarWeekday
} from './eventCalendar.types.js';

const MINUTE_MS = 60_000;
const MAX_VISIBLE_DAY_SCAN = 100_000;
const MAX_NEARBY_VISIBLE_DAY_SCAN = 8;
export const MIN_EVENT_CALENDAR_DAY: EventCalendarDateOnly = '0001-01-01';
export const MAX_EVENT_CALENDAR_DAY: EventCalendarDateOnly = '9999-12-30';
export const MAX_EVENT_CALENDAR_BOUNDARY: EventCalendarDateOnly = '9999-12-31';
const SUPPORTED_DATE_DOMAIN_REASON = 'supported-date-domain';

export type EventCalendarWallTime = CivilDate & {
	hour?: number;
	minute?: number;
	second?: number;
	millisecond?: number;
};

export type EventCalendarDateProfileOptions = {
	view: EventCalendarView;
	date: Date;
	timeZone: string;
	locale: string;
	weekStartsOn: EventCalendarWeekday;
	fixedWeeks: boolean;
	showOutsideDays: boolean;
	showWeekends: boolean;
	weekendDays: readonly EventCalendarWeekday[];
	dayCount: number;
	agendaDayCount: number;
	validRange?: EventCalendarRange;
};

export type EventCalendarSnapMode = 'floor' | 'round' | 'ceil';
export type EventCalendarNavigationIncrement = Readonly<
	| { unit: 'month'; amount: number }
	| { unit: 'civil-day'; amount: number }
	| { unit: 'visible-day'; amount: number }
>;

export type EventCalendarDateProfile = EventCalendarRangeChangeInfo & {
	locale: string;
	title: string;
	navigationIncrement: EventCalendarNavigationIncrement;
};

export function assertValidInstant(value: Date, name = 'date'): void {
	try {
		assertScheduleInstant(value, name);
	} catch (error) {
		if (!(error instanceof RangeError)) throw error;
		throw new EventCalendarError('invalid-prop', `${name} must be a valid Date instant.`, {
			prop: name
		});
	}
}

export function assertValidTimeZone(timeZone: string): void {
	if (typeof timeZone !== 'string' || timeZone.length === 0) {
		throw new EventCalendarError('invalid-time-zone', 'timeZone must be a non-empty string.', {
			timeZone
		});
	}
	try {
		assertIanaTimeZone(timeZone);
	} catch (error) {
		if (!(error instanceof ZonedTimeError)) throw error;
		throw new EventCalendarError(
			'invalid-time-zone',
			`timeZone must be a supported IANA name or UTC: ${timeZone}.`,
			{ timeZone, cause: error instanceof Error ? error.message : String(error) }
		);
	}
}

export function normalizeLocale(locale: string): string {
	if (typeof locale !== 'string' || locale.length === 0) {
		throw new EventCalendarError('invalid-prop', 'locale must be a non-empty BCP-47 tag.', {
			prop: 'locale',
			locale
		});
	}
	try {
		return normalizeFormattingLocale(locale);
	} catch (error) {
		if (!(error instanceof ZonedTimeError)) throw error;
		throw new EventCalendarError('invalid-prop', `locale must be a valid BCP-47 tag: ${locale}.`, {
			prop: 'locale',
			locale,
			cause: error instanceof Error ? error.message : String(error)
		});
	}
}

export function parseDateOnly(value: string, name = 'date'): CivilDate {
	try {
		return parseCivilDate(value);
	} catch (error) {
		if (!(error instanceof CivilDateError)) throw error;
		const message =
			error.code === 'invalid-format'
				? `${name} must use canonical YYYY-MM-DD form.`
				: `${name} must be a real Gregorian date.`;
		throw new EventCalendarError('invalid-prop', message, { prop: name, value });
	}
}

export function assertDateOnly(
	value: unknown,
	name = 'date'
): asserts value is EventCalendarDateOnly {
	if (typeof value !== 'string') {
		throw new EventCalendarError('invalid-prop', `${name} must be a YYYY-MM-DD string.`, {
			prop: name,
			value
		});
	}
	parseDateOnly(value, name);
}

export function assertRenderableDateOnly(
	value: unknown,
	name = 'date'
): asserts value is EventCalendarDateOnly {
	assertDateOnly(value, name);
	if (value <= MAX_EVENT_CALENDAR_DAY) return;
	throw new EventCalendarError(
		'invalid-prop',
		`${name} must not exceed the last selectable EventCalendar day.`,
		{
			name,
			value,
			maximumDay: MAX_EVENT_CALENDAR_DAY,
			maximumExclusiveBoundary: MAX_EVENT_CALENDAR_BOUNDARY
		}
	);
}

export function isEventCalendarOffDay(
	day: EventCalendarDateOnly,
	offDays: boolean | EventCalendarOffDaysConfig,
	weekendDays: readonly EventCalendarWeekday[]
): boolean {
	if (offDays === false) return false;
	const weekday = getCivilWeekday(day);
	if (offDays === true) return weekendDays.includes(weekday);
	return (
		(offDays.weekdays?.includes(weekday) ?? false) ||
		(offDays.dates?.includes(day) ?? false) ||
		(offDays.isOffDay?.(day) ?? false)
	);
}

export function toDateOnly(parts: CivilDate): EventCalendarDateOnly {
	if (
		!Number.isInteger(parts.year) ||
		!Number.isInteger(parts.month) ||
		!Number.isInteger(parts.day) ||
		parts.year < 1 ||
		parts.year > 9999 ||
		parts.month < 1 ||
		parts.month > 12 ||
		parts.day < 1 ||
		parts.day > getCivilDaysInMonth(parts.year, parts.month)
	) {
		if (Number.isInteger(parts.year) && (parts.year < 1 || parts.year > 9999)) {
			throwSupportedDateDomainError({ parts });
		}
		throw new EventCalendarError('invalid-prop', 'Civil parts must form a real Gregorian date.', {
			...parts
		});
	}
	const value = formatCivilDate(parts);
	assertDateOnly(value);
	return value;
}

export function getZonedParts(instant: Date, timeZone: string): Required<EventCalendarWallTime> {
	assertValidInstant(instant);
	assertValidTimeZone(timeZone);
	return getInstantZonedParts(instant, timeZone);
}

export function getZonedDay(instant: Date, timeZone: string): EventCalendarDateOnly {
	assertValidInstant(instant);
	assertValidTimeZone(timeZone);
	return getInstantZonedDay(instant, timeZone);
}

/**
 * Resolve an RFC 5545 wall time without relying on host-zone constructor behavior.
 * Repeats choose the earliest matching instant; gaps apply the offset before the transition.
 */
export function resolveZonedDateTime(wallTime: EventCalendarWallTime, timeZone: string): Date {
	assertValidTimeZone(timeZone);
	const normalized = normalizeWallTime(wallTime);
	try {
		return resolveZonedWallTime(normalized, timeZone);
	} catch (error) {
		if (!(error instanceof ZonedTimeError)) throw error;
		throw new EventCalendarError('invalid-prop', 'The wall time could not be resolved.', {
			timeZone,
			wallTime: normalized
		});
	}
}

export function startOfZonedDay(day: EventCalendarDateOnly, timeZone: string): Date {
	parseDateOnly(day);
	assertValidTimeZone(timeZone);
	return startOfZonedCivilDay(day, timeZone);
}

export function endOfZonedDay(day: EventCalendarDateOnly, timeZone: string): Date {
	return startOfZonedDay(addCivilDays(day, 1), timeZone);
}

export function addCivilDays(day: EventCalendarDateOnly, amount: number): EventCalendarDateOnly {
	assertInteger(amount, 'amount');
	try {
		return toDateOnly(addCivilDateDays(parseDateOnly(day), amount));
	} catch (error) {
		if (error instanceof CivilDateError && error.code === 'outside-supported-range') {
			throwSupportedDateDomainError({ day, amount });
		}
		throw error;
	}
}

export function addCivilMonths(day: EventCalendarDateOnly, amount: number): EventCalendarDateOnly {
	assertInteger(amount, 'amount');
	try {
		return toDateOnly(addCivilDateMonths(parseDateOnly(day), amount));
	} catch (error) {
		if (error instanceof CivilDateError && error.code === 'outside-supported-range') {
			throwSupportedDateDomainError({ day, amount });
		}
		throw error;
	}
}

export function getCivilWeekday(day: EventCalendarDateOnly): EventCalendarWeekday {
	const weekday = getCivilDateWeekday(parseDateOnly(day));
	assertWeekday(weekday, 'weekday');
	return weekday;
}

export function startOfCivilWeek(
	day: EventCalendarDateOnly,
	weekStartsOn: EventCalendarWeekday
): EventCalendarDateOnly {
	return toDateOnly(startOfCivilDateWeek(parseDateOnly(day), weekStartsOn));
}

export function enumerateInstantSlots(
	day: EventCalendarDateOnly,
	timeZone: string,
	startMinutes: number,
	endMinutes: number,
	intervalMinutes: number
): readonly Date[] {
	assertMinuteOfDay(startMinutes, 'startMinutes', true);
	assertMinuteOfDay(endMinutes, 'endMinutes', true);
	assertPositiveInteger(intervalMinutes, 'intervalMinutes');
	if (startMinutes >= endMinutes) {
		throw new EventCalendarError('invalid-prop', 'startMinutes must be before endMinutes.', {
			startMinutes,
			endMinutes
		});
	}

	const start = resolveZonedMinutesOnDay(day, startMinutes, timeZone);
	const end = resolveZonedMinutesOnDay(day, endMinutes, timeZone);
	const slots: Date[] = [];
	for (
		let instant = start.getTime();
		instant < end.getTime();
		instant += intervalMinutes * MINUTE_MS
	) {
		slots.push(new Date(instant));
	}
	return slots;
}

export function rangesIntersect(left: EventCalendarRange, right: EventCalendarRange): boolean {
	assertValidRange(left);
	assertValidRange(right);
	return scheduleRangesIntersect(left, right);
}

export function intersectRanges(
	range: EventCalendarRange,
	boundary: EventCalendarRange
): EventCalendarRange {
	assertValidRange(range);
	assertValidRange(boundary);
	return intersectScheduleRanges(range, boundary);
}

export function assertValidRange(range: EventCalendarRange, name = 'range'): void {
	if (!range || typeof range !== 'object') {
		throw new EventCalendarError('invalid-prop', `${name} must be a half-open date range.`, {
			prop: name
		});
	}
	assertValidInstant(range.start, `${name}.start`);
	assertValidInstant(range.end, `${name}.end`);
	try {
		assertScheduleRange(range, name);
	} catch (error) {
		if (!(error instanceof RangeError)) throw error;
		throw new EventCalendarError('invalid-prop', `${name}.end must not precede ${name}.start.`, {
			prop: name
		});
	}
}

export function generateVisibleDays(
	start: EventCalendarDateOnly,
	end: EventCalendarDateOnly,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): readonly EventCalendarDateOnly[] {
	parseDateOnly(start, 'start');
	parseDateOnly(end, 'end');
	if (start > end) {
		throw new EventCalendarError('invalid-prop', 'Visible-day start must not follow its end.', {
			start,
			end
		});
	}
	assertSomeWeekdayVisible(hiddenWeekdays);

	const days: EventCalendarDateOnly[] = [];
	let day = start;
	let scanned = 0;
	while (day < end) {
		if (!hiddenWeekdays.has(getCivilWeekday(day))) days.push(day);
		day = addCivilDays(day, 1);
		scanned += 1;
		if (scanned > MAX_VISIBLE_DAY_SCAN) {
			throw new EventCalendarError(
				'invalid-prop',
				'Visible-day generation exceeded its safe bound.',
				{
					start,
					end
				}
			);
		}
	}
	return days;
}

export function generateVisibleDayCount(
	start: EventCalendarDateOnly,
	count: number,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): readonly EventCalendarDateOnly[] {
	parseDateOnly(start, 'start');
	assertPositiveInteger(count, 'count');
	assertSomeWeekdayVisible(hiddenWeekdays);
	if (hiddenWeekdays.has(getCivilWeekday(start))) {
		throw new EventCalendarError('invalid-prop', 'The first rendered day cannot be hidden.', {
			start
		});
	}

	const days: EventCalendarDateOnly[] = [];
	let day = start;
	let scanned = 0;
	while (days.length < count) {
		if (!hiddenWeekdays.has(getCivilWeekday(day))) days.push(day);
		day = addCivilDays(day, 1);
		scanned += 1;
		if (scanned > MAX_VISIBLE_DAY_SCAN) {
			throw new EventCalendarError(
				'invalid-prop',
				'Visible-day generation exceeded its safe bound.',
				{
					start,
					count
				}
			);
		}
	}
	return days;
}

export function moveVisibleDays(
	day: EventCalendarDateOnly,
	amount: number,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): EventCalendarDateOnly {
	assertInteger(amount, 'amount');
	assertSomeWeekdayVisible(hiddenWeekdays);
	if (amount === 0) return day;
	const direction = Math.sign(amount);
	let remaining = Math.abs(amount);
	let candidate = day;
	while (remaining > 0) {
		candidate = addCivilDays(candidate, direction);
		if (!hiddenWeekdays.has(getCivilWeekday(candidate))) remaining -= 1;
	}
	return candidate;
}

export function snapInstant(
	instant: Date,
	timeZone: string,
	durationMinutes: number,
	mode: EventCalendarSnapMode = 'round'
): Date {
	assertValidInstant(instant);
	assertPositiveInteger(durationMinutes, 'durationMinutes');
	assertValidTimeZone(timeZone);
	return snapInstantWithinZonedDay(instant, timeZone, durationMinutes, mode);
}

export function getWeekNumber(
	day: EventCalendarDateOnly,
	weekStartsOn: EventCalendarWeekday = 1,
	firstWeekContainsDate = 4
): number {
	if (
		!Number.isInteger(firstWeekContainsDate) ||
		firstWeekContainsDate < 1 ||
		firstWeekContainsDate > 7
	) {
		throw new EventCalendarError(
			'invalid-prop',
			'firstWeekContainsDate must be from 1 through 7.',
			{
				firstWeekContainsDate
			}
		);
	}
	const { year } = parseDateOnly(day);
	const dayOrdinal = civilDayDifference(MIN_EVENT_CALENDAR_DAY, day);
	const currentWeekOrdinal = dayOrdinal - modulo(getCivilWeekday(day) - weekStartsOn, 7);
	const firstWeekOrdinal = getFirstWeekStartOrdinal(year, weekStartsOn, firstWeekContainsDate);
	if (currentWeekOrdinal < firstWeekOrdinal) {
		if (year === 1) return 1;
		const previousFirstWeekOrdinal = getFirstWeekStartOrdinal(
			year - 1,
			weekStartsOn,
			firstWeekContainsDate
		);
		return Math.floor((currentWeekOrdinal - previousFirstWeekOrdinal) / 7) + 1;
	}
	const nextFirstWeekOrdinal = getFirstWeekStartOrdinal(
		year + 1,
		weekStartsOn,
		firstWeekContainsDate
	);
	if (currentWeekOrdinal >= nextFirstWeekOrdinal) return 1;
	return Math.floor((currentWeekOrdinal - firstWeekOrdinal) / 7) + 1;
}

export function getCachedDateTimeFormatter(
	locale: string,
	timeZone: string,
	options: Intl.DateTimeFormatOptions = {}
): Intl.DateTimeFormat {
	assertValidTimeZone(timeZone);
	const normalizedLocale = normalizeLocale(locale);
	return getDateTimeFormatter(normalizedLocale, timeZone, options);
}

export function createDateProfile(
	options: EventCalendarDateProfileOptions
): EventCalendarDateProfile {
	const locale = assertDateProfileOptions(options);
	const hiddenWeekdays = getHiddenWeekdays(options);
	const anchorDay = getZonedDay(options.date, options.timeZone);
	let profileDays: ReturnType<typeof getProfileDays>;
	try {
		profileDays = getProfileDays(options, anchorDay, hiddenWeekdays);
	} catch (error) {
		if (!isSupportedDateDomainError(error)) throw error;
		throw new EventCalendarError(
			'invalid-prop',
			`The ${options.view} date profile exceeds the supported civil-date domain.`,
			{
				reason: SUPPORTED_DATE_DOMAIN_REASON,
				view: options.view,
				anchorDay,
				minimumDay: MIN_EVENT_CALENDAR_DAY,
				maximumDay: MAX_EVENT_CALENDAR_DAY,
				maximumExclusiveBoundary: MAX_EVENT_CALENDAR_BOUNDARY,
				cause: error instanceof Error ? error.message : String(error)
			}
		);
	}
	const currentRange = civilRangeToInstantRange(
		profileDays.currentStart,
		profileDays.currentEnd,
		options.timeZone
	);
	const renderRange = civilRangeToInstantRange(
		profileDays.renderStart,
		profileDays.renderEnd,
		options.timeZone
	);
	const activeSource =
		options.view === 'month' && options.showOutsideDays ? renderRange : currentRange;
	const activeRange = options.validRange
		? intersectRanges(activeSource, options.validRange)
		: cloneRange(activeSource);
	const visibleDays =
		profileDays.count === undefined
			? generateVisibleDays(profileDays.visibleStart, profileDays.visibleEnd, hiddenWeekdays)
			: generateVisibleDayCount(profileDays.visibleStart, profileDays.count, hiddenWeekdays);

	if (visibleDays.length === 0) {
		throw new EventCalendarError('invalid-prop', 'The active profile has no visible day.', {
			view: options.view
		});
	}

	return {
		view: options.view,
		date: new Date(options.date),
		timeZone: options.timeZone,
		locale,
		currentRange,
		renderRange,
		activeRange,
		fetchRange: cloneRange(activeRange),
		visibleDays,
		title: getProfileTitle(options, profileDays),
		navigationIncrement: getNavigationIncrement(options)
	};
}

export function reconcileAnchorDay(
	day: EventCalendarDateOnly,
	timeZone: string,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>,
	validRange?: EventCalendarRange
): EventCalendarDateOnly {
	parseDateOnly(day);
	if (day > MAX_EVENT_CALENDAR_DAY) {
		throw new EventCalendarError(
			'invalid-prop',
			'The calendar anchor exceeds the last selectable civil day.',
			{
				day,
				maximumDay: MAX_EVENT_CALENDAR_DAY,
				maximumExclusiveBoundary: MAX_EVENT_CALENDAR_BOUNDARY
			}
		);
	}
	assertValidTimeZone(timeZone);
	assertSomeWeekdayVisible(hiddenWeekdays);
	if (validRange) assertValidRange(validRange, 'validRange');
	if (isSelectableDay(day, timeZone, hiddenWeekdays, validRange)) return day;
	if (validRange && validRange.start.getTime() === validRange.end.getTime()) {
		throwNoSelectableDay(day, timeZone);
	}

	let next = getNextReconciliationDay(day, timeZone, validRange);
	for (let index = 0; next && index < MAX_NEARBY_VISIBLE_DAY_SCAN; index += 1) {
		if (isSelectableDay(next, timeZone, hiddenWeekdays, validRange)) return next;
		if (validRange && startOfZonedDay(next, timeZone).getTime() >= validRange.end.getTime()) break;
		next = addCivilDays(next, 1);
	}

	let previous = getPreviousReconciliationDay(day, timeZone, validRange);
	for (let index = 0; previous && index < MAX_NEARBY_VISIBLE_DAY_SCAN; index += 1) {
		if (isSelectableDay(previous, timeZone, hiddenWeekdays, validRange)) return previous;
		if (validRange && endOfZonedDay(previous, timeZone).getTime() <= validRange.start.getTime()) {
			break;
		}
		previous = addCivilDays(previous, -1);
	}

	throwNoSelectableDay(day, timeZone);
}

export function getNavigationDate(
	profile: EventCalendarDateProfile,
	direction: -1 | 1,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): Date | null {
	const day = getZonedDay(profile.date, profile.timeZone);
	const amount = direction * profile.navigationIncrement.amount;
	const target =
		profile.navigationIncrement.unit === 'month'
			? addCivilMonthsForNavigation(day, amount)
			: profile.navigationIncrement.unit === 'civil-day'
				? addCivilDaysForNavigation(day, amount)
				: moveVisibleDaysForNavigation(day, amount, hiddenWeekdays);
	if (!target) return null;
	return startOfZonedDay(target, profile.timeZone);
}

export function isSupportedDateDomainError(error: unknown): error is EventCalendarError {
	return (
		error instanceof EventCalendarError &&
		error.code === 'invalid-prop' &&
		error.details?.reason === SUPPORTED_DATE_DOMAIN_REASON
	);
}

export function getMaximumDateProfileAnchor(options: {
	view: EventCalendarView;
	weekStartsOn: EventCalendarWeekday;
	showWeekends: boolean;
	weekendDays: readonly EventCalendarWeekday[];
	dayCount: number;
	agendaDayCount: number;
}): EventCalendarDateOnly {
	const hiddenWeekdays = getHiddenWeekdays(options);
	assertSomeWeekdayVisible(hiddenWeekdays);

	if (options.view === 'month') return '9999-11-30';
	if (options.view === 'week') {
		let candidate = MAX_EVENT_CALENDAR_DAY;
		while (
			civilDayDifference(
				startOfCivilWeek(candidate, options.weekStartsOn),
				MAX_EVENT_CALENDAR_BOUNDARY
			) < 7
		) {
			candidate = addCivilDays(candidate, -1);
		}
		return candidate;
	}
	if (options.view === 'day' || options.view === 'resource') return MAX_EVENT_CALENDAR_DAY;

	const usesDayCount = options.view === 'days';
	const count = usesDayCount ? options.dayCount : options.agendaDayCount;
	assertPositiveInteger(count, usesDayCount ? 'dayCount' : 'agendaDayCount');
	let lastVisibleDay = MAX_EVENT_CALENDAR_DAY;
	while (hiddenWeekdays.has(getCivilWeekday(lastVisibleDay))) {
		lastVisibleDay = addCivilDays(lastVisibleDay, -1);
	}
	return moveVisibleDays(lastVisibleDay, -(count - 1), hiddenWeekdays);
}

export function getHiddenWeekdays(options: {
	showWeekends: boolean;
	weekendDays: readonly EventCalendarWeekday[];
}): ReadonlySet<EventCalendarWeekday> {
	return new Set(options.showWeekends ? [] : options.weekendDays);
}

function getProfileDays(
	options: EventCalendarDateProfileOptions,
	anchorDay: EventCalendarDateOnly,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): {
	currentStart: EventCalendarDateOnly;
	currentEnd: EventCalendarDateOnly;
	renderStart: EventCalendarDateOnly;
	renderEnd: EventCalendarDateOnly;
	visibleStart: EventCalendarDateOnly;
	visibleEnd: EventCalendarDateOnly;
	count?: number;
} {
	if (options.view === 'month') {
		const civil = parseDateOnly(anchorDay);
		const monthStart = toDateOnly({ year: civil.year, month: civil.month, day: 1 });
		const monthEnd = addCivilMonths(monthStart, 1);
		const renderWeek = getProfileWeekStart(monthStart, options.weekStartsOn);
		const renderStart = renderWeek.start;
		const renderEnd = options.fixedWeeks
			? addCivilDays(renderStart, 42 - renderWeek.clippedDays)
			: addCivilDays(startOfCivilWeek(addCivilDays(monthEnd, -1), options.weekStartsOn), 7);
		return {
			currentStart: monthStart,
			currentEnd: monthEnd,
			renderStart,
			renderEnd,
			visibleStart: options.showOutsideDays ? renderStart : monthStart,
			visibleEnd: options.showOutsideDays ? renderEnd : monthEnd
		};
	}

	if (options.view === 'week') {
		const profileWeek = getProfileWeekStart(anchorDay, options.weekStartsOn);
		const weekStart = profileWeek.start;
		const weekEnd = addCivilDays(weekStart, 7 - profileWeek.clippedDays);
		return {
			currentStart: weekStart,
			currentEnd: weekEnd,
			renderStart: weekStart,
			renderEnd: weekEnd,
			visibleStart: weekStart,
			visibleEnd: weekEnd
		};
	}

	if (hiddenWeekdays.has(getCivilWeekday(anchorDay))) {
		throw new EventCalendarError('invalid-prop', 'The active view anchor falls on a hidden day.', {
			view: options.view,
			anchorDay
		});
	}

	const count =
		options.view === 'days'
			? options.dayCount
			: options.view === 'agenda'
				? options.agendaDayCount
				: 1;
	const visibleDays = generateVisibleDayCount(anchorDay, count, hiddenWeekdays);
	const currentEnd = addCivilDays(visibleDays[visibleDays.length - 1], 1);
	return {
		currentStart: anchorDay,
		currentEnd,
		renderStart: anchorDay,
		renderEnd: currentEnd,
		visibleStart: anchorDay,
		visibleEnd: currentEnd,
		count
	};
}

function getProfileWeekStart(
	day: EventCalendarDateOnly,
	weekStartsOn: EventCalendarWeekday
): { start: EventCalendarDateOnly; clippedDays: number } {
	const difference = modulo(getCivilWeekday(day) - weekStartsOn, 7);
	const daysSinceMinimum = civilDayDifference(MIN_EVENT_CALENDAR_DAY, day);
	if (daysSinceMinimum >= difference) {
		return { start: addCivilDays(day, -difference), clippedDays: 0 };
	}
	return {
		start: MIN_EVENT_CALENDAR_DAY,
		clippedDays: difference - daysSinceMinimum
	};
}

function addCivilMonthsForNavigation(
	day: EventCalendarDateOnly,
	amount: number
): EventCalendarDateOnly | null {
	const civil = parseDateOnly(day);
	const targetMonthIndex = (civil.year - 1) * 12 + civil.month - 1 + amount;
	if (targetMonthIndex < 0 || targetMonthIndex >= 9999 * 12) return null;
	return addCivilMonths(day, amount);
}

function addCivilDaysForNavigation(
	day: EventCalendarDateOnly,
	amount: number
): EventCalendarDateOnly | null {
	if (amount < 0 && civilDayDifference(MIN_EVENT_CALENDAR_DAY, day) < Math.abs(amount)) {
		return null;
	}
	if (amount > 0 && civilDayDifference(day, MAX_EVENT_CALENDAR_DAY) < amount) return null;
	return addCivilDays(day, amount);
}

function moveVisibleDaysForNavigation(
	day: EventCalendarDateOnly,
	amount: number,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): EventCalendarDateOnly | null {
	assertSomeWeekdayVisible(hiddenWeekdays);
	if (amount === 0) return day;
	const direction = Math.sign(amount);
	let remaining = Math.abs(amount);
	let candidate = day;
	while (remaining > 0) {
		if (
			(direction < 0 && candidate === MIN_EVENT_CALENDAR_DAY) ||
			(direction > 0 && candidate === MAX_EVENT_CALENDAR_DAY)
		) {
			return null;
		}
		candidate = addCivilDays(candidate, direction);
		if (!hiddenWeekdays.has(getCivilWeekday(candidate))) remaining -= 1;
	}
	return candidate;
}

function getProfileTitle(
	options: EventCalendarDateProfileOptions,
	profileDays: ReturnType<typeof getProfileDays>
): string {
	const start = startOfZonedDay(profileDays.currentStart, options.timeZone);
	if (options.view === 'month') {
		return getCachedDateTimeFormatter(options.locale, options.timeZone, {
			year: 'numeric',
			month: 'long'
		}).format(start);
	}

	const endDay = addCivilDays(profileDays.currentEnd, -1);
	const end = startOfZonedDay(endDay, options.timeZone);
	const formatter = getCachedDateTimeFormatter(options.locale, options.timeZone, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		...(options.view === 'day' || options.view === 'resource' ? { weekday: 'long' as const } : {})
	});
	return start.getTime() === end.getTime()
		? formatter.format(start)
		: formatter.formatRange(start, end);
}

function getNavigationIncrement(
	options: EventCalendarDateProfileOptions
): EventCalendarNavigationIncrement {
	if (options.view === 'month') return { unit: 'month', amount: 1 };
	if (options.view === 'week') return { unit: 'civil-day', amount: 7 };
	if (options.view === 'days') {
		return { unit: 'visible-day', amount: options.dayCount };
	}
	if (options.view === 'agenda') {
		return { unit: 'visible-day', amount: options.agendaDayCount };
	}
	return { unit: 'visible-day', amount: 1 };
}

function assertDateProfileOptions(options: EventCalendarDateProfileOptions): string {
	assertValidInstant(options.date);
	assertValidTimeZone(options.timeZone);
	const locale = normalizeLocale(options.locale);
	assertWeekday(options.weekStartsOn, 'weekStartsOn');
	assertPositiveInteger(options.dayCount, 'dayCount');
	assertPositiveInteger(options.agendaDayCount, 'agendaDayCount');
	if (options.validRange) assertValidRange(options.validRange, 'validRange');
	const seen = new Set<EventCalendarWeekday>();
	for (const weekday of options.weekendDays) {
		assertWeekday(weekday, 'weekendDays');
		if (seen.has(weekday)) {
			throw new EventCalendarError('invalid-prop', 'weekendDays must not contain duplicates.', {
				weekday
			});
		}
		seen.add(weekday);
	}
	assertSomeWeekdayVisible(getHiddenWeekdays(options));
	return locale;
}

function getNextReconciliationDay(
	day: EventCalendarDateOnly,
	timeZone: string,
	validRange?: EventCalendarRange
): EventCalendarDateOnly | null {
	if (day >= MAX_EVENT_CALENDAR_DAY) return null;
	if (!validRange) return addCivilDays(day, 1);
	const dayStart = startOfZonedDay(day, timeZone).getTime();
	const dayEnd = endOfZonedDay(day, timeZone).getTime();
	if (dayStart >= validRange.end.getTime()) return null;
	if (dayEnd <= validRange.start.getTime()) return getZonedDay(validRange.start, timeZone);
	return addCivilDays(day, 1);
}

function getPreviousReconciliationDay(
	day: EventCalendarDateOnly,
	timeZone: string,
	validRange?: EventCalendarRange
): EventCalendarDateOnly | null {
	if (!validRange) return addCivilDays(day, -1);
	const dayStart = startOfZonedDay(day, timeZone).getTime();
	const dayEnd = endOfZonedDay(day, timeZone).getTime();
	if (dayEnd <= validRange.start.getTime()) return null;
	if (dayStart >= validRange.end.getTime()) {
		let rangeEndDay = getZonedDay(validRange.end, timeZone);
		if (startOfZonedDay(rangeEndDay, timeZone).getTime() >= validRange.end.getTime()) {
			rangeEndDay = addCivilDays(rangeEndDay, -1);
		}
		return rangeEndDay;
	}
	return addCivilDays(day, -1);
}

function throwNoSelectableDay(day: EventCalendarDateOnly, timeZone: string): never {
	throw new EventCalendarError('invalid-prop', 'No valid visible day exists for this profile.', {
		day,
		timeZone
	});
}

function normalizeWallTime(wallTime: EventCalendarWallTime): Required<EventCalendarWallTime> {
	const hour = wallTime.hour ?? 0;
	const minute = wallTime.minute ?? 0;
	const second = wallTime.second ?? 0;
	const millisecond = wallTime.millisecond ?? 0;
	const day = toDateOnly(wallTime);
	parseDateOnly(day);
	for (const [name, value, maximum] of [
		['hour', hour, 24],
		['minute', minute, 59],
		['second', second, 59],
		['millisecond', millisecond, 999]
	] as const) {
		if (!Number.isInteger(value) || value < 0 || value > maximum) {
			throw new EventCalendarError(
				'invalid-prop',
				`${name} is outside its valid wall-time range.`,
				{
					[name]: value
				}
			);
		}
	}
	if (hour === 24) {
		if (minute !== 0 || second !== 0 || millisecond !== 0) {
			throw new EventCalendarError('invalid-prop', '24:00 cannot include smaller time units.');
		}
		const next = parseDateOnly(addCivilDays(day, 1));
		return { ...next, hour: 0, minute: 0, second: 0, millisecond: 0 };
	}
	return { ...parseDateOnly(day), hour, minute, second, millisecond };
}

/** Resolves a whole wall minute on a civil day; `1440` is the next day's boundary. */
export function resolveZonedMinutesOnDay(
	day: EventCalendarDateOnly,
	minutes: number,
	timeZone: string
): Date {
	assertMinuteOfDay(minutes, 'minutes', true);
	parseDateOnly(day);
	assertValidTimeZone(timeZone);
	return resolveZonedMinuteOnDay(day, minutes, timeZone);
}

function civilRangeToInstantRange(
	start: EventCalendarDateOnly,
	end: EventCalendarDateOnly,
	timeZone: string
): EventCalendarRange {
	return { start: startOfZonedDay(start, timeZone), end: startOfZonedDay(end, timeZone) };
}

function isSelectableDay(
	day: EventCalendarDateOnly,
	timeZone: string,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>,
	validRange?: EventCalendarRange
): boolean {
	if (day > MAX_EVENT_CALENDAR_DAY) return false;
	if (hiddenWeekdays.has(getCivilWeekday(day))) return false;
	if (!validRange) return true;
	return rangesIntersect(
		{ start: startOfZonedDay(day, timeZone), end: endOfZonedDay(day, timeZone) },
		validRange
	);
}

function cloneRange(range: EventCalendarRange): EventCalendarRange {
	return { start: new Date(range.start), end: new Date(range.end) };
}

function assertSomeWeekdayVisible(hiddenWeekdays: ReadonlySet<EventCalendarWeekday>): void {
	if (hiddenWeekdays.size < 7) return;
	throw new EventCalendarError('invalid-prop', 'At least one weekday must remain visible.');
}

function assertWeekday(value: number, name: string): asserts value is EventCalendarWeekday {
	if (Number.isInteger(value) && value >= 0 && value <= 6) return;
	throw new EventCalendarError(
		'invalid-prop',
		`${name} must contain weekday numbers from 0 to 6.`,
		{
			prop: name,
			value
		}
	);
}

function assertPositiveInteger(value: number, name: string): void {
	if (Number.isInteger(value) && value > 0) return;
	throw new EventCalendarError('invalid-prop', `${name} must be a positive integer.`, {
		prop: name,
		value
	});
}

function assertInteger(value: number, name: string): void {
	if (Number.isInteger(value)) return;
	throw new EventCalendarError('invalid-prop', `${name} must be an integer.`, {
		prop: name,
		value
	});
}

function assertMinuteOfDay(value: number, name: string, allowEnd: boolean): void {
	const maximum = allowEnd ? 24 * 60 : 24 * 60 - 1;
	if (Number.isInteger(value) && value >= 0 && value <= maximum) return;
	throw new EventCalendarError('invalid-prop', `${name} is outside the civil day.`, {
		prop: name,
		value
	});
}

export function civilDayDifference(
	start: EventCalendarDateOnly,
	end: EventCalendarDateOnly
): number {
	return getCivilDateDifference(parseDateOnly(start), parseDateOnly(end));
}

function getFirstWeekStartOrdinal(
	year: number,
	weekStartsOn: EventCalendarWeekday,
	firstWeekContainsDate: number
): number {
	const completedYears = year - 1;
	const yearStartOrdinal =
		completedYears * 365 +
		Math.floor(completedYears / 4) -
		Math.floor(completedYears / 100) +
		Math.floor(completedYears / 400);
	const containedDayOrdinal = yearStartOrdinal + firstWeekContainsDate - 1;
	const containedDayWeekday = modulo(
		getCivilWeekday(MIN_EVENT_CALENDAR_DAY) + containedDayOrdinal,
		7
	);
	return containedDayOrdinal - modulo(containedDayWeekday - weekStartsOn, 7);
}

function throwSupportedDateDomainError(details: Readonly<Record<string, unknown>>): never {
	throw new EventCalendarError(
		'invalid-prop',
		`Civil date operations support ${MIN_EVENT_CALENDAR_DAY} through ${MAX_EVENT_CALENDAR_BOUNDARY}; ${MAX_EVENT_CALENDAR_BOUNDARY} is exclusive-only.`,
		{
			reason: SUPPORTED_DATE_DOMAIN_REASON,
			minimumDay: MIN_EVENT_CALENDAR_DAY,
			maximumDay: MAX_EVENT_CALENDAR_DAY,
			maximumExclusiveBoundary: MAX_EVENT_CALENDAR_BOUNDARY,
			...details
		}
	);
}
