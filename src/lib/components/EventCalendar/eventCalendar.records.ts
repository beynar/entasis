import { getZonedDay } from './eventCalendar.date.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarRecurrenceRule
} from './eventCalendar.types.js';

type EventCalendarSchedule = {
	allDay: boolean;
	start: Date | EventCalendarDateOnly;
	end: Date | EventCalendarDateOnly;
};

export function cloneEventCalendarItem<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): EventCalendarItem<TItemFields> {
	const clone: Record<string, unknown> = {
		...item,
		start: cloneEventCalendarScheduleValue(item.start),
		end: cloneEventCalendarScheduleValue(item.end)
	};
	if (item.originalStart !== undefined)
		clone.originalStart = cloneEventCalendarScheduleValue(item.originalStart);
	if (item.resourceIds) clone.resourceIds = [...item.resourceIds];
	if (item.allDay === true) {
		if (item.recurrence && typeof item.recurrence === 'object') {
			clone.recurrence = cloneEventCalendarRecurrenceRule(item.recurrence);
		}
	} else if (item.recurrence && typeof item.recurrence === 'object') {
		clone.recurrence = cloneEventCalendarRecurrenceRule(item.recurrence);
	}
	return clone as EventCalendarItem<TItemFields>;
}

export function replaceEventCalendarSchedule<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	schedule: EventCalendarSchedule,
	resourceSource?: { resourceId?: string; resourceIds?: readonly string[] }
): EventCalendarItem<TItemFields> {
	const next: Record<string, unknown> = { ...item };
	delete next.recurrence;
	delete next.recurrenceTimeZone;
	delete next.recurringItemId;
	delete next.originalStart;
	setSchedule(next, schedule);
	if (resourceSource) setResourceAssignment(next, resourceSource);
	return next as EventCalendarItem<TItemFields>;
}

export function replaceEventCalendarPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	schedule: EventCalendarSchedule,
	resourceSource?: { resourceId?: string; resourceIds?: readonly string[] }
): EventCalendarItem<TItemFields> {
	const next: Record<string, unknown> = { ...item };
	setSchedule(next, schedule);
	if (resourceSource) setResourceAssignment(next, resourceSource);
	return next as EventCalendarItem<TItemFields>;
}

export function getEventCalendarOccurrenceSeriesId<TItemFields extends object>(
	occurrence: EventCalendarOccurrence<TItemFields>
): string | undefined {
	if (!occurrence.isRecurring && occurrence.item.recurringItemId === undefined) return undefined;
	return occurrence.item.recurringItemId ?? occurrence.item.id;
}

export function getEventCalendarOccurrencePlacementItem<TItemFields extends object>(
	occurrence: EventCalendarOccurrence<TItemFields>,
	timeZone: string
): EventCalendarItem<TItemFields> {
	return replaceEventCalendarPlacement(occurrence.item, {
		allDay: occurrence.allDay,
		start: occurrence.allDay ? getZonedDay(occurrence.start, timeZone) : new Date(occurrence.start),
		end: occurrence.allDay ? getZonedDay(occurrence.end, timeZone) : new Date(occurrence.end)
	});
}

function setSchedule(target: Record<string, unknown>, schedule: EventCalendarSchedule): void {
	target.start = cloneEventCalendarScheduleValue(schedule.start);
	target.end = cloneEventCalendarScheduleValue(schedule.end);
	if (schedule.allDay) target.allDay = true;
	else delete target.allDay;
}

export function cloneEventCalendarRecurrenceRule<TDate extends Date | EventCalendarDateOnly>(
	rule: EventCalendarRecurrenceRule<TDate>
): EventCalendarRecurrenceRule<TDate> {
	return {
		...rule,
		...(rule.until === undefined ? {} : { until: cloneEventCalendarScheduleValue(rule.until) }),
		...(rule.byWeekday
			? {
					byWeekday: rule.byWeekday.map((weekday) =>
						typeof weekday === 'string' ? weekday : { ...weekday }
					)
				}
			: {}),
		...(rule.byMonthDay ? { byMonthDay: [...rule.byMonthDay] } : {}),
		...(rule.byMonth ? { byMonth: [...rule.byMonth] } : {}),
		...(rule.exDates ? { exDates: rule.exDates.map(cloneEventCalendarScheduleValue) } : {}),
		...(rule.rDates ? { rDates: rule.rDates.map(cloneEventCalendarScheduleValue) } : {})
	};
}

function setResourceAssignment(
	target: Record<string, unknown>,
	source: { resourceId?: string; resourceIds?: readonly string[] }
): void {
	delete target.resourceId;
	delete target.resourceIds;
	if (source.resourceIds !== undefined) target.resourceIds = [...source.resourceIds];
	else if (source.resourceId !== undefined) target.resourceId = source.resourceId;
}

export function cloneEventCalendarScheduleValue<T extends Date | EventCalendarDateOnly>(
	value: T
): T {
	return (value instanceof Date ? new Date(value) : value) as T;
}
