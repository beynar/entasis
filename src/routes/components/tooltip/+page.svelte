<script lang="ts">
	import Button from '$lib/components/Button/Button.svelte';
	import { tooltip } from '$lib/components/Tooltip/tooltip.svelte.js';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const placements = ['top', 'bottom', 'left', 'right'] as const;
	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'solid',
			options: variants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{
			name: 'position',
			type: 'segmented',
			label: 'Position',
			value: 'top',
			options: placements
		}
	]);
</script>

<DocPage
	title="Tooltip"
	subtitle="Contextual information on hover, attached to any element."
	component="Tooltip"
	features={[
		'{@attach tooltip()} on any element',
		'Hover-triggered with configurable delay',
		'Chip-aligned solid, outline, and soft variants',
		'Any-side placement via Floating UI',
		'Single shared instance through theme state'
	]}
>
	<ComponentCard
		{controls}
		description="A tooltip attached to a button, shown on hover."
		code={`<Button
	variant="outline"
	color="neutral"
	{@attach tooltip({ content: 'Hover me', size: '${controls.value.size}', variant: '${controls.value.variant}', color: '${controls.value.color}', position: '${controls.value.position}' })}
>
	Hover me
</Button>`}
	>
		<Button
			variant="outline"
			color="neutral"
			{@attach tooltip({
				content: 'Hover me',
				size: controls.value.size,
				variant: controls.value.variant,
				color: controls.value.color,
				position: controls.value.position
			})}
		>
			Hover me
		</Button>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="The same variants and sizes as Chip.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each variants as variant}
					<Button
						variant="outline"
						color="neutral"
						{@attach tooltip({ content: variant, variant })}
					>
						{variant}
					</Button>
				{/each}
				{#each sizes as size}
					<Button
						variant="outline"
						color="neutral"
						{@attach tooltip({ content: size, size, color: 'info', variant: 'soft' })}
					>
						{size}
					</Button>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Placement on all sides and a longer open delay.">
			<div class="flex items-center justify-center gap-4">
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Top tooltip', position: 'top' })}
				>
					Top
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Bottom tooltip', position: 'bottom' })}
				>
					Bottom
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Left tooltip', position: 'left' })}
				>
					Left
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Right tooltip', position: 'right' })}
				>
					Right
				</Button>
				<Button
					variant="outline"
					color="neutral"
					{@attach tooltip({ content: 'Shows after 1s', delay: 1000 })}
				>
					Long delay
				</Button>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
