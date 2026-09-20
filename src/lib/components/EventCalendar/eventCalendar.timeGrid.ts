import type { EventCalendarTimeTarget } from './eventCalendar.a11y.svelte.js';
import {
	createEventCalendarAllDayPreviewLayout,
	type EventCalendarAllDayRowInsertion
} from './eventCalendar.allDayInsertion.js';
import {
	enumerateInstantSlots,
	getCivilWeekday,
	getZonedParts,
	isEventCalendarOffDay,
	resolveZonedMinutesOnDay,
	startOfZonedDay,
	type EventCalendarDateProfile
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type { EventCalendarAllDayInsertion } from './eventCalendar.interactions.svelte.js';
import type { EventCalendarDayBucket, EventCalendarItemIndex } from './eventCalendar.items.js';
import {
	packEventCalendarLanes,
	packEventCalendarTimedSegments,
	type EventCalendarLaneLayout,
	type EventCalendarTimedPlacement
} from './eventCalendar.layout.js';
import {
	filterEventCalendarBucketByResource,
	type EventCalendarResourceModel
} from './eventCalendar.resources.js';
import type { EventCalendarAdmittedBusinessHours } from './eventCalendar.businessHours.js';
import {
	eventCalendarAllDayCellTarget,
	eventCalendarTimedColumnTarget,
	eventCalendarTimedSlotTarget
} from './eventCalendar.targets.js';
import type {
	EventCalendarDateOnly,
	EventCalendarOffDaysConfig,
	EventCalendarSegment,
	EventCalendarWeekday
} from './eventCalendar.types.js';
import type {
	EventCalendarAllDayDropTarget,
	EventCalendarTimedDropTarget
} from './eventCalendar.targets.js';

export const EVENT_CALENDAR_MINUTE_MS = 60_000;

export type EventCalendarTimeGridView = 'week' | 'day' | 'days' | 'resource';

export const getEventCalendarTimeGridItemTargetKey = (
	kind: 'all-day' | 'timed',
	columnKey: string,
	itemKey: string
): string => `time-item:${kind}:${columnKey}:${itemKey}`;

export type EventCalendarTimeSlot = {
	key: string;
	start: Date;
	end: Date;
	row: number;
	dropTarget: EventCalendarTimedDropTarget;
};

export type EventCalendarBusinessWindow = {
	key: string;
	start: Date;
	end: Date;
};

export type EventCalendarTimeGridDayGeometry<TItemFields extends object> = {
	key: string;
	day: EventCalendarDateOnly;
	column: number;
	columnLabel?: string;
	offDay: boolean;
	resourceId?: string;
	timedColumnTarget: EventCalendarTimedDropTarget;
	allDayDropTarget: EventCalendarAllDayDropTarget;
	windowStart: Date;
	windowEnd: Date;
	minuteCount: number;
	slots: readonly EventCalendarTimeSlot[];
	intervalInstants: readonly Date[];
	businessWindows: readonly EventCalendarBusinessWindow[];
	backgroundSegments: readonly EventCalendarSegment<TItemFields>[];
	allDaySegments: readonly EventCalendarSegment<TItemFields>[];
	allDayBackgroundSegments: readonly EventCalendarSegment<TItemFields>[];
	timedPlacements: readonly EventCalendarTimedPlacement<TItemFields>[];
};

type CreateTimeGridDayGeometryOptions<TItemFields extends object> = {
	columnKey?: string;
	view: EventCalendarTimeGridView;
	day: EventCalendarDateOnly;
	column: number;
	columnLabel?: string;
	offDay?: boolean;
	resourceId?: string;
	timeZone: string;
	dayStartMinutes: number;
	dayEndMinutes: number;
	interval: number;
	slotDuration: number;
	snapDuration: number;
	businessHours: readonly EventCalendarAdmittedBusinessHours[];
	bucket?: EventCalendarDayBucket<TItemFields>;
};

export const getEventCalendarElapsedMinutes = (start: Date, instant: Date): number =>
	(instant.getTime() - start.getTime()) / EVENT_CALENDAR_MINUTE_MS;

export function createEventCalendarTimeGridDayGeometry<TItemFields extends object>({
	columnKey,
	view,
	day,
	column,
	columnLabel,
	offDay = false,
	resourceId,
	timeZone,
	dayStartMinutes,
	dayEndMinutes,
	interval,
	slotDuration,
	snapDuration,
	businessHours,
	bucket
}: CreateTimeGridDayGeometryOptions<TItemFields>): EventCalendarTimeGridDayGeometry<TItemFields> {
	const key = columnKey ?? day;
	const resource = resourceId === undefined ? {} : { resourceId };
	const windowStart = resolveZonedMinutesOnDay(day, dayStartMinutes, timeZone);
	const windowEnd = resolveZonedMinutesOnDay(day, dayEndMinutes, timeZone);
	const slots = enumerateInstantSlots(
		day,
		timeZone,
		dayStartMinutes,
		dayEndMinutes,
		slotDuration
	).map((start, index) => {
		const slot = {
			key: `time-slot:${key}:${start.getTime()}`,
			start,
			end: new Date(
				Math.min(start.getTime() + slotDuration * EVENT_CALENDAR_MINUTE_MS, windowEnd.getTime())
			),
			row: index + 2
		};
		return {
			...slot,
			dropTarget: eventCalendarTimedSlotTarget(view, slot, resourceId)
		};
	});
	const timedSegments = (bucket?.timed ?? [])
		.map((segment) => clipTimedSegment(segment, windowStart, windowEnd))
		.filter((segment): segment is EventCalendarSegment<TItemFields> => segment !== null);
	const foregroundSegments = timedSegments.filter(
		(segment) => segment.occurrence.item.display !== 'background'
	);
	const backgroundSegments = timedSegments.filter(
		(segment) => segment.occurrence.item.display === 'background'
	);
	const allDaySegments = (bucket?.allDay ?? []).filter(
		(segment) => segment.occurrence.item.display !== 'background'
	);
	const allDayBackgroundSegments = (bucket?.allDay ?? []).filter(
		(segment) => segment.occurrence.item.display === 'background'
	);

	return {
		key,
		day,
		column,
		columnLabel,
		offDay,
		...resource,
		timedColumnTarget: eventCalendarTimedColumnTarget(view, {
			key,
			windowStart,
			windowEnd,
			...resource
		}),
		allDayDropTarget: eventCalendarAllDayCellTarget(view, {
			key,
			day,
			...resource
		}),
		windowStart,
		windowEnd,
		minuteCount: getEventCalendarElapsedMinutes(windowStart, windowEnd),
		slots,
		intervalInstants: enumerateInstantSlots(
			day,
			timeZone,
			dayStartMinutes,
			dayEndMinutes,
			interval
		),
		businessWindows: businessHours
			.filter((entry) => entry.daysOfWeek.includes(getCivilWeekday(day)))
			.map((entry): EventCalendarBusinessWindow | null => {
				const start = resolveZonedMinutesOnDay(day, entry.startMinutes, timeZone);
				const end = resolveZonedMinutesOnDay(day, entry.endMinutes, timeZone);
				const clippedStart = new Date(Math.max(start.getTime(), windowStart.getTime()));
				const clippedEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()));
				if (clippedStart >= clippedEnd) return null;
				return {
					key: `${day}:${entry.startMinutes}-${entry.endMinutes}`,
					start: clippedStart,
					end: clippedEnd
				};
			})
			.filter((entry): entry is EventCalendarBusinessWindow => entry !== null),
		backgroundSegments,
		allDaySegments,
		allDayBackgroundSegments,
		timedPlacements: packEventCalendarTimedSegments(foregroundSegments, snapDuration).placements
	};
}

