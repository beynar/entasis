<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import DateSelector from '$lib/components/Form/DateSelector/DateSelector.svelte';
	import DateSelectorInput from '$lib/components/Form/DateSelector/DateSelectorInput.svelte';
	import type { DateSelectorPreset } from '$lib/components/Form/DateSelector/dateSelector.props.js';
	import { calendarBlankIcon } from '$lib/components/Icons/calendarBlank.js';
	import type { PopoverState } from '$lib/components/Popover/popover.state.svelte.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { sizes } from '$lib/utils/tokens.js';

	const day = (offset: number) => new Date(2026, 6, 15 + offset, 12);
	const formatDate = (date: Date | null) =>
		date?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) ??
		'Choose date';

	const datePresets = [
		{ label: 'Today', value: day(0) },
		{ label: 'Tomorrow', value: day(1) },
		{ label: 'Next week', value: day(7) }
	] satisfies readonly DateSelectorPreset<'date'>[];
	const rangePresets = [
		{ label: 'This week', value: [day(-2), day(4)] },
		{ label: 'Next 7 days', value: [day(1), day(7)] },
		{ label: 'Next 30 days', value: [day(1), day(30)] }
	] satisfies readonly DateSelectorPreset<'range'>[];
	const multiplePresets = [
		{ label: 'Weekend', value: [day(3), day(4)] },
		{ label: 'Milestones', value: [day(2), day(9), day(16)] }
	] satisfies readonly DateSelectorPreset<'multiple'>[];

	let selectedDate = $state<Date | null>(day(1));
	let selectedRange = $state<[Date | null, Date | null] | null>([day(1), day(7)]);
	let selectedDates = $state<Date[]>([day(0), day(2)]);
	let constrainedDate = $state<Date | null>(null);
	let closingDate = $state<Date | null>(null);
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

<DocPage
	title="Date selector"
	subtitle="A popover calendar for one date, a range, or a set of dates."
	component="DateSelector"
	features={[
		'Single, range, and multiple selection',
		'Typed bindable values and presets',
		'Configurable close on selection',
		'Animated intrinsic height',
		'Direction-aware month transitions',
		'Keyboard calendar navigation',
		'Optional mobile bottom sheet'
	]}
>
	<ComponentCard
		{controls}
		description="A popover date field with a label and description"
		code={`<DateSelectorInput
	size="${controls.value.size}"
	density="${controls.value.density}"
	labelPosition="${controls.value.labelPosition}"
	view="${controls.value.view}"
	disabled={${controls.value.disabled}}
	label="Due date"
	description="We'll remind you the day before"
	bind:value={date}
/>`}
	>
		<div class="w-full max-w-md">
			<DateSelectorInput
				size={controls.value.size}
				density={controls.value.density}
				labelPosition={controls.value.labelPosition}
				view={controls.value.view}
				disabled={controls.value.disabled}
				label="Due date"
				description="We'll remind you the day before"
				bind:value={selectedDate}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Date with presets"
			description="Selection stays open by default. The trigger is arbitrary content; attach the Popover reference and use its state to toggle."
			code={`<DateSelector bind:value presets={datePresets}>
	{#snippet trigger(popover)}
		<Button
			suffix={calendarBlankIcon}
				onclick={popover.toggle}
			{@attach popover.reference}
		>
			{value ? value.toLocaleDateString() : 'Choose date'}
		</Button>
	{/snippet}
</DateSelector>`}
		>
			<div class="flex flex-col items-center gap-3">
				<DateSelector bind:value={selectedDate} presets={datePresets}>
					{#snippet trigger(popover: PopoverState)}
						<Button suffix={calendarBlankIcon} onclick={popover.toggle} {@attach popover.reference}>
							{formatDate(selectedDate)}
						</Button>
					{/snippet}
				</DateSelector>
				<p class="text-neutral/60 text-xs">Selected: {formatDate(selectedDate)}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Range"
			description="The first choice starts the range and the second completes it without dismissing the popover."
			code={`<DateSelector mode="range" bind:value={range} presets={rangePresets} />`}
		>
			<div class="flex flex-col items-center gap-3">
				<DateSelector mode="range" bind:value={selectedRange} presets={rangePresets} />
				<p class="text-neutral/60 text-xs">
					{selectedRange?.[0]?.toLocaleDateString() ?? 'Start'} -
					{selectedRange?.[1]?.toLocaleDateString() ?? 'End'}
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Multiple dates"
			description="Individual days and presets update the selection without dismissing the popover."
			code={`<DateSelector mode="multiple" bind:value={dates} presets={multiplePresets} />`}
		>
			<div class="flex flex-col items-center gap-3">
				<DateSelector mode="multiple" bind:value={selectedDates} presets={multiplePresets} />
				<p class="text-neutral/60 text-xs">
					{selectedDates.length}
					{selectedDates.length === 1 ? 'date' : 'dates'} selected
				</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Close after selection"
			description="Opt into dismissal after a date, complete range, preset, or multiple-date change."
			code={`<DateSelector bind:value closeOnSelect />`}
		>
			<DateSelector bind:value={closingDate} closeOnSelect />
		</ComponentCard>

		<ComponentCard
			title="Constraints"
			description="Bounds and disabled ranges are enforced by pointer and keyboard selection."
			code={`<DateSelector
	bind:value
	minDate={new Date(2026, 6, 15)}
	maxDate={new Date(2026, 7, 15)}
	disabledDates={[[new Date(2026, 6, 20), new Date(2026, 6, 23)]]}
/>`}
		>
			<DateSelector
				bind:value={constrainedDate}
				minDate={day(0)}
				maxDate={day(31)}
				disabledDates={[[day(5), day(8)]]}
			/>
		</ComponentCard>

		<ComponentCard
			title="Two months and mobile sheet"
			description="The same primitive can show adjacent months and adopt Popover's mobile sheet rendering."
			code={`<DateSelector bind:value view="double" mobileSheet />`}
		>
			<DateSelector bind:value={selectedDate} view="double" mobileSheet />
		</ComponentCard>
	{/snippet}
</DocPage>
