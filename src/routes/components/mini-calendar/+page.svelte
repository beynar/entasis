<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import MiniCalendar from '$lib/components/MiniCalendar/MiniCalendar.svelte';
	import I18n from '$lib/i18n/I18n.svelte';

	let selected = $state<Date | null>(new Date());
	const today = new Date();
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'success', 'danger']
		},
		{
			name: 'days',
			type: 'slider',
			label: 'Days',
			value: 5,
			min: 3,
			max: 7,
			step: 1,
			showValue: true
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
	const readout = $derived(
		selected
			? selected.toLocaleDateString(undefined, {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: 'None'
	);
</script>

<DocPage
	title="Mini calendar"
	subtitle="A compact horizontal strip of consecutive days with prev/next navigation."
	component="MiniCalendar"
	features={[
		'Shows N consecutive days (default 5)',
		'Chevrons shift the range by N days with an animated slide',
		'Today is subtly highlighted',
		'Selected day gets an elevated fill',
		'Month labels follow the i18n locale, RTL supported'
	]}
>
	<ComponentCard
		{controls}
		description="A compact calendar with configurable scale, range, and selected-day color."
		code={`<MiniCalendar
	size="${controls.value.size}"
	color="${controls.value.color}"
	days={${controls.value.days}}
	disabled={${controls.value.disabled}}
/>`}
	>
		<MiniCalendar
			value={today}
			size={controls.value.size}
			color={controls.value.color}
			days={controls.value.days}
			disabled={controls.value.disabled}
		/>
	</ComponentCard>

	{#snippet examples()}
		<!-- Example 1: Bind value with a live readout -->
		<ComponentCard
			description="Bind value and read the picked date"
			code={`<script>
	let selected = $state<Date | null>(new Date());
</scr${'ipt'}>

<MiniCalendar bind:value={selected} />
<p>Selected: {selected?.toLocaleDateString()}</p>`}
		>
			<div class="flex flex-col items-center gap-3">
				<MiniCalendar bind:value={selected} />
				<p class="text-neutral/70 text-sm">Selected: {readout}</p>
			</div>
		</ComponentCard>

		<!-- Example 2: Custom day count -->
		<ComponentCard
			description="Show seven days at a time via days"
			code={`<MiniCalendar days={7} />`}
		>
			<MiniCalendar days={7} />
		</ComponentCard>

		<!-- Example 3: Sizes -->
		<ComponentCard
			description="Small, normal and large sizes"
			code={`<MiniCalendar size="small" />
<MiniCalendar size="normal" />
<MiniCalendar size="large" />`}
		>
			<div class="flex flex-col items-center gap-3">
				<MiniCalendar size="small" />
				<MiniCalendar size="normal" />
				<MiniCalendar size="large" />
			</div>
		</ComponentCard>

		<!-- Example 4: Colors -->
		<ComponentCard
			description="Accent color of the selected day"
			code={`<MiniCalendar color="primary" value={new Date()} />
<MiniCalendar color="success" value={new Date()} />
<MiniCalendar color="danger" value={new Date()} />`}
		>
			<div class="flex flex-col items-center gap-3">
				<MiniCalendar color="primary" value={new Date()} />
				<MiniCalendar color="success" value={new Date()} />
				<MiniCalendar color="danger" value={new Date()} />
			</div>
		</ComponentCard>

		<!-- Example 5: Custom day snippet -->
		<ComponentCard
			description="Custom day-cell content via the day snippet"
			code={`<MiniCalendar value={new Date()}>
	{#snippet day({ monthLabel, dayNumber, today })}
		<span class="text-[10px] uppercase opacity-70">{monthLabel}</span>
		<span class="text-lg font-bold">{dayNumber}</span>
		{#if today}<span class="text-[9px] uppercase">today</span>{/if}
	{/snippet}
</MiniCalendar>`}
		>
			<MiniCalendar value={new Date()}>
				{#snippet day({ monthLabel, dayNumber, today })}
					<span class="text-[10px] uppercase opacity-70">{monthLabel}</span>
					<span class="text-lg font-bold">{dayNumber}</span>
					{#if today}<span class="text-[9px] uppercase">today</span>{/if}
				{/snippet}
			</MiniCalendar>
		</ComponentCard>

		<!-- Example 6: Disabled -->
		<ComponentCard
			description="Disabled disables navigation and selection"
			code={`<MiniCalendar disabled value={new Date()} />`}
		>
			<MiniCalendar disabled value={new Date()} />
		</ComponentCard>

		<!-- Example 7: Locale + RTL — month labels and aria-labels follow the I18n catalog locale -->
		<ComponentCard
			description="Arabic catalog: month labels, aria-labels and layout follow the I18n locale"
			code={`<I18n locale="ar">
	<MiniCalendar dir="rtl" value={new Date()} />
</I18n>`}
		>
			<I18n locale="ar" manageDocument={false}>
				<MiniCalendar dir="rtl" value={new Date()} />
			</I18n>
		</ComponentCard>
	{/snippet}
</DocPage>
