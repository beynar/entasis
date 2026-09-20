<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Empty } from 'entasis/empty';
	import { TextInput } from 'entasis/text-input';
	import { magnifyingGlassIcon } from 'entasis/icons/magnifyingGlass';
	import BlockCategoryCard from './BlockCategoryCard.svelte';
	import { blockCategories, blockCount, blockGroups } from './catalog.js';
	import { workflowBlocks } from './blocks.js';
	import type { BlockGroup } from './catalog/types.js';

	let query = $state('');
	let group = $state<BlockGroup | 'All'>('All');
	const filters: Array<BlockGroup | 'All'> = ['All', ...blockGroups];
	const featured = ['hero', 'dashboard', 'pricing', 'feature', 'login', 'product-list'];
	const categories = [...blockCategories].sort((left, right) => {
		const leftRank = featured.indexOf(left.slug);
		const rightRank = featured.indexOf(right.slug);
		return (
			(leftRank < 0 ? featured.length : leftRank) - (rightRank < 0 ? featured.length : rightRank) ||
			left.title.localeCompare(right.title)
		);
	});
	const filteredCategories = $derived(
		categories.filter((category) => {
			if (group !== 'All' && category.group !== group) return false;
			const search = query.trim().toLowerCase();
			return (
				!search ||
				[
					category.title,
					category.description,
					category.group,
					...category.blocks.flatMap((block) => [
						block.title,
						block.description,
						...block.components
					])
				]
					.join(' ')
					.toLowerCase()
					.includes(search)
			);
		})
	);
</script>

<svelte:head>
	<title>Blocks · entasis</title>
	<meta
		name="description"
		content="A library of complete interfaces composed with Entasis. Browse marketing, application, commerce, and content blocks with live previews and copyable Svelte source."
	/>
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-xl border-neutral-muted py-xl flex flex-col border-b">
		<div class="gap-sm text-neutral/70 flex flex-wrap items-center text-xs font-medium">
			<span class="bg-primary size-1.5 rounded-full"></span><span>THE ENTASIS BLOCK LIBRARY</span>
		</div>
		<div class="gap-xl flex flex-wrap items-end justify-between">
			<div class="gap-lg flex max-w-2xl flex-col">
				<h1 class="text-neutral text-4xl font-semibold tracking-tight md:text-5xl">
					Small pieces. Complete interfaces.
				</h1>
				<p class="text-neutral/70 max-w-xl text-base leading-relaxed">
					From your first sign-in screen to the whole storefront. Explore complete layouts, make
					them yours, and keep building.
				</p>
			</div>
			<div class="gap-xl pb-xs text-neutral flex items-center">
				<div class="gap-xs flex flex-col">
					<span class="text-2xl font-semibold tabular-nums">{blockCount}</span><span
						class="text-neutral/65 text-xs">blocks</span
					>
				</div>
				<div class="border-neutral-muted h-8 border-l"></div>
				<div class="gap-xs flex flex-col">
					<span class="text-2xl font-semibold tabular-nums">{blockCategories.length}</span><span
						class="text-neutral/65 text-xs">categories</span
					>
				</div>
			</div>
		</div>
		<div class="gap-sm text-neutral/65 flex flex-wrap items-center text-xs">
			<span>Live previews</span><span aria-hidden="true">/</span><span>Copyable Svelte</span><span
				aria-hidden="true">/</span
			><span>Your theme, throughout</span>
		</div>
	</header>
	<section aria-label="Browse block categories" class="gap-xl flex flex-col">
		<div class="gap-lg flex flex-wrap items-center justify-between">
			<div role="group" aria-label="Block groups" class="gap-sm flex flex-wrap">
				{#each filters as filter (filter)}
					<Chip selected={group === filter} onclick={() => (group = filter)}>{filter}</Chip>
				{/each}
			</div>
			<TextInput
				bind:value={query}
				placeholder="Search blocks…"
				prefix={magnifyingGlassIcon}
				inputAttrs={{ 'aria-label': 'Search blocks' }}
				class="w-full sm:w-64"
			/>
		</div>
		<div class="gap-md text-neutral/65 flex items-center justify-between text-xs">
			<p role="status">
				{filteredCategories.length}
				{filteredCategories.length === 1 ? 'category' : 'categories'}{query.trim()
					? ` matching “${query.trim()}”`
					: ' to explore'}
			</p>
			<span>2–5 layouts per category</span>
		</div>
		{#if filteredCategories.length}
			<div class="gap-lg grid min-w-0 sm:grid-cols-2 xl:grid-cols-3">
				{#each filteredCategories as category (category.slug)}<BlockCategoryCard
						{category}
					/>{/each}
			</div>
		{:else}
			<Empty
				title="No blocks found"
				description="Try another search or explore a different collection."
				bordered
			>
				{#snippet content()}<Button
						variant="outline"
						onclick={() => {
							query = '';
							group = 'All';
						}}>Clear filters</Button
					>{/snippet}
			</Empty>
		{/if}
	</section>
	<section
		class="gap-lg border-neutral-muted py-xl flex flex-col border-t"
		aria-labelledby="workflow-heading"
	>
		<div class="gap-sm flex flex-col">
			<h2 id="workflow-heading" class="text-neutral text-xl font-semibold tracking-tight">
				Application workflows
			</h2>
			<p class="text-neutral/70 text-sm">
				Explore the original examples for forms, navigation, uploads, and asynchronous state.
			</p>
		</div>
		<div class="gap-sm grid sm:grid-cols-2 lg:grid-cols-3">
			{#each workflowBlocks as block (block.slug)}<a
					href={resolve('/blocks/[category]', { category: block.slug })}
					class="state-layer border-neutral-muted p-lg text-neutral rounded-md border text-sm"
					>{block.title} <span class="text-neutral/65" aria-hidden="true">↗</span></a
				>{/each}
		</div>
	</section>
</article>
