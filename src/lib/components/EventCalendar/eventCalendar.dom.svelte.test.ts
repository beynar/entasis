// Characterization tests: pin the observable behaviour of the current EventCalendar
// implementation so the planned internal rewrite can be verified against it. Assertions
// describe what the component does today — including non-obvious behaviour such as the
// assisted two-click "single-pointer" slot gesture and start-only `aria-selected` marking —
// not what the redesign intends. Anything that needs real layout, pointer capture, or native
// drag geometry is out of scope for jsdom and noted as e2e candidates instead.
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, waitFor } from '@testing-library/svelte';
import { createRawSnippet, tick } from 'svelte';
import { describe, expect, test, vi } from 'vitest';
import Harness, {
	type EventCalendarTestHarnessProps
} from './EventCalendarTestHarness.test.svelte';
import type {
	EventCalendarEmptyPayload,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarItemsChangePayload,
	EventCalendarItemClickPayload,
	EventCalendarMonthCellPayload,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarSlotClickPayload,
	EventCalendarSlotSelectPayload
} from './index.js';

/** The registries, announcements, and Svelte re-renders all schedule from microtasks. */
const flush = async () => {
	for (let round = 0; round < 4; round += 1) {
		await tick();
		await Promise.resolve();
	}
};

const planning: EventCalendarItem = {
	id: 'planning',
	title: 'Planning',
	start: new Date('2026-07-15T09:00:00.000Z'),
	end: new Date('2026-07-15T10:00:00.000Z')
};

const review: EventCalendarItem = {
	id: 'review',
	title: 'Review',
	start: new Date('2026-07-16T14:00:00.000Z'),
	end: new Date('2026-07-16T15:00:00.000Z')
};

const resources: EventCalendarResource[] = [
	{ id: 'r1', title: 'Room 1' },
	{ id: 'r2', title: 'Room 2' }
];

const renderCalendar = (props: EventCalendarTestHarnessProps = {}) => render(Harness, { props });

const part = <T extends HTMLElement>(name: string, scope: Document | Element = document) =>
	scope.querySelector<T>(`[data-event-calendar-part="${name}"]`);

const parts = <T extends HTMLElement>(name: string, scope: Document | Element = document) => [
	...scope.querySelectorAll<T>(`[data-event-calendar-part="${name}"]`)
];

const monthCell = (day: string, scope: Document | Element = document) => {
	const node = scope.querySelector<HTMLElement>(
		`[data-event-calendar-part="month-cell"][data-day="${day}"]`
	);
	if (!node) throw new Error(`no month cell for ${day}`);
	return node;
};

const occurrenceControl = (key: string, scope: Document | Element = document) => {
	const node = scope.querySelector<HTMLElement>(`[data-occurrence-key="${key}"] button`);
	if (!node) throw new Error(`no control for ${key}`);
	return node;
};

const timeSlot = (day: string, startIso: string, scope: Document | Element = document) => {
	const node = scope.querySelector<HTMLElement>(
		`[data-event-calendar-part="day-column"][data-day="${day}"] [data-event-calendar-part="time-slot"][data-slot-start="${startIso}"]`
	);
	if (!node) throw new Error(`no time slot ${startIso} on ${day}`);
	return node;
};

const allDayHitArea = (day: string, scope: Document | Element = document) => {
	const node = scope.querySelector<HTMLElement>(
		`[data-event-calendar-part="all-day-cell"][data-day="${day}"] button`
	);
	if (!node) throw new Error(`no all-day hit area for ${day}`);
	return node;
};

/** The live region is rewritten for every announcement (and blanked in between). */
const trackAnnouncements = (scope: Document | Element = document) => {
	const region = scope.querySelector<HTMLElement>(
		'[data-event-calendar-part="root"] [role="status"][aria-atomic="true"]:not([data-event-calendar-part])'
	);
	if (!region) throw new Error('no live region');
	const seen: string[] = [];
	const observer = new MutationObserver(() => {
		const text = region.textContent?.trim() ?? '';
		if (text && seen.at(-1) !== text) seen.push(text);
	});
	observer.observe(region, { characterData: true, childList: true, subtree: true });
	return { seen, stop: () => observer.disconnect() };
};

const interactionStatus = (scope: Document | Element = document) =>
	scope
		.querySelector<HTMLElement>('[data-event-calendar-interaction-status]')
		?.textContent?.trim() ?? '';

