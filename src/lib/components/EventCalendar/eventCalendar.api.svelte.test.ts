// Characterisation of the EventCalendar public imperative API on EventCalendarState: query
// cloning, occurrence lookup, navigation errors, the setView assignment/notification order, and
// the method-specific disabled matrix. The state class is instantiated directly with the
// getter/setter bindings EventCalendar.svelte hands it; no DOM component is mounted.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	admitEventCalendarItems,
	createEventCalendarItemIndex,
	createRecurringOccurrenceKey
} from './eventCalendar.items.js';
import type {
	EventCalendarMonthOptions,
	EventCalendarTimeGridOptions,
	EventCalendarAvailabilityOptions
} from './eventCalendar.props.js';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import type {
	EventCalendarDateOnly,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarRange,
	EventCalendarRangeChangeInfo,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarView,
	EventCalendarWeekday
} from './eventCalendar.types.js';

const ANCHOR = new Date('2026-07-15T10:00:00.000Z'); // a Wednesday
const ALL_VIEWS: EventCalendarView[] = ['month', 'week', 'day', 'days', 'agenda', 'resource'];

const timedItem = (id: string, start: string, end: string): EventCalendarItem => ({
	id,
	title: id,
	start: new Date(start),
	end: new Date(end)
});

const dailySeries = (id: string, start: string, end: string): EventCalendarItem => ({
	id,
	title: id,
	start: new Date(start),
	end: new Date(end),
	recurrence: { freq: 'daily' },
	recurrenceTimeZone: 'UTC'
});

type SetupOptions = {
	items?: EventCalendarItem[];
	view?: EventCalendarView;
	views?: EventCalendarView[];
	date?: Date;
	dayCount?: number;
	agendaDayCount?: number;
	selection?: EventCalendarSelection;
	resources?: EventCalendarResource[];
	timeZone?: string;
	showWeekends?: boolean;
	weekendDays?: EventCalendarWeekday[];
	monthOptions?: EventCalendarMonthOptions;
	validRange?: EventCalendarRange;
	timeGridOptions?: EventCalendarTimeGridOptions;
	availabilityOptions?: EventCalendarAvailabilityOptions;
	disabled?: boolean;
	loading?: boolean;
	localeOption?: string;
	weekStartsOnOption?: EventCalendarWeekday;
};

type Harness = {
	calendar: EventCalendarState;
	/** Ordered union of bound-property writes (`set:*`) and callback invocations (`cb:*`). */
	trace: string[];
	rangeChanges: EventCalendarRangeChangeInfo[];
	viewChanges: EventCalendarView[];
	dateChanges: Date[];
	dayCountChanges: number[];
	selectionChanges: EventCalendarSelection[];
	blocked: EventCalendarInteractionBlockedInfo[];
	replaceItems: (next: EventCalendarItem[]) => void;
	setDisabled: (value: boolean) => void;
	setLoading: (value: boolean) => void;
};

const teardowns: Array<() => void> = [];
afterEach(() => {
	while (teardowns.length > 0) teardowns.pop()?.();
});

