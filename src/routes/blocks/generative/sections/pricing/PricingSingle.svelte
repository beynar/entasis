<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { plans } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const offer = plans[1];
	// Everything the single plan includes: its own features plus the free tier's unlimited projects.
	const included = [offer.features[0], plans[0].features[1], ...offer.features.slice(1)];

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const banner = $derived(params.layout === 'banner');
	const textCols = $derived(Number(params.textCols));
	const cardCols = $derived(12 - textCols);
	const cardFirst = $derived(params.mediaSide === 'start');
	const cards = $derived(params.cards as 'solid' | 'outline' | 'soft');
	const innerGap = $derived(
		density === 'compact' ? 'gap-lg' : density === 'comfortable' ? 'gap-layout-sm' : 'gap-xl'
	);
	// A neutral hairline or fill vanishes on a soft card's muted fill, so the quiet action and a soft
	// badge take a colour there.
	const quiet = $derived.by(() => {
		const action = kit.quiet();
		const drawsMuted = action.variant === 'outline' || action.variant === 'soft';
		return cards === 'soft' && drawsMuted ? { ...action, color: 'primary' as const } : action;
	});
	const badgeVariant = $derived(cards === 'soft' && kit.chip === 'soft' ? 'solid' : kit.chip);
</script>

{#snippet guarantee()}
	<span class="text-primary-readable flex shrink-0" aria-hidden="true"
		>{@render shieldCheckIcon()}</span
	>
	<span class="text-neutral/70 min-w-0 flex-1 text-sm"
		>30-day money-back guarantee. No questions asked.</span
	>
{/snippet}

{#snippet header()}
	<SectionHeader
		headline={params.headline as Headline}
		title="One plan. Everything your team needs."
		body="No feature tiers to compare and no add-ons to discover later. Pay per member, invite guests for free."
	/>
{/snippet}

{#snippet list()}
	<div class="gap-lg flex flex-col">
		<h3 class="text-sm font-semibold">Everything in {offer.name}</h3>
		<ul
			class="gap-x-xl gap-y-md grid {params.list === 'grid'
				? '@min-[36rem]/section:grid-cols-2'
				: ''}"
		>
			{#each included as item (item)}
				<li class="gap-md flex items-start text-base">
					<span class="text-primary-readable flex shrink-0" aria-hidden="true"
						>{@render checkCircleIcon()}</span
					>
					<span>{item}</span>
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

{#snippet plan(actionsInline: boolean)}
	<div class="flex flex-col {innerGap}">
		<div class="gap-xs flex flex-col">
			<div class="gap-md flex items-center justify-between">
				<h3 class="text-base font-semibold">{offer.name}</h3>
				<Chip size={kit.step(-1)} variant={badgeVariant} color={kit.accent}>14-day trial</Chip>
			</div>
			<p class="text-neutral/70 text-sm text-pretty">{offer.description}</p>
		</div>
		<div class="gap-xs flex flex-col">
			<div class="gap-sm flex flex-wrap items-baseline">
				<span class="text-5xl font-bold tracking-tight tabular-nums">{offer.price}</span>
				<span class="text-neutral/70 text-sm">{offer.cadence}</span>
			</div>
			<span class="text-neutral/70 text-sm">or {offer.yearly} a month, billed yearly</span>
		</div>
		<div class="gap-sm flex {actionsInline ? 'flex-wrap' : 'flex-col'}">
			<Button
				href={resolve('/blocks/generative')}
				size={kit.step(1)}
				fullWidth={!actionsInline}
				{...kit.action()}
				suffix={arrowRightIcon}>{offer.cta}</Button
			>
			<Button
				href={resolve('/blocks/generative')}
				size={kit.step(1)}
				fullWidth={!actionsInline}
				{...quiet}>Talk to sales</Button
			>
		</div>
	</div>
{/snippet}

<SectionShell {tone} {density} label="Pricing">
	{#if banner}
		<!-- One wide band: the plan and its list share the card, on the same 12-column split. -->
		<div class="gen-flow">
			<div class="gen-grid">
				<div class="gen-col" style:--gen-span={8}>
					{@render header()}
				</div>
			</div>
			<Card
				variant={cards}
				elevation={2}
				{density}
				showBorders={Boolean(params.guarantee)}
				footer={params.guarantee ? guarantee : undefined}
			>
				<div class="gen-grid items-center">
					<div
						class="gen-col"
						style:--gen-span={cardCols}
						style:--gen-start={cardFirst ? 1 : textCols + 1}
						style:--gen-row={1}
					>
						{@render plan(true)}
					</div>
					<div
						class="gen-col"
						style:--gen-span={textCols}
						style:--gen-start={cardFirst ? cardCols + 1 : 1}
						style:--gen-row={1}
					>
						{@render list()}
					</div>
				</div>
			</Card>
		</div>
	{:else}
		<div class="gen-grid items-center">
			<div
				class="gen-col"
				style:--gen-span={textCols}
				style:--gen-start={cardFirst ? cardCols + 1 : 1}
				style:--gen-row={1}
			>
				<div class="gen-flow">
					{@render header()}
					{@render list()}
				</div>
			</div>
			<div
				class="gen-col"
				style:--gen-span={cardCols}
				style:--gen-start={cardFirst ? 1 : textCols + 1}
				style:--gen-row={1}
			>
				<Card
					variant={cards}
					elevation={2}
					{density}
					showBorders={Boolean(params.guarantee)}
					footer={params.guarantee ? guarantee : undefined}
				>
					{@render plan(false)}
				</Card>
			</div>
		</div>
	{/if}
</SectionShell>
