import type { EventCalendarBusinessHours, EventCalendarWeekday } from './eventCalendar.types.js';

/** Validated availability consumed by display and mutation policy code. */
export type EventCalendarAdmittedBusinessHours = Readonly<{
	daysOfWeek: readonly EventCalendarWeekday[];
	startMinutes: number;
	endMinutes: number;
}>;

export const EVENT_CALENDAR_ALL_WEEKDAYS: readonly EventCalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6];

/** Admits resource windows, whose end clock must stay below 24:00. */
export function admitEventCalendarResourceBusinessHours(
	entries: readonly EventCalendarBusinessHours[] | undefined,
	onInvalid: () => Error
): readonly EventCalendarAdmittedBusinessHours[] | null {
	if (entries === undefined) return null;
	return entries.map((window) => {
		if (!window || typeof window !== 'object' || Array.isArray(window)) throw onInvalid();
		const days = window.daysOfWeek;
		if (
			days !== undefined &&
			(!Array.isArray(days) ||
				new Set(days).size !== days.length ||
				days.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
		)
			throw onInvalid();
		const startMinutes = parseEventCalendarBusinessClock(window.start, false);
		const endMinutes = parseEventCalendarBusinessClock(window.end, false);
		if (
			typeof startMinutes !== 'number' ||
			typeof endMinutes !== 'number' ||
			startMinutes >= endMinutes
		)
			throw onInvalid();
		return { daysOfWeek: days ?? EVENT_CALENDAR_ALL_WEEKDAYS, startMinutes, endMinutes };
	});
}

/** Parses clocks only at admission boundaries; consumers use the returned minutes. */
export function parseEventCalendarBusinessClock(
	value: unknown,
	allowEnd: boolean
): number | 'format' | 'range' {
	if (typeof value !== 'string') return 'format';
	const match = /^(\d{2}):(\d{2})$/.exec(value);
	if (!match) return 'format';
	const hour = Number(match[1]);
	const minute = Number(match[2]);
	return minute > 59 || hour > 24 || (hour === 24 && (!allowEnd || minute !== 0))
		? 'range'
		: hour * 60 + minute;
}
