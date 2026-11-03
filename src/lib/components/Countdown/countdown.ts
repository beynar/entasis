/**
 * Pure countdown arithmetic and Intl formatting. No timers and no DOM: the component owns the
 * schedule, this module answers "what does the countdown read at `now`" and "when does that text
 * next change".
 */
import { formatNumber } from '$lib/utils/number.js';

/** A moment: a `Date`, an ISO 8601 string, or epoch milliseconds. */
export type CountdownInstant = Date | string | number;

/** `relative` reads "3 days, 4 hours"; `clock` reads "2:14:05", with days in front when present. */
export type CountdownFormat = 'relative' | 'clock';

/** What the countdown reads at one moment; also the `children` snippet payload. */
export type CountdownPayload = {
	/** Milliseconds left until `until`; `0` once it is reached. */
	remaining: number;
	/** Whole days left. The four parts split the remaining time, rounded up to the second. */
	days: number;
	/** Hours left after the whole days (0–23). */
	hours: number;
	/** Minutes left after the whole hours (0–59). */
	minutes: number;
	/** Seconds left after the whole minutes (0–59). */
	seconds: number;
	/** The formatted text the component renders by default. */
	label: string;
	/** Whether `until` is reached. */
	done: boolean;
	/** Elapsed share of `from` → `until`, 0 to 1. `null` without `from`. */
	fraction: number | null;
};

const SECOND = 1000;
const UNITS = [
	{ unit: 'day', seconds: 86_400 },
	{ unit: 'hour', seconds: 3_600 },
	{ unit: 'minute', seconds: 60 },
	{ unit: 'second', seconds: 1 }
] as const;

/** The most units the relative format can show (days, hours, minutes, seconds). */
export const COUNTDOWN_MAX_UNITS = UNITS.length;

/** Epoch milliseconds of `instant`, or `NaN` when it is not a valid moment. */
export const toEpoch = (instant: CountdownInstant | null | undefined): number => {
	if (instant instanceof Date) return instant.getTime();
	if (typeof instant === 'number') return instant;
	if (typeof instant === 'string') return Date.parse(instant);
	return Number.NaN;
};

const clampUnits = (units: number) =>
	Math.min(COUNTDOWN_MAX_UNITS, Math.max(1, Math.floor(Number.isFinite(units) ? units : 1)));

// Remaining time is rounded up to the second, so a countdown reads "1 second" until the very
// moment it is reached, never "0 seconds" before it.
const wholeSeconds = (remaining: number) => Math.ceil(remaining / SECOND);

/** Index of the largest unit with a non-zero amount; the last unit when `total` is 0. */
const leadingUnit = (total: number) => {
	const index = UNITS.findIndex(({ seconds }) => total >= seconds);
	return index === -1 ? UNITS.length - 1 : index;
};

/**
 * Size, in seconds, of the smallest unit the text shows. The text truncates the remaining
 * seconds to a multiple of it, so it only changes when that multiple drops.
 */
const resolutionSeconds = (total: number, format: CountdownFormat, units: number) =>
	format === 'clock'
		? 1
		: UNITS[Math.min(leadingUnit(total) + clampUnits(units) - 1, UNITS.length - 1)].seconds;

const split = (total: number) => ({
	days: Math.floor(total / 86_400),
	hours: Math.floor((total % 86_400) / 3_600),
	minutes: Math.floor((total % 3_600) / 60),
	seconds: total % 60
});

/** "3 days, 4 hours": the leading `units` units from the largest non-zero one, zeros dropped. */
const formatRelative = (total: number, units: number, locale: Intl.LocalesArgument) => {
	const parts = split(total);
	const amounts = [parts.days, parts.hours, parts.minutes, parts.seconds];
	const start = leadingUnit(total);
	const words = UNITS.slice(start, start + clampUnits(units))
		.map(({ unit }, offset) => ({ unit, amount: amounts[start + offset] }))
		.filter(({ amount }) => amount > 0)
		.map(({ unit, amount }) =>
			formatNumber(amount, locale, { style: 'unit', unit, unitDisplay: 'long' })
		);
	return new Intl.ListFormat(locale, {
		type: 'unit',
		style: 'long'
	}).format(words);
};

/** "2:14:05", "14:05", "0:05"; days lead in their narrow unit form ("2d 03:14:05"). */
const formatClock = (total: number, locale: Intl.LocalesArgument) => {
	const { days, hours, minutes, seconds } = split(total);
	const digits = (value: number, pad: boolean) =>
		formatNumber(value, locale, { minimumIntegerDigits: pad ? 2 : 1, useGrouping: false });
	const time =
		days > 0 || hours > 0
			? `${digits(hours, days > 0)}:${digits(minutes, true)}:${digits(seconds, true)}`
			: `${digits(minutes, false)}:${digits(seconds, true)}`;
	if (days === 0) return time;
	return `${formatNumber(days, locale, { style: 'unit', unit: 'day', unitDisplay: 'narrow' })} ${time}`;
};

/** The localized "now" shown once the countdown is reached. */
export const formatReached = (locale: Intl.LocalesArgument) =>
	new Intl.RelativeTimeFormat(locale, {
		numeric: 'auto'
	}).format(0, 'second');

export type CountdownOptions = {
	now: number;
	until: number;
	from?: number;
	format: CountdownFormat;
	units: number;
	locale: Intl.LocalesArgument;
};

/** What the countdown reads at `now`. An invalid `until` reads as an empty, unfinished countdown. */
export const resolveCountdown = ({
	now,
	until,
	from,
	format,
	units,
	locale
}: CountdownOptions): CountdownPayload => {
	if (!Number.isFinite(until)) {
		return {
			remaining: 0,
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			label: '',
			done: false,
			fraction: null
		};
	}
	const remaining = Math.max(0, until - now);
	const done = remaining === 0;
	const total = wholeSeconds(remaining);
	// The text truncates to its smallest shown unit; the parts stay exact to the second.
	const shown = total - (total % resolutionSeconds(total, format, units));
	const span = from === undefined ? Number.NaN : until - from;
	const fraction = !Number.isFinite(span)
		? null
		: span <= 0
			? 1
			: Math.min(1, Math.max(0, (now - (from as number)) / span));
	return {
		remaining,
		...split(total),
		label: done
			? formatReached(locale)
			: format === 'clock'
				? formatClock(total, locale)
				: formatRelative(shown, units, locale),
		done,
		fraction
	};
};

/** The spoken form of the clock: every non-zero unit spelled out. */
export const formatSpokenClock = (remaining: number, locale: Intl.LocalesArgument) =>
	formatRelative(wholeSeconds(remaining), COUNTDOWN_MAX_UNITS, locale);

/**
 * Milliseconds from `now` until the text next changes, or `null` once `until` is reached (or
 * invalid). The text shows the remaining seconds truncated to a multiple of its smallest unit, so
 * it changes the moment the rounded-up remaining seconds fall one below that multiple.
 */
export const nextChangeDelay = ({
	now,
	until,
	format,
	units
}: Pick<CountdownOptions, 'now' | 'until' | 'format' | 'units'>): number | null => {
	if (!Number.isFinite(until)) return null;
	const remaining = until - now;
	if (remaining <= 0) return null;
	const total = wholeSeconds(remaining);
	const shown = total - (total % resolutionSeconds(total, format, units));
	return remaining - (shown - 1) * SECOND;
};
