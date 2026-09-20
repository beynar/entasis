import { describe, expect, test } from 'vitest';
import {
	canonicalEventCalendarRecurrenceOrigin,
	expandEventCalendarRecurrence,
	hasEventCalendarRecurrenceDateSelectors
} from './eventCalendar.recurrence.js';
import { createEventCalendarRecurrenceMutation } from './eventCalendar.recurrenceMutation.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	createRecurringOccurrenceKey,
	decodeRecurringOccurrenceKey
} from './eventCalendar.items.js';
import type { EventCalendarItem, EventCalendarRecurrenceRule } from './eventCalendar.types.js';

describe('EventCalendar recurrence meaning', () => {
	test('shares one collision-safe origin identity across public adapters', () => {
		const instant = new Date('2026-07-15T09:00:00.000Z');
		const day = '2026-07-15' as const;

		expect(canonicalEventCalendarRecurrenceOrigin(instant)).toBe(`instant:${instant.getTime()}`);
		expect(canonicalEventCalendarRecurrenceOrigin(day)).toBe('day:2026-07-15');
		expect(canonicalEventCalendarRecurrenceOrigin(instant)).not.toBe(
			canonicalEventCalendarRecurrenceOrigin(day)
		);
		expect(createRecurringOccurrenceKey('series', instant)).toBe(
			`9:recurring6:series21:instant:${instant.getTime()}`
		);
		expect(createRecurringOccurrenceKey('series', day)).toBe(
			'9:recurring6:series14:day:2026-07-15'
		);
		expect(decodeRecurringOccurrenceKey(createRecurringOccurrenceKey('series', instant))).toEqual({
			seriesId: 'series',
			originalStart: instant
		});
		expect(decodeRecurringOccurrenceKey(createRecurringOccurrenceKey('series', day))).toEqual({
			seriesId: 'series',
			originalStart: day
		});
	});

	test('shares date-selector presence semantics with series mutation guards', () => {
		const rule: EventCalendarRecurrenceRule = { freq: 'daily' };
		expect(hasEventCalendarRecurrenceDateSelectors(rule)).toBe(false);
		expect(hasEventCalendarRecurrenceDateSelectors({ ...rule, byWeekday: ['MO'] })).toBe(true);
		expect(hasEventCalendarRecurrenceDateSelectors({ ...rule, byMonthDay: [15] })).toBe(true);
		expect(hasEventCalendarRecurrenceDateSelectors({ ...rule, byMonth: [7] })).toBe(true);
	});

	test('uses the shared origin identity for exclusions and additions', () => {
		const series: EventCalendarItem = {
			id: 'series',
			title: 'series',
			start: new Date('2026-07-15T09:00:00.000Z'),
			end: new Date('2026-07-15T10:00:00.000Z'),
			recurrence: {
				freq: 'daily',
				exDates: [new Date('2026-07-16T09:00:00.000Z')],
				rDates: [new Date('2026-07-17T09:00:00.000Z')]
			},
			recurrenceTimeZone: 'UTC'
		};
		const expanded = expandEventCalendarRecurrence({
			item: series,
			range: {
				start: new Date('2026-07-15T00:00:00.000Z'),
				end: new Date('2026-07-18T00:00:00.000Z')
			},
			displayTimeZone: 'UTC'
		});
		expect(expanded.map((occurrence) => occurrence.originalStart)).toEqual([
			new Date('2026-07-15T09:00:00.000Z'),
			new Date('2026-07-17T09:00:00.000Z')
		]);
	});

	test('preserves the legacy duplicate-origin diagnostic encoding', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const item: EventCalendarItem = {
			id: 'series',
			title: 'series',
			start: origin,
			end: new Date('2026-07-15T10:00:00.000Z'),
			recurrence: 'RRULE:FREQ=DAILY',
			recurrenceTimeZone: 'UTC'
		};
		const occurrence = {
			allDay: false as const,
			start: origin,
			end: new Date('2026-07-15T10:00:00.000Z'),
			originalStart: origin
		};

		expect(() =>
			expandEventCalendarRecurrence({
				item,
				range: {
					start: new Date('2026-07-15T00:00:00.000Z'),
					end: new Date('2026-07-16T00:00:00.000Z')
				},
				displayTimeZone: 'UTC',
				expandRecurrence: () => [occurrence, { ...occurrence }]
			})
		).toThrowError(`The recurrence expander returned duplicate origin i${origin.getTime()}.`);
	});

	test('preserves the legacy conversion-collision diagnostic target encoding', () => {
		const firstOrigin = new Date('2026-07-15T09:00:00.000Z');
		const secondOrigin = new Date('2026-07-15T15:00:00.000Z');
		const series: EventCalendarItem = {
			id: 'series',
			title: 'series',
			start: new Date('2026-07-15T08:00:00.000Z'),
			end: new Date('2026-07-15T09:00:00.000Z'),
			recurrence: { freq: 'daily', rDates: [firstOrigin, secondOrigin] },
			recurrenceTimeZone: 'UTC'
		};
		const occurrence = {
			key: createRecurringOccurrenceKey(series.id, series.start),
			item: series,
			start: series.start,
			end: series.end,
			allDay: false,
			isRecurring: true,
			originalStart: series.start
		};

		let thrown: unknown;
		try {
			createEventCalendarRecurrenceMutation({
				items: [series],
				proposal: {
					kind: 'update',
					source: 'api',
					occurrence,
					previousItem: series,
					item: {
						id: series.id,
						title: series.title,
						allDay: true,
						start: '2026-07-15',
						end: '2026-07-16'
					}
				},
				scope: 'series',
				displayTimeZone: 'UTC',
				maintainDurationOnAllDayChange: true,
				defaultTimedItemDuration: 60,
				defaultAllDayItemDuration: 1
			});
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(EventCalendarError);
		const error = thrown as EventCalendarError;
		expect(error.code).toBe('invalid-recurrence');
		expect(error.message).toBe(
			'A series conversion cannot collapse distinct canonical recurrence origins.'
		);
		expect(error.details?.target).toBe('day-2026-07-15');
	});

	test('keeps all-day and timed expanded validation wording', () => {
		const allDayItem: EventCalendarItem = {
			id: 'all-day-series',
			title: 'all-day-series',
			allDay: true,
			start: '2026-07-15',
			end: '2026-07-16',
			recurrence: 'RRULE:FREQ=DAILY'
		};
		const range = {
			start: new Date('2026-07-15T00:00:00.000Z'),
			end: new Date('2026-07-16T00:00:00.000Z')
		};
		expect(() =>
			expandEventCalendarRecurrence({
				item: allDayItem,
				range,
				displayTimeZone: 'UTC',
				expandRecurrence: () => [
					{ allDay: true, start: '2026-07-15', end: '2026-07-15', originalStart: '2026-07-15' }
				]
			})
		).toThrowError(
			'Expanded all-day occurrence 0 for all-day-series has an invalid range or origin.'
		);

		const timedItem: EventCalendarItem = {
			id: 'timed-series',
			title: 'timed-series',
			start: new Date('2026-07-15T09:00:00.000Z'),
			end: new Date('2026-07-15T10:00:00.000Z'),
			recurrence: 'RRULE:FREQ=DAILY',
			recurrenceTimeZone: 'UTC'
		};
		expect(() =>
			expandEventCalendarRecurrence({
				item: timedItem,
				range,
				displayTimeZone: 'UTC',
				expandRecurrence: () => [
					{
						allDay: false,
						start: new Date('2026-07-15T09:00:00.000Z'),
						end: new Date('2026-07-15T08:00:00.000Z'),
						originalStart: new Date('2026-07-15T09:00:00.000Z')
					}
				]
			})
		).toThrowError('Expanded timed occurrence 0 for timed-series has an invalid range or origin.');
	});

	test('keeps weekly COUNT rank arithmetic aligned with weekday expansion', () => {
		const expanded = expandEventCalendarRecurrence<Record<never, never>>({
			item: {
				id: 'weekly-series',
				title: 'weekly-series',
				start: new Date('2026-01-01T09:00:00.000Z'),
				end: new Date('2026-01-01T10:00:00.000Z'),
				recurrence: { freq: 'weekly', byWeekday: ['MO', 'WE', 'FR'], count: 20 },
				recurrenceTimeZone: 'UTC'
			},
			range: {
				start: new Date('2026-01-20T00:00:00.000Z'),
				end: new Date('2026-02-10T00:00:00.000Z')
			},
			displayTimeZone: 'UTC'
		});

		expect(expanded).toHaveLength(9);
		expect(expanded[0]?.originalStart).toEqual(new Date('2026-01-21T09:00:00.000Z'));
		expect(expanded.at(-1)?.originalStart).toEqual(new Date('2026-02-09T09:00:00.000Z'));
	});
});
