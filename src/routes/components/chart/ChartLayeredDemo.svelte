<script lang="ts">
	import { Chart } from 'entasis/chart';

	type Revenue = {
		month: Date;
		actual: number;
		forecast: number;
		forecastLow: number;
		forecastHigh: number;
	};

	const revenue: readonly Revenue[] = [
		{
			month: new Date('2026-01-01T00:00:00.000Z'),
			actual: 42,
			forecast: 40,
			forecastLow: 35,
			forecastHigh: 45
		},
		{
			month: new Date('2026-02-01T00:00:00.000Z'),
			actual: 48,
			forecast: 45,
			forecastLow: 39,
			forecastHigh: 51
		},
		{
			month: new Date('2026-03-01T00:00:00.000Z'),
			actual: 46,
			forecast: 52,
			forecastLow: 45,
			forecastHigh: 59
		},
		{
			month: new Date('2026-04-01T00:00:00.000Z'),
			actual: 59,
			forecast: 57,
			forecastLow: 49,
			forecastHigh: 65
		},
		{
			month: new Date('2026-05-01T00:00:00.000Z'),
			actual: 63,
			forecast: 62,
			forecastLow: 53,
			forecastHigh: 71
		},
		{
			month: new Date('2026-06-01T00:00:00.000Z'),
			actual: 71,
			forecast: 68,
			forecastLow: 58,
			forecastHigh: 78
		}
	];

	const x = {
		scale: { type: 'utc' },
		axis: { label: 'Month' }
	} as const;
	const y = {
		scale: { type: 'linear' },
		axis: { label: 'Revenue (€k)' },
		grid: true
	} as const;
	const marks = [
		{
			type: 'series',
			id: 'Forecast',
			x: 'month',
			y: 'forecast',
			stroke: 'secondary',
			strokeWidth: 2,
			interval: {
				lower: 'forecastLow',
				upper: 'forecastHigh',
				fill: 'secondary',
				fillOpacity: 0.18
			}
		},
		{
			type: 'series',
			id: 'Actual',
			x: 'month',
			y: 'actual',
			stroke: 'primary',
			strokeWidth: 2.5,
			// A surface grade is a ChartColor like any semantic role: it resolves to
			// var(--color-surface), so the marker knocks the line out against the card.
			points: { fill: 'surface', stroke: 'primary', strokeWidth: 2, radius: 4 }
		}
	] as const;
</script>

<Chart
	data={revenue}
	{x}
	{y}
	{marks}
	tooltip
	label="Monthly actual and forecast revenue"
	ariaDescription="Actual revenue is shown over a forecast line and its confidence interval."
	aspectRatio={960 / 420}
	class="w-full"
/>
