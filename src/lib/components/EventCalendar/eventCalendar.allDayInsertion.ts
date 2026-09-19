import { packSchedulingLanes } from '$lib/utils/scheduling/intervalLayout.js';
import { civilDayDifference } from './eventCalendar.date.js';
import type { EventCalendarAllDayInsertion } from './eventCalendar.interactions.svelte.js';
import { packEventCalendarLanes, type EventCalendarLaneLayout } from './eventCalendar.layout.js';
import type { EventCalendarDateOnly, EventCalendarSegment } from './eventCalendar.types.js';

export type EventCalendarAllDayRowInsertion = EventCalendarAllDayInsertion & {
	startIndex: number;
	endIndex: number;
	lane: number;
};

export function createEventCalendarAllDayPreviewLayout<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	days: readonly EventCalendarDateOnly[],
	insertion: EventCalendarAllDayInsertion | null
): {
	layout: EventCalendarLaneLayout<TItemFields>;
	insertion: EventCalendarAllDayRowInsertion | null;
	draggingOccurrenceKey: string | null;
} {
	const sourceLayout = packEventCalendarLanes(segments, days);
	const rowInsertion = getEventCalendarAllDayRowInsertion(days, insertion);
	if (!insertion || !rowInsertion) {
		return { layout: sourceLayout, insertion: null, draggingOccurrenceKey: null };
	}
	const sourcePlacement = sourceLayout.placements.find(
		(placement) => placement.occurrence.key === insertion.occurrenceKey
	);
	const baseLayout = packEventCalendarLanes(
		segments.filter((segment) => segment.occurrence.key !== insertion.occurrenceKey),
		days
	);
	const preview = createEventCalendarAllDayInsertionLayout(baseLayout, rowInsertion);
	return {
		layout: sourcePlacement
			? {
					...preview.layout,
					placements: [...preview.layout.placements, sourcePlacement]
				}
			: preview.layout,
		insertion: preview.insertion,
		draggingOccurrenceKey: insertion.occurrenceKey
	};
}

function getEventCalendarAllDayRowInsertion(
	days: readonly EventCalendarDateOnly[],
	insertion: EventCalendarAllDayInsertion | null
): Omit<EventCalendarAllDayRowInsertion, 'lane'> | null {
	if (!insertion) return null;
	const startIndex = days.indexOf(insertion.start);
	if (startIndex < 0) return null;
	const dayCount = Math.max(1, civilDayDifference(insertion.start, insertion.end));
	return {
		...insertion,
		startIndex,
		endIndex: Math.min(days.length, startIndex + dayCount)
	};
}

function createEventCalendarAllDayInsertionLayout<TItemFields extends object>(
	layout: EventCalendarLaneLayout<TItemFields>,
	insertion: Omit<EventCalendarAllDayRowInsertion, 'lane'>
): { layout: EventCalendarLaneLayout<TItemFields>; insertion: EventCalendarAllDayRowInsertion } {
	const packed = packSchedulingLanes([
		...layout.placements.map((placement) => ({
			key: placement.key,
			startIndex: placement.startIndex,
			endIndex: placement.endIndex,
			start: placement.occurrence.start.getTime(),
			end: placement.occurrence.end.getTime(),
			priority: placement.occurrence.item.priority ?? 0
		})),
		{
			key: insertion.occurrenceKey,
			startIndex: insertion.startIndex,
			endIndex: insertion.endIndex,
			start: insertion.sortStart,
			end: insertion.sortEnd,
			priority: insertion.priority
		}
	]);
	const lanes = new Map(packed.placements.map((placement) => [placement.key, placement.lane]));
	return {
		layout: {
			...layout,
			placements: layout.placements.map((placement) => ({
				...placement,
				lane: lanes.get(placement.key) ?? 0
			})),
			laneCount: packed.laneCount
		},
		insertion: { ...insertion, lane: lanes.get(insertion.occurrenceKey) ?? 0 }
	};
}
