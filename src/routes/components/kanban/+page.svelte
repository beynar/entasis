<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import {
		Kanban,
		type KanbanCardMove,
		type KanbanColumnData
	} from '$lib/components/Kanban/index.js';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import { Avatar } from '$lib/components/Avatar/index.js';
	import SegmentedControl from '$lib/components/SegmentedControl/SegmentedControl.svelte';
	import Switch from '$lib/components/Form/Switch/Switch.svelte';
	import type { Density } from '$lib/types/theme.js';

	type Card = { id: string; title: string; description?: string; priority?: 'high' | 'low' };

	const makeBoard = (): KanbanColumnData<Card>[] => [
		{
			id: 'backlog',
			title: 'Backlog',
			color: 'info',
			cards: [
				{ id: 'k1', title: 'Audit color contrast', description: 'WCAG AA across themes' },
				{ id: 'k2', title: 'Write onboarding guide' },
				{ id: 'k3', title: 'Refactor form validation', description: 'Move to schema-first' }
			]
		},
		{
			id: 'progress',
			title: 'In progress',
			color: 'warning',
			cards: [{ id: 'k4', title: 'Rebuild sortable list', description: 'On the new dnd utility' }]
		},
		{
			id: 'review',
			title: 'Review',
			color: 'primary',
			limit: 2,
			cards: [{ id: 'k5', title: 'Density initiative' }]
		},
		{
			id: 'done',
			title: 'Done',
			color: 'success',
			cards: [{ id: 'k6', title: 'Vega card theme' }]
		}
	];
	const controls = createComponentControls([
		{
			name: 'feedback',
			type: 'segmented',
			label: 'Feedback',
			value: 'preview',
			options: [
				{ value: 'preview', label: 'Live preview' },
				{ value: 'indicator', label: 'Indicator line' }
			]
		},
		{
			name: 'density',
			type: 'segmented',
			label: 'Density',
			value: 'normal',
			options: ['compact', 'normal', 'comfortable']
		},
		{ name: 'cardHandle', type: 'switch', label: 'Card handle', value: false },
		{ name: 'disabled', type: 'switch', label: 'Disabled', value: false }
	]);

	let columns = $state(makeBoard());

	// Forward-only board
	let flowColumns = $state<KanbanColumnData<Card>[]>([
		{ id: 'draft', title: 'Draft', cards: [{ id: 'f1', title: 'Q3 announcement post' }] },
		{ id: 'published', title: 'Published', cards: [{ id: 'f2', title: 'Changelog #42' }] }
	]);
	const flowOrder = ['draft', 'published'];

	// Custom card board
	let priorityColumns = $state<KanbanColumnData<Card>[]>([
		{
			id: 'inbox',
			title: 'Inbox',
			cards: [
				{ id: 'p1', title: 'Fix login redirect', priority: 'high' },
				{ id: 'p2', title: 'Polish empty states', priority: 'low' }
			]
		},
		{
			id: 'sprint',
			title: 'Sprint',
			cards: [{ id: 'p3', title: 'Ship dark mode', priority: 'high' }]
		}
	]);

	let lastMove = $state<KanbanCardMove<Card> | null>(null);
	// Density + card handle playground
	const densitySegments = [
		{ value: 'compact', label: 'Compact' },
		{ value: 'normal', label: 'Normal' },
		{ value: 'comfortable', label: 'Comfortable' }
	];
	let boardDensity = $state<Density>('normal');
	let withCardHandle = $state<boolean | null>(false);
	let denseColumns = $state<KanbanColumnData<Card>[]>([
		{
			id: 'todo-d',
			title: 'Todo',
			color: 'info',
			cards: [
				{ id: 'd1', title: 'Refine the roadmap', description: 'Q3 targets' },
				{ id: 'd2', title: 'Fix flaky test' }
			]
		},
		{
			id: 'doing-d',
			title: 'Doing',
			color: 'warning',
			cards: [{ id: 'd3', title: 'Ship the density pass' }]
		}
	]);

	// Column composition: the column snippet arranges the ready-made parts.
	let composedColumns = $state<KanbanColumnData<Card>[]>([
		{
			id: 'ideas',
			title: 'Ideas',
			color: 'info',
			cards: [
				{ id: 'c1', title: 'Command palette' },
				{ id: 'c2', title: 'Offline mode' }
			]
		},
		{
			id: 'next',
			title: 'Next up',
			color: 'warning',
			cards: [{ id: 'c3', title: 'Bulk export' }]
		}
	]);
	let addedCount = $state(0);
	const addCard = (columnId: string) => {
		addedCount += 1;
		composedColumns = composedColumns.map((column) =>
			column.id === columnId
				? {
						...column,
						cards: [...column.cards, { id: `new-${addedCount}`, title: `New idea #${addedCount}` }]
					}
				: column
		);
	};

	// Scrollable columns: many members per team, fixed column height.
	const team = (prefix: string, members: Array<[string, string]>): Card[] =>
		members.map(([name, role], index) => ({
			id: `${prefix}${index}`,
			title: name,
			description: role
		}));

	let teamColumns = $state<KanbanColumnData<Card>[]>([
		{
			id: 'platform',
			title: 'Platform',
			color: 'info',
			cards: team('pl', [
				['Alvin', 'Principal Engineer'],
				['Lara', 'Design Manager'],
				['Angie', 'Engineering Manager'],
				['Arjun', 'Designer'],
				['Blair', 'Senior Designer'],
				['Claudia', 'Lead Designer'],
				['Dmitri', 'Engineer'],
				['Effie', 'Senior Engineer'],
				['Fabio', 'Content Designer'],
				['Greta', 'Program Manager'],
				['Hugo', 'Engineer'],
				['Ines', 'Designer']
			])
		},
		{
			id: 'apps',
			title: 'Apps',
			color: 'warning',
			cards: team('ap', [
				['Hasan', 'Engineering Manager'],
				['Helena', 'Designer'],
				['Ivan', 'Senior Designer'],
				['Katina', 'Lead Designer'],
				['Aliza', 'Senior Engineer'],
				['Leo', 'Content Designer'],
				['Mara', 'Principal Engineer'],
				['Nils', 'Engineer'],
				['Opal', 'Program Manager'],
				['Pavel', 'Senior Engineer'],
				['Quinn', 'Designer']
			])
		},
		{
			id: 'mobile',
			title: 'Mobile',
			color: 'success',
			cards: team('mo', [
				['Maribel', 'Program Manager'],
				['Milo', 'Engineer'],
				['Myra', 'Senior Engineer'],
				['Narul', 'Principal Engineer'],
				['Norah', 'Engineering Manager'],
				['Oliver', 'Designer'],
				['Petra', 'Lead Designer'],
				['Ravi', 'Senior Designer'],
				['Sana', 'Engineer'],
				['Tomas', 'Content Designer'],
				['Uma', 'Senior Engineer'],
				['Viggo', 'Designer']
			])
		}
	]);
