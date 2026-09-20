// Characterisation of the unified EventCalendarMutations commit phase. Each test pins observable
// behaviour — validation order, blocked reasons, adjustment handling, guarded revert, selection
// remapping, and the emitted change payloads — exactly as the code behaves today. The state class
// is instantiated directly with the getter/setter bindings EventCalendar.svelte hands it (the same
// pattern as eventCalendar.api.svelte.test.ts and eventCalendar.defects.svelte.test.ts); no DOM
// component is mounted.
import { en } from '$lib/i18n/en.js';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, test } from 'vitest';
import { EventCalendarError, type EventCalendarErrorCode } from './eventCalendar.error.js';
import {
	createRecurringOccurrenceKey,
	decodeRecurringOccurrenceKey
} from './eventCalendar.items.js';
import type {
	EventCalendarItemsChangePayload,
	EventCalendarRecurrenceOptions
} from './eventCalendar.props.js';
import {
	EMPTY_EVENT_CALENDAR_SELECTION,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import { eventCalendarTheme } from './eventCalendar.theme.js';
import type {
	EventCalendarChange,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarOverlapPredicate,
	EventCalendarProposedUpdate,
	EventCalendarRange,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarSlot,
	EventCalendarUpdateResult,
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
	selection?: EventCalendarSelection;
	resources?: EventCalendarResource[];
	timeZone?: string;
	validRange?: EventCalendarRange;
	disabled?: boolean;
	loading?: boolean;
	allowOverlap?: boolean | EventCalendarOverlapPredicate;
	historyLimit?: number;
	canUpdateItem?: (proposal: EventCalendarProposedUpdate) => boolean;
	canSelectSlot?: (slot: EventCalendarSlot) => boolean;
	onItemUpdate?: (proposal: EventCalendarProposedUpdate) => EventCalendarUpdateResult;
	onItemsChange?: (payload: EventCalendarItemsChangePayload) => void;
	recurrenceOptions?: EventCalendarRecurrenceOptions;
};

type Harness = {
	calendar: EventCalendarState;
	/** The bound item collection as the consumer sees it (a $state proxy array). */
	readonly items: EventCalendarItem[];
	blocked: EventCalendarInteractionBlockedInfo[];
	changes: EventCalendarChange[];
	selectionChanges: EventCalendarSelection[];
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
	// A real writable binding: commitCollection reconciles selection through this setter.
	let selection = $state<EventCalendarSelection>(
		options.selection ?? EMPTY_EVENT_CALENDAR_SELECTION
	);
	const resources = $state<EventCalendarResource[]>(options.resources ?? []);
	const timeZone = $state(options.timeZone ?? 'UTC');
	let disabled = $state(options.disabled ?? false);
	let loading = $state(options.loading ?? false);
	const harness: Harness = {
		calendar: undefined as unknown as EventCalendarState,
		get items() {
			return items;
		},
		blocked: [],
		changes: [],
		selectionChanges: [],
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
			'commit-test',
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
				get views() {
					return views;
				},
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
				get resources() {
					return resources;
				},
				get timeZone() {
					return timeZone;
				},
				messages: en,
				density: 'normal',
				classes: eventCalendarTheme,
				showWeekends: true,
				weekendDays: [0, 6] as EventCalendarWeekday[],
				agendaDayCount: 30,
				get validRange() {
					return options.validRange;
				},
				get disabled() {
					return disabled;
				},
				get loading() {
					return loading;
				},
				direction: 'ltr',
				get allowOverlap() {
					return options.allowOverlap ?? true;
				},
				get historyLimit() {
					return options.historyLimit ?? 50;
				},
				get canUpdateItem() {
					return options.canUpdateItem;
				},
				get canSelectSlot() {
					return options.canSelectSlot;
				},
				get onItemUpdate() {
					return options.onItemUpdate;
				},
				get recurrenceOptions() {
					return options.recurrenceOptions;
				},
				renderers: {},
				eventHandlers: {
					onItemsChange: (payload) => {
						harness.changes.push(payload.change);
						options.onItemsChange?.(payload);
					},
					onSelectionChange: (value) => {
						harness.selectionChanges.push(value);
					},
					onInteractionBlocked: (info) => {
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

const ids = (h: Harness): string[] => h.items.map((item) => item.id);

const blockedSummary = (h: Harness): Array<{ reason: string; source: string }> =>
	h.blocked.map((info) => ({ reason: info.reason, source: info.source }));

/**
 * Asserts a thrown EventCalendarError by code. Dev-mode Svelte appends `\n\n\tin <unknown>` to
 * error messages, so the message is only ever matched by substring — never exactly.
 */
const expectCalendarError = (
	run: () => void,
	code: EventCalendarErrorCode,
	messagePart?: string
): EventCalendarError => {
	try {
		run();
	} catch (error) {
		expect(error).toBeInstanceOf(EventCalendarError);
		const calendarError = error as EventCalendarError;
		expect(calendarError.code).toBe(code);
		if (messagePart !== undefined) expect(calendarError.message).toContain(messagePart);
		return calendarError;
	}
	throw new Error(`Expected EventCalendarError '${code}'.`);
};

const lastChange = (h: Harness): EventCalendarChange => {
	const change = h.changes.at(-1);
	if (!change) throw new Error('Expected a committed change.');
	return change;
};

describe('commit phase — api mutation gates', () => {
	test('updateItem with an unknown id throws missing-target', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')]
		});
		expectCalendarError(
			() =>
				h.calendar.updateItem(
					timedItem('ghost', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z')
				),
			'missing-target',
			'Unknown EventCalendar item: ghost.'
		);
		expect(ids(h)).toEqual(['a']);
		expect(h.changes).toHaveLength(0);
	});

	test('a disabled calendar reports every api mutation as blocked without throwing', () => {
		const h = setup({
			disabled: true,
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')],
			selection: { kind: 'item', itemKey: 'a', slot: null }
		});
		// copySelection has no disabled guard: it fills the clipboard even while disabled.
		expect(h.calendar.copySelection()).toBe(true);
		expect(() => {
			h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
			h.calendar.addItem(timedItem('b', '2026-07-15T13:00:00.000Z', '2026-07-15T14:00:00.000Z'));
			h.calendar.removeItem('a');
		}).not.toThrow();
		// paste() reports the same disabled block through blockDisabledApiMutation and fails.
		expect(h.calendar.paste()).toBe(false);
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.changes).toHaveLength(0);
		expect(blockedSummary(h)).toEqual([
			{ reason: 'disabled', source: 'api' },
			{ reason: 'disabled', source: 'api' },
			{ reason: 'disabled', source: 'api' },
			{ reason: 'disabled', source: 'api' }
		]);
	});

	test('onItemUpdate returning false rejects the commit as custom-policy', () => {
		let updateCalls = 0;
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			onItemUpdate: () => {
				updateCalls += 1;
				return false;
			}
		});
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(updateCalls).toBe(1);
		expect(h.changes).toHaveLength(0);
		expect(ids(h)).toEqual(['a']);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(blockedSummary(h)).toEqual([{ reason: 'custom-policy', source: 'api' }]);
		expect(h.blocked[0].proposal?.item.id).toBe('a');
	});

	test('an onItemUpdate adjustment commits the adjusted placement in an update change', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			onItemUpdate: () => ({
				start: new Date('2026-07-15T12:00:00.000Z'),
				end: new Date('2026-07-15T13:00:00.000Z')
			})
		});
		// The updateItem argument asks for 11:00–12:00; the resolver's 12:00–13:00 wins.
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(h.items).toHaveLength(1);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T12:00:00.000Z'));
		expect(h.items[0].end).toEqual(new Date('2026-07-15T13:00:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'update') throw new Error(`expected update change, got ${change.kind}`);
		expect(change.source).toBe('api');
		// The change item is the exact element the published bound array exposes.
		expect(change.item).toBe(h.items[0]);
		expect(change.previousItem.start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(change.previousItem.end).toEqual(new Date('2026-07-15T10:00:00.000Z'));
		expect(h.blocked).toHaveLength(0);
	});

	test('an onItemUpdate adjustment producing an invalid placement throws invalid-adjustment', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			// A five-minute placement is below the default snapDuration of 15 minutes.
			onItemUpdate: () => ({
				start: new Date('2026-07-15T11:00:00.000Z'),
				end: new Date('2026-07-15T11:05:00.000Z')
			})
		});
		const error = expectCalendarError(
			() =>
				h.calendar.updateItem(
					timedItem('a', '2026-07-15T12:00:00.000Z', '2026-07-15T13:00:00.000Z')
				),
			'invalid-adjustment',
			'invalid adjustment'
		);
		expect(error.details).toMatchObject({ reason: 'invalid-target', id: 'a' });
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(h.changes).toHaveLength(0);
	});

	test('a reentrant items write inside onItemUpdate aborts the commit as stale', () => {
		let armed = false;
		let replaceItems: ((next: EventCalendarItem[]) => void) | null = null;
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			onItemUpdate: () => {
				if (armed && replaceItems) {
					armed = false;
					replaceItems([
						timedItem('externally-set', '2026-07-16T09:00:00.000Z', '2026-07-16T10:00:00.000Z')
					]);
				}
				return undefined;
			}
		});
		replaceItems = h.replaceItems;
		armed = true;
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		// The boundary assert after the callback refuses the commit; the external write wins.
		expect(ids(h)).toEqual(['externally-set']);
		expect(h.changes).toHaveLength(0);
		expect(blockedSummary(h)).toEqual([{ reason: 'stale', source: 'api' }]);
	});

	test('a resolver-side loading change blocks an otherwise unadjusted commit', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			onItemUpdate: () => {
				h.setLoading(true);
				return undefined;
			}
		});
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(h.changes).toHaveLength(0);
		expect(blockedSummary(h)).toEqual([{ reason: 'disabled', source: 'api' }]);
	});

	test('a validator can accept the initial proposal and reject it in the final policy phase', () => {
		let validationCalls = 0;
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			canUpdateItem: () => validationCalls++ === 0,
			onItemUpdate: () => undefined
		});
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(validationCalls).toBe(2);
		expect(ids(h)).toEqual(['a']);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(h.changes).toHaveLength(0);
		expect(blockedSummary(h)).toEqual([{ reason: 'custom-policy', source: 'api' }]);
	});

	test('an unadjusted resolver preserves all three custom recurrence validation phases', () => {
		let expansionCalls = 0;
		let expansionCallsAtPublication = 0;
		const h = setup({
			items: [dailySeries('series', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			recurrenceOptions: {
				expand: ({ item }) => {
					expansionCalls += 1;
					return [
						{
							allDay: false,
							start: new Date(item.start),
							end: new Date(item.end),
							originalStart: new Date(item.start)
						}
					];
				}
			},
			onItemUpdate: () => undefined,
			onItemsChange: () => {
				expansionCallsAtPublication = expansionCalls;
			}
		});
		expansionCalls = 0;
		h.calendar.updateItem(
			dailySeries('series', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z')
		);
		flushSync();
		expect(expansionCallsAtPublication).toBe(3);
		expect(expansionCalls).toBeGreaterThanOrEqual(expansionCallsAtPublication);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T11:00:00.000Z'));
		expect(h.changes).toHaveLength(1);
	});
});

describe('commit phase — guarded revert', () => {
	test('change.revert restores the previous items exactly once', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')]
		});
		h.calendar.addItem(timedItem('b', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		expect(ids(h)).toEqual(['a', 'b']);
		const change = lastChange(h);
		expect(change.kind).toBe('add');
		change.revert();
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expectCalendarError(() => change.revert(), 'stale-transaction', 'can no longer be reverted');
	});

	test('change.revert after an external items replacement throws stale-transaction', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')]
		});
		h.calendar.addItem(timedItem('b', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		const change = lastChange(h);
		h.replaceItems([
			timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
			timedItem('b', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'),
			timedItem('outside', '2026-07-15T13:00:00.000Z', '2026-07-15T14:00:00.000Z')
		]);
		// The committed boundary is no longer current, so the guarded transaction refuses.
		expectCalendarError(() => change.revert(), 'stale-transaction');
		expect(ids(h)).toEqual(['a', 'b', 'outside']);
	});
});

