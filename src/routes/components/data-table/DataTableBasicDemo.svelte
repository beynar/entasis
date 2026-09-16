<script lang="ts">
	import { Chip } from '$lib/components/Chip/index.js';
	import {
		DataTable,
		type DataTableCellPayload,
		type DataTableColumn
	} from '$lib/components/DataTable/index.js';
	import type { DataTableSelectionMode } from '$lib/components/DataTable/dataTable.props.js';
	import { checkIcon } from '$lib/components/Icons/check.js';
	import type { Density } from '$lib/types/theme.js';
	import {
		createPeople,
		departments,
		formatJoinedAt,
		formatSalary,
		statusColor,
		statuses,
		type Person
	} from './exampleData.js';

	let {
		density = 'normal',
		selectionMode = 'none',
		search = true,
		stickyHeader = true
	}: {
		density?: Density;
		selectionMode?: DataTableSelectionMode;
		search?: boolean;
		stickyHeader?: boolean;
	} = $props();

	const people = createPeople(137);
	const columns: DataTableColumn<Person>[] = [
		{
			id: 'name',
			accessor: 'name',
			header: 'Name',
			sortable: true,
			filter: { type: 'text', placeholder: 'Filter names' },
			width: 210
		},
		{
			id: 'department',
			accessor: 'department',
			header: 'Department',
			sortable: true,
			filter: {
				type: 'select',
				options: departments.map((department) => ({ value: department, label: department }))
			}
		},
		{
			id: 'status',
			accessor: 'status',
			header: 'Status',
			filter: {
				type: 'multi-select',
				options: statuses.map((status) => ({ value: status, label: status }))
			},
			cell: statusCell,
			width: 140
		},
		{
			id: 'salary',
			accessor: 'salary',
			header: 'Salary',
			sortable: true,
			filter: { type: 'number', min: 0 },
			cell: salaryCell,
			align: 'end',
			width: 130
		},
		{
			id: 'joinedAt',
			accessor: 'joinedAt',
			header: 'Joined',
			sortable: true,
			filter: { type: 'date' },
			cell: joinedCell,
			width: 150
		},
		{
			id: 'verified',
			accessor: 'verified',
			header: 'Verified',
			filter: { type: 'boolean', trueLabel: 'Verified', falseLabel: 'Unverified' },
			cell: verifiedCell,
			align: 'center',
			width: 120
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

<div class="h-[440px]">
	<DataTable
		items={people}
		{columns}
		getRowId={(person) => person.id}
		search={search ? { placeholder: 'Search the directory', debounce: 120 } : false}
		{density}
		{selectionMode}
		{stickyHeader}
		pagination={{ pageSize: 25, pageSizes: [25, 50, 100] }}
	/>
</div>