describe('EventCalendar DOM structure', () => {
	test('month view renders the stable part tree and 6-week grid', () => {
		const { container } = renderCalendar({ items: [planning] });

		const root = part('root', container);
		expect(root).not.toBeNull();
		expect(root).toHaveAttribute('role', 'region');
		expect(root).toHaveAttribute('aria-label', 'Event calendar');
		expect(root).toHaveAttribute('data-view', 'month');
		expect(
			root!.querySelector('[role="status"][aria-live="polite"][aria-atomic="true"]')
		).not.toBeNull();
		expect(root!.querySelector('[data-event-calendar-interaction-status]')).not.toBeNull();
		expect(part('header', container)).not.toBeNull();
		expect(part('navigation', container)).not.toBeNull();
		expect(part('title', container)).not.toBeNull();
		expect(part('view-switcher', container)).not.toBeNull();

		const content = part('content', container);
		expect(content).toHaveAttribute('data-view', 'month');
		expect(content).toHaveAttribute('aria-busy', 'false');
		expect(part('month', container)).not.toBeNull();
		expect(part('month-header', container)).not.toBeNull();
		expect(parts('day-header', container)).toHaveLength(7);
		expect(part('month-grid', container)).not.toBeNull();
		expect(parts('week-row', container)).toHaveLength(6);

		const cells = parts('month-cell', container).filter((cell) => cell.hasAttribute('data-day'));
		expect(cells).toHaveLength(42);
		expect(cells[0]).toHaveAttribute('data-day', '2026-06-28');
		expect(cells.at(-1)).toHaveAttribute('data-day', '2026-08-08');
		expect(parts('day-number', container).length).toBeGreaterThan(0);
	});

	test('month cells expose gridcell ARIA, roving tabindex, and drop-target metadata', () => {
		const { container } = renderCalendar({
			items: [planning],
			availability: { offDays: true }
		});

		const cell = monthCell('2026-07-15', container);
		expect(cell).toHaveAttribute('role', 'gridcell');
		expect(cell).toHaveAttribute('aria-label', 'Wednesday, July 15, 2026');
		expect(cell).toHaveAttribute('aria-disabled', 'false');
		expect(cell).toHaveAttribute('aria-selected', 'false');
		expect(cell).toHaveAttribute('data-event-calendar-drop-target', 'month-day');
		expect(cell).toHaveAttribute('data-drop-view', 'month');
		expect(cell).toHaveAttribute('data-drop-all-day', 'true');
		expect(cell).toHaveAttribute('data-event-calendar-target-key', 'month:2026-07-15');
		expect(cell).toHaveAttribute('data-calendar-instance-id');

		// Exactly one roving tab stop, on the first grid day.
		const tabStops = parts('month-cell', container).filter((node) => node.tabIndex === 0);
		expect(tabStops.map((node) => node.dataset.day)).toEqual(['2026-06-28']);

		// Outside/current-month and configured off-day markers.
		expect(monthCell('2026-06-28', container)).toHaveAttribute('data-outside');
		expect(monthCell('2026-07-15', container)).not.toHaveAttribute('data-outside');
		expect(monthCell('2026-07-18', container)).toHaveAttribute('data-off-day');
		expect(monthCell('2026-07-15', container)).not.toHaveAttribute('data-off-day');
	});

	test('week view renders the time-grid parts and timed slot buttons', () => {
		const { container } = renderCalendar({
			view: 'week',
			items: [planning],
			timeGrid: { startHour: 8, endHour: 12, scrollToHour: 8 }
		});

		expect(part('root', container)).toHaveAttribute('data-view', 'week');
		const grid = part('time-grid', container);
		expect(grid).not.toBeNull();
		expect(grid).toHaveAttribute('data-view', 'week');
		expect(grid!.getAttribute('aria-label')).toContain('Week');
		expect(part('time-header', container)).not.toBeNull();
		expect(parts('day-header', container)).toHaveLength(7);
		expect(parts('time-gutter', container).length).toBeGreaterThan(0);
		expect(parts('time-label', container).length).toBeGreaterThan(0);
		expect(part('all-day-row', container)).not.toBeNull();
		expect(parts('all-day-cell', container)).toHaveLength(7);

		const columns = parts('day-column', container);
		expect(columns).toHaveLength(7);
		expect(columns[0]).toHaveAttribute('data-day', '2026-07-12');
		expect(columns.at(-1)).toHaveAttribute('data-day', '2026-07-18');

		const slot = timeSlot('2026-07-15', '2026-07-15T08:00:00.000Z', container);
		expect(slot).toHaveAttribute('data-slot-end', '2026-07-15T08:30:00.000Z');
		expect(slot).toHaveAttribute('data-event-calendar-drop-target', 'time-slot');
		expect(slot).toHaveAttribute('data-drop-view', 'week');
		expect(slot).toHaveAttribute('data-drop-all-day', 'false');
		expect(slot).toHaveAttribute('aria-pressed', 'false');
		expect(slot.dataset.eventCalendarTargetKey).toContain('week:timed:');
	});

	test('day and days views vary only the rendered column count', () => {
		const day = renderCalendar({
			view: 'day',
			items: [planning],
			timeGrid: { startHour: 8, endHour: 10, scrollToHour: 8 }
		});
		expect(part('time-grid', day.container)).toHaveAttribute('data-view', 'day');
		expect(parts('day-column', day.container)).toHaveLength(1);
		expect(part('day-column', day.container)).toHaveAttribute('data-day', '2026-07-15');
		day.unmount();

		const days = renderCalendar({
			view: 'days',
			dayCount: 3,
			items: [planning],
			timeGrid: { startHour: 8, endHour: 10, scrollToHour: 8 }
		});
		expect(part('time-grid', days.container)).toHaveAttribute('data-view', 'days');
		const columns = parts('day-column', days.container);
		expect(columns).toHaveLength(3);
		expect(columns.map((node) => node.dataset.day)).toEqual([
			'2026-07-15',
			'2026-07-16',
			'2026-07-17'
		]);
	});

	test('resource view renders one column per leaf plus the unassigned column', () => {
		const { container } = renderCalendar({
			view: 'resource',
			resources,
			items: [planning],
			timeGrid: { startHour: 8, endHour: 10, scrollToHour: 8 }
		});

		expect(part('root', container)).toHaveAttribute('data-view', 'resource');
		const columns = parts('day-column', container);
		expect(columns).toHaveLength(3);
		expect(columns.map((node) => node.dataset.resourceId)).toEqual(['r1', 'r2', undefined]);

		const headers = parts('resource-header', container);
		expect(headers).toHaveLength(3);
		expect(headers[0]).toHaveAttribute('data-resource-id', 'r1');
		expect(headers[1]).toHaveAttribute('data-resource-id', 'r2');
		expect(headers[2]).toHaveAttribute('data-unassigned');
	});

	test('resource projections keep one roving tab stop and navigate by column', async () => {
		const sharedTimed: EventCalendarItem = {
			id: 'shared-timed',
			title: 'Shared timed',
			start: new Date('2026-07-15T09:00:00.000Z'),
			end: new Date('2026-07-15T10:00:00.000Z'),
			resourceIds: ['r1', 'r2']
		};
		const sharedAllDay: EventCalendarItem = {
			id: 'shared-all-day',
			title: 'Shared all day',
			allDay: true,
			start: '2026-07-15',
			end: '2026-07-16',
			resourceIds: ['r1', 'r2']
		};
		const { container } = renderCalendar({
			view: 'resource',
			resources,
			items: [sharedTimed, sharedAllDay],
			timeGrid: { startHour: 8, endHour: 12, scrollToHour: 8 }
		});
		await flush();

		const projections = parts('item', container).filter((node) =>
			['shared-timed', 'shared-all-day'].includes(node.dataset.occurrenceKey ?? '')
		);
		const navigationKeys = projections
			.map((node) => node.parentElement?.dataset.eventCalendarNavigationKey)
			.filter((key): key is string => key !== undefined);
		expect(navigationKeys).toHaveLength(4);
		expect(new Set(navigationKeys).size).toBe(navigationKeys.length);

		const timedControls = ['r1', 'r2'].map((resourceId) => {
			const column = container.querySelector<HTMLElement>(
				`[data-event-calendar-part="day-column"][data-resource-id="${resourceId}"]`
			);
			const control = column?.querySelector<HTMLElement>(
				'[data-event-calendar-part="item"][data-occurrence-key="shared-timed"] button'
			);
			if (!control) throw new Error(`missing timed projection for ${resourceId}`);
			return control;
		});
		timedControls[0].focus();
		await flush();
		expect(
			projections
				.map((node) => node.querySelector<HTMLElement>('button'))
				.filter((node) => node?.tabIndex === 0)
		).toHaveLength(1);

		await fireEvent.keyDown(timedControls[0], { key: 'ArrowRight' });
		await flush();
		expect(document.activeElement).toBe(timedControls[1]);
	});

	test('agenda view renders a list grouped by day', () => {
		const { container } = renderCalendar({
			view: 'agenda',
			items: [planning, review],
			agendaDayCount: 7,
			agendaDetails: createRawSnippet(() => ({ render: () => '<p>Details</p>' }))
		});

		expect(part('root', container)).toHaveAttribute('data-view', 'agenda');
		const agenda = part('agenda', container);
		expect(agenda).not.toBeNull();
		expect(agenda).toHaveAttribute('role', 'list');
		expect(agenda).toHaveAttribute('data-day-count', '7');

		const days = parts('agenda-day', container);
		expect(days).toHaveLength(2);
		expect(days[0]).toHaveAttribute('data-day', '2026-07-15');
		expect(days[0]).toHaveAttribute('data-count', '1');
		expect(days[1]).toHaveAttribute('data-day', '2026-07-16');

		const agendaItems = parts('agenda-item', container);
		expect(agendaItems).toHaveLength(2);
		expect(agendaItems[0]).toHaveAttribute('data-occurrence-key', 'planning');
		expect(agendaItems[1]).toHaveAttribute('data-occurrence-key', 'review');
		expect(part('agenda-details', container)).not.toBeNull();
	});
});

