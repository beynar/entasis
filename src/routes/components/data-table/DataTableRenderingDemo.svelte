<script lang="ts">
	import { Chip } from '$lib/components/Chip/index.js';
	import {
		createDataTableColumnHelper,
		DataTable,
		type DataTableCellRenderPayload,
		type DataTableFilterPayload,
		type DataTableHeaderRenderPayload
	} from '$lib/components/DataTable/index.js';
	import { Select } from '$lib/components/Form/Select/index.js';
	import { createPeople, statuses, type Person, type PersonStatus } from './exampleData.js';

	const people = createPeople(48);
	const column = createDataTableColumnHelper<Person>();
	const columns = [
		column.accessor('name', {
			id: 'name',
			header: 'Name',
			sortable: true,
			width: 210
		}),
		column.accessor('department', {
			id: 'department',
			header: 'Department',
			sortable: true
		}),
		column.accessor('status', {
			id: 'status',
			header: 'Status',
			width: 140
		}),
		column.accessor('salary', {
			id: 'salary',
			header: 'Salary',
			align: 'end',
			sortable: true
		})
	];

	const statusColor = (status: PersonStatus) => {
		if (status === 'Active') return 'success';
		if (status === 'Suspended') return 'danger';
		return 'info';
	};
</script>

{#snippet statusFilter(payload: DataTableFilterPayload<Person>)}
	<Select
		size="small"
		placeholder="Every status"
		items={statuses.map((status) => ({ value: status, label: status }))}
		value={typeof payload.value === 'string' ? payload.value : null}
		onValueChange={(value) => payload.setValue(value || undefined)}
	/>
{/snippet}

{#snippet cell(payload: DataTableCellRenderPayload<Person>)}
	{#if payload.columnId === 'status'}
		<Chip size="small" variant="soft" color={statusColor(payload.value as PersonStatus)}>
			{String(payload.value)}
		</Chip>
	{:else}
		{@render payload.renderDefault()}
	{/if}
{/snippet}

{#snippet header(payload: DataTableHeaderRenderPayload<Person>)}
	<div class="flex min-w-0 items-center gap-1.5">
		{@render payload.renderDefault()}
		{#if payload.filtered}
			<span class="size-1.5 shrink-0 rounded-full bg-primary" aria-label="Filter active"></span>
		{/if}
	</div>
{/snippet}

<DataTable
	items={people}
	columns={columns.map((definition) =>
		definition.id === 'status'
			? {
					...definition,
					filter: {
						type: 'custom',
						render: statusFilter,
						predicate: (person: Person, value: unknown) => !value || person.status === value
					}
				}
			: definition
	)}
	getRowId={(person) => person.id}
	height={360}
	pagination={{ pageSize: 10, pageSizes: [10, 25] }}
	{cell}
	{header}
/>
