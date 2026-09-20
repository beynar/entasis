import {
	packSchedulingLanes,
	packSchedulingOverlaps,
	type SchedulingLanePlacement,
	type SchedulingOverlapPlacement
} from '$lib/utils/scheduling/index.js';
import { EventCalendarError } from './eventCalendar.error.js';
import { assertDateOnly, assertValidInstant } from './eventCalendar.date.js';
import type {
	EventCalendarDateOnly,
	EventCalendarOccurrence,
	EventCalendarSegment
} from './eventCalendar.types.js';

export type EventCalendarLanePlacement<TItemFields extends object> = SchedulingLanePlacement & {
	occurrence: EventCalendarOccurrence<TItemFields>;
	segments: readonly EventCalendarSegment<TItemFields>[];
};

export type EventCalendarLaneLayout<TItemFields extends object> = {
	placements: readonly EventCalendarLanePlacement<TItemFields>[];
	laneCount: number;
	layoutIdentity: object;
};

export type EventCalendarTimedPlacement<TItemFields extends object> = Omit<
	SchedulingOverlapPlacement,
	'visualStart' | 'visualEnd'
> & {
	segment: EventCalendarSegment<TItemFields>;
	visualStart: Date;
	visualEnd: Date;
};

export type EventCalendarTimedLayout<TItemFields extends object> = {
	placements: readonly EventCalendarTimedPlacement<TItemFields>[];
	columnCount: number;
	layoutIdentity: object;
};

type LaneSchedule = SchedulingLanePlacement & {
	segmentKeys: readonly string[];
};

type TimedSchedule = SchedulingOverlapPlacement;

type CachedLaneLayout = {
	identity: object;
	placements: readonly LaneSchedule[];
	laneCount: number;
};
type CachedTimedLayout = {
	identity: object;
	placements: readonly TimedSchedule[];
	columnCount: number;
};

const laneCache = new Map<string, CachedLaneLayout>();
const timedCache = new Map<string, CachedTimedLayout>();
const MAX_LAYOUT_CACHE_ENTRIES = 64;
const MAX_DATE_MILLISECONDS = 8_640_000_000_000_000;

/** Packs bars into the first available lane without scanning source items per day cell. */
export function packEventCalendarLanes<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	days: readonly EventCalendarDateOnly[]
): EventCalendarLaneLayout<TItemFields> {
	validateLaneInputs(segments, days);
	const scheduleKey = getLaneScheduleKey(segments, days);
	let cached = laneCache.get(scheduleKey);
	if (!cached) {
		cached = buildLaneLayout(segments, days);
		setBoundedCache(laneCache, scheduleKey, cached);
	}
	const segmentsByKey = new Map(segments.map((segment) => [segment.key, segment]));
	const placements = cached.placements.map((placement) => {
		const placementSegments = placement.segmentKeys.map((key) => {
			const segment = segmentsByKey.get(key);
			if (!segment) throwMissingLayoutSegment(key);
			return segment;
		});
		const occurrence = placementSegments[0]?.occurrence;
		if (!occurrence) throwMissingLayoutSegment(placement.key);
		return { ...placement, occurrence, segments: placementSegments };
	});
	return { placements, laneCount: cached.laneCount, layoutIdentity: cached.identity };
}

/** Packs timed intervals into overlap columns and exposes a visual minimum for point events. */
export function packEventCalendarTimedSegments<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	visualMinimumMinutes = 15
): EventCalendarTimedLayout<TItemFields> {
	if (!Array.isArray(segments)) {
		throw new EventCalendarError('invalid-item', 'Timed layout segments must be an array.');
	}
	const visualMinimumMilliseconds = visualMinimumMinutes * 60_000;
	if (
		!Number.isFinite(visualMinimumMinutes) ||
		visualMinimumMinutes <= 0 ||
		!Number.isSafeInteger(visualMinimumMilliseconds) ||
		visualMinimumMilliseconds > MAX_DATE_MILLISECONDS
	) {
		throw new EventCalendarError(
			'invalid-prop',
			'visualMinimumMinutes must resolve to a positive safe millisecond duration inside the Date domain.',
			{ visualMinimumMinutes }
		);
	}
	const segmentKeys = new Set<string>();
	const segmentDays = new Set<EventCalendarDateOnly>();
	for (const segment of segments) {
		validateLayoutSegment(segment, segmentKeys);
		segmentDays.add(segment.day);
		if (segment.occurrence.allDay) {
			throw new EventCalendarError(
				'invalid-item',
				`Timed layout cannot pack all-day segment ${segment.key}.`,
				{ key: segment.key }
			);
		}
	}
	if (segmentDays.size > 1) {
		throw new EventCalendarError('invalid-item', 'Timed layout segments must share one day.');
	}
	const scheduleKey = getTimedScheduleKey(segments, visualMinimumMinutes);
	let cached = timedCache.get(scheduleKey);
	if (!cached) {
		cached = buildTimedLayout(segments, visualMinimumMilliseconds);
		setBoundedCache(timedCache, scheduleKey, cached);
	}
	const segmentsByKey = new Map(segments.map((segment) => [segment.key, segment]));
	const placements = cached.placements.map((placement) => {
		const segment = segmentsByKey.get(placement.key);
		if (!segment) throwMissingLayoutSegment(placement.key);
		return {
			...placement,
			segment,
			visualStart: new Date(placement.visualStart),
			visualEnd: new Date(placement.visualEnd)
		};
	});
	return { placements, columnCount: cached.columnCount, layoutIdentity: cached.identity };
}