describe('onItemClick and default item selection', () => {
	test('clicking a month occurrence reports { occurrence, event } and selects it', async () => {
		const onItemClick = vi.fn<(payload: EventCalendarItemClickPayload) => void>();
		const onSelectionChange = vi.fn<(selection: EventCalendarSelection) => void>();
		const props: EventCalendarTestHarnessProps = {
			items: [planning],
			onItemClick,
			onSelectionChange
		};
		const { container, component } = renderCalendar(props);

		const control = occurrenceControl('planning', container);
		await fireEvent.click(control);
		await flush();

		expect(onItemClick).toHaveBeenCalledTimes(1);
		const payload = onItemClick.mock.calls[0][0];
		expect(payload.occurrence.key).toBe('planning');
		expect(payload.occurrence.item.id).toBe('planning');
		expect(payload.event).toBeInstanceOf(MouseEvent);
		expect(control).toHaveAttribute('aria-pressed', 'true');
		expect(part('item', container)).toHaveAttribute('data-selected');
		expect(onSelectionChange).toHaveBeenCalledWith({
			kind: 'item',
			itemKey: 'planning',
			slot: null
		});
		expect(component.getSelection()).toEqual({
			kind: 'item',
			itemKey: 'planning',
			slot: null
		});
	});

	test('preventDefault() inside onItemClick suppresses the default selection', async () => {
		const onSelectionChange = vi.fn();
		const { container } = renderCalendar({
			items: [planning],
			onItemClick: ({ event }) => event.preventDefault(),
			onSelectionChange
		});

		const control = occurrenceControl('planning', container);
		await fireEvent.click(control);
		await flush();

		expect(control).toHaveAttribute('aria-pressed', 'false');
		expect(part('item', container)).not.toHaveAttribute('data-selected');
		expect(onSelectionChange).not.toHaveBeenCalled();
	});

	test('agenda items report the same click payload shape', async () => {
		const onItemClick = vi.fn<(payload: EventCalendarItemClickPayload) => void>();
		const { container } = renderCalendar({
			view: 'agenda',
			items: [planning],
			agendaDayCount: 7,
			onItemClick
		});

		await fireEvent.click(occurrenceControl('planning', container));
		await flush();

		expect(onItemClick).toHaveBeenCalledTimes(1);
		const payload = onItemClick.mock.calls[0][0];
		expect(payload.occurrence.key).toBe('planning');
		expect(payload.event).toBeInstanceOf(MouseEvent);
		expect(occurrenceControl('planning', container)).toHaveAttribute('aria-pressed', 'true');
	});
});

