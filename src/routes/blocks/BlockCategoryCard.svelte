<script lang="ts">
	import { resolve } from '$app/paths';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
	import BlockFrame from './BlockFrame.svelte';
	import type { BlockCategory } from './catalog/types.js';

	let { category }: { category: BlockCategory } = $props();
</script>

<a
	href={resolve('/blocks/[category]', { category: category.slug })}
	class="group border-neutral-muted bg-surface-canvas hover:border-primary/50 focus-visible:outline-primary flex min-w-0 flex-col overflow-hidden rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
>
	<div class="border-neutral-muted p-sm border-b">
		<BlockFrame
			category={category.slug}
			block={category.blocks[0].id}
			title={category.title}
			thumbnail
		/>
	</div>
	<div class="gap-md p-lg flex items-start justify-between">
		<div class="gap-xs flex min-w-0 flex-col">
			<h2 class="text-neutral text-sm font-semibold">{category.title}</h2>
			<p class="text-neutral/65 text-xs">{category.blocks.length} blocks · {category.group}</p>
		</div>
		{@render arrowUpRightIcon({
			class: 'size-4 text-neutral/35 transition-colors group-hover:text-primary-readable'
		})}
	</div>
</a>
