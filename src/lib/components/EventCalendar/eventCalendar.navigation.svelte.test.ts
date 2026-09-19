// Characterisation of EventCalendar date profiles and navigation: per-view ranges and visible
// days, view-appropriate increments, hidden-weekend and validRange reconciliation, enabled-view
// reconciliation, and the supported civil-date domain edges. The state class is instantiated
// directly with the getter/setter bindings EventCalendar.svelte hands it; no DOM is mounted.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
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
	trace: string[];
	rangeChanges: EventCalendarRangeChangeInfo[];
	viewChanges: EventCalendarView[];
	dateChanges: Date[];
	dayCountChanges: number[];
	selectionChanges: EventCalendarSelection[];
	setViewsProp: (next: EventCalendarView[]) => void;
	setResourcesProp: (next: EventCalendarResource[]) => void;
	replaceItems: (next: EventCalendarItem[]) => void;
	setDisabled: (value: boolean) => void;
};

const teardowns: Array<() => void> = [];
afterEach(() => {
	while (teardowns.length > 0) teardowns.pop()?.();
});

const setup = (options: SetupOptions = {}): Harness => {
	let items = $state<EventCalendarItem[]>(options.items ?? []);
	let view = $state<EventCalendarView>(options.view ?? 'month');
	let views = $state<EventCalendarView[]>(options.views ?? ALL_VIEWS);
	let date = $state(options.date ?? ANCHOR);
	let dayCount = $state(options.dayCount ?? 3);
	const agendaDayCount = $state(options.agendaDayCount ?? 30);
	let selection = $state<EventCalendarSelection>(
		options.selection ?? EMPTY_EVENT_CALENDAR_SELECTION
	);
	let resources = $state<EventCalendarResource[]>(options.resources ?? []);
	let disabled = $state(options.disabled ?? false);
	const loading = $state(options.loading ?? false);
	const harness: Harness = {
		calendar: undefined as unknown as EventCalendarState,
		trace: [],
		rangeChanges: [],
		viewChanges: [],
		dateChanges: [],
		dayCountChanges: [],
		selectionChanges: [],
		setViewsProp: (next) => {
			views = next;
			flushSync();
		},
		setResourcesProp: (next) => {
			resources = next;
			flushSync();
		},
		replaceItems: (next) => {
			items = next;
			flushSync();
		},
		setDisabled: (value) => {
			disabled = value;
			flushSync();
		}
	};
	const stop = $effect.root(() => {
		harness.calendar = new EventCalendarState<Record<never, never>, Record<never, never>>(
			'navigation-test',
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
				timeZone: options.timeZone ?? 'UTC',
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
const rangeIso = (range: EventCalendarRange) => `${iso(range.start)}..${iso(range.end)}`;

describe('EventCalendar view profiles', () => {
	test.each<{
		view: EventCalendarView;
		current: string;
		render: string;
		active: string;
		visibleDays: number;
		resources?: EventCalendarResource[];
	}>([
		{
			view: 'month',
			current: '2026-07-01T00:00:00.000Z..2026-08-01T00:00:00.000Z',
			render: '2026-06-28T00:00:00.000Z..2026-08-09T00:00:00.000Z',
			active: '2026-06-28T00:00:00.000Z..2026-08-09T00:00:00.000Z',
			visibleDays: 42
		},
		{
			view: 'week',
			current: '2026-07-12T00:00:00.000Z..2026-07-19T00:00:00.000Z',
			render: '2026-07-12T00:00:00.000Z..2026-07-19T00:00:00.000Z',
			active: '2026-07-12T00:00:00.000Z..2026-07-19T00:00:00.000Z',
			visibleDays: 7
		},
		{
			view: 'day',
			current: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			render: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			active: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			visibleDays: 1
		},
		{
			view: 'days',
			current: '2026-07-15T00:00:00.000Z..2026-07-18T00:00:00.000Z',
			render: '2026-07-15T00:00:00.000Z..2026-07-18T00:00:00.000Z',
			active: '2026-07-15T00:00:00.000Z..2026-07-18T00:00:00.000Z',
			visibleDays: 3
		},
		{
			view: 'agenda',
			current: '2026-07-15T00:00:00.000Z..2026-08-14T00:00:00.000Z',
			render: '2026-07-15T00:00:00.000Z..2026-08-14T00:00:00.000Z',
			active: '2026-07-15T00:00:00.000Z..2026-08-14T00:00:00.000Z',
			visibleDays: 30
		},
		{
			view: 'resource',
			current: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			render: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			active: '2026-07-15T00:00:00.000Z..2026-07-16T00:00:00.000Z',
			visibleDays: 1,
			resources: [{ id: 'room-a', title: 'Room A' }]
		}
	])(
		'$view produces its documented ranges and visible days for a fixed anchor',
		({ view, current, render, active, visibleDays, resources }) => {
			const h = setup({ view, resources });
			const profile = h.calendar.dateProfile;
			expect(rangeIso(profile.currentRange)).toBe(current);
			expect(rangeIso(profile.renderRange)).toBe(render);
			expect(rangeIso(profile.activeRange)).toBe(active);
			expect(profile.visibleDays).toHaveLength(visibleDays);
			expect(profile.visibleDays[0]).toBe(render.slice(0, 10));
			// Public getters agree with the profile values.
			expect(rangeIso(h.calendar.getVisibleRange())).toBe(render);
			expect(rangeIso(h.calendar.getActiveRange())).toBe(active);
		}
	);

	test('visibleDays are civil-date strings resolved in the display time zone', () => {
		// 2026-07-15T02:00Z is still July 14 in New York.
		const h = setup({
			view: 'day',
			timeZone: 'America/New_York',
			date: new Date('2026-07-15T02:00:00.000Z')
		});
		expect(h.calendar.getVisibleDays()).toEqual(['2026-07-14']);
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-14T04:00:00.000Z..2026-07-15T04:00:00.000Z'
		);
	});

	test('month fixedWeeks controls the rendered row count', () => {
		const fixed = setup({ view: 'month', monthOptions: { fixedWeeks: true } });
		expect(fixed.calendar.getVisibleDays()).toHaveLength(42);
		expect(fixed.calendar.getVisibleDays()[0]).toBe('2026-06-28');
		expect(fixed.calendar.getVisibleDays().at(-1)).toBe('2026-08-08');

		// July 2026 occupies five Sunday-start weeks, so a natural month renders 35 cells.
		const natural = setup({ view: 'month', monthOptions: { fixedWeeks: false } });
		expect(natural.calendar.getVisibleDays()).toHaveLength(35);
		expect(natural.calendar.getVisibleDays()[0]).toBe('2026-06-28');
		expect(natural.calendar.getVisibleDays().at(-1)).toBe('2026-08-01');
		expect(rangeIso(natural.calendar.getVisibleRange())).toBe(
			'2026-06-28T00:00:00.000Z..2026-08-02T00:00:00.000Z'
		);
	});

	test('showOutsideDays narrows the active range but not the render range', () => {
		const h = setup({ view: 'month', monthOptions: { showOutsideDays: false } });
		expect(rangeIso(h.calendar.getVisibleRange())).toBe(
			'2026-06-28T00:00:00.000Z..2026-08-09T00:00:00.000Z'
		);
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-01T00:00:00.000Z..2026-08-01T00:00:00.000Z'
		);
		const days = h.calendar.getVisibleDays();
		expect(days).toHaveLength(31);
		expect(days[0]).toBe('2026-07-01');
		expect(days.at(-1)).toBe('2026-07-31');
	});

	test('validRange clips the active range without changing the render range', () => {
		const h = setup({
			view: 'month',
			validRange: {
				start: new Date('2026-07-10T00:00:00.000Z'),
				end: new Date('2026-07-20T00:00:00.000Z')
			}
		});
		expect(rangeIso(h.calendar.getVisibleRange())).toBe(
			'2026-06-28T00:00:00.000Z..2026-08-09T00:00:00.000Z'
		);
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-10T00:00:00.000Z..2026-07-20T00:00:00.000Z'
		);
	});
});

describe('EventCalendar navigation increments', () => {
	test.each<{
		view: EventCalendarView;
		next: string;
		previous: string;
		resources?: EventCalendarResource[];
	}>([
		{ view: 'month', next: '2026-08-15T00:00:00.000Z', previous: '2026-06-15T00:00:00.000Z' },
		{ view: 'week', next: '2026-07-22T00:00:00.000Z', previous: '2026-07-08T00:00:00.000Z' },
		{ view: 'day', next: '2026-07-16T00:00:00.000Z', previous: '2026-07-14T00:00:00.000Z' },
		{ view: 'days', next: '2026-07-18T00:00:00.000Z', previous: '2026-07-12T00:00:00.000Z' },
		{ view: 'agenda', next: '2026-08-14T00:00:00.000Z', previous: '2026-06-15T00:00:00.000Z' },
		{
			view: 'resource',
			next: '2026-07-16T00:00:00.000Z',
			previous: '2026-07-14T00:00:00.000Z',
			resources: [{ id: 'room-a', title: 'Room A' }]
		}
	])(
		'$view moves its anchor by one view increment and day-aligns it',
		({ view, next, previous, resources }) => {
			const h = setup({ view, resources });
			h.calendar.next();
			expect(iso(h.calendar.date)).toBe(next);
			expect(h.dateChanges.map(iso)).toEqual([next]);
			h.calendar.previous();
			h.calendar.previous();
			expect(iso(h.calendar.date)).toBe(previous);
			expect(h.dateChanges.map(iso)).toEqual([next, '2026-07-15T00:00:00.000Z', previous]);
		}
	);

	test('month navigation clamps the day of month to the target month', () => {
		const h = setup({ view: 'month', date: new Date('2026-01-31T10:00:00.000Z') });
		h.calendar.next();
		// 2026 is not a leap year, so the January 31 anchor clamps to February 28.
		expect(iso(h.calendar.date)).toBe('2026-02-28T00:00:00.000Z');
	});

	test('a days view step counts visible days, not civil days', () => {
		const h = setup({ view: 'days', dayCount: 3, date: new Date('2026-07-16T10:00:00.000Z') });
		h.calendar.next();
		expect(iso(h.calendar.date)).toBe('2026-07-19T00:00:00.000Z');
		expect(h.calendar.getVisibleDays()).toEqual(['2026-07-19', '2026-07-20', '2026-07-21']);
	});
});

describe('EventCalendar hidden-weekday reconciliation', () => {
	test('week view keeps its full range while dropping hidden days', () => {
		const h = setup({ view: 'week', showWeekends: false, weekendDays: [0, 6] });
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-12T00:00:00.000Z..2026-07-19T00:00:00.000Z'
		);
		expect(h.calendar.getVisibleDays()).toEqual([
			'2026-07-13',
			'2026-07-14',
			'2026-07-15',
			'2026-07-16',
			'2026-07-17'
		]);
	});

	// DEFECT D04 (baseline): construction evaluates the model with the raw view/date before
	// synchronize can reconcile, so a hidden-day anchor throws 'invalid-prop' instead of
	// reconciling — while goTo() reconciles the same anchor fine. This test asserts the intended
	// contract and stays red until the redesign orders reconcile-before-project.
	test('a hidden-weekend anchor reconciles forward to Monday at day start', () => {
		const h = setup({
			view: 'day',
			showWeekends: false,
			date: new Date('2026-07-18T10:00:00.000Z') // a Saturday
		});
		// The bound date is reassigned during construction; the notification is deferred to mount.
		expect(iso(h.calendar.date)).toBe('2026-07-20T00:00:00.000Z');
		expect(h.dateChanges).toHaveLength(0);
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-20T00:00:00.000Z']);
	});

	test('goTo reconciles a hidden-weekend anchor the same way', () => {
		const h = setup({ view: 'agenda', showWeekends: false });
		h.calendar.goTo('2026-07-18'); // a Saturday
		expect(iso(h.calendar.date)).toBe('2026-07-20T00:00:00.000Z');
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-20T00:00:00.000Z']);
	});

	test('visible-day navigation skips hidden days in both directions', () => {
		const h = setup({
			view: 'day',
			showWeekends: false,
			date: new Date('2026-07-17T10:00:00.000Z') // a Friday
		});
		h.calendar.next();
		expect(iso(h.calendar.date)).toBe('2026-07-20T00:00:00.000Z'); // Monday, not Saturday
		h.calendar.previous();
		expect(iso(h.calendar.date)).toBe('2026-07-17T00:00:00.000Z'); // back to Friday
	});

	test('days view visibleDays skip hidden days while spanning their civil range', () => {
		const h = setup({
			view: 'days',
			dayCount: 3,
			showWeekends: false,
			date: new Date('2026-07-16T10:00:00.000Z') // a Thursday
		});
		expect(h.calendar.getVisibleDays()).toEqual(['2026-07-16', '2026-07-17', '2026-07-20']);
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-16T00:00:00.000Z..2026-07-21T00:00:00.000Z'
		);
		h.calendar.next();
		// Three visible days forward: Fri 17, Mon 20, Tue 21.
		expect(iso(h.calendar.date)).toBe('2026-07-21T00:00:00.000Z');
	});
});

