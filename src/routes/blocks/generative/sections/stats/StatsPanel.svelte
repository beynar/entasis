<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import type { Sizes } from 'entasis/types';
	import { Card } from 'entasis/card';
	import { Meter, type MeterThemeProps } from 'entasis/meter';
	import { Stat, type StatPart } from 'entasis/stat';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { arrowUpRightIcon } from 'entasis/icons/arrowUpRight';
	import { clockIcon } from 'entasis/icons/clock';
	import { lightningIcon } from 'entasis/icons/lightning';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
	import { usersThreeIcon } from 'entasis/icons/usersThree';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { stats } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const icons: Snippet[] = [clockIcon, lightningIcon, usersThreeIcon, shieldCheckIcon];
	// Each metric read as progress toward the scale it is quoted on.
	const meters = [
		{ value: 38, max: 100 },
		{ value: 2.4, max: 3 },
		{ value: 9800, max: 10000 },
		{ value: 99.98, max: 100 }
	];
	// The bar restates the number above it, so the Meter's own percentage tag (and the room it
	// reserves above the track) would only repeat it — `80%` beside `2.4×` reads as a new claim.
	const meterTheme: MeterThemeProps = { indicator: { base: 'hidden' }, track: { base: 'mt-0' } };
	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const list = $derived(params.layout === 'list');
	const textCols = $derived(Number(params.textCols));
	const panelCols = $derived(12 - textCols);
	const panelFirst = $derived(params.mediaSide === 'start');
	const items = $derived(stats.slice(0, Number(params.count)));
	const cards = $derived(params.cards as 'outline' | 'soft' | 'solid');
	const indicator = $derived(params.indicator as 'trend' | 'meter' | 'none');
	// Emphasis follows the kit's accent; the pale secondary role reads as primary on a bar or icon.
	const accent = $derived(kit.accent === 'neutral' ? 'neutral' : 'primary');
	const order = $derived<StatPart[]>(
		indicator === 'trend'
			? ['value', 'indicator', 'label', 'trend']
			: indicator === 'meter'
				? ['value', 'indicator', 'label', 'description']
				: ['value', 'indicator', 'label']
	);
	// A list row draws its number on the same scale a card's Stat would at the kit's size.
	const rowSize = $derived<Sizes>(kit.step(1));
	const rowValue: Record<Sizes, string> = {
		small: 'text-xl',
		normal: 'text-2xl',
		large: 'text-3xl'
	};
	const rowLabel: Record<Sizes, string> = {
		small: 'text-xs',
		normal: 'text-sm',
		large: 'text-base'
	};
	const rowIcon: Record<Sizes, string> = {
		small: 'size-7 [&_svg]:size-icon-sm',
		normal: 'size-8 [&_svg]:size-icon-md',
		large: 'size-10 [&_svg]:size-icon-lg'
	};
	// Past 26rem the indicator takes a third column: a trend at its own width, a meter a fixed bar.
	const rowColumns = {
		trend: '@min-[26rem]/panel:grid-cols-[auto_minmax(0,1fr)_auto]',
		meter: '@min-[26rem]/panel:grid-cols-[auto_minmax(0,1fr)_minmax(6rem,9rem)]',
		none: ''
	};
	const iconInk = $derived(accent === 'neutral' ? 'text-neutral/70' : 'text-primary-readable');
</script>

{#snippet meter(index: number)}
	<div class="pt-sm" aria-hidden="true">
		<Meter {...meters[index]} size={kit.step(-1)} color={accent} theme={meterTheme} />
	</div>
{/snippet}

{#snippet cardGrid()}
	<div
		class="grid grid-cols-1 gap-(--gen-gutter) {items.length === 4
			? '@min-[30rem]/panel:grid-cols-2'
			: ''}"
	>
		{#each items as stat, index (stat.label)}
			{#snippet description()}{@render meter(index)}{/snippet}
			<Stat
				variant={cards}
				size={kit.step(1)}
				{density}
				{order}
				value={stat.value}
				label={stat.label}
				trend={stat.trend}
				trendDirection={stat.trend.startsWith('+') ? 'up' : 'neutral'}
				{description}
				indicator={icons[index]}
				indicatorVariant="icon"
				indicatorColor={accent}
				class="h-full"
			/>
		{/each}
	</div>
{/snippet}

{#snippet ruledList()}
	<!-- One surface, one metric per ruled row: icon, number over label, then the indicator. -->
	<Card variant={cards} {density}>
		<ul class="divide-y divide-current/10">
			{#each items as stat, index (stat.label)}
				<li
					class="gap-x-lg gap-y-sm py-lg grid grid-cols-[auto_minmax(0,1fr)] items-center first:pt-0 last:pb-0 {rowColumns[
						indicator
					]}"
				>
					<span
						class="inline-flex shrink-0 items-center justify-center rounded-md border border-current/15 bg-current/5 {rowIcon[
							rowSize
						]} {iconInk}"
						aria-hidden="true">{@render icons[index]()}</span
					>
					<div class="gap-xs flex min-w-0 flex-col">
						<span class="leading-none font-semibold tracking-tight tabular-nums {rowValue[rowSize]}"
							>{stat.value}</span
						>
						<span class="text-current/70 {rowLabel[rowSize]}">{stat.label}</span>
					</div>
					{#if indicator === 'trend'}
						<span
							class="gap-xs col-start-2 inline-flex items-center text-sm font-medium whitespace-nowrap @min-[26rem]/panel:col-start-3 @min-[26rem]/panel:justify-self-end @min-[26rem]/panel:text-end {stat.trend.startsWith(
								'+'
							)
								? 'text-success-readable'
								: 'text-current/70'}"
						>
							{#if stat.trend.startsWith('+')}{@render arrowUpRightIcon()}{/if}
							{stat.trend}
						</span>
					{:else if indicator === 'meter'}
						<div class="col-start-2 w-full @min-[26rem]/panel:col-start-3">
							{@render meter(index)}
						</div>
					{/if}
				</li>
			{/each}
		</ul>
	</Card>
{/snippet}

<SectionShell {tone} {density} label="Results">
	<div class="gen-grid items-center">
		<div
			class="gen-col"
			style:--gen-span={textCols}
			style:--gen-start={panelFirst ? panelCols + 1 : 1}
			style:--gen-row={1}
		>
			<SectionHeader
				headline={params.headline as Headline}
				eyebrow={params.eyebrow ? 'By the numbers' : undefined}
				title="Calmer planning shows up in the numbers."
				body="Teams that move their roadmap into Meridian spend less time reporting on the work and more time doing it."
			>
				<a
					href={resolve('/blocks/generative')}
					class="text-primary-readable gap-xs inline-flex items-center text-sm font-medium hover:underline"
					>Read the 2026 planning report {@render arrowRightIcon()}</a
				>
			</SectionHeader>
		</div>
		<div
			class="gen-col @container/panel"
			style:--gen-span={panelCols}
			style:--gen-start={panelFirst ? 1 : textCols + 1}
			style:--gen-row={1}
		>
			{#if list}
				{@render ruledList()}
			{:else}
				{@render cardGrid()}
			{/if}
		</div>
	</div>
</SectionShell>
