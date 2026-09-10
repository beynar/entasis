<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import DocPage from '../../DocPage.svelte';
	import { useDndList } from '$lib/utils/useDndList.svelte.js';
	import { dotsSixVerticalIcon } from '$lib/components/Icons/dotsSixVertical.js';
	import { createComponentControls } from '../../componentControls.svelte.js';

	type Task = { id: string; title: string };

	const dndAxes = ['vertical', 'horizontal'] as const;
	const controls = createComponentControls([
		{
			name: 'axis',
			type: 'segmented',
			label: 'Axis',
			value: 'vertical',
			options: dndAxes
		},
		{ name: 'handle', type: 'switch', label: 'Handle', value: false }
	]);

	// --- Basic sortable list
	let basicItems = $state<Task[]>([
		{ id: 'b1', title: 'Write the release notes' },
		{ id: 'b2', title: 'Review open pull requests' },
		{ id: 'b3', title: 'Update the roadmap' },
		{ id: 'b4', title: 'Triage new issues' }
	]);
	const basic = useDndList({
		id: 'basic',
		items: () => basicItems,
		axis: () => controls.value.axis,
		handle: () => controls.value.handle,
		onReorder: (next) => (basicItems = next)
	});

	// --- Cross-list: todo <-> doing accept each other, blocked rejects everything
	let todo = $state<Task[]>([
		{ id: 't1', title: 'Design the empty state' },
		{ id: 't2', title: 'Wire up analytics' }
	]);
	let doing = $state<Task[]>([{ id: 'd1', title: 'Refactor the theme tokens' }]);
	let blocked = $state<Task[]>([{ id: 'x1', title: 'Migrate the database' }]);

	const removeById = (items: Task[], id: string) => items.filter((i) => i.id !== id);
	const insertAt = (items: Task[], item: Task, index: number) => [
		...items.slice(0, index),
		item,
		...items.slice(index)
	];

	const todoDnd = useDndList<Task>({
		id: 'todo',
		items: () => todo,
		onReorder: (next) => (todo = next),
		accepts: (source) => source.listId === 'doing',
		onReceive: ({ item, index }) => (todo = insertAt(todo, item as Task, index)),
		onRemove: ({ item }) => (todo = removeById(todo, item.id))
	});
	const doingDnd = useDndList<Task>({
		id: 'doing',
		items: () => doing,
		onReorder: (next) => (doing = next),
		accepts: (source) => source.listId === 'todo',
		onReceive: ({ item, index }) => (doing = insertAt(doing, item as Task, index)),
		onRemove: ({ item }) => (doing = removeById(doing, item.id))
	});
	// Accepts nothing, and its items are welcome nowhere.
	const blockedDnd = useDndList<Task>({
		id: 'blocked',
		items: () => blocked,
		onReorder: (next) => (blocked = next)
	});

	// --- Horizontal list
	let tags = $state<Task[]>([
		{ id: 'h1', title: 'Design' },
		{ id: 'h2', title: 'Engineering' },
		{ id: 'h3', title: 'Marketing' },
		{ id: 'h4', title: 'Support' }
	]);
	const horizontal = useDndList({
		id: 'tags',
		items: () => tags,
		axis: 'horizontal',
		onReorder: (next) => (tags = next)
	});

	// --- Drag handle
	let handled = $state<Task[]>([
		{ id: 'g1', title: 'Only the grip drags' },
		{ id: 'g2', title: 'Rows ignore body grabs' },
		{ id: 'g3', title: 'Late-rendered grips work too' }
	]);
	const handledDnd = useDndList({
		id: 'handled',
		items: () => handled,
		handle: true,
		onReorder: (next) => (handled = next)
	});
</script>