describe('commit phase — proposal validation order', () => {
	test('a canUpdateItem rejection blocks as custom-policy before onItemUpdate runs', () => {
		const proposals: EventCalendarProposedUpdate[] = [];
		let updateCalls = 0;
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z')],
			canUpdateItem: (proposal) => {
				proposals.push(proposal);
				return false;
			},
			onItemUpdate: () => {
				updateCalls += 1;
				return true;
			}
		});
		h.calendar.updateItem(timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'));
		flushSync();
		// validateProposal's canUpdateItem gate runs before the resolve/commit stage.
		expect(proposals).toHaveLength(1);
		expect(updateCalls).toBe(0);
		expect(h.changes).toHaveLength(0);
		expect(ids(h)).toEqual(['a']);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(blockedSummary(h)).toEqual([{ reason: 'custom-policy', source: 'api' }]);
	});

	test('a readOnly item rejects a non-api proposal as read-only while api updates bypass it', () => {
		const h = setup({
			items: [
				{
					...timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
					readOnly: true
				}
			]
		});
		const previousItem = h.items.find((item) => item.id === 'a');
		if (!previousItem) throw new Error('expected item a');
		// commitProposal is the internal commit entry the interactions controller calls for non-api
		// sources; calendar.mutations.commitProposal mirrors that call site without a DOM gesture.
		const committed = h.calendar.mutations.commitProposal({
			kind: 'move',
			source: 'drag',
			previousItem,
			item: {
				...timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'),
				readOnly: true
			}
		});
		expect(committed).toBe(false);
		expect(blockedSummary(h)).toEqual([{ reason: 'read-only', source: 'drag' }]);
		expect(h.items[0].start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(h.changes).toHaveLength(0);

		// The same readOnly item committed through the api source bypasses the read-only gate.
		h.calendar.updateItem({
			...timedItem('a', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'),
			readOnly: true
		});
		flushSync();
		expect(h.items[0].start).toEqual(new Date('2026-07-15T11:00:00.000Z'));
		expect(h.items[0].readOnly).toBe(true);
		const change = lastChange(h);
		expect(change.kind).toBe('update');
		expect(change.source).toBe('api');
	});
});

describe('commit phase — recurrence proposals', () => {
	test('an occurrence-scope edit on a series occurrence adds a recurrence exception', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')]
		});
		h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
			start: new Date('2026-07-15T13:00:00.000Z'),
			end: new Date('2026-07-15T14:00:00.000Z')
		});
		flushSync();
		expect(h.items).toHaveLength(2);
		const exception = h.items.find((item) => item.recurringItemId === 'series');
		expect(exception).toBeDefined();
		expect(exception?.originalStart).toEqual(origin);
		expect(exception?.start).toEqual(new Date('2026-07-15T13:00:00.000Z'));
		expect(exception?.end).toEqual(new Date('2026-07-15T14:00:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'recurrence-exception-add') {
			throw new Error(`expected recurrence-exception-add, got ${change.kind}`);
		}
		expect(change.source).toBe('api');
		expect(change.seriesItem.id).toBe('series');
		expect(change.item.recurringItemId).toBe('series');
		expect(change.item.originalStart).toEqual(origin);
		expect(change.item.id).toBe(`series--exception--instant-${origin.getTime()}`);
	});

	test('an occurrence-scope edit on an existing exception updates it in place', () => {
		const origin = new Date('2026-07-16T09:00:00.000Z');
		const h = setup({
			items: [
				dailySeries('series', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'),
				{
					id: 'series-x',
					title: 'Moved once',
					start: new Date('2026-07-16T11:00:00.000Z'),
					end: new Date('2026-07-16T12:00:00.000Z'),
					recurringItemId: 'series',
					originalStart: origin
				}
			]
		});
		h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
			start: new Date('2026-07-16T13:00:00.000Z'),
			end: new Date('2026-07-16T14:00:00.000Z')
		});
		flushSync();
		// The exception is rewritten in place; the collection does not grow.
		expect(ids(h)).toEqual(['series', 'series-x']);
		const committed = h.items.find((item) => item.id === 'series-x');
		expect(committed?.start).toEqual(new Date('2026-07-16T13:00:00.000Z'));
		expect(committed?.end).toEqual(new Date('2026-07-16T14:00:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'recurrence-exception-update') {
			throw new Error(`expected recurrence-exception-update, got ${change.kind}`);
		}
		expect(change.source).toBe('api');
		expect(change.seriesItem.id).toBe('series');
		expect(change.item.id).toBe('series-x');
		expect(change.previousItem.id).toBe('series-x');
		expect(change.previousItem.start).toEqual(new Date('2026-07-16T11:00:00.000Z'));
	});

	test('a series-scope edit publishes a recurrence-series-update change', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')],
			recurrenceOptions: { editScope: 'series' }
		});
		h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
			start: new Date('2026-07-15T10:00:00.000Z'),
			end: new Date('2026-07-15T10:30:00.000Z')
		});
		flushSync();
		// The series source is rewritten in place under the same id.
		expect(ids(h)).toEqual(['series']);
		const series = h.items.find((item) => item.id === 'series');
		expect(series?.start).toEqual(new Date('2026-07-13T10:00:00.000Z'));
		expect(series?.end).toEqual(new Date('2026-07-13T10:30:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'recurrence-series-update') {
			throw new Error(`expected recurrence-series-update, got ${change.kind}`);
		}
		expect(change.source).toBe('api');
		expect(change.operation).toBe('move');
		expect(change.seriesItem.id).toBe('series');
		expect(change.seriesItem.start).toEqual(new Date('2026-07-13T10:00:00.000Z'));
		expect(change.previousSeriesItem.id).toBe('series');
		expect(change.previousSeriesItem.start).toEqual(new Date('2026-07-13T09:00:00.000Z'));
		expect(change.exceptionItems).toEqual([]);
		expect(change.previousExceptionItems).toEqual([]);
	});

	test("editScope 'disabled' reports the occurrence edit as blocked without committing", () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')],
			recurrenceOptions: { editScope: 'disabled' }
		});
		expect(() =>
			h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
				start: new Date('2026-07-15T13:00:00.000Z'),
				end: new Date('2026-07-15T14:00:00.000Z')
			})
		).not.toThrow();
		flushSync();
		expect(h.items).toHaveLength(1);
		expect(h.changes).toHaveLength(0);
		expect(blockedSummary(h)).toEqual([{ reason: 'disabled', source: 'api' }]);
	});

	test('a series-scope edit remaps a selected recurring occurrence key', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')],
			recurrenceOptions: { editScope: 'series' }
		});
		const selectedKey = createRecurringOccurrenceKey('series', origin);
		h.calendar.select({ kind: 'item', itemKey: selectedKey, slot: null });
		flushSync();
		h.calendar.updateOccurrence(selectedKey, {
			start: new Date('2026-07-15T10:00:00.000Z'),
			end: new Date('2026-07-15T10:30:00.000Z')
		});
		flushSync();
		// The selection follows the one-hour move: the key encodes the shifted origin.
		const remappedKey = createRecurringOccurrenceKey(
			'series',
			new Date('2026-07-15T10:00:00.000Z')
		);
		expect(remappedKey).not.toBe(selectedKey);
		expect(h.calendar.selection).toStrictEqual({
			kind: 'item',
			itemKey: remappedKey,
			slot: null
		});
		expect(h.selectionChanges.at(-1)).toEqual({
			kind: 'item',
			itemKey: remappedKey,
			slot: null
		});
		expect(decodeRecurringOccurrenceKey(remappedKey)?.seriesId).toBe('series');
		const occurrence = h.calendar.getOccurrence(remappedKey);
		expect(occurrence?.item.id).toBe('series');
		expect(occurrence?.isRecurring).toBe(true);
		// The pre-move key no longer resolves against the shifted series.
		expect(h.calendar.getOccurrence(selectedKey)).toBeNull();
	});

	test('updateOccurrence with an unknown key throws missing-target', () => {
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')]
		});
		expectCalendarError(
			() =>
				h.calendar.updateOccurrence('unknown-key', {
					start: new Date('2026-07-15T13:00:00.000Z'),
					end: new Date('2026-07-15T14:00:00.000Z')
				}),
			'missing-target',
			'Unknown EventCalendar occurrence: unknown-key.'
		);
		expect(ids(h)).toEqual(['series']);
		expect(h.changes).toHaveLength(0);
	});

	test('an onItemUpdate adjustment that invalidates a series edit throws invalid-adjustment', () => {
		const origin = new Date('2026-07-15T09:00:00.000Z');
		const h = setup({
			items: [dailySeries('series', '2026-07-13T09:00:00.000Z', '2026-07-13T09:30:00.000Z')],
			recurrenceOptions: { editScope: 'series' },
			// Shrinking the series source to five minutes fails the snap-duration floor on
			// revalidation after the series mutation is regenerated.
			onItemUpdate: () => ({ end: new Date('2026-07-13T09:05:00.000Z') })
		});
		const error = expectCalendarError(
			() =>
				h.calendar.updateOccurrence(createRecurringOccurrenceKey('series', origin), {
					end: new Date('2026-07-15T10:30:00.000Z')
				}),
			'invalid-adjustment',
			'recurring adjustment'
		);
		expect(error.details).toMatchObject({ reason: 'invalid-target', id: 'series' });
		flushSync();
		expect(h.items[0].start).toEqual(new Date('2026-07-13T09:00:00.000Z'));
		expect(h.items[0].end).toEqual(new Date('2026-07-13T09:30:00.000Z'));
		expect(h.changes).toHaveLength(0);
	});
});

