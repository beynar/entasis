<script lang="ts">
	import { resolve } from '$app/paths';
	import { Separator } from 'entasis/separator';
	import { isOnColor, type SectionDensity, type Tone } from '../../engine/levers.js';
	import type { Params } from '../../engine/types.js';
	import SectionShell from '../SectionShell.svelte';
	import Wordmark from '../Wordmark.svelte';
	import { brand, footerColumns, navLinks } from '../content.js';

	let { params }: { params: Params } = $props();

	const tone = $derived(params.tone as Tone);
	const onBrand = $derived(isOnColor(tone));
	const beside = $derived(params.layout === 'beside');
	const center = $derived(params.align === 'center');
	const wordmark = $derived(params.statement === 'wordmark');
	const quiet = $derived(onBrand ? 'text-primary-contrast/85' : 'text-neutral/70');
	const linkClass = $derived(
		`text-sm font-medium underline-offset-4 hover:underline ${
			onBrand
				? 'text-primary-contrast/85 hover:text-primary-contrast'
				: 'text-neutral/75 hover:text-neutral'
		}`
	);
	// Display sizes are steps of the theme type scale, stepped up with the section's own width so
	// the one-word wordmark never outgrows a narrow container.
	const statementSize = $derived(
		!wordmark
			? beside
				? 'text-3xl @min-[36rem]/section:text-4xl @min-[48rem]/section:text-5xl'
				: 'text-3xl @min-[36rem]/section:text-4xl @min-[48rem]/section:text-6xl'
			: params.scale === 'huge'
				? 'text-5xl @min-[36rem]/section:text-7xl @min-[48rem]/section:text-9xl'
				: 'text-5xl @min-[36rem]/section:text-6xl @min-[48rem]/section:text-8xl'
	);
	const groups = footerColumns.slice(0, 3);
	const year = new Date().getFullYear();
</script>

{#snippet statement()}
	{#if wordmark}
		<!-- The theme's display step, capped by the section's own width (container units) so the
		     one-word wordmark can never run off the page, whatever the type scale. -->
		<p
			class="leading-none font-bold tracking-tighter {statementSize} {center ? 'text-center' : ''}"
			style:font-size={beside
				? 'min(var(--text-7xl), 13cqi)'
				: params.scale === 'huge'
					? 'min(var(--text-9xl), 17cqi)'
					: 'min(var(--text-8xl), 14cqi)'}
		>
			{brand.name}
		</p>
	{:else}
		<p
			class="max-w-4xl leading-tight font-semibold tracking-tight text-balance {statementSize} {center
				? 'mx-auto text-center'
				: ''}"
		>
			{brand.tagline}
		</p>
	{/if}
{/snippet}

{#snippet copyright()}
	<p class="text-xs {quiet}">© {year} Meridian Labs, Inc.</p>
{/snippet}

{#snippet links()}
	{#if params.links === 'columns'}
		<div class="gen-grid">
			<div class="gen-col" style:--gen-span={5} style:--gen-row={1}>
				<div class="gap-md flex flex-col items-start">
					{#if !wordmark}<Wordmark {onBrand} />{/if}
					<p class="max-w-xs text-sm text-pretty {quiet}">{brand.short}</p>
					{@render copyright()}
				</div>
			</div>
			<div class="gen-col" style:--gen-span={6} style:--gen-start={7} style:--gen-row={1}>
				<div
					class="gap-layout-md @min-[48rem]/section:gap-x-layout-lg grid grid-cols-2 @min-[36rem]/section:grid-cols-3"
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
			</div>
		</div>
	{:else}
		<div
			class="gap-x-layout-md gap-y-lg flex flex-wrap items-center {center
				? 'flex-col justify-center'
				: 'justify-between'}"
		>
			<div
				class="gap-x-layout-md gap-y-md flex flex-wrap items-center {center
					? 'flex-col justify-center'
					: ''}"
			>
				{#if !wordmark}<Wordmark {onBrand} />{/if}
				<nav aria-label="Footer">
					<ul class="gap-x-lg gap-y-sm flex flex-wrap {center ? 'justify-center' : ''}">
						{#each navLinks as link (link)}
							<li><a href={resolve('/blocks/generative')} class={linkClass}>{link}</a></li>
						{/each}
					</ul>
				</nav>
			</div>
			{@render copyright()}
		</div>
	{/if}
{/snippet}

{#snippet sideLinks()}
	{#if params.links === 'columns'}
		<div class="gap-layout-md grid grid-cols-2 @min-[36rem]/section:grid-cols-3">
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
	{:else}
		<nav aria-label="Footer">
			<ul class="gap-md flex flex-col items-start">
				{#each navLinks as link (link)}
					<li><a href={resolve('/blocks/generative')} class={linkClass}>{link}</a></li>
				{/each}
			</ul>
		</nav>
	{/if}
{/snippet}

<SectionShell {tone} density={params.density as SectionDensity} as="footer" label="Site footer">
	<div class="gen-flow">
		{#if beside}
			<!-- Beside: the statement holds 7 columns, the links the last 5, over a quiet bottom bar. -->
			<div class="gen-grid">
				<div class="gen-col" style:--gen-span={7} style:--gen-row={1}>
					<div class="gap-lg flex flex-col items-start">
						{#if !wordmark}<Wordmark {onBrand} />{/if}
						{@render statement()}
						{#if wordmark}<p class="max-w-xs text-sm text-pretty {quiet}">{brand.short}</p>{/if}
					</div>
				</div>
				<div
					class="gen-col"
					style:--gen-span={params.links === 'columns' ? 5 : 3}
					style:--gen-start={params.links === 'columns' ? 8 : 10}
					style:--gen-row={1}
				>
					{@render sideLinks()}
				</div>
			</div>
			{#if params.divider}<Separator class="my-0" />{/if}
			{@render copyright()}
		{:else if params.position === 'top'}
			{@render statement()}
			{#if params.divider}<Separator class="my-0" />{/if}
			{@render links()}
		{:else}
			{@render links()}
			{#if params.divider}<Separator class="my-0" />{/if}
			{@render statement()}
		{/if}
	</div>
</SectionShell>
