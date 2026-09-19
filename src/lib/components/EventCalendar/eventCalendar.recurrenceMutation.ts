import {
	addCivilDays,
	civilDayDifference,
	getZonedDay,
	getZonedParts,
	resolveZonedDateTime,
	resolveZonedMinutesOnDay,
	toDateOnly
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	createRecurringOccurrenceKey,
	decodeRecurringOccurrenceKey
} from './eventCalendar.items.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarProposedUpdate,
	EventCalendarRecurrenceRule
} from './eventCalendar.types.js';

type SeriesOperation = 'move' | 'resize-start' | 'resize-end' | 'convert';
type RecurrenceValue = Date | EventCalendarDateOnly;
type ScheduleValue = Date | EventCalendarDateOnly;

type SeriesTransform<TItemFields extends object> = {
	operation: SeriesOperation;
	seriesItem: EventCalendarItem<TItemFields>;
	previousSeriesItem: EventCalendarItem<TItemFields>;
	exceptionItems: EventCalendarItem<TItemFields>[];
	previousExceptionItems: EventCalendarItem<TItemFields>[];
	committedItems: EventCalendarItem<TItemFields>[];
	proposal: EventCalendarProposedUpdate<TItemFields>;
	interactedProposal: EventCalendarProposedUpdate<TItemFields>;
	remapOccurrenceKey: (key: string) => string;
	restoreOccurrenceKey: (key: string) => string;
};

export type EventCalendarRecurrenceMutation<TItemFields extends object> =
	| {
			scope: 'occurrence';
			seriesItem: EventCalendarItem<TItemFields>;
			item: EventCalendarItem<TItemFields>;
			previousItem: EventCalendarItem<TItemFields> | null;
			committedItems: EventCalendarItem<TItemFields>[];
			proposal: EventCalendarProposedUpdate<TItemFields>;
			exceptionId: string;
	  }
	| ({ scope: 'series' } & SeriesTransform<TItemFields>);

export type CreateRecurrenceMutationOptions<TItemFields extends object> = {
	items: EventCalendarItem<TItemFields>[];
	proposal: EventCalendarProposedUpdate<TItemFields>;
	scope: 'occurrence' | 'series';
	displayTimeZone: string;
	maintainDurationOnAllDayChange: boolean;
	defaultTimedItemDuration: number;
	defaultAllDayItemDuration: number;
	getOccurrenceExceptionId?: (
		seriesItem: EventCalendarItem<TItemFields>,
		occurrence: EventCalendarOccurrence<TItemFields>
	) => string;
	exceptionId?: string;
};

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

export function createEventCalendarRecurrenceMutation<TItemFields extends object>(
	options: CreateRecurrenceMutationOptions<TItemFields>
): EventCalendarRecurrenceMutation<TItemFields> {
	const occurrence = options.proposal.occurrence;
	if (!occurrence) {
		throw new EventCalendarError(
			'invalid-recurrence',
			'A recurring occurrence mutation requires its concrete occurrence.'
		);
	}
	const seriesItem = getSeriesItem(options.items, occurrence);
	if (options.scope === 'occurrence')
		return createOccurrenceMutation(options, seriesItem, occurrence);
	return { scope: 'series', ...createSeriesMutation(options, seriesItem, occurrence) };
}

export function regenerateEventCalendarSeriesMutation<TItemFields extends object>(
	options: CreateRecurrenceMutationOptions<TItemFields>,
	adjustedSeriesItem: EventCalendarItem<TItemFields>,
	operation: SeriesOperation
): Extract<EventCalendarRecurrenceMutation<TItemFields>, { scope: 'series' }> {
	const occurrence = options.proposal.occurrence;
	if (!occurrence) {
		throw new EventCalendarError(
			'invalid-recurrence',
			'A recurring series adjustment requires its concrete occurrence.'
		);
	}
	const seriesItem = getSeriesItem(options.items, occurrence);
	return {
		scope: 'series',
		...createSeriesMutation(options, seriesItem, occurrence, adjustedSeriesItem, operation)
	};
}

