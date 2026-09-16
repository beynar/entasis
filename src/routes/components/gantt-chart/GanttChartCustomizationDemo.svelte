<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import Dialog from '$lib/components/Dialog/Dialog.svelte';
	import { TextInput } from '$lib/components/Form/TextInput/index.js';
	import {
		GanttChart,
		type GanttHeaderPayload,
		type GanttResolvedTaskNode,
		type GanttSnapshot,
		type GanttTask,
		type GanttTaskPayload,
		type GanttTaskTooltipPayload,
		type GanttTreeCellPayload
	} from '$lib/components/GanttChart/index.js';
	import { parisProjectCalendar } from './ganttChartDemoData.js';

	type TaskFields = { owner: string; discipline: 'design' | 'engineering' | 'research' };
	type EmptyFields = Record<never, never>;
	type HeaderPayload = GanttHeaderPayload<TaskFields, EmptyFields, EmptyFields, EmptyFields>;
	type ActionsPayload = GanttSnapshot<TaskFields, EmptyFields, EmptyFields, EmptyFields>;
	type TreeCellPayload = GanttTreeCellPayload<TaskFields, EmptyFields, EmptyFields, EmptyFields>;
	type TaskPayload = GanttTaskPayload<TaskFields, EmptyFields>;
	type TaskTooltipPayload = GanttTaskTooltipPayload<TaskFields, EmptyFields, EmptyFields>;

	let editorOpen = $state(false);
	let editingTaskId = $state<string | null>(null);
	let draftTitle = $state<string | null>('');
	let tasks = $state<GanttTask<TaskFields>[]>([
		{
			id: 'research',
			title: 'Research synthesis',
			start: new Date('2026-08-03T07:00:00.000Z'),
			end: new Date('2026-08-06T15:00:00.000Z'),
			progress: 0.75,
			owner: 'Mina',
			discipline: 'research',
			color: 'purple'
		},
		{
			id: 'interface',
			title: 'Interface design',
			start: new Date('2026-08-07T07:00:00.000Z'),
			end: new Date('2026-08-12T15:00:00.000Z'),
			progress: 0.35,
			owner: 'Ada',
			discipline: 'design',
			color: '#d97706'
		},
		{
			id: 'implementation',
			title: 'Implementation',
			start: new Date('2026-08-13T07:00:00.000Z'),
			end: new Date('2026-08-21T15:00:00.000Z'),
			progress: 0.1,
			owner: 'Lin',
			discipline: 'engineering',
			color: 'blue'
		}
	]);

	function openEditor(node: GanttResolvedTaskNode<TaskFields>): void {
		editingTaskId = node.taskId;
		draftTitle = node.task.title;
		editorOpen = true;
	}

	function saveTask(): void {
		const title = draftTitle?.trim();
		if (!editingTaskId || !title) return;
		tasks = tasks.map((task) => (task.id === editingTaskId ? { ...task, title } : task));
		editorOpen = false;
	}
</script>

{#snippet customHeader(payload: HeaderPayload)}
	<div class="flex w-full flex-wrap items-center justify-between gap-2 px-1">
		<div class="flex items-center gap-1">
			{@render payload.today()}{@render payload.fitProject()}
		</div>
		<p class="text-neutral/70 text-sm font-medium">
			{payload.tasks.length} controlled definitions
		</p>
		<div class="flex items-center gap-1">
			{@render payload.zoomControl()}{@render payload.actions()}
		</div>
	</div>
{/snippet}

{#snippet customActions(payload: ActionsPayload)}
	<Button size="small" variant="outline" onclick={() => payload.api.fitProject()}>Frame plan</Button
	>
{/snippet}

{#snippet customTreeCell(payload: TreeCellPayload)}
	{@render payload.defaultContent()}
	{#if payload.column.id === 'title'}
		<span class="text-neutral/65 ms-auto text-[0.65rem] uppercase">
			{payload.node.task.discipline}
		</span>
	{/if}
{/snippet}

{#snippet customTask(payload: TaskPayload)}
	<span class="truncate px-2 text-[0.7rem] font-semibold">{payload.node.task.owner}</span>
{/snippet}

{#snippet customTaskTooltip(payload: TaskTooltipPayload)}
	{@render payload.defaultContent()}
	<p class="text-neutral/70 mt-1 text-xs">
		Owned by {payload.node.task.owner} · {payload.node.task.discipline}
	</p>
{/snippet}

<GanttChart
	bind:tasks
	calendars={[parisProjectCalendar]}
	timeZone="Europe/Paris"
	schedule={{ calendarId: parisProjectCalendar.id }}
	events={{ onTaskDoubleClick: ({ task }) => openEditor(task) }}
	render={{
		header: customHeader,
		actions: customActions,
		treeCell: customTreeCell,
		task: customTask,
		taskTooltip: customTaskTooltip
	}}
	class="h-[32rem] w-full"
/>

<Dialog
	bind:open={editorOpen}
	title="Edit task"
	description="The application owns this dialog and publishes a fresh task array."
>
	<div class="p-5">
		<TextInput bind:value={draftTitle} label="Task title" required />
	</div>
	{#snippet footer()}
		<Button variant="ghost" color="neutral" onclick={() => (editorOpen = false)}>Cancel</Button>
		<Button onclick={saveTask}>Save task</Button>
	{/snippet}
</Dialog>
