<script lang="ts">
	import {
		runtimeThemePresetNames,
		runtimeThemePresets,
		useRuntimeThemePlayground
	} from '../runtimeThemePlayground.svelte.js';
	import { runtimeColorPalettes } from './runtimeColorPalettes.js';

	const playground = useRuntimeThemePlayground();
</script>

<div class="grid gap-md">
	<div class="flex items-center justify-between gap-lg">
		<span class="text-sm font-medium">Presets</span>
		{#if !playground.selectedPreset}
			<span class="text-primary text-xs font-medium">Custom</span>
		{/if}
	</div>
	<div class="grid grid-cols-2 gap-md">
		{#each runtimeThemePresetNames as presetName (presetName)}
			{@const preset = runtimeThemePresets[presetName]}
			{@const palette = runtimeColorPalettes[preset.palette]}
			<button
				type="button"
				aria-pressed={playground.selectedPreset === presetName}
				class="state-layer border-neutral-muted grid min-w-0 gap-micro rounded-md border p-lg text-left transition-colors data-[pressed=true]:border-primary data-[pressed=true]:text-primary"
				data-pressed={playground.selectedPreset === presetName}
				onclick={() => playground.applyPreset(presetName)}
			>
				<strong class="text-sm">{preset.label}</strong>
				<span class="text-neutral/60 text-xs">{preset.description}</span>
				<span class="mt-xs flex items-center gap-sm text-xs">
					<span
						class="size-2.5 rounded-full"
						style:background={`linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`}
					></span>
					<span class="text-neutral/60">{preset.typeScale} type</span>
				</span>
			</button>
		{/each}
	</div>
</div>
