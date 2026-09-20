<script lang="ts">
	import type { FileTreeIcons } from '@pierre/trees';
	import type { Density } from 'entasis/types';
	import Button from '$lib/components/Button/Button.svelte';
	import Tree from '$lib/components/Tree/Tree.svelte';
	import { gitStatus, workspaceTreePaths } from '../tree-demo-data.js';

	type DensityOption = {
		label: string;
		value: Density;
	};

	const densityOptions: DensityOption[] = [
		{ label: 'Compact', value: 'compact' },
		{ label: 'Default', value: 'normal' },
		{ label: 'Relaxed', value: 'comfortable' }
	];

	let density = $state<Density>('compact');
	let coloredIcons = $state(true);

	const icons = $derived<FileTreeIcons>({
		set: 'complete',
		colored: coloredIcons,
		byFileName: {
			'Tree.svelte': 'tree'
		},
		byFileExtension: {
			svelte: 'svelte',
			ts: 'typescript'
		}
	});
</script>

{#snippet segmented(current: Density, options: DensityOption[], onSelect: (value: Density) => void)}
	<div class="flex flex-wrap gap-1">
		{#each options as option (String(option.value))}
			<Button
				size="small"
				variant={current === option.value ? 'solid' : 'ghost'}
				color="neutral"
				onclick={() => onSelect(option.value)}
			>
				{option.label}
			</Button>
		{/each}
	</div>
{/snippet}

<div class="grid w-full max-w-2xl gap-3">
	<div
		class="border-neutral-muted bg-surface flex flex-wrap items-center gap-2 rounded-lg border p-2"
	>
		{@render segmented(density, densityOptions, (value) => (density = value))}
		<Button
			size="small"
			variant={coloredIcons ? 'solid' : 'outline'}
			color="neutral"
			onclick={() => (coloredIcons = !coloredIcons)}
		>
			Color icons
		</Button>
	</div>
	<Tree
		id="docs-tree-icons-density"
		paths={workspaceTreePaths}
		height={320}
		{density}
		{icons}
		{gitStatus}
		initialExpansion="open"
		initialSelectedPaths={['src/lib/components/Tree/Tree.svelte']}
	/>
</div>
