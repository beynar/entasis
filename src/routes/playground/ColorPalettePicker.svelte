<script lang="ts">
	import { useRuntimeThemePlayground } from '../runtimeThemePlayground.svelte.js';
	import { runtimeColorPaletteNames, runtimeColorPalettes } from './runtimeColorPalettes.js';

	const playground = useRuntimeThemePlayground();
</script>

<div class="grid gap-md">
	<span class="text-sm font-medium">Color palette</span>
	<div class="flex flex-wrap gap-md">
		{#each runtimeColorPaletteNames as paletteName (paletteName)}
			{@const palette = runtimeColorPalettes[paletteName]}
			<button
				type="button"
				title={palette.label}
				aria-label={palette.label}
				aria-pressed={playground.palette === paletteName}
				class="state-layer border-neutral-muted grid size-9 place-items-center rounded-full border transition-transform aria-pressed:scale-110 aria-pressed:ring-2 aria-pressed:ring-primary aria-pressed:ring-offset-2 aria-pressed:ring-offset-surface-raised"
				onclick={() => (playground.palette = paletteName)}
			>
				<span
					class="size-5 rounded-full"
					style:background={`linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`}
				></span>
			</button>
		{/each}
	</div>
</div>
