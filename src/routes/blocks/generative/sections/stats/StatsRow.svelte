<script lang="ts">
	import type { Sizes } from 'entasis/types';
	import { Stat, type StatPart, type StatThemeProps } from 'entasis/stat';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { stats } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const bento = $derived(params.layout === 'bento');
	const side = $derived(params.intro === 'side');
	const center = $derived(!side && params.align === 'center');
	const count = $derived(Number(params.count));
	const items = $derived(stats.slice(0, count));
	const cards = $derived(params.cards as 'ghost' | 'outline' | 'soft' | 'solid');
	const bare = $derived(cards === 'ghost');
	const onBrand = $derived(tone === 'brand');
	// Bare metrics on brand colour take the contrast ink; a solid card brings its own surface.
	const brandInk = $derived(onBrand && bare);
	const order = $derived<StatPart[]>(
		params.detail ? ['value', 'label', 'trend'] : ['value', 'label']
	);
	// Numbers that carry the section on their own — bare row metrics and the bento's hero tile —
	// step past Stat's own scale, one type step per kit size so the kit still moves them.
	const display: Record<Sizes, string> = {
		small: 'text-3xl',
		normal: 'text-4xl',
		large: 'text-5xl'
	};
	const hero: Record<Sizes, string> = {
		small: 'text-5xl',
		normal: 'text-6xl',
		large: 'text-7xl'
	};
	// Centring moves the flex rows too, not just the text.
	const statTheme = (valueSize: string): StatThemeProps => ({
		value: { base: `${valueSize} ${center ? 'justify-center' : ''}` },
		trend: { base: center ? 'justify-center' : '' },
		...(brandInk
			? {
					label: { base: 'text-primary-contrast/85' },
					trendText: { base: 'text-primary-contrast/85' }
				}
			: {})
	});
	const rowTheme = $derived(statTheme(bare ? display[kit.size] : ''));
	// The hero tile sits its number at the foot of the tall tile, level with the stack's last row.
	const heroTheme = $derived<StatThemeProps>({
		...statTheme(hero[kit.size]),
		root: { base: 'content-end' }
	});
	// The metrics measure their own column: beside an intro they get 8 of 12, above it all 12.
	const gridClasses: Record<number, string> = {
		2: '@min-[24rem]/metrics:grid-cols-2',
		3: '@min-[36rem]/metrics:grid-cols-3',
		4: '@min-[24rem]/metrics:grid-cols-2 @min-[52rem]/metrics:grid-cols-4'
	};
	// The hero spans as many rows as the stack beside it holds.
	const heroRows: Record<number, string> = {
		3: '@min-[30rem]/metrics:row-span-2',
		4: '@min-[30rem]/metrics:row-span-3'
	};
	const ruleInk = $derived(onBrand ? 'border-primary-contrast/25' : 'border-neutral-muted');
</script>

{#snippet header()}
	<SectionHeader
		align={center ? 'center' : 'start'}
		{onBrand}
		headline={params.headline as Headline}
		title="Less syncing. More shipping."
		body="What changes when a team plans, decides, and delivers in one place — measured across every Meridian workspace."
	/>
{/snippet}

{#snippet metric(stat: (typeof stats)[number], size: Sizes, theme: StatThemeProps)}
	<Stat
		variant={cards}
		{size}
		{density}
		{order}
		value={stat.value}
		label={stat.label}
		trend={stat.trend}
		trendDirection={!brandInk && stat.trend.startsWith('+') ? 'up' : 'neutral'}
		{theme}
		class="h-full {bare ? 'p-0' : ''} {brandInk ? 'text-primary-contrast' : ''} {center
			? 'text-center'
			: ''}"
	/>
{/snippet}

{#snippet metrics()}
	<div class="@container/metrics">
		{#if bento}
			<!-- One hero tile beside a stack of the rest; below 30rem they all stack. -->
			<div class="grid grid-cols-1 gap-(--gen-gutter) @min-[30rem]/metrics:grid-cols-2">
				<div class={heroRows[count]}>{@render metric(items[0], kit.step(1), heroTheme)}</div>
				{#each items.slice(1) as stat (stat.label)}
					<div>{@render metric(stat, kit.size, rowTheme)}</div>
				{/each}
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-(--gen-gutter) {gridClasses[count]}">
				{#each items as stat (stat.label)}
					<div class={params.divider ? `pt-lg border-t ${ruleInk}` : ''}>
						{@render metric(stat, kit.step(1), rowTheme)}
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<SectionShell {tone} {density} label="Results">
	{#if side}
		<div class="gen-grid items-center">
			<div class="gen-col" style:--gen-span={4}>{@render header()}</div>
			<div class="gen-col" style:--gen-span={8} style:--gen-start={5}>{@render metrics()}</div>
		</div>
	{:else}
		<div class="gen-flow">
			{@render header()}
			{@render metrics()}
		</div>
	{/if}
</SectionShell>
