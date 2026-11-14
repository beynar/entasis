<script lang="ts">
	// Test-only: a grid-mode table of three columns and four rows, in the writing direction given.
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableColumn } from './dataTable.props.js';

	type Person = { id: string; name: string; role: string; city: string };

	let { dir = 'ltr' }: { dir?: 'ltr' | 'rtl' } = $props();

	const items: Person[] = [
		{ id: 'a', name: 'Ada', role: 'Engineer', city: 'London' },
		{ id: 'b', name: 'Bob', role: 'Designer', city: 'Paris' },
		{ id: 'c', name: 'Cy', role: 'Writer', city: 'Cairo' },
		{ id: 'd', name: 'Di', role: 'Manager', city: 'Rome' }
	];
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name' },
		{ id: 'role', accessor: 'role', header: 'Role' },
		{ id: 'city', accessor: 'city', header: 'City' }
	];
</script>

<Theme>
	<div {dir}>
		<DataTable
			{items}
			{columns}
			getRowId={(person) => person.id}
			virtualize={false}
			pagination={false}
			interactionMode="grid"
		/>
	</div>
</Theme>
