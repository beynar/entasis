import { compareScheduleValues } from '$lib/scheduling/scheduleOrder.js';
import {
	addCivilDays,
	assertDateOnly,
	assertRenderableDateOnly,
	assertValidInstant,
	assertValidRange,
	assertValidTimeZone,
	getZonedDay,
	startOfZonedDay
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	expandEventCalendarRecurrence,
	validateEventCalendarRecurrence
} from './eventCalendar.recurrence.js';
import type {
	EventCalendarDateOnly,
	EventCalendarExpandedOccurrence,
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
	/** The 'instant:<ms>' | 'day:<d>' encoding used for origin comparison. */
	canonicalOrigin: string;
	/** createRecurringOccurrenceKey(source.id, originalStart). */
	occurrenceKey: string;
};

export type EventCalendarAdmittedItems<TItemFields extends object> = {
	items: readonly EventCalendarItem<TItemFields>[];
	itemsById: ReadonlyMap<string, EventCalendarItem<TItemFields>>;
	exceptions: readonly EventCalendarAdmittedException<TItemFields>[];
};

/**
 * Creates the active occurrence index. Collections are controlled immutable snapshots; in-place
 * item or Date mutation is intentionally outside the observable cache contract.
 */
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

/**
 * Validates the collection and resolves exception links. Admission never expands recurrence and
 * never touches a range or zone: the per-item field/placement pass covers every item before the
 * identity pass runs, so errors interleave exactly as they did in the monolithic validator.
 */
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
		if (typeof item.id !== 'string' || item.id.length === 0) {
			throw new EventCalendarError('invalid-item', 'Every item must have a non-empty string id.');
		}
		if (itemsById.has(item.id)) {
			throw new EventCalendarError('duplicate-item-id', `Duplicate item id: ${item.id}.`, {
				id: item.id
			});
		}
		if (typeof item.title !== 'string') {
			throw new EventCalendarError('invalid-item', `Item ${item.id} must have a string title.`, {
				id: item.id
			});
		}
		validateItemDisplayFields(item);
		validateItemPlacement(item);
		itemsById.set(item.id, item);
	}
	return {
		items,
		itemsById,
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
				occurrences.push(createExpandedOccurrence(item, expanded, key, options.displayTimeZone));
			}
			continue;
		}
		const occurrence = createDefinitionOccurrence(item, options.displayTimeZone);
		if (occurrenceIntersects(occurrence.start.getTime(), occurrence.end.getTime(), options.range)) {
			occurrences.push(occurrence);
		}
	}

	for (const exception of admitted.exceptions) {
		const current = createDefinitionOccurrence(exception.item, options.displayTimeZone);
		if (!occurrenceIntersects(current.start.getTime(), current.end.getTime(), options.range)) {
			continue;
		}
		occurrences.push({
			...current,
			key: exception.occurrenceKey,
			isRecurring: true,
			originalStart: cloneOrigin(exception.originalStart)
		});
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
			const dayOccurrences: EventCalendarOccurrence<TItemFields>[] = [];
			const keys = new Set<string>();
			for (const segment of bucket.all) {
				if (keys.has(segment.occurrence.key)) continue;
				keys.add(segment.occurrence.key);
				dayOccurrences.push(segment.occurrence);
			}
			return dayOccurrences;
		}
	};
}

export function createRecurringOccurrenceKey(
	seriesId: string,
	originalStart: Date | EventCalendarDateOnly
): string {
	const origin =
		originalStart instanceof Date ? `instant:${originalStart.getTime()}` : `day:${originalStart}`;
	return encodeKey('recurring', [seriesId, origin]);
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
		throw new EventCalendarError('invalid-item', `Item ${item.id} has an invalid display value.`, {
			id: item.id
		});
	}
	if (item.description !== undefined && typeof item.description !== 'string') {
		throw new EventCalendarError(
			'invalid-item',
			`Item ${item.id} description must be a string when provided.`,
			{ id: item.id }
		);
	}
	if (item.priority !== undefined && !Number.isFinite(item.priority)) {
		throw new EventCalendarError('invalid-item', `Item ${item.id} priority must be finite.`, {
			id: item.id
		});
	}
	if (item.resourceId !== undefined && item.resourceIds !== undefined) {
		throw new EventCalendarError(
			'invalid-item',
			`Item ${item.id} cannot define both resourceId and resourceIds.`,
			{ id: item.id }
		);
	}
	if (item.resourceId !== undefined && item.resourceId.length === 0) {
		throw new EventCalendarError('invalid-item', `Item ${item.id} has an empty resourceId.`, {
			id: item.id
		});
	}
	if (item.resourceIds !== undefined) {
		if (!Array.isArray(item.resourceIds) || item.resourceIds.length === 0) {
			throw new EventCalendarError(
				'invalid-item',
				`Item ${item.id} resourceIds must be a non-empty array.`,
				{ id: item.id }
			);
		}
		const ids = new Set<string>();
		for (const resourceId of item.resourceIds) {
			if (typeof resourceId !== 'string' || resourceId.length === 0 || ids.has(resourceId)) {
				throw new EventCalendarError(
					'invalid-item',
					`Item ${item.id} resourceIds must contain unique non-empty strings.`,
					{ id: item.id }
				);
			}
			ids.add(resourceId);
		}
	}
}

function validateItemPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>
): void {
	if (item.allDay !== undefined && typeof item.allDay !== 'boolean') {
		throw new EventCalendarError('invalid-item', `Item ${item.id} has an invalid allDay value.`, {
			id: item.id
		});
	}
	if (item.allDay === true) {
		try {
			assertRenderableDateOnly(item.start, 'item.start');
			assertDateOnly(item.end, 'item.end');
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			throw new EventCalendarError(
				'invalid-item',
				`All-day item ${item.id} has an invalid range.`,
				{
					id: item.id
				}
			);
		}
		if (item.end <= item.start) {
			throw new EventCalendarError(
				'invalid-item',
				`All-day item ${item.id} must have a positive half-open range.`,
				{ id: item.id }
			);
		}
		return;
	}
	try {
		assertValidInstant(item.start, 'item.start');
		assertValidInstant(item.end, 'item.end');
	} catch (error) {
		if (!(error instanceof EventCalendarError)) throw error;
		throw new EventCalendarError('invalid-item', `Timed item ${item.id} has an invalid range.`, {
			id: item.id
		});
	}
	if (item.end.getTime() < item.start.getTime()) {
		throw new EventCalendarError('invalid-item', `Timed item ${item.id} ends before it starts.`, {
			id: item.id
		});
	}
}

function admitExceptionIdentities<TItemFields extends object>(
	items: readonly EventCalendarItem<TItemFields>[],
	itemsById: ReadonlyMap<string, EventCalendarItem<TItemFields>>,
	hasCustomExpander: boolean
): EventCalendarAdmittedException<TItemFields>[] {
	const exceptionOrigins = new Set<string>();
	const exceptions: EventCalendarAdmittedException<TItemFields>[] = [];
	for (const item of items) {
		const identity = item as unknown as RuntimeRecurrenceIdentity;
		const hasExceptionField =
			identity.recurringItemId !== undefined || identity.originalStart !== undefined;
		if (hasExceptionField) {
			exceptions.push(admitExceptionIdentity(item, itemsById, exceptionOrigins));
			continue;
		}
		if (identity.recurrence !== undefined) {
			if (hasCustomExpander && typeof identity.recurrence === 'string') {
				if (identity.recurrence.trim().length === 0) {
					throw new EventCalendarError(
						'invalid-recurrence',
						`Item ${item.id} has an empty recurrence rule.`,
						{ id: item.id }
					);
				}
				continue;
			}
			validateEventCalendarRecurrence(item);
			continue;
		}
		if (identity.recurrenceTimeZone !== undefined) {
			throw new EventCalendarError(
				'invalid-recurrence',
				`Item ${item.id} cannot define recurrenceTimeZone without recurrence.`,
				{ id: item.id }
			);
		}
	}
	return exceptions;
}

function admitExceptionIdentity<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	itemsById: ReadonlyMap<string, EventCalendarItem<TItemFields>>,
	exceptionOrigins: Set<string>
): EventCalendarAdmittedException<TItemFields> {
	const identity = item as unknown as RuntimeRecurrenceIdentity;
	if (
		typeof identity.recurringItemId !== 'string' ||
		identity.recurringItemId.length === 0 ||
		identity.originalStart === undefined
	) {
		throw new EventCalendarError(
			'invalid-recurrence',
			`Exception item ${item.id} requires recurringItemId and originalStart.`,
			{ id: item.id }
		);
	}
	if (identity.recurrence !== undefined || identity.recurrenceTimeZone !== undefined) {
		throw new EventCalendarError(
			'invalid-recurrence',
			`Exception item ${item.id} cannot define recurrence fields.`,
			{ id: item.id }
		);
	}
	const source = itemsById.get(identity.recurringItemId);
	if (
		!source ||
		source === item ||
		source.id === item.id ||
		source.recurringItemId !== undefined ||
		source.recurrence === undefined
	) {
		throw new EventCalendarError(
			'invalid-recurrence',
			`Exception item ${item.id} must reference a distinct recurring source in the same collection.`,
			{ id: item.id, recurringItemId: identity.recurringItemId }
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
		throw new EventCalendarError(
			'invalid-recurrence',
			`Multiple exceptions target the same origin in series ${source.id}.`,
			{ recurringItemId: source.id, originalStart: canonicalOrigin(originalStart) }
		);
	}
	exceptionOrigins.add(occurrenceKey);
	return {
		item,
		source,
		originalStart,
		canonicalOrigin: canonicalOrigin(originalStart),
		occurrenceKey
	};
}

function throwOriginRepresentationError(itemId: string, sourceId: string): never {
	throw new EventCalendarError(
		'invalid-recurrence',
		`Exception item ${itemId} has an origin representation that does not match its source.`,
		{ id: itemId, recurringItemId: sourceId }
	);
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
		let reconstructed: { start: number; end: number };
		try {
			reconstructed = reconstructSourceOccurrence(
				source,
				exception.originalStart,
				options.displayTimeZone
			);
		} catch (error) {
			if (!(error instanceof EventCalendarError)) throw error;
			throw new EventCalendarError(
				'invalid-recurrence',
				`Exception item ${exception.item.id} has an origin outside its source recurrence domain.`,
				{
					id: exception.item.id,
					recurringItemId: source.id,
					causeCode: error.code,
					cause: error.message
				}
			);
		}
		const verificationRange = getOriginVerificationRange(reconstructed);
		const expanded = expandEventCalendarRecurrence({
			item: source,
			range: verificationRange,
			displayTimeZone: options.displayTimeZone,
			expandRecurrence: options.expandRecurrence
		});
		if (
			!expanded.some(
				(occurrence) => canonicalOrigin(occurrence.originalStart) === exception.canonicalOrigin
			)
		) {
			throw new EventCalendarError(
				'invalid-recurrence',
				`Exception item ${exception.item.id} targets an origin absent from series ${source.id}.`,
				{
					id: exception.item.id,
					recurringItemId: source.id,
					originalStart: exception.canonicalOrigin
				}
			);
		}
		origins.add(exception.occurrenceKey);
	}
	return origins;
}

