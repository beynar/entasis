<script lang="ts">
	import { Accordion } from 'entasis/accordion';
	import { Tabbar } from 'entasis/tabbar';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { features } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();
	const uid = $props.id();

	const tone = $derived(params.tone as Tone);
	const layout = $derived(params.layout as 'split' | 'tabs' | 'stacked');
	const textCols = $derived(Number(params.textCols));
	const mediaCols = $derived(12 - textCols);
	const mediaFirst = $derived(params.mediaSide === 'start');
	const media = $derived(params.media as 'product' | 'photo' | 'pattern');
	const ratio = $derived(mediaCols >= 7 ? 'landscape' : mediaCols === 6 ? 'square' : 'portrait');
	const items = $derived(features.slice(0, Number(params.count)));
	const accordionItems = $derived(
		items.map((feature) => ({ id: feature.title, title: feature.title, content: feature.body }))
	);
	// Tabs: the chosen feature, falling back to the first when the item count drops below it.
	let chosen = $state(features[0].title);
	const activeIndex = $derived(
		Math.max(
			0,
			items.findIndex((feature) => feature.title === chosen)
		)
	);
	const active = $derived(items[activeIndex]);
</script>

{#snippet header()}
	<SectionHeader
		headline={params.headline as Headline}
		eyebrow={params.eyebrow ? 'Built for planning' : undefined}
		title="The plan and the work, finally in one place."
		body="Every milestone links to the decisions and tasks behind it, so nobody plans from a stale copy."
	/>
{/snippet}

{#snippet entry(feature: (typeof features)[number], index: number)}
	<li class="gap-md flex items-start">
		{#if params.list === 'numbered'}
			<span
				class="text-primary-readable border-primary/30 pt-xs min-w-8 border-t text-sm font-semibold tabular-nums"
				>{String(index + 1).padStart(2, '0')}</span
			>
		{:else}
			<span class="text-primary-readable pt-xs" aria-hidden="true">{@render checkCircleIcon()}</span
			>
		{/if}
		<div class="gap-xs flex flex-col">
			<h3 class="text-base font-semibold">{feature.title}</h3>
			<p class="text-neutral/70 text-sm text-pretty">{feature.body}</p>
		</div>
	</li>
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} label="Feature spotlight">
	{#if layout === 'stacked'}
		<!-- Stacked: the heading, the media at full width, then the features as columns. -->
		<div class="gen-flow">
			{@render header()}
			<Media kind={media} ratio="wide" {tone} variant={textCols + 1} />
			<ol class="gen-items" data-cols={items.length}>
				{#each items as feature, index (feature.title)}
					{@render entry(feature, index)}
				{/each}
			</ol>
		</div>
	{:else}
		<div class="gen-grid items-center">
			<div
				class="gen-col"
				style:--gen-span={textCols}
				style:--gen-start={mediaFirst ? mediaCols + 1 : 1}
				style:--gen-row={1}
			>
				<div class="gen-flow">
					{@render header()}
					{#if layout === 'tabs'}
						<!-- The features become a vertical tab list; the media column is its panel. -->
						<Tabbar
							id={uid}
							controlsPanels
							label="Features"
							items={items.map((feature) => feature.title)}
							value={active.title}
							onValueChange={(value) => (chosen = value)}
							orientation="vertical"
							variant="pill"
							size={kit.step(1)}
							color={kit.accent}
							fullWidth
							theme={{ tab: { base: 'justify-start' } }}
						/>
					{:else if params.list === 'accordion'}
						<Accordion
							size={kit.size}
							items={accordionItems}
							defaultValue={[accordionItems[0].id]}
							oneAtATime
							headingLevel={3}
						/>
					{:else}
						<ol class="gap-lg flex flex-col">
							{#each items as feature, index (feature.title)}
								{@render entry(feature, index)}
							{/each}
						</ol>
					{/if}
				</div>
			</div>
			<div
				class="gen-col"
				style:--gen-span={mediaCols}
				style:--gen-start={mediaFirst ? 1 : textCols + 1}
				style:--gen-row={1}
			>
				{#if layout === 'tabs'}
					<div
						role="tabpanel"
						id="{uid}-panel-{activeIndex}"
						aria-labelledby="{uid}-tab-{activeIndex}"
						class="relative"
					>
						<Media kind="photo" {ratio} {tone} variant={textCols + 1 + activeIndex} />
						<div
							class="bg-surface text-neutral left-md right-md bottom-md p-md gap-xs lift-2 absolute flex flex-col rounded-md"
						>
							<h3 class="text-base font-semibold">{active.title}</h3>
							<p class="text-neutral/70 text-sm text-pretty">{active.body}</p>
						</div>
					</div>
				{:else}
					<Media kind={media} {ratio} {tone} variant={textCols + 1} />
				{/if}
			</div>
		</div>
	{/if}
</SectionShell>
