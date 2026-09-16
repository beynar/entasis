<script lang="ts">
	import Heading from '$lib/components/Heading/Heading.svelte';
	import type { Colors } from '$lib/types/theme.js';

	const colorList = {
		primary: [
			'bg-primary',
			'bg-primary-dark',
			'bg-primary-light',
			'bg-primary-lighter',
			'bg-primary-muted',
			'bg-primary-contrast'
		],
		secondary: [
			'bg-secondary',
			'bg-secondary-dark',
			'bg-secondary-light',
			'bg-secondary-lighter',
			'bg-secondary-muted',
			'bg-secondary-contrast'
		],
		success: [
			'bg-success',
			'bg-success-dark',
			'bg-success-light',
			'bg-success-lighter',
			'bg-success-muted',
			'bg-success-contrast'
		],
		danger: [
			'bg-danger',
			'bg-danger-dark',
			'bg-danger-light',
			'bg-danger-lighter',
			'bg-danger-muted',
			'bg-danger-contrast'
		],
		warning: [
			'bg-warning',
			'bg-warning-dark',
			'bg-warning-light',
			'bg-warning-lighter',
			'bg-warning-muted',
			'bg-warning-contrast'
		],
		info: [
			'bg-info',
			'bg-info-dark',
			'bg-info-light',
			'bg-info-lighter',
			'bg-info-muted',
			'bg-info-contrast'
		],
		neutral: [
			'bg-neutral',
			'bg-neutral-dark',
			'bg-neutral-light',
			'bg-neutral-lighter',
			'bg-neutral-muted',
			'bg-neutral-contrast'
		]
	} satisfies Record<Colors, string[]>;

	const surfaceList = [
		{ name: 'surface-recessed', background: 'bg-surface-recessed' },
		{ name: 'surface-canvas', background: 'bg-surface-canvas' },
		{ name: 'surface', background: 'bg-surface' },
		{ name: 'surface-raised', background: 'bg-surface-raised' },
		{ name: 'surface-floating', background: 'bg-surface-floating' }
	] as const;

	const semanticInteractionRows = [
		{ name: 'primary', background: 'bg-primary', content: 'text-primary-contrast' },
		{ name: 'secondary', background: 'bg-secondary', content: 'text-secondary-contrast' },
		{ name: 'success', background: 'bg-success', content: 'text-success-contrast' },
		{ name: 'danger', background: 'bg-danger', content: 'text-danger-contrast' },
		{ name: 'warning', background: 'bg-warning', content: 'text-warning-contrast' },
		{ name: 'info', background: 'bg-info', content: 'text-info-contrast' },
		{ name: 'neutral', background: 'bg-neutral', content: 'text-neutral-contrast' }
	] as const;
</script>

{#snippet interactionCell(
	background: string,
	content: string,
	label: string,
	opacity?: 'hover' | 'pressed'
)}
	<div
		class={`${background} ${content} raised relative isolate flex h-16 items-center justify-center overflow-hidden rounded-lg text-sm font-medium`}
	>
		{#if opacity}
			<span
				class="pointer-events-none absolute inset-0 bg-current {opacity === 'hover'
					? 'opacity-[var(--state-hover-opacity)]'
					: 'opacity-[var(--state-pressed-opacity)]'}"
			></span>
		{/if}
		<span class="relative">{label}</span>
	</div>
{/snippet}

<div class="grid gap-8 p-10">
	<section class="grid gap-3">
		<Heading class="text-neutral">Surface elevation</Heading>
		<p class="text-neutral/70 max-w-3xl text-sm">
			Surface tokens describe resting elevation only: the app canvas, ordinary surfaces, raised
			containers, and floating overlays.
		</p>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each surfaceList as surface (surface.name)}
				<div class="h-auto rounded-lg">
					<div class={`raised h-[100px] w-full rounded-lg ${surface.background}`}></div>
					<div class="text-neutral p-2 text-center text-sm">{surface.name}</div>
				</div>
			{/each}
		</div>
	</section>

	{#each Object.entries(colorList) as [color, variants] (color)}
		<section class="grid gap-2">
			<Heading class="text-neutral">{color}</Heading>
			<div class="grid grid-cols-2 gap-4 md:grid-cols-6">
				{#each variants as variant (variant)}
					<div class="h-auto rounded-lg">
						<div class={`raised h-[100px] w-full rounded-lg ${variant}`}></div>
						<div class="text-neutral p-2 text-center text-sm">{variant.replace('bg-', '')}</div>
					</div>
				{/each}
			</div>
		</section>
	{/each}

	<section class="mt-2 grid gap-3">
		<Heading class="text-neutral">Surface interaction</Heading>
		<p class="text-neutral/70 max-w-3xl text-sm">
			The state layer uses the element's current text color. It darkens light surfaces with dark
			content and lightens dark surfaces with light content without changing elevation.
		</p>
		<div class="grid grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(6rem,1fr))] gap-2 text-sm">
			<div></div>
			<div class="text-neutral/70 p-2 text-center">Rest</div>
			<div class="text-neutral/70 p-2 text-center">Hover</div>
			<div class="text-neutral/70 p-2 text-center">Pressed</div>
			{#each surfaceList as surface (surface.name)}
				<div class="text-neutral flex items-center font-medium">{surface.name}</div>
				{@render interactionCell(surface.background, 'text-neutral', 'Rest')}
				{@render interactionCell(surface.background, 'text-neutral', 'Hover', 'hover')}
				{@render interactionCell(surface.background, 'text-neutral', 'Pressed', 'pressed')}
			{/each}
		</div>
	</section>

	<section class="grid gap-3">
		<Heading class="text-neutral">Semantic interaction</Heading>
		<div class="grid grid-cols-[minmax(9rem,1fr)_repeat(3,minmax(6rem,1fr))] gap-2 text-sm">
			<div></div>
			<div class="text-neutral/70 p-2 text-center">Rest</div>
			<div class="text-neutral/70 p-2 text-center">Hover</div>
			<div class="text-neutral/70 p-2 text-center">Pressed</div>
			{#each semanticInteractionRows as row (row.name)}
				<div class="text-neutral flex items-center font-medium">{row.name}</div>
				{@render interactionCell(row.background, row.content, 'Rest')}
				{@render interactionCell(row.background, row.content, 'Hover', 'hover')}
				{@render interactionCell(row.background, row.content, 'Pressed', 'pressed')}
			{/each}
		</div>
	</section>
</div>
