<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from '$lib/components/Button/index.js';
	import {
		typeScalePresets,
		type TypeScalePreset
	} from '$lib/components/Theme/theme.designTokens.js';

	const presetNames = ['compact', 'default', 'comfortable', 'large'] as const;
	const selectedPreset = $derived(
		presetNames.find((preset) => preset === page.url.searchParams.get('preset')) ?? 'default'
	);

	function selectPreset(preset: TypeScalePreset) {
		void goto(resolve(`/fluid-scale?preset=${preset}`), { keepFocus: true, noScroll: true });
	}
</script>

<article class="mx-auto grid max-w-5xl gap-8 p-6">
	<header class="grid gap-3">
		<h1 class="text-3xl font-semibold">Runtime design tokens</h1>
		<p class="text-neutral/70 max-w-2xl text-balance">
			Change a preset to update spacing, radius, typography, and raised borders across the
			already-rendered page. No Tailwind rebuild or new utility class is involved.
		</p>
		<div class="flex flex-wrap gap-2">
			{#each presetNames as preset (preset)}
				<Button
					variant={selectedPreset === preset ? 'solid' : 'outline'}
					onclick={() => selectPreset(preset)}
				>
					{preset}
				</Button>
			{/each}
		</div>
	</header>

	<section class="grid gap-4">
		<div>
			<h2 class="text-xl font-semibold capitalize">{selectedPreset}</h2>
			<p class="text-neutral/70 text-sm">
				Base: {typeScalePresets[selectedPreset].baseMinPx}px–{typeScalePresets[selectedPreset]
					.baseMaxPx}px · Ratio: {typeScalePresets[selectedPreset].scale}
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			{#each ['Spacing', 'Radius', 'Raised border'] as token (token)}
				<div class="raised-md bg-surface-raised grid gap-3 rounded-xl p-4">
					<div class="bg-primary/15 h-10 rounded-lg"></div>
					<div class="grid gap-2">
						<strong>{token}</strong>
						<span class="text-neutral/70 text-sm"
							>This card uses gap-3, gap-2, p-4, and rounded-*.</span
						>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="grid gap-4">
		<h2 class="text-xl font-semibold">Fluid typography</h2>
		<div class="border-neutral-muted grid gap-3 rounded-xl border p-4">
			<p class="text-xs">Extra small interface text</p>
			<p class="text-sm">Small supporting text</p>
			<p class="text-base">Base body text</p>
			<p class="text-lg">Large body text</p>
			<p class="text-xl">Section heading</p>
			<p class="text-2xl">Page heading</p>
			<p class="text-3xl">Display heading</p>
			<p class="text-4xl">Large display heading</p>
		</div>
	</section>
</article>
