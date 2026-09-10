<script lang="ts">
	import ButtonGroup from '$lib/components/ButtonGroup/ButtonGroup.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { colors, sizes, variants } from '$lib/utils/tokens.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const items = [{ children: 'One' }, { children: 'Two' }, { children: 'Three' }];
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
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);
</script>

<DocPage
	title="Button group"
	subtitle="Groups related buttons into a single connected control."
	component="ButtonGroup"
	features={[
		'Composes shared Button primitives',
		'Joined segments with shared borders',
		'focus-visible ring lifts above neighbors',
		'Shared size, color & variant props'
	]}
>
	<ComponentCard
		{controls}
		code={`<ButtonGroup size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" disabled={${controls.value.disabled}} items={[...]} />`}
	>
		<ButtonGroup
			size={controls.value.size}
			variant={controls.value.variant}
			color={controls.value.color}
			disabled={controls.value.disabled}
			items={[{ children: 'Button 1' }, { children: 'Button 2' }, { children: 'Button 3' }]}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Three variants join their segments into one connected control.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each variants as variant (variant)}
					<ButtonGroup {variant} color="neutral" {items} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Seven semantic colors, shown here in the solid variant.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each colors as color (color)}
					<ButtonGroup {color} {items} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Three sizes to match surrounding density.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each sizes as size (size)}
					<ButtonGroup {size} color="neutral" {items} />
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard description="Disabled groups are dimmed and ignore interaction.">
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each variants as variant (variant)}
					<ButtonGroup {variant} color="neutral" disabled {items} />
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