function getOriginVerificationRange(occurrence: {
	start: number;
	end: number;
}): EventCalendarRange {
	if (occurrence.start === occurrence.end) {
		return { start: new Date(occurrence.start), end: new Date(occurrence.start + 1) };
	}
	return { start: new Date(occurrence.start), end: new Date(occurrence.end) };
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
): { start: number; end: number } {
	if (source.allDay === true) {
		const duration = civilDayDifference(source.start, source.end);
		const start = originalStart as EventCalendarDateOnly;
		const end = addCivilDays(start, duration);
		return {
			start: startOfZonedDay(start, displayTimeZone).getTime(),
			end: startOfZonedDay(end, displayTimeZone).getTime()
		};
	}
	const start = originalStart as Date;
	return {
		start: start.getTime(),
		end: start.getTime() + source.end.getTime() - source.start.getTime()
	};
}

function createDefinitionOccurrence<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	displayTimeZone: string
): EventCalendarOccurrence<TItemFields> {
	if (item.allDay === true) {
		return {
			key: item.id,
			item,
			start: startOfZonedDay(item.start, displayTimeZone),
			end: startOfZonedDay(item.end, displayTimeZone),
			allDay: true,
			isRecurring: item.recurringItemId !== undefined,
			originalStart: cloneOrigin(item.originalStart ?? item.start)
		};
	}
	return {
		key: item.id,
		item,
		start: new Date(item.start.getTime()),
		end: new Date(item.end.getTime()),
		allDay: false,
		isRecurring: item.recurringItemId !== undefined,
		originalStart: cloneOrigin(item.originalStart ?? item.start)
	};
}

function createExpandedOccurrence<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	expanded: EventCalendarExpandedOccurrence,
	key: string,
	displayTimeZone: string
): EventCalendarOccurrence<TItemFields> {
	return {
		key,
		item,
		start: expanded.allDay
			? startOfZonedDay(expanded.start, displayTimeZone)
			: new Date(expanded.start.getTime()),
		end: expanded.allDay
			? startOfZonedDay(expanded.end, displayTimeZone)
			: new Date(expanded.end.getTime()),
		allDay: expanded.allDay,
		isRecurring: true,
		originalStart: cloneOrigin(expanded.originalStart)
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

function canonicalOrigin(origin: Date | EventCalendarDateOnly): string {
	return origin instanceof Date ? `instant:${origin.getTime()}` : `day:${origin}`;
}

function cloneOrigin<T extends Date | EventCalendarDateOnly>(origin: T): T {
	return (origin instanceof Date ? new Date(origin) : origin) as T;
}

function civilDayDifference(start: EventCalendarDateOnly, end: EventCalendarDateOnly): number {
	return civilSerial(end) - civilSerial(start);
}

function civilSerial(day: EventCalendarDateOnly): number {
	const [yearValue, monthValue, dayValue] = day.split('-').map(Number);
	let year = yearValue;
	let month = monthValue;
	if (month <= 2) {
		year -= 1;
		month += 12;
	}
	const era = Math.floor(year / 400);
	const yearOfEra = year - era * 400;
	const dayOfYear = Math.floor((153 * (month - 3) + 2) / 5) + dayValue - 1;
	return (
		era * 146097 +
		yearOfEra * 365 +
		Math.floor(yearOfEra / 4) -
		Math.floor(yearOfEra / 100) +
		dayOfYear
	);
}

type RuntimeRecurrenceIdentity = {
	recurrence?: unknown;
	recurrenceTimeZone?: unknown;
	recurringItemId?: unknown;
	originalStart?: unknown;
};
