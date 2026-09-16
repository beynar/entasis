// Characterisation of the EventCalendar undo/redo stack. The history lives inside
// EventCalendarMutations, which only exists alongside an EventCalendarState, so the state class is
// instantiated directly with the bindings EventCalendar.svelte hands it. Rendering the whole
// calendar once per scenario leaks a mounted instance per test in jsdom, which makes the run
// unusably slow and drowns the assertions in teardown noise.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import type {
	EventCalendarChange,
	EventCalendarItem,
	EventCalendarSelection,
	EventCalendarView
} from './eventCalendar.types.js';

const item = (id: string, hour: number): EventCalendarItem => ({
	id,
	title: id,
	start: new Date(`2026-07-15T${String(hour).padStart(2, '0')}:00:00.000Z`),
	end: new Date(`2026-07-15T${String(hour + 1).padStart(2, '0')}:00:00.000Z`)
});

type Harness = {
	calendar: EventCalendarState;
	ids: () => string[];
	/** Replaces the bound array the way a consumer would, outside of any transaction. */
	replaceItems: (next: EventCalendarItem[]) => void;
	lastChange: () => EventCalendarChange | undefined;
	setDisabled: (value: boolean) => void;
};

const teardowns: Array<() => void> = [];
afterEach(() => {
	while (teardowns.length > 0) teardowns.pop()?.();
});

const setup = (options: { historyLimit?: number } = {}): Harness => {
	let items = $state<EventCalendarItem[]>([item('standup', 9)]);
	let view = $state<EventCalendarView>('week');
	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
	let dayCount = $state(3);
	let selection = $state<EventCalendarSelection>(EMPTY_EVENT_CALENDAR_SELECTION);
	let disabled = $state(false);
	const changes: EventCalendarChange[] = [];
	let calendar: EventCalendarState | undefined;
	const stop = $effect.root(() => {
		calendar = new EventCalendarState<Record<never, never>, Record<never, never>>('history-test', {
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
			views: ['week'],
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
			resources: [],
			timeZone: 'UTC',
			messages: en,
			density: 'normal',
			classes: eventCalendarTheme,
			showWeekends: true,
			weekendDays: [0, 6],
			agendaDayCount: 30,
			get disabled() {
				return disabled;
			},
			loading: false,
			direction: 'ltr',
			allowOverlap: true,
			historyLimit: options.historyLimit ?? 50,
			renderers: {},
			eventHandlers: {
				onItemsChange: ({ change }) => void changes.push(change)
			},
			scrollMode: 'contained',
			stickyHeader: false,
			showDatePicker: false
		});
	});
	teardowns.push(stop);
	flushSync();
	if (!calendar) throw new Error('EventCalendarState was not created');
	return {
		calendar,
		ids: () => items.map((entry) => entry.id),
		replaceItems: (next) => {
			items = next;
			flushSync();
		},
		lastChange: () => changes.at(-1),
		setDisabled: (value) => {
			disabled = value;
			flushSync();
		}
	};
};

