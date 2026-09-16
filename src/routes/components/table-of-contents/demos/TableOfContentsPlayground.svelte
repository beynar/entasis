<script lang="ts">
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { Slider } from '$lib/components/Form/Slider/index.js';
	import { Switch } from '$lib/components/Form/Switch/index.js';
	import type {
		TableOfContentsActivationThresholds,
		TableOfContentsDensity,
		TableOfContentsLevel,
		TableOfContentsMarkerVisibility
	} from '$lib/components/TableOfContents/tableOfContents.props.js';
	import type { Sizes } from '$lib/types/theme.js';
	import TableOfContentsDemo from './TableOfContentsDemo.svelte';

	const levelItems = [
		{ value: '2-4', label: 'H2-H4' },
		{ value: '2-3', label: 'H2-H3' },
		{ value: '3-4', label: 'H3-H4' }
	] as const;

	const colorItems = [
		{ value: 'primary', label: 'Primary' },
		{ value: 'secondary', label: 'Secondary' },
		{ value: 'success', label: 'Success' },
		{ value: 'info', label: 'Info' }
	] as const;
	const densityItems = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	] as const satisfies ReadonlyArray<{
		value: Exclude<TableOfContentsDensity, number>;
		label: string;
	}>;
	const sizeItems = [
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	] as const satisfies ReadonlyArray<{ value: Sizes; label: string }>;
	const markerItems = [
		{ value: 'hidden', label: 'Hidden' },
		{ value: 'active', label: 'Active' },
		{ value: 'always', label: 'Always' }
	] as const;

	type LevelPreset = (typeof levelItems)[number]['value'];
	type HighlightColor = (typeof colorItems)[number]['value'];
	type DensityPreset = (typeof densityItems)[number]['value'];
	type Size = (typeof sizeItems)[number]['value'];
	type MarkerSetting = (typeof markerItems)[number]['value'];

	const levelsByPreset = {
		'2-4': [2, 3, 4],
		'2-3': [2, 3],
		'3-4': [3, 4]
	} satisfies Record<LevelPreset, readonly TableOfContentsLevel[]>;

	let showRail = $state(true);
	let markerSetting = $state<MarkerSetting>('active');
	let showConnectors = $state(true);
	let indentSize = $state<number | null>(14);
	let indentRadius = $state<number | null>(6);
	let viewportInset = $state<number | null>(96);
	let scrollRootInset = $state<number | null>(16);
	let currentOffset = $state<number | null>(48);
	let scrollOffset = $state<number | null>(64);
	let levelPreset = $state<LevelPreset>('2-4');
	let color = $state<HighlightColor>('primary');
	let density = $state<DensityPreset>('normal');
	let size = $state<Size>('normal');

	const levels = $derived(levelsByPreset[levelPreset]);
	const showMarkers = $derived<TableOfContentsMarkerVisibility>(
		markerSetting === 'hidden' ? false : markerSetting
	);
	const resolvedIndentSize = $derived(indentSize ?? 14);
	const resolvedIndentRadius = $derived(indentRadius ?? 6);
	const activationThresholds = $derived<TableOfContentsActivationThresholds>({
		viewportInset: viewportInset ?? 96,
		scrollRootInset: scrollRootInset ?? 16,
		currentOffset: currentOffset ?? 48
	});
</script>

<div class="grid w-full gap-6">
	<section
		aria-label="Table of contents controls"
		class="border-neutral-muted bg-surface grid gap-5 rounded-lg border p-4"
	>
		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<Switch size="small" label="Rail" bind:value={showRail} />
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Markers</span>
				<SegmentedControl
					items={markerItems}
					bind:value={markerSetting}
					size="small"
					label="Marker visibility"
				/>
			</div>
			<Switch size="small" label="Connectors" bind:value={showConnectors} />
			<Slider
				size="small"
				label="Indentation"
				bind:value={indentSize}
				min={0}
				max={28}
				step={1}
				showValue
				formatValue={(value) => `${value}px`}
			/>
			<Slider
				size="small"
				label="Corner radius"
				bind:value={indentRadius}
				min={0}
				max={16}
				step={1}
				showValue
				formatValue={(value) => `${value}px`}
			/>
		</div>

		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Size</span>
				<SegmentedControl
					items={sizeItems}
					bind:value={size}
					size="small"
					label="Navigation size"
				/>
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Density</span>
				<SegmentedControl
					items={densityItems}
					bind:value={density}
					size="small"
					label="Row density"
				/>
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Heading levels</span>
				<SegmentedControl
					items={levelItems}
					bind:value={levelPreset}
					size="small"
					label="Heading levels"
				/>
			</div>
			<div class="grid gap-2">
				<span class="text-neutral text-sm font-medium">Highlight color</span>
				<SegmentedControl
					items={colorItems}
					bind:value={color}
					size="small"
					label="Highlight color"
				/>
			</div>
		</div>

		<div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
			<Slider
				size="small"
				label="Viewport inset"
				bind:value={viewportInset}
				min={0}
				max={200}
				step={4}
				showValue
				formatValue={(value) => `${value}px`}
			/>
			<Slider
				size="small"
				label="Scroll-root inset"
				bind:value={scrollRootInset}
				min={0}
				max={160}
				step={4}
				showValue
				formatValue={(value) => `${value}px`}
			/>
			<Slider
				size="small"
				label="Current offset"
				bind:value={currentOffset}
				min={0}
				max={120}
				step={4}
				showValue
				formatValue={(value) => `${value}px`}
			/>
			<Slider
				size="small"
				label="Scroll offset"
				bind:value={scrollOffset}
				min={0}
				max={160}
				step={4}
				showValue
				formatValue={(value) => `${value}px`}
			/>
		</div>
	</section>

	<TableOfContentsDemo
		{activationThresholds}
		scrollOffset={scrollOffset ?? 0}
		{levels}
		{color}
		{density}
		{size}
		{showRail}
		{showMarkers}
		{showConnectors}
		indentSize={resolvedIndentSize}
		indentRadius={resolvedIndentRadius}
	/>
</div>