const setup = (options: SetupOptions = {}): Harness => {
	let items = $state<EventCalendarItem[]>(options.items ?? []);
	let view = $state<EventCalendarView>(options.view ?? 'month');
	const views = $state<EventCalendarView[]>(options.views ?? ALL_VIEWS);
	let date = $state(options.date ?? ANCHOR);
	let dayCount = $state(options.dayCount ?? 3);
	const agendaDayCount = $state(options.agendaDayCount ?? 30);
	let selection = $state<EventCalendarSelection>(
		options.selection ?? EMPTY_EVENT_CALENDAR_SELECTION
	);
	const resources = $state<EventCalendarResource[]>(options.resources ?? []);
	const timeZone = $state(options.timeZone ?? 'UTC');
	let disabled = $state(options.disabled ?? false);
	let loading = $state(options.loading ?? false);
	const harness: Harness = {
		calendar: undefined as unknown as EventCalendarState,
		trace: [],
		rangeChanges: [],
		viewChanges: [],
		dateChanges: [],
		dayCountChanges: [],
		selectionChanges: [],
		blocked: [],
		replaceItems: (next) => {
			items = next;
			flushSync();
		},
		setDisabled: (value) => {
			disabled = value;
			flushSync();
		},
		setLoading: (value) => {
			loading = value;
			flushSync();
		}
	};
	const stop = $effect.root(() => {
		harness.calendar = new EventCalendarState<Record<never, never>, Record<never, never>>(
			'api-test',
			{
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
					harness.trace.push('set:view');
					view = value;
				},
				get views() {
					return views;
				},
				get date() {
					return date;
				},
				set date(value) {
					harness.trace.push('set:date');
					date = value;
				},
				get dayCount() {
					return dayCount;
				},
				set dayCount(value) {
					harness.trace.push('set:dayCount');
					dayCount = value;
				},
				get selection() {
					return selection;
				},
				set selection(value) {
					harness.trace.push('set:selection');
					selection = value;
				},
				get resources() {
					return resources;
				},
				get timeZone() {
					return timeZone;
				},
				messages: en,
				density: 'normal',
				classes: eventCalendarTheme,
				get localeOption() {
					return options.localeOption;
				},
				get weekStartsOnOption() {
					return options.weekStartsOnOption;
				},
				get monthOptions() {
					return options.monthOptions;
				},
				get showWeekends() {
					return options.showWeekends ?? true;
				},
				get weekendDays() {
					return options.weekendDays ?? [0, 6];
				},
				get agendaDayCount() {
					return agendaDayCount;
				},
				get validRange() {
					return options.validRange;
				},
				get timeGridOptions() {
					return options.timeGridOptions;
				},
				get availabilityOptions() {
					return options.availabilityOptions;
				},
				get disabled() {
					return disabled;
				},
				get loading() {
					return loading;
				},
				direction: 'ltr',
				allowOverlap: true,
				historyLimit: 50,
				renderers: {},
				eventHandlers: {
					onRangeChange: (payload) => {
						harness.trace.push('cb:range');
						harness.rangeChanges.push(payload);
					},
					onViewChange: (value) => {
						harness.trace.push('cb:view');
						harness.viewChanges.push(value);
					},
					onDateChange: (value) => {
						harness.trace.push('cb:date');
						harness.dateChanges.push(value);
					},
					onDayCountChange: (value) => {
						harness.trace.push('cb:dayCount');
						harness.dayCountChanges.push(value);
					},
					onSelectionChange: (value) => {
						harness.trace.push('cb:selection');
						harness.selectionChanges.push(value);
					},
					onInteractionBlocked: (info) => {
						harness.trace.push('cb:blocked');
						harness.blocked.push(info);
					}
				},
				scrollMode: 'contained',
				stickyHeader: false,
				showDatePicker: false
			}
		);
	});
	teardowns.push(stop);
	flushSync();
	return harness;
};

const iso = (date: Date) => date.toISOString();

