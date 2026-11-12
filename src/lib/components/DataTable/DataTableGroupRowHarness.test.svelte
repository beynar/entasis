<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableCellRenderPayload, DataTableColumn } from './dataTable.props.js';

	type Item = { id: string; status: string; title: string; price: number };

	let {
		items,
		aggregate = false,
		onCell
	}: {
		items: Item[];
		aggregate?: boolean;
		onCell?: (payload: DataTableCellRenderPayload<Item>) => void;
	} = $props();

	const columns = $derived<DataTableColumn<Item>[]>([
		{ id: 'status', accessor: 'status', header: 'Status', width: 90, groupable: true },
		{ id: 'title', accessor: 'title', header: 'Title', width: 160 },
		{
			id: 'price',
			accessor: 'price',
			header: 'Price',
			width: 100,
			...(aggregate ? { aggregation: 'sum' as const } : {})
		}
	]);
</script>

{#snippet record(payload: DataTableCellRenderPayload<Item>)}
	{onCell?.(payload)}
	{@render payload.renderDefault()}
{/snippet}

<Theme>
	<DataTable
		{items}
		{columns}
		getRowId={(item) => item.id}
		virtualize={false}
		pagination={false}
		search={false}
		cell={onCell ? record : undefined}
		initialState={{ grouping: ['status'], expanded: {} }}
	/>
</Theme>
