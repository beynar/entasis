<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { arrowLeftIcon } from 'entasis/icons/arrowLeft';
	import { legalSpace } from '../engine/space.js';
	import { lookupSection, typesInCategory } from '../registry.js';
	import BlockWorkbench from '../ui/BlockWorkbench.svelte';
	import type { PageData } from './$types.js';

	let { data }: { data: PageData } = $props();

	const type = $derived(lookupSection(data.typeId)!);
	const siblings = $derived(typesInCategory(data.category.slug));
	const space = $derived(legalSpace(type));
</script>

<svelte:head>
	<title>{type.title} · Generative {data.category.title} · entasis</title>
	<meta name="description" content={type.description} />
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-lg border-neutral-muted py-xl flex flex-col border-b">
		<Button
			href={`${resolve('/blocks/generative')}#${data.category.slug}`}
			prefix={arrowLeftIcon}
			variant="link"
			size="small"
			class="w-fit">Generative blocks</Button
		>
		<div class="gap-md flex flex-wrap items-center">
			<h1 class="text-neutral text-3xl font-semibold tracking-tight md:text-4xl">{type.title}</h1>
			<Chip variant="outline" size="small">{data.category.title}</Chip>
		</div>
		<p class="text-neutral/70 max-w-2xl text-base">{type.description}</p>
		<div class="gap-md flex flex-wrap items-center justify-between">
			<nav aria-label={`${data.category.title} section types`} class="gap-sm flex flex-wrap">
				{#each siblings as sibling (sibling.id)}
					<Chip
						href={resolve('/blocks/generative/[block]', { block: sibling.id })}
						variant={sibling.id === type.id ? 'solid' : 'outline'}
						size="small">{sibling.title}</Chip
					>
				{/each}
			</nav>
			<p class="text-neutral/60 text-xs tabular-nums">
				{space.order.length} levers · {space.raw.toLocaleString('en-US')} combinations · {space.variants.length.toLocaleString(
					'en-US'
				)} legal ({Math.round((space.variants.length / space.raw) * 100)}%)
			</p>
		</div>
	</header>
	{#key type.id}
		<BlockWorkbench {type} />
	{/key}
</article>
