// Characterisation of EventCalendar selection: the discriminated selection contract, slot
// validation, silent re-selection, the disabled gate, and item-existence reconciliation in
// synchronize(). The state class is instantiated directly with the getter/setter bindings
// EventCalendar.svelte hands it; no DOM component is mounted.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { EventCalendarError } from './eventCalendar.error.js';
import type { EventCalendarMonthOptions } from './eventCalendar.props.js';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarRange,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarSlot,
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

const timedSlot = (start: string, end: string): EventCalendarSlot => ({
	view: 'week',
	allDay: false,
	start: new Date(start),
	end: new Date(end)
});

const allDaySlot = (
	start: EventCalendarDateOnly,
	end: EventCalendarDateOnly
): EventCalendarSlot => ({
	view: 'month',
	allDay: true,
	start,
	end
});

type SetupOptions = {
	items?: EventCalendarItem[];
	view?: EventCalendarView;
	views?: EventCalendarView[];
	date?: Date;
	dayCount?: number;
	selection?: EventCalendarSelection;
	resources?: EventCalendarResource[];
	timeZone?: string;
	showWeekends?: boolean;
	weekendDays?: EventCalendarWeekday[];
	monthOptions?: EventCalendarMonthOptions;
	validRange?: EventCalendarRange;
	disabled?: boolean;
	loading?: boolean;
};

