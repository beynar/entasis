import {
	addCivilDays,
	civilDayDifference,
	getZonedDay,
	isSupportedDateDomainError,
	resolveZonedMinutesOnDay,
	snapInstant
} from './eventCalendar.date.js';
import type {
	EventCalendarAssistedStep,
	EventCalendarDropTarget,
	EventCalendarItemOperation
} from './eventCalendar.interactions.svelte.js';
import type { EventCalendarInteractionResolution } from './eventCalendar.interactionResolution.js';
import {
	replaceEventCalendarPlacement as replacePlacement,
	replaceEventCalendarSchedule as replaceSchedule
} from './eventCalendar.records.js';
import {
	replaceEventCalendarResourceAssignment,
	setEventCalendarResourceIds
} from './eventCalendar.resources.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarMutationSource,
	EventCalendarOccurrence,
	EventCalendarProposedUpdate,
	EventCalendarSlot
} from './eventCalendar.types.js';

const MINUTE_MS = 60_000;

/**
 * Read-only inputs the draft derivation needs from the calendar. The controller
 * supplies these so the draft math stays free of component and DOM state.
 */
export type EventCalendarDraftContext<TItemFields extends object> = Readonly<{
	timeZone: string;
	snapDuration: number;
	defaultTimedItemDuration: number;
	defaultAllDayItemDuration: number;
	maintainDurationOnAllDayChange: boolean;
	resolveItemLeafIds(item: EventCalendarItem<TItemFields>): string[];
	resolveLeafId(resourceId?: string): string | undefined;
	resourceColumns: readonly { resourceId?: string }[];
	getOccurrencePlacementItem(
		occurrence: EventCalendarOccurrence<TItemFields>
	): EventCalendarItem<TItemFields>;
	getConversionDurationTimeZone(occurrence: EventCalendarOccurrence<TItemFields>): string;
}>;

export type EventCalendarItemGestureDraft<TItemFields extends object> = Readonly<{
	kind: EventCalendarItemOperation;
	initialKind: EventCalendarItemOperation;
	source: EventCalendarMutationSource;
	inputMode: 'pointer' | 'assisted';
	occurrence: EventCalendarOccurrence<TItemFields>;
	resolution: EventCalendarInteractionResolution<EventCalendarProposedUpdate<TItemFields>>;
	grabOffsetMs: number;
	grabOffsetDays: number;
	sourceResourceId?: string;
}>;

