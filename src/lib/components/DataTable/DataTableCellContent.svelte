<script lang="ts" generics="TData">
	import Button from '../Button/Button.svelte';
	import { caretDownIcon } from '../Icons/caretDown.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import Slot from '../Slot/Slot.svelte';
	import type { DataTableModel } from './dataTable.model.svelte.js';
	import type { DataTableCellInstance, DataTableRowInstance } from './dataTable.table.js';
	import type { DataTableCellPayload, DataTableColumn } from './dataTable.props.js';
	import type { DataTableClasses } from './dataTable.theme.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		row,
		cell,
		payload,
		config,
		firstDataColumnId,
		rowExpanded,
		model,
		classes
	}: {
		row: DataTableRowInstance<TData>;
		cell: DataTableCellInstance<TData>;
		payload: DataTableCellPayload<TData>;
		config: DataTableColumn<TData>;
		firstDataColumnId: string | undefined;
		rowExpanded: boolean;
		model: DataTableModel<TData>;
		classes: DataTableClasses;
	} = $props();
	const t = $derived(useI18n());

	const formatValue = (value: unknown) => {
		if (value === null || value === undefined) return '';
		if (value instanceof Date) return value.toLocaleDateString();
		if (typeof value === 'object') return JSON.stringify(value);
		return String(value);
	};
</script>

{#snippet renderDefault()}
	{#if cell.getIsGrouped()}
		<Button
			label={rowExpanded ? t.dataTableCollapseGroup : t.dataTableExpandGroup}
			prefix={rowExpanded ? caretDownIcon : caretRightIcon}
			variant="ghost"
			color="neutral"
			size="small"
			class={classes.expander()}
			disabled={model.props.disabled}
			onclick={() => row.toggleExpanded()}
		/>
		<span class={classes.groupValue()}>{formatValue(cell.getValue())}</span>
		<span class={classes.groupCount()}>({row.subRows.length})</span>
	{:else if model.isCellAggregated(cell)}
		{#if config.aggregatedCell}
			<Slot render={config.aggregatedCell} {payload} class={classes.cellContent()} as="span" />
		{:else}
			<span class={classes.cellContent()}>{formatValue(cell.getValue())}</span>
		{/if}
	{:else if cell.getIsPlaceholder()}
		<span aria-hidden="true"></span>
	{:else}
		{#if cell.column.id === firstDataColumnId && row.getCanExpand() && !row.getIsGrouped()}
			<div aria-hidden="true" style:width={`${row.depth * 12}px`}></div>
			<Button
				label={rowExpanded ? t.dataTableCollapseRow : t.dataTableExpandRow}
				prefix={rowExpanded ? caretDownIcon : caretRightIcon}
				variant="ghost"
				color="neutral"
				size="small"
				class={classes.expander()}
				disabled={model.props.disabled}
				onclick={() => row.toggleExpanded()}
			/>
		{/if}
		{#if config.cell}
			<Slot render={config.cell} {payload} class={classes.cellContent()} as="span" />
		{:else}
			<span class={classes.cellContent()}>{formatValue(payload.value)}</span>
		{/if}
	{/if}
{/snippet}

{#if model.props.cell}
	{@render model.props.cell({
		...payload,
		column: config,
		placeholder: cell.getIsPlaceholder(),
		renderDefault
	})}
{:else}
	{@render renderDefault()}
{/if}
