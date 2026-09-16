<script lang="ts">
	import { Chart, type ChartKey, type ChartProps } from 'svelai/chart';

	type StatusRow = {
		month: string;
		completed: number;
		inProgress: number;
		pending: number;
	};

	// Wide rows: one row per month, one numeric column per status. No melting by hand.
	const monthlyStatus: readonly StatusRow[] = [
		{ month: 'Jan', completed: 38, inProgress: 18, pending: 9 },
		{ month: 'Feb', completed: 42, inProgress: 21, pending: 7 },
		{ month: 'Mar', completed: 35, inProgress: 26, pending: 12 },
		{ month: 'Apr', completed: 47, inProgress: 17, pending: 6 },
		{ month: 'May', completed: 51, inProgress: 14, pending: 10 },
		{ month: 'Jun', completed: 44, inProgress: 22, pending: 8 }
	];

	const marks: ChartProps<StatusRow>['marks'] = [
		{
			type: 'bar',
			variant: 'stack',
			x: 'month',
			// The stack order, the legend order and the palette keys are all these field names.
			y: ['completed', 'inProgress', 'pending'],
			gap: 3,
			radius: 3
		}
	];

	// Colors are named per series key, so they no longer depend on discovery order.
	const palette: ChartProps<StatusRow>['palette'] = {
		completed: 'secondary',
		inProgress: 'primary',
		pending: 'info'
	};

	const statusLabels: Record<string, string> = {
		completed: 'Completed',
		inProgress: 'In progress',
		pending: 'Pending'
	};

	const legend: ChartProps<StatusRow>['legend'] = {
		placement: 'top',
		align: 'right',
		interactive: true,
		label: 'Task status',
		format: (key) => statusLabels[String(key)] ?? String(key)
	};

	let pinned = $state<ChartKey | null>('Mar');

	const tooltip: ChartProps<StatusRow>['tooltip'] = {
		groupBy: 'x',
		get value() {
			return pinned;
		},
		onValueChange: (value) => (pinned = value)
	};
</script>

<div class="grid w-full gap-3">
	<p class="text-neutral/70 text-sm">
		Pinned month: <strong class="text-neutral">{pinned ?? 'none'}</strong>. Click a bar to pin it,
		click it again to unpin.
	</p>
	<Chart
		data={monthlyStatus}
		{marks}
		{palette}
		{legend}
		{tooltip}
		x={{ scale: { type: 'band', padding: 0.5 }, axis: { line: false } }}
		y={{ scale: { type: 'linear' }, grid: true }}
		label="Task status over the last six months"
		ariaDescription="Completed, in progress and pending tasks stacked for every month."
		height={320}
	/>
</div>