export function deriveEventCalendarItemProposal<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	gesture: EventCalendarItemGestureDraft<TItemFields>,
	target: EventCalendarDropTarget,
	pointerY: number,
	getTargetRect: (key: string) => DOMRect | null
): EventCalendarProposedUpdate<TItemFields> | null {
	const { occurrence } = gesture;
	const initialKind = gesture.initialKind;
	const sourceItem = occurrence.item;
	const sourceResourceIds = context.resolveItemLeafIds(sourceItem);
	if (
		initialKind !== 'move' &&
		target.view === 'resource' &&
		(target.resourceId === undefined
			? sourceResourceIds.length !== 0
			: !sourceResourceIds.includes(target.resourceId))
	) {
		return null;
	}
	const placementItem = context.getOccurrencePlacementItem(occurrence);
	if (
		gesture.source === 'external-drop' &&
		sourceItem.recurrence !== undefined &&
		target.allDay !== occurrence.allDay
	) {
		return null;
	}
	const isTimedMonthResize =
		initialKind !== 'move' && target.allDay && target.view === 'month' && !occurrence.allDay;
	if (initialKind !== 'move' && target.allDay !== occurrence.allDay && !isTimedMonthResize) {
		return null;
	}
	let operation = initialKind;
	let item: EventCalendarItem<TItemFields>;
	try {
		if (initialKind === 'move') {
			item =
				target.allDay && target.view === 'month' && !occurrence.allDay
					? moveEventCalendarTimedToMonthDay(context, placementItem, occurrence, target.day)
					: target.allDay
						? moveEventCalendarToAllDay(
								context,
								placementItem,
								occurrence,
								target.day,
								gesture.grabOffsetDays
							)
						: moveEventCalendarToTimed(
								context,
								placementItem,
								occurrence,
								target,
								pointerY,
								gesture.grabOffsetMs,
								getTargetRect
							);
		} else if (isTimedMonthResize) {
			const sourceEndpoint = initialKind === 'resize-start' ? occurrence.start : occurrence.end;
			let endpoint = resolveZonedMinutesOnDay(
				target.day,
				getWallMinutes(sourceEndpoint, context.timeZone),
				context.timeZone
			);
			let resize = resizeEventCalendarTimedAcrossEdge(placementItem, initialKind, endpoint);
			if (resize.operation !== initialKind) {
				const oppositeEndpoint =
					resize.operation === 'resize-start' ? occurrence.start : occurrence.end;
				endpoint = resolveZonedMinutesOnDay(
					target.day,
					getWallMinutes(oppositeEndpoint, context.timeZone),
					context.timeZone
				);
				resize = resizeEventCalendarTimedAcrossEdge(placementItem, initialKind, endpoint);
			}
			operation = resize.operation;
			item = resize.item;
		} else if (target.allDay) {
			const resize = resizeEventCalendarAllDayAcrossEdge(placementItem, initialKind, target.day);
			operation = resize.operation;
			item = resize.item;
		} else {
			const endpoint = getEventCalendarTimedTargetInstant(
				context,
				target,
				pointerY,
				getTargetRect(target.key)
			);
			const resize = resizeEventCalendarTimedAcrossEdge(placementItem, initialKind, endpoint);
			operation = resize.operation;
			item = resize.item;
		}
	} catch (error) {
		if (isSupportedDateDomainError(error)) return null;
		throw error;
	}
	if (gesture.source === 'external-drop' && target.allDay === occurrence.allDay) {
		item = replacePlacement(placementItem, {
			allDay: item.allDay === true,
			start: item.start,
			end: item.end
		});
	}
	if (initialKind === 'move') {
		item =
			gesture.source === 'external-drop' && target.view === 'resource'
				? setEventCalendarResourceIds(item, target.resourceId ? [target.resourceId] : [])
				: applyTargetResource(item, target, gesture.sourceResourceId);
	}
	return {
		kind: operation,
		source:
			gesture.source === 'external-drop'
				? gesture.source
				: gesture.inputMode === 'pointer'
					? draftOperationSource(operation)
					: gesture.source,
		occurrence,
		previousItem: sourceItem,
		item
	};
}

function draftOperationSource(operation: EventCalendarItemOperation): EventCalendarMutationSource {
	return operation === 'move' ? 'drag' : operation;
}

export function getEventCalendarTimedTargetInstant<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	target: Extract<EventCalendarDropTarget, { allDay: false }>,
	pointerY: number,
	rect: DOMRect | null
): Date {
	if (!Number.isFinite(pointerY)) return new Date(target.start);
	const ratio = rect
		? Math.min(1, Math.max(0, (pointerY - rect.top) / Math.max(1, rect.height)))
		: 0;
	const instant = new Date(
		target.start.getTime() + (target.end.getTime() - target.start.getTime()) * ratio
	);
	return snapInstant(instant, context.timeZone, context.snapDuration);
}

function moveEventCalendarTimedToMonthDay<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	item: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>,
	day: EventCalendarDateOnly
): EventCalendarItem<TItemFields> {
	const start = resolveZonedMinutesOnDay(
		day,
		getWallMinutes(occurrence.start, context.timeZone),
		context.timeZone
	);
	return replaceSchedule(item, {
		allDay: false,
		start,
		end: new Date(start.getTime() + occurrence.end.getTime() - occurrence.start.getTime())
	});
}

