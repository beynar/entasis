import type { EventCalendarItemIndex } from './eventCalendar.items.js';
import type {
	EventCalendarDateOnly,
	EventCalendarOccurrence,
	EventCalendarSegment
} from './eventCalendar.types.js';
export type EventCalendarAgendaEntry<TItemFields extends object> = Readonly<{
	occurrence: EventCalendarOccurrence<TItemFields>;
	segment: EventCalendarSegment<TItemFields>;
}>;

export type EventCalendarAgendaGroup<TItemFields extends object> = Readonly<{
	day: EventCalendarDateOnly;
	entries: readonly EventCalendarAgendaEntry<TItemFields>[];
}>;

/** Projects the shared occurrence index into chronological, per-visible-day agenda groups. */
export function createEventCalendarAgendaGroups<TItemFields extends object>(
	visibleDays: readonly EventCalendarDateOnly[],
	itemIndex: EventCalendarItemIndex<TItemFields>
): readonly EventCalendarAgendaGroup<TItemFields>[] {
	const groups: EventCalendarAgendaGroup<TItemFields>[] = [];
	for (const day of visibleDays) {
		const segments = itemIndex.segmentsByDay.get(day)?.foreground ?? [];
		const entriesByOccurrence = new Map<string, EventCalendarAgendaEntry<TItemFields>>();
		for (const segment of segments) {
			if (entriesByOccurrence.has(segment.occurrence.key)) continue;
			entriesByOccurrence.set(segment.occurrence.key, {
				occurrence: segment.occurrence,
				segment
			});
		}

		const entries = [...entriesByOccurrence.values()].sort(compareAgendaEntries);
		if (entries.length > 0) groups.push({ day, entries });
	}
	return groups;
}

function compareAgendaEntries<TItemFields extends object>(
	left: EventCalendarAgendaEntry<TItemFields>,
	right: EventCalendarAgendaEntry<TItemFields>
): number {
	if (left.occurrence.allDay !== right.occurrence.allDay) {
		return left.occurrence.allDay ? -1 : 1;
	}
	const startDifference = left.segment.start.getTime() - right.segment.start.getTime();
	if (startDifference !== 0) return startDifference;
	const endDifference = left.segment.end.getTime() - right.segment.end.getTime();
	if (endDifference !== 0) return endDifference;
	return left.occurrence.key.localeCompare(right.occurrence.key);
}
