import { compareScheduleValues } from '$lib/scheduling/scheduleOrder.js';
import {
	addCivilDays,
	assertDateOnly,
	assertRenderableDateOnly,
	assertValidInstant,
	assertValidRange,
	assertValidTimeZone,
	civilDayDifference,
	getZonedDay,
	startOfZonedDay
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	canonicalEventCalendarRecurrenceOrigin,
	expandEventCalendarRecurrence,
	validateEventCalendarRecurrence
} from './eventCalendar.recurrence.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarRange,
	EventCalendarRecurrenceExpander,
	EventCalendarSegment
} from './eventCalendar.types.js';

export type EventCalendarDayBucket<TItemFields extends object> = {
	all: readonly EventCalendarSegment<TItemFields>[];
	foreground: readonly EventCalendarSegment<TItemFields>[];
	background: readonly EventCalendarSegment<TItemFields>[];
	allDay: readonly EventCalendarSegment<TItemFields>[];
	timed: readonly EventCalendarSegment<TItemFields>[];
};

export type EventCalendarItemIndex<TItemFields extends object> = {
	occurrences: readonly EventCalendarOccurrence<TItemFields>[];
	segmentsByDay: ReadonlyMap<EventCalendarDateOnly, EventCalendarDayBucket<TItemFields>>;
	occurrencesByKey: ReadonlyMap<string, EventCalendarOccurrence<TItemFields>>;
	getOccurrence(key: string): EventCalendarOccurrence<TItemFields> | null;
	getOccurrences(range?: EventCalendarRange): readonly EventCalendarOccurrence<TItemFields>[];
	getOccurrencesForDay(day: EventCalendarDateOnly): readonly EventCalendarOccurrence<TItemFields>[];
};

export type CreateEventCalendarItemIndexOptions<TItemFields extends object> = {
	items: readonly EventCalendarItem<TItemFields>[];
	range: EventCalendarRange;
	displayTimeZone: string;
	expandRecurrence?: EventCalendarRecurrenceExpander<TItemFields>;
};

export type EventCalendarAdmittedException<TItemFields extends object> = {
	/** The exception item carrying the overridden placement. */
	item: EventCalendarItem<TItemFields>;
	/** The resolved recurring source the exception targets. */
	source: EventCalendarItem<TItemFields>;
	/** The validated origin representation matching the source's temporal kind. */
	originalStart: Date | EventCalendarDateOnly;
	/** createRecurringOccurrenceKey(source.id, originalStart). */
	occurrenceKey: string;
};

export type EventCalendarAdmittedItems<TItemFields extends object> = {
	items: readonly EventCalendarItem<TItemFields>[];
	exceptions: readonly EventCalendarAdmittedException<TItemFields>[];
};

/** Creates the active occurrence index from one admitted item snapshot. */
export function createEventCalendarItemIndex<TItemFields extends object>(
	options: CreateEventCalendarItemIndexOptions<TItemFields>
): EventCalendarItemIndex<TItemFields> {
	validateIndexOptions(options);
	return projectEventCalendarOccurrences(
		admitEventCalendarItems(options.items, {
			hasCustomExpander: options.expandRecurrence !== undefined
		}),
		{
			range: options.range,
			displayTimeZone: options.displayTimeZone,
			expandRecurrence: options.expandRecurrence
		}
	);
}

/** Validates item fields and resolves exception links without expanding recurrence. */
export function admitEventCalendarItems<TItemFields extends object>(
	items: readonly EventCalendarItem<TItemFields>[],
	options: { hasCustomExpander: boolean }
): EventCalendarAdmittedItems<TItemFields> {
	if (!Array.isArray(items)) {
		throw new EventCalendarError('invalid-item', 'items must be an array.');
	}
	const itemsById = new Map<string, EventCalendarItem<TItemFields>>();
	for (const item of items) {
		if (!item || typeof item !== 'object') {
			throw new EventCalendarError('invalid-item', 'Every item must be an object.');
		}
		if (typeof item.id !== 'string' || item.id.length === 0)
			throw new EventCalendarError('invalid-item', 'Every item must have a non-empty string id.');
		if (itemsById.has(item.id)) {
			throw new EventCalendarError('duplicate-item-id', `Duplicate item id: ${item.id}.`, {
				id: item.id
			});
		}
		if (typeof item.title !== 'string')
			throw new EventCalendarError('invalid-item', `Item ${item.id} must have a string title.`, {
				id: item.id
			});
		validateItemDisplayFields<TItemFields>(item);
		validateItemPlacement<TItemFields>(item);
		itemsById.set(item.id, item);
	}
	return {
		items,
		exceptions: admitExceptionIdentities(items, itemsById, options.hasCustomExpander)
	};
}

