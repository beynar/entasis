<script lang="ts">
	import { Grid } from 'entasis/grid';
	import { Stack } from 'entasis/stack';
	import { Card } from 'entasis/card';
	import { Select } from 'entasis/select';
	import { Stat } from 'entasis/stat';
	import { Table } from 'entasis/table';

	let range = $state<string | null>('all');
	const ledger = [
		{ date: 'June 28', name: 'Orbit Labs', type: 'Customer payment', amount: 2400 },
		{ date: 'June 28', name: 'Cloud hosting', type: 'Subscription', amount: -180 },
		{ date: 'June 28', name: 'Northwind Studio', type: 'Customer payment', amount: 640 },
		{ date: 'June 27', name: 'Design tools', type: 'Subscription', amount: -96 },
		{ date: 'June 27', name: 'Common Ground', type: 'Customer payment', amount: 1200 }
	];
	let visible = $derived(ledger.filter((entry) => range === 'all' || entry.date === range));
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-lg flex flex-wrap items-end justify-between">
		<div>
			<p class="text-neutral/70 text-sm">Finance / Activity</p>
			<h2 class="mt-sm text-3xl font-semibold">Every movement, accounted for.</h2>
		</div>
		<Select
			label="Date range"
			bind:value={range}
			items={[
				{ value: 'all', label: 'All dates' },
				{ value: 'June 28', label: 'June 28' }
			]}
		/>
	</header>
	<Grid columns={{ minWidth: 220, max: 2 }} gap="md">
		<Stat
			label="Money in"
			value={`$${visible
				.filter((entry) => entry.amount > 0)
				.reduce((sum, entry) => sum + entry.amount, 0)
				.toLocaleString()}`}
		/><Stat
			label="Money out"
			value={`$${Math.abs(visible.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0)).toLocaleString()}`}
		/>
	</Grid>
	{#each [...new Set(visible.map((entry) => entry.date))] as date (date)}<Card
			title={date}
			description={`${visible.filter((entry) => entry.date === date).length} transactions`}
			><Table
				header={{ name: 'Transaction', type: 'Type', amount: 'Amount' }}
				items={visible
					.filter((entry) => entry.date === date)
					.map((entry) => ({
						cells: {
							name: entry.name,
							type: entry.type,
							amount: {
								content:
									(entry.amount > 0 ? '+' : '−') + '$' + Math.abs(entry.amount).toLocaleString(),
								class: entry.amount > 0 ? 'text-success-readable' : 'text-neutral'
							}
						}
					}))}
				footer={{
					name: 'Net movement',
					type: '',
					amount:
						'$' +
						visible
							.filter((entry) => entry.date === date)
							.reduce((sum, entry) => sum + entry.amount, 0)
							.toLocaleString()
				}}
			/></Card
		>{/each}
</Stack>
