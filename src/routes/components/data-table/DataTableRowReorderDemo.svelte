<script lang="ts">
	import {
		DataTable,
		type DataTableColumn,
		type DataTableRowMove
	} from '$lib/components/DataTable/index.js';

	type Task = { id: string; title: string; owner: string; estimate: number };

	let tasks = $state<Task[]>([
		{ id: 't1', title: 'Draft the launch brief', owner: 'Ada', estimate: 3 },
		{ id: 't2', title: 'Review pricing page', owner: 'Grace', estimate: 2 },
		{ id: 't3', title: 'Record the product demo', owner: 'Linus', estimate: 5 },
		{ id: 't4', title: 'Send the press kit', owner: 'Radia', estimate: 1 },
		{ id: 't5', title: 'Plan the webinar', owner: 'Ken', estimate: 4 }
	]);
	let lastMove = $state('Drag a row by its grip, or focus a grip and use the arrow keys.');

	const columns: DataTableColumn<Task>[] = [
		{ id: 'title', accessor: 'title', header: 'Task', sortable: true, width: 240 },
		{ id: 'owner', accessor: 'owner', header: 'Owner', width: 120 },
		{ id: 'estimate', accessor: 'estimate', header: 'Days', align: 'end', width: 90 }
	];

	const describe = ({ row, after }: DataTableRowMove<Task>) =>
		after ? `“${row.title}” now follows “${after.title}”.` : `“${row.title}” is now first.`;
</script>

<div class="gap-sm flex flex-col">
	<DataTable
		bind:items={tasks}
		{columns}
		getRowId={(task) => task.id}
		sortableRows
		onRowMove={(move) => (lastMove = describe(move))}
		virtualize={false}
		pagination={false}
	/>
	<p class="text-neutral/70 text-sm" aria-live="polite">{lastMove}</p>
</div>
