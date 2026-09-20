<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		EventCalendar,
		externalEvent,
		type EventCalendarChange,
		type EventCalendarItem,
		type EventCalendarItemsChangePayload,
		type EventCalendarSlotSelectPayload
	} from 'entasis/event-calendar';
	import {
		EVENT_CALENDAR_DEMO_TIME_ZONE,
		createDemoItems,
		type MeetingFields,
		validateDemoItemUpdate as validateItemUpdate
	} from './eventCalendarDemoData.js';

	let items = $state(createDemoItems().filter((item) => item.display !== 'background'));
	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
	let lastChange = $state.raw<EventCalendarChange<MeetingFields> | null>(null);
	let calendar = $state<{
		copySelection(): boolean;
		paste(): boolean;
		undo(): boolean;
		redo(): boolean;
		canUndo(): boolean;
		canRedo(): boolean;
	} | null>(null);
	let status = $state('Focus an item and press M, S, or E to move or resize it.');
	let externalItemSequence = 0;

	function createExternalItem(): EventCalendarItem<MeetingFields> {
		externalItemSequence += 1;
		return {
			id: `external-focus-${externalItemSequence}`,
			title: 'External focus block',
			description: 'Created from a draggable element outside the calendar.',
			start: new Date('2026-07-15T08:00:00.000Z'),
			end: new Date('2026-07-15T09:00:00.000Z'),
			color: 'info',
			owner: 'You',
			attendees: 1
		};
	}

	function handleItemsChange({ change }: EventCalendarItemsChangePayload<MeetingFields>): void {
		lastChange = change;
		status = `${change.kind} committed from ${change.source}; the bound array was replaced.`;
	}

	function handleSlotSelect({ slot, info }: EventCalendarSlotSelectPayload): void {
		status =
			slot.allDay === true
				? `Selected ${slot.start} through ${slot.end} (exclusive) with ${info.source}.`
				: `Selected ${slot.start.toISOString()} through ${slot.end.toISOString()} with ${info.source}.`;
	}

	function revertLastChange(): void {
		if (!lastChange) return;
		try {
			lastChange.revert();
			lastChange = null;
			status = 'The guarded transaction restored the previous immutable array.';
		} catch (error) {
			status = error instanceof Error ? error.message : 'The transaction could not be reverted.';
		}
	}
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-neutral/70 text-sm" aria-live="polite">{status}</p>
		<div class="flex flex-wrap gap-2">
			<Button size="small" variant="outline" onclick={() => calendar?.copySelection()}>Copy</Button>
			<Button size="small" variant="outline" onclick={() => calendar?.paste()}>Paste</Button>
			<Button
				size="small"
				variant="outline"
				disabled={!calendar?.canUndo()}
				onclick={() => calendar?.undo()}
			>
				Undo
			</Button>
			<Button
				size="small"
				variant="outline"
				disabled={!calendar?.canRedo()}
				onclick={() => calendar?.redo()}
			>
				Redo
			</Button>
			<Button size="small" variant="outline" disabled={!lastChange} onclick={revertLastChange}>
				Revert last change
			</Button>
		</div>
	</div>
	<div class="flex flex-wrap items-center gap-2 text-sm">
		<span class="text-neutral/70">Drag into the calendar:</span>
		<div
			class="border-info/30 bg-info/10 text-info cursor-grab rounded-md border px-2.5 py-1.5 font-medium active:cursor-grabbing"
			{@attach externalEvent(createExternalItem)}
		>
			External focus block
		</div>
	</div>
	<EventCalendar
		bind:this={calendar}
		bind:items
		bind:date
		view="week"
		views={['week', 'day', 'days']}
		timeZone={EVENT_CALENDAR_DEMO_TIME_ZONE}
		timeGrid={{ startHour: 7, endHour: 19, scrollToHour: 8 }}
		availability={{
			businessHours: [{ daysOfWeek: [1, 2, 3, 4, 5], start: '08:00', end: '18:00' }],
			constrainMutations: true
		}}
		allowOverlap={false}
		{validateItemUpdate}
		onItemsChange={handleItemsChange}
		onSelect={handleSlotSelect}
		class="h-[34rem] w-full"
	/>
</div>
