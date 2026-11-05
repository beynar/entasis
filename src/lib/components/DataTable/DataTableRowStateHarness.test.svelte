<script lang="ts">
	// Test-only: rows whose state the app keeps, and the table's api handed out.
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableApi, DataTableColumn, DataTableProps } from './dataTable.props.js';

	type Person = { id: string; name: string };

	let {
		items,
		onCellCommit,
		getRowAttrs,
		getCellAttrs,
		theme,
		onApi
	}: {
		items: Person[];
		onCellCommit?: DataTableProps<Person>['onCellCommit'];
		getRowAttrs?: DataTableProps<Person>['getRowAttrs'];
		getCellAttrs?: DataTableProps<Person>['getCellAttrs'];
		theme?: DataTableProps<Person>['theme'];
		onApi?: (api: DataTableApi<Person>) => void;
	} = $props();

	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', editor: { type: 'text' } }
	];

	let api = $state<DataTableApi<Person>>();
	$effect(() => {
		if (api) onApi?.(api);
	});
</script>

{#snippet rowActions()}<button type="button">Act</button>{/snippet}

<Theme>
	<DataTable
		bind:api
		{items}
		{columns}
		getRowId={(person) => person.id}
		virtualize={false}
		pagination={false}
		selectionMode="multiple"
		{rowActions}
		{onCellCommit}
		{getRowAttrs}
		{getCellAttrs}
		{theme}
	/>
</Theme>
