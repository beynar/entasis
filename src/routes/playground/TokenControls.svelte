<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import Code from '$lib/components/Code/Code.svelte';
	import Slider from '$lib/components/Form/Slider/Slider.svelte';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import type {
		ThemeElevation,
		TypeScalePreset
	} from '$lib/components/Theme/theme.designTokens.js';
	import {
		runtimeMotionEasingPresetNames,
		runtimeMotionEasingPresets,
		useRuntimeThemePlayground
	} from '../runtimeThemePlayground.svelte.js';
	import ColorPalettePicker from './ColorPalettePicker.svelte';
	import { runtimeColorPalettes } from './runtimeColorPalettes.js';
	import TokenPresetPicker from './TokenPresetPicker.svelte';

	/** Embedded drops the raised card chrome (used inside the docs footer popover). */
	let { embedded = false }: { embedded?: boolean } = $props();
	const playground = useRuntimeThemePlayground();
	const typeScaleItems = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'default', label: 'Default' },
		{ value: 'comfortable', label: 'Comfortable' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: TypeScalePreset; label: string }>;
	const elevationItems = [
		{ value: 'flat', label: 'Flat' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'high', label: 'High' }
	] as const satisfies ReadonlyArray<{ value: ThemeElevation; label: string }>;
	const motionEasingItems = runtimeMotionEasingPresetNames.map((name) => ({
		value: name,
		label: runtimeMotionEasingPresets[name].label
	}));
	const configuration = $derived(`/* Runtime CSS variables */
--color-primary: ${runtimeColorPalettes[playground.palette].primary};
--color-secondary: ${runtimeColorPalettes[playground.palette].secondary};

/* Theme component prop */
designTokens={{
  light: {
    spacing: ${playground.spacing},
    spacingScale: ${JSON.stringify(playground.spacingScale)},
    radius: ${playground.radius},
    typeScale: '${playground.typeScale}',
    elevation: '${playground.elevation}',
    motion: ${JSON.stringify(playground.motion)},
    raisedWithBorder: ${playground.raisedWithBorder}
  },
  dark: {
    spacing: ${playground.spacing},
    spacingScale: ${JSON.stringify(playground.spacingScale)},
    radius: ${playground.radius},
    typeScale: '${playground.typeScale}',
    elevation: '${playground.elevation}',
    motion: ${JSON.stringify(playground.motion)},
    raisedWithBorder: ${playground.raisedWithBorder}
  }
}}`);

	const formatMultiplier = (value: number) => `${Number(value.toFixed(2))}×`;
	// 0× collapses every duration step to 0 ms: the whole app switches instantly.
	const formatSpeed = (value: number) => (value === 0 ? 'instant' : formatMultiplier(value));
	const motionEasingDescription = $derived(
		runtimeMotionEasingPresets[playground.motionEasing].description
	);
</script>

<aside
	class={embedded
		? 'gap-layout-md grid content-start'
		: 'raised-md gap-layout-md bg-surface-raised p-layout-sm grid content-start rounded-lg'}
>
	<div class="gap-lg flex items-center justify-between">
		<div>
			<h2 class="text-lg font-semibold">Design tokens</h2>
			<p class="text-neutral/70 text-sm">Changes apply to every docs page immediately.</p>
		</div>
		<Button size="small" variant="outline" onclick={() => playground.reset()}>Reset</Button>
	</div>

	<TokenPresetPicker />
	<ColorPalettePicker />

	<div class="border-neutral-muted gap-layout-sm pt-layout-sm grid border-t">
		<Slider
			label="Density"
			bind:value={playground.spacing}
			min={0.5}
			max={1.5}
			step={0.05}
			showValue
			formatValue={formatMultiplier}
		/>
		<Slider
			label="Spacing scale"
			bind:value={playground.spacingScaleValues}
			min={0.5}
			max={6}
			step={0.5}
			thumbs={5}
			minStepsBetweenThumbs={1}
			thumbLabels={['Extra small', 'Small', 'Medium', 'Large', 'Extra large']}
			formatValue={formatMultiplier}
		/>
		<div class="gap-xs grid grid-cols-5 text-center">
			{#each Object.entries(playground.resolvedSpacingScale) as [step, value] (step)}
				<div class="gap-micro grid">
					<span class="text-neutral/70 text-xs uppercase">{step}</span>
					<span class="text-xs font-medium">{value}</span>
				</div>
			{/each}
		</div>
		<Slider
			label="Radius"
			bind:value={playground.radius}
			min={0}
			max={2.5}
			step={0.05}
			showValue
			formatValue={formatMultiplier}
		/>
		<div class="gap-md grid">
			<span class="text-sm font-medium">Type scale</span>
			<SegmentedControl
				items={typeScaleItems}
				bind:value={playground.typeScale}
				size="small"
				label="Type scale"
				class="w-full"
			/>
		</div>
		<div class="gap-md grid">
			<span class="text-sm font-medium">Elevation</span>
			<SegmentedControl
				items={elevationItems}
				bind:value={playground.elevation}
				size="small"
				label="Elevation"
				class="w-full"
			/>
		</div>
		<Switch label="Raised borders" bind:value={playground.raisedWithBorder} />
	</div>

	<div class="border-neutral-muted gap-layout-sm pt-layout-sm grid border-t">
		<div>
			<h3 class="text-sm font-medium">Motion</h3>
			<p class="text-neutral/70 text-xs">
				Speed scales every duration step; the easing kit re-points the four roles.
			</p>
		</div>
		<Slider
			label="Speed"
			bind:value={playground.motionSpeed}
			min={0}
			max={2}
			step={0.05}
			showValue
			formatValue={formatSpeed}
		/>
		<div class="gap-xs grid grid-cols-5 text-center">
			{#each Object.entries(playground.motion.duration ?? {}) as [step, value] (step)}
				<div class="gap-micro grid">
					<span class="text-neutral/70 text-xs uppercase">{step}</span>
					<span class="text-xs font-medium">{value}ms</span>
				</div>
			{/each}
		</div>
		<div class="gap-md grid">
			<span class="text-sm font-medium">Easing</span>
			<SegmentedControl
				items={motionEasingItems}
				bind:value={playground.motionEasing}
				size="small"
				label="Motion easing"
				class="w-full"
			/>
			<p class="text-neutral/70 text-xs">{motionEasingDescription}</p>
		</div>
	</div>

	<div class="gap-md grid min-w-0">
		<span class="text-sm font-medium">Theme configuration</span>
		<Code language="svelte" code={configuration} />
	</div>
</aside>
