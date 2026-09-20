<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chart } from 'entasis/chart';
	import { Meter } from 'entasis/meter';
	import { Stat } from 'entasis/stat';
	import { Table } from 'entasis/table';

	let filter = $state('All');
	const sessions = [
		{ visitor: 'Visitor 2041', device: 'Desktop', location: 'Paris, FR', duration: '6m 12s' },
		{ visitor: 'Visitor 2042', device: 'Mobile', location: 'London, UK', duration: '2m 44s' },
		{ visitor: 'Visitor 2043', device: 'Desktop', location: 'Berlin, DE', duration: '4m 08s' },
		{ visitor: 'Visitor 2044', device: 'Mobile', location: 'New York, US', duration: '3m 56s' }
	];
	let visible = $derived(
		sessions.filter((session) => filter === 'All' || session.device === filter)
	);
	let activity = $derived(
		['08:00', '09:00', '10:00', '11:00', '12:00', '13:00'].map((hour, index) => ({
			hour,
			sessions: ([42, 68, 94, 82, 110, 124][index] ?? 0) * (filter === 'All' ? 1 : 0.5)
		}))
	);
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-center justify-between">
		<div>
			<p class="text-neutral/70 text-sm">Product intelligence</p>
			<h2 class="mt-sm text-3xl font-semibold">Every session tells a story.</h2>
		</div>
		<Stack orientation="horizontal" gap="sm">
			{#each ['All', 'Desktop', 'Mobile'] as device (device)}<Button
					size="small"
					variant={filter === device ? 'soft' : 'ghost'}
					onclick={() => (filter = device)}>{device}</Button
				>{/each}
		</Stack>
	</header>
	<Grid columns={{ minWidth: 220, max: 3 }} gap="md">
		<Stat label="Sample sessions" value={String(visible.length)} /><Stat
			label="Median duration"
			value="4m 32s"
		/><Stat label="p95 latency" value="142 ms" />
	</Grid>
	<div class="gap-lg grid lg:grid-cols-3">
		<Card title="Session activity" description="Sample hourly sessions" class="lg:col-span-2"
			><Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={activity}
				marks={[
					{
						type: 'series',
						x: 'hour',
						y: 'sessions',
						area: true,
						fill: 'primary',
						stroke: 'primary',
						fillOpacity: 0.12
					}
				]}
				label="Sessions by hour"
			/></Card
		><Card title="Latency distribution"
			><Stack gap="lg">
				<Meter label="Under 100 ms" value={72} color="success" /><Meter
					label="100–200 ms"
					value={21}
					color="primary"
				/><Meter label="Over 200 ms" value={7} color="warning" />
			</Stack></Card
		>
	</div>
	<Card title="Recent sessions"
		><Table
			header={{ visitor: 'Visitor', device: 'Device', location: 'Region', duration: 'Duration' }}
			items={visible.map((session) => ({ cells: session }))}
		/></Card
	>
</Stack>
