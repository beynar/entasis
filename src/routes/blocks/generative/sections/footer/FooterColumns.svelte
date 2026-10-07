<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from 'entasis/button';
	import { TextInput } from 'entasis/text-input';
	import { githubLogoIcon } from 'entasis/icons/githubLogo';
	import { linkedinLogoIcon } from 'entasis/icons/linkedinLogo';
	import { xLogoIcon } from 'entasis/icons/xLogo';
	import type { SectionDensity, Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionShell from '../SectionShell.svelte';
	import Wordmark from '../Wordmark.svelte';
	import { brand, footerColumns, navLinks } from '../content.js';
	import { useSectionKit } from '../sectionKit.js';

	let { params }: { params: Params } = $props();
	const kit = useSectionKit();

	const layout = $derived(params.layout as 'split' | 'stacked' | 'centered');
	const columns = $derived(Number(params.columns));
	const brandCols = $derived(Number(params.brandCols));
	// Link columns sit on whole grid columns; the remainder is a gap after the brand column.
	const gapCols = $derived((12 - brandCols) % columns);
	const linkCols = $derived(12 - brandCols - gapCols);
	const groups = $derived(footerColumns.slice(0, columns));
	// The link grid repeats the section gutter, so its tracks land exactly on the 12-column grid.
	const trackClasses: Record<number, string> = {
		2: '@min-[48rem]/section:grid-cols-2',
		3: '@min-[48rem]/section:grid-cols-3',
		4: '@min-[48rem]/section:grid-cols-4'
	};
	const socialLinks = [
		{ label: 'GitHub', icon: githubLogoIcon },
		{ label: 'X', icon: xLogoIcon },
		{ label: 'LinkedIn', icon: linkedinLogoIcon }
	];
	const legal = ['Privacy', 'Terms', 'Cookies'];
	const year = new Date().getFullYear();
	const linkClass = 'text-neutral/70 hover:text-neutral text-sm underline-offset-4 hover:underline';
	let subscribed = $state(false);
</script>

{#snippet brandBlock(center: boolean)}
	<div class="gap-lg flex flex-col {center ? 'items-center text-center' : 'items-start'}">
		<Wordmark />
		<p class="text-neutral/70 max-w-xs text-sm text-pretty">{brand.short}</p>
	</div>
{/snippet}

{#snippet newsletterForm(center: boolean)}
	<form
		class="gap-sm flex w-full max-w-sm flex-col {center ? 'items-center' : ''}"
		onsubmit={(event) => {
			event.preventDefault();
			subscribed = true;
		}}
	>
		<p class="text-sm font-medium" role="status">
			{subscribed ? 'Thanks, you’re subscribed.' : 'Product notes, once a month'}
		</p>
		<div class="gap-sm flex w-full">
			<TextInput
				type="email"
				size={kit.step(-1)}
				placeholder="you@company.com"
				class="min-w-0 flex-1"
				inputAttrs={{ 'aria-label': 'Email for product notes', autocomplete: 'email' }}
			/>
			<Button type="submit" size={kit.step(-1)} {...kit.action()}>Subscribe</Button>
		</div>
	</form>
{/snippet}

{#snippet socials()}
	<div class="gap-xs flex">
		{#each socialLinks as social (social.label)}
			<Button
				href={resolve('/blocks/generative')}
				prefix={social.icon}
				label={social.label}
				variant="ghost"
				color="neutral"
				size={kit.step(-1)}
				squared
			/>
		{/each}
	</div>
{/snippet}

{#snippet linkGroups()}
	<div
		class="gap-layout-md @min-[48rem]/section:gap-x-layout-lg grid grid-cols-2 {trackClasses[
			columns
		]}"
	>
		{#each groups as group (group.title)}
			<nav aria-label={group.title} class="gap-md flex flex-col items-start">
				<p class="text-sm font-semibold">{group.title}</p>
				<ul class="gap-sm flex flex-col">
					{#each group.links as link (link)}
						<li><a href={resolve('/blocks/generative')} class={linkClass}>{link}</a></li>
					{/each}
				</ul>
			</nav>
		{/each}
	</div>
{/snippet}

{#snippet bottomBar(center: boolean)}
	<div
		class="border-neutral-muted gap-x-layout-md gap-y-sm pt-lg flex flex-wrap items-center border-t {center
			? 'justify-center'
			: 'justify-between'}"
	>
		<p class="text-neutral/70 text-xs">© {year} Meridian Labs, Inc. All rights reserved.</p>
		{#if params.bottom === 'split'}
			<nav aria-label="Legal">
				<ul class="gap-lg flex flex-wrap">
					{#each legal as link (link)}
						<li>
							<a
								href={resolve('/blocks/generative')}
								class="text-neutral/70 hover:text-neutral text-xs underline-offset-4 hover:underline"
								>{link}</a
							>
						</li>
					{/each}
				</ul>
			</nav>
		{/if}
	</div>
{/snippet}

<SectionShell
	tone={params.tone as Tone}
	density={params.density as SectionDensity}
	as="footer"
	label="Site footer"
>
	<div class="gen-flow">
		{#if layout === 'centered'}
			<!-- Centred: the brand, one row of links, then the form and socials on the axis. -->
			<div class="gap-layout-sm flex flex-col items-center">
				{@render brandBlock(true)}
				<nav aria-label="Footer">
					<ul class="gap-x-layout-sm gap-y-sm flex flex-wrap justify-center">
						{#each navLinks as link (link)}
							<li>
								<a href={resolve('/blocks/generative')} class="{linkClass} font-medium">{link}</a>
							</li>
						{/each}
					</ul>
				</nav>
				{#if params.newsletter}{@render newsletterForm(true)}{/if}
				{#if params.socials}{@render socials()}{/if}
			</div>
			{@render bottomBar(true)}
		{:else if layout === 'stacked'}
			<!-- Stacked: a brand row across the top, the link columns sharing all 12 below it. -->
			<div class="gap-x-layout-md gap-y-lg flex flex-wrap items-end justify-between">
				<div class="gap-lg flex flex-col items-start">
					{@render brandBlock(false)}
					{#if params.newsletter && params.socials}{@render socials()}{/if}
				</div>
				{#if params.newsletter}
					{@render newsletterForm(false)}
				{:else if params.socials}
					{@render socials()}
				{/if}
			</div>
			<div class="border-neutral-muted pt-layout-sm border-t">
				{@render linkGroups()}
			</div>
			{@render bottomBar(false)}
		{:else}
			<div class="gen-grid">
				<div class="gen-col" style:--gen-span={brandCols} style:--gen-row={1}>
					<div class="gap-lg flex flex-col items-start">
						{@render brandBlock(false)}
						{#if params.newsletter}{@render newsletterForm(false)}{/if}
						{#if params.socials}{@render socials()}{/if}
					</div>
				</div>
				<div
					class="gen-col"
					style:--gen-span={linkCols}
					style:--gen-start={brandCols + gapCols + 1}
					style:--gen-row={1}
				>
					{@render linkGroups()}
				</div>
			</div>
			{@render bottomBar(false)}
		{/if}
	</div>
</SectionShell>
