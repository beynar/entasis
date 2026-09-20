<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { arrowLeftIcon } from 'entasis/icons/arrowLeft';
	import BlockPreview from '../BlockPreview.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.category.title} blocks · entasis</title>
	<meta name="description" content={data.category.description} />
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-lg border-neutral-muted py-xl flex flex-col border-b">
		<Button href="/blocks" prefix={arrowLeftIcon} variant="link" size="small" class="w-fit"
			>All blocks</Button
		>
		<div class="gap-md flex flex-wrap items-center">
			<h1 class="text-neutral text-3xl font-semibold tracking-tight md:text-4xl">
				{data.category.title}
			</h1>
			<Chip variant="outline" size="small">{data.category.blocks.length} blocks</Chip>
		</div>
		<p class="text-neutral/70 max-w-2xl text-base">{data.category.description}</p>
		<nav aria-label="Blocks in this category" class="gap-sm flex flex-wrap">
			{#each data.category.blocks as block (block.id)}<Chip
					href={`#${block.id}`}
					variant="outline"
					size="small">{block.title}</Chip
				>{/each}
		</nav>
	</header>
	<div class="gap-xl flex flex-col">
		{#each data.category.blocks as block (`${data.category.slug}/${block.id}`)}<BlockPreview
				category={data.category.slug}
				{block}
			/>{/each}
	</div>
</article>
