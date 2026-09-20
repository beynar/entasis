<script lang="ts">
	import { Chart } from 'entasis/chart';

	type QuarterlyRevenue = {
		quarter: string;
		product: string;
		revenue: number;
	};

	const revenue: readonly QuarterlyRevenue[] = [
		{ quarter: 'Q1', product: 'Platform', revenue: 38 },
		{ quarter: 'Q1', product: 'Services', revenue: 24 },
		{ quarter: 'Q2', product: 'Platform', revenue: 45 },
		{ quarter: 'Q2', product: 'Services', revenue: 29 },
		{ quarter: 'Q3', product: 'Platform', revenue: 52 },
		{ quarter: 'Q3', product: 'Services', revenue: 34 },
		{ quarter: 'Q4', product: 'Platform', revenue: 61 },
		{ quarter: 'Q4', product: 'Services', revenue: 41 }
	];

	const position = {
		x: {
			scale: { type: 'band', padding: 0.18 },
			axis: { label: 'Quarter' }
		},
		y: {
			scale: { type: 'linear' },
			axis: { label: 'Revenue (€k)' },
			grid: true
		}
	} as const;

	const groupedMarks = [
		{
			type: 'bar',
			variant: 'group',
			x: 'quarter',
			y: 'revenue',
			series: 'product',
			colorBy: 'product',
			padding: 0.12
		}
	] as const;

	const stackedMarks = [
		{
			type: 'bar',
			variant: 'stack',
			x: 'quarter',
			y: 'revenue',
			series: 'product',
			colorBy: 'product'
		}
	] as const;
</script>

<div class="grid w-full gap-6 lg:grid-cols-2">
	<section class="grid min-w-0 gap-2">
		<h3 class="text-neutral text-sm font-semibold">Grouped</h3>
		<Chart
			data={revenue}
			x={position.x}
			y={position.y}
			marks={groupedMarks}
			tooltip
			label="Quarterly revenue grouped by product"
			aspectRatio={520 / 360}
			class="w-full"
		/>
	</section>

	<section class="grid min-w-0 gap-2">
		<h3 class="text-neutral text-sm font-semibold">Stacked</h3>
		<Chart
			data={revenue}
			x={position.x}
			y={position.y}
			marks={stackedMarks}
			tooltip
			label="Quarterly revenue stacked by product"
			aspectRatio={520 / 360}
			class="w-full"
		/>
	</section>
</div>
