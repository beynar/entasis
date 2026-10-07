<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card } from 'entasis/card';
	import { arrowsClockwiseIcon } from 'entasis/icons/arrowsClockwise';
	import { bellIcon } from 'entasis/icons/bell';
	import { chartLineUpIcon } from 'entasis/icons/chartLineUp';
	import { clockCounterClockwiseIcon } from 'entasis/icons/clockCounterClockwise';
	import { mapTrifoldIcon } from 'entasis/icons/mapTrifold';
	import { treeStructureIcon } from 'entasis/icons/treeStructure';
	import { userPlusIcon } from 'entasis/icons/userPlus';
	import { usersThreeIcon } from 'entasis/icons/usersThree';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { features } from '../content.js';

	let { params }: { params: Params } = $props();

	const icons: Snippet[] = [
		mapTrifoldIcon,
		treeStructureIcon,
		bellIcon,
		usersThreeIcon,
		chartLineUpIcon,
		userPlusIcon,
		arrowsClockwiseIcon,
		clockCounterClockwiseIcon
	];
	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'grid' | 'bento' | 'list');
	const center = $derived(params.align === 'center');
	const columns = $derived(Number(params.columns));
	const items = $derived(features.slice(0, Number(params.count)));
	const cards = $derived(params.cards as 'ghost' | 'outline' | 'soft' | 'solid');
	// The tile steps off whatever it sits on: straight on a tint it lifts to the base surface
	// instead; inside a card it keeps the primary tint.
	const tileClass = $derived(
		tone === 'tint' && cards === 'ghost'
			? 'bg-surface text-primary-readable'
			: 'bg-primary-muted text-primary-muted-readable'
	);
	// An outline card is see-through, so the bento pattern frames against the section; the other
	// cards paint their own surface.
	const mediaTone = $derived<Tone>(cards === 'outline' ? tone : 'plain');
</script>

{#snippet glyph(index: number)}
	{#if params.icon === 'tile'}
		<span class="grid size-10 shrink-0 place-items-center rounded-md {tileClass}" aria-hidden="true"
			>{@render icons[index]()}</span
		>
	{:else if params.icon === 'plain'}
		<span class="text-primary-readable shrink-0 text-2xl" aria-hidden="true"
			>{@render icons[index]()}</span
		>
	{/if}
{/snippet}

{#snippet item(feature: (typeof features)[number], index: number)}
	<div class="gap-md flex flex-col {center ? 'items-center text-center' : 'items-start'}">
		{@render glyph(index)}
		<div class="gap-xs flex flex-col">
			<h3 class="text-base font-semibold">{feature.title}</h3>
			<p class="text-neutral/70 text-sm text-pretty">{feature.body}</p>
		</div>
	</div>
{/snippet}

{#snippet header(align: 'start' | 'center')}
	<SectionHeader
		{align}
		headline={params.headline as Headline}
		title="Everything a team needs to plan with confidence."
		body="Meridian brings the plan, the decisions behind it, and the work itself into one place."
	/>
{/snippet}

<SectionShell {tone} {density} label="Features">
	{#if layout === 'list'}
		<!-- A ruled list beside the heading: one feature per row, its icon on the side. -->
		<div class="gen-grid">
			<div class="gen-col" style:--gen-span={6} style:--gen-row={1}>
				{@render header('start')}
			</div>
			<div class="gen-col" style:--gen-span={6} style:--gen-start={7} style:--gen-row={1}>
				<ul class="border-neutral-muted flex flex-col border-b">
					{#each items as feature, index (feature.title)}
						<li class="border-neutral-muted gap-lg py-lg flex items-start border-t">
							{@render glyph(index)}
							<div class="gap-xs flex flex-col">
								<h3 class="text-base font-semibold">{feature.title}</h3>
								<p class="text-neutral/70 text-sm text-pretty">{feature.body}</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{:else}
		<div class="gen-flow">
			{@render header(center ? 'center' : 'start')}
			<div class="gen-items" data-cols={columns}>
				{#each items as feature, index (feature.title)}
					{#if layout === 'bento' && index === 0}
						<!-- The lead tile spans two tracks and two rows; its pattern fills what the
						     neighbouring rows leave, so it never sets the height of the mosaic. -->
						<Card
							variant={cards}
							{density}
							class="h-full @min-[36rem]/section:col-span-2 @min-[56rem]/section:row-span-2"
							theme={{ content: { base: 'flex flex-1 flex-col' } }}
						>
							<div class="gap-lg flex flex-1 flex-col {center ? 'items-center text-center' : ''}">
								{@render glyph(index)}
								<div class="gap-sm flex flex-col">
									<h3 class="text-xl font-semibold">{feature.title}</h3>
									<p class="text-neutral/70 text-base text-pretty">{feature.body}</p>
								</div>
								<div class="relative min-h-40 w-full flex-1">
									<div class="absolute inset-0">
										<Media kind="pattern" ratio="wide" tone={mediaTone} class="size-full" />
									</div>
								</div>
							</div>
						</Card>
					{:else if cards === 'ghost'}
						{@render item(feature, index)}
					{:else}
						<Card variant={cards} {density} class="h-full">
							{@render item(feature, index)}
						</Card>
					{/if}
				{/each}
			</div>
		</div>
	{/if}
</SectionShell>