function createOccurrenceMutation<TItemFields extends object>(
	options: CreateRecurrenceMutationOptions<TItemFields>,
	seriesItem: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>
): Extract<EventCalendarRecurrenceMutation<TItemFields>, { scope: 'occurrence' }> {
	const previousException =
		occurrence.item.recurringItemId === seriesItem.id ? occurrence.item : null;
	const exceptionId =
		previousException?.id ??
		options.exceptionId ??
		createExceptionId(options, seriesItem, occurrence);
	if (exceptionId === seriesItem.id || exceptionId.length === 0) {
		throw new EventCalendarError(
			'invalid-recurrence',
			'An occurrence exception requires a non-empty id distinct from its series.',
			{ id: exceptionId, recurringItemId: seriesItem.id }
		);
	}
	if (!previousException && options.items.some((item) => item.id === exceptionId)) {
		throw new EventCalendarError('duplicate-item-id', `Duplicate item id: ${exceptionId}.`, {
			id: exceptionId
		});
	}
	const item = createExceptionItem(
		seriesItem,
		previousException,
		options.proposal.item,
		exceptionId,
		occurrence.originalStart
	);
	const committedItems = previousException
		? options.items.map((candidate) => (candidate === previousException ? item : candidate))
		: [...options.items, item];
	return {
		scope: 'occurrence',
		seriesItem,
		item,
		previousItem: previousException,
		committedItems,
		proposal: { ...options.proposal, previousItem: previousException ?? seriesItem, item },
		exceptionId
	};
}

function createExceptionId<TItemFields extends object>(
	options: CreateRecurrenceMutationOptions<TItemFields>,
	seriesItem: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>
): string {
	return (
		options.getOccurrenceExceptionId?.(seriesItem, occurrence) ??
		`${seriesItem.id}--exception--${canonicalOrigin(occurrence.originalStart)}`
	);
}

function createExceptionItem<TItemFields extends object>(
	seriesItem: EventCalendarItem<TItemFields>,
	previousException: EventCalendarItem<TItemFields> | null,
	targetItem: EventCalendarItem<TItemFields>,
	id: string,
	originalStart: RecurrenceValue
): EventCalendarItem<TItemFields> {
	// An edit to an existing exception keeps that exception's own custom fields; a new
	// exception still inherits the series source.
	const item = { ...(previousException ?? seriesItem) } as Record<string, unknown>;
	delete item.recurrence;
	delete item.recurrenceTimeZone;
	delete item.recurringItemId;
	delete item.originalStart;
	item.id = id;
	item.start = cloneScheduleValue(targetItem.start);
	item.end = cloneScheduleValue(targetItem.end);
	if (targetItem.allDay === true) item.allDay = true;
	else delete item.allDay;
	copyResourceAssignment(item, targetItem);
	item.recurringItemId = seriesItem.id;
	item.originalStart = cloneScheduleValue(originalStart);
	return item as EventCalendarItem<TItemFields>;
}

