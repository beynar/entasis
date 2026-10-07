<script lang="ts">
	import { resolve } from '$app/paths';
	import { Accordion } from 'entasis/accordion';
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { chatCircleTextIcon } from 'entasis/icons/chatCircleText';
	import type { Headline, SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionHeader from '../SectionHeader.svelte';
	import SectionShell from '../SectionShell.svelte';
	import { faqs, team } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const density = $derived(params.density as SectionDensity);
	const stacked = $derived(params.layout === 'stacked');
	const headerCols = $derived(Number(params.headerCols));
	const listCols = $derived(12 - headerCols);
	const questions = $derived(faqs.slice(0, Number(params.count)));
	// Stacked, the questions split into two columns of equal length.
	const halves = $derived([
		questions.slice(0, questions.length / 2),
		questions.slice(questions.length / 2)
	]);
	const support = team.slice(0, 3).map((person) => ({ name: person.name }));
</script>

{#snippet header()}
	<SectionHeader
		headline={params.headline as Headline}
		title="Questions, answered."
		body="What teams ask before they move their planning to Meridian."
	>
		{#if params.contact === 'link'}
			<a
				href={resolve('/blocks/generative')}
				class="text-primary-readable gap-xs inline-flex items-center text-sm font-medium hover:underline"
				>Ask us anything else {@render arrowRightIcon()}</a
			>
		{/if}
	</SectionHeader>
{/snippet}

{#snippet contactCard()}
	<!-- A raised card steps off every tone, and its surface keeps the avatar rings apart. -->
	<Card {density}>
		<div class="gap-lg flex flex-col items-start">
			<AvatarGroup size={kit.stack(0)} items={support} />
			<div class="gap-xs flex flex-col">
				<h3 class="text-base font-semibold">Still have a question?</h3>
				<p class="text-neutral/70 text-sm text-pretty">
					Real people reply every weekday, usually within two hours.
				</p>
			</div>
			<Button
				href={resolve('/blocks/generative')}
				size={kit.step(-1)}
				{...kit.quiet()}
				prefix={chatCircleTextIcon}>Talk to support</Button
			>
		</div>
	</Card>
{/snippet}

{#snippet accordion(items: typeof questions, first: boolean)}
	<Accordion
		{items}
		variant={params.style as 'classic' | 'outline' | 'card'}
		splitted={Boolean(params.splitted)}
		{density}
		size={kit.step(1)}
		icon="plus-minus"
		headingLevel={3}
		defaultValue={first ? [items[0].id] : []}
	/>
{/snippet}

<SectionShell {tone} {density} label="Frequently asked questions">
	{#if stacked}
		<!-- The header leads; the contact card sits beside it, the questions run in two columns below. -->
		<div class="gen-grid items-end">
			<div class="gen-col" style:--gen-span={params.contact === 'card' ? 7 : 8} style:--gen-row={1}>
				{@render header()}
			</div>
			{#if params.contact === 'card'}
				<div class="gen-col" style:--gen-span={4} style:--gen-start={9} style:--gen-row={1}>
					{@render contactCard()}
				</div>
			{/if}
			<div class="gen-col gen-items items-start" data-cols="2" style:--gen-row={2}>
				{#each halves as half, index (index)}
					{@render accordion(half, index === 0)}
				{/each}
			</div>
		</div>
	{:else}
		<div class="gen-grid">
			<div class="gen-col" style:--gen-span={headerCols} style:--gen-row={1}>
				<div class="gen-flow">
					{@render header()}
					{#if params.contact === 'card'}
						{@render contactCard()}
					{/if}
				</div>
			</div>
			<div
				class="gen-col"
				style:--gen-span={listCols}
				style:--gen-start={headerCols + 1}
				style:--gen-row={1}
			>
				{@render accordion(questions, true)}
			</div>
		</div>
	{/if}
</SectionShell>
