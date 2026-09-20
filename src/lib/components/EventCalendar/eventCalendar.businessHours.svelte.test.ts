import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import { createEventCalendarTimeGridDayGeometry } from './eventCalendar.timeGrid.js';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState,
	type EventCalendarStateOptions
} from './eventCalendar.state.svelte.js';
import { createEventCalendarResourceModel } from './eventCalendar.resources.js';
import type { EventCalendarAvailabilityOptions } from './eventCalendar.props.js';
import type {
	EventCalendarItem,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarView
} from './eventCalendar.types.js';

const ANCHOR = new Date('2026-07-15T10:00:00.000Z');
const teardowns: Array<() => void> = [];

afterEach(() => {
	while (teardowns.length > 0) teardowns.pop()?.();
});

function createCalendar(
	availabilityOptions: EventCalendarAvailabilityOptions,
	resources: EventCalendarResource[] = []
): EventCalendarState {
	let items = $state<EventCalendarItem[]>([]);
	let view = $state<EventCalendarView>('day');
	let date = $state(ANCHOR);
	let dayCount = $state(1);
	let selection = $state<EventCalendarSelection>(EMPTY_EVENT_CALENDAR_SELECTION);
	let calendar!: EventCalendarState;
	const stop = $effect.root(() => {
		calendar = new EventCalendarState('business-hours-test', {
			get items() {
				return items;
			},
			set items(value) {
				items = value;
			},
			get view() {
				return view;
			},
			set view(value) {
				view = value;
			},
			views: ['day'],
			get date() {
				return date;
			},
			set date(value) {
				date = value;
			},
			get dayCount() {
				return dayCount;
			},
			set dayCount(value) {
				dayCount = value;
			},
			get selection() {
				return selection;
			},
			set selection(value) {
				selection = value;
			},
			resources,
			timeZone: 'UTC',
			messages: en,
			density: 'normal',
			classes: eventCalendarTheme,
			showWeekends: true,
			weekendDays: [0, 6],
			agendaDayCount: 30,
			get availabilityOptions() {
				return availabilityOptions;
			},
			disabled: false,
			loading: false,
			direction: 'ltr',
			allowOverlap: true,
			historyLimit: 10,
			renderers: {},
			eventHandlers: {},
			scrollMode: 'contained',
			stickyHeader: true,
			showDatePicker: true
		} satisfies EventCalendarStateOptions<Record<never, never>, Record<never, never>>);
	});
	teardowns.push(() => {
		calendar.unmount();
		stop();
	});
	flushSync();
	return calendar;
}

describe('EventCalendar admitted business windows', () => {
	test('uses one minute representation for shading and mutation policy, including 24:00 global end', () => {
		const calendar = createCalendar({
			businessHours: [{ daysOfWeek: [3], start: '09:00', end: '24:00' }],
			constrainMutations: true
		});
		expect(calendar.businessHours).toEqual([
			{ daysOfWeek: [3], startMinutes: 540, endMinutes: 1440 }
		]);

		const geometry = createEventCalendarTimeGridDayGeometry({
			view: 'day',
			day: '2026-07-15',
			column: 0,
			timeZone: 'UTC',
			dayStartMinutes: 0,
			dayEndMinutes: 1440,
			interval: 60,
			slotDuration: 30,
			snapDuration: 15,
			businessHours: calendar.businessHours
		});
		expect(geometry.businessWindows).toHaveLength(1);
		expect(geometry.businessWindows[0]?.start.toISOString()).toBe('2026-07-15T09:00:00.000Z');
		expect(geometry.businessWindows[0]?.end.toISOString()).toBe('2026-07-16T00:00:00.000Z');
		expect(
			calendar.mutations.validateSlot({
				view: 'day',
				allDay: false,
				start: new Date('2026-07-15T23:30:00.000Z'),
				end: new Date('2026-07-16T00:00:00.000Z')
			})
		).toBeNull();
		expect(
			calendar.mutations.validateSlot({
				view: 'day',
				allDay: false,
				start: new Date('2026-07-15T08:30:00.000Z'),
				end: new Date('2026-07-15T09:00:00.000Z')
			})
		).toBe('business-hours');
	});

	test('admits resource minutes, rejects resource 24:00, and preserves global fallback', () => {
		const resourceModel = createEventCalendarResourceModel<Record<never, never>>([
			{
				id: 'room',
				title: 'Room',
				businessHours: [
					{ daysOfWeek: [3], start: '09:00', end: '17:00' },
					{ daysOfWeek: [3], start: '09:00', end: '17:00' }
				]
			}
		]);
		expect(resourceModel.getBusinessHours('room')).toEqual([
			{ daysOfWeek: [3], startMinutes: 540, endMinutes: 1020 },
			{ daysOfWeek: [3], startMinutes: 540, endMinutes: 1020 }
		]);
		expect(() =>
			createEventCalendarResourceModel<Record<never, never>>([
				{ id: 'room', title: 'Room', businessHours: [{ start: '09:00', end: '24:00' }] }
			])
		).toThrowError('Resource room has invalid businessHours.');

		const calendar = createCalendar(
			{
				businessHours: [{ daysOfWeek: [3], start: '09:00', end: '17:00' }],
				constrainMutations: true
			},
			[{ id: 'room', title: 'Room' }]
		);
		expect(calendar.resourceModel.getBusinessHours('room')).toBeNull();
		expect(
			calendar.mutations.validateSlot({
				view: 'resource',
				resourceId: 'room',
				allDay: false,
				start: new Date('2026-07-15T10:00:00.000Z'),
				end: new Date('2026-07-15T10:30:00.000Z')
			})
		).toBeNull();
	});
});
