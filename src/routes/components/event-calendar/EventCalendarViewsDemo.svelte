<script lang="ts">
	import { EventCalendar } from '$lib/components/EventCalendar/index.js';
	import type { Density } from '$lib/types/theme.js';
	import {
		EVENT_CALENDAR_DEMO_TIME_ZONE,
		createDemoItems,
		createDemoResources,
		validateDemoItemUpdate as validateItemUpdate
	} from './eventCalendarDemoData.js';

	let {
		density = 'normal',
		showWeekends = true,
		disabled = false
	}: {
		density?: Density;
		showWeekends?: boolean;
		disabled?: boolean;
	} = $props();

	const timeZone = EVENT_CALENDAR_DEMO_TIME_ZONE;

	let items = $state(createDemoItems());
	let resources = $state(createDemoResources());
	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
	let view = $state<'month' | 'week' | 'day' | 'days' | 'agenda' | 'resource'>('week');
	let dayCount = $state(3);
</script>

<EventCalendar
	bind:items
	{resources}
	bind:date
	bind:view
	bind:dayCount
	{timeZone}
	{validateItemUpdate}
	recurrence={{ editScope: 'occurrence' }}
	timeGrid={{ startHour: 6, endHour: 23, scrollToHour: 8 }}
	agendaDayCount={14}
	showDatePicker
	{density}
	{showWeekends}
	{disabled}
	month={{ showWeekNumbers: true }}
	class="h-[38rem] w-full"
/>
