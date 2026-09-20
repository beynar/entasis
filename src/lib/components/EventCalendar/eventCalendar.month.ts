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
	startOfZonedDay,
	type EventCalendarDateProfile,
	type EventCalendarDateProfileOptions
} from './eventCalendar.date.js';
import type { EventCalendarAllDayInsertion } from './eventCalendar.interactions.svelte.js';
import type { EventCalendarItemIndex } from './eventCalendar.items.js';
import type { EventCalendarLaneLayout } from './eventCalendar.layout.js';
import type { EventCalendarDateOnly, EventCalendarWeekday } from './eventCalendar.types.js';

const WEEKDAYS: readonly EventCalendarWeekday[] = [0, 1, 2, 3, 4, 5, 6];

type EventCalendarMonthRow = {
	days: readonly EventCalendarDateOnly[];
	leadingEmptyCells: number;
	trailingEmptyCells: number;
};

export type EventCalendarMonthSurface = Readonly<{
	renderDays: readonly EventCalendarDateOnly[];
	columnCount: number;
	weekdayHeaderDays: readonly EventCalendarDateOnly[];
	weeks: readonly EventCalendarMonthRow[];
	visibleDaySet: ReadonlySet<EventCalendarDateOnly>;
	currentStartDay: EventCalendarDateOnly;
	currentEndDay: EventCalendarDateOnly;
	enabledDays: ReadonlySet<EventCalendarDateOnly>;
}>;

export type EventCalendarMonthSurfaceOptions = Pick<
	EventCalendarDateProfileOptions,
	'timeZone' | 'showWeekends' | 'weekendDays' | 'weekStartsOn'
> & { disabled: boolean };

export function createEventCalendarMonthSurface(
	profile: EventCalendarDateProfile,
	options: EventCalendarMonthSurfaceOptions
): EventCalendarMonthSurface {
	const hiddenWeekdays = getHiddenWeekdays(options);
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
	const firstDayColumn =
		renderDays.length === 0
			? 0
			: weekdayHeaderDays.findIndex(
					(day) => getCivilWeekday(day) === getCivilWeekday(renderDays[0])
				);
	const weekRows = buildMonthRows(renderDays, columnCount, firstDayColumn);
	const visibleDaySet = new Set(profile.visibleDays);
	const currentStartDay = getZonedDay(profile.currentRange.start, options.timeZone);
	const currentEndDay = getZonedDay(profile.currentRange.end, options.timeZone);
	const enabledDays = new Set<EventCalendarDateOnly>(
		options.disabled
			? []
			: renderDays.filter(
					(day) => visibleDaySet.has(day) && isDayInActiveRange(day, profile, options.timeZone)
				)
	);
	return {
		renderDays,
		columnCount,
		weekdayHeaderDays,
		weeks: weekRows,
		visibleDaySet,
		currentStartDay,
		currentEndDay,
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

export type EventCalendarMonthWeekLayout<TItemFields extends object> = EventCalendarMonthRow & {
	layout: EventCalendarLaneLayout<TItemFields>;
	visibleLaneCount: number;
	insertion: EventCalendarAllDayRowInsertion | null;
};

export function createEventCalendarMonthWeekLayout<TItemFields extends object>(
	week: EventCalendarMonthRow,
	itemIndex: EventCalendarItemIndex<TItemFields>,
	insertion: EventCalendarAllDayInsertion | null,
	maxItemsPerCell: number | 'auto',
	autoLaneSlots: number
): EventCalendarMonthWeekLayout<TItemFields> {
	const preview = createEventCalendarAllDayPreviewLayout(
		week.days.flatMap((day) => itemIndex.segmentsByDay.get(day)?.foreground ?? []),
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
						({ startIndex, endIndex }) =>
							startIndex < previewInsertion.endIndex && previewInsertion.startIndex < endIndex
					)
					.map(({ lane }) => lane)
			) + 1
		: 0;
	const visibleLaneCount = Math.max(
		baseVisibleLaneCount,
		Math.min(baseVisibleLaneCount + 1, insertionLaneRequirement)
	);
	return {
		...week,
		layout: preview.layout,
		visibleLaneCount,
		insertion: preview.insertion
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

	return Array.from({ length: cells.length / columnCount }, (_, rowIndex) => {
		const cellsInRow = cells.slice(rowIndex * columnCount, (rowIndex + 1) * columnCount);
		const firstDayIndex = cellsInRow.findIndex((day) => day !== null);
		const lastDayIndex = cellsInRow.findLastIndex((day) => day !== null);
		return {
			days: cellsInRow.filter((day): day is EventCalendarDateOnly => day !== null),
			leadingEmptyCells: firstDayIndex < 0 ? columnCount : firstDayIndex,
			trailingEmptyCells: lastDayIndex < 0 ? 0 : columnCount - lastDayIndex - 1
		};
	});
}

function orderWeekdayHeaderDays(
	days: readonly EventCalendarDateOnly[],
	weekStartsOn: EventCalendarWeekday,
	hiddenWeekdays: ReadonlySet<EventCalendarWeekday>
): readonly EventCalendarDateOnly[] {
	const daysByWeekday = new Map(days.map((day) => [getCivilWeekday(day), day]));
	const weekStartIndex = WEEKDAYS.indexOf(weekStartsOn);
	return WEEKDAYS.slice(weekStartIndex)
		.concat(WEEKDAYS.slice(0, weekStartIndex))
		.filter((weekday) => !hiddenWeekdays.has(weekday))
		.map((weekday) => daysByWeekday.get(weekday))
		.filter((day): day is EventCalendarDateOnly => day !== undefined);
}

function isDayInActiveRange(
	day: EventCalendarDateOnly,
	profile: EventCalendarDateProfile,
	timeZone: string
): boolean {
	return (
		startOfZonedDay(day, timeZone) < profile.activeRange.end &&
		startOfZonedDay(addCivilDays(day, 1), timeZone) > profile.activeRange.start
	);
}
