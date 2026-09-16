<!--
	Timeline tab body — everything visible here is drawn by svelai `GanttChart`.

	The chart owns: the day scale, the today indicator, weekend shading, row geometry, horizontal
	scrolling, bar placement, drag/resize/progress editing, the hover tooltip and the zoom control.
	This file only supplies data and three of the chart's own render slots:
	- `render.header`  — month title, previous/next, the chart's Today + zoom control, Filter.
	- `render.task`    — the bar body: title, "N task left" `Chip`, the percentage and a `Meter`.
	- `render.taskLabel` — emptied, because the title now lives inside the bar.
-->
<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import {
		GanttChart,
		type GanttHeaderPayload,
		type GanttTask,
		type GanttTaskPayload,
		type GanttTasksChange,
		type GanttZoomLevel
	} from 'svelai/gantt-chart';
	import { caretLeftIcon } from 'svelai/icons/caretLeft';
	import { caretRightIcon } from 'svelai/icons/caretRight';
	import { funnelIcon } from 'svelai/icons/funnel';
	import { Meter } from 'svelai/meter';
	import { Stack } from 'svelai/stack';
	import { progressColor, timelineDate, timelineTasks } from './data.js';

	/** `tasksLeft` rides along on the task record so the bar snippet can read it back. */
	type TaskFields = { tasksLeft: number };
	type EmptyFields = Record<never, never>;
	type HeaderPayload = GanttHeaderPayload<TaskFields, EmptyFields, EmptyFields, EmptyFields>;
	type TaskPayload = GanttTaskPayload<TaskFields, EmptyFields>;

	const monthFormat = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
	const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

	/** Rows that are behind: the Filter button narrows the chart to these. */
	const AT_RISK_PROGRESS = 0.4;

	const buildTasks = (): GanttTask<TaskFields>[] =>
		timelineTasks.map((task) => ({
			id: task.id,
			title: task.title,
			start: timelineDate(task.start),
			end: timelineDate(task.end),
			progress: task.progress / 100,
			color: progressColor(task.progress),
			tasksLeft: task.tasksLeft
		}));

	let allTasks = $state<GanttTask<TaskFields>[]>(buildTasks());
	let atRiskOnly = $state(false);
	let zoom = $state<GanttZoomLevel>('day');

	const tasks = $derived(
		atRiskOnly ? allTasks.filter((task) => (task.progress ?? 0) < AT_RISK_PROGRESS) : allTasks
	);

	/**
	 * The chart publishes a fresh array of the tasks it was given; while the Filter is on that is a
	 * subset, so edits are merged back into the full collection by id.
	 */
	function commitTasks(change: GanttTasksChange<TaskFields>): void {
		const edited = new Map(change.tasks.map((task) => [task.id, task]));
		allTasks = allTasks.map((task) => edited.get(task.id) ?? task);
	}

	function shiftMonth(payload: HeaderPayload, direction: number): void {
		const start = payload.api.getVisibleRange().start;
		payload.api.scrollToDate(new Date(start.getFullYear(), start.getMonth() + direction, 1), {
			align: 'start'
		});
	}

	const percentOf = (payload: TaskPayload) => Math.round((payload.node.progress ?? 0) * 100);

	/** The chart reports the scrolled range; its midpoint is the month the user is actually looking at. */
	const monthLabel = (payload: HeaderPayload) =>
		monthFormat.format(
			new Date((payload.visibleRange.start.getTime() + payload.visibleRange.end.getTime()) / 2)
		);
</script>

{#snippet chartHeader(payload: HeaderPayload)}
	<Stack orientation="horizontal" align="center" gap="sm" class="w-full min-w-0">
		<Button
			squared
			size="large"
			variant="ghost"
			color="neutral"
			label="Previous month"
			prefix={caretLeftIcon}
			onclick={() => shiftMonth(payload, -1)}
		/>
		<span class="text-2xl font-medium">{monthLabel(payload)}</span>
		<Button
			squared
			size="large"
			variant="ghost"
			color="neutral"
			label="Next month"
			prefix={caretRightIcon}
			onclick={() => shiftMonth(payload, 1)}
		/>
		<Stack orientation="horizontal" align="center" gap="sm" class="ms-auto min-w-0">
			{@render payload.today()}
			{@render payload.zoomControl()}
			<Button
				size="large"
				variant="outline"
				color="neutral"
				prefix={funnelIcon}
				pressed={atRiskOnly}
				onclick={() => (atRiskOnly = !atRiskOnly)}>Filter</Button
			>
		</Stack>
	</Stack>
{/snippet}

{#snippet taskBar(payload: TaskPayload)}
	{@const percent = percentOf(payload)}
	<Stack
		as="span"
		orientation="horizontal"
		align="center"
		gap="sm"
		paddingInline="sm"
		class="w-full min-w-0"
	>
		<span class="min-w-0 flex-1 truncate text-start text-sm font-medium">
			{payload.node.task.title}
		</span>
		<Chip size="small" variant="outline" color="neutral" class="shrink-0">
			{payload.node.task.tasksLeft} task left
		</Chip>
		<span class="text-neutral/70 shrink-0 text-xs tabular-nums">{percent}%</span>
		<Meter
			size="small"
			class="w-16 shrink-0"
			indicator={noIndicator}
			value={{ value: percent, position: 'bottom', color: progressColor(percent) }}
		/>
	</Stack>
{/snippet}

<!-- `Meter` always paints an indicator label; an empty snippet is the only way to silence it. -->
{#snippet noIndicator()}{/snippet}

<!-- The chart's out-of-bar task label would repeat the title the bar already shows. -->
{#snippet noTaskLabel()}{/snippet}

<GanttChart
	{tasks}
	bind:zoom
	{timeZone}
	size="large"
	density="comfortable"
	class="w-full"
	timeline={{
		scales: ['day', 'week', 'month'],
		todayIndicator: true,
		weekends: true,
		snapDuration: { value: 1, unit: 'day' }
	}}
	layout={{ grid: false, rowHeight: 64, scrollMode: 'page' }}
	mutations={{ task: { onTasksChange: commitTasks } }}
	render={{ header: chartHeader, task: taskBar, taskLabel: noTaskLabel }}
/>
