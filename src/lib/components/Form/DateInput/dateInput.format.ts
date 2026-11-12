// Formatting and reading a DateInput's text, with an optional hour and an optional time zone.
// The value is always a `Date` (an instant); `timeZone` only decides which zone's calendar day
// and hour the text shows and is read in. Without it, the browser's zone is used.

/** A date mask of day, month and year segments. */
export type DateOnlyFormat =
	'dd/mm/yyyy' | 'mm/dd/yyyy' | 'mm/yy' | 'mm/yyyy' | 'yyyy' | 'yyyy/mm' | 'yyyy/mm/dd';

/** A full date followed by the hour and minutes. */
export type DateTimeFormat = 'dd/mm/yyyy HH:MM' | 'mm/dd/yyyy HH:MM' | 'yyyy/mm/dd HH:MM';

export type DateFormat = DateOnlyFormat | DateTimeFormat;

export type DateParts = {
	year: number;
	/** 1 to 12. */
	month: number;
	day: number;
	hour: number;
	minute: number;
};

const TIME_SUFFIX = ' HH:MM';

/** The date part of a mask and whether it carries the hour. */
export const splitFormat = (format: DateFormat): { date: DateOnlyFormat; time: boolean } =>
	format.endsWith(TIME_SUFFIX)
		? { date: format.slice(0, -TIME_SUFFIX.length) as DateOnlyFormat, time: true }
		: { date: format as DateOnlyFormat, time: false };

const formatters = new Map<string, Intl.DateTimeFormat>();
const zoneFormatter = (timeZone: string) => {
	let formatter = formatters.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hourCycle: 'h23',
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: 'numeric',
			minute: 'numeric',
			second: 'numeric'
		});
		formatters.set(timeZone, formatter);
	}
	return formatter;
};

/** The calendar day and hour an instant reads as in `timeZone` (the browser's zone if left out). */
export const zonedParts = (date: Date, timeZone?: string): DateParts => {
	if (!timeZone) {
		return {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			day: date.getDate(),
			hour: date.getHours(),
			minute: date.getMinutes()
		};
	}
	const parts: Record<string, number> = {};
	for (const part of zoneFormatter(timeZone).formatToParts(date)) {
		if (part.type !== 'literal') parts[part.type] = Number(part.value);
	}
	return {
		year: parts.year,
		month: parts.month,
		day: parts.day,
		hour: parts.hour === 24 ? 0 : parts.hour,
		minute: parts.minute
	};
};

const zoneOffset = (instant: number, timeZone: string) => {
	const parts = zonedParts(new Date(instant), timeZone);
	const seconds = new Date(instant).getUTCSeconds();
	const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, seconds);
	return asUtc - (instant - new Date(instant).getUTCMilliseconds());
};

/**
 * The instant at which `timeZone` (the browser's zone if left out) reads `parts`. An hour that
 * occurs twice (autumn) reads as its first occurrence; an hour skipped by the spring change lands
 * on the hour after it.
 */
export const fromZonedParts = (parts: DateParts, timeZone?: string): Date => {
	if (!timeZone) {
		return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
	}
	const wall = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
	const HALF_DAY = 12 * 60 * 60 * 1000;
	// The zone's offset before and after any change near that day.
	const before = wall - zoneOffset(wall - HALF_DAY, timeZone);
	const after = wall - zoneOffset(wall + HALF_DAY, timeZone);
	const reads = (instant: number) => {
		const shown = zonedParts(new Date(instant), timeZone);
		return (
			shown.year === parts.year &&
			shown.month === parts.month &&
			shown.day === parts.day &&
			shown.hour === parts.hour &&
			shown.minute === parts.minute
		);
	};
	const candidates = [before, after].filter(reads);
	if (candidates.length) return new Date(Math.min(...candidates));
	// A skipped hour: keep the offset from before the change, which moves it forward.
	return new Date(before);
};

const pad = (value: number, length = 2) => String(value).padStart(length, '0');

/** The text a DateInput shows for `date`. */
export const formatDateValue = (
	date: Date | null,
	format: DateFormat,
	separator: string,
	timeZone?: string
): string => {
	if (!date || Number.isNaN(date.getTime())) return '';
	const { date: dateFormat, time } = splitFormat(format);
	const parts = zonedParts(date, timeZone);
	const segments: Record<string, string> = {
		dd: pad(parts.day),
		mm: pad(parts.month),
		yy: String(parts.year).slice(-2),
		yyyy: pad(parts.year, 4)
	};
	const text = dateFormat
		.split('/')
		.map((part) => segments[part])
		.join(separator);
	return time ? `${text} ${pad(parts.hour)}:${pad(parts.minute)}` : text;
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The date a complete DateInput text stands for, or `null` while it is incomplete or names a day
 * that does not exist. A mask without a day or a month reads as the first one; a mask with no
 * hour reads as midnight, or as `keepTime`'s hour when given (a date-only edit keeps the hour).
 */
export const parseDateValue = (
	text: string,
	format: DateFormat,
	separator: string,
	timeZone?: string,
	keepTime?: Date | null
): Date | null => {
	const { date: dateFormat, time } = splitFormat(format);
	const datePattern = dateFormat
		.split('/')
		.map((part) => (part === 'yyyy' ? '(\\d{4})' : '(\\d{2})'))
		.join(escapeRegex(separator));
	const match = text.match(new RegExp(`^${datePattern}${time ? ' (\\d{2}):(\\d{2})' : ''}$`));
	if (!match) return null;

	const fields = dateFormat.split('/');
	let year = new Date().getFullYear();
	let month = 1;
	let day = 1;
	fields.forEach((part, index) => {
		const value = Number(match[index + 1]);
		if (part === 'dd') day = value;
		else if (part === 'mm') month = value;
		else if (part === 'yyyy') year = value;
		else if (part === 'yy') year = 2000 + value;
	});

	let hour = 0;
	let minute = 0;
	if (time) {
		hour = Number(match[fields.length + 1]);
		minute = Number(match[fields.length + 2]);
		if (hour > 23 || minute > 59) return null;
	} else if (keepTime) {
		({ hour, minute } = zonedParts(keepTime, timeZone));
	}

	// The day must exist in the calendar (no 31/02).
	const probe = new Date(Date.UTC(year, month - 1, day));
	if (
		probe.getUTCFullYear() !== year ||
		probe.getUTCMonth() !== month - 1 ||
		probe.getUTCDate() !== day
	) {
		return null;
	}
	return fromZonedParts({ year, month, day, hour, minute }, timeZone);
};

/**
 * The browser-local date showing the same calendar day and hour as `date` reads in `timeZone`,
 * for the calendar, which counts days in the browser's zone.
 */
export const toLocalWallClock = (date: Date | null, timeZone?: string): Date | null => {
	if (!date || !timeZone) return date;
	const parts = zonedParts(date, timeZone);
	return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
};

/**
 * The instant a day picked in the calendar stands for: that day in `timeZone`, at the hour the
 * value already had (midnight when there was none).
 */
export const fromPickedDay = (picked: Date, current: Date | null, timeZone?: string): Date => {
	const time = current ? zonedParts(current, timeZone) : { hour: 0, minute: 0 };
	return fromZonedParts(
		{
			year: picked.getFullYear(),
			month: picked.getMonth() + 1,
			day: picked.getDate(),
			hour: time.hour,
			minute: time.minute
		},
		timeZone
	);
};