/**
 * Projects admitted items into the range-windowed occurrence index. Phase order is fixed:
 * exception origins are verified against per-exception expansions first, recurring sources expand
 * over the range skipping verified origins, plain definitions are range-checked, then exceptions
 * whose current span intersects the range overlay their suppressed originals.
 */
export function projectEventCalendarOccurrences<TItemFields extends object>(
	admitted: EventCalendarAdmittedItems<TItemFields>,
	options: {
		range: EventCalendarRange;
		displayTimeZone: string;
		expandRecurrence?: EventCalendarRecurrenceExpander<TItemFields>;
	}
): EventCalendarItemIndex<TItemFields> {
	const exceptionOrigins = validateExceptionOrigins(admitted, options);
	const occurrences: EventCalendarOccurrence<TItemFields>[] = [];

	for (const item of admitted.items) {
		if (item.recurringItemId !== undefined) continue;
		if (item.recurrence !== undefined) {
			for (const expanded of expandEventCalendarRecurrence({
				item,
				range: options.range,
				displayTimeZone: options.displayTimeZone,
				expandRecurrence: options.expandRecurrence
			})) {
				const key = createRecurringOccurrenceKey(item.id, expanded.originalStart);
				if (exceptionOrigins.has(key)) continue;
				occurrences.push(
					createOccurrence(
						item,
						key,
						expanded.start,
						expanded.end,
						expanded.originalStart,
						options.displayTimeZone
					)
				);
			}
			continue;
		}
		const occurrence = createOccurrence(
			item,
			item.id,
			item.start,
			item.end,
			item.originalStart ?? item.start,
			options.displayTimeZone
		);
		if (occurrenceIntersects(occurrence.start.getTime(), occurrence.end.getTime(), options.range)) {
			occurrences.push(occurrence);
		}
	}

	for (const exception of admitted.exceptions) {
		const current = createOccurrence(
			exception.item,
			exception.occurrenceKey,
			exception.item.start,
			exception.item.end,
			exception.originalStart,
			options.displayTimeZone
		);
		if (!occurrenceIntersects(current.start.getTime(), current.end.getTime(), options.range)) {
			continue;
		}
		occurrences.push(current);
	}

	occurrences.sort(compareEventCalendarOccurrences);
	assertOccurrenceKeysUnique(occurrences);
	const segmentsByDay = createSegmentsByDay(occurrences, options.displayTimeZone, options.range);
	const occurrencesByKey = new Map(occurrences.map((occurrence) => [occurrence.key, occurrence]));
	return {
		occurrences,
		segmentsByDay,
		occurrencesByKey,
		getOccurrence: (key) => occurrencesByKey.get(key) ?? null,
		getOccurrences: (range) => {
			if (!range) return occurrences;
			assertValidRange(range, 'occurrence query range');
			return occurrences.filter((occurrence) =>
				occurrenceIntersects(occurrence.start.getTime(), occurrence.end.getTime(), range)
			);
		},
		getOccurrencesForDay: (day) => {
			assertDateOnly(day, 'day');
			const bucket = segmentsByDay.get(day);
			if (!bucket) return [];
			return [
				...new Map(
					bucket.all.map((segment) => [segment.occurrence.key, segment.occurrence] as const)
				).values()
			];
		}
	};
}

export function createRecurringOccurrenceKey(
	seriesId: string,
	originalStart: Date | EventCalendarDateOnly
): string {
	return encodeKey('recurring', [seriesId, canonicalEventCalendarRecurrenceOrigin(originalStart)]);
}

