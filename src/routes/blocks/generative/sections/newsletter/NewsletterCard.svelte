<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { TextInput } from 'entasis/text-input';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { envelopeSimpleIcon } from 'entasis/icons/envelopeSimple';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { photos } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const cards = $derived(params.cards as 'outline' | 'soft' | 'solid');
	const media = $derived(params.media as 'none' | 'pattern' | 'photo');
	const narrow = $derived(params.width === 'narrow');
	const split = $derived(params.layout === 'split');
	const mediaFirst = $derived(params.mediaSide === 'start');
	// The card pads one step above the section, so the form never sits tight against its edge.
	const cardDensity = $derived(density === 'compact' ? 'normal' : 'comfortable');
	const innerPad = {
		compact: '',
		normal: '@min-[48rem]/section:p-md',
		comfortable: '@min-[48rem]/section:p-lg'
	};
	// An outline card is see-through, so its media frames against the section; the others paint
	// their own surface.
	const mediaTone = $derived<Tone>(cards === 'outline' ? tone : 'plain');
	// A split card cuts flush panes: the form pane pads itself by the section density.
	const panePad: Record<SectionDensity, string> = {
		compact: 'p-xl @min-[48rem]/section:p-layout-lg',
		normal: 'p-layout-md @min-[48rem]/section:p-layout-xl',
		comfortable: 'p-layout-md @min-[48rem]/section:p-layout-xl'
	};
	// Without a photo the second pane is a colour field, one step off the card on any tone.
	const fieldSurface = $derived(
		tone === 'tint' || tone === 'brand'
			? 'bg-surface-recessed text-neutral'
			: 'bg-primary-muted text-primary-muted-readable'
	);
	let submitted = $state(false);

	const copy = {
		title: 'Get the Monday brief.',
		body: 'Planning patterns, product news, and field notes from teams that ship. One email a week.'
	};
	const perkList = [
		'One email every Monday',
		'Field notes from 9,800 teams',
		'Unsubscribe in one click'
	];
</script>

{#snippet header(centered: boolean)}
	<SectionHeader
		align={centered ? 'center' : 'start'}
		headline={params.headline as Headline}
		title={copy.title}
		body={copy.body}
	/>
{/snippet}

{#snippet form(centered: boolean)}
	<form
		class="gap-md flex w-full max-w-md flex-col {centered ? 'items-center' : 'items-start'}"
		onsubmit={(event) => {
			event.preventDefault();
			submitted = true;
		}}
	>
		<div class="gap-sm flex w-full">
			<TextInput
				type="email"
				placeholder="you@company.com"
				prefix={envelopeSimpleIcon}
				size={kit.step(1)}
				class="min-w-0 flex-1"
				inputAttrs={{ 'aria-label': 'Email address', autocomplete: 'email' }}
			/>
			<Button type="submit" size={kit.step(1)} {...kit.action()}>Subscribe</Button>
		</div>
		{#if submitted}
			<p role="status" class="text-sm font-medium">
				You’re on the list. Check your inbox to confirm.
			</p>
		{:else}
			<p class="text-neutral/70 text-xs">No spam. Your address never leaves Meridian.</p>
		{/if}
	</form>
{/snippet}

{#snippet perks(row: boolean)}
	<ul
		class="text-sm {row
			? 'gap-x-lg gap-y-sm flex flex-wrap justify-center'
			: 'gap-sm flex flex-col'}"
	>
		{#each perkList as perk (perk)}
			<li class="gap-sm flex items-center">
				<span class="text-primary-readable" aria-hidden="true">{@render checkCircleIcon()}</span>
				{perk}
			</li>
		{/each}
	</ul>
{/snippet}

<SectionShell {tone} {density} label="Newsletter" width={narrow ? 'narrow' : 'content'}>
	{#if split}
		<!-- Two flush panes: the form on the card's own surface, and a photo or colour field. -->
		<Card
			variant={cards}
			elevation={2}
			class="overflow-hidden py-0"
			theme={{ content: { base: 'px-0' } }}
		>
			<div class="grid @min-[48rem]/section:grid-cols-12">
				<div
					class="gap-layout-sm flex flex-col justify-center @min-[48rem]/section:col-span-7 @min-[48rem]/section:row-start-1 {mediaFirst
						? '@min-[48rem]/section:col-start-6'
						: '@min-[48rem]/section:col-start-1'} {panePad[density]}"
				>
					{@render header(false)}
					{@render form(false)}
					{#if params.perks && media === 'photo'}{@render perks(false)}{/if}
				</div>
				<div
					class="relative @min-[48rem]/section:col-span-5 @min-[48rem]/section:row-start-1 {mediaFirst
						? '@min-[48rem]/section:col-start-1'
						: '@min-[48rem]/section:col-start-8'}"
				>
					{#if media === 'photo'}
						<img
							src={photos[mediaFirst ? 1 : 2]}
							alt="Landscape photograph"
							loading="lazy"
							class="aspect-4/3 w-full object-cover @min-[48rem]/section:absolute @min-[48rem]/section:inset-0 @min-[48rem]/section:aspect-auto @min-[48rem]/section:h-full"
						/>
					{:else}
						<div
							class="gap-lg flex h-full flex-col justify-center {fieldSurface} {panePad[density]}"
						>
							<span
								class="bg-surface text-primary-readable grid size-12 place-items-center rounded-full text-xl"
								aria-hidden="true">{@render envelopeSimpleIcon()}</span
							>
							{@render perks(false)}
						</div>
					{/if}
				</div>
			</div>
		</Card>
	{:else}
		<Card variant={cards} density={cardDensity} elevation={2}>
			<div class={innerPad[density]}>
				{#if media !== 'none'}
					<div class="gen-grid items-center">
						<div
							class="gen-col"
							style:--gen-span={7}
							style:--gen-start={mediaFirst ? 6 : 1}
							style:--gen-row={1}
						>
							<div class="gap-layout-sm flex flex-col">
								{@render header(false)}
								{@render form(false)}
								{#if params.perks}{@render perks(false)}{/if}
							</div>
						</div>
						<div
							class="gen-col"
							style:--gen-span={5}
							style:--gen-start={mediaFirst ? 1 : 8}
							style:--gen-row={1}
						>
							<Media kind={media} ratio="landscape" tone={mediaTone} variant={mediaFirst ? 1 : 2} />
						</div>
					</div>
				{:else if narrow}
					<div class="gap-layout-sm flex flex-col items-center text-center">
						<span
							class="bg-primary-muted text-primary-muted-readable grid size-12 place-items-center rounded-full text-xl"
							aria-hidden="true">{@render envelopeSimpleIcon()}</span
						>
						{@render header(true)}
						{@render form(true)}
						{#if params.perks}{@render perks(true)}{/if}
					</div>
				{:else}
					<div class="gen-grid items-center">
						<div class="gen-col" style:--gen-span={6} style:--gen-row={1}>
							<div class="gap-layout-sm flex flex-col">
								{@render header(false)}
								{#if params.perks}{@render perks(false)}{/if}
							</div>
						</div>
						<div class="gen-col" style:--gen-span={5} style:--gen-start={8} style:--gen-row={1}>
							{@render form(false)}
						</div>
					</div>
				{/if}
			</div>
		</Card>
	{/if}
</SectionShell>