function createSeriesMutation<TItemFields extends object>(
	options: CreateRecurrenceMutationOptions<TItemFields>,
	previousSeriesItem: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>,
	directSeriesTarget?: EventCalendarItem<TItemFields>,
	forcedOperation?: SeriesOperation
): SeriesTransform<TItemFields> {
	const previousExceptionItems = options.items.filter(
		(item) => item.recurringItemId === previousSeriesItem.id
	);
	const targetItem = directSeriesTarget ?? options.proposal.item;
	const interactedReference = occurrenceToPlacement(occurrence, options.displayTimeZone);
	const referenceItem = directSeriesTarget ? previousSeriesItem : interactedReference;
	const operation =
		forcedOperation ?? inferSeriesOperation(options.proposal, previousSeriesItem, referenceItem);
	const recurrence = previousSeriesItem.recurrence;
	if (recurrence === undefined) {
		throw new EventCalendarError('invalid-recurrence', 'A series mutation requires recurrence.', {
			id: previousSeriesItem.id
		});
	}
	if (typeof recurrence === 'string' && operation !== 'resize-end') {
		throw new EventCalendarError(
			'unsupported-recurrence',
			'Raw RRULE series support only end resize; move, start resize, and conversion require a structured rule.',
			{ id: previousSeriesItem.id, operation }
		);
	}

	const transform = createTransform(
		previousSeriesItem,
		referenceItem,
		targetItem,
		operation,
		options.displayTimeZone
	);
	if (
		(operation === 'move' || operation === 'resize-start') &&
		transform.dayDelta !== 0 &&
		typeof recurrence !== 'string' &&
		hasDateSelector(recurrence)
	) {
		throw new EventCalendarError(
			'unsupported-recurrence',
			'Series moves and start resizes that cross a date cannot rewrite structured date selectors.',
			{ id: previousSeriesItem.id, operation }
		);
	}

	const seriesItem = transformSeriesSource(previousSeriesItem, targetItem, transform, options);
	const interactedPlacement =
		operation === 'convert' && (interactedReference.allDay === true) === transform.targetIsAllDay
			? shiftTargetKindPlacement(interactedReference, transform)
			: transformPlacement(interactedReference, transform, options);
	const interactedItem = applyPlacement(interactedReference, interactedPlacement, targetItem);
	const exceptionItems = previousExceptionItems.map((exception) =>
		transformException(exception, previousSeriesItem, transform, options)
	);
	assertConvertedOriginsUnique(
		previousSeriesItem,
		seriesItem,
		previousExceptionItems,
		exceptionItems,
		operation
	);
	const replacements = new Map<string, EventCalendarItem<TItemFields>>([
		[seriesItem.id, seriesItem],
		...exceptionItems.map((item) => [item.id, item] as const)
	]);
	const committedItems = options.items.map((item) => replacements.get(item.id) ?? item);
	const proposal: EventCalendarProposedUpdate<TItemFields> = {
		...options.proposal,
		previousItem: previousSeriesItem,
		item: seriesItem
	};
	const interactedProposal: EventCalendarProposedUpdate<TItemFields> = {
		...options.proposal,
		previousItem: interactedReference,
		item: interactedItem
	};
	return {
		operation,
		seriesItem,
		previousSeriesItem,
		exceptionItems,
		previousExceptionItems,
		committedItems,
		proposal,
		interactedProposal,
		remapOccurrenceKey: (key) => remapOccurrenceKey(key, previousSeriesItem.id, transform),
		restoreOccurrenceKey: (key) =>
			remapOccurrenceKey(key, previousSeriesItem.id, invertTransform(transform))
	};
}

function assertConvertedOriginsUnique<TItemFields extends object>(
	previousSeriesItem: EventCalendarItem<TItemFields>,
	seriesItem: EventCalendarItem<TItemFields>,
	previousExceptionItems: readonly EventCalendarItem<TItemFields>[],
	exceptionItems: readonly EventCalendarItem<TItemFields>[],
	operation: SeriesOperation
): void {
	if (operation !== 'convert') return;
	const originPairs: Array<readonly [RecurrenceValue, RecurrenceValue]> = [
		[previousSeriesItem.start, seriesItem.start]
	];
	const previousRule = previousSeriesItem.recurrence;
	const nextRule = seriesItem.recurrence;
	if (
		previousRule &&
		typeof previousRule !== 'string' &&
		nextRule &&
		typeof nextRule !== 'string'
	) {
		for (const [previousOrigins, nextOrigins] of [
			[previousRule.exDates, nextRule.exDates],
			[previousRule.rDates, nextRule.rDates]
		] as const) {
			if (!previousOrigins || !nextOrigins) continue;
			for (let index = 0; index < previousOrigins.length; index += 1) {
				originPairs.push([previousOrigins[index], nextOrigins[index]]);
			}
		}
	}
	for (let index = 0; index < previousExceptionItems.length; index += 1) {
		const previousOrigin = previousExceptionItems[index].originalStart;
		const nextOrigin = exceptionItems[index].originalStart;
		if (previousOrigin === undefined || nextOrigin === undefined) continue;
		originPairs.push([previousOrigin, nextOrigin]);
	}
	const sourceByTarget = new Map<string, string>();
	for (const [previousOrigin, nextOrigin] of originPairs) {
		const source = canonicalOrigin(previousOrigin);
		const target = canonicalOrigin(nextOrigin);
		const existingSource = sourceByTarget.get(target);
		if (existingSource && existingSource !== source) {
			throw new EventCalendarError(
				'invalid-recurrence',
				'A series conversion cannot collapse distinct canonical recurrence origins.',
				{ id: previousSeriesItem.id, target }
			);
		}
		sourceByTarget.set(target, source);
	}
}

function applyPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	placement: { allDay: boolean; start: ScheduleValue; end: ScheduleValue },
	resourceSource: EventCalendarItem<TItemFields>
): EventCalendarItem<TItemFields> {
	const next = { ...item } as Record<string, unknown>;
	next.start = placement.start;
	next.end = placement.end;
	if (placement.allDay) next.allDay = true;
	else delete next.allDay;
	copyResourceAssignment(next, resourceSource);
	return next as EventCalendarItem<TItemFields>;
}

type PlacementTransform = {
	operation: SeriesOperation;
	sourceWasAllDay: boolean;
	targetIsAllDay: boolean;
	dayDelta: number;
	wallDeltaMs: number;
	endDayDelta: number;
	endWallDeltaMs: number;
	oldTimeZone: string;
	newTimeZone: string;
	targetWallMinutes: number;
	oldWallMinutes: number;
};

function createTransform<TItemFields extends object>(
	seriesItem: EventCalendarItem<TItemFields>,
	referenceItem: EventCalendarItem<TItemFields>,
	targetItem: EventCalendarItem<TItemFields>,
	operation: SeriesOperation,
	displayTimeZone: string
): PlacementTransform {
	const sourceWasAllDay = seriesItem.allDay === true;
	const targetIsAllDay = targetItem.allDay === true;
	const oldTimeZone = sourceWasAllDay ? displayTimeZone : (seriesItem.recurrenceTimeZone as string);
	const newTimeZone = sourceWasAllDay && !targetIsAllDay ? displayTimeZone : oldTimeZone;
	const startDelta = getPlacementDelta(referenceItem.start, targetItem.start, oldTimeZone);
	const endDelta = getPlacementDelta(referenceItem.end, targetItem.end, oldTimeZone);
	return {
		operation,
		sourceWasAllDay,
		targetIsAllDay,
		dayDelta: startDelta.days,
		wallDeltaMs: startDelta.wallMilliseconds,
		endDayDelta: endDelta.days,
		endWallDeltaMs: endDelta.wallMilliseconds,
		oldTimeZone,
		newTimeZone,
		targetWallMinutes:
			targetItem.start instanceof Date ? getWallMinutes(targetItem.start, newTimeZone) : 0,
		oldWallMinutes:
			seriesItem.start instanceof Date ? getWallMinutes(seriesItem.start, oldTimeZone) : 0
	};
}

function invertTransform(transform: PlacementTransform): PlacementTransform {
	return {
		...transform,
		sourceWasAllDay: transform.targetIsAllDay,
		targetIsAllDay: transform.sourceWasAllDay,
		dayDelta: -transform.dayDelta,
		wallDeltaMs: -transform.wallDeltaMs,
		endDayDelta: -transform.endDayDelta,
		endWallDeltaMs: -transform.endWallDeltaMs,
		oldTimeZone: transform.newTimeZone,
		newTimeZone: transform.oldTimeZone,
		targetWallMinutes: transform.oldWallMinutes,
		oldWallMinutes: transform.targetWallMinutes
	};
}

function transformSeriesSource<TItemFields extends object>(
	seriesItem: EventCalendarItem<TItemFields>,
	targetItem: EventCalendarItem<TItemFields>,
	transform: PlacementTransform,
	options: CreateRecurrenceMutationOptions<TItemFields>
): EventCalendarItem<TItemFields> {
	const next = { ...seriesItem } as Record<string, unknown>;
	const placement = transformPlacement(seriesItem, transform, options);
	next.start = placement.start;
	next.end = placement.end;
	if (placement.allDay) next.allDay = true;
	else delete next.allDay;
	copyResourceAssignment(next, targetItem);
	if (seriesItem.recurrence && typeof seriesItem.recurrence !== 'string') {
		next.recurrence = transformRule(seriesItem.recurrence, transform);
	}
	if (placement.allDay) delete next.recurrenceTimeZone;
	else next.recurrenceTimeZone = transform.newTimeZone;
	return next as EventCalendarItem<TItemFields>;
}

function copyResourceAssignment(
	target: Record<string, unknown>,
	source: { resourceId?: string; resourceIds?: readonly string[] }
): void {
	delete target.resourceId;
	delete target.resourceIds;
	if (source.resourceIds !== undefined) target.resourceIds = [...source.resourceIds];
	else if (source.resourceId !== undefined) target.resourceId = source.resourceId;
}