describe('commit phase — clipboard', () => {
	test('paste onto a slot selection clones the item onto the slot and selects the copy', () => {
		const h = setup({
			view: 'week',
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')]
		});
		h.calendar.select({ kind: 'item', itemKey: 'a', slot: null });
		expect(h.calendar.copySelection()).toBe(true);
		h.calendar.select({
			kind: 'slot',
			itemKey: null,
			slot: {
				view: 'week',
				allDay: false,
				start: new Date('2026-07-15T13:00:00.000Z'),
				end: new Date('2026-07-15T13:30:00.000Z')
			}
		});
		expect(h.calendar.paste()).toBe(true);
		flushSync();
		expect(ids(h)).toEqual(['a', 'a-copy']);
		const pasted = h.items.find((item) => item.id === 'a-copy');
		// The slot supplies the start; the copy keeps the source's 30-minute duration.
		expect(pasted?.start).toEqual(new Date('2026-07-15T13:00:00.000Z'));
		expect(pasted?.end).toEqual(new Date('2026-07-15T13:30:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'add') throw new Error(`expected add change, got ${change.kind}`);
		expect(change.source).toBe('clipboard');
		expect(change.item.id).toBe('a-copy');
		// paste() selects the pasted occurrence on the way out.
		expect(h.calendar.selection).toStrictEqual({
			kind: 'item',
			itemKey: 'a-copy',
			slot: null
		});
	});

	test('paste without a slot selection keeps the copied placement', () => {
		const h = setup({
			items: [timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T09:30:00.000Z')]
		});
		h.calendar.select({ kind: 'item', itemKey: 'a', slot: null });
		expect(h.calendar.copySelection()).toBe(true);
		h.calendar.clearSelection();
		expect(h.calendar.paste()).toBe(true);
		flushSync();
		expect(ids(h)).toEqual(['a', 'a-copy']);
		const pasted = h.items.find((item) => item.id === 'a-copy');
		expect(pasted?.start).toEqual(new Date('2026-07-15T09:00:00.000Z'));
		expect(pasted?.end).toEqual(new Date('2026-07-15T09:30:00.000Z'));
		const change = lastChange(h);
		if (change.kind !== 'add') throw new Error(`expected add change, got ${change.kind}`);
		expect(change.source).toBe('clipboard');
		expect(change.item.id).toBe('a-copy');
		expect(h.calendar.selection).toStrictEqual({
			kind: 'item',
			itemKey: 'a-copy',
			slot: null
		});
	});
});

describe('commit phase — history boundary', () => {
	test('historyLimit 0 records no undo entry for a commit', () => {
		const h = setup({ historyLimit: 0 });
		h.calendar.addItem(timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'));
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.calendar.canUndo()).toBe(false);
		expect(h.calendar.undo()).toBe(false);
	});

	test('undo then redo replays the committed items', () => {
		const h = setup();
		h.calendar.addItem(timedItem('a', '2026-07-15T09:00:00.000Z', '2026-07-15T10:00:00.000Z'));
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.calendar.canUndo()).toBe(true);
		expect(h.calendar.undo()).toBe(true);
		flushSync();
		expect(ids(h)).toEqual([]);
		expect(h.calendar.canUndo()).toBe(false);
		expect(h.calendar.canRedo()).toBe(true);
		expect(h.calendar.redo()).toBe(true);
		flushSync();
		expect(ids(h)).toEqual(['a']);
		expect(h.calendar.canRedo()).toBe(false);
	});
});
