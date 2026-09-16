<script lang="ts">
	import {
		createDataTableState,
		DataTable,
		type DataTableApi,
		type DataTableColumn
	} from '$lib/components/DataTable/index.js';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import { Pagination } from '$lib/components/Pagination/index.js';
	import { createPeople, type Person } from './exampleData.js';

	const people = createPeople(137);
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 220 },
		{ id: 'email', accessor: 'email', header: 'Email', width: 280 },
		{ id: 'department', accessor: 'department', header: 'Department', sortable: true },
		{ id: 'status', accessor: 'status', header: 'Status', width: 140 }
	];
	let tableState = $state(createDataTableState(columns, { pagination: { page: 1, pageSize: 10 } }));
	let dataTable = $state<DataTableApi<Person>>();
</script>

<div class="grid gap-3">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<TextInput
			class="w-full sm:w-72"
			size="small"
			placeholder="Search outside the table"
			value={dataTable?.state.globalFilter ?? ''}
			onValueChange={(value) => dataTable?.setGlobalFilter(value ?? '')}
		/>
		{#if dataTable}
			<Pagination
				totalPages={dataTable.totalPages}
				value={dataTable.state.pagination.page}
				variant="pages"
				controlVariant="ghost"
				size="small"
				onValueChange={dataTable.setPage}
			/>
		{/if}
	</div>

	<div class="h-[360px]">
		<DataTable
			items={people}
			{columns}
			getRowId={(person) => person.id}
			bind:state={tableState}
			bind:api={dataTable}
			pagination={{ pageSize: 10, pageSizes: [10, 25], showControls: false }}
		/>
	</div>
</div>
