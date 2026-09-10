<script lang="ts">
	import {
		createDataTableState,
		DataTable,
		type DataTableColumn,
		type DataTableState
	} from '$lib/components/DataTable/index.js';
	import { createPeople, departments, type Person } from './exampleData.js';

	const source = createPeople(247);
	const columns: DataTableColumn<Person>[] = [
		{ id: 'name', accessor: 'name', header: 'Name', sortable: true, width: 220 },
		{ id: 'email', accessor: 'email', header: 'Email', sortable: true, width: 280 },
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
		{ id: 'status', accessor: 'status', header: 'Status', sortable: true, width: 140 }
	];

	let tableState = $state(createDataTableState(columns, { pagination: { page: 1, pageSize: 25 } }));

	let rows = $state<Person[]>([]);
	let rowCount = $state(0);
	let loading = $state(true);
	let error = $state<unknown>(null);
	const getSortValue = (person: Person, columnId: string) => {
		switch (columnId) {
			case 'name':
				return person.name;
			case 'email':
				return person.email;
			case 'department':
				return person.department;
			case 'status':
				return person.status;
			default:
				return '';
		}
	};

	const runServerQuery = (state: DataTableState) => {
		const search = state.globalFilter.trim().toLocaleLowerCase();
		const department = state.columnFilters.find((filter) => filter.id === 'department')?.value;
		let matches = source.filter((person) => {
			const matchesSearch =
				!search ||
				[person.name, person.email, person.department, person.status].some((value) =>
					value.toLocaleLowerCase().includes(search)
				);
			return matchesSearch && (!department || person.department === department);
		});

		const sorting = state.sorting[0];
		if (sorting) {
			matches = [...matches].sort((left, right) => {
				const leftValue = getSortValue(left, sorting.id);
				const rightValue = getSortValue(right, sorting.id);
				return leftValue.localeCompare(rightValue) * (sorting.desc ? -1 : 1);
			});
		}

		const start = (state.pagination.page - 1) * state.pagination.pageSize;
		return {
			rows: matches.slice(start, start + state.pagination.pageSize),
			rowCount: matches.length
		};
	};
	const requestServerPage = (state: DataTableState, signal: AbortSignal) =>
		new Promise<ReturnType<typeof runServerQuery>>((resolve, reject) => {
			const timer = setTimeout(() => {
				signal.removeEventListener('abort', abort);
				resolve(runServerQuery(state));
			}, 260);
			const abort = () => {
				clearTimeout(timer);
				reject(new DOMException('Request aborted', 'AbortError'));
			};
			if (signal.aborted) {
				abort();
				return;
			}
			signal.addEventListener('abort', abort, { once: true });
		});

	$effect(() => {
		const controller = new AbortController();
		const requestState = $state.snapshot(tableState);
		loading = true;
		error = null;
		void requestServerPage(requestState, controller.signal)
			.then((response) => {
				rows = response.rows;
				rowCount = response.rowCount;
			})
			.catch((reason) => {
				if (reason instanceof DOMException && reason.name === 'AbortError') return;
				error = reason;
			})
			.finally(() => {
				if (!controller.signal.aborted) loading = false;
			});
		return () => controller.abort();
	});
</script>

<DataTable
	items={rows}
	{columns}
	getRowId={(person) => person.id}
	height={410}
	processingMode="manual"
	{rowCount}
	bind:state={tableState}
	search={{ placeholder: 'Server search', debounce: 200 }}
	pagination={{ pageSize: 25, pageSizes: [25, 50, 100] }}
	{loading}
	{error}
	animateRows
/>
