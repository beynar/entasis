<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';
	import { Chip } from 'svelai/chip';
	import { Switch } from 'svelai/switch';

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const revenue = months.map((month, index) => ({
		month,
		value: [18, 25, 21, 34, 42, 48][index] ?? 0
	}));
	let previous = $state(false);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card class="mx-auto w-full max-w-md"
		><Stack gap="lg">
			<div class="flex items-center justify-between">
				<p class="font-medium">Monthly revenue</p>
				<Chip color="success">+18.4%</Chip>
			</div>
			<strong class="text-4xl font-semibold tabular-nums">${previous ? '40,710' : '48,200'}</strong
			><Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-32"
				data={previous ? revenue.slice(0, 5) : revenue}
				marks={[
					{
						type: 'series',
						x: 'month',
						y: 'value',
						area: true,
						stroke: 'primary',
						fill: 'primary',
						fillOpacity: 0.12,
						curve: 'monotone-x'
					}
				]}
				label="Revenue sparkline"
			/><Switch label="Show previous period" bind:value={previous} />
			<p class="text-neutral/70 text-xs">Sample revenue, January–June 2026.</p>
		</Stack></Card
	>
</Stack>
