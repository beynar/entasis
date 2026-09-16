<script lang="ts">
	import { Chip } from '$lib/components/Chip/index.js';
	import {
		DataTable,
		type DataTableCellPayload,
		type DataTableColumn
	} from '$lib/components/DataTable/index.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import {
		createPeople,
		formatJoinedAt,
		formatSalary,
		statusColor,
		type Person
	} from './exampleData.js';

	const people = createPeople(50_000);
	const locations = ['Berlin', 'London', 'New York', 'Paris', 'Singapore', 'Toronto'] as const;
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 210 },
		{ id: 'email', accessor: 'email', header: 'Email', width: 290 },
		{ id: 'department', accessor: 'department', header: 'Department', sortable: true },
		{ id: 'role', accessor: 'role', header: 'Role', sortable: true },
		{
			id: 'salary',
			accessor: 'salary',
			header: 'Salary',
			align: 'end',
			sortable: true,
			cell: salaryCell
		},
		{ id: 'joinedAt', accessor: 'joinedAt', header: 'Joined', sortable: true, cell: joinedCell },
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
		{
			id: 'verified',
			accessor: 'verified',
			header: 'Verified',
			align: 'center',
			width: 120,
			cell: verifiedCell
		},
		{
			id: 'status',
			accessor: 'status',
			header: 'Status',
			sortable: true,
			width: 140,
			cell: statusCell
		}
	];
</script>

{#snippet salaryCell(payload: DataTableCellPayload<Person>)}
	{formatSalary(payload.value)}
{/snippet}

{#snippet joinedCell(payload: DataTableCellPayload<Person>)}
	{formatJoinedAt(payload.value)}
{/snippet}

{#snippet verifiedCell(payload: DataTableCellPayload<Person>)}
	{#if payload.value}
		<span class="text-success inline-flex" role="img" aria-label="Verified">
			{@render checkIcon()}
		</span>
	{:else}
		<span class="text-neutral/65" role="img" aria-label="Unverified">—</span>
	{/if}
{/snippet}

{#snippet statusCell(payload: DataTableCellPayload<Person>)}
	<Chip size="small" variant="soft" color={statusColor(payload.row.status)}>
		{payload.row.status}
	</Chip>
{/snippet}

<DataTable
	items={people}
	{columns}
	getRowId={(person) => person.id}
	height={520}
	interactionMode="grid"
	density="compact"
	pagination={false}
	overscan={8}
	initialState={{
		columnPinning: { left: ['name'], right: ['status'] },
		columnOrder: columns.map((column) => column.id)
	}}
/>
