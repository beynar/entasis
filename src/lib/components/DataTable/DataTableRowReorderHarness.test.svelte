<script lang="ts">
	// A DataTable whose rows reorder, its bound order shown beside it.
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableProps, DataTableRowMove } from './dataTable.props.js';

	type Person = { id: string; name: string };

	let {
		count = 5,
		canDragRow,
		onRowMove,
		initialState,
		pagination = false,
		virtualize = false
	}: {
		count?: number;
		canDragRow?: (row: Person) => boolean;
		onRowMove?: (payload: DataTableRowMove<Person>) => void;
		initialState?: DataTableProps<Person>['initialState'];
		pagination?: DataTableProps<Person>['pagination'];
		virtualize?: boolean;
	} = $props();

	// svelte-ignore state_referenced_locally
	let items = $state<Person[]>(
		Array.from({ length: count }, (_, index) => ({
			id: `p${index + 1}`,
			name: `Person ${index + 1}`
		}))
	);
</script>

<Theme>
	<div style="width: 480px">
		<DataTable
			bind:items
			columns={[{ id: 'name', accessor: 'name', header: 'Name', sortable: true }]}
			getRowId={(row) => row.id}
			sortableRows
			{canDragRow}
			{onRowMove}
			{initialState}
			{pagination}
			{virtualize}
			height={virtualize ? 240 : undefined}
		/>
	</div>
	<output data-testid="order">{items.map((item) => item.id).join(',')}</output>
</Theme>
