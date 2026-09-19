import type { Density } from '$lib/types/theme.js';
import {
	createEventCalendarAllDayPreviewLayout,
	type EventCalendarAllDayRowInsertion
} from './eventCalendar.allDayInsertion.js';
import {
	addCivilDays,
	generateVisibleDays,
	getCivilWeekday,
	getHiddenWeekdays,
	getZonedDay,
	rangesIntersect,
	startOfZonedDay,
	type EventCalendarDateProfile
} from './eventCalendar.date.js';
import type { EventCalendarAllDayInsertion } from './eventCalendar.interactions.svelte.js';
import type { EventCalendarItemIndex } from './eventCalendar.items.js';
import type { EventCalendarLaneLayout } from './eventCalendar.layout.js';
import type {
	EventCalendarDateOnly,
	EventCalendarSegment,
	EventCalendarWeekday
} from './eventCalendar.types.js';

const WEEKDAYS: readonly EventCalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6];

export type EventCalendarMonthRow = {
	days: readonly EventCalendarDateOnly[];
	leadingEmptyCells: number;
	trailingEmptyCells: number;
};

export type EventCalendarMonthWeekSurface<TItemFields extends object> = EventCalendarMonthRow & {
	foregroundSegments: readonly EventCalendarSegment<TItemFields>[];
};

export type EventCalendarMonthSurface<TItemFields extends object> = Readonly<{
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>;
	renderDays: readonly EventCalendarDateOnly[];
	columnCount: number;
	weekdayHeaderDays: readonly EventCalendarDateOnly[];
	firstDayColumn: number;
	weeks: readonly EventCalendarMonthWeekSurface<TItemFields>[];
	visibleDaySet: ReadonlySet<EventCalendarDateOnly>;
	currentStartDay: EventCalendarDateOnly;
	currentEndDay: EventCalendarDateOnly;
	todayDay: EventCalendarDateOnly | null;
	enabledDays: ReadonlySet<EventCalendarDateOnly>;
}>;

export type EventCalendarMonthSurfaceOptions = Readonly<{
	timeZone: string;
	showWeekends: boolean;
	weekendDays: readonly EventCalendarWeekday[];
	weekStartsOn: EventCalendarWeekday;
	disabled: boolean;
	todayInstant: Date | null;
}>;

export function createEventCalendarMonthSurface<TItemFields extends object>(
	profile: EventCalendarDateProfile,
	itemIndex: EventCalendarItemIndex<TItemFields>,
	options: EventCalendarMonthSurfaceOptions
): EventCalendarMonthSurface<TItemFields> {
	const hiddenWeekdays = getHiddenWeekdays({
		showWeekends: options.showWeekends,
		weekendDays: options.weekendDays
	});
	const renderDays = generateVisibleDays(
		getZonedDay(profile.renderRange.start, options.timeZone),
		getZonedDay(profile.renderRange.end, options.timeZone),
		hiddenWeekdays
	);
	const columnCount = 7 - hiddenWeekdays.size;
	const weekdayHeaderDays = orderWeekdayHeaderDays(
		renderDays,
		options.weekStartsOn,
		hiddenWeekdays
	);
	const firstRenderDay = renderDays[0];
	const firstDayColumn = firstRenderDay
		? Math.max(
				0,
				weekdayHeaderDays.findIndex(
					(day) => getCivilWeekday(day) === getCivilWeekday(firstRenderDay)
				)
			)
		: 0;
	const weekRows = buildMonthRows(renderDays, columnCount, firstDayColumn);
	const visibleDaySet = new Set(profile.visibleDays);
	const currentStartDay = getZonedDay(profile.currentRange.start, options.timeZone);
	const currentEndDay = getZonedDay(profile.currentRange.end, options.timeZone);
	const todayDay = options.todayInstant
		? getZonedDay(options.todayInstant, options.timeZone)
		: null;
	const enabledDays = options.disabled
		? new Set<EventCalendarDateOnly>()
		: new Set(
				renderDays.filter(
					(day) =>
						visibleDaySet.has(day) && !isDayOutsideActiveRange(day, profile, options.timeZone)
				)
			);
	return {
		hiddenWeekdays,
		renderDays,
		columnCount,
		weekdayHeaderDays,
		firstDayColumn,
		weeks: weekRows.map((row) => ({
			...row,
			foregroundSegments: row.days.flatMap(
				(day) => itemIndex.segmentsByDay.get(day)?.foreground ?? []
			)
		})),
		visibleDaySet,
		currentStartDay,
		currentEndDay,
		todayDay,
		enabledDays
	};
}

export function getEventCalendarMonthAutoLaneSlots(
	monthHeight: number,
	weekCount: number,
	density: Density
): number {
	if (monthHeight <= 0 || weekCount <= 0) return 3;
	const headerHeight = density === 'compact' ? 24 : density === 'comfortable' ? 36 : 30;
	const itemHeight = density === 'compact' ? 20 : density === 'comfortable' ? 28 : 24;
	const dayChrome = density === 'compact' ? 30 : density === 'comfortable' ? 42 : 36;
	const rowHeight = (monthHeight - headerHeight) / weekCount;
	return Math.max(1, Math.floor((rowHeight - dayChrome) / itemHeight));
}

