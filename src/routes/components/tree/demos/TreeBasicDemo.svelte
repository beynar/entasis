<script lang="ts">
	import Tree from '$lib/components/Tree/Tree.svelte';
	import { basicTreePaths } from '../tree-demo-data.js';

	let {
		density = 'normal',
		search = true
	}: {
		density?: 'small' | 'normal' | 'large';
		search?: boolean;
	} = $props();
</script>

<div class="w-full max-w-2xl">
	<Tree
		id="docs-tree-basic"
		paths={basicTreePaths}
		height={320}
		{density}
		initialExpansion="open"
		initialSelectedPaths={['src/lib/components/Tree/Tree.svelte']}
		{search}
		initialSearchQuery={search ? 'Tree' : undefined}
		searchBlurBehavior="retain"
	/>
</div>