export function decodeRecurringOccurrenceKey(
	key: string
): { seriesId: string; originalStart: Date | EventCalendarDateOnly } | null {
	const parts = decodeKey(key);
	if (!parts || parts.namespace !== 'recurring' || parts.values.length !== 2) return null;
	const [seriesId, encodedOrigin] = parts.values;
	if (encodedOrigin.startsWith('instant:')) {
		const timestamp = Number(encodedOrigin.slice('instant:'.length));
		if (!Number.isFinite(timestamp)) return null;
		const originalStart = new Date(timestamp);
		return Number.isFinite(originalStart.getTime()) ? { seriesId, originalStart } : null;
	}
	if (!encodedOrigin.startsWith('day:')) return null;
	const originalStart = encodedOrigin.slice('day:'.length);
	try {
		assertDateOnly(originalStart, 'occurrence key origin');
		return { seriesId, originalStart };
	} catch (error) {
		if (error instanceof EventCalendarError) return null;
		throw error;
	}
}

export function createEventCalendarSegmentKey(
	occurrenceKey: string,
	day: EventCalendarDateOnly,
	segmentIndex: number
): string {
	return encodeKey('segment', [occurrenceKey, day, String(segmentIndex)]);
}

export function compareEventCalendarOccurrences<TItemFields extends object>(
	left: EventCalendarOccurrence<TItemFields>,
	right: EventCalendarOccurrence<TItemFields>
): number {
	return compareEventCalendarScheduleValues(
		left.start.getTime(),
		left.end.getTime(),
		left.item.priority ?? 0,
		left.key,
		right.start.getTime(),
		right.end.getTime(),
		right.item.priority ?? 0,
		right.key
	);
}

function validateIndexOptions<TItemFields extends object>(
	options: CreateEventCalendarItemIndexOptions<TItemFields>
): void {
	if (!options || typeof options !== 'object') {
		throw new EventCalendarError('invalid-item', 'Item index options are required.');
	}
	if (!Array.isArray(options.items)) {
		throw new EventCalendarError('invalid-item', 'items must be an array.');
	}
	assertValidRange(options.range, 'item index range');
	assertValidTimeZone(options.displayTimeZone);
}

function validateItemDisplayFields<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): void {
	if (item.display !== undefined && item.display !== 'auto' && item.display !== 'background') {
		invalidItem(item, `Item ${item.id} has an invalid display value.`);
	}
	if (item.description !== undefined && typeof item.description !== 'string') {
		invalidItem(item, `Item ${item.id} description must be a string when provided.`);
	}
	if (item.priority !== undefined && !Number.isFinite(item.priority)) {
		invalidItem(item, `Item ${item.id} priority must be finite.`);
	}
	if (item.resourceId !== undefined && item.resourceIds !== undefined) {
		invalidItem(item, `Item ${item.id} cannot define both resourceId and resourceIds.`);
	}
	if (item.resourceId !== undefined && item.resourceId.length === 0) {
		invalidItem(item, `Item ${item.id} has an empty resourceId.`);
	}
	if (item.resourceIds !== undefined) {
		if (!Array.isArray(item.resourceIds) || item.resourceIds.length === 0) {
			invalidItem(item, `Item ${item.id} resourceIds must be a non-empty array.`);
		}
		if (
			new Set(item.resourceIds).size !== item.resourceIds.length ||
			item.resourceIds.some(
				(resourceId) => typeof resourceId !== 'string' || resourceId.length === 0
			)
		)
			invalidItem(item, `Item ${item.id} resourceIds must contain unique non-empty strings.`);
	}
}

function validateItemPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): void {
	if (item.allDay !== undefined && typeof item.allDay !== 'boolean') {
		invalidItem(item, `Item ${item.id} has an invalid allDay value.`);
	}
	if (item.allDay === true) {
		try {
			assertRenderableDateOnly(item.start, 'item.start');
			assertDateOnly(item.end, 'item.end');
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			invalidItem(item, `All-day item ${item.id} has an invalid range.`);
		}
		if (item.end <= item.start) {
			invalidItem(item, `All-day item ${item.id} must have a positive half-open range.`);
		}
		return;
	}
	try {
		assertValidInstant(item.start, 'item.start');
		assertValidInstant(item.end, 'item.end');
	} catch (error) {
		if (!(error instanceof EventCalendarError)) throw error;
		invalidItem(item, `Timed item ${item.id} has an invalid range.`);
	}
	if (item.end.getTime() < item.start.getTime()) {
		invalidItem(item, `Timed item ${item.id} ends before it starts.`);
	}
}

