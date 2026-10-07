<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Table } from 'entasis/table';
	import { checkIcon } from 'entasis/icons/check';
	import { minusIcon } from 'entasis/icons/minus';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { plans } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	type Plan = (typeof plans)[number];
	/**
	 * The plans' lists line by line, most telling first. Built from the copy deck's own features; a
	 * line every shown plan answers the same way is dropped, since it compares nothing.
	 */
	const comparison: { feature: string; values: (string | boolean)[] }[] = [
		{ feature: 'Members', values: ['Up to 5', 'Unlimited', 'Unlimited'] },
		{ feature: 'Decision log', values: [false, true, true] },
		{ feature: 'SSO and SCIM', values: [false, false, true] },
		{ feature: 'Support', values: ['Community', 'Priority', 'Dedicated'] },
		{ feature: 'History', values: ['7 days', 'Unlimited', 'Unlimited'] },
		{ feature: 'Guest access', values: [false, true, true] },
		{ feature: 'Audit trail', values: [false, false, true] }
	];

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const layout = $derived(params.layout as 'columns' | 'rows' | 'table');
	const tiers = $derived(Number(params.tiers));
	const center = $derived(params.align === 'center');
	// Two start-aligned plan columns move the header into the 4 columns beside them.
	const beside = $derived(layout === 'columns' && tiers === 2 && !center);
	// The recommended plan: the middle of three, the last of two.
	const featuredIndex = $derived(params.featured ? (tiers === 3 ? 1 : tiers - 1) : -1);
	const cards = $derived(params.cards as 'outline' | 'soft' | 'solid');
	const count = $derived(Number(params.features));
	const items = $derived(plans.slice(0, tiers));
	// Two plan columns sit on 8 columns, centred under the header or beside it; three fill all 12.
	const firstStart = $derived(tiers === 3 ? 1 : beside ? 5 : 3);
	const innerGap = $derived(
		density === 'compact' ? 'gap-lg' : density === 'comfortable' ? 'gap-layout-sm' : 'gap-xl'
	);
	const lines = $derived(
		comparison
			.map((line) => ({ ...line, values: line.values.slice(0, tiers) }))
			.filter((line) => new Set(line.values).size > 1)
			.slice(0, count)
	);

	let billing = $state<'monthly' | 'yearly'>('monthly');
	const yearly = $derived(Boolean(params.toggle) && billing === 'yearly');

	/**
	 * The featured plan's action. On a primary fill it takes the neutral role; on a primary-muted
	 * surface (a soft featured card, the table's featured column) a soft action would vanish, so it
	 * turns solid.
	 */
	function featuredAction(onPrimary: boolean) {
		const action = kit.action(onPrimary);
		const muted = cards === 'soft' || layout === 'table';
		return muted && action.variant === 'soft' ? { ...action, variant: 'solid' as const } : action;
	}

	/** Other plans' actions. A neutral hairline or fill vanishes on a soft card: it turns primary. */
	function quietAction() {
		const action = kit.quiet();
		const drawsMuted = action.variant === 'outline' || action.variant === 'soft';
		return cards === 'soft' && drawsMuted ? { ...action, color: 'primary' as const } : action;
	}

	/** The badge never matches its surface: neutral on a primary fill, solid on a primary-muted one. */
	function badge(onPrimary: boolean) {
		if (onPrimary) return { variant: 'solid' as const, color: 'neutral' as const };
		const muted = cards === 'soft' || layout === 'table';
		return {
			variant: muted && kit.chip === 'soft' ? ('solid' as const) : kit.chip,
			color: kit.accent
		};
	}
</script>