function clipTimedSegment<TItemFields extends object>(
	segment: EventCalendarSegment<TItemFields>,
	windowStart: Date,
	windowEnd: Date
): EventCalendarSegment<TItemFields> | null {
	const start = Math.max(segment.start.getTime(), windowStart.getTime());
	const end = Math.min(segment.end.getTime(), windowEnd.getTime());
	if (start > end || (start === end && segment.start.getTime() !== segment.end.getTime()))
		return null;
	if (start === windowEnd.getTime()) return null;
	return {
		...segment,
		start: new Date(start),
		end: new Date(end),
		isStart: segment.isStart && start === segment.start.getTime(),
		isEnd: segment.isEnd && end === segment.end.getTime(),
		continuesBefore: segment.continuesBefore || start > segment.start.getTime(),
		continuesAfter: segment.continuesAfter || end < segment.end.getTime()
	};
}

type EventCalendarTimeGridColumn = Pick<
	EventCalendarTimeGridDayGeometry<Record<never, never>>,
	'key' | 'day' | 'column' | 'resourceId'
>;

export type EventCalendarTimeGridSurface<TItemFields extends object> = Readonly<{
	visibleDays: readonly EventCalendarDateOnly[];
	dayGeometries: readonly EventCalendarTimeGridDayGeometry<TItemFields>[];
	maximumMinuteCount: number;
	allDaySegments: readonly EventCalendarSegment<TItemFields>[];
}>;

