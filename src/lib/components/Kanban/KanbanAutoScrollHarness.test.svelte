<script lang="ts">
	// A board wider than its 420px host, standalone or inside a Tabs panel, for the auto-scroll
	// browser test.
	import { Tabs } from '../Tabs/index.js';
	import Kanban from './Kanban.svelte';
	import type { KanbanColumnData } from './kanban.props.js';

	let { inTabs = false }: { inTabs?: boolean } = $props();

	type Card = { id: string; title: string };
	let columns = $state<KanbanColumnData<Card>[]>(
		Array.from({ length: 5 }, (_, column) => ({
			id: `column-${column}`,
			title: `Column ${column}`,
			cards: Array.from({ length: 2 }, (_, card) => ({
				id: `card-${column}-${card}`,
				title: `Card ${column}.${card}`
			}))
		}))
	);
	const tabs = [
		{ value: 'board', label: 'Board' },
		{ value: 'notes', label: 'Notes' }
	];
</script>

<div style="width: 420px">
	{#if inTabs}
		<Tabs items={tabs} class="w-full">
			{#snippet children({ item })}
				{#if item.value === 'board'}
					<Kanban bind:columns />
				{:else}
					<p>Notes</p>
				{/if}
			{/snippet}
		</Tabs>
	{:else}
		<Kanban bind:columns />
	{/if}
</div>