function moveEventCalendarToAllDay<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	item: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>,
	targetDay: EventCalendarDateOnly,
	grabOffsetDays: number
): EventCalendarItem<TItemFields> {
	const start = addCivilDays(targetDay, -grabOffsetDays);
	const durationDays =
		occurrence.allDay && context.maintainDurationOnAllDayChange
			? Math.max(
					1,
					civilDayDifference(
						getZonedDay(occurrence.start, context.timeZone),
						getZonedDay(occurrence.end, context.timeZone)
					)
				)
			: occurrence.allDay
				? Math.max(
						1,
						civilDayDifference(
							item.start as EventCalendarDateOnly,
							item.end as EventCalendarDateOnly
						)
					)
				: context.maintainDurationOnAllDayChange
					? touchedCivilDayCount(occurrence, context.getConversionDurationTimeZone(occurrence))
					: context.defaultAllDayItemDuration;
	return replaceSchedule(item, {
		allDay: true,
		start,
		end: addCivilDays(start, durationDays)
	});
}

function moveEventCalendarToTimed<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	item: EventCalendarItem<TItemFields>,
	occurrence: EventCalendarOccurrence<TItemFields>,
	target: Extract<EventCalendarDropTarget, { allDay: false }>,
	pointerY: number,
	grabOffsetMs: number,
	getTargetRect: (key: string) => DOMRect | null
): EventCalendarItem<TItemFields> {
	const pointer = getEventCalendarTimedTargetInstant(
		context,
		target,
		pointerY,
		getTargetRect(target.key)
	);
	const start = snapInstant(
		new Date(pointer.getTime() - grabOffsetMs),
		context.timeZone,
		context.snapDuration
	);
	let durationMs: number;
	if (!occurrence.allDay) durationMs = occurrence.end.getTime() - occurrence.start.getTime();
	else if (!context.maintainDurationOnAllDayChange) {
		durationMs = context.defaultTimedItemDuration * MINUTE_MS;
	} else {
		const conversionTimeZone = context.getConversionDurationTimeZone(occurrence);
		const days = Math.max(
			1,
			civilDayDifference(item.start as EventCalendarDateOnly, item.end as EventCalendarDateOnly)
		);
		const endDay = addCivilDays(getZonedDay(start, conversionTimeZone), days);
		const parts = getWallMinutes(start, conversionTimeZone);
		durationMs =
			resolveZonedMinutesOnDay(endDay, parts, conversionTimeZone).getTime() - start.getTime();
	}
	return replaceSchedule(item, {
		allDay: false,
		start,
		end: new Date(start.getTime() + durationMs)
	});
}

function resizeEventCalendarAllDayAcrossEdge<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	initialKind: Exclude<EventCalendarItemOperation, 'move'>,
	targetDay: EventCalendarDateOnly
): {
	operation: Exclude<EventCalendarItemOperation, 'move'>;
	item: EventCalendarItem<TItemFields>;
} {
	if (item.allDay !== true) return { operation: initialKind, item };
	const crossingBoundary = initialKind === 'resize-start' ? item.end : item.start;
	const operation = targetDay < crossingBoundary ? 'resize-start' : 'resize-end';
	const start = operation === 'resize-start' ? targetDay : item.start;
	const end = operation === 'resize-end' ? addCivilDays(targetDay, 1) : item.end;
	return {
		operation,
		item: replaceSchedule(item, { allDay: true, start, end })
	};
}

