<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { listIcon } from 'entasis/icons/list';
	import { xIcon } from 'entasis/icons/x';
	import type { SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionShell from '../SectionShell.svelte';
	import Wordmark from '../Wordmark.svelte';
	import { navLinks } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const tone = $derived(params.tone as Tone);
	const layout = $derived(params.layout as 'spread' | 'centered' | 'split');
	const arrangement = $derived(params.arrangement as 'single' | 'utility' | 'stacked');
	// Links below the bar take a row of their own; otherwise they share the wordmark's row.
	const inlineLinks = $derived(arrangement !== 'stacked');
	const links = $derived(navLinks.slice(0, Number(params.links)));
	const onBrand = $derived(tone === 'brand');
	const ruleInk = $derived(onBrand ? 'border-primary-contrast/25' : 'border-neutral-muted');
	const softInk = $derived(
		onBrand
			? 'text-primary-contrast/85 hover:text-primary-contrast'
			: 'text-neutral/70 hover:text-neutral'
	);
	// The utility row holds what the bar would otherwise crowd: the release note and quiet links.
	const utilityLinks = ['Docs', 'Status', 'Sign in'];
	let open = $state(false);
</script>

{#snippet linkList(stacked: boolean)}
	<nav
		aria-label={stacked ? 'Mobile navigation' : 'Primary navigation'}
		class="gap-xl flex {stacked ? 'flex-col items-start' : 'items-center'}"
	>
		{#each links as link (link)}
			<a
				href={resolve('/blocks/generative')}
				class="text-sm font-medium underline-offset-4 hover:underline {onBrand
					? 'text-primary-contrast/85 hover:text-primary-contrast'
					: 'text-neutral/75 hover:text-neutral'}">{link}</a
			>
		{/each}
	</nav>
{/snippet}

{#snippet actions()}
	<div class="gap-sm flex items-center justify-end">
		{#if params.actions === 2}
			<Button
				href={resolve('/blocks/generative')}
				variant="ghost"
				color="neutral"
				size={kit.step(-1)}
				class="gen-mobile-hidden">Sign in</Button
			>
		{/if}
		<Button href={resolve('/blocks/generative')} size={kit.step(-1)} {...kit.action(onBrand)}
			>Start free</Button
		>
		<span class="gen-desktop-hidden">
			<Button
				prefix={open ? xIcon : listIcon}
				label="Toggle navigation"
				variant="ghost"
				color="neutral"
				size={kit.step(-1)}
				squared
				expanded={open}
				onclick={() => (open = !open)}
			/>
		</span>
	</div>
{/snippet}

<SectionShell
	{tone}
	density={params.density as SectionDensity}
	as="header"
	label="Site header"
	bar
	class={params.border ? 'border-neutral-muted border-b' : ''}
>
	{#if arrangement === 'utility'}
		<div
			class="gap-lg pb-sm mb-md flex items-center justify-between border-b text-xs {ruleInk} {softInk}"
		>
			<a
				href={resolve('/blocks/generative')}
				class="gap-xs inline-flex min-w-0 items-center font-medium underline-offset-4 hover:underline"
			>
				<span class="truncate">Meridian 3.0 is here: plans that span every team</span>
				<span aria-hidden="true">{@render arrowRightIcon()}</span>
			</a>
			<nav aria-label="Secondary navigation" class="gen-mobile-hidden gap-lg flex items-center">
				{#each utilityLinks as link (link)}
					<a href={resolve('/blocks/generative')} class="underline-offset-4 hover:underline"
						>{link}</a
					>
				{/each}
			</nav>
		</div>
	{/if}
	<div
		class="gap-xl flex items-center justify-between {layout === 'split' ||
		(layout === 'centered' && inlineLinks)
			? '@min-[48rem]/section:grid @min-[48rem]/section:grid-cols-[1fr_auto_1fr]'
			: ''}"
	>
		{#if layout === 'split'}
			{#if inlineLinks}
				<div class="gen-mobile-hidden">{@render linkList(false)}</div>
			{:else}
				<span class="gen-mobile-hidden"></span>
			{/if}
			<Wordmark {onBrand} class="justify-self-center" />
			{@render actions()}
		{:else if layout === 'centered'}
			<Wordmark {onBrand} />
			{#if inlineLinks}
				<div class="gen-mobile-hidden">{@render linkList(false)}</div>
			{/if}
			{@render actions()}
		{:else}
			<div class="gap-layout-md flex items-center">
				<div class="gap-md flex items-center">
					<Wordmark {onBrand} />
					{#if params.badge}<span class="gen-mobile-hidden"
							><Chip size={kit.step(-1)} variant={kit.chip} color={kit.accent}>New · 3.0</Chip
							></span
						>{/if}
				</div>
				{#if inlineLinks}
					<div class="gen-mobile-hidden">{@render linkList(false)}</div>
				{/if}
			</div>
			{@render actions()}
		{/if}
	</div>
	{#if !inlineLinks}
		<!-- Links below: a second row under a hairline, flush with the wordmark or centred under it. -->
		<div
			class="gen-mobile-hidden mt-md pt-md flex border-t {ruleInk} {layout === 'spread'
				? 'justify-start'
				: 'justify-center'}"
		>
			{@render linkList(false)}
		</div>
	{/if}
	{#if open}
		<div class="gen-desktop-hidden mt-lg pt-lg border-t {ruleInk}">
			{@render linkList(true)}
		</div>
	{/if}
</SectionShell>
