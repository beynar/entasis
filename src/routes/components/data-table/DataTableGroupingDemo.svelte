<script lang="ts">
	import { DataTable, type DataTableColumn } from '$lib/components/DataTable/index.js';
	import { createPeople, type Person } from './exampleData.js';

	const people = createPeople(90);
	const columns: DataTableColumn<Person>[] = [
		{
			id: 'department',
			accessor: 'department',
			header: 'Department',
			groupable: true,
			sortable: true,
			width: 190
		},
		{
			id: 'role',
			accessor: 'role',
			header: 'Role',
			groupable: true,
			sortable: true,
			aggregation: 'uniqueCount'
		},
		{
			id: 'headcount',
			accessor: () => 1,
			header: 'Headcount',
			aggregation: 'sum',
			align: 'end',
			width: 130
		},
		{
			id: 'salary',
			accessor: 'salary',
			header: 'Average salary',
			aggregation: 'mean',
			sortable: true,
			align: 'end',
			width: 170
		},
		{
			id: 'status',
			accessor: 'status',
			header: 'Statuses',
			aggregation: 'uniqueCount',
			width: 140
		}
	];
</script>

<DataTable
	items={people}
	{columns}
	getRowId={(person) => person.id}
	height={430}
	pagination={false}
	showColumnVisibilityControl
	initialState={{ grouping: ['department'], expanded: {} }}
/>
