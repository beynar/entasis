<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Empty } from 'svelai/empty';
	import { TextInput } from 'svelai/text-input';
	import { magnifyingGlassIcon } from 'svelai/icons/magnifyingGlass';
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
	<title>Blocks · svelai</title>
	<meta
		name="description"
		content="A library of complete interfaces composed with Svelai. Browse marketing, application, commerce, and content blocks with live previews and copyable Svelte source."
	/>
</svelte:head>

<article class="mx-auto flex w-full max-w-7xl flex-col gap-xl">
	<header class="flex flex-col gap-xl border-b border-neutral-muted py-xl">
		<div class="flex flex-wrap items-center gap-sm text-xs font-medium text-neutral/60">
			<span class="size-1.5 rounded-full bg-primary"></span><span>THE SVELAI BLOCK LIBRARY</span>
		</div>
		<div class="flex flex-wrap items-end justify-between gap-xl">
			<div class="flex max-w-2xl flex-col gap-lg">
				<h1 class="text-4xl font-semibold tracking-tight text-neutral md:text-5xl">
					Small pieces. Complete interfaces.
				</h1>
				<p class="max-w-xl text-base leading-relaxed text-neutral/60">
					From your first sign-in screen to the whole storefront. Explore complete layouts, make
					them yours, and keep building.
				</p>
			</div>
			<div class="flex items-center gap-xl pb-xs text-neutral">
				<div class="flex flex-col gap-xs">
					<span class="text-2xl font-semibold tabular-nums">{blockCount}</span><span
						class="text-xs text-neutral/50">blocks</span
					>
				</div>
				<div class="h-8 border-l border-neutral-muted"></div>
				<div class="flex flex-col gap-xs">
					<span class="text-2xl font-semibold tabular-nums">{blockCategories.length}</span><span
						class="text-xs text-neutral/50">categories</span
					>
				</div>
			</div>
		</div>
		<div class="flex flex-wrap items-center gap-sm text-xs text-neutral/50">
			<span>Live previews</span><span aria-hidden="true">/</span><span>Copyable Svelte</span><span
				aria-hidden="true">/</span
			><span>Your theme, throughout</span>
		</div>
	</header>
	<section aria-label="Browse block categories" class="flex flex-col gap-xl">
		<div class="flex flex-wrap items-center justify-between gap-lg">
			<div role="group" aria-label="Block groups" class="flex flex-wrap gap-sm">
				{#each filters as filter (filter)}
					<Chip
						variant={group === filter ? 'solid' : 'outline'}
						color={group === filter ? 'primary' : 'neutral'}
						aria-pressed={group === filter}
						onclick={() => (group = filter)}>{filter}</Chip
					>
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
		<div class="flex items-center justify-between gap-md text-xs text-neutral/50">
			<p role="status">
				{filteredCategories.length}
				{filteredCategories.length === 1 ? 'category' : 'categories'}{query.trim()
					? ` matching “${query.trim()}”`
					: ' to explore'}
			</p>
			<span>2–5 layouts per category</span>
		</div>
		{#if filteredCategories.length}
			<div class="grid min-w-0 gap-lg sm:grid-cols-2 xl:grid-cols-3">
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
		class="flex flex-col gap-lg border-t border-neutral-muted py-xl"
		aria-labelledby="workflow-heading"
	>
		<div class="flex flex-col gap-sm">
			<h2 id="workflow-heading" class="text-xl font-semibold tracking-tight text-neutral">
				Application workflows
			</h2>
			<p class="text-sm text-neutral/60">
				Explore the original examples for forms, navigation, uploads, and asynchronous state.
			</p>
		</div>
		<div class="grid gap-sm sm:grid-cols-2 lg:grid-cols-3">
			{#each workflowBlocks as block (block.slug)}<a
					href={resolve('/blocks/[category]', { category: block.slug })}
					class="state-layer rounded-md border border-neutral-muted p-lg text-sm text-neutral"
					>{block.title} <span class="text-neutral/40" aria-hidden="true">↗</span></a
				>{/each}
		</div>
	</section>
</article>
