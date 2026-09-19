<script lang="ts">
	// Minimal EventCalendar harness for the Playwright e2e suite (e2e/event-calendar.test.ts).
	// It pins browser-only behavior jsdom cannot express: native HTML5 drag and drop,
	// pointer-capture slot drags, document.elementsFromPoint hit-testing, and
	// layout-dependent month overflow. Everything is pinned to an explicit UTC week.
	import { onMount } from 'svelte';
	import {
		EventCalendar,
		externalEvent,
		type EventCalendarInteractionBlockedInfo,
		type EventCalendarItem,
		type EventCalendarItemsChangePayload,
		type EventCalendarSlotSelectPayload
	} from 'svelai/event-calendar';

	const TIME_ZONE = 'UTC';

	// Fixed UTC week: Monday 2026-07-13 through Sunday 2026-07-19 (weekStartsOn=1).
	let items = $state<EventCalendarItem[]>([
		{
			id: 'move-me',
			title: 'Move me',
			start: new Date('2026-07-13T09:00:00.000Z'),
			end: new Date('2026-07-13T10:00:00.000Z'),
			color: 'primary'
		},
		{
			id: 'resize-me',
			title: 'Resize me',
			start: new Date('2026-07-14T09:00:00.000Z'),
			end: new Date('2026-07-14T10:00:00.000Z'),
			color: 'success'
		},
		{
			id: 'focus-me',
			title: 'Keyboard move me',
			start: new Date('2026-07-15T11:00:00.000Z'),
			end: new Date('2026-07-15T12:00:00.000Z'),
			color: 'warning'
		},
		{
			id: 'review-me',
			title: 'Review me',
			start: new Date('2026-07-16T09:00:00.000Z'),
			end: new Date('2026-07-16T10:00:00.000Z'),
			color: 'info'
		},
		{
			id: 'daily-sync',
			title: 'Daily sync',
			start: new Date('2026-07-13T07:00:00.000Z'),
			end: new Date('2026-07-13T07:30:00.000Z'),
			recurrence: { freq: 'daily', count: 7 },
			recurrenceTimeZone: TIME_ZONE,
			color: 'secondary'
		},
		{
			id: 'offsite',
			title: 'Offsite day',
			start: '2026-07-17',
			end: '2026-07-18',
			allDay: true,
			color: 'danger'
		}
	]);
	let date = $state(new Date('2026-07-15T00:00:00.000Z'));
	let ready = $state(false);
	let lastChange = $state('none');
	let lastSelect = $state('none');
	let lastBlocked = $state('none');
	let externalSequence = 0;

	function serializeEndpoint(value: Date | string): string {
		return value instanceof Date ? value.toISOString() : value;
	}

	function handleItemsChange({ change }: EventCalendarItemsChangePayload): void {
		const item = 'item' in change ? change.item : 'seriesItem' in change ? change.seriesItem : null;
		lastChange = JSON.stringify({
			kind: change.kind,
			source: change.source,
			itemId: item?.id ?? null,
			start: item ? serializeEndpoint(item.start) : null,
			end: item ? serializeEndpoint(item.end) : null
		});
	}

	function handleSelect({ slot, info }: EventCalendarSlotSelectPayload): void {
		lastSelect = JSON.stringify({
			source: info.source,
			allDay: slot.allDay,
			start: serializeEndpoint(slot.start),
			end: serializeEndpoint(slot.end)
		});
	}

	function handleBlocked(info: EventCalendarInteractionBlockedInfo): void {
		lastBlocked = JSON.stringify({ reason: info.reason, source: info.source });
	}

	function createExternalItem(): EventCalendarItem {
		externalSequence += 1;
		return {
			id: `external-${externalSequence}`,
			title: 'External block',
			start: new Date('2026-07-13T08:00:00.000Z'),
			end: new Date('2026-07-13T09:00:00.000Z')
		};
	}

	onMount(() => {
		ready = true;
	});
</script>

<div class="grid gap-3 p-4" data-e2e-ready={ready ? 'true' : undefined}>
	<div class="flex items-center gap-3 text-sm">
		<span class="text-neutral/70">Drag into the calendar:</span>
		<div
			data-testid="external-source"
			class="border-info/30 bg-info/10 text-info cursor-grab rounded-md border px-2.5 py-1.5 font-medium select-none"
			{@attach externalEvent(createExternalItem)}
		>
			External block
		</div>
	</div>
	<EventCalendar
		bind:items
		bind:date
		view="week"
		views={['week', 'month']}
		timeZone={TIME_ZONE}
		weekStartsOn={1}
		timeGrid={{ startHour: 6, endHour: 18, scrollToHour: 6 }}
		month={{ maxItemsPerCell: 1 }}
		onItemsChange={handleItemsChange}
		onSelect={handleSelect}
		onInteractionBlocked={handleBlocked}
		class="h-[34rem] w-full"
	/>
	<div class="grid gap-1 font-mono text-xs">
		<pre data-testid="last-change">{lastChange}</pre>
		<pre data-testid="last-select">{lastSelect}</pre>
		<pre data-testid="last-blocked">{lastBlocked}</pre>
	</div>
</div>
