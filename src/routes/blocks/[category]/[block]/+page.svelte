<script lang="ts">
	import { Button } from 'svelai/button';
	import { arrowLeftIcon } from 'svelai/icons/arrowLeft';
	import BlockPreview from '../../BlockPreview.svelte';
	import type { PageData } from './$types.js';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.block.title} · {data.category.title} blocks · svelai</title>
	<meta name="description" content={data.block.description} />
</svelte:head>

<article class="mx-auto flex w-full max-w-7xl flex-col gap-xl">
	<header class="flex flex-col items-start gap-lg py-lg">
		<Button
			href={`/blocks/${data.category.slug}`}
			prefix={arrowLeftIcon}
			variant="link"
			size="small">{data.category.title} blocks</Button
		>
		<h1 class="text-3xl font-semibold tracking-tight text-neutral">{data.block.title}</h1>
	</header>
	{#key `${data.category.slug}/${data.block.id}`}<BlockPreview
			category={data.category.slug}
			block={data.block}
		/>{/key}
</article>
