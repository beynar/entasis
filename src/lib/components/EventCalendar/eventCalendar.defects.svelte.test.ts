// Defect witnesses for bounded corrections made during the redesign. Each test reproduces a
// confirmed baseline defect (see EVENT_CALENDAR_REDESIGN_EVIDENCE.md, D01–D04) and asserts the
// corrected contract — not the historical buggy behaviour.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import type { EventCalendarRecurrenceOptions } from './eventCalendar.props.js';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import { createRecurringOccurrenceKey } from './eventCalendar.items.js';
import type {
	EventCalendarExpandedOccurrence,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarProposedUpdate,
	EventCalendarSelection,
	EventCalendarUpdateResult,
	EventCalendarView
} from './eventCalendar.types.js';

const ANCHOR = new Date('2026-07-15T10:00:00.000Z'); // a Wednesday

type SetupOptions = {
	items?: EventCalendarItem[];
	recurrenceOptions?: EventCalendarRecurrenceOptions;
	disabled?: boolean;
	loading?: boolean;
	onItemsChange?: (payload: { items: readonly EventCalendarItem[] }) => void;
	onItemUpdate?: (proposal: EventCalendarProposedUpdate) => EventCalendarUpdateResult;
};

const teardowns: Array<() => void> = [];
afterEach(() => {
	while (teardowns.length > 0) teardowns.pop()?.();
});

const setup = (options: SetupOptions = {}) => {
	let items = $state<EventCalendarItem[]>(options.items ?? []);
	let view = $state<EventCalendarView>('month');
	let date = $state(ANCHOR);
	const selection = $state<EventCalendarSelection>(EMPTY_EVENT_CALENDAR_SELECTION);
	const blocked: EventCalendarInteractionBlockedInfo[] = [];
	const harness = {
		blocked,
		calendar: undefined as unknown as EventCalendarState,
		get items() {
			return items;
		},
		replaceItems: (next: EventCalendarItem[]) => {
			items = next;
			flushSync();
		}
	};
	const disabled = $state(options.disabled ?? false);
	const loading = $state(options.loading ?? false);
	const stop = $effect.root(() => {
		harness.calendar = new EventCalendarState<Record<never, never>, Record<never, never>>(
			'defect-test',
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
					view = value;
				},
				views: ['month', 'week', 'day', 'days', 'agenda', 'resource'],
				get date() {
					return date;
				},
				set date(value) {
					date = value;
				},
				dayCount: 3,
				get selection() {
					return selection;
				},
				set selection(_value: EventCalendarSelection) {},
				resources: [],
				timeZone: 'UTC',
				messages: en,
				density: 'normal',
				classes: eventCalendarTheme,
				showWeekends: true,
				weekendDays: [0, 6],
				agendaDayCount: 30,
				direction: 'ltr',
				allowOverlap: true,
				historyLimit: 50,
				renderers: {},
				get recurrenceOptions() {
					return options.recurrenceOptions;
				},
				get onItemUpdate() {
					return options.onItemUpdate;
				},
				get disabled() {
					return disabled;
				},
				get loading() {
					return loading;
				},
				eventHandlers: {
					get onItemsChange() {
						return options.onItemsChange;
					},
					onInteractionBlocked: (info) => blocked.push(info)
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

describe('D01 — reentrant model writes during final publication validation', () => {
	test('an items replacement inside the custom expander aborts the commit as stale', () => {
		const series: EventCalendarItem = {
			id: 'series',
			title: 'Daily',
			start: new Date('2026-07-15T09:00:00.000Z'),
			end: new Date('2026-07-15T10:00:00.000Z'),
			recurrence: { freq: 'daily' },
			recurrenceTimeZone: 'UTC'
		};
		const replacement: EventCalendarItem = {
			id: 'externally-set',
			title: 'External',
			start: new Date('2026-07-16T09:00:00.000Z'),
			end: new Date('2026-07-16T10:00:00.000Z')
		};
		let armed = false;
		let setItems: ((next: EventCalendarItem[]) => void) | null = null;
		const h = setup({
			items: [series],
			recurrenceOptions: {
				expand: ({ item }): readonly EventCalendarExpandedOccurrence[] => {
					if (armed && setItems) {
						armed = false;
						setItems([replacement]);
					}
					const start = item.start as Date;
					const end = item.end as Date;
					return [{ allDay: false as const, originalStart: start, start, end }];
				}
			}
		});
		setItems = h.replaceItems;
		armed = true;

		h.calendar.addItem({
			id: 'added',
			title: 'Added',
			start: new Date('2026-07-17T09:00:00.000Z'),
			end: new Date('2026-07-17T10:00:00.000Z')
		});
		flushSync();

		// The expander's replacement must win; the aborted commit reports `stale`.
		expect(h.items.map((item) => item.id)).toEqual(['externally-set']);
		expect(h.blocked.some((info) => info.reason === 'stale')).toBe(true);
	});
});

describe('D02 — occurrence-scope edits of an existing exception keep its custom fields', () => {
	test('editing an existing exception preserves exception-only fields', () => {
		const series: EventCalendarItem = {
			id: 'series',
			title: 'Daily',
			start: new Date('2026-07-15T09:00:00.000Z'),
			end: new Date('2026-07-15T10:00:00.000Z'),
			recurrence: { freq: 'daily' },
			recurrenceTimeZone: 'UTC'
		};
		const origin = new Date('2026-07-16T09:00:00.000Z');
		const exception: EventCalendarItem = {
			id: 'series-x',
			title: 'Moved once',
			start: new Date('2026-07-16T11:00:00.000Z'),
			end: new Date('2026-07-16T12:00:00.000Z'),
			recurringItemId: 'series',
			originalStart: origin,
			customTag: 'keep-me'
		} as EventCalendarItem;
		const h = setup({ items: [series, exception] });

		h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
			start: new Date('2026-07-16T13:00:00.000Z'),
			end: new Date('2026-07-16T14:00:00.000Z')
		});
		flushSync();

		const committed = h.items.find((item) => item.id === 'series-x');
		expect(committed).toBeDefined();
		expect((committed?.start as Date).getTime()).toBe(
			new Date('2026-07-16T13:00:00.000Z').getTime()
		);
		expect((committed as { customTag?: string } | undefined)?.customTag).toBe('keep-me');
	});
});