describe('EventCalendar validRange and enabled-view reconciliation', () => {
	test('navigation past the validRange boundary reconciles back inside it', () => {
		const h = setup({
			view: 'week',
			validRange: {
				start: new Date('2026-07-10T00:00:00.000Z'),
				end: new Date('2026-07-20T00:00:00.000Z')
			}
		});
		h.calendar.next();
		// July 22 lands outside the range, so the anchor reconciles to the last covered day,
		// Sunday July 19 — which opens the following week rather than staying put.
		expect(iso(h.calendar.date)).toBe('2026-07-19T00:00:00.000Z');
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-19T00:00:00.000Z']);
		expect(rangeIso(h.calendar.getVisibleRange())).toBe(
			'2026-07-19T00:00:00.000Z..2026-07-26T00:00:00.000Z'
		);
		// The active range is clipped to the single day still inside validRange.
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'2026-07-19T00:00:00.000Z..2026-07-20T00:00:00.000Z'
		);
	});

	test('day-view navigation at the validRange edge reconciles to the same day boundary once', () => {
		const h = setup({
			view: 'day',
			date: new Date('2026-07-16T10:00:00.000Z'),
			validRange: {
				start: new Date('2026-07-15T00:00:00.000Z'),
				end: new Date('2026-07-17T00:00:00.000Z')
			}
		});
		// July 17 lies outside [Jul 15, Jul 17), so the anchor reconciles back to July 16 — but at
		// day start, which still commits a distinct instant and notifies once.
		h.calendar.next();
		expect(iso(h.calendar.date)).toBe('2026-07-16T00:00:00.000Z');
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-16T00:00:00.000Z']);
		// Once the anchor is already day-aligned, the same step is a true no-op.
		h.calendar.next();
		expect(h.dateChanges).toHaveLength(1);

		h.calendar.goTo(new Date('2026-07-15T10:00:00.000Z')); // selectable, so the instant survives
		expect(iso(h.calendar.date)).toBe('2026-07-15T10:00:00.000Z');
		h.dateChanges.length = 0;
		h.calendar.previous();
		expect(iso(h.calendar.date)).toBe('2026-07-15T00:00:00.000Z');
		expect(h.dateChanges.map(iso)).toEqual(['2026-07-15T00:00:00.000Z']);
		h.calendar.previous();
		expect(h.dateChanges).toHaveLength(1);
	});

	test('resource view requires a leaf and is excluded from enabled views without one', () => {
		const h = setup({ view: 'month', views: ['month', 'resource'] });
		expect(h.calendar.enabledViews).toEqual(['month']);
	});

	test('a current view that loses its leaves reconciles to the first enabled view', () => {
		const h = setup({
			view: 'resource',
			views: ['month', 'resource'],
			resources: [{ id: 'room-a', title: 'Room A' }]
		});
		expect(h.calendar.view).toBe('resource');
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();

		h.setResourcesProp([]);
		expect(h.calendar.view).toBe('month');
		expect(h.viewChanges).toEqual(['month']);
	});

	test('an unavailable configured view reconciles at construction and notifies on mount', () => {
		const h = setup({
			view: 'resource',
			views: ['day', 'resource'],
			date: new Date('2026-07-15T10:00:00.000Z') // a Wednesday
		});
		// resource has no leaves, so the first enabled view wins at construction.
		expect(h.calendar.view).toBe('day');
		expect(iso(h.calendar.date)).toBe('2026-07-15T10:00:00.000Z');
		expect(h.trace.filter((entry) => entry.startsWith('cb:'))).toEqual([]);

		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		// Deferred constructor reconciliation publishes the view, then the range.
		expect(h.trace.filter((entry) => entry.startsWith('cb:'))).toEqual(['cb:view', 'cb:range']);
		expect(h.viewChanges).toEqual(['day']);
		expect(h.dateChanges).toHaveLength(0);
	});

	// DEFECT D03 (baseline): a views-only change recomputes validatedProjection but returns the
	// same model reference, so the sync effect is not re-notified and the stale view survives.
	// This asserts the intended contract and stays red until synchronize tracks view/views.
	test('removing the active view from views reconciles to the remaining list', () => {
		const h = setup({ view: 'days', views: ['month', 'days'] });
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.setViewsProp(['month']);
		expect(h.calendar.view).toBe('month');
		expect(h.viewChanges).toEqual(['month']);
	});
});

