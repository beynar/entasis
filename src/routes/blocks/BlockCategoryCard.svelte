<script lang="ts">
	import { resolve } from '$app/paths';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
	import BlockFrame from './BlockFrame.svelte';
	import type { BlockCategory } from './catalog/types.js';

	let { category }: { category: BlockCategory } = $props();
</script>

<a
	href={resolve('/blocks/[category]', { category: category.slug })}
	class="group flex min-w-0 flex-col overflow-hidden rounded-lg border border-neutral-muted bg-surface-canvas transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
>
	<div class="border-b border-neutral-muted p-sm">
		<BlockFrame
			category={category.slug}
			block={category.blocks[0].id}
			title={category.title}
			thumbnail
		/>
	</div>
	<div class="flex items-start justify-between gap-md p-lg">
		<div class="flex min-w-0 flex-col gap-xs">
			<h2 class="text-sm font-semibold text-neutral">{category.title}</h2>
			<p class="text-xs text-neutral/55">{category.blocks.length} blocks · {category.group}</p>
		</div>
		{@render arrowUpRightIcon({
			class: 'size-4 text-neutral/35 transition-colors group-hover:text-primary'
		})}
	</div>
</a>
