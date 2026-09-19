import type { EventCalendarDropTarget } from './eventCalendar.interactions.svelte.js';
import type { EventCalendarDateOnly, EventCalendarView } from './eventCalendar.types.js';

export type EventCalendarAllDayDropTarget = Extract<EventCalendarDropTarget, { allDay: true }>;
export type EventCalendarTimedDropTarget = Extract<EventCalendarDropTarget, { allDay: false }>;

/** Single construction site for drop-target identities; keys stay stable across renderers. */
export function eventCalendarMonthDayTarget(
	day: EventCalendarDateOnly
): EventCalendarAllDayDropTarget {
	return {
		key: `month:${day}`,
		view: 'month',
		allDay: true,
		day
	};
}

export function eventCalendarTimedColumnTarget(
	view: EventCalendarView,
	geometry: {
		key: string;
		windowStart: Date;
		windowEnd: Date;
		resourceId?: string;
	}
): EventCalendarTimedDropTarget {
	return {
		key: `${view}:timed-column:${geometry.key}`,
		view,
		allDay: false,
		start: new Date(geometry.windowStart),
		end: new Date(geometry.windowEnd),
		...(geometry.resourceId === undefined ? {} : { resourceId: geometry.resourceId })
	};
}

export function eventCalendarTimedSlotTarget(
	view: EventCalendarView,
	slot: { key: string; start: Date; end: Date },
	resourceId?: string
): EventCalendarTimedDropTarget {
	return {
		key: `${view}:timed:${slot.key}`,
		view,
		allDay: false,
		start: new Date(slot.start),
		end: new Date(slot.end),
		...(resourceId === undefined ? {} : { resourceId })
	};
}

export function eventCalendarAllDayCellTarget(
	view: EventCalendarView,
	geometry: { key: string; day: EventCalendarDateOnly; resourceId?: string }
): EventCalendarAllDayDropTarget {
	return {
		key: `${view}:all-day:${geometry.key}`,
		view,
		allDay: true,
		day: geometry.day,
		...(geometry.resourceId === undefined ? {} : { resourceId: geometry.resourceId })
	};
}