describe('onSlotClick, onSelect, and the two-click single-pointer gesture', () => {
	test('first month-cell click reports an all-day civil slot and starts an assisted gesture', async () => {
		const onSlotClick = vi.fn<(payload: EventCalendarSlotClickPayload) => void>();
		const onSelect = vi.fn<(payload: EventCalendarSlotSelectPayload) => void>();
		const onSelectionChange = vi.fn<(selection: EventCalendarSelection) => void>();
		const { container } = renderCalendar({ onSlotClick, onSelect, onSelectionChange });

		const cell = monthCell('2026-07-15', container);
		await fireEvent.click(cell);
		await flush();

		expect(onSlotClick).toHaveBeenCalledTimes(1);
		const { slot, event } = onSlotClick.mock.calls[0][0];
		expect(slot).toMatchObject({
			view: 'month',
			allDay: true,
			start: '2026-07-15',
			end: '2026-07-16'
		});
		expect(event).toBeInstanceOf(MouseEvent);
		expect(document.activeElement).toBe(cell);

		// The click already applied a selection…
		expect(cell).toHaveAttribute('aria-selected', 'true');
		expect(onSelectionChange).toHaveBeenCalledWith({
			kind: 'slot',
			itemKey: null,
			slot: { view: 'month', allDay: true, start: '2026-07-15', end: '2026-07-16' }
		});
		// …and opened an assisted single-pointer gesture instead of calling onSelect.
		expect(onSelect).not.toHaveBeenCalled();
		const root = part('root', container);
		expect(root).toHaveAttribute('data-interaction-kind', 'slot-create');
		expect(root).toHaveAttribute('data-interaction-input', 'assisted');
		expect(root).toHaveAttribute('data-interaction-valid', 'true');
		expect(cell.querySelector('[data-event-calendar-part="slot-selection"]')).not.toBeNull();
		expect(interactionStatus(container)).toBe(
			'Select calendar range. Valid target. Time zone: UTC'
		);
	});

	test('a second compatible click merges the range and reports onSelect', async () => {
		const onSlotClick = vi.fn<(payload: EventCalendarSlotClickPayload) => void>();
		const onSelect = vi.fn<(payload: EventCalendarSlotSelectPayload) => void>();
		const { container } = renderCalendar({ onSlotClick, onSelect });

		await fireEvent.click(monthCell('2026-07-15', container));
		await fireEvent.click(monthCell('2026-07-17', container));
		await flush();

		// onSlotClick still reports the individually clicked day.
		expect(onSlotClick).toHaveBeenCalledTimes(2);
		expect(onSlotClick.mock.calls[1][0].slot).toMatchObject({
			start: '2026-07-17',
			end: '2026-07-18'
		});
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect.mock.calls[0][0]).toEqual({
			slot: {
				view: 'month',
				allDay: true,
				start: '2026-07-15',
				end: '2026-07-18',
				resourceId: undefined
			},
			info: { source: 'single-pointer' }
		});

		// The gesture closed; only the merged range's start cell stays marked selected.
		expect(part('root', container)).not.toHaveAttribute('data-interaction-kind');
		expect(monthCell('2026-07-15', container)).toHaveAttribute('aria-selected', 'true');
		expect(monthCell('2026-07-16', container)).toHaveAttribute('aria-selected', 'false');
		expect(monthCell('2026-07-17', container)).toHaveAttribute('aria-selected', 'false');
	});

	test('preventDefault() inside onSlotClick suppresses selection and the gesture', async () => {
		const onSelectionChange = vi.fn();
		const { container } = renderCalendar({
			onSlotClick: ({ event }) => event.preventDefault(),
			onSelectionChange
		});

		const cell = monthCell('2026-07-15', container);
		await fireEvent.click(cell);
		await flush();

		expect(cell).toHaveAttribute('aria-selected', 'false');
		expect(part('root', container)).not.toHaveAttribute('data-interaction-kind');
		expect(onSelectionChange).not.toHaveBeenCalled();
	});

	test('time-grid slot clicks report Date instants and merge on the second click', async () => {
		const onSlotClick = vi.fn<(payload: EventCalendarSlotClickPayload) => void>();
		const onSelect = vi.fn<(payload: EventCalendarSlotSelectPayload) => void>();
		const { container } = renderCalendar({
			view: 'week',
			timeGrid: { startHour: 8, endHour: 12, scrollToHour: 8 },
			onSlotClick,
			onSelect
		});

		const first = timeSlot('2026-07-15', '2026-07-15T08:00:00.000Z', container);
		await fireEvent.click(first);

		expect(onSlotClick).toHaveBeenCalledTimes(1);
		const { slot } = onSlotClick.mock.calls[0][0];
		expect(slot.view).toBe('week');
		expect(slot.allDay).toBe(false);
		expect(slot.start).toBeInstanceOf(Date);
		expect((slot.start as Date).toISOString()).toBe('2026-07-15T08:00:00.000Z');
		expect((slot.end as Date).toISOString()).toBe('2026-07-15T08:30:00.000Z');

		// Pending gesture: the draft slot-selection overlay marks the clicked range.
		const draft = part('slot-selection', container);
		expect(draft).toHaveAttribute('data-slot-start', '2026-07-15T08:00:00.000Z');
		expect(draft).toHaveAttribute('data-slot-end', '2026-07-15T08:30:00.000Z');

		await fireEvent.click(timeSlot('2026-07-15', '2026-07-15T09:00:00.000Z', container));
		await flush();

		expect(onSelect).toHaveBeenCalledTimes(1);
		const selected = onSelect.mock.calls[0][0];
		expect(selected.info).toEqual({ source: 'single-pointer' });
		expect(selected.slot.allDay).toBe(false);
		expect((selected.slot.start as Date).toISOString()).toBe('2026-07-15T08:00:00.000Z');
		expect((selected.slot.end as Date).toISOString()).toBe('2026-07-15T09:30:00.000Z');

		// After commit only the slot whose start matches stays pressed; the overlay is gone.
		expect(first).toHaveAttribute('aria-pressed', 'true');
		expect(timeSlot('2026-07-15', '2026-07-15T09:00:00.000Z', container)).toHaveAttribute(
			'aria-pressed',
			'false'
		);
		expect(part('slot-selection', container)).toBeNull();
	});

	test('mutating an onSlotClick Date cannot mutate the registered time target', async () => {
		let didMutate = false;
		const onSlotClick = vi.fn<(payload: EventCalendarSlotClickPayload) => void>(({ slot }) => {
			if (didMutate || slot.allDay) return;
			didMutate = true;
			slot.start.setUTCFullYear(2030);
			slot.end.setUTCFullYear(2030);
		});
		const onSelect = vi.fn<(payload: EventCalendarSlotSelectPayload) => void>();
		const { container } = renderCalendar({
			view: 'week',
			timeGrid: { startHour: 8, endHour: 10, scrollToHour: 8 },
			onSlotClick,
			onSelect
		});

		const slot = timeSlot('2026-07-15', '2026-07-15T08:00:00.000Z', container);
		await fireEvent.click(slot);
		await fireEvent.click(slot);
		await flush();

		expect(onSlotClick).toHaveBeenCalledTimes(2);
		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect.mock.calls[0][0].slot).toMatchObject({
			start: new Date('2026-07-15T08:00:00.000Z'),
			end: new Date('2026-07-15T08:30:00.000Z')
		});
	});

	test('all-day row clicks produce civil-date slots for the week view', async () => {
		const onSlotClick = vi.fn<(payload: EventCalendarSlotClickPayload) => void>();
		const { container } = renderCalendar({
			view: 'week',
			timeGrid: { startHour: 8, endHour: 10, scrollToHour: 8 },
			onSlotClick
		});

		await fireEvent.click(allDayHitArea('2026-07-15', container));
		await flush();

		expect(onSlotClick).toHaveBeenCalledTimes(1);
		expect(onSlotClick.mock.calls[0][0].slot).toMatchObject({
			view: 'week',
			allDay: true,
			start: '2026-07-15',
			end: '2026-07-16'
		});
	});
});

