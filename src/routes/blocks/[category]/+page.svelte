<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { arrowLeftIcon } from 'svelai/icons/arrowLeft';
	import BlockPreview from '../BlockPreview.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.category.title} blocks · svelai</title>
	<meta name="description" content={data.category.description} />
</svelte:head>

<article class="mx-auto flex w-full max-w-7xl flex-col gap-xl">
	<header class="flex flex-col gap-lg border-b border-neutral-muted py-xl">
		<Button href="/blocks" prefix={arrowLeftIcon} variant="link" size="small" class="w-fit"
			>All blocks</Button
		>
		<div class="flex flex-wrap items-center gap-md">
			<h1 class="text-3xl font-semibold tracking-tight text-neutral md:text-4xl">
				{data.category.title}
			</h1>
			<Chip variant="outline" size="small">{data.category.blocks.length} blocks</Chip>
		</div>
		<p class="max-w-2xl text-base text-neutral/60">{data.category.description}</p>
		<nav aria-label="Blocks in this category" class="flex flex-wrap gap-sm">
			{#each data.category.blocks as block (block.id)}<Chip
					href={`#${block.id}`}
					variant="outline"
					size="small">{block.title}</Chip
				>{/each}
		</nav>
	</header>
	<div class="flex flex-col gap-xl">
		{#each data.category.blocks as block (`${data.category.slug}/${block.id}`)}<BlockPreview
				category={data.category.slug}
				{block}
			/>{/each}
	</div>
</article>
