<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Alert } from 'svelai/alert';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';
	import { Select } from 'svelai/select';
	import { Stat } from 'svelai/stat';

	let region = $state<string | null>('Europe');
	let samples = $derived(
		Array.from({ length: 10 }, (_, index) => ({
			minute: ':' + String(index * 5).padStart(2, '0'),
			requests: [38, 42, 40, 51, 48, 62, 58, 64, 60, 68][index] * (region === 'Europe' ? 80 : 125),
			latency: [42, 39, 47, 44, 38, 51, 43, 40, 42, 39][index] * (region === 'Europe' ? 1 : 1.3)
		}))
	);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-center justify-between gap-lg">
		<div>
			<p class="text-sm text-neutral/60">Infrastructure / Overview</p>
			<h2 class="mt-sm text-3xl font-semibold">Systems at a glance</h2>
		</div>
		<Select
			label="Region"
			bind:value={region}
			items={[
				{ value: 'Europe', label: 'Europe' },
				{ value: 'North America', label: 'North America' }
			]}
		/>
	</header>
	<Grid columns={{ minWidth: 220, max: 3 }} gap="md">
		<Stat label="Uptime" value="99.98%" /><Stat
			label="Requests / minute"
			value={region === 'Europe' ? '4,820' : '7,640'}
		/><Stat label="Error rate" value="0.02%" />
	</Grid>
	<Grid columns={{ minWidth: 220, max: 2 }} gap="lg">
		<Card title="Request volume" description={`${region} · sample minute intervals`}
			><Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={samples}
				marks={[
					{
						type: 'series',
						x: 'minute',
						y: 'requests',
						area: true,
						fill: 'primary',
						stroke: 'primary',
						fillOpacity: 0.12
					}
				]}
				ariaLabel="Requests per minute"
			/></Card
		><Card title="Response time" description="p95 latency in milliseconds"
			><Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={samples}
				marks={[{ type: 'series', x: 'minute', y: 'latency', stroke: 'warning', points: true }]}
				ariaLabel="Response latency per minute"
			/></Card
		>
	</Grid>
	<Alert
		color="success"
		title="Sample systems operational"
		description="These charts use a fixed demonstration dataset, not live telemetry."
	/>
</Stack>