</script>

<DocPage
	title="Kanban"
	subtitle="A column board with drag-and-drop cards and sortable columns, built on the useDndList attachment utility."
	component="Kanban"
	features={[
		'Live placeholder preview or insertion-line feedback',
		'Cards reorder and move across columns',
		'Columns reorder by dragging their header',
		'Fixed-height columns scroll and auto-scroll during drags',
		'Per-column color, limit, and accept policy',
		'Card, header, and empty snippets'
	]}
>
	<ComponentCard
		{controls}
		title="Live preview or indicator"
		description="Switch between animated card displacement and a stable board with insertion lines. The same mode applies to card and column reordering."
		code={`<Kanban
	bind:columns
	indicator={${controls.value.feedback === 'indicator'}}
	density="${controls.value.density}"
	cardHandle={${controls.value.cardHandle}}
	disabled={${controls.value.disabled}}
/>`}
	>
		<div class="flex w-full flex-col gap-5">
			<Kanban
				bind:columns
				indicator={controls.value.feedback === 'indicator'}
				density={controls.value.density}
				cardHandle={controls.value.cardHandle}
				disabled={controls.value.disabled}
				onCardMove={(move) => (lastMove = move)}
			/>
			<p class="text-neutral/70 mt-3 text-xs">
				{#if lastMove}
					Last move: "{lastMove.card.title}" — {lastMove.from.columnId} #{lastMove.from.index} → {lastMove
						.to.columnId} #{lastMove.to.index}
				{:else}
					Drag a card to see onCardMove.
				{/if}
			</p>
		</div>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Scrollable columns"
			description="columnHeight fixes the column height; long card lists scroll inside it and auto-scroll while you drag near their top or bottom edge, so a card can be dropped anywhere in the column."
			code="<Kanban bind:columns columnHeight=&quot;26rem&quot; />"
		>
			<div class="w-full">
				<Kanban bind:columns={teamColumns} columnHeight="26rem" sortableColumns={false}>
					{#snippet card({ card })}
						<div
							class="bg-surface-floating ring-neutral/10 flex cursor-grab items-center gap-3 rounded-lg px-3 py-2 shadow-xs ring-1 select-none"
						>
							<Avatar size="small" name={card.title} />
							<div class="min-w-0">
								<div class="text-neutral truncate text-sm font-medium">{card.title}</div>
								<div class="text-neutral/70 truncate text-xs">{card.description}</div>
							</div>
						</div>
					{/snippet}
				</Kanban>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Move policy"
			description="accepts decides which cross-column moves are allowed — here cards only move forward (Draft → Published), never back."
			code={`<Kanban
	bind:columns
	accepts={({ from, to }) => order.indexOf(to.id) > order.indexOf(from.id)}
/>`}
		>
			<div class="w-full">
				<Kanban
					bind:columns={flowColumns}
					sortableColumns={false}
					accepts={({ from, to }) => flowOrder.indexOf(to.id) > flowOrder.indexOf(from.id)}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Density and card handle"
			description="density scales header, list and card spacing; cardHandle restricts card dragging to a grip — handy when cards contain interactive content."
			code="<Kanban bind:columns density=&quot;compact&quot; cardHandle />"
		>
			<div class="flex w-full flex-col items-center gap-5">
				<div class="flex items-center gap-6">
					<SegmentedControl
						items={densitySegments}
						bind:value={boardDensity}
						size="small"
						label="Board density"
					/>
					<Switch bind:value={withCardHandle} label="Card handle" size="small" />
				</div>
				<Kanban
					bind:columns={denseColumns}
					density={boardDensity}
					cardHandle={withCardHandle ?? false}
					sortableColumns={false}
				/>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Column composition"
			description="The column snippet receives the ready-made header, items (the dnd-wired card list) and footer snippets — arrange them freely and add your own chrome without recoding the drag machinery."
			code={`<Kanban bind:columns>
	{#snippet column({ column, header, items })}
		{@render header()}
		{@render items()}
		<div class="p-2 pt-1">
			<button onclick={() => addCard(column.id)}>+ Add card</button>
		</div>
	{/snippet}
</Kanban>`}
		>
			<div class="w-full">
				<Kanban bind:columns={composedColumns} sortableColumns={false}>
					{#snippet column({ column, header, items })}
						{@render header()}
						{@render items()}
						<div class="p-2 pt-1">
							<button
								type="button"
								class="state-layer text-neutral/70 hover:text-neutral w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition-colors"
								onclick={() => addCard(column.id)}
							>
								+ Add card
							</button>
						</div>
					{/snippet}
				</Kanban>
			</div>
		</ComponentCard>

		<ComponentCard
			title="Custom card"
			description="The card snippet replaces the default renderer — bring your own fields."
			code={`<Kanban bind:columns>
	{#snippet card({ card })}
		...
	{/snippet}
</Kanban>`}
		>
			<div class="w-full">
				<Kanban bind:columns={priorityColumns} sortableColumns={false}>
					{#snippet card({ card })}
						<div
							class="bg-surface-floating ring-neutral/10 flex items-center justify-between gap-2 rounded-lg px-3 py-2 ring-1"
						>
							<span class="text-neutral truncate text-sm font-medium">{card.title}</span>
							<Chip size="small" color={card.priority === 'high' ? 'danger' : 'info'}>
								{card.priority}
							</Chip>
						</div>
					{/snippet}
				</Kanban>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
