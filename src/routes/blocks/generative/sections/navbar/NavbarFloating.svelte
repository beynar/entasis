<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
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

	const links = $derived(navLinks.slice(0, Number(params.links)));
	const layout = $derived(params.layout as 'joined' | 'split' | 'islands');
	const pill = $derived(params.shape === 'pill');
	// Every floating piece shares one surface, shape and edge, whether it is the whole bar or a part.
	const edge = $derived(
		params.elevation === 'raised' ? 'raised-md' : 'border-neutral-muted border'
	);
	const surface = $derived(
		`bg-surface-raised py-sm ${pill ? 'px-lg rounded-full' : 'px-md rounded-lg'} ${edge}`
	);
	let open = $state(false);
</script>

{#snippet linkList()}
	<nav aria-label="Primary navigation" class="gap-xl flex items-center">
		{#each links as link (link)}
			<a
				href={resolve('/blocks/generative')}
				class="text-neutral/75 hover:text-neutral text-sm font-medium underline-offset-4 hover:underline"
				>{link}</a
			>
		{/each}
	</nav>
{/snippet}

{#snippet actions()}
	<div class="gap-sm flex items-center">
		{#if params.actions === 2}
			<Button
				href={resolve('/blocks/generative')}
				variant="ghost"
				color="neutral"
				size={kit.step(-1)}
				class="gen-mobile-hidden">Sign in</Button
			>
		{/if}
		<Button href={resolve('/blocks/generative')} size={kit.step(-1)} {...kit.action()}
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

{#snippet mobileLinks(ink: string)}
	<nav aria-label="Mobile navigation" class="gen-desktop-hidden gap-md flex flex-col {ink}">
		{#each links as link (link)}
			<a href={resolve('/blocks/generative')} class="text-neutral/80 text-sm font-medium">{link}</a>
		{/each}
	</nav>
{/snippet}

<SectionShell
	tone={params.tone as Tone}
	density={params.density as SectionDensity}
	as="header"
	label="Site header"
	width={params.width === 'narrow' ? 'narrow' : 'content'}
>
	{#if layout === 'joined'}
		<div class={surface}>
			<div class="gap-xl flex items-center justify-between">
				<Wordmark />
				<div class="gen-mobile-hidden">{@render linkList()}</div>
				{@render actions()}
			</div>
			{#if open}
				{@render mobileLinks('border-neutral-muted mt-md pt-md pb-sm border-t')}
			{/if}
		</div>
	{:else}
		<!-- Pieces float apart: the wordmark and links, then the actions (split), or the links alone
		     between a bare wordmark and bare actions (islands). -->
		<div
			class="gap-md flex justify-between {layout === 'islands'
				? 'items-center @min-[48rem]/section:grid @min-[48rem]/section:grid-cols-[1fr_auto_1fr]'
				: 'items-stretch'}"
		>
			{#if layout === 'split'}
				<div class="{surface} gap-xl flex items-center">
					<Wordmark />
					<div class="gen-mobile-hidden">{@render linkList()}</div>
				</div>
				<div class="{surface} flex items-center">{@render actions()}</div>
			{:else}
				<Wordmark />
				<div class="gen-mobile-hidden {surface}">{@render linkList()}</div>
				<div class="flex justify-end">{@render actions()}</div>
			{/if}
		</div>
		{#if open}
			<div class="gen-desktop-hidden mt-sm p-md bg-surface-raised rounded-lg {edge}">
				{@render mobileLinks('')}
			</div>
		{/if}
	{/if}
</SectionShell>
