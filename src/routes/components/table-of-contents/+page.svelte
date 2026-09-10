<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import TableOfContentsDemo from './demos/TableOfContentsDemo.svelte';
	import TableOfContentsPlayground from './demos/TableOfContentsPlayground.svelte';
	import { colors, sizes } from '$lib/utils/tokens.js';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: sizes
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: sizes
		},
		{
			name: 'color',
			type: 'segmented',
			label: 'Color',
			value: 'primary',
			options: colors
		}
	]);

	const usageCode = $derived(`<script lang="ts">
	import { ScrollArea } from 'svelai/scroll-area';
	import { TableOfContents } from 'svelai/table-of-contents';
<\/script>

<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
	<ScrollArea type="scroll" scrollFade class="h-[34rem]">
		<article id="article">
			<h2>System foundations</h2>
			<h3>A semantic palette</h3>
			<h4>Readable roles</h4>
		</article>
	</ScrollArea>

	<aside>
		<TableOfContents target="#article" levels={[2, 3, 4]} size="${controls.value.size}" density="${controls.value.density}" color="${controls.value.color}" />
	</aside>
</div>`;

	const itemsCode = `<script lang="ts">
	import { TableOfContents, type TableOfContentsItem } from 'svelai/table-of-contents';

	const items: TableOfContentsItem[] = [
		{ id: 'foundations', level: 2, title: 'System foundations' },
		{ id: 'palette', level: 3, title: 'A semantic palette' },
		{ id: 'roles', level: 4, title: 'Readable roles' }
	];
<\/script>

<TableOfContents {items} />

<article>
	<h2 id="foundations">System foundations</h2>
	<h3 id="palette">A semantic palette</h3>
	<h4 id="roles">Readable roles</h4>
</article>`;

	const playgroundCode = `<script lang="ts">
	import { SegmentedControl } from 'svelai/segmented-control';
	import { Slider } from 'svelai/slider';
	import { Switch } from 'svelai/switch';
	import { TableOfContents } from 'svelai/table-of-contents';

	let showRail = $state(true);
	let markerSetting = $state<'hidden' | 'active' | 'always'>('active');
	let showConnectors = $state(true);
	let indentSize = $state(14);
	let indentRadius = $state(6);
	let viewportInset = $state(96);
	let scrollRootInset = $state(16);
	let currentOffset = $state(48);
	let scrollOffset = $state(64);
	let levelPreset = $state<'2-4' | '2-3'>('2-4');
	let color = $state<'primary' | 'secondary' | 'success' | 'info'>('primary');
	let density = $state<'small' | 'normal' | 'large'>('normal');
	let size = $state<'small' | 'normal' | 'large'>('normal');
	const showMarkers = $derived(markerSetting === 'hidden' ? false : markerSetting);
	const activationThresholds = $derived({
		viewportInset,
		scrollRootInset,
		currentOffset
	});
	const levels = $derived(
		levelPreset === '2-4' ? ([2, 3, 4] as const) : ([2, 3] as const)
	);
<\/script>

<Switch label="Rail" bind:value={showRail} />
<SegmentedControl
	items={[
		{ value: 'hidden', label: 'Hidden' },
		{ value: 'active', label: 'Active' },
		{ value: 'always', label: 'Always' }
	]}
	bind:value={markerSetting}
	ariaLabel="Marker visibility"
/>
<Switch label="Connectors" bind:value={showConnectors} />
<Slider label="Indentation" bind:value={indentSize} min={0} max={28} showValue />
<Slider label="Corner radius" bind:value={indentRadius} min={0} max={16} showValue />
<Slider label="Viewport inset" bind:value={viewportInset} min={0} max={200} showValue />
<Slider label="Scroll-root inset" bind:value={scrollRootInset} min={0} max={160} showValue />
<Slider label="Current offset" bind:value={currentOffset} min={0} max={120} showValue />
<Slider label="Scroll offset" bind:value={scrollOffset} min={0} max={160} showValue />
<SegmentedControl
	items={[
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	]}
	bind:value={size}
/>
<SegmentedControl
	items={[
		{ value: 'small', label: 'Small' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'large', label: 'Large' }
	]}
	bind:value={density}
/>
<SegmentedControl
	items={[
		{ value: '2-4', label: 'H2-H4' },
		{ value: '2-3', label: 'H2-H3' }
	]}
	bind:value={levelPreset}
/>
<SegmentedControl
	items={[
		{ value: 'primary', label: 'Primary' },
		{ value: 'secondary', label: 'Secondary' },
		{ value: 'success', label: 'Success' },
		{ value: 'info', label: 'Info' }
	]}
	bind:value={color}
/>

<TableOfContents
	target="#article"
	{activationThresholds}
	{scrollOffset}
	{levels}
	{color}
	{density}
	{size}
	{showRail}
	{showMarkers}
	{showConnectors}
	{indentSize}
	{indentRadius}
/>`;
</script>

<DocPage
	title="Table of contents"
	subtitle="A measured, indented navigation rail that follows the headings visible in a content region."
	component="TableOfContents"
	features={[
		'Automatic heading discovery',
		'SSR-first array data source',
		'Multi-visible section highlighting',
		'Measured wrapped-label geometry',
		'Pre-hydration selector rendering',
		'Nested scroll-container support',
		'Configurable activation thresholds',
		'Configurable anchor landing offset',
		'Coordinated size, density, indentation, and rail treatments',
		'Native anchor navigation'
	]}
>
	<ComponentCard
		{controls}
		description="Scroll the article: every visible title colors together, and the rail follows semantic heading depth."
		code={usageCode}
		class="!min-h-fit items-stretch p-4 md:p-8"
	>
		<TableOfContentsDemo
			size={controls.value.size}
			density={controls.value.density}
			color={controls.value.color}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Interactive playground"
			description="Adjust size, density, rail geometry, activation thresholds, anchor offset, visible heading levels, markers, connectors, and highlight color while the measured navigation remains live."
			code={playgroundCode}
			class="!min-h-fit items-stretch p-4 md:p-8"
		>
			<TableOfContentsPlayground />
		</ComponentCard>

		<ComponentCard
			title="Array data"
			description="Provide ordered title data directly when another content pipeline already owns heading ids and labels. The list and neutral rail render before hydration; matching headings enable live highlighting."
			code={itemsCode}
			class="!min-h-fit items-stretch p-4 md:p-8"
		>
			<TableOfContentsDemo source="items" />
		</ComponentCard>

		<ComponentCard
			title="Large"
			description="Large typography and rail geometry combine with large density and a generous indentation step. Markers can be removed while preserving the active rail and title connectors."
			code={`<TableOfContents
	target="#article"
	size="large"
	showMarkers={false}
	showConnectors
	indentSize={22}
	indentRadius={12}
	density="large"
	color="secondary"
/>`}
			class="!min-h-fit items-stretch p-4 md:p-8"
		>
			<TableOfContentsDemo
				color="secondary"
				size="large"
				showMarkers={false}
				indentSize={22}
				indentRadius={12}
				density="large"
			/>
		</ComponentCard>

		<ComponentCard
			title="Small"
			description="Small typography and rail geometry combine with small density and indentation. Always-visible markers remain independent from connectors, and a zero radius produces square depth changes."
			code={`<TableOfContents
	target="#article"
	size="small"
	showConnectors={false}
	showMarkers="always"
	indentSize={8}
	indentRadius={0}
	density="small"
	color="success"
/>`}
			class="!min-h-fit items-stretch p-4 md:p-8"
		>
			<TableOfContentsDemo
				color="success"
				size="small"
				showConnectors={false}
				showMarkers="always"
				indentSize={8}
				indentRadius={0}
				density="small"
			/>
		</ComponentCard>

		<ComponentCard
			description="The levels prop controls both discovery and indentation. Here h4 headings remain in the article but are omitted from navigation."
			code={`<TableOfContents target="#article" levels={[2, 3]} color="info" />`}
			class="!min-h-fit items-stretch p-4 md:p-8"
		>
			<TableOfContentsDemo color="info" levels={[2, 3]} />
		</ComponentCard>
	{/snippet}
</DocPage>