describe('slot validation', () => {
	test('validateSlotSelection never blocks the first click but rejects the commit', async () => {
		const onSelect = vi.fn();
		const onSelectionChange = vi.fn();
		const blocked: EventCalendarInteractionBlockedInfo[] = [];
		const { container } = renderCalendar({
			validateSlotSelection: () => false,
			onSelect,
			onSelectionChange,
			onInteractionBlocked: (info) => blocked.push(info)
		});

		await fireEvent.click(monthCell('2026-07-15', container));
		await flush();

		// The anchor still selects: the validator is only consulted for the merged commit.
		expect(onSelectionChange).toHaveBeenCalledTimes(1);
		expect(monthCell('2026-07-15', container)).toHaveAttribute('aria-selected', 'true');
		expect(blocked).toHaveLength(0);

		await fireEvent.click(monthCell('2026-07-17', container));
		await flush();

		expect(onSelect).not.toHaveBeenCalled();
		expect(blocked).toEqual([
			{
				reason: 'custom-policy',
				source: 'single-pointer',
				slot: {
					view: 'month',
					allDay: true,
					start: '2026-07-15',
					end: '2026-07-18',
					resourceId: undefined
				}
			}
		]);
		// The original single-day selection survives the rejected commit.
		expect(monthCell('2026-07-15', container)).toHaveAttribute('aria-selected', 'true');
	});

	test('a rejected keyboard slot commit reports blocked info and announces "Invalid target"', async () => {
		const onSelect = vi.fn();
		const blocked: EventCalendarInteractionBlockedInfo[] = [];
		const { container } = renderCalendar({
			// Accept single-day anchors, reject multi-day merges.
			validateSlotSelection: (slot) =>
				slot.allDay && slot.end === '2026-07-16' && slot.start === '2026-07-15',
			onSelect,
			onInteractionBlocked: (info) => blocked.push(info)
		});
		const announcements = trackAnnouncements(container);

		const cell = monthCell('2026-07-15', container);
		cell.focus();
		await fireEvent.keyDown(cell, { key: ' ' });
		await flush();

		// The keyboard gesture is active but selection is deferred to the commit.
		expect(part('root', container)).toHaveAttribute('data-interaction-kind', 'slot-create');
		expect(onSelect).not.toHaveBeenCalled();

		await fireEvent.keyDown(monthCell('2026-07-16', container), { key: 'ArrowRight' });
		await flush();
		expect(part('root', container)).toHaveAttribute('data-interaction-valid', 'false');
		expect(interactionStatus(container)).toBe(
			'Select calendar range. Invalid target. Time zone: UTC'
		);

		await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
		await flush();

		expect(onSelect).not.toHaveBeenCalled();
		expect(blocked).toEqual([
			{
				reason: 'custom-policy',
				source: 'keyboard',
				slot: {
					view: 'month',
					allDay: true,
					start: '2026-07-15',
					end: '2026-07-18',
					resourceId: undefined
				}
			}
		]);
		// The announcer blanks then sets the message in a microtask, so the DOM write lands
		// after the current flush — poll until the region renders it.
		await waitFor(() => expect(announcements.seen).toContain('Invalid target'));
		announcements.stop();
	});
});

describe('keyboard slot selection', () => {
	test('Space + ArrowRight + Enter commits a merged range and announces it', async () => {
		const onSelect = vi.fn<(payload: EventCalendarSlotSelectPayload) => void>();
		const onSelectionChange = vi.fn<(selection: EventCalendarSelection) => void>();
		const { container } = renderCalendar({ onSelect, onSelectionChange });
		const announcements = trackAnnouncements(container);

		const cell = monthCell('2026-07-15', container);
		cell.focus();
		await fireEvent.keyDown(cell, { key: ' ' });
		await flush();

		// Keyboard drafts do not touch selection until the commit.
		expect(onSelectionChange).not.toHaveBeenCalled();
		expect(cell.querySelector('[data-event-calendar-part="slot-selection"]')).not.toBeNull();

		await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'ArrowRight' });
		await flush();
		await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
		await flush();

		expect(onSelect).toHaveBeenCalledTimes(1);
		expect(onSelect.mock.calls[0][0]).toEqual({
			slot: {
				view: 'month',
				allDay: true,
				start: '2026-07-15',
				end: '2026-07-17',
				resourceId: undefined
			},
			info: { source: 'keyboard' }
		});
		expect(onSelectionChange).toHaveBeenCalledTimes(1);
		await waitFor(() =>
			expect(announcements.seen).toContain('Changes committed for Event calendar')
		);
		announcements.stop();
	});
});

