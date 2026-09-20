import { parseCivilDate } from '$lib/scheduling/civilDate.js';
import { assertIanaTimeZone } from '$lib/scheduling/zonedTime.js';
import { GanttChartError } from './ganttChart.error.js';
import {
	assertGanttIdentifier,
	assertGanttRecord,
	parseGanttClock
} from './ganttChart.validationBoundary.js';
import type { GanttCalendar, GanttWorkingInterval } from './ganttChart.types.js';

const DEFAULT_CALENDAR_ID = '__entasis_gantt_default_project_calendar__';

export function validateGanttCalendars(
	calendars: readonly GanttCalendar[]
): ReadonlyMap<string, GanttCalendar> {
	const calendarsById = new Map<string, GanttCalendar>();
	for (const calendar of calendars) {
		assertGanttRecord(calendar, 'Every calendar must be an object.', 'invalid-calendar');
		assertGanttIdentifier(calendar.id, 'calendar');
		if (calendarsById.has(calendar.id)) {
			throw new GanttChartError('duplicate-calendar-id', `Duplicate calendar id: ${calendar.id}.`, {
				id: calendar.id
			});
		}
		if (typeof calendar.title !== 'string') {
			throw new GanttChartError('invalid-calendar', `Calendar ${calendar.id} needs a title.`, {
				id: calendar.id
			});
		}
		try {
			assertIanaTimeZone(calendar.timeZone);
		} catch {
			throw new GanttChartError(
				'invalid-calendar',
				`Calendar ${calendar.id} has invalid timeZone.`,
				{ id: calendar.id, timeZone: calendar.timeZone }
			);
		}
		validateWorkingWeekdays(calendar);
		validateGanttWorkingIntervals(calendar.id, calendar.workingIntervals);
		validateExceptions(calendar);
		calendarsById.set(calendar.id, calendar);
	}
	return calendarsById;
}

export function resolveGanttProjectCalendar(
	calendars: readonly GanttCalendar[],
	calendarsById: ReadonlyMap<string, GanttCalendar>,
	projectCalendarId: string | undefined,
	timeZone: string
): GanttCalendar {
	if (projectCalendarId !== undefined) {
		const projectCalendar = calendarsById.get(projectCalendarId);
		if (projectCalendar) return projectCalendar;
		throw new GanttChartError(
			'invalid-project-calendar',
			`projectCalendarId references missing calendar ${projectCalendarId}.`,
			{ projectCalendarId }
		);
	}
	if (calendars.length === 1) return calendars[0];
	return {
		id: DEFAULT_CALENDAR_ID,
		title: 'Default project calendar',
		timeZone,
		workingWeekdays: [0, 1, 2, 3, 4, 5, 6],
		workingIntervals: [{ start: '00:00', end: '24:00' }]
	};
}

function validateWorkingWeekdays(calendar: GanttCalendar): void {
	if (
		Array.isArray(calendar.workingWeekdays) &&
		calendar.workingWeekdays.length > 0 &&
		new Set(calendar.workingWeekdays).size === calendar.workingWeekdays.length &&
		calendar.workingWeekdays.every(
			(weekday) => Number.isInteger(weekday) && weekday >= 0 && weekday <= 6
		)
	) {
		return;
	}
	throw new GanttChartError(
		'invalid-calendar',
		`Calendar ${calendar.id} needs unique working weekdays.`,
		{ id: calendar.id }
	);
}

function validateExceptions(calendar: GanttCalendar): void {
	if (calendar.exceptions !== undefined && !Array.isArray(calendar.exceptions)) {
		throw new GanttChartError(
			'invalid-calendar',
			`Calendar ${calendar.id} exceptions must be an array.`,
			{ id: calendar.id }
		);
	}
	const exceptionDates = new Set<string>();
	for (const exception of calendar.exceptions ?? []) {
		if (!exception || typeof exception !== 'object') {
			throw new GanttChartError(
				'invalid-calendar',
				`Calendar ${calendar.id} exceptions must be objects.`,
				{ id: calendar.id }
			);
		}
		try {
			parseCivilDate(exception.date);
		} catch {
			throw new GanttChartError(
				'invalid-calendar',
				`Calendar ${calendar.id} has invalid exception date.`,
				{ id: calendar.id, date: exception.date }
			);
		}
		if (exceptionDates.has(exception.date)) {
			throw new GanttChartError(
				'invalid-calendar',
				`Calendar ${calendar.id} has duplicate exception date ${exception.date}.`,
				{ id: calendar.id, date: exception.date }
			);
		}
		exceptionDates.add(exception.date);
		if (exception.type === 'working') {
			validateGanttWorkingIntervals(calendar.id, exception.intervals);
		} else if (exception.type !== 'non-working') {
			throw new GanttChartError(
				'invalid-calendar',
				`Calendar ${calendar.id} has invalid exception type.`,
				{ id: calendar.id, exception }
			);
		}
	}
}

function validateGanttWorkingIntervals(
	calendarId: string,
	intervals: readonly GanttWorkingInterval[]
): void {
	if (!Array.isArray(intervals) || intervals.length === 0) {
		throw new GanttChartError(
			'invalid-calendar',
			`Calendar ${calendarId} needs at least one working interval.`,
			{ id: calendarId }
		);
	}
	let previousEnd = -1;
	for (const interval of intervals) {
		const start = parseGanttClock(interval?.start, false);
		const end = parseGanttClock(interval?.end, true);
		if (Number.isFinite(start) && Number.isFinite(end) && start < end && start >= previousEnd) {
			previousEnd = end;
			continue;
		}
		throw new GanttChartError(
			'invalid-calendar',
			`Calendar ${calendarId} intervals must be ordered, non-overlapping half-open ranges.`,
			{ id: calendarId }
		);
	}
}