export type EventCalendarMonthWeekLayout<TItemFields extends object> =
	EventCalendarMonthWeekSurface<TItemFields> & {
		layout: EventCalendarLaneLayout<TItemFields>;
		visibleLaneCount: number;
		insertion: EventCalendarAllDayRowInsertion | null;
		draggingOccurrenceKey: string | null;
	};

export function createEventCalendarMonthWeekLayout<TItemFields extends object>(
	week: EventCalendarMonthWeekSurface<TItemFields>,
	insertion: EventCalendarAllDayInsertion | null,
	maxItemsPerCell: number | 'auto',
	autoLaneSlots: number
): EventCalendarMonthWeekLayout<TItemFields> {
	const preview = createEventCalendarAllDayPreviewLayout(
		week.foregroundSegments,
		week.days,
		insertion
	);
	const baseVisibleLaneCount =
		maxItemsPerCell === 'auto'
			? preview.layout.laneCount > autoLaneSlots
				? Math.max(0, autoLaneSlots - 1)
				: autoLaneSlots
			: maxItemsPerCell;
	const previewInsertion = preview.insertion;
	const insertionLaneRequirement = previewInsertion
		? Math.max(
				previewInsertion.lane,
				...preview.layout.placements
					.filter(
						(placement) =>
							placement.startIndex < previewInsertion.endIndex &&
							previewInsertion.startIndex < placement.endIndex
					)
					.map((placement) => placement.lane)
			) + 1
		: 0;
	const visibleLaneCount = Math.max(
		baseVisibleLaneCount,
		Math.min(baseVisibleLaneCount + 1, insertionLaneRequirement)
	);
	const layout =
		week.leadingEmptyCells === 0
			? preview.layout
			: {
					...preview.layout,
					placements: preview.layout.placements.map((placement) => ({
						...placement,
						startIndex: placement.startIndex + week.leadingEmptyCells,
						endIndex: placement.endIndex + week.leadingEmptyCells
					}))
				};
	const shiftedInsertion = preview.insertion
		? {
				...preview.insertion,
				startIndex: preview.insertion.startIndex + week.leadingEmptyCells,
				endIndex: preview.insertion.endIndex + week.leadingEmptyCells
			}
		: null;
	return {
		...week,
		layout,
		visibleLaneCount,
		insertion: shiftedInsertion,
		draggingOccurrenceKey: preview.draggingOccurrenceKey
	};
}

function buildMonthRows(
	days: readonly EventCalendarDateOnly[],
	columnCount: number,
	leadingEmptyCells: number
): readonly EventCalendarMonthRow[] {
	const cells: Array<EventCalendarDateOnly | null> = [
		...Array.from<null>({ length: leadingEmptyCells }).fill(null),
		...days
	];
	while (cells.length % columnCount !== 0) cells.push(null);

	const rows: EventCalendarMonthRow[] = [];
	for (let index = 0; index < cells.length; index += columnCount) {
		const cellsInRow = cells.slice(index, index + columnCount);
		const firstDayIndex = cellsInRow.findIndex((day) => day !== null);
		const lastDayIndex = cellsInRow.findLastIndex((day) => day !== null);
		rows.push({
			days: cellsInRow.filter((day): day is EventCalendarDateOnly => day !== null),
			leadingEmptyCells: firstDayIndex < 0 ? columnCount : firstDayIndex,
			trailingEmptyCells: lastDayIndex < 0 ? 0 : columnCount - lastDayIndex - 1
		});
	}
	return rows;
}

function orderWeekdayHeaderDays(
	days: readonly EventCalendarDateOnly[],
	weekStartsOn: EventCalendarWeekday,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): readonly EventCalendarDateOnly[] {
	const daysByWeekday = new Map(days.map((day) => [getCivilWeekday(day), day]));
	const weekStartIndex = WEEKDAYS.indexOf(weekStartsOn);
	return Array.from(
		{ length: 7 },
		(_, offset) => WEEKDAYS[(weekStartIndex + offset) % WEEKDAYS.length]
	)
		.filter((weekday) => !hiddenWeekdays.has(weekday))
		.map((weekday) => daysByWeekday.get(weekday))
		.filter((day): day is EventCalendarDateOnly => day !== undefined);
}

function isDayOutsideActiveRange(
	day: EventCalendarDateOnly,
	profile: EventCalendarDateProfile,
	timeZone: string
): boolean {
	const dayRange = {
		start: startOfZonedDay(day, timeZone),
		end: startOfZonedDay(addCivilDays(day, 1), timeZone)
	};
	return !rangesIntersect(dayRange, profile.activeRange);
}