function invalidItem(item: { id: string }, message: string): never {
	throw new EventCalendarError('invalid-item', message, { id: item.id });
}

function admitExceptionIdentities<TItemFields extends object>(
	items: readonly EventCalendarItem<TItemFields>[],
	itemsById: ReadonlyMap<string, EventCalendarItem<TItemFields>>,
	hasCustomExpander: boolean
): EventCalendarAdmittedException<TItemFields>[] {
	const exceptionOrigins = new Set<string>();
	const exceptions: EventCalendarAdmittedException<TItemFields>[] = [];
	for (const item of items) {
		const itemId = item.id;
		const hasExceptionField =
			item.recurringItemId !== undefined || item.originalStart !== undefined;
		if (hasExceptionField) {
			exceptions.push(admitExceptionIdentity(item, itemsById, exceptionOrigins));
			continue;
		}
		if (item.recurrence !== undefined) {
			if (hasCustomExpander && typeof item.recurrence === 'string') {
				if (item.recurrence.trim().length === 0)
					invalidRecurrence(`Item ${item.id} has an empty recurrence rule.`, { id: item.id });
				continue;
			}
			validateEventCalendarRecurrence(item);
			continue;
		}
		if (item.recurrenceTimeZone !== undefined)
			invalidRecurrence(`Item ${itemId} cannot define recurrenceTimeZone without recurrence.`, {
				id: itemId
			});
	}
	return exceptions;
}

function admitExceptionIdentity<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	itemsById: ReadonlyMap<string, EventCalendarItem<TItemFields>>,
	exceptionOrigins: Set<string>
): EventCalendarAdmittedException<TItemFields> {
	const itemId = item.id;
	if (
		typeof item.recurringItemId !== 'string' ||
		item.recurringItemId.length === 0 ||
		item.originalStart === undefined
	) {
		invalidRecurrence(`Exception item ${itemId} requires recurringItemId and originalStart.`, {
			id: itemId
		});
	}
	if (item.recurrence !== undefined || item.recurrenceTimeZone !== undefined) {
		invalidRecurrence(`Exception item ${itemId} cannot define recurrence fields.`, {
			id: itemId
		});
	}
	const source = itemsById.get(item.recurringItemId);
	if (
		!source ||
		source === item ||
		source.id === item.id ||
		source.recurringItemId !== undefined ||
		source.recurrence === undefined
	) {
		invalidRecurrence(
			`Exception item ${item.id} must reference a distinct recurring source in the same collection.`,
			{ id: item.id, recurringItemId: item.recurringItemId }
		);
	}
	if (source.allDay === true) {
		if (typeof item.originalStart !== 'string') throwOriginRepresentationError(item.id, source.id);
		try {
			assertRenderableDateOnly(item.originalStart, 'originalStart');
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			throwOriginRepresentationError(item.id, source.id);
		}
	} else if (
		!(item.originalStart instanceof Date) ||
		!Number.isFinite(item.originalStart.getTime())
	) {
		throwOriginRepresentationError(item.id, source.id);
	}
	const originalStart = item.originalStart as Date | EventCalendarDateOnly;
	const occurrenceKey = createRecurringOccurrenceKey(source.id, originalStart);
	if (exceptionOrigins.has(occurrenceKey)) {
		invalidRecurrence(`Multiple exceptions target the same origin in series ${source.id}.`, {
			recurringItemId: source.id,
			originalStart: canonicalEventCalendarRecurrenceOrigin(originalStart)
		});
	}
	exceptionOrigins.add(occurrenceKey);
	return {
		item,
		source,
		originalStart,
		occurrenceKey
	};
}

function throwOriginRepresentationError(itemId: string, sourceId: string): never {
	return invalidRecurrence(
		`Exception item ${itemId} has an origin representation that does not match its source.`,
		{ id: itemId, recurringItemId: sourceId }
	);
}

