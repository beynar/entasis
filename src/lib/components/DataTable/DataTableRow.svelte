<script lang="ts" generics="TData">
	import type { Column, Row } from '@tanstack/table-core';
	import type { Attachment } from 'svelte/attachments';
	import Slot from '../Slot/Slot.svelte';
	import DataTableCellContent from './DataTableCellContent.svelte';
	import DataTableEditor from './DataTableEditor.svelte';
	import DataTableSelectionCheckbox from './DataTableSelectionCheckbox.svelte';
	import {
		DATA_TABLE_ACTIONS_COLUMN,
		DATA_TABLE_SELECTION_COLUMN,
		type DataTableModel
	} from './dataTable.model.svelte.js';
	import type { DataTableClasses } from './dataTable.theme.js';
	import type { DataTableCellPayload } from './dataTable.props.js';

	let {
		row,
		rowIndex,
		ariaRowIndex,
		columns,
		allColumns,
		gridTemplate,
		model,
		classes,
		density,
		interactionMode,
		revision,
		measureAttachment,
		detailMeasureAttachment,
		onNavigate
	}: {
		row: Row<TData>;
		rowIndex: number;
		ariaRowIndex: number;
		columns: Column<TData, unknown>[];
		allColumns: Column<TData, unknown>[];
		gridTemplate: string;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
		density: 'small' | 'normal' | 'large';
		interactionMode: 'table' | 'grid';
		revision: number;
		measureAttachment: Attachment<HTMLElement>;
		detailMeasureAttachment: Attachment<HTMLElement>;
		onNavigate: (rowIndex: number, columnIndex: number, event: KeyboardEvent) => void;
	} = $props();

	const rowPayload = $derived.by(() => {
		model.state.rowSelection;
		model.state.expanded;
		return model.getRowPayload(row);
	});
	const rowSelected = $derived.by(() => {
		return !!model.state.rowSelection[row.id];
	});
	const rowExpanded = $derived.by(() => {
		return !!model.state.expanded[row.id];
	});
	const cells = $derived(row.getVisibleCells());
	const firstDataColumnId = $derived(
		allColumns.find(
			(column) =>
				column.id !== DATA_TABLE_SELECTION_COLUMN && column.id !== DATA_TABLE_ACTIONS_COLUMN
		)?.id
	);
	const pinnedCellLayouts = $derived.by(() => {
		revision;
		model.state.columnPinning;
		model.state.columnSizing;
		model.state.columnVisibility;
		const leftColumns = model.table.getLeftVisibleLeafColumns();
		const rightColumns = model.table.getRightVisibleLeafColumns();

		return new Map(
			columns.map((column) => {
				const side = column.getIsPinned();
				let boundary: 'left' | 'right' | 'none' = 'none';
				let offset = 0;
				if (side === 'left' && leftColumns.at(-1)?.id === column.id) boundary = 'left';
				if (side === 'right' && rightColumns[0]?.id === column.id) boundary = 'right';
				if (side === 'left') offset = column.getStart('left');
				if (side === 'right') offset = column.getAfter('right');

				return [
					column.id,
					{
						side,
						boundary,
						offset
					}
				] as const;
			})
		);
	});

	const cellPayload = (columnId: string): DataTableCellPayload<TData> | undefined => {
		const cell = cells.find((entry) => entry.column.id === columnId);
		if (!cell) return undefined;
		return {
			...rowPayload,
			columnId,
			value: model.getCellValue(row, columnId),
			aggregated: cell.getIsAggregated(),
			grouped: cell.getIsGrouped(),
			startEditing: () => model.startEditing(row, columnId)
		};
	};

	const handleCellKeydown = (
		event: KeyboardEvent,
		column: Column<TData, unknown>,
		columnIndex: number
	) => {
		if (interactionMode !== 'grid') return;
		if (event.target !== event.currentTarget) {
			if (event.key === 'Escape') {
				event.preventDefault();
				event.stopPropagation();
				(event.currentTarget as HTMLElement).focus();
			}
			return;
		}
		if (
			[
				'Tab',
				'ArrowLeft',
				'ArrowRight',
				'ArrowUp',
				'ArrowDown',
				'Home',
				'End',
				'PageUp',
				'PageDown'
			].includes(event.key)
		) {
			onNavigate(rowIndex, columnIndex, event);
			return;
		}
		if (event.key === ' ' && column.id === DATA_TABLE_SELECTION_COLUMN) {
			event.preventDefault();
			if (!model.props.disabled && row.getCanSelect()) row.toggleSelected();
			return;
		}
		if (event.key !== 'Enter' && event.key !== 'F2') return;
		event.preventDefault();
		if (model.getColumnConfig(column.id)?.editor) {
			model.startEditing(row, column.id);
			return;
		}
		const control = (event.currentTarget as HTMLElement).querySelector<HTMLElement>(
			'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);
		control?.focus();
	};

	const handleCellClick = (event: MouseEvent, rowIndex: number, columnIndex: number) => {
		if (interactionMode !== 'grid') return;
		model.moveFocusedCell(rowIndex, columnIndex);

		const target = event.target;
		const interactive =
			target instanceof Element
				? target.closest('button, input, select, textarea, [tabindex]:not([tabindex="-1"])')
				: null;
		if (interactive && interactive !== event.currentTarget) return;
		(event.currentTarget as HTMLElement).focus();
	};
</script>

<tr
	aria-rowindex={ariaRowIndex}
	aria-level={row.depth ? row.depth + 1 : undefined}
	aria-expanded={row.getCanExpand() ? rowExpanded : undefined}
	aria-selected={row.getCanSelect() ? rowSelected : undefined}
	data-index={rowIndex}
	data-row-id={row.id}
	data-grid-row={rowIndex}
	data-selected={rowSelected}
	class={classes.row({ density, grouped: row.getIsGrouped() })}
	style:grid-template-columns={gridTemplate}
	{@attach measureAttachment}
>
	{#each columns as column (column.id)}
		{@const allIndex = allColumns.findIndex((entry) => entry.id === column.id)}
		{@const cell = cells.find((entry) => entry.column.id === column.id)}
		{@const config = model.getColumnConfig(column.id)}
		{@const payload = cellPayload(column.id)}
		{@const pinnedCell = pinnedCellLayouts.get(column.id)}
		{@const pinning = pinnedCell?.side || false}
		{@const gridColumn = allIndex + 1 + (pinning === 'right' ? 1 : 0)}
		{@const isRovingCell =
			interactionMode === 'grid' &&
			model.focusedCell.row === rowIndex &&
			model.focusedCell.column === allIndex}
		{@const isFocused = isRovingCell && model.hasFocusedCell}
		{@const isEditing = model.editing?.row.id === row.id && model.editing.columnId === column.id}
		<td
			role={interactionMode === 'grid' ? 'gridcell' : undefined}
			aria-colindex={allIndex + 1}
			tabindex={interactionMode === 'grid' ? (isRovingCell ? 0 : -1) : undefined}
			data-grid-column={allIndex}
			data-column-id={column.id}
			data-focused={isFocused || undefined}
			class={classes.cell({
				density,
				align: config?.align ?? (column.id === DATA_TABLE_SELECTION_COLUMN ? 'center' : 'start'),
				pinned: !!pinning,
				focused: isFocused,
				editing: isEditing,
				class: [
					config?.class,
					column.id === DATA_TABLE_SELECTION_COLUMN ? classes.selectionCell() : '',
					column.id === DATA_TABLE_ACTIONS_COLUMN ? classes.actionsCell() : '',
					classes.pinnedBoundary({ side: pinnedCell?.boundary ?? 'none' })
				]
					.filter(Boolean)
					.join(' ')
			})}
			style:grid-column={gridColumn}
			style:position={pinning ? 'sticky' : undefined}
			style:inset-inline-start={pinning === 'left' ? `${pinnedCell?.offset ?? 0}px` : undefined}
			style:inset-inline-end={pinning === 'right' ? `${pinnedCell?.offset ?? 0}px` : undefined}
			onfocusin={() => model.moveFocusedCell(rowIndex, allIndex)}
			onmousedown={(event) => {
				if (event.detail > 1 && config?.editor) event.preventDefault();
			}}
			onclick={(event) => handleCellClick(event, rowIndex, allIndex)}
			onkeydown={(event) => handleCellKeydown(event, column, allIndex)}
			ondblclick={(event) => {
				if (!config?.editor) return;
				event.preventDefault();
				model.startEditing(row, column.id);
			}}
		>
			{#if column.id === DATA_TABLE_SELECTION_COLUMN}
				<DataTableSelectionCheckbox
					ariaLabel={`Select row ${rowIndex + 1}`}
					value={rowSelected}
					disabled={model.props.disabled || !row.getCanSelect()}
					onValueChange={(checked) => row.toggleSelected(checked)}
					{classes}
				/>
			{:else if column.id === DATA_TABLE_ACTIONS_COLUMN}
				<Slot render={model.props.rowActions} payload={rowPayload} />
			{:else if isEditing}
				<DataTableEditor {row} columnId={column.id} {model} {classes} {density} />
			{:else if cell && payload && config}
				<DataTableCellContent
					{row}
					{cell}
					{payload}
					{config}
					{firstDataColumnId}
					{rowExpanded}
					{model}
					{classes}
				/>
			{/if}
		</td>
	{/each}
</tr>

{#if rowExpanded && model.props.expandedContent && !row.getIsGrouped()}
	<tr
		aria-rowindex={ariaRowIndex + 1}
		data-detail-for={rowIndex}
		class={classes.detailRow()}
		style:grid-template-columns={gridTemplate}
		{@attach detailMeasureAttachment}
	>
		<td
			role={interactionMode === 'grid' ? 'gridcell' : undefined}
			aria-colindex={interactionMode === 'grid' ? 1 : undefined}
			aria-colspan={interactionMode === 'grid' ? allColumns.length : undefined}
			colspan={allColumns.length}
			class={classes.detailCell({ density })}
			style:grid-column="1 / -1"
		>
			<Slot render={model.props.expandedContent} payload={rowPayload} />
		</td>
	</tr>
{/if}
