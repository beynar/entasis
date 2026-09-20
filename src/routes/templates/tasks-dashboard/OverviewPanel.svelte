<script lang="ts">
	// Overview tab of the Tasks dashboard template.
	//
	// This panel is a stress test of the library, not a screenshot copy: every region is built
	// from a entasis component and its public props. Where a component cannot reach what the
	// reference shows, the closest thing it CAN do is used and the gap is reported as a finding
	// instead of being faked with CSS.
	import { AvatarGroup } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chart, type ChartProps } from 'entasis/chart';
	import {
		GanttChart,
		type GanttAssignment,
		type GanttResource,
		type GanttResourceAssignmentsPayload,
		type GanttTask,
		type GanttTaskPayload
	} from 'entasis/gantt-chart';
	import { Grid, GridSpan } from 'entasis/grid';
	import { SegmentedControl } from 'entasis/segmented-control';
	import { Stack } from 'entasis/stack';
	import { Stat } from 'entasis/stat';
	import { checkSquareIcon } from 'entasis/icons/checkSquare';
	import { dotsThreeVerticalIcon } from 'entasis/icons/dotsThreeVertical';
	import { hourglassIcon } from 'entasis/icons/hourglass';
	import { lightningIcon } from 'entasis/icons/lightning';
	import { listBulletsIcon } from 'entasis/icons/listBullets';
	import { listChecksIcon } from 'entasis/icons/listChecks';
	import { plusIcon } from 'entasis/icons/plus';
	import { spinnerGapIcon } from 'entasis/icons/spinnerGap';
	import {
		monthlyStatus,
		myTasks,
		overviewStats,
		weeklyProgress,
		type MonthlyStatus,
		type OverviewStat
	} from './data.js';

	/* --------------------------------------------------------------- overview stats */

	const statIcons = {
		lightning: lightningIcon,
		check: checkSquareIcon,
		progress: spinnerGapIcon,
		warning: hourglassIcon
	} satisfies Record<OverviewStat['icon'], typeof lightningIcon>;

	const trendLabel = (delta: number) =>
		`${delta < 0 ? '-' : '+'}${Math.abs(delta)}% from last week`;

	// Description above the hairline, trend row last — the reference order, expressed as props.
	const statOrder = ['label', 'value', 'description', 'separator', 'trend'] as const;

	/* ------------------------------------------------------ task status breakdown */

	// `monthlyStatus` is wide (one row per month, one numeric column per status) and stays that
	// way: the stacked mark lists the value fields and melts them itself, so the field order is
	// the stack order, the legend order and the palette keys.
	const statusFields = ['completed', 'inProgress', 'pending'] as const;

	const statusMarks: ChartProps<MonthlyStatus>['marks'] = [
		{
			type: 'bar',
			variant: 'stack',
			x: 'month',
			y: statusFields,
			gap: 3,
			radius: 3
		}
	];

	const statusPalette: ChartProps<MonthlyStatus>['palette'] = {
		completed: 'secondary',
		inProgress: 'primary',
		pending: 'info'
	};

	const statusLabels: Record<string, string> = {
		completed: 'Completed',
		inProgress: 'In progress',
		pending: 'Pending'
	};

	const statusLegend: ChartProps<MonthlyStatus>['legend'] = {
		placement: 'top',
		align: 'right',
		interactive: true,
		label: 'Task status',
		format: (key) => statusLabels[String(key)] ?? String(key)
	};

	const statusTooltip: ChartProps<MonthlyStatus>['tooltip'] = { groupBy: 'x' };

	/* ------------------------------------------------------- weekly task progress */

	type WeeklyRow = (typeof weeklyProgress)[number];

	const weeklyMarks: ChartProps<WeeklyRow>['marks'] = [
		{
			type: 'series',
			x: 'day',
			y: 'progress',
			area: true,
			curve: 'monotone-x',
			fill: 'secondary',
			fillOpacity: 0.35,
			line: { stroke: 'primary', strokeWidth: 2 },
			points: { fill: 'surface', stroke: 'primary', strokeWidth: 2, radius: 4 }
		}
	];

	// The reference keeps Friday's readout open; the tooltip is controllable, so the pin is a
	// prop. Hover still moves the tooltip and pointer leave restores Friday.
	const weeklyTooltip: ChartProps<WeeklyRow>['tooltip'] = {
		placement: 'top',
		defaultValue: 'Fri',
		fields: [
			{ field: 'compiled', label: 'Compiled' },
			{ field: 'progress', label: 'Progress', format: (value) => `${value}%` }
		]
	};

	const percentAxis = {
		scale: { type: 'linear', domain: [0, 100] },
		grid: true,
		axis: { line: false, ticks: { values: [0, 20, 40, 60, 80, 100] } }
	} as const satisfies ChartProps<MonthlyStatus>['y'];

	/* --------------------------------------------------------------- my tasks */

	const scheduleRanges = [
		{ value: 'today', label: 'Today' },
		{ value: 'tomorrow', label: 'Tomorrow' },
		{ value: 'upcoming', label: 'Upcoming' }
	] as const;
	let scheduleRange = $state<(typeof scheduleRanges)[number]['value']>('today');

	const rangeDayOffset = { today: 0, tomorrow: 1, upcoming: 2 } as const;

	// GanttChart is fed real instants, so the hour grid the reference draws by hand is the
	// component's own `hour` scale. UTC keeps the server and the browser on the same cells.
	const dayAnchor = new Date();
	const scheduleHour = (hour: number) =>
		new Date(
			Date.UTC(
				dayAnchor.getUTCFullYear(),
				dayAnchor.getUTCMonth(),
				dayAnchor.getUTCDate() + rangeDayOffset[scheduleRange],
				9 + hour
			)
		);

	// Bounding the schedule to the selected working day is what re-frames the timeline when the
	// segmented control moves the tasks: GanttChart does not follow a changed task set on its own.
	const scheduleBounds = $derived({ start: scheduleHour(-2), end: scheduleHour(13) });

	type ScheduleFields = { duration: string };

	const scheduleTasks = $derived<GanttTask<ScheduleFields>[]>(
		myTasks.map((task) => ({
			id: task.label,
			title: task.label,
			start: scheduleHour(task.start),
			end: scheduleHour(task.start + task.span),
			color: 'neutral',
			duration: task.duration
		}))
	);

	const assigneeCodes = [...new Set(myTasks.flatMap((task) => task.assignees))];

	// Avatar derives its initials from the first letter of every space-separated word, so a
	// two-letter code has to be handed over as two words to keep both letters.
	const assigneeName = (code: string) => [...code].join(' ');

	const scheduleResources: GanttResource[] = assigneeCodes.map((code) => ({
		id: code,
		title: assigneeName(code),
		color: 'neutral'
	}));

	const scheduleAssignments: GanttAssignment[] = myTasks.flatMap((task) =>
		task.assignees.map((code) => ({
			id: `${task.label}-${code}`,
			taskId: task.label,
			resourceId: code,
			units: 1
		}))
	);