function invalidRecurrence(message: string, details?: Readonly<Record<string, unknown>>): never {
	throw new EventCalendarError('invalid-recurrence', message, details);
}

function validateExceptionOrigins<TItemFields extends object>(
	admitted: EventCalendarAdmittedItems<TItemFields>,
	options: {
		range: EventCalendarRange;
		displayTimeZone: string;
		expandRecurrence?: EventCalendarRecurrenceExpander<TItemFields>;
	}
): ReadonlySet<string> {
	const origins = new Set<string>();
	for (const exception of admitted.exceptions) {
		const source = exception.source;
		const originIdentity = canonicalEventCalendarRecurrenceOrigin(exception.originalStart);
		let verificationRange: EventCalendarRange;
		try {
			verificationRange = reconstructSourceOccurrence(
				source,
				exception.originalStart,
				options.displayTimeZone
			);
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			invalidRecurrence(
				`Exception item ${exception.item.id} has an origin outside its source recurrence domain.`,
				{
					id: exception.item.id,
					recurringItemId: source.id,
					causeCode: error.code,
					cause: error.message
				}
			);
		}
		const expanded = expandEventCalendarRecurrence({
			item: source,
			range: verificationRange,
			displayTimeZone: options.displayTimeZone,
			expandRecurrence: options.expandRecurrence
		});
		if (
			!expanded.some(
				(occurrence) =>
					canonicalEventCalendarRecurrenceOrigin(occurrence.originalStart) === originIdentity
			)
		) {
			invalidRecurrence(
				`Exception item ${exception.item.id} targets an origin absent from series ${source.id}.`,
				{
					id: exception.item.id,
					recurringItemId: source.id,
					originalStart: canonicalEventCalendarRecurrenceOrigin(exception.originalStart)
				}
			);
		}
		origins.add(exception.occurrenceKey);
	}
	return origins;
}

function assertOccurrenceKeysUnique<TItemFields extends object>(
	occurrences: readonly EventCalendarOccurrence<TItemFields>[]
): void {
	const keys = new Set<string>();
	for (const occurrence of occurrences) {
		if (keys.has(occurrence.key)) {
			throw new EventCalendarError(
				'invalid-item',
				`Occurrence key collides with another item or occurrence: ${occurrence.key}.`,
				{ key: occurrence.key }
			);
		}
		keys.add(occurrence.key);
	}
}

/** Reconstructs the suppressed original span of an occurrence from its source definition. */
function reconstructSourceOccurrence<TItemFields extends object>(
	source: EventCalendarItem<TItemFields>,
	originalStart: Date | EventCalendarDateOnly,
	displayTimeZone: string
): EventCalendarRange {
	if (source.allDay === true) {
		const duration = civilDayDifference(source.start, source.end);
		const start = originalStart as EventCalendarDateOnly;
		const end = addCivilDays(start, duration);
		return {
			start: startOfZonedDay(start, displayTimeZone),
			end: startOfZonedDay(end, displayTimeZone)
		};
	}
	const start = new Date((originalStart as Date).getTime());
	const end = new Date(start.getTime() + source.end.getTime() - source.start.getTime());
	return {
		start,
		end: end.getTime() === start.getTime() ? new Date(start.getTime() + 1) : end
	};
}

function createOccurrence<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	key: string,
	start: Date | EventCalendarDateOnly,
	end: Date | EventCalendarDateOnly,
	originalStart: Date | EventCalendarDateOnly,
	displayTimeZone: string
): EventCalendarOccurrence<TItemFields> {
	const allDay = typeof start === 'string';
	return {
		key,
		item,
		start: allDay
			? startOfZonedDay(start as EventCalendarDateOnly, displayTimeZone)
			: new Date((start as Date).getTime()),
		end: allDay
			? startOfZonedDay(end as EventCalendarDateOnly, displayTimeZone)
			: new Date((end as Date).getTime()),
		allDay,
		isRecurring: item.recurrence !== undefined || item.recurringItemId !== undefined,
		originalStart: cloneOrigin(originalStart)
	};
}

