<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		EventCalendar,
		type EventCalendarItem,
		type EventCalendarRangeChangeInfo
	} from 'svelai/event-calendar';

	let date = $state(new Date('2026-07-15T06:00:00.000Z'));
	let loading = $state(false);
	let rangeLabel = $state('Waiting for the initial client range.');
	let items = $state<EventCalendarItem[]>([
		{
			id: 'kathmandu-review',
			title: 'مراجعة الإصدار',
			start: new Date('2026-07-15T03:15:00.000Z'),
			end: new Date('2026-07-15T04:15:00.000Z'),
			color: 'primary'
		}
	]);

	function handleRangeChange(info: EventCalendarRangeChangeInfo): void {
		rangeLabel = `Fetch [${info.fetchRange.start.toISOString()}, ${info.fetchRange.end.toISOString()})`;
	}
</script>

<div class="grid w-full max-w-xl gap-3" dir="rtl">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Button size="small" variant="outline" onclick={() => (loading = !loading)}>
			{loading ? 'إنهاء التحميل' : 'محاكاة التحميل'}
		</Button>
		<code class="text-neutral/70 overflow-hidden text-xs text-ellipsis">{rangeLabel}</code>
	</div>
	<EventCalendar
		bind:items
		bind:date
		view="days"
		views={['days', 'agenda']}
		dayCount={2}
		{loading}
		dir="rtl"
		locale="ar"
		timeZone="Asia/Kathmandu"
		timeGrid={{ startHour: 7, endHour: 18, scrollToHour: 8 }}
		onRangeChange={handleRangeChange}
		class="h-[32rem] w-full"
	/>
</div>