function validateLaneInputs<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	days: readonly EventCalendarDateOnly[]
): void {
	if (!Array.isArray(segments) || !Array.isArray(days)) {
		throw new EventCalendarError('invalid-item', 'Lane layout requires segment and day arrays.');
	}
	if (new Set(days).size !== days.length) {
		throw new EventCalendarError('invalid-prop', 'Lane layout days must be unique.');
	}
	for (const day of days) assertDateOnly(day, 'lane day');
	const dayIndexes = new Map(days.map((day, index) => [day, index]));
	const segmentKeys = new Set<string>();
	for (const segment of segments) {
		validateLayoutSegment(segment, segmentKeys);
		if (!dayIndexes.has(segment.day)) {
			throw new EventCalendarError(
				'invalid-item',
				`Lane segment ${segment.key} does not belong to the supplied day row.`,
				{ key: segment.key, day: segment.day }
			);
		}
	}
}

function validateLayoutSegment<TItemFields extends object>(
	segment: EventCalendarSegment<TItemFields>,
	segmentKeys: Set<string>
): void {
	if (!segment || typeof segment !== 'object' || typeof segment.key !== 'string') {
		throw new EventCalendarError('invalid-item', 'Every layout segment requires a string key.');
	}
	if (segmentKeys.has(segment.key)) {
		throw new EventCalendarError('invalid-item', `Duplicate layout segment key: ${segment.key}.`, {
			key: segment.key
		});
	}
	segmentKeys.add(segment.key);
	assertDateOnly(segment.day, 'segment.day');
	assertValidInstant(segment.start, 'segment.start');
	assertValidInstant(segment.end, 'segment.end');
	if (segment.end.getTime() < segment.start.getTime()) {
		throw new EventCalendarError('invalid-item', `Segment ${segment.key} ends before it starts.`, {
			key: segment.key
		});
	}
}

function buildLaneLayout<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	days: readonly EventCalendarDateOnly[]
): CachedLaneLayout {
	const dayIndexes = new Map(days.map((day, index) => [day, index]));
	const byOccurrence = new Map<string, EventCalendarSegment<TItemFields>[]>();
	for (const segment of segments) {
		const current = byOccurrence.get(segment.occurrence.key);
		if (current) current.push(segment);
		else byOccurrence.set(segment.occurrence.key, [segment]);
	}
	const bars = [...byOccurrence.values()].map((occurrenceSegments) => {
		occurrenceSegments.sort(
			(left, right) => (dayIndexes.get(left.day) as number) - (dayIndexes.get(right.day) as number)
		);
		return {
			occurrence: occurrenceSegments[0].occurrence,
			segments: occurrenceSegments,
			startIndex: dayIndexes.get(occurrenceSegments[0].day) as number,
			endIndex:
				(dayIndexes.get(occurrenceSegments.at(-1)?.day as EventCalendarDateOnly) as number) + 1
		};
	});
	const layout = packSchedulingLanes(
		bars.map((bar) => ({
			key: bar.occurrence.key,
			start: bar.occurrence.start.getTime(),
			end: bar.occurrence.end.getTime(),
			priority: bar.occurrence.item.priority ?? 0,
			startIndex: bar.startIndex,
			endIndex: bar.endIndex
		}))
	);
	const barsByKey = new Map(bars.map((bar) => [bar.occurrence.key, bar]));
	const placements = layout.placements.map((placement): LaneSchedule => {
		const bar = barsByKey.get(placement.key);
		if (!bar) throwMissingLayoutSegment(placement.key);
		return {
			...placement,
			segmentKeys: bar.segments.map((segment) => segment.key)
		};
	});
	return { identity: {}, placements, laneCount: layout.laneCount };
}

function buildTimedLayout<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	visualMinimumMilliseconds: number
): CachedTimedLayout {
	const intervals = segments.map((segment) => {
		const start = segment.start.getTime();
		const end = segment.end.getTime();
		const visualEnd = end === start ? start + visualMinimumMilliseconds : end;
		if (!Number.isFinite(visualEnd) || Math.abs(visualEnd) > MAX_DATE_MILLISECONDS) {
			throw new EventCalendarError(
				'invalid-prop',
				`The visual minimum for zero-duration segment ${segment.key} exceeds the Date domain.`,
				{ key: segment.key, visualMinimumMilliseconds }
			);
		}
		return {
			key: segment.key,
			start,
			end,
			priority: segment.occurrence.item.priority ?? 0
		};
	});
	const layout = packSchedulingOverlaps(intervals, visualMinimumMilliseconds);
	return {
		identity: {},
		placements: layout.placements,
		columnCount: layout.columnCount
	};
}

function getLaneScheduleKey<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	days: readonly EventCalendarDateOnly[]
): string {
	return JSON.stringify([
		days,
		segments.map((segment) => [
			segment.key,
			segment.day,
			segment.start.getTime(),
			segment.end.getTime(),
			segment.occurrence.item.priority ?? 0
		])
	]);
}

function getTimedScheduleKey<TItemFields extends object>(
	segments: readonly EventCalendarSegment<TItemFields>[],
	visualMinimumMinutes: number
): string {
	return JSON.stringify([
		visualMinimumMinutes,
		segments.map((segment) => [
			segment.key,
			segment.start.getTime(),
			segment.end.getTime(),
			segment.occurrence.item.priority ?? 0
		])
	]);
}

function setBoundedCache<T>(cache: Map<string, T>, key: string, value: T): void {
	cache.set(key, value);
	while (cache.size > MAX_LAYOUT_CACHE_ENTRIES) {
		const oldest = cache.keys().next().value;
		if (oldest === undefined) return;
		cache.delete(oldest);
	}
}

function throwMissingLayoutSegment(key: string): never {
	throw new EventCalendarError('invalid-item', `Layout references missing segment ${key}.`, {
		key
	});
}