function createSegmentsByDay<TItemFields extends object>(
	occurrences: readonly EventCalendarOccurrence<TItemFields>[],
	displayTimeZone: string,
	range: EventCalendarRange
): ReadonlyMap<EventCalendarDateOnly, EventCalendarDayBucket<TItemFields>> {
	type MutableBucket = {
		all: EventCalendarSegment<TItemFields>[];
		foreground: EventCalendarSegment<TItemFields>[];
		background: EventCalendarSegment<TItemFields>[];
		allDay: EventCalendarSegment<TItemFields>[];
		timed: EventCalendarSegment<TItemFields>[];
	};
	const buckets = new Map<EventCalendarDateOnly, MutableBucket>();
	for (const occurrence of occurrences) {
		const occurrenceStart = occurrence.start.getTime();
		const occurrenceEnd = occurrence.end.getTime();
		const projectedStart = Math.max(occurrenceStart, range.start.getTime());
		const projectedEnd = Math.min(occurrenceEnd, range.end.getTime());
		const startDay = getZonedDay(new Date(projectedStart), displayTimeZone);
		const finalDay =
			projectedStart === projectedEnd
				? getZonedDay(new Date(projectedStart), displayTimeZone)
				: getZonedDay(new Date(projectedEnd - 1), displayTimeZone);
		let segmentIndex = 0;
		for (let day = startDay; day <= finalDay; day = addCivilDays(day, 1)) {
			const dayStart = startOfZonedDay(day, displayTimeZone).getTime();
			const dayEnd = startOfZonedDay(addCivilDays(day, 1), displayTimeZone).getTime();
			const start = Math.max(occurrenceStart, dayStart);
			const end = Math.min(occurrenceEnd, dayEnd);
			const segment: EventCalendarSegment<TItemFields> = {
				key: createEventCalendarSegmentKey(occurrence.key, day, segmentIndex),
				occurrence,
				day,
				start: new Date(start),
				end: new Date(end),
				isStart: occurrenceStart >= dayStart,
				isEnd: occurrenceEnd <= dayEnd,
				continuesBefore: occurrenceStart < dayStart,
				continuesAfter: occurrenceEnd > dayEnd
			};
			segmentIndex += 1;
			let bucket = buckets.get(day);
			if (!bucket) {
				bucket = { all: [], foreground: [], background: [], allDay: [], timed: [] };
				buckets.set(day, bucket);
			}
			bucket.all.push(segment);
			if (occurrence.item.display === 'background') bucket.background.push(segment);
			else bucket.foreground.push(segment);
			if (occurrence.allDay) bucket.allDay.push(segment);
			else bucket.timed.push(segment);
		}
	}
	return buckets;
}

function occurrenceIntersects(start: number, end: number, range: EventCalendarRange): boolean {
	if (start === end) return start >= range.start.getTime() && start < range.end.getTime();
	return start < range.end.getTime() && range.start.getTime() < end;
}

export function compareEventCalendarScheduleValues(
	leftStart: number,
	leftEnd: number,
	leftPriority: number,
	leftKey: string,
	rightStart: number,
	rightEnd: number,
	rightPriority: number,
	rightKey: string
): number {
	return compareScheduleValues(
		leftStart,
		leftEnd,
		leftPriority,
		leftKey,
		rightStart,
		rightEnd,
		rightPriority,
		rightKey
	);
}

function encodeKey(namespace: string, parts: readonly string[]): string {
	return `${namespace.length}:${namespace}${parts.map((part) => `${part.length}:${part}`).join('')}`;
}

function decodeKey(key: string): { namespace: string; values: string[] } | null {
	let cursor = 0;
	const readPart = (): string | null => {
		const separator = key.indexOf(':', cursor);
		if (separator < 0) return null;
		const length = Number(key.slice(cursor, separator));
		if (!Number.isInteger(length) || length < 0) return null;
		const start = separator + 1;
		const end = start + length;
		if (end > key.length) return null;
		cursor = end;
		return key.slice(start, end);
	};
	const namespace = readPart();
	if (namespace === null) return null;
	const values: string[] = [];
	while (cursor < key.length) {
		const value = readPart();
		if (value === null) return null;
		values.push(value);
	}
	return { namespace, values };
}

function cloneOrigin<T extends Date | EventCalendarDateOnly>(origin: T): T {
	return (origin instanceof Date ? new Date(origin) : origin) as T;
}