describe('overflow disclosure', () => {
	const overflowItems: EventCalendarItem[] = [1, 2, 3].map((n) => ({
		id: `all-day-${n}`,
		title: `All day ${n}`,
		allDay: true,
		start: '2026-07-15',
		end: '2026-07-16'
	}));

	test('clicking the overflow trigger reports the hidden occurrences and opens the popover', async () => {
		const calls: { day: string; keys: string[]; isMouse: boolean }[] = [];
		const { container } = renderCalendar({
			items: overflowItems,
			month: { maxItemsPerCell: 1 },
			onMoreClick: ({ day, occurrences, event }) => {
				calls.push({
					day,
					keys: occurrences.map((occurrence) => occurrence.key),
					isMouse: event instanceof MouseEvent
				});
			}
		});

		const trigger = monthCell('2026-07-15', container).querySelector<HTMLElement>(
			'[data-event-calendar-part="overflow"]'
		);
		expect(trigger).not.toBeNull();
		expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(trigger!.textContent).toContain('+2 more');

		await fireEvent.click(trigger!);
		await flush();

		expect(calls).toEqual([{ day: '2026-07-15', keys: ['all-day-2', 'all-day-3'], isMouse: true }]);
		expect(trigger).toHaveAttribute('aria-expanded', 'true');
		// The popover is portaled to document.body.
		expect(document.querySelector('[data-event-calendar-overflow-content]')).not.toBeNull();
	});

	test('onMoreClick returning false keeps the popover closed', async () => {
		const { container } = renderCalendar({
			items: overflowItems,
			month: { maxItemsPerCell: 1 },
			onMoreClick: () => false
		});

		const trigger = monthCell('2026-07-15', container).querySelector<HTMLElement>(
			'[data-event-calendar-part="overflow"]'
		);
		await fireEvent.click(trigger!);
		await flush();

		expect(trigger).toHaveAttribute('aria-expanded', 'false');
		expect(document.querySelector('[data-event-calendar-overflow-content]')).toBeNull();
	});
});

describe('announcements', () => {
	test('API-driven mutations announce their commit', async () => {
		const props: EventCalendarTestHarnessProps = { items: [planning], api: null };
		const { container, component } = renderCalendar(props);
		const announcements = trackAnnouncements(container);

		component.getApi()!.addItem({
			id: 'added',
			title: 'Added',
			start: new Date('2026-07-16T09:00:00.000Z'),
			end: new Date('2026-07-16T10:00:00.000Z')
		});
		await flush();

		expect(announcements.seen).toContain('Changes committed for Added');
		announcements.stop();
	});

	test('single-pointer slot commits do not announce', async () => {
		const { container } = renderCalendar({});
		const announcements = trackAnnouncements(container);

		await fireEvent.click(monthCell('2026-07-15', container));
		await fireEvent.click(monthCell('2026-07-16', container));
		await flush();

		expect(announcements.seen).toEqual([]);
		announcements.stop();
	});

	test('keyboard move mode announces the mode and its cancellation', async () => {
		const { container } = renderCalendar({ items: [planning] });
		const announcements = trackAnnouncements(container);

		const control = occurrenceControl('planning', container);
		control.focus();
		await fireEvent.keyDown(control, { key: 'm' });
		await flush();

		expect(announcements.seen).toContain(
			'Move mode for Planning. Use arrow keys to adjust, Enter to commit, and Escape to cancel.'
		);
		expect(part('root', container)).toHaveAttribute('data-interaction-kind', 'move');

		await fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Escape' });
		await flush();
		expect(announcements.seen).toContain('Changes cancelled for Planning');
		announcements.stop();
	});

	test('stale assisted cancellation stops intercepting arrow input and keeps focus', async () => {
		const view = renderCalendar({
			view: 'week',
			items: [planning],
			timeGrid: { startHour: 8, endHour: 12, scrollToHour: 8 }
		});
		const control = occurrenceControl('planning', view.container);
		control.focus();
		await fireEvent.keyDown(control, { key: 'm' });
		await flush();
		expect(part('root', view.container)).toHaveAttribute('data-interaction-kind', 'move');

		await view.rerender({ items: [{ ...planning }] });
		await flush();
		const currentControl = occurrenceControl('planning', view.container);
		expect(document.activeElement).toBe(currentControl);
		const arrow = new KeyboardEvent('keydown', {
			bubbles: true,
			cancelable: true,
			key: 'ArrowRight'
		});
		currentControl.dispatchEvent(arrow);
		await flush();

		expect(part('root', view.container)).not.toHaveAttribute('data-interaction-kind');
		expect(document.activeElement).not.toBe(currentControl);
	});
});

