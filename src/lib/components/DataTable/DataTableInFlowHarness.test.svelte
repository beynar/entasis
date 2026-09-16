<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableColumn } from './dataTable.props.js';

	type Person = { id: string; name: string; role: string };

	let { items, virtualize = false }: { items: Person[]; virtualize?: boolean } = $props();

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
		pagination={false}
		search={false}
	/>
</Theme>
