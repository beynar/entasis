<script lang="ts">
	import CalendarPrimitive from '$lib/components/Form/Calendar/CalendarPrimitive.svelte';
	import { CalendarInput } from '$lib/components/Form/Calendar/index.js';
	import type {
		Cell,
		Event as CalendarEvent
	} from '$lib/components/Form/Calendar/useCalendar.svelte.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { sizes } from '$lib/utils/tokens.js';

	const date = (day: number) => new Date(2026, 6, day, 12);
	const events: CalendarEvent[] = [
		{ start: date(17), end: date(17), title: 'Design review' },
		{ start: date(21), end: date(23), title: 'Release window' }
	];

	let selectedDate = $state<Date | null>(date(15));
	let selectedRange = $state<[Date | null, Date | null] | null>([date(15), date(19)]);
	let selectedDates = $state<Date[]>([date(15), date(18), date(24)]);
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		},
		{
			name: 'labelPosition',
			type: 'segmented',
			label: 'Label',
			value: 'top',
			options: ['top', 'left']
		},
		{
			name: 'view',
			type: 'segmented',
			label: 'View',
			value: 'single',
			options: ['single', 'double']
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

{#snippet eventCell(cell: Cell<CalendarEvent>)}
	<span>{cell.day}</span>
	{#if cell.events.length > 0}
		<span
			class="bg-info text-info-contrast absolute right-0.5 bottom-0.5 flex size-3 items-center justify-center rounded-full text-[8px]"
		>
			{cell.events.length}
		</span>
	{/if}
{/snippet}

<DocPage
	title="Calendar"
	subtitle="Accessible date selection with animated month navigation."
	component="CalendarPrimitive"
	features={[
		'Single, range, and multiple selection',
		'Quick month and year selection',
		'Roving keyboard focus',
		'Synchronized month and height transitions',
		'Disabled dates and date bounds',
		'Container-responsive double view',
		'Custom cells with event payloads'
	]}
>
	<ComponentCard
		{controls}
		description="Pick a publish date for a scheduled post"
		code={`<CalendarInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	view="${controls.value.view}"
	disabled={${controls.value.disabled}}
	label="Publish date"
	description="Choose when the post goes live"
	type="calendar"
	bind:value={date}
/>`}
	>
		<div class="w-full max-w-md">
			<CalendarInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				view={controls.value.view}
				disabled={controls.value.disabled}
				label="Publish date"
				description="Choose when the post goes live"
				type="calendar"
				bind:value={selectedDate}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Range"
			description="A completed range highlights its endpoints and the days between them."
			code={`<CalendarPrimitive type="calendar-range" bind:value={range} />`}
		>
			<div class="w-full max-w-sm">
				<CalendarPrimitive type="calendar-range" bind:value={selectedRange} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Multiple dates"
			description="Each day toggles independently while preserving a sorted Date array."
			code={`<CalendarPrimitive type="calendar-multiple" bind:value={dates} />`}
		>
			<div class="w-full max-w-sm">
				<CalendarPrimitive type="calendar-multiple" bind:value={selectedDates} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Two months"
			description="Two months share one navigation surface and automatically fall back to one below 576px."
			code={`<CalendarPrimitive type="calendar" bind:value view="double" />`}
		>
			<div class="w-full max-w-2xl">
				<CalendarPrimitive type="calendar" bind:value={selectedDate} view="double" />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Events and custom cells"
			description="Events are included on every covered day, including multi-day intervals."
			code={`<CalendarPrimitive type="calendar" {events} cell={eventCell} />`}
		>
			<div class="w-full max-w-sm">
				<CalendarPrimitive type="calendar" bind:value={selectedDate} {events} cell={eventCell} />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Field integration"
			description="CalendarInput keeps the existing Form Field contract for single and range values."
			code={`<CalendarInput label="Availability" type="calendar-range" bind:value />`}
		>
			<div class="w-full max-w-md">
				<CalendarInput label="Availability" type="calendar-range" bind:value={selectedRange} />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
