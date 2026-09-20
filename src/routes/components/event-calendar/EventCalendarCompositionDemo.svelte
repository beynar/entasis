<script lang="ts">
	import { EventCalendar } from 'entasis/event-calendar';
	import { createDemoItems } from './eventCalendarDemoData.js';

	let items = $state(createDemoItems());
	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
</script>

<EventCalendar
	bind:items
	bind:date
	view="month"
	views={['month', 'week', 'agenda']}
	timeZone="Europe/Paris"
	month={{ maxItemsPerCell: 2 }}
	data-event-calendar-demo="composition"
	class="h-[36rem] w-full"
>
	{#snippet header({ previous, today, next, title, viewSwitcher })}
		<div class="flex w-full flex-wrap items-center justify-between gap-2">
			<div class="flex items-center gap-1">
				{@render previous()}
				{@render today()}
				{@render next()}
			</div>
			<div class="bg-primary/10 text-primary-readable rounded-full px-3 py-1">
				{@render title()}
			</div>
			{@render viewSwitcher()}
		</div>
	{/snippet}

	{#snippet item({ occurrence, view, defaultContent, markerContent, titleContent, timeContent })}
		<div data-event-calendar-demo-item-view={view} class="min-w-0">
			{#if occurrence.item.owner === 'Iris'}
				<div
					data-event-calendar-demo-custom-item
					class="bg-primary/10 text-primary-readable flex min-w-0 items-center gap-1 rounded px-1"
				>
					{@render markerContent()}
					{@render titleContent()}
					{@render timeContent()}
				</div>
			{:else}
				{@render defaultContent()}
			{/if}
			<span class="sr-only">Owned by {occurrence.item.owner}</span>
		</div>
	{/snippet}

	{#snippet overflowContent({ day, defaultContent })}
		<div data-event-calendar-demo-overflow={day}>
			{@render defaultContent()}
		</div>
	{/snippet}

	{#snippet dayHeader({ isToday, defaultContent })}
		<div class:is-today={isToday}>
			{@render defaultContent()}
		</div>
	{/snippet}

	{#snippet monthCell({ isToday, isOffDay, defaultContent })}
		<div class:is-today={isToday} class:is-off-day={isOffDay}>
			{@render defaultContent()}
		</div>
	{/snippet}
</EventCalendar>
