import {
	addCivilDays,
	getCivilWeekday,
	getZonedDay,
	MAX_EVENT_CALENDAR_BOUNDARY,
	MAX_EVENT_CALENDAR_DAY,
	MIN_EVENT_CALENDAR_DAY,
	normalizeLocale,
	parseDateOnly,
	startOfZonedDay,
	toDateOnly
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type {
	EventCalendarDateOnly,
	EventCalendarRange,
	EventCalendarWeekday
} from './eventCalendar.types.js';

type LocaleWeekInfo = {
	firstDay: number;
};

type LocaleWithWeekInfo = Intl.Locale & {
	weekInfo?: LocaleWeekInfo;
	getWeekInfo?: () => LocaleWeekInfo;
};

/** Maps a civil date to the picker owner's host-local-noon representation. */
export function toDateJumpDate(day: EventCalendarDateOnly): Date {
	const parts = parseDateOnly(day, 'datePicker.day');
	return createHostLocalNoon(parts.year, parts.month - 1, parts.day);
}

/** Maps a picker selection back to a canonical civil date without `Date.parse`. */
export function fromDateJumpDate(date: Date): EventCalendarDateOnly {
	return toDateOnly({
		year: date.getFullYear(),
		month: date.getMonth() + 1,
		day: date.getDate()
	});
}

export function getDateJumpBounds(
	validRange: EventCalendarRange | undefined,
	timeZone: string,
	maximumProfileAnchor: EventCalendarDateOnly
): { minDate?: Date; maxDate?: Date } {
	parseDateOnly(maximumProfileAnchor, 'datePicker.maximumProfileAnchor');
	const domainStart = startOfZonedDay(MIN_EVENT_CALENDAR_DAY, timeZone).getTime();
	const domainEnd = startOfZonedDay(MAX_EVENT_CALENDAR_BOUNDARY, timeZone).getTime();
	const firstInstant = Math.max(validRange?.start.getTime() ?? domainStart, domainStart);
	const endInstant = Math.min(validRange?.end.getTime() ?? domainEnd, domainEnd);
	if (firstInstant >= endInstant) {
		throw new EventCalendarError(
			'invalid-prop',
			'The date-picker range does not intersect the supported civil-date domain.',
			{
				minimumDay: MIN_EVENT_CALENDAR_DAY,
				maximumDay: MAX_EVENT_CALENDAR_DAY,
				maximumExclusiveBoundary: MAX_EVENT_CALENDAR_BOUNDARY
			}
		);
	}

	const firstDay = getZonedDay(new Date(firstInstant), timeZone);
	const lastRangeDay = getZonedDay(new Date(endInstant - 1), timeZone);
	const lastDay = lastRangeDay < maximumProfileAnchor ? lastRangeDay : maximumProfileAnchor;
	if (firstDay > lastDay) {
		throw new EventCalendarError(
			'invalid-prop',
			'The date-picker range contains no valid anchor for the active profile.',
			{ firstDay, lastDay, maximumProfileAnchor }
		);
	}
	return {
		minDate: toDateJumpDate(firstDay),
		maxDate: toDateJumpDate(lastDay)
	};
}

/**
 * Returns hidden weekdays across the bounded keyboard-navigation horizon.
 * CalendarPrimitive supports PageUp/PageDown by month and Shift+PageUp/PageDown by year, so the
 * current civil year plus its adjacent years covers every target and the short disabled-day scan.
 */
export function getDateJumpDisabledDates(
	year: number,
	monthIndex: number,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): Date[] {
	if (hiddenWeekdays.size === 0) return [];
	const normalizedMonth = parseDateOnly(
		fromDateJumpDate(createHostLocalNoon(year, monthIndex, 1)),
		'datePicker.month'
	);
	const firstYear = Math.max(1, normalizedMonth.year - 1);
	const lastYear = Math.min(9999, normalizedMonth.year + 1);
	let day = toDateOnly({ year: firstYear, month: 1, day: 1 });
	const end =
		lastYear === 9999 ? MAX_EVENT_CALENDAR_DAY : toDateOnly({ year: lastYear, month: 12, day: 31 });
	const disabledDates: Date[] = [];

	while (true) {
		if (hiddenWeekdays.has(getCivilWeekday(day))) disabledDates.push(toDateJumpDate(day));
		if (day === end) break;
		day = addCivilDays(day, 1);
	}

	return disabledDates;
}

export function getDateJumpToday(now: Date | null, timeZone: string): Date | undefined {
	return now ? toDateJumpDate(getZonedDay(now, timeZone)) : undefined;
}

export function getLocaleWeekStartsOn(locale: string): EventCalendarWeekday {
	const intlLocale = new Intl.Locale(normalizeLocale(locale)) as LocaleWithWeekInfo;
	const weekInfo = intlLocale.getWeekInfo?.() ?? intlLocale.weekInfo;
	const firstDay = weekInfo?.firstDay;
	if (
		typeof firstDay === 'number' &&
		Number.isInteger(firstDay) &&
		firstDay >= 1 &&
		firstDay <= 7
	) {
		return (firstDay % 7) as EventCalendarWeekday;
	}
	return 1;
}

function createHostLocalNoon(year: number, monthIndex: number, day: number): Date {
	const date = new Date(0);
	date.setFullYear(year, monthIndex, day);
	date.setHours(12, 0, 0, 0);
	return date;
}