function resizeEventCalendarTimedAcrossEdge<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	initialKind: Exclude<EventCalendarItemOperation, 'move'>,
	endpoint: Date
): {
	operation: Exclude<EventCalendarItemOperation, 'move'>;
	item: EventCalendarItem<TItemFields>;
} {
	if (item.allDay === true) return { operation: initialKind, item };
	const crossingBoundary = initialKind === 'resize-start' ? item.end : item.start;
	const endpointTime = endpoint.getTime();
	const crossingTime = crossingBoundary.getTime();
	const operation =
		endpointTime < crossingTime
			? 'resize-start'
			: endpointTime > crossingTime
				? 'resize-end'
				: initialKind;
	return {
		operation,
		item: replaceSchedule(item, {
			allDay: false,
			start: operation === 'resize-start' ? endpoint : item.start,
			end: operation === 'resize-end' ? endpoint : item.end
		})
	};
}

export function applyEventCalendarAssistedStep<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	item: EventCalendarItem<TItemFields>,
	operation: EventCalendarItemOperation,
	step: EventCalendarAssistedStep,
	sourceResourceId?: string
): EventCalendarItem<TItemFields> {
	let next = item;
	const dayDelta = step.dayDelta ?? 0;
	const minuteDelta = step.minuteDelta ?? 0;
	const shouldShiftStart = operation !== 'resize-end';
	const shouldShiftEnd = operation !== 'resize-start';
	if (next.allDay === true) {
		next = replacePlacement(next, {
			allDay: true,
			start: shouldShiftStart ? addCivilDays(next.start, dayDelta) : next.start,
			end: shouldShiftEnd ? addCivilDays(next.end, dayDelta) : next.end
		});
	} else {
		if (operation === 'move') {
			const duration = next.end.getTime() - next.start.getTime();
			const start = shiftEventCalendarTimedEndpoint(context, next.start, dayDelta, minuteDelta);
			next = replacePlacement(next, {
				allDay: false,
				start,
				end: new Date(start.getTime() + duration)
			});
		} else {
			next = replacePlacement(next, {
				allDay: false,
				start: shouldShiftStart
					? shiftEventCalendarTimedEndpoint(context, next.start, dayDelta, minuteDelta)
					: next.start,
				end: shouldShiftEnd
					? shiftEventCalendarTimedEndpoint(context, next.end, dayDelta, minuteDelta)
					: next.end
			});
		}
	}
	if (operation !== 'move' || !step.resourceDirection) return next;
	const columns = context.resourceColumns;
	const currentId = context.resolveLeafId(sourceResourceId) ?? context.resolveItemLeafIds(next)[0];
	const currentIndex = columns.findIndex((column) => column.resourceId === currentId);
	const target = columns[currentIndex + step.resourceDirection];
	if (!target) return next;
	return replaceEventCalendarResourceAssignment(next, currentId, target.resourceId);
}

export function getEventCalendarAssistedResourceTarget<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	item: EventCalendarItem<TItemFields>,
	sourceResourceId: string | undefined,
	direction: -1 | 1
): { resourceId: string | undefined } | null {
	const columns = context.resourceColumns;
	const currentId = context.resolveLeafId(sourceResourceId) ?? context.resolveItemLeafIds(item)[0];
	const currentIndex = columns.findIndex((column) => column.resourceId === currentId);
	const target = columns[currentIndex + direction];
	return target ? { resourceId: target.resourceId } : null;
}

function shiftEventCalendarTimedEndpoint<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	endpoint: Date,
	dayDelta: number,
	minuteDelta: number
): Date {
	const shifted = new Date(endpoint.getTime() + minuteDelta * MINUTE_MS);
	if (dayDelta === 0) return shifted;
	return resolveZonedMinutesOnDay(
		addCivilDays(getZonedDay(shifted, context.timeZone), dayDelta),
		getWallMinutes(shifted, context.timeZone),
		context.timeZone
	);
}

export function eventCalendarSlotFromDropTarget(
	target: EventCalendarDropTarget
): EventCalendarSlot {
	return target.allDay
		? {
				view: target.view,
				allDay: true,
				start: target.day,
				end: addCivilDays(target.day, 1),
				resourceId: target.resourceId
			}
		: {
				view: target.view,
				allDay: false,
				start: new Date(target.start),
				end: new Date(target.end),
				resourceId: target.resourceId
			};
}