describe('EventCalendar admission and validation boundaries', () => {
	test('rejects every non-array items collection with the baseline error', () => {
		for (const items of [null, new Set(), new Map(), {}] as unknown[]) {
			let thrown: unknown;
			try {
				admitEventCalendarItems(items as EventCalendarItem[], { hasCustomExpander: false });
			} catch (error) {
				thrown = error;
			}

			expect(thrown).toBeInstanceOf(EventCalendarError);
			expect(thrown).toMatchObject({ code: 'invalid-item', message: 'items must be an array.' });
		}
	});

	test('reports an invalid date profile before invalid resources', () => {
		try {
			setup({
				date: new Date('9999-12-31T00:00:00.000Z'),
				resources: [{ id: 'missing-title' } as EventCalendarResource]
			});
			expect.unreachable('expected the invalid date profile to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(EventCalendarError);
			expect((error as EventCalendarError).code).toBe('invalid-prop');
			expect((error as EventCalendarError).message).toContain(
				'The month date profile exceeds the supported civil-date domain.'
			);
		}
	});
});

describe('EventCalendar API queries', () => {
	test('range and day queries return clones that cannot corrupt internal state', () => {
		const h = setup({ view: 'week' });
		const visibleRange = h.calendar.getVisibleRange();
		const activeRange = h.calendar.getActiveRange();
		const visibleDays = h.calendar.getVisibleDays();

		expect(iso(visibleRange.start)).toBe('2026-07-12T00:00:00.000Z');
		expect(iso(visibleRange.end)).toBe('2026-07-19T00:00:00.000Z');
		expect(iso(activeRange.start)).toBe('2026-07-12T00:00:00.000Z');
		expect(iso(activeRange.end)).toBe('2026-07-19T00:00:00.000Z');
		expect(visibleDays).toEqual([
			'2026-07-12',
			'2026-07-13',
			'2026-07-14',
			'2026-07-15',
			'2026-07-16',
			'2026-07-17',
			'2026-07-18'
		]);

		// Mutating the returned boundary must not leak into the profile.
		visibleRange.start.setTime(0);
		visibleRange.end.setTime(0);
		activeRange.start.setTime(0);
		(visibleDays as string[]).push('bogus');

		const again = h.calendar.getVisibleRange();
		expect(iso(again.start)).toBe('2026-07-12T00:00:00.000Z');
		expect(iso(again.end)).toBe('2026-07-19T00:00:00.000Z');
		expect(again.start).not.toBe(visibleRange.start);
		expect(h.calendar.getActiveRange().start).not.toBe(visibleRange.start);
		expect(h.calendar.getVisibleDays()).toHaveLength(7);
		expect(h.calendar.dateProfile.renderRange.start.getTime()).not.toBe(0);
	});

	test('the range payload exposes fetchRange as a separately cloned active range', () => {
		const h = setup({
			view: 'week',
			validRange: {
				start: new Date('2026-07-13T00:00:00.000Z'),
				end: new Date('2026-07-17T00:00:00.000Z')
			}
		});
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();

		expect(h.rangeChanges).toHaveLength(1);
		const info = h.rangeChanges[0];
		// fetchRange carries the validRange-clipped active values but is its own object graph.
		expect(iso(info.activeRange.start)).toBe('2026-07-13T00:00:00.000Z');
		expect(iso(info.activeRange.end)).toBe('2026-07-17T00:00:00.000Z');
		expect(iso(info.fetchRange.start)).toBe('2026-07-13T00:00:00.000Z');
		expect(iso(info.fetchRange.end)).toBe('2026-07-17T00:00:00.000Z');
		expect(info.fetchRange).not.toBe(info.activeRange);
		expect(info.fetchRange.start).not.toBe(info.activeRange.start);
		info.fetchRange.start.setTime(0);
		expect(info.activeRange.start.getTime()).not.toBe(0);
		expect(iso(h.calendar.getActiveRange().start)).toBe('2026-07-13T00:00:00.000Z');
	});

	test('getOccurrence resolves singleton ids and recurring keys and misses cleanly', () => {
		const h = setup({
			view: 'week',
			items: [
				timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z'),
				dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')
			]
		});
		const singleton = h.calendar.getOccurrence('standup');
		expect(singleton?.key).toBe('standup');
		expect(singleton?.isRecurring).toBe(false);

		const occurrences = h.calendar.getOccurrences();
		const recurring = occurrences.find((occurrence) => occurrence.item.id === 'series');
		expect(recurring).toBeDefined();
		expect(recurring?.isRecurring).toBe(true);
		expect(recurring?.key).not.toBe('series');

		// The series source id itself is not an occurrence key.
		expect(h.calendar.getOccurrence('series')).toBeNull();
		expect(h.calendar.getOccurrence(recurring!.key)).toBe(recurring);
		expect(h.calendar.getOccurrence('missing')).toBeNull();
		expect(h.calendar.getOccurrence('')).toBeNull();
	});

	test('occurrences keep the consumer item object reference', () => {
		const source = timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z');
		const h = setup({ view: 'week', items: [source] });
		// The occurrence stores the exact item object the calendar received — reads through the
		// bound $state array return the same proxy, so compare against that read, not `source`.
		expect(h.calendar.getOccurrence('standup')?.item).toBe(h.calendar.items[0]);
	});

	test('keeps a zero-length timed occurrence and segment in the active projection', () => {
		const h = setup({
			view: 'day',
			items: [timedItem('instant', '2026-07-15T09:00:00.000Z', '2026-07-15T09:00:00.000Z')]
		});
		const occurrence = h.calendar.getOccurrence('instant');
		expect(occurrence?.start.getTime()).toBe(occurrence?.end.getTime());
		const segment = h.calendar.itemIndex.segmentsByDay.get('2026-07-15')?.timed[0];
		expect(segment?.start.getTime()).toBe(segment?.end.getTime());
		expect(segment?.isStart).toBe(true);
		expect(segment?.isEnd).toBe(true);
	});

	test('keeps duplicate custom recurrence origins owned by expander validation', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		expect(() =>
			createEventCalendarItemIndex<Record<never, never>>({
				items: [
					{
						id: 'series',
						title: 'series',
						start: origin,
						end: new Date('2026-07-15T10:00:00.000Z'),
						recurrence: 'RRULE:FREQ=DAILY',
						recurrenceTimeZone: 'UTC'
					}
				],
				range: {
					start: new Date('2026-07-15T00:00:00.000Z'),
					end: new Date('2026-07-16T00:00:00.000Z')
				},
				displayTimeZone: 'UTC',
				expandRecurrence: ({ item }) => {
					const occurrence = {
						allDay: false as const,
						start: new Date(item.start as Date),
						end: new Date(item.end as Date),
						originalStart: new Date(item.start as Date)
					};
					return [occurrence, { ...occurrence }];
				}
			})
		).toThrowError(/duplicate origin/);
	});

	test('rejects singleton ids that collide with recurring occurrence keys', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const recurringKey = createRecurringOccurrenceKey('series', origin);
		expect(() =>
			createEventCalendarItemIndex({
				items: [
					dailySeries('series', origin.toISOString(), '2026-07-15T10:00:00.000Z'),
					timedItem(recurringKey, origin.toISOString(), '2026-07-15T10:00:00.000Z')
				],
				range: {
					start: new Date('2026-07-15T00:00:00.000Z'),
					end: new Date('2026-07-16T00:00:00.000Z')
				},
				displayTimeZone: 'UTC'
			})
		).toThrowError(`Occurrence key collides with another item or occurrence: ${recurringKey}.`);
	});

	test('getOccurrences without a range returns the active-range projection', () => {
		const h = setup({
			view: 'week',
			items: [
				timedItem('inside', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
				timedItem('outside', '2026-08-01T09:00:00.000Z', '2026-08-01T10:00:00.000Z'),
				dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')
			]
		});
		const occurrences = h.calendar.getOccurrences();
		// The singleton plus six daily occurrences inside Jul 12 - Jul 19.
		expect(occurrences).toHaveLength(7);
		expect(occurrences.map((occurrence) => occurrence.item.id)).toContain('inside');
		expect(occurrences.map((occurrence) => occurrence.item.id)).not.toContain('outside');
	});

	test('getOccurrences with an explicit range projects that range, not the active one', () => {
		const h = setup({
			view: 'week',
			items: [
				timedItem('inside', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
				timedItem('outside', '2026-08-01T09:00:00.000Z', '2026-08-01T10:00:00.000Z'),
				dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')
			]
		});
		const queried = h.calendar.getOccurrences({
			start: new Date('2026-08-01T00:00:00.000Z'),
			end: new Date('2026-08-02T00:00:00.000Z')
		});
		const ids = queried.map((occurrence) => occurrence.item.id);
		expect(ids).toContain('outside');
		expect(ids).toContain('series'); // recurrence is expanded inside the requested range
		expect(ids).not.toContain('inside');
	});

	test('getOccurrences validates the explicit range and treats null like no range', () => {
		const h = setup({ view: 'week' });
		const active = h.calendar.getOccurrences();
		expect(h.calendar.getOccurrences(undefined)).toBe(active);
		expect(h.calendar.getOccurrences(null as unknown as undefined)).toBe(active);
		expect(() =>
			h.calendar.getOccurrences({
				start: new Date('not a date'),
				end: new Date('2026-07-19T00:00:00.000Z')
			})
		).toThrowError(/occurrence query range\.start must be a valid Date instant\./);
		expect(() =>
			h.calendar.getOccurrences({
				start: new Date('2026-07-19T00:00:00.000Z'),
				end: new Date('2026-07-12T00:00:00.000Z')
			})
		).toThrowError(/occurrence query range\.end must not precede occurrence query range\.start\./);
	});

	test('getOccurrencesForDay projects a single display-zone day and pins its bound error', () => {
		const h = setup({
			view: 'week',
			items: [
				timedItem('inside', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
				timedItem('spanning', '2026-07-14T22:00:00.000Z', '2026-07-16T02:00:00.000Z'),
				timedItem('outside', '2026-07-16T09:00:00.000Z', '2026-07-16T10:00:00.000Z')
			]
		});
		expect(
			h.calendar.getOccurrencesForDay('2026-07-15').map((occurrence) => occurrence.item.id)
		).toEqual(['spanning', 'inside']);
		expect(h.calendar.getOccurrencesForDay('2026-07-20')).toEqual([]);

		expect(() => h.calendar.getOccurrencesForDay('07-15' as EventCalendarDateOnly)).toThrowError(
			/day must use canonical YYYY-MM-DD form\./
		);
		// The last civil boundary cannot form an exclusive next-day bound, which is a distinct error.
		try {
			h.calendar.getOccurrencesForDay('9999-12-31');
			expect.unreachable('expected the day-boundary query to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(EventCalendarError);
			const calendarError = error as EventCalendarError;
			expect(calendarError.code).toBe('invalid-prop');
			expect(calendarError.message).toBe(
				'Cannot query 9999-12-31 because its exclusive day boundary exceeds the supported civil-date domain.'
			);
			expect(calendarError.details).toMatchObject({
				method: 'getOccurrencesForDay',
				day: '9999-12-31'
			});
		}
	});
});

describe('EventCalendar scrollToTime and mount', () => {
	test('scrollToTime is unsuccessful in month and agenda even with connected content', () => {
		const h = setup({ view: 'month' });
		h.calendar.connectContentNavigation({ scrollToTime: () => true });
		expect(h.calendar.scrollToTime(60)).toBe(false);
		expect(h.calendar.scrollToTime(new Date('2026-07-15T09:00:00.000Z'))).toBe(false);
	});

	test('scrollToTime delegates to connected content navigation in time views only', () => {
		const h = setup({ view: 'week' });
		// No content connected: the DOM component has not wired the hook.
		expect(h.calendar.scrollToTime(120)).toBe(false);

		const calls: Array<Date | number> = [];
		const disconnect = h.calendar.connectContentNavigation({
			scrollToTime: (value) => {
				calls.push(value);
				return true;
			}
		});
		expect(h.calendar.scrollToTime(120)).toBe(true);
		expect(calls).toEqual([120]);

		disconnect();
		expect(h.calendar.scrollToTime(120)).toBe(false);
	});

	test('today is a no-op before mount and while disabled, then navigates to the real clock', () => {
		const h = setup({ view: 'month' });
		h.calendar.today(); // not mounted: silent no-op
		expect(iso(h.calendar.date)).toBe('2026-07-15T10:00:00.000Z');
		expect(h.dateChanges).toHaveLength(0);

		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.setDisabled(true);
		h.calendar.today();
		expect(iso(h.calendar.date)).toBe('2026-07-15T10:00:00.000Z');
		expect(h.dateChanges).toHaveLength(0);
		h.setDisabled(false);

		const before = Date.now();
		h.calendar.today();
		const after = Date.now();
		flushSync();
		// today() targets the live clock, not the fixed instant handed to mount().
		expect(h.calendar.date.getTime()).toBeGreaterThanOrEqual(before);
		expect(h.calendar.date.getTime()).toBeLessThanOrEqual(after);
		expect(h.dateChanges).toHaveLength(1);
		expect(h.dateChanges[0].getTime()).toBe(h.calendar.date.getTime());
	});

	test('mount rejects an invalid clock instant and stays unmounted', () => {
		const h = setup();
		expect(() => h.calendar.mount(new Date('not a date'))).toThrowError(
			/now must be a valid Date instant\./
		);
		expect(h.calendar.isMounted).toBe(false);
	});
});

describe('EventCalendar goTo and setView', () => {
	test('goTo accepts Date and YYYY-MM-DD input and preserves a selectable anchor instant', () => {
		const h = setup({ view: 'month' });
		h.calendar.goTo(new Date('2026-08-20T15:30:00.000Z'));
		// The month view does not reconcile the anchor, so the instant is kept.
		expect(iso(h.calendar.date)).toBe('2026-08-20T15:30:00.000Z');
		expect(h.dateChanges.map(iso)).toEqual(['2026-08-20T15:30:00.000Z']);

		h.calendar.goTo('2026-08-05');
		expect(iso(h.calendar.date)).toBe('2026-08-05T00:00:00.000Z');
	});

	test('goTo resolves a date-only string at the start of the display-zone day', () => {
		const h = setup({ view: 'day', timeZone: 'America/New_York' });
		h.calendar.goTo('2026-08-20');
		expect(iso(h.calendar.date)).toBe('2026-08-20T04:00:00.000Z');
	});

	test('goTo rejects malformed input after the disabled gate', () => {
		const h = setup({ view: 'month' });
		expect(() => h.calendar.goTo('08-20' as EventCalendarDateOnly)).toThrowError(
			/date must use canonical YYYY-MM-DD form\./
		);
		expect(() => h.calendar.goTo('2026-02-30')).toThrowError(
			/date must be a real Gregorian date\./
		);
		expect(() => h.calendar.goTo(new Date('not a date'))).toThrowError(
			/date must be a valid Date instant\./
		);
	});

	test('setView rejects an unknown view with the exact unsupported-view error', () => {
		const h = setup({ view: 'month' });
		try {
			h.calendar.setView('year' as EventCalendarView);
			expect.unreachable('expected setView to throw');
		} catch (error) {
			expect(error).toBeInstanceOf(EventCalendarError);
			const calendarError = error as EventCalendarError;
			expect(calendarError.code).toBe('invalid-view');
			expect(calendarError.message).toBe('Unsupported calendar view: year.');
			expect(calendarError.details).toEqual({ view: 'year' });
		}
		expect(h.calendar.view).toBe('month');
	});

	test('setView rejects a known but disabled view', () => {
		const h = setup({ view: 'month', views: ['month', 'week'] });
		expect(() => h.calendar.setView('day')).toThrowError('View is not enabled: day.');
		// resource is excluded from enabled views while no resource leaf exists.
		const withResourceView = setup({ view: 'month', views: ['month', 'resource'] });
		expect(withResourceView.calendar.enabledViews).toEqual(['month']);
		expect(() => withResourceView.calendar.setView('resource')).toThrowError(
			'View is not enabled: resource.'
		);
	});

	test('setView pins the dayCount option to the days view', () => {
		const h = setup({ view: 'month' });
		expect(() => h.calendar.setView('week', { dayCount: 5 })).toThrowError(
			'The setView dayCount option is valid only for the days view.'
		);
		expect(() => h.calendar.setView('days', { dayCount: 0 })).toThrowError(
			'dayCount must be a positive integer.'
		);
		expect(h.calendar.view).toBe('month');
		expect(h.dayCountChanges).toHaveLength(0);
	});

	test('setView assigns dayCount, view, then date and notifies in the same order', () => {
		const h = setup({
			view: 'month',
			views: ['month', 'days'],
			showWeekends: false,
			date: new Date('2026-07-18T10:00:00.000Z'), // a Saturday
			dayCount: 3
		});
		h.trace.length = 0;
		h.calendar.setView('days', { dayCount: 5 });

		expect(h.calendar.dayCount).toBe(5);
		expect(h.calendar.view).toBe('days');
		// The hidden-weekend anchor reconciles forward to Monday at day start.
		expect(iso(h.calendar.date)).toBe('2026-07-20T00:00:00.000Z');
		expect(h.trace).toEqual([
			'set:dayCount',
			'set:view',
			'set:date',
			'cb:dayCount',
			'cb:view',
			'cb:date'
		]);
		expect(h.dayCountChanges).toEqual([5]);
		expect(h.viewChanges).toEqual(['days']);
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-20T00:00:00.000Z']);
	});

	test('setView to the current view with no changes is a silent no-op', () => {
		const h = setup({ view: 'month' });
		h.trace.length = 0;
		h.calendar.setView('month');
		expect(h.trace).toEqual([]);
		expect(h.calendar.view).toBe('month');
	});

	test('cancelInteraction is safe while the interaction controller is idle', () => {
		const h = setup();
		expect(() => h.calendar.cancelInteraction()).not.toThrow();
		expect(h.trace).toEqual([]);
	});
});

describe('EventCalendar disabled matrix', () => {
	test('navigation and selection are silent no-ops while disabled', () => {
		const h = setup({ view: 'month', disabled: true });
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.trace.length = 0;

		h.calendar.next();
		h.calendar.previous();
		h.calendar.today();
		h.calendar.goTo(new Date('2026-08-20T00:00:00.000Z'));
		h.calendar.setView('week');
		h.calendar.select({ kind: 'item', itemKey: 'standup', slot: null });

		expect(iso(h.calendar.date)).toBe('2026-07-15T10:00:00.000Z');
		expect(h.calendar.view).toBe('month');
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		// Disabled navigation and selection fire no error, no write, and no callback.
		expect(h.trace).toEqual([]);
		expect(h.blocked).toHaveLength(0);
	});

	test('disabled guards run before input validation on navigation and select', () => {
		const h = setup({ view: 'month', disabled: true });
		expect(() => h.calendar.goTo('not a date' as EventCalendarDateOnly)).not.toThrow();
		expect(() => h.calendar.setView('year' as EventCalendarView)).not.toThrow();
		expect(() =>
			h.calendar.select({ kind: 'item', itemKey: 'x' } as EventCalendarSelection)
		).not.toThrow();
		expect(h.calendar.view).toBe('month');
	});

	test('collection mutations report a blocked interaction instead of failing silently', () => {
		const h = setup({ disabled: true });
		h.calendar.addItem(timedItem('review', '2026-07-15T13:00:00.000Z', '2026-07-15T14:00:00.000Z'));
		h.calendar.removeItem('standup');
		expect(h.blocked.map((info) => ({ reason: info.reason, source: info.source }))).toEqual([
			{ reason: 'disabled', source: 'api' },
			{ reason: 'disabled', source: 'api' }
		]);
	});

	test('history returns false while disabled without a blocked callback', () => {
		const h = setup();
		h.calendar.addItem(timedItem('review', '2026-07-15T13:00:00.000Z', '2026-07-15T14:00:00.000Z'));
		h.setDisabled(true);
		expect(h.calendar.undo()).toBe(false);
		expect(h.calendar.redo()).toBe(false);
		expect(h.blocked).toHaveLength(0);
		// Capability queries stay live regardless of disabled state.
		expect(h.calendar.canUndo()).toBe(true);
	});

	test('copySelection has no disabled guard', () => {
		const h = setup({
			items: [timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')]
		});
		h.calendar.select({ kind: 'item', itemKey: 'standup', slot: null });
		h.setDisabled(true);
		expect(h.calendar.copySelection()).toBe(true);
	});
});

describe('EventCalendar construction validation', () => {
	test('missing or unsupported timeZone fails as invalid-time-zone', () => {
		expect(() => setup({ timeZone: '' })).toThrowError('timeZone must be a non-empty string.');
		expect(() => setup({ timeZone: 'Mars/Olympus' })).toThrowError(
			'timeZone must be a supported IANA name or UTC: Mars/Olympus.'
		);
		try {
			setup({ timeZone: 'Mars/Olympus' });
			expect.unreachable('expected construction to throw');
		} catch (error) {
			expect((error as EventCalendarError).code).toBe('invalid-time-zone');
		}
	});

	test('an invalid anchor date fails as invalid-prop', () => {
		expect(() => setup({ date: new Date('not a date') })).toThrowError(
			'date must be a valid Date instant.'
		);
	});

	test('views must be a non-empty duplicate-free list', () => {
		expect(() => setup({ views: [] })).toThrowError('views must be a non-empty array.');
		try {
			setup({ views: ['week', 'week'] });
			expect.unreachable('expected construction to throw');
		} catch (error) {
			const calendarError = error as EventCalendarError;
			expect(calendarError.code).toBe('invalid-view');
			expect(calendarError.message).toContain('views contains a duplicate: week.');
			expect(calendarError.details).toEqual({ view: 'week' });
		}
		// A resource-only view list has no enabled view without resource leaves.
		expect(() => setup({ views: ['resource'] })).toThrowError(
			'No configured view is currently enabled. The resource view requires a resource leaf.'
		);
	});

	test('timeGrid.scrollToHour must fall inside displayed hours', () => {
		expect(() => setup({ timeGridOptions: { scrollToHour: 24 } })).toThrowError(
			'timeGrid.scrollToHour must fall inside displayed hours.'
		);
		expect(() =>
			setup({ timeGridOptions: { startHour: 8, endHour: 18, scrollToHour: 7 } })
		).toThrowError('timeGrid.scrollToHour must fall inside displayed hours.');
	});

	test('business hours allow 24:00 only as an end and reject duplicate windows', () => {
		// A global end of 24:00 is admitted.
		expect(() =>
			setup({
				availabilityOptions: {
					businessHours: [{ daysOfWeek: [1, 2, 3, 4, 5], start: '09:00', end: '24:00' }]
				}
			})
		).not.toThrow();
		// 24:00 is not a valid start, and 24:01 is never valid.
		expect(() =>
			setup({
				availabilityOptions: { businessHours: [{ start: '24:00', end: '24:00' }] }
			})
		).toThrowError('availability.businessHours.start is outside its valid wall-time range.');
		expect(() =>
			setup({
				availabilityOptions: { businessHours: [{ start: '09:00', end: '24:01' }] }
			})
		).toThrowError('availability.businessHours.end is outside its valid wall-time range.');
		// Reversed or empty windows and duplicate day/window pairs are rejected.
		expect(() =>
			setup({
				availabilityOptions: { businessHours: [{ start: '17:00', end: '09:00' }] }
			})
		).toThrowError('Business hours must be a same-day range.');
		expect(() =>
			setup({
				availabilityOptions: {
					businessHours: [
						{ daysOfWeek: [1], start: '09:00', end: '17:00' },
						{ daysOfWeek: [1, 2], start: '09:00', end: '17:00' }
					]
				}
			})
		).toThrowError('availability.businessHours contains a duplicate window.');
	});
});
