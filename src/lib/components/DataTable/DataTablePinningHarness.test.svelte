<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableColumn, DataTableState } from './dataTable.props.js';

	type Person = { id: string; name: string; role: string; team: string };

	let {
		items,
		columnPinning = { left: ['name'], right: ['team'] }
	}: { items: Person[]; columnPinning?: DataTableState['columnPinning'] } = $props();

	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', width: 120 },
		{ id: 'role', accessor: 'role', header: 'Role', width: 140 },
		{ id: 'team', accessor: 'team', header: 'Team', width: 100 }
	];
</script>

<Theme>
	<DataTable
		{items}
		{columns}
		getRowId={(person) => person.id}
		virtualize={false}
		pagination={false}
		search={false}
		selectionMode="multiple"
		initialState={{ columnPinning }}
	/>
</Theme>
