<script lang="ts">
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableColumn } from './dataTable.props.js';

	type Person = { id: string; name: string; status: string; team: string; remote: boolean };

	let { items }: { items: Person[] } = $props();

	const columns: DataTableColumn<Person>[] = [
		{
			id: 'name',
			accessor: 'name',
			header: 'Name',
			sortable: true,
			filter: { type: 'text', placeholder: 'Filter names' }
		},
		{
			id: 'status',
			accessor: 'status',
			header: 'Status',
			filter: {
				type: 'multi-select',
				options: [
					{ value: 'active', label: 'Active' },
					{ value: 'invited', label: 'Invited' }
				]
			}
		},
		{
			id: 'team',
			accessor: 'team',
			header: 'Team',
			groupable: true,
			filter: {
				type: 'select',
				options: [
					{ value: 'core', label: 'Core' },
					{ value: 'docs', label: 'Docs' }
				]
			}
		},
		{
			id: 'remote',
			accessor: 'remote',
			header: 'Remote',
			filter: { type: 'boolean', trueLabel: 'Remote', falseLabel: 'On site' }
		}
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
		showColumnVisibilityControl
	/>
</Theme>