</script>

{#snippet scheduleTaskBar(payload: GanttTaskPayload<ScheduleFields, Record<never, never>>)}
	<span class="px-sm truncate text-sm">{payload.node.task.duration}</span>
{/snippet}

<!--
	GanttChart always paints the task label outside the bar, next to the resource avatars, and the
	tree column already carries the title — so the bar owns the duration and the label renders
	nothing, leaving the avatars trailing the bar the way the reference draws them.
-->
{#snippet scheduleTaskLabel()}{/snippet}

{#snippet scheduleAssignees(
	payload: GanttResourceAssignmentsPayload<
		ScheduleFields,
		Record<never, never>,
		Record<never, never>
	>
)}
	<AvatarGroup
		size="small"
		max={4}
		items={payload.resources.map((resource) => ({ name: resource.title }))}
	/>
{/snippet}

<Stack gap="lg" class="w-full min-w-0">
	<Card variant="outline" density="comfortable">
		{#snippet title()}
			<span class="gap-sm flex items-center">
				{@render listChecksIcon()}
				<span>Task Overview</span>
				<span class="text-neutral/70 font-normal">(250+)</span>
			</span>
		{/snippet}
		<Grid columns={{ minWidth: 220, max: 4 }} gap="md">
			{#each overviewStats as stat (stat.label)}
				{@const StatIcon = statIcons[stat.icon]}
				<Stat
					variant="outline"
					size="large"
					density="normal"
					order={statOrder}
					trendDirection={stat.delta < 0 ? 'down' : 'up'}
					actionLabel={`More actions for ${stat.label}`}
					onAction={() => {}}
					label={stat.label}
					value={String(stat.value)}
					unit="task"
					description={stat.description}
					trend={trendLabel(stat.delta)}
				>
					{#snippet action()}
						{@render dotsThreeVerticalIcon()}
					{/snippet}
					{#snippet trendIcon()}
						{@render StatIcon()}
					{/snippet}
				</Stat>
			{/each}
		</Grid>
	</Card>

	<Grid columns={{ minWidth: 320, max: 3 }} gap="lg">
		<GridSpan columns={2} class="min-w-0">
			<Card variant="outline" density="comfortable" class="min-w-0">
				{#snippet title()}
					<span class="gap-sm flex items-center">
						<span>Task Status Breakdown</span>
						<span class="text-neutral/70 font-normal">(12 Months)</span>
					</span>
				{/snippet}
				<Chart
					data={monthlyStatus}
					marks={statusMarks}
					legend={statusLegend}
					tooltip={statusTooltip}
					palette={statusPalette}
					x={{ scale: { type: 'band', padding: 0.55 }, axis: { line: false } }}
					y={percentAxis}
					label="Task status breakdown over the last twelve months"
					ariaDescription="Completed, in progress and pending tasks stacked for every month of the year."
					height={320}
					class="w-full"
				/>
			</Card>
		</GridSpan>

		<GridSpan class="min-w-0">
			<Card variant="outline" density="comfortable" title="Weekly Task Progress" class="min-w-0">
				<Chart
					data={weeklyProgress}
					marks={weeklyMarks}
					tooltip={weeklyTooltip}
					x={{ scale: { type: 'point' }, axis: { line: false } }}
					y={percentAxis}
					label="Weekly task progress"
					ariaDescription="Progress and compiled task counts for every day of the current week."
					height={320}
					class="w-full"
				/>
			</Card>
		</GridSpan>
	</Grid>

	<Card variant="outline" density="comfortable">
		{#snippet title()}
			<span class="gap-sm flex items-center">
				{@render listBulletsIcon()}
				<span>My Tasks</span>
				<span class="text-neutral/70 font-normal">(04)</span>
			</span>
		{/snippet}
		{#snippet action()}
			<span class="gap-md flex items-center">
				<SegmentedControl
					items={scheduleRanges}
					bind:value={scheduleRange}
					label="Schedule range"
					size="small"
				/>
				<Button variant="outline" color="neutral" size="small" squared label="Add a task">
					{@render plusIcon()}
				</Button>
			</span>
		{/snippet}
		<GanttChart
			tasks={scheduleTasks}
			resources={scheduleResources}
			assignments={scheduleAssignments}
			timeZone="UTC"
			schedule={{ validRange: scheduleBounds }}
			zoom="hour"
			size="normal"
			density="comfortable"
			timeline={{
				todayIndicator: true,
				weekends: false,
				display: { nonWorkingTime: false }
			}}
			layout={{
				rowHeight: 56,
				grid: { columns: [{ id: 'title', title: 'Task', width: 160 }] }
			}}
			interactions={{
				moveTask: false,
				resizeStart: false,
				resizeEnd: false,
				resizeProgress: false,
				reorderRows: false,
				createRange: false,
				history: false
			}}
			render={{
				header: false,
				task: scheduleTaskBar,
				taskLabel: scheduleTaskLabel,
				resourceAssignments: scheduleAssignees
			}}
			class="h-64 w-full"
		/>
	</Card>
</Stack>
