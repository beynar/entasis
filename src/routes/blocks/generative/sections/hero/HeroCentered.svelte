<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { TextInput } from 'entasis/text-input';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { envelopeSimpleIcon } from 'entasis/icons/envelopeSimple';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import Media from '../Media.svelte';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { heroCopy, photos } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const center = $derived(params.align === 'center');
	const width = $derived(Number(params.width));
	const offset = $derived(center ? (12 - width) / 2 : 0);
	const full = $derived(Boolean(params.bleed));
	const behind = $derived(params.layout === 'background');
	const mediaKind = $derived(params.media as 'product' | 'photo' | 'pattern');
	const photo = $derived(photos[width % photos.length]);
	// Text over a photo reads through a veil of the section's own surface, so every tone keeps its
	// colour and its contrast (the inverse veil is dark, the tint veil tinted). The veil is densest
	// behind the text: around a centred column, or from the start edge.
	const veils: Record<'center' | 'start', Record<Tone, string>> = {
		center: {
			plain: 'bg-radial from-surface/90 to-surface/55',
			muted: 'bg-radial from-surface-recessed/90 to-surface-recessed/55',
			tint: 'bg-radial from-primary-muted/90 to-primary-muted/60',
			inverse: 'bg-radial from-surface/85 to-surface/50',
			brand: 'bg-radial from-primary/90 to-primary/60'
		},
		start: {
			plain: 'bg-linear-to-r from-surface/95 via-surface/75 to-surface/25',
			muted:
				'bg-linear-to-r from-surface-recessed/95 via-surface-recessed/75 to-surface-recessed/25',
			tint: 'bg-linear-to-r from-primary-muted/95 via-primary-muted/80 to-primary-muted/30',
			inverse: 'bg-linear-to-r from-surface/90 via-surface/70 to-surface/20',
			brand: 'bg-linear-to-r from-primary/95 via-primary/80 to-primary/30'
		}
	};
	const veil = $derived(veils[center ? 'center' : 'start'][tone]);
</script>

{#snippet header()}
	<SectionHeader
		as="h1"
		lead
		align={center ? 'center' : 'start'}
		headline={params.headline as Headline}
		eyebrow={params.eyebrow === 'chip' ? heroCopy.eyebrow : undefined}
		title={heroCopy.title}
		body={heroCopy.body}
	>
		{#if params.eyebrow === 'link'}
			<a
				href={resolve('/blocks/generative')}
				class="text-primary-readable gap-xs order-first inline-flex items-center text-sm font-medium hover:underline"
				>Read the 3.0 release notes {@render arrowRightIcon()}</a
			>
		{/if}
		{#if params.action === 'email'}
			<form
				class="gap-sm pt-sm flex w-full max-w-md flex-wrap {center ? 'justify-center' : ''}"
				onsubmit={(event) => event.preventDefault()}
			>
				<TextInput
					type="email"
					placeholder="you@company.com"
					prefix={envelopeSimpleIcon}
					size={kit.step(1)}
					class="min-w-0 flex-1"
					inputAttrs={{ 'aria-label': 'Work email' }}
				/>
				<Button type="submit" size={kit.step(1)} {...kit.action()}>{heroCopy.primary}</Button>
			</form>
		{:else}
			<div class="gap-md pt-sm flex flex-wrap {center ? 'justify-center' : ''}">
				<Button
					href={resolve('/blocks/generative')}
					size={kit.step(1)}
					{...kit.action()}
					suffix={arrowRightIcon}>{heroCopy.primary}</Button
				>
				<Button href={resolve('/blocks/generative')} size={kit.step(1)} {...kit.quiet()}
					>{heroCopy.secondary}</Button
				>
			</div>
		{/if}
	</SectionHeader>
{/snippet}

{#snippet column()}
	<div class="gen-col" style:--gen-span={width} style:--gen-start={offset + 1}>
		{@render header()}
	</div>
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} label="Introduction">
	{#if behind && full}
		<!-- The shell is the positioned ancestor: the photo and its veil cover the whole section. -->
		<img src={photo} alt="" loading="lazy" class="absolute inset-0 size-full object-cover" />
		<div class="absolute inset-0 {veil}" aria-hidden="true"></div>
		<div class="gen-grid py-layout-xl relative">
			{@render column()}
		</div>
	{:else if behind}
		<!-- A framed panel on the grid: the photo fills it, the veil covers it, the text sits on top. -->
		<div class="relative isolate grid overflow-hidden rounded-lg @min-[48rem]/section:aspect-video">
			<img src={photo} alt="" loading="lazy" class="absolute inset-0 size-full object-cover" />
			<div class="absolute inset-0 {veil}" aria-hidden="true"></div>
			<div class="gen-grid py-layout-xl px-layout-md relative self-center">
				{@render column()}
			</div>
		</div>
	{:else}
		<div class="gen-grid">
			{@render column()}
			{#if params.media !== 'none'}
				<div class="gen-col" style:--gen-span={full ? 12 : 10} style:--gen-start={full ? 1 : 2}>
					<Media kind={mediaKind} ratio="wide" {tone} variant={width} />
				</div>
			{/if}
		</div>
	{/if}
</SectionShell>
