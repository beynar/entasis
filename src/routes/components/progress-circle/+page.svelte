<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import { ProgressCircle } from '$lib/components/ProgressCircle/index.js';
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
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: ['neutral', 'primary', 'success', 'warning', 'danger', 'info']
		},
		{
			name: 'value',
			type: 'slider',
			label: 'Progress',
			value: 35,
			min: 0,
			max: 100,
			step: 1,
			showValue: true
		}
	]);
</script>

<DocPage
	title="Progress circle"
	subtitle="Circular progress indicator, determinate or indeterminate."
	component="ProgressCircle"
	features={[
		'Animated value changes',
		'Indeterminate state with value={null}',
		'Values clamped into a configurable min/max range',
		'Visible track',
		'size tokens or numeric pixel size',
		'Semantic color tokens',
		{ label: 'Value text inside the progressbar for NVDA', test: 'a11y:progress-circle.nvda' }
	]}
>
	<ComponentCard
		{controls}
		description="Progress value animates when it changes."
		code={`<ProgressCircle
	value={${controls.value.value}}
	size="${controls.value.size}"
	color="${controls.value.color}"
	label="Upload progress"
/>`}
		class="!min-h-fit"
	>
		<ProgressCircle
			value={controls.value.value}
			size={controls.value.size}
			color={controls.value.color}
			label="Upload progress"
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Semantic color tokens." class="!min-h-fit">
			<div class="flex flex-wrap items-center justify-center gap-6">
				{#each colors as color, index (index)}
					<ProgressCircle value={65} {color} label={`${color} progress`} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			description="Indeterminate: value={null} spins a quarter arc and announces no value."
			class="!min-h-fit"
		>
			<ProgressCircle value={null} color="primary" label="Loading" />
		</ComponentCard>

		<ComponentCard
			description="A custom range: 30 on a 20 to 40 range fills half of the circle. data-complete is set at the maximum."
			class="!min-h-fit"
		>
			<div class="flex flex-wrap items-center justify-center gap-6">
				<ProgressCircle value={30} min={20} max={40} label="Temperature" />
				<ProgressCircle value={140} color="success" label="Clamped to the maximum" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