{#snippet price(item: Plan, quiet: string, large: boolean)}
	{@const discounted = yearly && item.price !== item.yearly}
	<div class="gap-xs flex flex-col">
		<div class="gap-sm flex flex-wrap items-baseline">
			<span class="{large ? 'text-4xl' : 'text-3xl'} font-bold tracking-tight tabular-nums"
				>{yearly ? item.yearly : item.price}</span
			>
			{#if discounted}
				<span class="text-lg tabular-nums line-through {quiet}">{item.price}</span>
			{/if}
		</div>
		<span class="text-sm {quiet}"
			>{discounted ? `${item.cadence}, billed yearly` : item.cadence}</span
		>
	</div>
{/snippet}

{#snippet featureList(item: Plan, featured: boolean, onPrimary: boolean, inline: boolean)}
	<!-- Inline, the list wraps along the row instead of making it taller. -->
	<ul class="gap-sm text-sm {inline ? 'gap-x-lg flex flex-wrap' : 'flex flex-col'}">
		{#each item.features.slice(0, count) as feature (feature)}
			<li class="gap-sm flex items-start">
				<span
					class="flex shrink-0 {onPrimary
						? 'text-primary-contrast'
						: featured && cards === 'soft'
							? 'text-primary-muted-readable'
							: 'text-primary-readable'}"
					aria-hidden="true">{@render checkIcon()}</span
				>
				<span>{feature}</span>
			</li>
		{/each}
	</ul>
{/snippet}

{#snippet planName(item: Plan, featured: boolean, onPrimary: boolean)}
	<div class="gap-md flex flex-wrap items-center justify-between">
		<h3 class="text-base font-semibold">{item.name}</h3>
		{#if featured}
			<Chip size={kit.step(-1)} {...badge(onPrimary)}>Most popular</Chip>
		{/if}
	</div>
{/snippet}

{#snippet action(item: Plan, featured: boolean, onPrimary: boolean, fullWidth: boolean)}
	<Button
		href={resolve('/blocks/generative')}
		size={kit.size}
		{fullWidth}
		{...featured ? featuredAction(onPrimary) : quietAction()}>{item.cta}</Button
	>
{/snippet}

{#snippet column(item: Plan, index: number)}
	{@const featured = index === featuredIndex}
	<!-- A featured solid plan fills with the primary colour, so its text switches to the contrast role. -->
	{@const onPrimary = featured && cards === 'solid'}
	{@const quiet = onPrimary ? 'text-primary-contrast/85' : 'text-neutral/70'}
	<Card
		variant={cards}
		color={featured ? 'primary' : 'neutral'}
		elevation={featured ? 3 : 1}
		{density}
		class="h-full"
	>
		<div class="flex flex-col {innerGap} {onPrimary ? 'text-primary-contrast' : 'text-neutral'}">
			<div class="gap-xs flex flex-col">
				{@render planName(item, featured, onPrimary)}
				<p class="text-sm text-pretty {quiet}">{item.description}</p>
			</div>
			{@render price(item, quiet, true)}
			{@render action(item, featured, onPrimary, true)}
			{@render featureList(item, featured, onPrimary, false)}
		</div>
	</Card>
{/snippet}

{#snippet row(item: Plan, index: number)}
	{@const featured = index === featuredIndex}
	{@const onPrimary = featured && cards === 'solid'}
	{@const quiet = onPrimary ? 'text-primary-contrast/85' : 'text-neutral/70'}
	<Card
		variant={cards}
		color={featured ? 'primary' : 'neutral'}
		elevation={featured ? 3 : 1}
		{density}
	>
		<!-- One plan per line: name, price, what it includes, and its action read left to right. -->
		<div
			class="grid {innerGap} @min-[48rem]/section:grid-cols-12 @min-[48rem]/section:items-center {onPrimary
				? 'text-primary-contrast'
				: 'text-neutral'}"
		>
			<div class="gap-xs flex flex-col @min-[48rem]/section:col-span-3">
				{@render planName(item, featured, onPrimary)}
				<p class="text-sm text-pretty {quiet}">{item.description}</p>
			</div>
			<div class="@min-[48rem]/section:col-span-3">
				{@render price(item, quiet, false)}
			</div>
			<div class="@min-[48rem]/section:col-span-4">
				{@render featureList(item, featured, onPrimary, true)}
			</div>
			<div class="flex @min-[48rem]/section:col-span-2 @min-[48rem]/section:justify-end">
				{@render action(item, featured, onPrimary, false)}
			</div>
		</div>
	</Card>
{/snippet}

{#snippet planHead(index: number)}
	{@const item = items[index]}
	{@const featured = index === featuredIndex}
	<div class="gap-md py-sm flex flex-col items-start">
		{@render planName(item, featured, false)}
		{@render price(item, 'text-neutral/70', false)}
		{@render action(item, featured, false, false)}
	</div>
{/snippet}
{#snippet head0()}{@render planHead(0)}{/snippet}
{#snippet head1()}{@render planHead(1)}{/snippet}
{#snippet head2()}{@render planHead(2)}{/snippet}
{#snippet included()}
	<span class="text-primary-readable inline-flex" role="img" aria-label="Included"
		>{@render checkIcon()}</span
	>
{/snippet}
{#snippet excluded()}
	<span class="text-neutral/40 inline-flex" role="img" aria-label="Not included"
		>{@render minusIcon()}</span
	>
{/snippet}

{#snippet table()}
	{@const heads = [head0, head1, head2]}
	<!-- The featured plan's column carries a primary wash from its head to its last line. -->
	{@const wash = (index: number) => (index === featuredIndex ? 'bg-primary-muted/50' : '')}
	<Card variant={cards} elevation={1} {density}>
		<Table
			{density}
			caption="Every plan includes unlimited projects, roadmaps and boards."
			header={{
				feature: { content: 'Compare plans', class: 'align-bottom text-neutral/70' },
				...Object.fromEntries(
					items.map((item, index) => [
						item.name,
						{
							content: heads[index],
							// Plan columns share the width evenly with the feature column.
							class: `align-top whitespace-normal ${tiers === 3 ? 'w-1/4' : 'w-1/3'} ${wash(index)}`
						}
					])
				)
			}}
			items={lines.map((line) => ({
				cells: {
					feature: { content: line.feature, class: 'font-medium' },
					...Object.fromEntries(
						items.map((item, index) => {
							const value = line.values[index];
							return [
								item.name,
								{
									content: typeof value === 'string' ? value : value ? included : excluded,
									class: wash(index)
								}
							];
						})
					)
				}
			}))}
		/>
	</Card>
{/snippet}

<SectionShell {tone} {density} label="Pricing">
	<div class="gen-grid">
		<div class="gen-col" style:--gen-span={beside ? 4 : 12} style:--gen-row={1}>
			<SectionHeader
				align={center ? 'center' : 'start'}
				headline={params.headline as Headline}
				title="Simple pricing that grows with your team."
				body="Start free and upgrade when the plan needs more people. Every paid plan begins with a 14-day trial."
			>
				{#if params.toggle}
					<div class="gap-md pt-sm flex flex-wrap items-center {center ? 'justify-center' : ''}">
						<SegmentedControl
							label="Billing period"
							size={kit.size}
							bind:value={billing}
							items={[
								{ value: 'monthly', label: 'Monthly' },
								{ value: 'yearly', label: 'Yearly' }
							]}
						/>
						<Chip size={kit.step(-1)} variant="soft" color="success">2 months free</Chip>
					</div>
				{/if}
			</SectionHeader>
		</div>
		{#if layout === 'columns'}
			{#each items as item, index (item.name)}
				<div
					class="gen-col"
					style:--gen-span={4}
					style:--gen-start={firstStart + index * 4}
					style:--gen-row={beside ? 1 : 2}
				>
					{@render column(item, index)}
				</div>
			{/each}
		{:else if layout === 'rows'}
			<div class="gen-col gen-items" data-cols="1" style:--gen-row={2}>
				{#each items as item, index (item.name)}
					{@render row(item, index)}
				{/each}
			</div>
		{:else}
			<div class="gen-col" style:--gen-row={2}>
				{@render table()}
			</div>
		{/if}
	</div>
</SectionShell>