function transformException<TItemFields extends object>(
	exception: EventCalendarItem<TItemFields>,
	seriesItem: EventCalendarItem<TItemFields>,
	transform: PlacementTransform,
	options: CreateRecurrenceMutationOptions<TItemFields>
): EventCalendarItem<TItemFields> {
	const next = { ...exception } as Record<string, unknown>;
	const isAlreadyTargetKind = (exception.allDay === true) === transform.targetIsAllDay;
	const placement =
		transform.operation === 'convert' && isAlreadyTargetKind
			? shiftTargetKindPlacement(exception, transform)
			: transformPlacement(exception, transform, options);
	next.start = placement.start;
	next.end = placement.end;
	if (placement.allDay) next.allDay = true;
	else delete next.allDay;
	next.recurringItemId = seriesItem.id;
	next.originalStart = transformOrigin(exception.originalStart as RecurrenceValue, transform);
	delete next.recurrence;
	delete next.recurrenceTimeZone;
	return next as EventCalendarItem<TItemFields>;
}

function transformPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	transform: PlacementTransform,
	options: CreateRecurrenceMutationOptions<TItemFields>
): { allDay: boolean; start: ScheduleValue; end: ScheduleValue } {
	if (transform.operation === 'convert') {
		return convertPlacement(item, transform, options);
	}
	if (item.allDay === true) {
		const start =
			transform.operation === 'resize-end'
				? item.start
				: addCivilDays(item.start, transform.dayDelta);
		const end =
			transform.operation === 'resize-start'
				? item.end
				: addCivilDays(
						item.end,
						transform.operation === 'resize-end' ? transform.endDayDelta : transform.dayDelta
					);
		return { allDay: true, start, end };
	}
	const start =
		transform.operation === 'resize-end'
			? item.start
			: shiftWallInstant(item.start, transform.wallDeltaMs, transform.oldTimeZone);
	const end =
		transform.operation === 'resize-start'
			? item.end
			: shiftWallInstant(
					item.end,
					transform.operation === 'resize-end' ? transform.endWallDeltaMs : transform.wallDeltaMs,
					transform.oldTimeZone
				);
	return { allDay: false, start, end };
}

function convertPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	transform: PlacementTransform,
	options: CreateRecurrenceMutationOptions<TItemFields>
): { allDay: boolean; start: ScheduleValue; end: ScheduleValue } {
	if (transform.targetIsAllDay) {
		const sourceStart = item.start as Date;
		const start = addCivilDays(getZonedDay(sourceStart, transform.oldTimeZone), transform.dayDelta);
		const durationDays = options.maintainDurationOnAllDayChange
			? touchedCivilDayCount(item.start as Date, item.end as Date, transform.oldTimeZone)
			: options.defaultAllDayItemDuration;
		return { allDay: true, start, end: addCivilDays(start, durationDays) };
	}
	const sourceStart = item.start as EventCalendarDateOnly;
	const startDay = addCivilDays(sourceStart, transform.dayDelta);
	const start = resolveZonedMinutesOnDay(
		startDay,
		transform.targetWallMinutes,
		transform.newTimeZone
	);
	if (!options.maintainDurationOnAllDayChange) {
		return {
			allDay: false,
			start,
			end: new Date(start.getTime() + options.defaultTimedItemDuration * MINUTE_MS)
		};
	}
	const durationDays = Math.max(
		1,
		civilDayDifference(item.start as EventCalendarDateOnly, item.end as EventCalendarDateOnly)
	);
	const endDay = addCivilDays(startDay, durationDays);
	return {
		allDay: false,
		start,
		end: resolveZonedMinutesOnDay(endDay, transform.targetWallMinutes, transform.newTimeZone)
	};
}

function shiftTargetKindPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	transform: PlacementTransform
): { allDay: boolean; start: ScheduleValue; end: ScheduleValue } {
	if (item.allDay === true) {
		return {
			allDay: true,
			start: addCivilDays(item.start, transform.dayDelta),
			end: addCivilDays(item.end, transform.dayDelta)
		};
	}
	return {
		allDay: false,
		start: shiftWallInstant(item.start, transform.wallDeltaMs, transform.newTimeZone),
		end: shiftWallInstant(item.end, transform.wallDeltaMs, transform.newTimeZone)
	};
}

