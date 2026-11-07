<script lang="ts">
	// Test-only: a custom editor holding a TimeInput, whose Enter is the app's own.
	import TimeInput from '../Form/TimeInput/TimeInput.svelte';
	import Theme from '../Theme/Theme.svelte';
	import DataTable from './DataTable.svelte';
	import type { DataTableApi, DataTableColumn, DataTableEditorPayload } from './dataTable.props.js';

	type Row = { id: string; at: number | null };

	let {
		onCellCommit = () => {},
		commitOnBlur = false
	}: { onCellCommit?: (commit: unknown) => void; commitOnBlur?: boolean } = $props();

	let api = $state<DataTableApi<Row>>();
	const columns: DataTableColumn<Row>[] = [
		{ id: 'name', accessor: 'id', header: 'Name' },
		{ id: 'at', accessor: 'at', header: 'At', editor: { type: 'custom', render: timeEditor } }
	];
</script>

{#snippet timeEditor(payload: DataTableEditorPayload<Row>)}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onkeydown={(event) => {
			if (event.key === 'Enter') void payload.commit();
			if (event.key === 'q') payload.cancel();
		}}
		onfocusout={() => {
			if (commitOnBlur) void payload.commit();
		}}
	>
		<TimeInput
			label="Time"
			value={payload.draft as number | null}
			onValueChange={(value) => payload.setDraft(value)}
		/>
	</div>
{/snippet}

<Theme>
	<button type="button" data-testid="outside">Outside</button>
	<output data-testid="editing">{api?.isEditing ? 'yes' : 'no'}</output>
	<DataTable
		bind:api
		items={[{ id: 'a', at: 39600000 }]}
		{columns}
		getRowId={(row) => row.id}
		virtualize={false}
		pagination={false}
		interactionMode="grid"
		{onCellCommit}
	/>
</Theme>
