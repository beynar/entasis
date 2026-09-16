<script lang="ts">
	import { Chip } from '$lib/components/Chip/index.js';
	import {
		DataTable,
		type DataTableCellPayload,
		type DataTableColumn
	} from '$lib/components/DataTable/index.js';
	import { createPeople, formatSalary, statusColor, type Person } from './exampleData.js';

	const people = createPeople(8);
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 210 },
		{ id: 'department', accessor: 'department', header: 'Department', sortable: true },
		{ id: 'status', accessor: 'status', header: 'Status', cell: statusCell, width: 140 },
		{
			id: 'salary',
			accessor: 'salary',
			header: 'Salary',
			sortable: true,
			cell: salaryCell,
			align: 'end',
			width: 130
		}
	];
</script>

{#snippet statusCell(payload: DataTableCellPayload<Person>)}
	<Chip size="small" variant="soft" color={statusColor(payload.row.status)}>
		{payload.row.status}
	</Chip>
{/snippet}

{#snippet salaryCell(payload: DataTableCellPayload<Person>)}
	{formatSalary(payload.value)}
{/snippet}

<DataTable
	items={people}
	{columns}
	getRowId={(person) => person.id}
	virtualize={false}
	pagination={false}
	search={false}
/>
