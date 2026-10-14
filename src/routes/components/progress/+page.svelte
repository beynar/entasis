<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { Progress } from '$lib/components/Progress/index.js';
	import { colors } from '$lib/utils/tokens.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
		},
		{ name: 'indeterminate', type: 'switch', label: 'Indeterminate', value: false },
		{
			name: 'value',
			type: 'slider',
			label: 'Progress',
			value: 45,
			min: 0,
			max: 100,
			step: 1,
			showValue: true
		}
	]);

	const value = $derived(controls.value.indeterminate ? null : controls.value.value);

	let uploaded = $state(0);
	$effect(() => {
		const interval = setInterval(() => {
			uploaded = uploaded >= 100 ? 0 : uploaded + 10;
		}, 700);
		return () => clearInterval(interval);
	});
</script>

<DocPage
	title="Progress"
	subtitle="Linear progress bar, determinate or indeterminate."
	component="Progress"
	features={[
		'Determinate fill that animates between values',
		'Indeterminate state with value={null}',
		'Values clamped into a configurable min/max range',
		'Locale-aware value text with Intl format options',
		{ label: 'role=progressbar with value text for screen readers', test: 'a11y:progress.role' },
		{ label: 'Presentational text keeps the name readable in NVDA', test: 'a11y:progress.nvda' },
		'size, density and semantic color tokens'
	]}
>
	<ComponentCard
		{controls}
		description="The value text is always announced; showValue makes it visible."
		code={`<Progress
	value={${controls.value.indeterminate ? 'null' : controls.value.value}}
	size="${controls.value.size}"
	density="${controls.value.density}"
	color="${controls.value.color}"
	label="Uploading"
	showValue
/>`}
	>
		<Progress
			{value}
			size={controls.value.size}
			density={controls.value.density}
			color={controls.value.color}
			label="Uploading"
			showValue
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Semantic color tokens.">
			<div class="grid w-full gap-4">
				{#each colors as color (color)}
					<Progress value={65} {color} label={color} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Sizes and densities.">
			<div class="grid w-full gap-6">
				<Progress value={60} size="small" density="compact" label="Small and compact" showValue />
				<Progress value={60} label="Normal" showValue />
				<Progress
					value={60}
					size="large"
					density="comfortable"
					label="Large and comfortable"
					showValue
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			description="Indeterminate: the fill slides along the track and no value is announced."
		>
			<Progress value={null} label="Preparing your export" color="primary" />
		</ComponentCard>

		<ComponentCard description="A value that animates as it changes; data-complete is set at 100.">
			<Progress value={uploaded} label="Uploading" color="success" showValue />
		</ComponentCard>

		<ComponentCard
			description="A range that starts above zero: 30 on a 20 to 40 range fills half of the track."
		>
			<Progress value={30} min={20} max={40} label="Temperature" showValue />
		</ComponentCard>

		<ComponentCard
			description="Values past the range are clamped: the fill stops at the track and aria-valuenow stays at max."
		>
			<Progress value={140} label="Clamped to 100%" color="warning" showValue />
		</ComponentCard>

		<ComponentCard
			description="Intl format options and a custom announcement. format applies to the clamped value."
		>
			<Progress
				value={3}
				max={5}
				label="Files imported"
				showValue
				format={{ style: 'decimal' }}
				getAriaValueText={({ formattedValue, max }) => `${formattedValue} of ${max} files imported`}
			/>
		</ComponentCard>

		<ComponentCard
			description="A locale prop formats the percentage: French puts a space before the sign."
		>
			<Progress value={45} locale="fr" label="Progression" showValue />
		</ComponentCard>

		<ComponentCard
			description="valueLabel replaces the visible value text and receives the value state."
		>
			<Progress value={uploaded} label="Sync" showValue color="info">
				{#snippet valueLabel({ formattedValue, status })}
					{status === 'complete' ? 'Done' : formattedValue}
				{/snippet}
			</Progress>
		</ComponentCard>

		<ComponentCard
			description="Without a label the bar is named Progress and the value stays announced."
		>
			<Progress value={25} />
		</ComponentCard>
	{/snippet}
</DocPage>