function transformRule(
	rule: EventCalendarRecurrenceRule,
	transform: PlacementTransform
): EventCalendarRecurrenceRule {
	if (transform.operation === 'resize-end') return cloneRule(rule);
	return {
		...rule,
		...(rule.until === undefined ? {} : { until: transformOrigin(rule.until, transform) }),
		...(rule.exDates === undefined
			? {}
			: { exDates: rule.exDates.map((origin) => transformOrigin(origin, transform)) }),
		...(rule.rDates === undefined
			? {}
			: { rDates: rule.rDates.map((origin) => transformOrigin(origin, transform)) })
	};
}

function cloneRule(rule: EventCalendarRecurrenceRule): EventCalendarRecurrenceRule {
	return {
		...rule,
		...(rule.byWeekday ? { byWeekday: [...rule.byWeekday] } : {}),
		...(rule.byMonthDay ? { byMonthDay: [...rule.byMonthDay] } : {}),
		...(rule.byMonth ? { byMonth: [...rule.byMonth] } : {}),
		...(rule.until ? { until: cloneScheduleValue(rule.until) } : {}),
		...(rule.exDates ? { exDates: rule.exDates.map(cloneScheduleValue) } : {}),
		...(rule.rDates ? { rDates: rule.rDates.map(cloneScheduleValue) } : {})
	};
}

function transformOrigin(origin: RecurrenceValue, transform: PlacementTransform): RecurrenceValue {
	if (transform.operation === 'resize-end') return cloneScheduleValue(origin);
	if (transform.operation === 'convert') {
		if (transform.targetIsAllDay) {
			return addCivilDays(getZonedDay(origin as Date, transform.oldTimeZone), transform.dayDelta);
		}
		const day = addCivilDays(origin as EventCalendarDateOnly, transform.dayDelta);
		return resolveZonedMinutesOnDay(day, transform.targetWallMinutes, transform.newTimeZone);
	}
	return typeof origin === 'string'
		? addCivilDays(origin, transform.dayDelta)
		: shiftWallInstant(origin, transform.wallDeltaMs, transform.oldTimeZone);
}

function remapOccurrenceKey(key: string, seriesId: string, transform: PlacementTransform): string {
	const decoded = decodeRecurringOccurrenceKey(key);
	if (!decoded || decoded.seriesId !== seriesId || transform.operation === 'resize-end') return key;
	return createRecurringOccurrenceKey(seriesId, transformOrigin(decoded.originalStart, transform));
}

function inferSeriesOperation<TItemFields extends object>(
	proposal: EventCalendarProposedUpdate<TItemFields>,
	seriesItem: EventCalendarItem<TItemFields>,
	referenceItem: EventCalendarItem<TItemFields>
): SeriesOperation {
	if ((proposal.item.allDay === true) !== (seriesItem.allDay === true)) return 'convert';
	if (proposal.kind === 'move') return 'move';
	if (proposal.kind === 'resize-start') return 'resize-start';
	if (proposal.kind === 'resize-end') return 'resize-end';
	const didStartChange = !scheduleValuesEqual(proposal.item.start, referenceItem.start);
	const didEndChange = !scheduleValuesEqual(proposal.item.end, referenceItem.end);
	if (didStartChange && !didEndChange) return 'resize-start';
	if (!didStartChange && didEndChange) return 'resize-end';
	if (didStartChange && didEndChange) {
		const timeZone = seriesItem.allDay === true ? 'UTC' : (seriesItem.recurrenceTimeZone as string);
		const startDelta = getPlacementDelta(referenceItem.start, proposal.item.start, timeZone);
		const endDelta = getPlacementDelta(referenceItem.end, proposal.item.end, timeZone);
		if (
			startDelta.days === endDelta.days &&
			startDelta.wallMilliseconds === endDelta.wallMilliseconds
		) {
			return 'move';
		}
		throw new EventCalendarError(
			'invalid-adjustment',
			'A series update that changes both endpoints must apply one coherent move delta.',
			{ id: seriesItem.id }
		);
	}
	return 'move';
}

