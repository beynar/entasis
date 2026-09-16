<script lang="ts">
	import { Chart } from 'svelai/chart';

	type ResponseTime = {
		minute: number;
		milliseconds: number;
	};

	const responseTimes: readonly ResponseTime[] = [
		{ minute: 0, milliseconds: 182 },
		{ minute: 5, milliseconds: 169 },
		{ minute: 10, milliseconds: 214 },
		{ minute: 15, milliseconds: 193 },
		{ minute: 20, milliseconds: 158 },
		{ minute: 25, milliseconds: 176 },
		{ minute: 30, milliseconds: 151 }
	];

	const x = {
		scale: { type: 'linear' },
		axis: { label: 'Minute' }
	} as const;
	const y = {
		scale: { type: 'linear' },
		axis: { label: 'Response time (ms)' },
		grid: true
	} as const;
	const marks = [
		{
			type: 'series',
			x: 'minute',
			y: 'milliseconds',
			curve: 'monotone-x',
			stroke: 'info',
			strokeWidth: 2.5
		}
	] as const;
</script>

<Chart
	data={responseTimes}
	{x}
	{y}
	{marks}
	tooltip
	label="API response time"
	ariaDescription="Response time measured every five minutes."
	class="w-full"
/>