export type EventCalendarTimeGridSurfaceOptions<TResourceFields extends object> = Readonly<{
	view: EventCalendarTimeGridView;
	timeZone: string;
	dayStartMinutes: number;
	dayEndMinutes: number;
	interval: number;
	slotDuration: number;
	snapDuration: number;
	businessHours: readonly EventCalendarAdmittedBusinessHours[];
	offDays: boolean | EventCalendarOffDaysConfig;
	weekendDays: readonly EventCalendarWeekday[];
	longDayFormatter: Intl.DateTimeFormat;
	unassignedResourceLabel: string;
	resourceModel?: EventCalendarResourceModel<TResourceFields>;
}>;

export function createEventCalendarTimeGridSurface<
	TItemFields extends object,
	TResourceFields extends object
>(
	profile: EventCalendarDateProfile,
	itemIndex: EventCalendarItemIndex<TItemFields>,
	options: EventCalendarTimeGridSurfaceOptions<TResourceFields>
): EventCalendarTimeGridSurface<TItemFields> {
	const visibleDays = profile.visibleDays;
	let columns: EventCalendarTimeGridColumn[];
	if (options.view === 'resource') {
		const day = visibleDays[0];
		const model = options.resourceModel;
		if (!day || !model) {
			throw new EventCalendarError(
				'invalid-resource',
				'Resource view requires one visible day and a normalized resource model.'
			);
		}
		columns = model.columns.map(({ key, resourceId }, column) => ({
			key,
			day,
			column,
			resourceId
		}));
	} else {
		columns = visibleDays.map((day, column) => ({ key: day, day, column }));
	}
	const dayGeometries = columns.map((column) => {
		const bucket =
			options.view === 'resource' && options.resourceModel
				? filterEventCalendarBucketByResource(
						itemIndex.segmentsByDay.get(column.day),
						options.resourceModel,
						column.resourceId
					)
				: itemIndex.segmentsByDay.get(column.day);
		const dayLabel = options.longDayFormatter.format(startOfZonedDay(column.day, options.timeZone));
		const columnLabel =
			options.view === 'resource'
				? `${options.resourceModel?.resolveLeaf(column.resourceId)?.title ?? options.unassignedResourceLabel}, ${dayLabel}`
				: dayLabel;
		return createEventCalendarTimeGridDayGeometry({
			columnKey: column.key,
			view: options.view,
			day: column.day,
			column: column.column,
			columnLabel,
			offDay: isEventCalendarOffDay(column.day, options.offDays, options.weekendDays),
			...(column.resourceId === undefined ? {} : { resourceId: column.resourceId }),
			timeZone: options.timeZone,
			dayStartMinutes: options.dayStartMinutes,
			dayEndMinutes: options.dayEndMinutes,
			interval: options.interval,
			slotDuration: options.slotDuration,
			snapDuration: options.snapDuration,
			businessHours: options.businessHours,
			bucket
		});
	});
	return {
		visibleDays,
		dayGeometries,
		maximumMinuteCount: Math.max(...dayGeometries.map((geometry) => geometry.minuteCount), 0),
		allDaySegments: dayGeometries.flatMap(({ allDaySegments }) => allDaySegments)
	};
}

export type EventCalendarTimeLabel = {
	instant: Date;
	defaultLabel: string;
};

export type EventCalendarTimeGridLabels = {
	gutterLabels: readonly EventCalendarTimeLabel[];
	localLabelsByColumn: ReadonlyMap<string, readonly EventCalendarTimeLabel[]>;
};

