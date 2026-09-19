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
import {
	eventCalendarAllDayCellTarget,
	eventCalendarTimedColumnTarget,
	eventCalendarTimedSlotTarget
} from './eventCalendar.targets.js';
import type {
	EventCalendarBusinessHours,
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
	timedPlacements: readonly EventCalendarTimedPlacement<TItemFields>[];
};

type CreateTimeGridDayGeometryOptions<TItemFields extends object> = {
	columnKey?: string;
	view: EventCalendarTimeGridView;
	day: EventCalendarDateOnly;
	column: number;
	resourceId?: string;
	timeZone: string;
	dayStartMinutes: number;
	dayEndMinutes: number;
	interval: number;
	slotDuration: number;
	snapDuration: number;
	businessHours: readonly EventCalendarBusinessHours[];
	bucket?: EventCalendarDayBucket<TItemFields>;
};

export function getEventCalendarElapsedMinutes(start: Date, instant: Date): number {
	return (instant.getTime() - start.getTime()) / EVENT_CALENDAR_MINUTE_MS;
}

export function createEventCalendarTimeGridDayGeometry<TItemFields extends object>({
	columnKey,
	view,
	day,
	column,
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

	return {
		key,
		day,
		column,
		...(resourceId === undefined ? {} : { resourceId }),
		timedColumnTarget: eventCalendarTimedColumnTarget(view, {
			key,
			windowStart,
			windowEnd,
			...(resourceId === undefined ? {} : { resourceId })
		}),
		allDayDropTarget: eventCalendarAllDayCellTarget(view, {
			key,
			day,
			...(resourceId === undefined ? {} : { resourceId })
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
		businessWindows: getBusinessEntries(businessHours, getCivilWeekday(day))
			.map((entry): EventCalendarBusinessWindow | null => {
				const start = resolveZonedMinutesOnDay(day, parseBusinessMinutes(entry.start), timeZone);
				const end = resolveZonedMinutesOnDay(day, parseBusinessMinutes(entry.end), timeZone);
				const clippedStart = new Date(Math.max(start.getTime(), windowStart.getTime()));
				const clippedEnd = new Date(Math.min(end.getTime(), windowEnd.getTime()));
				if (clippedStart >= clippedEnd) return null;
				return { key: `${day}:${entry.start}-${entry.end}`, start: clippedStart, end: clippedEnd };
			})
			.filter((entry): entry is EventCalendarBusinessWindow => entry !== null),
		backgroundSegments,
		timedPlacements: packEventCalendarTimedSegments(foregroundSegments, snapDuration).placements
	};
}

function parseBusinessMinutes(value: string): number {
	const [hour, minute] = value.split(':').map(Number);
	return hour * 60 + minute;
}

function getBusinessEntries(
	businessHours: readonly EventCalendarBusinessHours[],
	weekday: EventCalendarWeekday
): readonly EventCalendarBusinessHours[] {
	return businessHours.filter(
		(entry) => entry.daysOfWeek === undefined || entry.daysOfWeek.includes(weekday)
	);
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

export type EventCalendarTimeGridColumn = {
	key: string;
	day: EventCalendarDateOnly;
	column: number;
	resourceId?: string;
};

export type EventCalendarTimeGridSurface<TItemFields extends object> = Readonly<{
	visibleDays: readonly EventCalendarDateOnly[];
	offDaysByDay: ReadonlyMap<EventCalendarDateOnly, boolean>;
	columns: readonly EventCalendarTimeGridColumn[];
	dayGeometries: readonly EventCalendarTimeGridDayGeometry<TItemFields>[];
	maximumMinuteCount: number;
	allDaySegments: readonly EventCalendarSegment<TItemFields>[];
	allDayBackgroundSegmentsByColumn: ReadonlyMap<
		string,
		readonly EventCalendarSegment<TItemFields>[]
	>;
	columnBuckets: readonly {
		column: EventCalendarTimeGridColumn;
		bucket: EventCalendarDayBucket<TItemFields> | undefined;
	}[];
}>;

export type EventCalendarTimeGridSurfaceOptions<TResourceFields extends object> = Readonly<{
	view: EventCalendarTimeGridView;
	timeZone: string;
	dayStartMinutes: number;
	dayEndMinutes: number;
	interval: number;
	slotDuration: number;
	snapDuration: number;
	businessHours: readonly EventCalendarBusinessHours[];
	offDays: boolean | EventCalendarOffDaysConfig;
	weekendDays: readonly EventCalendarWeekday[];
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
	const offDaysByDay = new Map(
		visibleDays.map((day) => [
			day,
			isEventCalendarOffDay(day, options.offDays, options.weekendDays)
		])
	);
	const columns: EventCalendarTimeGridColumn[] =
		options.view !== 'resource'
			? visibleDays.map((day, column) => ({ key: day, day, column }))
			: (() => {
					const day = visibleDays[0];
					if (!day || !options.resourceModel) {
						throw new EventCalendarError(
							'invalid-resource',
							'Resource view requires one visible day and a normalized resource model.'
						);
					}
					return options.resourceModel.columns.map((resourceColumn, column) => ({
						key: resourceColumn.key,
						day,
						column,
						...(resourceColumn.resourceId === undefined
							? {}
							: { resourceId: resourceColumn.resourceId })
					}));
				})();
	const columnBuckets = columns.map((column) => ({
		column,
		bucket:
			options.view === 'resource' && options.resourceModel
				? filterEventCalendarBucketByResource(
						itemIndex.segmentsByDay.get(column.day),
						options.resourceModel,
						column.resourceId
					)
				: itemIndex.segmentsByDay.get(column.day)
	}));
	const dayGeometries = columnBuckets.map(
		({ column, bucket }): EventCalendarTimeGridDayGeometry<TItemFields> =>
			createEventCalendarTimeGridDayGeometry({
				columnKey: column.key,
				view: options.view,
				day: column.day,
				column: column.column,
				...(column.resourceId === undefined ? {} : { resourceId: column.resourceId }),
				timeZone: options.timeZone,
				dayStartMinutes: options.dayStartMinutes,
				dayEndMinutes: options.dayEndMinutes,
				interval: options.interval,
				slotDuration: options.slotDuration,
				snapDuration: options.snapDuration,
				businessHours: options.businessHours,
				bucket
			})
	);
	return {
		visibleDays,
		offDaysByDay,
		columns,
		columnBuckets,
		dayGeometries,
		maximumMinuteCount: Math.max(...dayGeometries.map((geometry) => geometry.minuteCount), 0),
		allDaySegments: columnBuckets.flatMap(
			({ bucket }) =>
				(bucket?.allDay ?? []).filter(
					(segment) => segment.occurrence.item.display !== 'background'
				) as readonly EventCalendarSegment<TItemFields>[]
		),
		allDayBackgroundSegmentsByColumn: new Map(
			columnBuckets.map(({ column, bucket }) => [
				column.key,
				(bucket?.allDay ?? []).filter((segment) => segment.occurrence.item.display === 'background')
			])
		)
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
		for (const label of wallLabels) counts.set(label, (counts.get(label) ?? 0) + 1);
		return {
			geometry,
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
			!selected ||
			(signatureCounts.get(profile.signature) ?? 0) > (signatureCounts.get(selected.signature) ?? 0)
				? profile
				: selected,
		undefined
	);
	const localLabelsByColumn = new Map<string, readonly EventCalendarTimeLabel[]>();
	for (const profile of labelProfiles) {
		if (profile.signature === gutterProfile?.signature) continue;
		localLabelsByColumn.set(profile.geometry.key, profile.labels);
	}
	return { gutterLabels: gutterProfile?.labels ?? [], localLabelsByColumn };
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
	const placements = surface.columnBuckets.flatMap(({ column, bucket }) => {
		const segments = (bucket?.allDay ?? []).filter(
			(segment) => segment.occurrence.item.display !== 'background'
		);
		return packEventCalendarLanes(segments, [column.day]).placements.map((placement) => ({
			...placement,
			startIndex: column.column,
			endIndex: column.column + 1
		}));
	});
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
	view: EventCalendarTimeGridView,
	allDayLayout: EventCalendarLaneLayout<TItemFields>,
	slotDuration: number,
	disabled: boolean
): EventCalendarTimeTarget[] {
	if (disabled) return [];
	const targets: EventCalendarTimeTarget[] = [];
	for (const geometry of surface.dayGeometries) {
		let verticalOrder = 0;
		const pushTarget = (target: Omit<EventCalendarTimeTarget, 'verticalOrder'>): void => {
			targets.push({ ...target, verticalOrder });
			verticalOrder += 1;
		};
		pushTarget({
			key: `day-header:${geometry.key}`,
			day: geometry.day,
			column: geometry.column,
			row: 0,
			kind: 'day-header'
		});
		pushTarget({
			key: `all-day:${geometry.key}`,
			day: geometry.day,
			column: geometry.column,
			row: 1,
			kind: 'all-day',
			dropTarget: geometry.allDayDropTarget
		});
		for (const placement of allDayLayout.placements
			.filter((candidate) => candidate.startIndex === geometry.column)
			.sort((left, right) => left.lane - right.lane || left.key.localeCompare(right.key))) {
			pushTarget({
				key: `all-day-item:${placement.key}`,
				day: geometry.day,
				column: geometry.column,
				row: 1,
				kind: 'item',
				itemKey: placement.occurrence.key
			});
		}
		const timedTargets: Omit<EventCalendarTimeTarget, 'verticalOrder'>[] = [
			...geometry.slots.map((slot) => ({
				key: slot.key,
				day: geometry.day,
				column: geometry.column,
				row: slot.row,
				kind: 'time-slot' as const,
				dropTarget: slot.dropTarget
			})),
			...geometry.timedPlacements.map((placement) => ({
				key: `time-item:${placement.segment.key}`,
				day: geometry.day,
				column: geometry.column,
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
		for (const target of timedTargets) {
			pushTarget(target);
		}
	}
	return targets;
}
