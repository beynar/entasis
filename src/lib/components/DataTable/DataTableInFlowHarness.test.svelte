<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type {
		DataTableColumn,
		DataTablePaginationConfig,
		DataTableRowActivation
	} from './dataTable.props.js';

	type Person = { id: string; name: string; role: string };

	let {
		items,
		virtualize = false,
		pagination = false,
		onRowActivate,
		withRowActions = false
	}: {
		items: Person[];
		virtualize?: boolean;
		pagination?: false | DataTablePaginationConfig;
		onRowActivate?: (payload: DataTableRowActivation<Person>) => void;
		withRowActions?: boolean;
	} = $props();

	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name' },
		{ id: 'role', accessor: 'role', header: 'Role' }
	];
</script>

<Theme>
	<DataTable
		{items}
		{columns}
		getRowId={(person) => person.id}
		{virtualize}
		{pagination}
		{onRowActivate}
		rowActions={withRowActions ? rowAction : undefined}
		rowActionsWidth={withRowActions ? 96 : undefined}
		search={false}
	/>
</Theme>

{#snippet rowAction()}
	<button type="button">Open</button>
{/snippet}
