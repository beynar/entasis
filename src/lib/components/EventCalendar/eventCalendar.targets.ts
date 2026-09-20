import type {
	EventCalendarDropTarget,
	EventCalendarTargetResource
} from './eventCalendar.interactions.svelte.js';
import type { EventCalendarDateOnly, EventCalendarView } from './eventCalendar.types.js';

export type EventCalendarDateTarget = Extract<EventCalendarDropTarget, { kind: 'date' }>;
export type EventCalendarAllDayDropTarget = Extract<EventCalendarDropTarget, { kind: 'all-day' }>;
export type EventCalendarTimedDropTarget = Extract<EventCalendarDropTarget, { kind: 'instant' }>;

type ResolvedKind =
	| { kind: 'date'; date: EventCalendarDateOnly }
	| { kind: 'all-day'; day: EventCalendarDateOnly }
	| { kind: 'instant'; instant: Date };

export type EventCalendarResolvedTarget = ResolvedKind & {
	resource?: EventCalendarTargetResource;
};

function resourceContext(view: EventCalendarView, resourceId?: string) {
	return view === 'resource'
		? { resource: { ...(resourceId === undefined ? {} : { id: resourceId }) } }
		: {};
}

/** Single construction site for drop-target identities; keys stay stable across renderers. */
export function eventCalendarMonthDayTarget(day: EventCalendarDateOnly): EventCalendarDateTarget {
	return {
		key: `month:${day}`,
		kind: 'date',
		date: day
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
		kind: 'instant',
		start: new Date(geometry.windowStart),
		end: new Date(geometry.windowEnd),
		...resourceContext(view, geometry.resourceId)
	};
}

export function eventCalendarTimedSlotTarget(
	view: EventCalendarView,
	slot: { key: string; start: Date; end: Date },
	resourceId?: string
): EventCalendarTimedDropTarget {
	return {
		key: `${view}:timed:${slot.key}`,
		kind: 'instant',
		start: new Date(slot.start),
		end: new Date(slot.end),
		...resourceContext(view, resourceId)
	};
}

export function eventCalendarAllDayCellTarget(
	view: EventCalendarView,
	geometry: { key: string; day: EventCalendarDateOnly; resourceId?: string }
): EventCalendarAllDayDropTarget {
	return {
		key: `${view}:all-day:${geometry.key}`,
		kind: 'all-day',
		day: geometry.day,
		...resourceContext(view, geometry.resourceId)
	};
}
