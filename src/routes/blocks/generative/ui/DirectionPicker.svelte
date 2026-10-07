<script lang="ts">
	import { Button } from 'entasis/button';
	import { Select } from 'entasis/select';
	import { checkIcon } from 'entasis/icons/check';
	import { paletteIcon } from 'entasis/icons/palette';
	import {
		runtimeThemePresets,
		useRuntimeThemePlayground
	} from '../../../runtimeThemePlayground.svelte.js';
	import { directions, findDirection } from '../engine/directions.js';

	/**
	 * Picks the art direction. Its fixed tokens are an Entasis theme preset and palette, applied
	 * through the docs' global theme — so the footer theme controls keep retuning whatever the
	 * direction set, and every page in the docs follows.
	 */
	interface Props {
		value: string;
		onValueChange: (id: string) => void;
		/** Apply the direction's theme preset whenever the direction changes. */
		applyTheme?: boolean;
		compact?: boolean;
	}

	let { value, onValueChange, applyTheme = false, compact = false }: Props = $props();

	const playground = useRuntimeThemePlayground();
	const direction = $derived(findDirection(value));
	const applied = $derived(
		playground.selectedPreset === direction.preset && playground.palette === direction.palette
	);
	const presetLabel = $derived(runtimeThemePresets[direction.preset].label);

	function apply() {
		playground.applyPreset(direction.preset);
		playground.palette = direction.palette;
	}

	function change(id: string) {
		onValueChange(id);
		if (applyTheme) {
			const next = findDirection(id);
			playground.applyPreset(next.preset);
			playground.palette = next.palette;
		}
	}
</script>

<div class="gap-sm flex flex-col">
	<Select
		size="small"
		triggerAttrs={{ 'aria-label': 'Art direction' }}
		items={directions.map((entry) => ({ value: entry.id, label: entry.label }))}
		{value}
		onValueChange={(id) => typeof id === 'string' && change(id)}
	/>
	{#if !compact}
		<p class="text-neutral/65 text-xs">{direction.description}</p>
	{/if}
	<div class="gap-sm flex items-center justify-between">
		<span class="text-neutral/60 truncate text-xs"
			>Tokens · {presetLabel} theme, {direction.palette}</span
		>
		{#if applied}
			<span class="gap-xs text-success-readable inline-flex shrink-0 items-center text-xs"
				>{@render checkIcon()} Applied</span
			>
		{:else}
			<Button size="small" variant="ghost" prefix={paletteIcon} onclick={apply}>Apply theme</Button>
		{/if}
	</div>
</div>
