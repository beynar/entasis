<script lang="ts">
	import { Marquee } from 'entasis/marquee';
	import type { SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionShell from '../SectionShell.svelte';
	import { logoMarks } from './marks.js';

	let { params }: { params: Params } = $props();

	const tone = $derived(params.tone as Tone);
	const onBrand = $derived(tone === 'brand');
	const inline = $derived(params.layout === 'inline');
	const marquee = $derived(params.arrangement === 'marquee');
	const center = $derived(!inline && params.align === 'center');
	const marks = $derived(logoMarks.slice(0, Number(params.count)));
	const accent = $derived(params.treatment === 'accent');
	const scale = $derived(params.scale === 'large' ? 'text-2xl' : 'text-lg');
	// Muted marks recede to a share of the ink; accent marks take full ink and a primary glyph.
	const markInk = $derived(
		onBrand ? 'text-primary-contrast/75' : accent ? 'text-neutral' : 'text-neutral/55'
	);
	const glyphInk = $derived(
		accent ? (tone === 'tint' ? 'text-primary-muted-readable' : 'text-primary-readable') : ''
	);
	const labelInk = $derived(onBrand ? 'text-primary-contrast/85' : 'text-neutral/70');
	const ruleInk = $derived(onBrand ? 'border-primary-contrast/25' : 'border-neutral-muted');
	const label = 'Trusted by 9,800 teams shipping every week';
</script>

{#snippet items()}
	{#each marks as mark (mark.name)}
		<li class="gap-sm inline-flex items-center whitespace-nowrap {mark.type} {markInk}">
			<span class="leading-none {glyphInk}" aria-hidden="true">{@render mark.icon()}</span>
			{mark.name}
		</li>
	{/each}
{/snippet}

{#snippet row(justify: string)}
	{#if marquee}
		<!-- Large marquees space everything with --layout-space-md; the marks use the same step, so
		     the gap between marks and the gap between loops read as one rhythm. -->
		<Marquee size="large" speed="normal" class="w-full">
			<ul aria-label="Customers" class="gap-x-layout-md flex items-center {scale}">
				{@render items()}
			</ul>
		</Marquee>
	{:else}
		<ul
			aria-label="Customers"
			class="gap-x-layout-md gap-y-lg flex flex-wrap items-center {justify} {scale}"
		>
			{@render items()}
		</ul>
	{/if}
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} label="Customers">
	{#if inline}
		<div class="gen-grid items-center">
			<p class="gen-col text-sm font-medium text-pretty {labelInk}" style:--gen-span={3}>
				{label}
			</p>
			<div
				class="gen-col min-w-0 {params.divider
					? `@min-[48rem]/section:ps-layout-lg @min-[48rem]/section:border-s ${ruleInk}`
					: ''}"
				style:--gen-span={9}
			>
				{@render row('@min-[48rem]/section:justify-between')}
			</div>
		</div>
	{:else}
		<div class="gap-xl flex flex-col {center ? 'items-center text-center' : ''}">
			{#if params.label}
				<p class="text-sm font-medium text-pretty {labelInk}">{label}</p>
			{/if}
			{@render row(center ? 'justify-center' : '@min-[48rem]/section:justify-between')}
		</div>
	{/if}
</SectionShell>
