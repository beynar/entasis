<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { ResolvedPathname } from '$app/types';
	import { page } from '$app/state';
	import { Button } from 'entasis/button';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { shuffleIcon } from 'entasis/icons/shuffle';
	import { findDirection } from './engine/directions.js';
	import { kitType } from './engine/kit.js';
	import { countPages, formatCount } from './engine/composition.js';
	import { freshSeed } from './engine/random.js';
	import { directedSpace, seededVariant } from './engine/space.js';
	import { lookupSection, sectionCategories, sectionTypes, typesInCategory } from './registry.js';
	import { recipes, specFromRecipe } from './recipes.js';
	import BlockCard from './ui/BlockCard.svelte';
	import DirectionPicker from './ui/DirectionPicker.svelte';

	const direction = $derived(findDirection(page.url.searchParams.get('direction')));
	let seed = $state('catalog');

	// One kit for the whole listing, drawn from the same seed: shuffling restyles every card at once.
	const kit = $derived(seededVariant(directedSpace(kitType, direction), seed, 'kit'));
	const variantCount = $derived(
		sectionTypes.reduce((sum, type) => sum + directedSpace(type, direction).indices.length, 0)
	);
	const landingPages = $derived(
		countPages(specFromRecipe(recipes[0], seed, direction.id), direction, lookupSection)
	);

	function setDirection(id: string) {
		// `resolve()` only accepts a route id, so the query is appended to what it returns.
		const base = resolve('/blocks/generative');
		const target = (id === 'neutral' ? base : `${base}?direction=${id}`) as ResolvedPathname;
		void goto(target, { replaceState: true, noScroll: true, keepFocus: true });
	}

	const steps = [
		{
			title: 'Levers, not free values',
			body: 'Each section type is a handful of short enums — columns of 12, a tone on the surface ladder, a density, a heading step. Nothing is a free pixel or colour.'
		},
		{
			title: 'Rules make it legal',
			body: 'The product of the levers is filtered by unary and relational rules: spans sum to 12, an H1 needs room, soft cards never sit on a tint.'
		},
		{
			title: 'A seed picks an index',
			body: 'Randomness is one weighted draw into the legal list. The same seed paints the same page, on the server and in the browser, forever.'
		},
		{
			title: 'One kit for every component',
			body: 'Entasis normalises size, variant and colour across components, so one kit of five levers restyles every button, chip and field on a page at once.'
		},
		{
			title: 'Direction above it all',
			body: 'An art direction fixes the tokens (an Entasis theme), narrows levers and the kit, biases picks, and adds page rules that a bounded repair enforces.'
		}
	];
</script>

<svelte:head>
	<title>Generative blocks · entasis</title>
	<meta
		name="description"
		content="Twelve section categories, two generative section types each. Every variant is picked by a seed from a countable list of legal layouts built on Entasis tokens."
	/>
</svelte:head>

<article class="gap-xl mx-auto flex w-full max-w-7xl flex-col">
	<header class="gap-xl border-neutral-muted py-xl flex flex-col border-b">
		<div class="gap-sm text-neutral/70 flex flex-wrap items-center text-xs font-medium">
			<span class="bg-primary size-1.5 rounded-full"></span><span>STRUCTURED RANDOMIZATION</span>
		</div>
		<div class="gap-xl flex flex-wrap items-end justify-between">
			<div class="gap-lg flex max-w-2xl flex-col">
				<h1 class="text-neutral text-4xl font-semibold tracking-tight md:text-5xl">
					Generative blocks
				</h1>
				<p class="text-neutral/70 max-w-xl text-base leading-relaxed">
					Two section types per category, each a small set of levers filtered by rules into a
					countable list of legal variants. A seed picks one. Nothing off the grid, off the palette,
					or off the type scale can come out.
				</p>
				<div class="gap-sm flex flex-wrap">
					<Button href={resolve('/blocks/generative/compose')} suffix={arrowRightIcon}
						>Compose a page</Button
					>
					<Button href="#how-it-works" variant="outline" color="neutral">How it works</Button>
				</div>
			</div>
			<dl class="gap-xl pb-xs text-neutral flex items-center">
				<div class="gap-xs flex flex-col-reverse">
					<dt class="text-neutral/65 text-xs">section types</dt>
					<dd class="text-2xl font-semibold tabular-nums">{sectionTypes.length}</dd>
				</div>
				<div class="border-neutral-muted h-8 border-l"></div>
				<div class="gap-xs flex flex-col-reverse">
					<dt class="text-neutral/65 text-xs">legal sections</dt>
					<dd class="text-2xl font-semibold tabular-nums">
						{variantCount.toLocaleString('en-US')}
					</dd>
				</div>
				<div class="border-neutral-muted h-8 border-l"></div>
				<div class="gap-xs flex flex-col-reverse">
					<dt class="text-neutral/65 text-xs">
						{landingPages.exact ? '' : '≈ '}landing pages
					</dt>
					<dd class="text-2xl font-semibold tabular-nums">{formatCount(landingPages.value)}</dd>
				</div>
			</dl>
		</div>
	</header>

	<section
		aria-label="Preview controls"
		class="gap-lg border-neutral-muted bg-surface-canvas p-lg flex flex-wrap items-start justify-between rounded-lg border"
	>
		<div class="w-full max-w-sm">
			<DirectionPicker value={direction.id} onValueChange={setDirection} />
		</div>
		<div class="gap-sm flex flex-wrap items-center">
			<span class="text-neutral/60 text-xs tabular-nums">Seed · {seed}</span>
			<Button
				size="small"
				variant="outline"
				color="neutral"
				prefix={shuffleIcon}
				onclick={() => (seed = freshSeed())}>Shuffle previews</Button
			>
		</div>
	</section>

	{#each sectionCategories as category (category.slug)}
		{@const types = typesInCategory(category.slug)}
		<section
			id={category.slug}
			class="gap-lg flex scroll-mt-8 flex-col"
			aria-labelledby={`${category.slug}-heading`}
		>
			<div class="gap-xs flex flex-col">
				<h2
					id={`${category.slug}-heading`}
					class="text-neutral text-xl font-semibold tracking-tight"
				>
					{category.title}
				</h2>
				<p class="text-neutral/70 text-sm">{category.description}</p>
			</div>
			{#if types.length}
				<div class="gap-lg grid min-w-0 sm:grid-cols-2">
					{#each types as type (type.id)}
						<BlockCard
							{type}
							{direction}
							{kit}
							params={seededVariant(directedSpace(type, direction), seed, type.id)}
						/>
					{/each}
				</div>
			{:else}
				<p class="text-neutral/60 text-sm">Coming soon.</p>
			{/if}
		</section>
	{/each}

	<section
		id="how-it-works"
		class="gap-lg border-neutral-muted py-xl flex scroll-mt-8 flex-col border-t"
		aria-labelledby="how-heading"
	>
		<h2 id="how-heading" class="text-neutral text-xl font-semibold tracking-tight">How it works</h2>
		<ol class="gap-lg grid sm:grid-cols-2 lg:grid-cols-5">
			{#each steps as step, index (step.title)}
				<li class="gap-sm flex flex-col">
					<span class="text-primary-readable text-xs font-semibold tabular-nums"
						>{String(index + 1).padStart(2, '0')}</span
					>
					<h3 class="text-neutral text-sm font-semibold">{step.title}</h3>
					<p class="text-neutral/70 text-sm">{step.body}</p>
				</li>
			{/each}
		</ol>
	</section>
</article>