describe('EventCalendar range notification and civil-domain edges', () => {
	test('onRangeChange is deferred to mount and deduplicated by range signature', () => {
		const h = setup({ view: 'week' });
		flushSync();
		expect(h.rangeChanges).toHaveLength(0); // never fires before mount

		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(h.rangeChanges).toHaveLength(1);
		expect(h.rangeChanges[0].view).toBe('week');
		expect(h.rangeChanges[0].timeZone).toBe('UTC');
		expect(rangeIso(h.rangeChanges[0].activeRange)).toBe(
			'2026-07-12T00:00:00.000Z..2026-07-19T00:00:00.000Z'
		);

		// A no-op navigation and an unrelated items change keep the same signature.
		h.calendar.goTo(new Date('2026-07-15T10:00:00.000Z'));
		h.replaceItems([]);
		flushSync();
		expect(h.rangeChanges).toHaveLength(1);

		h.calendar.next();
		flushSync();
		expect(h.rangeChanges).toHaveLength(2);
		expect(rangeIso(h.rangeChanges[1].activeRange)).toBe(
			'2026-07-19T00:00:00.000Z..2026-07-26T00:00:00.000Z'
		);
	});

	test('navigation stops silently at the maximum civil day', () => {
		const h = setup({ view: 'day', date: new Date('9999-12-30T00:00:00.000Z') });
		expect(h.calendar.getVisibleDays()).toEqual(['9999-12-30']);
		expect(() => h.calendar.next()).not.toThrow();
		expect(iso(h.calendar.date)).toBe('9999-12-30T00:00:00.000Z');
		expect(h.dateChanges).toHaveLength(0);
		// Stepping back inside the domain still works.
		h.calendar.previous();
		expect(iso(h.calendar.date)).toBe('9999-12-29T00:00:00.000Z');
	});

	test('navigation stops silently at the minimum civil day', () => {
		const h = setup({ view: 'day', date: new Date('0001-01-01T00:00:00.000Z') });
		expect(h.calendar.getVisibleDays()).toEqual(['0001-01-01']);
		expect(() => h.calendar.previous()).not.toThrow();
		expect(iso(h.calendar.date)).toBe('0001-01-01T00:00:00.000Z');
		expect(h.dateChanges).toHaveLength(0);
	});

	test('a week anchored at the minimum civil day renders a clipped week', () => {
		const h = setup({ view: 'week', date: new Date('0001-01-01T00:00:00.000Z') });
		// 0001-01-01 is a Monday, so a Sunday-start week clips off the unsupported Sunday.
		expect(rangeIso(h.calendar.getActiveRange())).toBe(
			'0001-01-01T00:00:00.000Z..0001-01-07T00:00:00.000Z'
		);
		expect(h.calendar.getVisibleDays()).toEqual([
			'0001-01-01',
			'0001-01-02',
			'0001-01-03',
			'0001-01-04',
			'0001-01-05',
			'0001-01-06'
		]);
	});

	test('goTo beyond the last selectable day fails per view', () => {
		const dayView = setup({ view: 'day' });
		expect(() => dayView.calendar.goTo('9999-12-31')).toThrowError(
			'The calendar anchor exceeds the last selectable civil day.'
		);
		// Month and week skip anchor reconciliation, so the profile itself reports the domain error.
		const monthView = setup({ view: 'month' });
		expect(() => monthView.calendar.goTo('9999-12-31')).toThrowError(
			'The month date profile exceeds the supported civil-date domain.'
		);
	});
});
