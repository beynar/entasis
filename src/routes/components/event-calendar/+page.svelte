<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import EventCalendarCompositionDemo from './EventCalendarCompositionDemo.svelte';
	import EventCalendarGuide from './EventCalendarGuide.svelte';
	import EventCalendarInteractionsDemo from './EventCalendarInteractionsDemo.svelte';
	import EventCalendarLoadingRtlDemo from './EventCalendarLoadingRtlDemo.svelte';
	import EventCalendarResourcesDemo from './EventCalendarResourcesDemo.svelte';
	import EventCalendarViewsDemo from './EventCalendarViewsDemo.svelte';
	import { sizes } from '$lib/utils/tokens.js';
	import {
		compositionCode,
		interactionCode,
		loadingRtlCode,
		resourcesCode
	} from './codeSnippets.js';

	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		},
		{ name: 'showWeekends', type: 'switch', label: 'Weekends', value: true },
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Event calendar"
	subtitle="A complete scheduling surface with typed recurrence, resources, immutable transactions, and accessible pointer or keyboard interaction."
	component="EventCalendar"
	features={[
		'Month, week, day, N-day, agenda, and resource-day views',
		'Timed, all-day, multi-day, background, and recurring items',
		'Move, resize, range creation, keyboard, touch, and two-click selection',
		'Explicit IANA time zones with DST-safe civil-day math',
		'Typed snippets, resources, callbacks, and imperative API',
		'Multi-resource assignment, per-resource constraints, copy/paste, and undo/redo',
		'Consumer-owned loading and persistence with guarded revert'
	]}
>
	<EventCalendarGuide />

	<ComponentCard
		{controls}
		title="One model, six views"
		description="Use the built-in switcher to inspect the same timed, all-day, background, multi-day, recurring, and resource-assigned definitions in every view."
		code={`<EventCalendar
	density="${controls.value.density}"
	showWeekends={${controls.value.showWeekends}}
	disabled={${controls.value.disabled}}
	{items}
	{resources}
	bind:date
	bind:view
	timeZone="UTC"
	class="h-[38rem] w-full"
/>`}
		class="min-h-0 items-stretch p-3 md:p-5"
	>
		<EventCalendarViewsDemo
			density={controls.value.density}
			showWeekends={controls.value.showWeekends}
			disabled={controls.value.disabled}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Validation and reversible mutations"
			description="Drag an item from inside or outside the calendar, or focus it and press M, S, or E. Use Mod+C/Mod+V to duplicate the selected occurrence and Mod+Z/Mod+Shift+Z for bounded history. Drag across empty slots to select a create range."
			code={interactionCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<EventCalendarInteractionsDemo />
		</ComponentCard>

		<ComponentCard
			title="Owned semantics, custom content"
			description="The shared item snippet can reuse its complete, marker, title, and time renderers in every view; overflow and state snippets can wrap their built-in content without recreating calendar behavior."
			code={compositionCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<EventCalendarCompositionDemo />
		</ComponentCard>

		<ComponentCard
			title="Resource scheduling"
			description="Leaf resources become day columns. Multi-assigned events project into every assigned column; local hours and read-only resources reuse the same mutation validator."
			code={resourcesCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<EventCalendarResourcesDemo />
		</ComponentCard>

		<ComponentCard
			title="Consumer loading, RTL, and a non-hour zone"
			description="The range callback exposes the exact fetch envelope. Loading keeps navigation available, RTL mirrors physical controls without reversing time, and Asia/Kathmandu exercises a 45-minute offset."
			code={loadingRtlCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<EventCalendarLoadingRtlDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