describe('snippets', () => {
	test('item snippet replaces the segment content but keeps the control', () => {
		const { container } = renderCalendar({
			items: [planning],
			item: createRawSnippet((getPayload: () => { occurrence: { key: string } }) => ({
				render: () => `<span data-test-item-snippet>${getPayload().occurrence.key}</span>`
			}))
		});

		const control = occurrenceControl('planning', container);
		expect(control.querySelector('[data-test-item-snippet]')?.textContent).toBe('planning');
	});

	test('monthCell receives day, segments, flags, and the overflow count', () => {
		const calls: EventCalendarMonthCellPayload<EventCalendarItem>[] = [];
		const { container } = renderCalendar({
			items: [
				{ id: 'a1', title: 'A1', allDay: true, start: '2026-07-15', end: '2026-07-16' },
				{ id: 'a2', title: 'A2', allDay: true, start: '2026-07-15', end: '2026-07-16' }
			],
			month: { maxItemsPerCell: 1 },
			monthCell: createRawSnippet(
				(getPayload: () => EventCalendarMonthCellPayload<EventCalendarItem>) => ({
					render: () => {
						const payload = getPayload();
						calls.push(payload);
						return `<span data-test-month-cell>${payload.day}</span>`;
					}
				})
			)
		});

		// One payload per rendered grid cell (the snippet may re-run on later flushes).
		expect(calls.length).toBeGreaterThanOrEqual(42);
		const july15 = calls.filter((payload) => payload.day === '2026-07-15').at(-1);
		expect(july15).toMatchObject({
			isToday: expect.any(Boolean),
			isOutside: false,
			isOffDay: false,
			isDisabled: false
		});
		expect(july15!.segments.length).toBeGreaterThan(0);
		expect(july15!.overflowCount).toBe(1);
		expect(typeof july15!.defaultContent).toBe('function');
		const outside = calls.filter((payload) => payload.day === '2026-06-28').at(-1);
		expect(outside).toMatchObject({ isOutside: true });
		// The snippet replaced the default day-number content.
		expect(
			monthCell('2026-07-15', container).querySelector('[data-test-month-cell]')?.textContent
		).toBe('2026-07-15');
		expect(
			monthCell('2026-07-15', container).querySelector('[data-event-calendar-part="day-number"]')
		).toBeNull();
	});

	test('empty snippet renders in grid-status mode for the month view', () => {
		const modes: EventCalendarEmptyPayload['mode'][] = [];
		const { container } = renderCalendar({
			items: [],
			empty: createRawSnippet((getPayload: () => EventCalendarEmptyPayload) => ({
				render: () => {
					modes.push(getPayload().mode);
					return '<p data-test-empty>Nothing scheduled</p>';
				}
			}))
		});

		const empty = part('empty', container);
		expect(empty).toHaveAttribute('data-empty-mode', 'grid-status');
		expect(empty).toHaveAttribute('role', 'status');
		expect(empty!.textContent).toContain('Nothing scheduled');
		expect(modes).toEqual(['grid-status']);
	});

	test('empty snippet renders in agenda-replacement mode and replaces the list', () => {
		const modes: EventCalendarEmptyPayload['mode'][] = [];
		const { container } = renderCalendar({
			view: 'agenda',
			items: [],
			agendaDayCount: 7,
			empty: createRawSnippet((getPayload: () => EventCalendarEmptyPayload) => ({
				render: () => {
					modes.push(getPayload().mode);
					return '<p data-test-empty>Agenda empty</p>';
				}
			}))
		});

		const empty = part('empty', container);
		expect(empty).toHaveAttribute('data-empty-mode', 'agenda-replacement');
		expect(empty!.textContent).toContain('Agenda empty');
		expect(modes).toEqual(['agenda-replacement']);
		// The agenda list itself is not rendered at all in this mode.
		expect(part('agenda', container)).toBeNull();
	});

	test('loadingContent renders inside the loading overlay', () => {
		const { container } = renderCalendar({
			loading: true,
			loadingContent: createRawSnippet(() => ({
				render: () => '<p data-test-loading>Loading days</p>'
			}))
		});

		expect(part('loading', container)!.textContent).toContain('Loading days');
		expect(part('content', container)).toHaveAttribute('aria-busy', 'true');
		expect(part('content', container)).toHaveAttribute('data-loading');
		expect(part('viewport', container)).toHaveProperty('inert', true);
	});

	test('header={false} removes the header chrome; a custom header snippet replaces it', () => {
		const withoutHeader = renderCalendar({ header: false });
		expect(part('header', withoutHeader.container)).toBeNull();
		expect(part('navigation', withoutHeader.container)).toBeNull();
		expect(part('view-switcher', withoutHeader.container)).toBeNull();
		withoutHeader.unmount();

		const withHeader = renderCalendar({
			header: createRawSnippet(() => ({
				render: () => '<div data-test-custom-header>Custom header</div>'
			}))
		});
		expect(withHeader.container.querySelector('[data-test-custom-header]')?.textContent).toBe(
			'Custom header'
		);
		// The custom snippet replaces the built-in header content entirely.
		expect(part('view-switcher', withHeader.container)).toBeNull();
	});

	test('actions snippet renders inside the default header', () => {
		const { container } = renderCalendar({
			actions: createRawSnippet(() => ({
				render: () => '<button data-test-action>Do it</button>'
			}))
		});

		expect(part('actions', container)).not.toBeNull();
		expect(part('actions', container)!.textContent).toContain('Do it');
	});
});

