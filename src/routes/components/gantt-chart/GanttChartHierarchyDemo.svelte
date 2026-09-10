<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		GanttChart,
		type GanttChartApi,
		type GanttColumnDefinition,
		type GanttTask
	} from '$lib/components/GanttChart/index.js';
	import { parisProjectCalendar } from './ganttChartDemoData.js';

	type TaskFields = { owner: string; risk: 'low' | 'medium' | 'high' };
	const isRisk = (value: unknown): value is TaskFields['risk'] =>
		value === 'low' || value === 'medium' || value === 'high';

	let showHighRiskOnly = $state(false);
	let expandedTaskIds = $state(['planning', 'delivery']);
	let chart = $state<GanttChartApi<TaskFields> | null>(null);
	let tasks = $state<GanttTask<TaskFields>[]>([
		{ id: 'planning', title: 'Planning', type: 'summary', owner: 'Mina', risk: 'medium' },
		{
			id: 'scope',
			parentId: 'planning',
			title: 'Scope and acceptance criteria',
			start: new Date('2026-07-27T07:00:00.000Z'),
			end: new Date('2026-07-29T15:00:00.000Z'),
			progress: 0.8,
			owner: 'Mina',
			risk: 'low'
		},
		{
			id: 'architecture',
			parentId: 'planning',
			title: 'Architecture review',
			start: new Date('2026-07-30T07:00:00.000Z'),
			end: new Date('2026-08-03T15:00:00.000Z'),
			progress: 0.35,
			owner: 'Noah',
			risk: 'high'
		},
		{ id: 'delivery', title: 'Delivery', type: 'summary', owner: 'Ari', risk: 'high' },
		{
			id: 'frontend',
			parentId: 'delivery',
			title: 'Frontend implementation',
			start: new Date('2026-08-04T07:00:00.000Z'),
			end: new Date('2026-08-12T15:00:00.000Z'),
			progress: 0.2,
			owner: 'Ari',
			risk: 'medium'
		},
		{
			id: 'integration',
			parentId: 'delivery',
			title: 'Integration and release',
			start: new Date('2026-08-13T07:00:00.000Z'),
			end: new Date('2026-08-20T15:00:00.000Z'),
			progress: 0.05,
			owner: 'Sofia',
			risk: 'high'
		}
	]);

	const columns = $derived<GanttColumnDefinition<TaskFields>[]>([
		{ id: 'wbs', width: 64 },
		{ id: 'title', width: 230, editable: true },
		{
			id: 'owner',
			title: 'Owner',
			width: 104,
			sortable: true,
			value: ({ node }) => node.task.owner
		},
		{
			id: 'risk',
			title: 'Risk',
			width: 88,
			sortable: true,
			sortDirection: 'descending',
			editable: true,
			value: ({ node }) => node.task.risk,
			applyEdit: ({ node }, value) => {
				if (!isRisk(value)) throw new Error('Invalid risk value');
				return { ...node.task, risk: value };
			},
			filter: showHighRiskOnly ? ({ node }) => node.task.risk === 'high' : undefined
		},
		{ id: 'progress', width: 92 }
	]);
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/65 text-sm">
			Sort from a column header; press F2 on editable title or risk cells.
		</p>
		<div class="flex flex-wrap gap-2">
			<Button size="small" variant="outline" onclick={() => (showHighRiskOnly = !showHighRiskOnly)}>
				{showHighRiskOnly ? 'Show all tasks' : 'Only high risk'}
			</Button>
			<Button size="small" variant="outline" onclick={() => chart?.expandAll()}>Expand all</Button>
			<Button size="small" variant="outline" onclick={() => chart?.collapseAll()}
				>Collapse all</Button
			>
		</div>
	</div>
	<GanttChart
		bind:this={chart}
		bind:tasks
		bind:expandedTaskIds
		calendars={[parisProjectCalendar]}
		timeZone="Europe/Paris"
		schedule={{ calendarId: parisProjectCalendar.id }}
		layout={{ grid: { columns } }}
		class="h-[32rem] w-full"
	/>
</div>
