<script lang="ts">
	import {
		runtimeThemePresetNames,
		runtimeThemePresets,
		useRuntimeThemePlayground
	} from '../runtimeThemePlayground.svelte.js';
	import { runtimeColorPalettes } from './runtimeColorPalettes.js';

	const playground = useRuntimeThemePlayground();
</script>

<div class="gap-md grid">
	<div class="gap-lg flex items-center justify-between">
		<span class="text-sm font-medium">Presets</span>
		{#if !playground.selectedPreset}
			<span class="text-primary-readable text-xs font-medium">Custom</span>
		{/if}
	</div>
	<div class="gap-md grid grid-cols-2">
		{#each runtimeThemePresetNames as presetName (presetName)}
			{@const preset = runtimeThemePresets[presetName]}
			{@const palette = runtimeColorPalettes[preset.palette]}
			<button
				type="button"
				aria-pressed={playground.selectedPreset === presetName}
				class="state-layer border-neutral-muted gap-micro p-lg data-[pressed=true]:border-primary data-[pressed=true]:text-primary-readable grid min-w-0 rounded-md border text-left transition-colors"
				data-pressed={playground.selectedPreset === presetName}
				onclick={() => playground.applyPreset(presetName)}
			>
				<strong class="text-sm">{preset.label}</strong>
				<span class="text-neutral/70 text-xs">{preset.description}</span>
				<span class="mt-xs gap-sm flex items-center text-xs">
					<span
						class="size-2.5 rounded-full"
						style:background={`linear-gradient(135deg, ${palette.primary} 50%, ${palette.secondary} 50%)`}
					></span>
					<span class="text-neutral/70">{preset.typeScale} type · {preset.elevation} lift</span>
				</span>
			</button>
		{/each}
	</div>
</div>
