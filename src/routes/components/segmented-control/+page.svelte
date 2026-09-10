<script lang="ts">
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import { gridFourIcon } from '$lib/components/Icons/gridFour.js';
	import { listIcon } from '$lib/components/Icons/list.js';
	import { tableIcon } from '$lib/components/Icons/table.js';
	import { columnsIcon } from '$lib/components/Icons/columns.js';
	import { rowsIcon } from '$lib/components/Icons/rows.js';
	import { colors, sizes } from '$lib/utils/tokens.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const segmentedVariants = ['normal', 'pill'] as const;

	const viewItems = [
		{ value: 'grid', label: 'Grid', icon: gridFourIcon },
		{ value: 'list', label: 'List', icon: listIcon },
		{ value: 'table', label: 'Table', icon: tableIcon }
	] as const;
	const compactViewItems = [viewItems[0], viewItems[1]] as const;

	const layoutItems = [
		{ value: 'columns', icon: columnsIcon, ariaLabel: 'Columns' },
		{ value: 'rows', icon: rowsIcon, ariaLabel: 'Rows' },
		{ value: 'table', icon: tableIcon, ariaLabel: 'Table' }
	] as const;

	const densityItems = [
		{ value: 'compact', label: 'Compact', count: '12 rows' },
		{ value: 'comfortable', label: 'Comfortable', count: '8 rows' },
		{ value: 'spacious', label: 'Spacious', count: '5 rows' }
	] as const;

	type ViewValue = (typeof viewItems)[number]['value'];
	type CompactViewValue = (typeof compactViewItems)[number]['value'];
	type LayoutValue = (typeof layoutItems)[number]['value'];
	type DensityItem = (typeof densityItems)[number];
	type DensityValue = DensityItem['value'];

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'variant',
			type: 'segmented',
			label: 'Variant',
			value: 'normal',
			options: segmentedVariants
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'neutral',
			options: colors
		},
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let view = $state<ViewValue>('grid');
	let variantView = $state<ViewValue>('grid');
	let sizeView = $state<ViewValue>('grid');
	let colorView = $state<CompactViewValue>('grid');
	let disabledView = $state<ViewValue>('grid');
	let layout = $state<LayoutValue>('columns');
	let density = $state<DensityValue>('comfortable');
</script>

{#snippet densityRenderer(controlItem: DensityItem)}
	<span>{controlItem.label}</span>
	<span class="text-[0.7em] opacity-60">{controlItem.count}</span>
{/snippet}

<DocPage
	title="Segmented control"
	subtitle="A compact single-selection input for switching between a few mutually exclusive modes."
	component="SegmentedControl"
	features={[
		'Bindable value with inferred item unions',
		'Normal and pill shape variants',
		'Radiogroup semantics and arrow keys',
		'Size-aware item hit targets without visual growth',
		'Default icon/label or custom item snippet'
	]}
>
	<ComponentCard
		{controls}
		code={`const items = [
		{ value: 'grid', label: 'Grid', icon: gridFourIcon },
		{ value: 'list', label: 'List', icon: listIcon },
		{ value: 'table', label: 'Table', icon: tableIcon }
	] as const;

	let value = $state<(typeof items)[number]['value']>('grid');

<SegmentedControl {items} bind:value size="${controls.value.size}" variant="${controls.value.variant}" color="${controls.value.color}" disabled={${controls.value.disabled}} />`}
	>
		<div class="flex w-full max-w-xl items-center justify-between gap-6">
			<div class="min-w-0">
				<p class="text-neutral text-sm font-medium">Project view</p>
				<p class="text-neutral/60 truncate text-xs">Current mode: {view}</p>
			</div>
			<SegmentedControl
				items={viewItems}
				bind:value={view}
				size={controls.value.size}
				variant={controls.value.variant}
				color={controls.value.color}
				disabled={controls.value.disabled}
				ariaLabel="Project view"
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Variants"
			description="Normal keeps the corners restrained; pill preserves the fully rounded stadium shape."
			code={`<SegmentedControl {items} bind:value />
<SegmentedControl {items} bind:value variant="pill" />`}
		>
			<div class="flex flex-wrap items-center justify-center gap-5">
				<SegmentedControl items={viewItems} bind:value={variantView} ariaLabel="Normal view" />
				<SegmentedControl
					items={viewItems}
					bind:value={variantView}
					variant="pill"
					ariaLabel="Pill view"
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Sizes"
			description="Small, normal, and large use the same density scale as the rest of the library."
			code={`{#each ['small', 'normal', 'large'] as size}
	<SegmentedControl {items} {size} bind:value />
{/each}`}
		>
			<div class="flex flex-col items-center gap-5">
				{#each sizes as size (size)}
					<SegmentedControl
						items={viewItems}
						bind:value={sizeView}
						{size}
						ariaLabel={`${size} view`}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Colors"
			description="The semantic color controls the moving pill and keyboard focus ring."
			code={`<SegmentedControl {items} bind:value color="primary" />`}
		>
			<div class="flex flex-wrap items-center justify-center gap-4">
				{#each colors as color (color)}
					<SegmentedControl
						items={compactViewItems}
						bind:value={colorView}
						{color}
						ariaLabel={`${color} view`}
					/>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Icon only"
			description="Omit labels for a compact control and provide ariaLabel on each item."
			code={`const items = [
	{ value: 'columns', icon: columnsIcon, ariaLabel: 'Columns' },
	{ value: 'rows', icon: rowsIcon, ariaLabel: 'Rows' }
];

<SegmentedControl {items} bind:value ariaLabel="Layout" />`}
		>
			<SegmentedControl items={layoutItems} bind:value={layout} ariaLabel="Layout" />
		</ComponentCard>

		<ComponentCard
			title="Custom item renderer"
			description="The item snippet receives the original object, including application-specific fields."
			code={`<SegmentedControl items={densityItems} bind:value={density}>
	{#snippet item(option)}
		<span>{option.label}</span>
		<span class="opacity-60">{option.count}</span>
	{/snippet}
</SegmentedControl>`}
		>
			<div class="flex flex-col items-center gap-3">
				<SegmentedControl
					items={densityItems}
					bind:value={density}
					item={densityRenderer}
					ariaLabel="Row density"
				/>
				<p class="text-neutral/60 text-xs">Selected density: {density}</p>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Disabled states"
			description="Disable one option or the full radiogroup; keyboard navigation skips unavailable items."
		>
			<div class="flex flex-wrap items-center justify-center gap-5">
				<SegmentedControl
					items={[
						{ value: 'grid', label: 'Grid', icon: gridFourIcon },
						{ value: 'list', label: 'List', icon: listIcon, disabled: true },
						{ value: 'table', label: 'Table', icon: tableIcon }
					]}
					bind:value={disabledView}
					ariaLabel="View with disabled list"
				/>
				<SegmentedControl items={viewItems} value="grid" disabled ariaLabel="Disabled view" />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
