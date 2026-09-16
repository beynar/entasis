<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import DataTableBasicDemo from './DataTableBasicDemo.svelte';
	import DataTableEditingDemo from './DataTableEditingDemo.svelte';
	import DataTableExternalControlsDemo from './DataTableExternalControlsDemo.svelte';
	import DataTableGroupingDemo from './DataTableGroupingDemo.svelte';
	import DataTableInFlowDemo from './DataTableInFlowDemo.svelte';
	import DataTableLargeDemo from './DataTableLargeDemo.svelte';
	import DataTableManualDemo from './DataTableManualDemo.svelte';
	import DataTableRenderingDemo from './DataTableRenderingDemo.svelte';
	import {
		basicDataTableCode,
		editingDataTableCode,
		externalControlsDataTableCode,
		gridDataTableCode,
		groupingDataTableCode,
		inFlowDataTableCode,
		manualDataTableCode,
		renderingDataTableCode
	} from './codeSnippets.js';

	const controls = createComponentControls([
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{
			name: 'selectionMode',
			type: 'segmented',
			label: 'Selection',
			value: 'none',
			options: ['none', 'single', 'multiple']
		},
		{ name: 'search', type: 'switch', label: 'Search', value: true },
		{ name: 'stickyHeader', type: 'switch', label: 'Sticky header', value: true }
	]);
</script>

<DocPage
	title="Data table"
	subtitle="A typed, virtualized data surface for sorting, filtering, editing, and large datasets."
	component="DataTable"
	features={[
		'Client and manual processing contracts',
		'Virtualized rows, or in-flow with virtualize={false}',
		'Sorting, filters, grouping, and aggregation',
		'Selection, expansion, and async editing',
		'Column ordering, sizing, visibility, and pinning',
		'Semantic table or interactive grid mode'
	]}
>
	<section class="grid gap-3">
		<h2 class="text-neutral text-xl font-semibold">Table or DataTable?</h2>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Use <code>Table</code> for static tabular content. Use <code>DataTable</code> when rows need
			stable identity, processing state, virtualization, or interactive columns. DataTable requires
			<code>getRowId</code> and fills a parent with a definite height by default; pass
			<code>height</code> when the scroll viewport needs an explicit size, or
			<code>{'virtualize={false}'}</code> to drop the table into normal document flow.
		</p>
	</section>

	<ComponentCard
		{controls}
		title="Semantic client table"
		description="Native table semantics with global search, typed column filters, multi-sort, pagination, resizing, visibility, ordering, and pinning."
		code={basicDataTableCode}
		class="min-h-0 items-stretch p-3 md:p-5"
	>
		<div class="w-full">
			<DataTableBasicDemo
				density={controls.value.density}
				selectionMode={controls.value.selectionMode}
				search={controls.value.search}
				stickyHeader={controls.value.stickyHeader}
			/>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Selective renderers"
			description="A table-level cell renderer replaces only status cells while renderDefault preserves every other built-in cell. The header renderer wraps configured labels without taking ownership of sorting or column controls."
			code={renderingDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableRenderingDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Externally composed controls"
			description="The narrow bindable API drives search and Pagination outside the table. Processing stays enabled while showControls hides only the built-in footer."
			code={externalControlsDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableExternalControlsDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Selection and async editing"
			description="Click a cell, navigate with arrow keys, then press Enter or F2 to edit; double-click still edits directly. Commits update optimistically while the table indicator tracks the request; clearing a name demonstrates rollback and the rejected state."
			code={editingDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableEditingDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Grouping and column controls"
			description="The initial department grouping exposes disclosure rows, child counts, and configured aggregate values. Header menus control grouping, pinning, visibility, and width."
			code={groupingDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableGroupingDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title={'In-flow table (virtualize={false})'}
			description="Row virtualization off: every row renders in normal document flow at its natural height, so the table needs no explicit height and no definite-height parent. Selection, keyboard navigation, and editing behave exactly as they do while virtualized."
			code={inFlowDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableInFlowDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title="Manual server state"
			description="An abortable request receives filtering, sorting, and pagination state and returns only the processed current page plus rowCount. Grouping and aggregation remain client-only."
			code={manualDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableManualDemo />
			</div>
		</ComponentCard>

		<ComponentCard
			title="ARIA grid with 50,000 rows"
			description="Grid interaction adds roving cell focus and center-column virtualization. Pinned columns remain mounted while the viewport keeps the row DOM bounded."
			code={gridDataTableCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<div class="w-full">
				<DataTableLargeDemo />
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
