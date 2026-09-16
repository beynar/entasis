<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import { EventCalendar } from './index.js';
	import type { EventCalendarItem, EventCalendarView } from './index.js';

	let {
		items = $bindable([]),
		view = $bindable('month' as EventCalendarView),
		date = $bindable(new Date('2026-07-15T10:00:00.000Z'))
	}: {
		items?: EventCalendarItem[];
		view?: EventCalendarView;
		date?: Date;
	} = $props();
</script>

<Theme>
	<EventCalendar
		bind:items
		bind:view
		bind:date
		timeZone="UTC"
		locale="en"
		timeGrid={{ startHour: 8, endHour: 12, scrollToHour: 8 }}
		agendaDayCount={7}
	/>
</Theme>
