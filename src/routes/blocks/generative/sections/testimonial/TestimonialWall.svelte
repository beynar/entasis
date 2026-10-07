<script lang="ts">
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Marquee } from 'entasis/marquee';
	import { Rating } from 'entasis/rating';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { testimonials } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'grid' | 'masonry' | 'marquee');
	const side = $derived(params.header === 'side');
	const center = $derived(!side && params.align === 'center');
	const columns = $derived(Number(params.columns));
	const items = $derived(testimonials.slice(0, Number(params.count)));
	const cards = $derived(params.cards as 'outline' | 'soft' | 'solid');
	// The wall measures its own column, so a quote never narrows below a readable measure when
	// a side header takes 4 of the 12 columns.
	const columnClasses: Record<number, string> = {
		2: '@min-[32rem]/wall:grid-cols-2',
		3: '@min-[36rem]/wall:grid-cols-2 @min-[56rem]/wall:grid-cols-3'
	};
	// Masonry breaks at the same widths, as CSS columns so each card keeps its own height.
	const masonryClasses: Record<number, string> = {
		2: '@min-[32rem]/wall:columns-2',
		3: '@min-[36rem]/wall:columns-2 @min-[56rem]/wall:columns-3'
	};
	// A marquee card is as wide as a grid column would be at the same width, so `columns` still
	// sets how many quotes are in view; a phone shows one and the edge of the next.
	const marqueeWidths: Record<number, string> = {
		2: 'w-[85cqw] @min-[32rem]/wall:w-[calc((100cqw-var(--gen-gutter))/2)]',
		3: 'w-[85cqw] @min-[36rem]/wall:w-[calc((100cqw-var(--gen-gutter))/2)] @min-[56rem]/wall:w-[calc((100cqw-var(--gen-gutter)*2)/3)]'
	};
</script>

{#snippet header()}
	<SectionHeader
		align={center ? 'center' : 'start'}
		headline={params.headline as Headline}
		title="Teams that stopped dreading planning."
		body="Hear it from the people who run their roadmap in Meridian every week."
	/>
{/snippet}

{#snippet quoteCard(item: (typeof testimonials)[number])}
	<Card
		variant={cards}
		{density}
		class="h-full"
		theme={{ content: { base: 'flex flex-1 flex-col' } }}
	>
		<figure class="gap-lg flex flex-1 flex-col">
			{#if params.rating}
				<Rating value={5} size={kit.step(-1)} />
			{/if}
			<blockquote class="text-pretty {columns === 2 ? 'text-lg' : 'text-base'}">
				<p>“{item.quote}”</p>
			</blockquote>
			<figcaption class="gap-md mt-auto flex items-center">
				<Avatar name={item.name} size={kit.size} />
				<div class="flex min-w-0 flex-col">
					<span class="text-sm font-semibold">{item.name}</span>
					<span class="text-neutral/70 text-sm">{item.role}</span>
				</div>
			</figcaption>
		</figure>
	</Card>
{/snippet}

{#snippet wall()}
	<div class="@container/wall">
		{#if layout === 'marquee'}
			<!-- The marquee's one spacing value is the section gutter, so cards and loops share it;
			     the block padding leaves room for the cards' shadows. -->
			<Marquee speed={items.length * 15} class="[--gap:var(--gen-gutter)]">
				<ul class="py-sm flex gap-(--gen-gutter)">
					{#each items as item (item.name)}
						<li class="shrink-0 whitespace-normal {marqueeWidths[columns]}">
							{@render quoteCard(item)}
						</li>
					{/each}
				</ul>
			</Marquee>
		{:else if layout === 'masonry'}
			<ul class="-mb-(--gen-gutter) gap-(--gen-gutter) {masonryClasses[columns]}">
				{#each items as item (item.name)}
					<li class="break-inside-avoid pb-(--gen-gutter)">{@render quoteCard(item)}</li>
				{/each}
			</ul>
		{:else}
			<ul class="grid grid-cols-1 gap-(--gen-gutter) {columnClasses[columns]}">
				{#each items as item (item.name)}
					<li class="min-w-0">{@render quoteCard(item)}</li>
				{/each}
			</ul>
		{/if}
	</div>
{/snippet}

<SectionShell {tone} {density} label="Customer quotes">
	{#if side}
		<div class="gen-grid items-start">
			<div class="gen-col" style:--gen-span={4}>{@render header()}</div>
			<div class="gen-col" style:--gen-span={8} style:--gen-start={5}>{@render wall()}</div>
		</div>
	{:else}
		<div class="gen-flow">
			{@render header()}
			{@render wall()}
		</div>
	{/if}
</SectionShell>
