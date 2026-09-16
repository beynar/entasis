<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import { Heading } from '$lib/components/Heading/index.js';
	import { Code } from '$lib/components/Code/index.js';
	import { blockCount, blockCategories } from './blocks/catalog.js';
	import { componentInventory } from '$lib/generated/componentContract.js';

	const componentCount = componentInventory.filter(
		(entry) =>
			entry.visibility === 'public' &&
			(entry.capabilities as readonly string[]).includes('component')
	).length;

	const install = `pnpm add svelai`;
	const setup = `@import 'tailwindcss';
@source '../node_modules/svelai/dist';
@plugin 'svelai/tailwind-plugin/theme' {
	name: light;
	default: true;
	colorscheme: light;
	surface: #fafafa;
	neutral: #18181b;
	primary: #5f62ef;
}`;

	const pillars = [
		{
			title: 'Configuration over markup',
			text: 'One component, one props contract, snippets for composition. No Root/Trigger/Content trees to assemble.'
		},
		{
			title: 'Laws, not conventions',
			text: 'Value and disclosure state, selection events, focus and dismissal are enforced by tests and contract tooling on every build.'
		},
		{
			title: 'Themed from tokens',
			text: 'OKLCH-generated palettes, elevation, radius, type and motion scales. Retune globally, per subtree, or per instance.'
		},
		{
			title: 'Accessible by default',
			text: 'Focus scopes, layered dismissal, roving tabindex, type-ahead, RTL and reduced motion come with every overlay and control.'
		}
	];
</script>

<svelte:head>
	<title>svelai · Svelte 5 design system</title>
	<meta
		name="description"
		content="A configuration-over-markup component library for SvelteKit and Tailwind 4, with a token engine, enforced API laws and accessible overlays."
	/>
</svelte:head>

<div class="gap-layout-xl px-lg py-layout-lg mx-auto flex max-w-5xl flex-col">
	<section class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-medium tracking-wide uppercase">svelai</p>
		<Heading size="h1" class="max-w-3xl text-balance">
			Configured components for SvelteKit, with the engine of a design system.
		</Heading>
		<p class="text-neutral/70 max-w-2xl text-lg text-pretty">
			{componentCount} components, {blockCount} blocks across {blockCategories.length} categories, a Tailwind
			4 token engine, and accessibility laws that are tested rather than promised.
		</p>
		<div class="gap-sm flex flex-wrap">
			<Button href="/components" color="primary">Browse components</Button>
			<Button href="/blocks" variant="outline">Explore blocks</Button>
			<Button href="/docs/colors" variant="ghost">Read the docs</Button>
		</div>
	</section>

	<section class="gap-lg grid md:grid-cols-2">
		<div class="gap-sm flex flex-col">
			<Heading size="h4" as="h2">Install</Heading>
			<Code code={install} language="bash" />
		</div>
		<div class="gap-sm flex flex-col">
			<Heading size="h4" as="h2">Tailwind setup</Heading>
			<Code code={setup} language="css" />
		</div>
	</section>

	<section class="gap-md grid sm:grid-cols-2">
		{#each pillars as pillar (pillar.title)}
			<article class="raised-1 bg-surface gap-xs p-lg flex flex-col rounded-lg">
				<h3 class="font-medium">{pillar.title}</h3>
				<p class="text-neutral/70 text-sm">{pillar.text}</p>
			</article>
		{/each}
	</section>
</div>