describe('EventCalendar history', () => {
	test('a mutation enables undo and leaves redo empty', () => {
		const harness = setup();
		expect(harness.calendar.canUndo()).toBe(false);

		harness.calendar.addItem(item('review', 13));

		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.canUndo()).toBe(true);
		expect(harness.calendar.canRedo()).toBe(false);
	});

	test('undo restores the previous items and enables redo', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));

		expect(harness.calendar.undo()).toBe(true);

		expect(harness.ids()).toEqual(['standup']);
		expect(harness.calendar.canUndo()).toBe(false);
		expect(harness.calendar.canRedo()).toBe(true);
	});

	test('redo re-applies the undone items', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		harness.calendar.undo();

		expect(harness.calendar.redo()).toBe(true);

		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.canUndo()).toBe(true);
		expect(harness.calendar.canRedo()).toBe(false);
	});

	test('undo and redo return false with nothing left on the stack', () => {
		const harness = setup();
		expect(harness.calendar.undo()).toBe(false);
		expect(harness.calendar.redo()).toBe(false);
	});

	test('walks several mutations back and forward in order', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		harness.calendar.addItem(item('retro', 15));
		harness.calendar.removeItem('standup');
		expect(harness.ids()).toEqual(['review', 'retro']);

		expect(harness.calendar.undo()).toBe(true);
		expect(harness.ids()).toEqual(['standup', 'review', 'retro']);
		expect(harness.calendar.undo()).toBe(true);
		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.undo()).toBe(true);
		expect(harness.ids()).toEqual(['standup']);
		expect(harness.calendar.canUndo()).toBe(false);

		expect(harness.calendar.redo()).toBe(true);
		expect(harness.calendar.redo()).toBe(true);
		expect(harness.calendar.redo()).toBe(true);
		expect(harness.ids()).toEqual(['review', 'retro']);
		expect(harness.calendar.canRedo()).toBe(false);
	});

	test('a new mutation after an undo clears the redo stack', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		harness.calendar.undo();
		expect(harness.calendar.canRedo()).toBe(true);

		harness.calendar.addItem(item('retro', 15));

		expect(harness.calendar.canRedo()).toBe(false);
		expect(harness.calendar.canUndo()).toBe(true);
	});

	test('the history limit drops the oldest entry', () => {
		const harness = setup({ historyLimit: 1 });
		harness.calendar.addItem(item('review', 13));
		harness.calendar.addItem(item('retro', 15));

		expect(harness.calendar.undo()).toBe(true);
		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.canUndo()).toBe(false);
		expect(harness.calendar.undo()).toBe(false);
	});

	test('a zero history limit records nothing', () => {
		const harness = setup({ historyLimit: 0 });
		harness.calendar.addItem(item('review', 13));

		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.canUndo()).toBe(false);
		expect(harness.calendar.undo()).toBe(false);
	});

	test('reverting a committed change removes its history entry', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		expect(harness.calendar.canUndo()).toBe(true);

		harness.lastChange()?.revert();

		expect(harness.ids()).toEqual(['standup']);
		expect(harness.calendar.canUndo()).toBe(false);
		expect(harness.calendar.canRedo()).toBe(false);
	});

	test('an older transaction can no longer be reverted once the model moved on', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		const firstChange = harness.lastChange();
		harness.calendar.addItem(item('retro', 15));

		expect(() => firstChange?.revert()).toThrowError(/can no longer be reverted/);
		expect(harness.calendar.canUndo()).toBe(true);
	});

	test('reverting an undo puts the entry back on the undo stack', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		harness.calendar.undo();
		expect(harness.calendar.canRedo()).toBe(true);

		harness.lastChange()?.revert();

		expect(harness.ids()).toEqual(['standup', 'review']);
		expect(harness.calendar.canUndo()).toBe(true);
		expect(harness.calendar.canRedo()).toBe(false);
	});

	test('an external replacement of the bound items makes the entry stale', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		expect(harness.calendar.canUndo()).toBe(true);

		harness.replaceItems([item('standup', 9), item('review', 13), item('outside', 17)]);

		expect(harness.calendar.canUndo()).toBe(false);
		expect(harness.calendar.undo()).toBe(false);
	});

	test('undo is refused while the calendar is disabled', () => {
		const harness = setup();
		harness.calendar.addItem(item('review', 13));
		harness.setDisabled(true);

		expect(harness.calendar.undo()).toBe(false);
		expect(harness.calendar.redo()).toBe(false);

		harness.setDisabled(false);
		expect(harness.calendar.undo()).toBe(true);
	});

	test('canUndo and canRedo re-run when the stack changes', () => {
		const harness = setup();
		const seen: Array<[boolean, boolean]> = [];
		const stop = $effect.root(() => {
			$effect(() => {
				seen.push([harness.calendar.canUndo(), harness.calendar.canRedo()]);
			});
		});
		flushSync();
		expect(seen).toEqual([[false, false]]);

		harness.calendar.addItem(item('review', 13));
		flushSync();
		expect(seen.at(-1)).toEqual([true, false]);

		harness.calendar.undo();
		flushSync();
		expect(seen.at(-1)).toEqual([false, true]);

		stop();
	});
});