describe('interaction flags', () => {
	test('keyboard:false removes the keyboard instructions reference from item controls', () => {
		const enabled = renderCalendar({ items: [planning] });
		expect(
			occurrenceControl('planning', enabled.container).getAttribute('aria-describedby')
		).toContain('-instructions');
		enabled.unmount();

		const disabledKeyboard = renderCalendar({
			items: [planning],
			interactions: { keyboard: false }
		});
		expect(occurrenceControl('planning', disabledKeyboard.container)).not.toHaveAttribute(
			'aria-describedby'
		);
	});

	test('selectSlot:false does not block click selection — the click still selects', async () => {
		const onSlotClick = vi.fn();
		const onSelectionChange = vi.fn();
		const { container } = renderCalendar({
			interactions: { selectSlot: false },
			onSlotClick,
			onSelectionChange
		});

		await fireEvent.click(monthCell('2026-07-15', container));
		await flush();

		// The flag only gates the two-click gesture and drag-create; the single
		// click still reports the slot and applies a selection.
		expect(onSlotClick).toHaveBeenCalledTimes(1);
		expect(onSelectionChange).toHaveBeenCalledWith({
			kind: 'slot',
			itemKey: null,
			slot: { view: 'month', allDay: true, start: '2026-07-15', end: '2026-07-16' }
		});
		// But no pending gesture is opened.
		expect(part('root', container)).not.toHaveAttribute('data-interaction-kind');
	});

	test('singlePointer:false clicks still select but never open a two-click gesture', async () => {
		const onSelect = vi.fn();
		const { container } = renderCalendar({ interactions: { singlePointer: false }, onSelect });

		await fireEvent.click(monthCell('2026-07-15', container));
		await flush();
		expect(monthCell('2026-07-15', container)).toHaveAttribute('aria-selected', 'true');
		expect(part('root', container)).not.toHaveAttribute('data-interaction-kind');

		// A second click re-selects its own day instead of merging a range.
		await fireEvent.click(monthCell('2026-07-17', container));
		await flush();
		expect(onSelect).not.toHaveBeenCalled();
		expect(monthCell('2026-07-15', container)).toHaveAttribute('aria-selected', 'false');
		expect(monthCell('2026-07-17', container)).toHaveAttribute('aria-selected', 'true');
	});

	test('drag controls whether items register as native draggables', () => {
		const draggable = renderCalendar({ items: [planning] });
		expect(part('item', draggable.container)).toHaveAttribute('draggable', 'true');
		draggable.unmount();

		const noDrag = renderCalendar({
			items: [planning],
			interactions: { drag: false }
		});
		expect(part('item', noDrag.container)).not.toHaveAttribute('draggable');
	});

	test('resize controls whether all-day items render resize handles', () => {
		const allDayItem: EventCalendarItem = {
			id: 'offsite',
			title: 'Offsite',
			allDay: true,
			start: '2026-07-14',
			end: '2026-07-17'
		};
		const withResize = renderCalendar({ items: [allDayItem] });
		expect(parts('resize-handle', withResize.container).map((node) => node.dataset.edge)).toEqual([
			'start',
			'end'
		]);
		withResize.unmount();

		const noResize = renderCalendar({
			items: [allDayItem],
			interactions: { resize: false }
		});
		expect(parts('resize-handle', noResize.container)).toHaveLength(0);
	});

	test('clipboard:false makes the copy API a no-op', async () => {
		const props: EventCalendarTestHarnessProps = {
			items: [planning],
			interactions: { clipboard: false },
			api: null
		};
		const { component } = renderCalendar(props);
		component.getApi()!.select({ kind: 'item', itemKey: 'planning', slot: null });
		await flush();
		expect(component.getApi()!.copySelection()).toBe(false);
	});

	test('disabled removes interactivity from the grid', async () => {
		const onSlotClick = vi.fn();
		const onItemClick = vi.fn();
		const { container } = renderCalendar({
			items: [planning],
			disabled: true,
			onSlotClick,
			onItemClick
		});

		const cell = monthCell('2026-07-15', container);
		expect(cell).toHaveAttribute('aria-disabled', 'true');
		expect(cell).toHaveAttribute('data-disabled');
		expect(cell.tabIndex).toBe(-1);
		await fireEvent.click(cell);
		await flush();
		// jsdom dispatches click on disabled elements; the real click suppression lives in the
		// browser, so the DOM contract (disabled attr, tabIndex, aria-disabled) is what is
		// asserted here.
		expect(part('root', container)).toHaveAttribute('data-disabled');

		const control = occurrenceControl('planning', container);
		expect(control).toBeDisabled();
		// Item controls rely on the native disabled attribute for tab-order removal; no
		// tabindex is emitted, so tabIndex stays at the button default of 0.
		expect(control.tabIndex).toBe(0);
	});
});

describe('instance isolation', () => {
	test('two mounted calendars do not share selection or targets', async () => {
		const firstSlotClicks: EventCalendarSlotClickPayload[] = [];
		const secondSlotClicks: EventCalendarSlotClickPayload[] = [];
		const first = renderCalendar({
			items: [planning],
			onSlotClick: (payload) => firstSlotClicks.push(payload)
		});
		const second = renderCalendar({
			items: [review],
			onSlotClick: (payload) => secondSlotClicks.push(payload)
		});

		expect(part('root', first.container)).not.toBe(part('root', second.container));
		expect(monthCell('2026-07-15', first.container).dataset.calendarInstanceId).not.toBe(
			monthCell('2026-07-15', second.container).dataset.calendarInstanceId
		);

		await fireEvent.click(monthCell('2026-07-15', first.container));
		await flush();

		expect(firstSlotClicks).toHaveLength(1);
		expect(secondSlotClicks).toHaveLength(0);
		expect(monthCell('2026-07-15', first.container)).toHaveAttribute('aria-selected', 'true');
		expect(monthCell('2026-07-15', second.container)).toHaveAttribute('aria-selected', 'false');
	});
});

describe('controlled items', () => {
	test('parent item replacement re-renders occurrences without onItemsChange', async () => {
		const onItemsChange = vi.fn();
		const { container, rerender } = renderCalendar({
			items: [planning],
			onItemsChange
		});
		expect(occurrenceControl('planning', container)).not.toBeNull();

		await rerender({
			items: [planning, review],
			onItemsChange
		});
		await flush();

		expect(occurrenceControl('review', container)).not.toBeNull();
		// Parent-driven updates stay silent: no calendar-originated notification.
		expect(onItemsChange).not.toHaveBeenCalled();
	});

	test('api.addItem publishes onItemsChange and writes back the bound items', async () => {
		const changes: EventCalendarItemsChangePayload[] = [];
		const props: EventCalendarTestHarnessProps = {
			items: [planning],
			api: null,
			onItemsChange: (payload) => changes.push(payload)
		};
		const { container, component } = renderCalendar(props);

		component.getApi()!.addItem({
			id: 'added',
			title: 'Added',
			start: new Date('2026-07-16T09:00:00.000Z'),
			end: new Date('2026-07-16T10:00:00.000Z')
		});
		await flush();

		expect(changes).toHaveLength(1);
		expect(changes[0].change.kind).toBe('add');
		expect(changes[0].change.source).toBe('api');
		expect(changes[0].items.map((item) => item.id)).toEqual(['planning', 'added']);
		expect(component.getItems().map((item) => item.id)).toEqual(['planning', 'added']);
		expect(occurrenceControl('added', container)).not.toBeNull();
	});
});
