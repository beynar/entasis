<script lang="ts" generics="TData">
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import type { DataTableColumnInstance } from './dataTable.table.js';
	import DataTableHeaderCell from './DataTableHeaderCell.svelte';
	import DataTableSelectionCheckbox from './DataTableSelectionCheckbox.svelte';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableColumn } from './dataTable.props.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		columns,
		allColumns,
		gridTemplate,
		model,
		classes,
		density,
		sticky,
		revision
	}: {
		columns: DataTableColumnInstance<TData>[];
		allColumns: DataTableColumnInstance<TData>[];
		gridTemplate: string;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		density: 'compact' | 'normal' | 'comfortable';
		sticky: boolean;
		revision: number;
	} = $props();
	const t = $derived(useI18n());

	const orderedPublicColumns = $derived(
		columns
			.map((column) => model.getColumnConfig(column.id))
			.filter((column): column is DataTableColumn<TData> => !!column)
	);

	const pinRegion = (columnId: string) => {
		if (model.state.columnPinning.left.includes(columnId)) return 'left';
		if (model.state.columnPinning.right.includes(columnId)) return 'right';
		return 'center';
	};

	const pinnedBoundaryFor = (column: DataTableColumnInstance<TData>) => {
		const pinning = model.getColumnPinning(column);
		if (pinning === 'left' && model.startPinnedColumns.at(-1)?.id === column.id) return 'left';
		if (pinning === 'right' && model.endPinnedColumns[0]?.id === column.id) return 'right';
		return 'none';
	};

	const dnd = useDndList<DataTableColumn<TData>>({
		id: 'data-table-columns',
		items: () => orderedPublicColumns,
		itemId: (column) => column.id,
		axis: 'horizontal',
		autoScrollAxis: 'horizontal',
		handle: true,
		disabled: () => !!model.props.disabled,
		canDrag: (column) => column.reorderable !== false,
		onReorder: (next, detail) => {
			const sourceRegion = pinRegion(detail.item.id);
			const before = next[detail.to - 1];
			const after = next[detail.to + 1];
			const staysInRegion = [before, after].some(
				(column) => column && pinRegion(column.id) === sourceRegion
			);
			if (detail.from !== detail.to && !staysInRegion) return;
			model.reorderColumns(next.filter((column) => pinRegion(column.id) === sourceRegion));
		}
	});

	const pageRows = $derived.by(() => {
		void [
			revision,
			model.state.pagination,
			model.state.sorting,
			model.state.columnFilters,
			model.state.globalFilter,
			model.state.grouping,
			model.state.expanded
		];
		return model.table.getRowModel().rows;
	});
	const selectableRows = $derived(pageRows.filter((row) => row.getCanSelect()));
	const allSelected = $derived.by(() => {
		return (
			selectableRows.length > 0 && selectableRows.every((row) => model.state.rowSelection[row.id])
		);
	});
	const someSelected = $derived.by(() => {
		return selectableRows.some((row) => model.state.rowSelection[row.id]) && !allSelected;
	});

	const togglePageSelection = (checked: boolean) => {
		if (model.props.disabled) return;
		for (const row of selectableRows) row.toggleSelected(checked);
	};
</script>

<thead
	class={classes.header()}
	style:position={sticky ? 'sticky' : undefined}
	style:top={sticky ? '0' : undefined}
>
	<tr class={classes.headerRow()} style:grid-template-columns={gridTemplate} {@attach dnd.list}>
		{#each columns as column (column.id)}
			{@const allIndex = allColumns.findIndex((entry) => entry.id === column.id)}
			{@const gridColumn = allIndex + 1 + (model.getColumnPinning(column) === 'right' ? 1 : 0)}
			{#if column.id === '__selection'}
				<th
					role="columnheader"
					aria-colindex={allIndex + 1}
					class={classes.headerCell({
						density,
						align: 'center',
						pinned: true,
						class: [
							classes.selectionCell(),
							classes.pinnedBoundary({ side: pinnedBoundaryFor(column) })
						].join(' ')
					})}
					style:grid-column={gridColumn}
					style:position="sticky"
					style:inset-inline-start={`${model.getColumnPinnedOffset(column)}px`}
				>
					{#if model.props.selectionMode === 'multiple'}
						<DataTableSelectionCheckbox
							label={t.dataTableSelectPage}
							value={allSelected}
							indeterminate={someSelected}
							disabled={model.props.disabled || selectableRows.length === 0}
							onValueChange={togglePageSelection}
							{classes}
						/>
					{:else}
						<span class="sr-only">Selection</span>
					{/if}
				</th>
			{:else}
				{@const config = model.getColumnConfig(column.id)}
				{@const publicIndex = config
					? orderedPublicColumns.findIndex((entry) => entry.id === config.id)
					: -1}
				<DataTableHeaderCell
					{column}
					columnIndex={allIndex}
					{gridColumn}
					{model}
					{classes}
					{density}
					{revision}
					dragAttachment={config && publicIndex >= 0 ? dnd.item(config, publicIndex) : undefined}
				/>
			{/if}
		{/each}
	</tr>
</thead>
