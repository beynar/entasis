<script lang="ts">
	import {
		EventCalendar,
		type EventCalendarResource
	} from '$lib/components/EventCalendar/index.js';
	import {
		createDemoItems,
		createDemoResources,
		type RoomFields
	} from './eventCalendarDemoData.js';

	let items = $state(createDemoItems());
	let resources = $state<EventCalendarResource<RoomFields>[]>(createDemoResources());
	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
</script>

<EventCalendar
	bind:items
	{resources}
	bind:date
	view="resource"
	views={['resource', 'day']}
	timeZone="Europe/Paris"
	timeGrid={{ startHour: 7, endHour: 19, scrollToHour: 8 }}
	availability={{ constrainMutations: true }}
	class="h-[34rem] w-full"
>
	{#snippet resourceHeader({ resource, isUnassigned, defaultContent })}
		<div class="grid min-w-0 gap-0.5">
			{@render defaultContent()}
			{#if resource?.capacity}
				<span class="text-neutral/65 text-xs">
					Floor {resource.floor} · {resource.capacity} seats
				</span>
			{:else if isUnassigned}
				<span class="text-neutral/65 text-xs">No leaf resource</span>
			{/if}
		</div>
	{/snippet}
</EventCalendar>