export function eventCalendarSlotFromTarget<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	target: EventCalendarDropTarget,
	pointerY: number,
	rect: DOMRect | null
): EventCalendarSlot {
	if (target.allDay) {
		return {
			view: target.view,
			allDay: true,
			start: target.day,
			end: addCivilDays(target.day, 1),
			resourceId: target.resourceId
		};
	}
	const minimumDuration = context.snapDuration * MINUTE_MS;
	const start = new Date(
		Math.max(
			target.start.getTime(),
			Math.min(
				getEventCalendarTimedTargetInstant(context, target, pointerY, rect).getTime(),
				target.end.getTime() - minimumDuration
			)
		)
	);
	return {
		view: target.view,
		allDay: false,
		start,
		end: new Date(start.getTime() + minimumDuration),
		resourceId: target.resourceId
	};
}

export function hasSameEventCalendarLiveProposal<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	active: EventCalendarItemGestureDraft<TItemFields>,
	proposal: EventCalendarProposedUpdate<TItemFields>,
	operation: EventCalendarItemOperation
): boolean {
	const current = getResolutionProposal(active.resolution);
	if (!current || active.kind !== operation || current.source !== proposal.source) return false;
	const currentItem = current.item;
	const nextItem = proposal.item;
	return (
		currentItem.id === nextItem.id &&
		(currentItem.allDay === true) === (nextItem.allDay === true) &&
		isSameEndpoint(currentItem.start, nextItem.start) &&
		isSameEndpoint(currentItem.end, nextItem.end) &&
		areStringArraysEqual(
			context.resolveItemLeafIds(currentItem),
			context.resolveItemLeafIds(nextItem)
		)
	);
}

export function hasSameEventCalendarPlacement<TItemFields extends object>(
	context: EventCalendarDraftContext<TItemFields>,
	baseline: EventCalendarItem<TItemFields>,
	candidate: EventCalendarItem<TItemFields>
): boolean {
	return (
		(baseline.allDay === true) === (candidate.allDay === true) &&
		isSameEndpoint(baseline.start, candidate.start) &&
		isSameEndpoint(baseline.end, candidate.end) &&
		areStringArraysEqual(
			context.resolveItemLeafIds(baseline),
			context.resolveItemLeafIds(candidate)
		)
	);
}

export function getResolutionProposal<TProposal>(
	resolution: EventCalendarInteractionResolution<TProposal>
): TProposal | null {
	return resolution.state === 'pending' ? null : resolution.proposal;
}

export function isSameEndpoint(
	left: Date | EventCalendarDateOnly,
	right: Date | EventCalendarDateOnly
): boolean {
	if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
	return left === right;
}

export function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function getProposalOperation<TItemFields extends object>(
	proposal: EventCalendarProposedUpdate<TItemFields>,
	fallback: EventCalendarItemOperation
): EventCalendarItemOperation {
	return proposal.kind === 'update' ? fallback : proposal.kind;
}

function applyTargetResource<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	target: EventCalendarDropTarget,
	sourceResourceId?: string
): EventCalendarItem<TItemFields> {
	if (target.view !== 'resource') return item;
	return replaceEventCalendarResourceAssignment(item, sourceResourceId, target.resourceId);
}

function touchedCivilDayCount<TItemFields extends object>(
	occurrence: EventCalendarOccurrence<TItemFields>,
	timeZone: string
): number {
	const startDay = getZonedDay(occurrence.start, timeZone);
	const inclusiveEndDay = getZonedDay(
		new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1)),
		timeZone
	);
	return Math.max(1, civilDayDifference(startDay, inclusiveEndDay) + 1);
}

function getWallMinutes(instant: Date, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		minute: 'numeric',
		hourCycle: 'h23'
	}).formatToParts(instant);
	const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
	const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
	return hour * 60 + minute;
}
