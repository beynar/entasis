<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		DataTable,
		type DataTableCellCommit,
		type DataTableColumn,
		type DataTableEditorPayload,
		type DataTableRowPayload,
		type DataTableToolbarPayload
	} from '$lib/components/DataTable/index.js';
	import { Select } from '$lib/components/Form/Select/index.js';
	import { trashIcon } from '$lib/components/Icons/trash.js';
	import { createPeople, type Person } from './exampleData.js';

	let people = $state(createPeople(18));
	const roleOptions = ['Analyst', 'Designer', 'Director', 'Engineer', 'Manager'].map((role) => ({
		value: role,
		label: role
	}));

	const columns: DataTableColumn<Person>[] = [
		{
			id: 'name',
			accessor: 'name',
			header: 'Name',
			sortable: true,
			editor: { type: 'text', placeholder: 'Full name' },
			width: 210
		},
		{
			id: 'role',
			accessor: 'role',
			header: 'Role',
			editor: { type: 'select', options: roleOptions }
		},
		{
			id: 'salary',
			accessor: 'salary',
			header: 'Salary',
			align: 'end',
			sortable: true,
			editor: { type: 'number', min: 0, step: 1000 },
			width: 130
		},
		{
			id: 'joinedAt',
			accessor: 'joinedAt',
			header: 'Joined',
			editor: { type: 'date' },
			width: 150
		},
		{
			id: 'verified',
			accessor: 'verified',
			header: 'Verified',
			align: 'center',
			editor: { type: 'switch' },
			width: 120
		}
	];

	const commitCell = async ({ rowId, columnId, value }: DataTableCellCommit<Person>) => {
		await new Promise((resolve) => setTimeout(resolve, 450));
		if (columnId === 'name' && !String(value ?? '').trim()) {
			throw new Error('A name is required');
		}
		people = people.map((person) => {
			if (person.id !== rowId) return person;
			switch (columnId) {
				case 'name':
				case 'role':
					return { ...person, [columnId]: String(value) };
				case 'salary':
					return { ...person, salary: Number(value) };
				case 'joinedAt':
					return { ...person, joinedAt: value instanceof Date ? value : person.joinedAt };
				case 'verified':
					return { ...person, verified: Boolean(value) };
				default:
					return person;
			}
		});
	};

	const removePerson = (rowId: string) => {
		people = people.filter((person) => person.id !== rowId);
	};
</script>

{#snippet bulkActions(payload: DataTableToolbarPayload<Person>)}
	<span class="text-neutral/60 text-sm">{payload.selectedRows.length} selected</span>
	<Button size="small" variant="ghost" color="danger" onclick={payload.clearSelection}>Clear</Button
	>
{/snippet}

{#snippet roleEditor(payload: DataTableEditorPayload<Person>)}
	<Select
		size="normal"
		items={roleOptions}
		value={payload.draft == null ? null : String(payload.draft)}
		disabled={payload.pending}
		onValueChange={payload.setDraft}
	/>
{/snippet}

{#snippet rowActions(payload: DataTableRowPayload<Person>)}
	<Button
		label={`Remove ${payload.row.name}`}
		prefix={trashIcon}
		size="small"
		variant="ghost"
		color="danger"
		onclick={() => removePerson(payload.rowId)}
	/>
{/snippet}

{#snippet expandedContent(payload: DataTableRowPayload<Person>)}
	<div class="grid gap-1 p-3 text-sm sm:grid-cols-2">
		<span><strong>Email:</strong> {payload.row.email}</span>
		<span><strong>Department:</strong> {payload.row.department}</span>
	</div>
{/snippet}

<DataTable
	items={people}
	columns={columns.map((column) =>
		column.id === 'role'
			? { ...column, editor: { type: 'custom', render: roleEditor } as const }
			: column
	)}
	getRowId={(person) => person.id}
	height={420}
	density="large"
	interactionMode="grid"
	selectionMode="multiple"
	pagination={{ pageSize: 10, pageSizes: [10, 18] }}
	{bulkActions}
	{rowActions}
	{expandedContent}
	onCellCommit={commitCell}
/>
