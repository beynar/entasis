<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import type { Headline } from '../engine/levers.js';
	import { useSectionKit, useSectionTone } from './sectionKit.js';

	/**
	 * The heading group every section shares: an optional eyebrow, a heading on the theme's type
	 * scale, and supporting copy at a readable measure. The `headline` lever only picks the step.
	 */
	interface Props {
		title: string;
		body?: string;
		eyebrow?: string;
		headline: Headline;
		/** Semantic level; the hero alone renders the page's `h1`. */
		as?: 'h1' | 'h2' | 'h3';
		align?: 'start' | 'center';
		onBrand?: boolean;
		/** Larger supporting copy for heroes. */
		lead?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		title,
		body,
		eyebrow,
		headline,
		as = 'h2',
		align = 'start',
		onBrand = false,
		lead = false,
		class: className = '',
		children
	}: Props = $props();
	const kit = useSectionKit();
	const tone = useSectionTone();
	// A soft chip is the same lightness as a tint surface; there it takes an outline instead.
	const chipVariant = $derived(tone() === 'tint' && kit.chip === 'soft' ? 'outline' : kit.chip);
</script>

<div
	class="gap-lg flex flex-col {align === 'center'
		? 'items-center text-center'
		: 'items-start text-start'} {className}"
>
	{#if eyebrow}
		{#if onBrand}
			<span class="text-primary-contrast/85 text-sm font-medium">{eyebrow}</span>
		{:else}
			<Chip variant={chipVariant} color={kit.accent} size={kit.step(-1)}>{eyebrow}</Chip>
		{/if}
	{/if}
	<Heading
		{as}
		size={headline}
		weight="bold"
		balanced
		align={align === 'center' ? 'center' : 'left'}>{title}</Heading
	>
	{#if body}
		<p
			class="max-w-2xl text-pretty {lead ? 'text-lg' : 'text-base'} {onBrand
				? 'text-primary-contrast/85'
				: 'text-neutral/70'}"
		>
			{body}
		</p>
	{/if}
	{@render children?.()}
</div>