export function createEventCalendarTimeGridLabels<TItemFields extends object>(
	dayGeometries: readonly EventCalendarTimeGridDayGeometry<TItemFields>[],
	timeFormatter: Intl.DateTimeFormat,
	accessibleTimeFormatter: Intl.DateTimeFormat,
	timeZone: string
): EventCalendarTimeGridLabels {
	const labelProfiles = dayGeometries.map((geometry) => {
		const wallLabels = geometry.intervalInstants.map((instant) => timeFormatter.format(instant));
		const counts = new Map<string, number>();
		wallLabels.forEach((label) => counts.set(label, (counts.get(label) ?? 0) + 1));
		return {
			key: geometry.key,
			signature: `${geometry.minuteCount}:${geometry.intervalInstants
				.map((instant) => {
					const parts = getZonedParts(instant, timeZone);
					return `${parts.hour}:${parts.minute}`;
				})
				.join(',')}`,
			labels: geometry.intervalInstants.map((instant, index) => ({
				instant,
				defaultLabel:
					counts.get(wallLabels[index]) === 1
						? wallLabels[index]
						: accessibleTimeFormatter.format(instant)
			}))
		};
	});
	const signatureCounts = new Map<string, number>();
	for (const profile of labelProfiles) {
		signatureCounts.set(profile.signature, (signatureCounts.get(profile.signature) ?? 0) + 1);
	}
	const gutterProfile = labelProfiles.reduce<(typeof labelProfiles)[number] | undefined>(
		(selected, profile) =>
			(signatureCounts.get(profile.signature) ?? 0) >
			(signatureCounts.get(selected?.signature ?? '') ?? 0)
				? profile
				: selected,
		undefined
	);
	return {
		gutterLabels: gutterProfile?.labels ?? [],
		localLabelsByColumn: new Map(
			labelProfiles
				.filter((profile) => profile.signature !== gutterProfile?.signature)
				.map((profile) => [profile.key, profile.labels])
		)
	};
}

export function createEventCalendarTimeGridAllDayPreview<TItemFields extends object>(
	surface: EventCalendarTimeGridSurface<TItemFields>,
	view: EventCalendarTimeGridView,
	insertion: EventCalendarAllDayInsertion | null
): {
	layout: EventCalendarLaneLayout<TItemFields>;
	insertion: EventCalendarAllDayRowInsertion | null;
	draggingOccurrenceKey: string | null;
} {
	if (view !== 'resource') {
		return createEventCalendarAllDayPreviewLayout(
			surface.allDaySegments,
			surface.visibleDays,
			insertion
		);
	}
	const placements = surface.dayGeometries.flatMap((geometry) =>
		packEventCalendarLanes(geometry.allDaySegments, [geometry.day]).placements.map((placement) => ({
			...placement,
			startIndex: geometry.column,
			endIndex: geometry.column + 1
		}))
	);
	return {
		layout: {
			placements,
			laneCount: placements.reduce((count, placement) => Math.max(count, placement.lane + 1), 0),
			layoutIdentity: {}
		},
		insertion: null,
		draggingOccurrenceKey: null
	};
}

export function createEventCalendarTimeTargets<TItemFields extends object>(
	surface: EventCalendarTimeGridSurface<TItemFields>,
	allDayLayout: EventCalendarLaneLayout<TItemFields>,
	slotDuration: number,
	disabled: boolean
): EventCalendarTimeTarget[] {
	if (disabled) return [];
	const targets: EventCalendarTimeTarget[] = [];
	for (const geometry of surface.dayGeometries) {
		const position = { day: geometry.day, column: geometry.column };
		const allDayItems = allDayLayout.placements
			.filter((candidate) => candidate.startIndex === geometry.column)
			.sort((left, right) => left.lane - right.lane || left.key.localeCompare(right.key))
			.map((placement) => ({
				key: getEventCalendarTimeGridItemTargetKey('all-day', geometry.key, placement.key),
				...position,
				row: 1,
				kind: 'item' as const,
				itemKey: placement.occurrence.key
			}));
		const timedTargets = [
			...geometry.slots.map((slot) => ({
				...position,
				key: slot.key,
				row: slot.row,
				kind: 'time-slot' as const,
				dropTarget: slot.dropTarget
			})),
			...geometry.timedPlacements.map((placement) => ({
				...position,
				key: getEventCalendarTimeGridItemTargetKey('timed', geometry.key, placement.segment.key),
				row:
					2 +
					getEventCalendarElapsedMinutes(geometry.windowStart, placement.visualStart) /
						slotDuration,
				kind: 'item' as const,
				itemKey: placement.segment.occurrence.key
			}))
		].sort((left, right) => {
			if (left.row !== right.row) return left.row - right.row;
			if (left.kind !== right.kind) return left.kind === 'time-slot' ? -1 : 1;
			return left.key.localeCompare(right.key);
		});
		const columnTargets: Omit<EventCalendarTimeTarget, 'verticalOrder'>[] = [
			{ key: `day-header:${geometry.key}`, ...position, row: 0, kind: 'day-header' },
			{
				key: `all-day:${geometry.key}`,
				...position,
				row: 1,
				kind: 'all-day',
				dropTarget: geometry.allDayDropTarget
			},
			...allDayItems,
			...timedTargets
		];
		targets.push(...columnTargets.map((target, verticalOrder) => ({ ...target, verticalOrder })));
	}
	return targets;
}