type Harness = {
	calendar: EventCalendarState;
	trace: string[];
	selectionChanges: EventCalendarSelection[];
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
	const views = $state<EventCalendarView[]>(options.views ?? ALL_VIEWS);
	let date = $state(options.date ?? ANCHOR);
	let dayCount = $state(options.dayCount ?? 3);
	let selection = $state<EventCalendarSelection>(
		options.selection ?? EMPTY_EVENT_CALENDAR_SELECTION
	);
	const resources = $state<EventCalendarResource[]>(options.resources ?? []);
	let disabled = $state(options.disabled ?? false);
	const harness: Harness = {
		calendar: undefined as unknown as EventCalendarState,
		trace: [],
		selectionChanges: [],
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
			'selection-test',
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
				get monthOptions() {
					return options.monthOptions;
				},
				get showWeekends() {
					return options.showWeekends ?? true;
				},
				get weekendDays() {
					return options.weekendDays ?? [0, 6];
				},
				agendaDayCount: 30,
				get validRange() {
					return options.validRange;
				},
				get disabled() {
					return disabled;
				},
				loading: options.loading ?? false,
				direction: 'ltr',
				allowOverlap: true,
				historyLimit: 50,
				renderers: {},
				eventHandlers: {
					onSelectionChange: (value) => {
						harness.trace.push('cb:selection');
						harness.selectionChanges.push(value);
					},
					onViewChange: () => harness.trace.push('cb:view'),
					onDateChange: () => harness.trace.push('cb:date'),
					onDayCountChange: () => harness.trace.push('cb:dayCount'),
					onRangeChange: () => harness.trace.push('cb:range')
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

const itemSelection = (itemKey: string): EventCalendarSelection => ({
	kind: 'item',
	itemKey,
	slot: null
});

const slotSelection = (slot: EventCalendarSlot): EventCalendarSelection => ({
	kind: 'slot',
	itemKey: null,
	slot
});

describe('EventCalendar selection shapes', () => {
	test('each discriminated shape assigns the same reference and notifies once', () => {
		const h = setup();
		const itemSel = itemSelection('standup');
		h.calendar.select(itemSel);
		expect(h.calendar.selection).toStrictEqual(itemSel);
		expect(h.selectionChanges[0]).toBe(itemSel);

		const slotSel = slotSelection(
			timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')
		);
		h.calendar.select(slotSel);
		expect(h.calendar.selection).toStrictEqual(slotSel);
		expect(h.selectionChanges[1]).toBe(slotSel);

		h.calendar.select(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges[2]).toBe(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges).toHaveLength(3);
	});

	test('re-selecting an equal selection is a silent no-op', () => {
		const h = setup();
		h.calendar.select(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(1);

		// A structurally equal but distinct object still compares equal and does not re-notify.
		h.calendar.select(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(1);

		const first = timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z');
		const second = timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z');
		h.calendar.select(slotSelection(first));
		expect(h.selectionChanges).toHaveLength(2);
		h.calendar.select(slotSelection(second));
		expect(h.selectionChanges).toHaveLength(2);

		// clearSelection delegates to select(empty), which is also a no-op when already empty.
		h.calendar.clearSelection();
		expect(h.selectionChanges).toHaveLength(3);
		h.calendar.clearSelection();
		expect(h.selectionChanges).toHaveLength(3);
	});

	test('select works and notifies before mount', () => {
		const h = setup({
			items: [timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')]
		});
		expect(h.calendar.isMounted).toBe(false);
		h.calendar.select(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(1);
		expect(h.calendar.selection).toEqual(itemSelection('standup'));
	});

	test('malformed discriminated shapes fail as invalid-prop', () => {
		const h = setup();
		const malformed: unknown[] = [
			{ kind: 'item', itemKey: '', slot: null },
			{
				kind: 'item',
				itemKey: 'x',
				slot: timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')
			},
			{ kind: 'item', itemKey: 'x' }, // missing the required null slot member
			{
				kind: 'slot',
				itemKey: 'x',
				slot: timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')
			},
			{ kind: 'slot', itemKey: null, slot: null },
			{ kind: 'bogus', itemKey: null, slot: null }
		];
		for (const value of malformed) {
			expect(() => h.calendar.select(value as EventCalendarSelection)).toThrowError(
				'selection has an invalid discriminated shape.'
			);
		}
		expect(() => h.calendar.select(null as unknown as EventCalendarSelection)).toThrowError(
			'selection must be a discriminated selection.'
		);
		expect(h.selectionChanges).toHaveLength(0);
	});

	test('slot payloads are validated against their temporal kind', () => {
		const h = setup();
		// All-day slots use civil-date strings and require a positive interval.
		h.calendar.select(slotSelection(allDaySlot('2026-07-15', '2026-07-17')));
		expect(h.calendar.selection).toEqual(slotSelection(allDaySlot('2026-07-15', '2026-07-17')));
		expect(() =>
			h.calendar.select(slotSelection(allDaySlot('2026-07-15', '2026-07-15')))
		).toThrowError('An all-day slot must have positive length.');
		expect(() =>
			h.calendar.select(
				slotSelection({
					view: 'month',
					allDay: true,
					start: new Date(),
					end: new Date()
				} as unknown as EventCalendarSlot)
			)
		).toThrowError('selection.slot.start must be a YYYY-MM-DD string.');
		expect(() =>
			h.calendar.select(slotSelection(allDaySlot('2026-2-3', '2026-07-15')))
		).toThrowError('selection.slot.start must use canonical YYYY-MM-DD form.');
		expect(() =>
			h.calendar.select(slotSelection(allDaySlot('2026-02-30', '2026-07-15')))
		).toThrowError('selection.slot.start must be a real Gregorian date.');

		// Timed slots use Date instants; a zero-length slot is admitted.
		h.calendar.select(
			slotSelection(timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T09:00:00.000Z'))
		);
		expect(() =>
			h.calendar.select(
				slotSelection(timedSlot('2026-07-15T10:00:00.000Z', '2026-07-15T09:00:00.000Z'))
			)
		).toThrowError('A timed slot cannot end before it starts.');

		// The allDay discriminator and the slot view are both checked.
		expect(() =>
			h.calendar.select(
				slotSelection({
					view: 'week',
					start: new Date('2026-07-15T09:00:00.000Z'),
					end: new Date('2026-07-15T10:00:00.000Z')
				} as unknown as EventCalendarSlot)
			)
		).toThrowError('A slot requires a boolean allDay discriminator.');
		try {
			h.calendar.select(
				slotSelection({
					view: 'year',
					allDay: false,
					start: new Date('2026-07-15T09:00:00.000Z'),
					end: new Date('2026-07-15T10:00:00.000Z')
				} as unknown as EventCalendarSlot)
			);
			expect.unreachable('expected select to throw');
		} catch (error) {
			expect((error as EventCalendarError).code).toBe('invalid-view');
			expect((error as EventCalendarError).message).toBe('Unsupported calendar view: year.');
		}
	});

	test('an invalid bound selection fails at construction', () => {
		expect(() =>
			setup({
				selection: { kind: 'item', itemKey: '' } as unknown as EventCalendarSelection
			})
		).toThrowError('selection has an invalid discriminated shape.');
	});
});

describe('EventCalendar selection reconciliation', () => {
	test('an item selection is cleared when its item leaves the collection', () => {
		const standup = timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z');
		const h = setup({ view: 'week', items: [standup] });
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.calendar.select(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(1);

		h.replaceItems([timedItem('other', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z')]);
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges).toEqual([itemSelection('standup'), EMPTY_EVENT_CALENDAR_SELECTION]);
	});

	test('before mount the clear is applied but its notification defers to mount', () => {
		const standup = timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z');
		const h = setup({ view: 'week', items: [standup] });
		h.calendar.select(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(1);

		h.replaceItems([]);
		// synchronize ran with notify=false, so the bound selection already cleared silently.
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges).toHaveLength(1);

		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(h.selectionChanges).toEqual([itemSelection('standup'), EMPTY_EVENT_CALENDAR_SELECTION]);
	});

	test('a bound selection whose item never existed clears at construction', () => {
		const h = setup({ selection: itemSelection('ghost') });
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges).toHaveLength(0); // deferred until mount
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(h.selectionChanges).toEqual([EMPTY_EVENT_CALENDAR_SELECTION]);
	});

	test('selecting an unknown key assigns, then clears when the projection rebuilds', () => {
		const h = setup({ view: 'week' });
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.calendar.select(itemSelection('ghost'));
		expect(h.calendar.selection).toEqual(itemSelection('ghost'));
		expect(h.selectionChanges).toEqual([itemSelection('ghost')]);

		// A bare select does not itself re-run reconciliation: the derived projection returns the
		// same model reference, so the ghost key survives until items/view/date move it.
		flushSync();
		expect(h.calendar.selection).toEqual(itemSelection('ghost'));

		h.replaceItems([timedItem('other', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z')]);
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges.at(-1)).toBe(EMPTY_EVENT_CALENDAR_SELECTION);
	});

	test('a recurring-occurrence selection clears when its series is removed', () => {
		const h = setup({
			view: 'week',
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')]
		});
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		const occurrence = h.calendar.getOccurrences().find((entry) => entry.isRecurring);
		expect(occurrence).toBeDefined();
		h.calendar.select(itemSelection(occurrence!.key));
		flushSync();
		expect(h.calendar.selection).toEqual(itemSelection(occurrence!.key));

		h.replaceItems([]);
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges.at(-1)).toBe(EMPTY_EVENT_CALENDAR_SELECTION);
	});

	test('selection survives navigation and view changes while the item exists', () => {
		const standup = timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z');
		const h = setup({ view: 'week', items: [standup] });
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		h.calendar.select(itemSelection('standup'));
		h.selectionChanges.length = 0;

		h.calendar.next();
		h.calendar.setView('day');
		h.calendar.goTo(new Date('2026-08-01T00:00:00.000Z'));
		flushSync();
		expect(h.calendar.selection).toEqual(itemSelection('standup'));
		expect(h.selectionChanges).toHaveLength(0);
	});

	test('a slot selection is not reconciled against the item collection', () => {
		const h = setup({
			view: 'week',
			items: [timedItem('standup', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')]
		});
		h.calendar.mount(new Date('2026-07-15T12:00:00.000Z'));
		flushSync();
		const slot = timedSlot('2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z');
		h.calendar.select(slotSelection(slot));

		h.replaceItems([]);
		h.calendar.next();
		h.calendar.setView('day');
		flushSync();
		expect(h.calendar.selection).toEqual(slotSelection(slot));
		expect(h.selectionChanges).toHaveLength(1);
	});

	test('select is a silent no-op while disabled, even for invalid input', () => {
		const h = setup({ disabled: true });
		expect(() => h.calendar.select(itemSelection('standup'))).not.toThrow();
		expect(() =>
			h.calendar.select({ kind: 'item', itemKey: 'x' } as EventCalendarSelection)
		).not.toThrow();
		expect(h.calendar.selection).toStrictEqual(EMPTY_EVENT_CALENDAR_SELECTION);
		expect(h.selectionChanges).toHaveLength(0);
		expect(h.trace.filter((entry) => entry.startsWith('cb:'))).toEqual([]);
	});
});