function getSeriesItem<TItemFields extends object>(
	items: readonly EventCalendarItem<TItemFields>[],
	occurrence: EventCalendarOccurrence<TItemFields>
): EventCalendarItem<TItemFields> {
	const seriesId = occurrence.item.recurringItemId ?? occurrence.item.id;
	const seriesItem = items.find((item) => item.id === seriesId);
	if (
		!seriesItem ||
		seriesItem.recurrence === undefined ||
		seriesItem.recurringItemId !== undefined
	) {
		throw new EventCalendarError(
			'invalid-recurrence',
			'The occurrence has no bound recurring source.',
			{
				key: occurrence.key,
				seriesId
			}
		);
	}
	return seriesItem;
}

function occurrenceToPlacement<TItemFields extends object>(
	occurrence: EventCalendarOccurrence<TItemFields>,
	displayTimeZone: string
): EventCalendarItem<TItemFields> {
	const placement = { ...occurrence.item } as Record<string, unknown>;
	placement.start = new Date(occurrence.start);
	placement.end = new Date(occurrence.end);
	if (occurrence.allDay) {
		placement.allDay = true;
		placement.start = getZonedDay(occurrence.start, displayTimeZone);
		placement.end = getZonedDay(occurrence.end, displayTimeZone);
	} else {
		delete placement.allDay;
	}
	return placement as EventCalendarItem<TItemFields>;
}

function getPlacementDelta(
	previous: ScheduleValue,
	next: ScheduleValue,
	timeZone: string
): { days: number; wallMilliseconds: number } {
	if (typeof previous === 'string' && typeof next === 'string') {
		const days = civilDayDifference(previous, next);
		return { days, wallMilliseconds: days * DAY_MS };
	}
	if (previous instanceof Date && next instanceof Date) {
		const previousParts = getZonedParts(previous, timeZone);
		const nextParts = getZonedParts(next, timeZone);
		return {
			days: civilDayDifference(toDateOnly(previousParts), toDateOnly(nextParts)),
			wallMilliseconds: wallSurrogate(nextParts) - wallSurrogate(previousParts)
		};
	}
	const previousDay = typeof previous === 'string' ? previous : getZonedDay(previous, timeZone);
	const nextDay = typeof next === 'string' ? next : getZonedDay(next, timeZone);
	const days = civilDayDifference(previousDay, nextDay);
	return { days, wallMilliseconds: days * DAY_MS };
}

function shiftWallInstant(instant: Date, delta: number, timeZone: string): Date {
	const parts = getZonedParts(instant, timeZone);
	const shifted = new Date(wallSurrogate(parts) + delta);
	return resolveZonedDateTime(
		{
			year: shifted.getUTCFullYear(),
			month: shifted.getUTCMonth() + 1,
			day: shifted.getUTCDate(),
			hour: shifted.getUTCHours(),
			minute: shifted.getUTCMinutes(),
			second: shifted.getUTCSeconds(),
			millisecond: shifted.getUTCMilliseconds()
		},
		timeZone
	);
}

function wallSurrogate(parts: ReturnType<typeof getZonedParts>): number {
	const date = new Date(0);
	date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
	date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
	return date.getTime();
}

function getWallMinutes(instant: Date, timeZone: string): number {
	const parts = getZonedParts(instant, timeZone);
	return parts.hour * 60 + parts.minute;
}

function touchedCivilDayCount(start: Date, end: Date, timeZone: string): number {
	const startDay = getZonedDay(start, timeZone);
	const inclusiveEnd = new Date(Math.max(start.getTime(), end.getTime() - 1));
	return Math.max(1, civilDayDifference(startDay, getZonedDay(inclusiveEnd, timeZone)) + 1);
}

function hasDateSelector(rule: EventCalendarRecurrenceRule): boolean {
	return Boolean(rule.byWeekday?.length || rule.byMonthDay?.length || rule.byMonth?.length);
}

function canonicalOrigin(origin: RecurrenceValue): string {
	return origin instanceof Date ? `instant-${origin.getTime()}` : `day-${origin}`;
}

function cloneScheduleValue<T extends ScheduleValue>(value: T): T {
	return (value instanceof Date ? new Date(value) : value) as T;
}

function scheduleValuesEqual(left: ScheduleValue, right: ScheduleValue): boolean {
	return left instanceof Date && right instanceof Date
		? left.getTime() === right.getTime()
		: left === right;
}
