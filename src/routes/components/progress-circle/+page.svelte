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
	subtitle="Determinate circular progress indicator."
	component="ProgressCircle"
	features={[
		'Animated value changes',
		'Visible track',
		'size tokens or numeric pixel size',
		'Semantic color tokens'
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
	{/snippet}
</DocPage>
