<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Card } from 'entasis/card';
	import { archiveIcon } from 'entasis/icons/archive';
	import { clockCountdownIcon } from 'entasis/icons/clockCountdown';
	import { downloadSimpleIcon } from 'entasis/icons/downloadSimple';
	import { lifebuoyIcon } from 'entasis/icons/lifebuoy';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
	import { userPlusIcon } from 'entasis/icons/userPlus';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { faqs } from '../content.js';

	let { params }: { params: Params } = $props();

	/** One topic icon per question, keyed by the question id in the copy deck. */
	const icons: Record<string, Snippet> = {
		trial: clockCountdownIcon,
		import: downloadSimpleIcon,
		guests: userPlusIcon,
		security: shieldCheckIcon,
		cancel: archiveIcon,
		support: lifebuoyIcon
	};
	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const list = $derived(params.layout === 'list');
	// Each line of a list pads by the density lever, on the spacing scale.
	const linePad = $derived(
		density === 'compact' ? 'py-md' : density === 'comfortable' ? 'py-xl' : 'py-lg'
	);
	const cards = $derived(params.cards as 'ghost' | 'outline' | 'soft' | 'solid');
	const questions = $derived(faqs.slice(0, Number(params.count)));
	// The tile steps off the surface it sits on: a soft card, or a tint showing through a
	// transparent answer, already paints the muted rung, so the tile lifts to the base surface.
	const tileClass = $derived(
		cards === 'soft' || (tone === 'tint' && cards !== 'solid')
			? 'bg-surface text-primary-readable'
			: 'bg-primary-muted text-primary-muted-readable'
	);
</script>

{#snippet tile(faq: (typeof faqs)[number])}
	<span class="grid size-10 shrink-0 place-items-center rounded-md {tileClass}" aria-hidden="true"
		>{@render icons[faq.id]()}</span
	>
{/snippet}

{#snippet answer(faq: (typeof faqs)[number])}
	<div
		class="gap-md flex flex-col items-start {params.divider
			? 'border-neutral-muted pt-lg border-t'
			: ''}"
	>
		{#if params.icon}
			{@render tile(faq)}
		{/if}
		<div class="gap-xs flex flex-col">
			<h3 class="text-base font-semibold text-pretty">{faq.title}</h3>
			<p class="text-neutral/70 text-sm text-pretty">{faq.content}</p>
		</div>
	</div>
{/snippet}

{#snippet lines(onCard: boolean)}
	<!-- One answer per line: the question on the start side, its answer beside it. On a card, the
	     card's own edge and padding open and close the list. -->
	<div class="flex flex-col">
		{#each questions as faq (faq.id)}
			<div
				class="gap-x-layout-lg gap-y-sm grid {linePad} @min-[48rem]/section:grid-cols-12 {params.divider
					? 'border-neutral-muted border-t'
					: ''} {onCard ? 'first:border-t-0 first:pt-0 last:pb-0' : ''}"
			>
				<div class="gap-md flex items-start @min-[48rem]/section:col-span-5">
					{#if params.icon}
						{@render tile(faq)}
					{/if}
					<h3 class="text-base font-semibold text-pretty {params.icon ? 'pt-sm' : ''}">
						{faq.title}
					</h3>
				</div>
				<p
					class="text-neutral/70 text-base text-pretty @min-[48rem]/section:col-span-7 {params.icon
						? '@min-[48rem]/section:pt-sm'
						: ''}"
				>
					{faq.content}
				</p>
			</div>
		{/each}
	</div>
{/snippet}

<SectionShell {tone} {density} label="Frequently asked questions">
	<div class="gen-flow">
		<SectionHeader
			align={params.align === 'center' ? 'center' : 'start'}
			headline={params.headline as Headline}
			title="Good questions, short answers."
			body="The things teams ask most before they switch. Every answer is already open."
		/>
		{#if list}
			{#if cards === 'ghost'}
				{@render lines(false)}
			{:else}
				<Card variant={cards} {density}>
					{@render lines(true)}
				</Card>
			{/if}
		{:else}
			<div class="gen-items" data-cols={params.columns}>
				{#each questions as faq (faq.id)}
					{#if cards === 'ghost'}
						{@render answer(faq)}
					{:else}
						<Card variant={cards} {density} class="h-full">
							{@render answer(faq)}
						</Card>
					{/if}
				{/each}
			</div>
		{/if}
	</div>
</SectionShell>