{#snippet row(title: string)}
	<div
		class="bg-surface-raised border-neutral-muted text-neutral flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
	>
		{title}
	</div>
{/snippet}

<DocPage
	title="Dnd list"
	subtitle="Two attachments that make any children of a container draggable, sortable, and droppable across lists — built on Pragmatic drag and drop."
	features={[
		'list + item attachments, nothing else',
		'Cross-list accept/reject by list id',
		'Automatic drop indicator with no-op suppression',
		'Auto-scrolls scroll containers while dragging near their edges',
		'Vertical or horizontal axis, optional drag handle'
	]}
>
	<ComponentCard
		{controls}
		description="A sortable list: attach dnd.list to the container and dnd.item to each row."
		code={`const dnd = useDndList({
	id: 'tasks',
	items: () => items,
	axis: '${controls.value.axis}',
	handle: ${controls.value.handle},
	onReorder: (next) => (items = next)
});

<ul {@attach dnd.list}>
	{#each items as item, index (item.id)}
		<li {@attach dnd.item(item, index)}>{item.title}</li>
	{/each}
</ul>`}
	>
		<div
			class={controls.value.axis === 'horizontal'
				? 'flex w-full max-w-xl flex-wrap gap-1.5'
				: 'flex w-full max-w-md flex-col gap-1.5'}
			{@attach basic.list}
		>
			{#each basicItems as item, index (item.id)}
				<div class={controls.value.handle ? '' : 'cursor-grab'} {@attach basic.item(item, index)}>
					{#if controls.value.handle}
						<div
							class="bg-surface-raised border-neutral-muted text-neutral flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
						>
							<span data-dnd-handle class="text-neutral/60 cursor-grab">
								{@render dotsSixVerticalIcon({ class: 'size-4' })}
							</span>
							{item.title}
						</div>
					{:else}
						{@render row(item.title)}
					{/if}
				</div>
			{/each}
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Cross-list accept and reject"
			description="Todo and Doing accept each other's items via accepts. Blocked accepts nothing — dragging into it shows no indicator and drops are ignored; its own items are rejected elsewhere too."
			code={`const todoDnd = useDndList({
	id: 'todo',
	items: () => todo,
	onReorder: (next) => (todo = next),
	accepts: (source) => source.listId === 'doing',
	onReceive: ({ item, index }) => (todo = insertAt(todo, item, index)),
	onRemove: ({ item }) => (todo = removeById(todo, item.id))
});`}
		>
			<div class="grid w-full gap-4 md:grid-cols-3">
				{#each [{ label: 'Todo', dnd: todoDnd, items: todo }, { label: 'Doing', dnd: doingDnd, items: doing }, { label: 'Blocked', dnd: blockedDnd, items: blocked }] as column (column.label)}
					<div class="flex flex-col gap-2">
						<span class="text-neutral/70 text-sm font-medium">{column.label}</span>
						<div
							class="border-neutral-muted data-[dnd-over=true]:border-primary/50 flex min-h-32 flex-col gap-1.5 rounded-xl border border-dashed p-2 transition-colors"
							{@attach column.dnd.list}
						>
							{#each column.items as item, index (item.id)}
								<div class="cursor-grab" {@attach column.dnd.item(item, index)}>
									{@render row(item.title)}
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Horizontal axis"
			description="axis='horizontal' flips the closest-edge math and the indicator."
		>
			<div class="flex w-full max-w-xl flex-wrap gap-1.5" {@attach horizontal.list}>
				{#each tags as item, index (item.id)}
					<div class="cursor-grab" {@attach horizontal.item(item, index)}>
						{@render row(item.title)}
					</div>
				{/each}
			</div>
		</ComponentCard>

		<ComponentCard
			title="Drag handle"
			description="handle: true restricts dragging to the descendant marked data-dnd-handle."
		>
			<div class="flex w-full max-w-md flex-col gap-1.5" {@attach handledDnd.list}>
				{#each handled as item, index (item.id)}
					<div {@attach handledDnd.item(item, index)}>
						<div
							class="bg-surface-raised border-neutral-muted text-neutral flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
						>
							<span data-dnd-handle class="text-neutral/60 cursor-grab">
								{@render dotsSixVerticalIcon({ class: 'size-4' })}
							</span>
							{item.title}
						</div>
					</div>
				{/each}
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
