<script lang="ts">
	import { DataTable, type DataTableColumn } from '$lib/components/DataTable/index.js';
	import { createPeople, type Person } from './exampleData.js';

	const people = createPeople(50_000);
	const locations = ['Berlin', 'London', 'New York', 'Paris', 'Singapore', 'Toronto'] as const;
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 210 },
		{ id: 'email', accessor: 'email', header: 'Email', width: 290 },
		{ id: 'department', accessor: 'department', header: 'Department', sortable: true },
		{ id: 'role', accessor: 'role', header: 'Role', sortable: true },
		{ id: 'salary', accessor: 'salary', header: 'Salary', align: 'end', sortable: true },
		{ id: 'joinedAt', accessor: 'joinedAt', header: 'Joined', sortable: true },
		{
			id: 'location',
			accessor: (_person, index) => locations[index % locations.length],
			header: 'Location',
			sortable: true
		},
		{
			id: 'projects',
			accessor: (_person, index) => (index * 7) % 12,
			header: 'Projects',
			align: 'end',
			sortable: true,
			width: 130
		},
		{
			id: 'utilization',
			accessor: (_person, index) => `${55 + ((index * 13) % 46)}%`,
			header: 'Utilization',
			align: 'end',
			width: 140
		},
		{ id: 'verified', accessor: 'verified', header: 'Verified', align: 'center', width: 120 },
		{ id: 'status', accessor: 'status', header: 'Status', sortable: true, width: 140 }
	];
</script>

<DataTable
	items={people}
	{columns}
	getRowId={(person) => person.id}
	height={520}
	interactionMode="grid"
	density="small"
	pagination={false}
	overscan={8}
	initialState={{
		columnPinning: { left: ['name'], right: ['status'] },
		columnOrder: columns.map((column) => column.id)
	}}
/>
