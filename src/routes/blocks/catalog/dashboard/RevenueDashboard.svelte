<script lang="ts">
	import { Grid } from 'svelai/grid';
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';
	import { ProgressCircle } from 'svelai/progress-circle';
	import { Select } from 'svelai/select';
	import { Stat } from 'svelai/stat';
	import { Table } from 'svelai/table';

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const revenue = months.map((month, index) => ({
		month,
		value: [18, 25, 21, 34, 42, 48][index] ?? 0
	}));
	let period = $state<string | null>('June');
	let transactions = $derived([
		{ name: 'Northwind Studio', plan: 'Team', date: period + ' 28', amount: '$288' },
		{ name: 'Orbit Labs', plan: 'Enterprise', date: period + ' 27', amount: '$1,200' },
		{ name: 'Common Ground', plan: 'Team', date: period + ' 26', amount: '$144' }
	]);
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header class="flex flex-wrap items-end justify-between gap-lg">
		<div>
			<p class="text-sm text-neutral/60">Good morning, Alex</p>
			<h2 class="mt-sm text-3xl font-semibold">Business is moving.</h2>
		</div>
		<Select
			label="Reporting period"
			bind:value={period}
			items={[
				{ value: 'June', label: 'June 2026' },
				{ value: 'May', label: 'May 2026' }
			]}
		/>
	</header>
	<Grid columns={{ minWidth: 170, max: 4 }} gap="md">
		<Stat
			label="Revenue"
			value={period === 'June' ? '$48,200' : '$42,100'}
			trend="+14.5%"
			trendDirection="up"
		/><Stat label="Customers" value={period === 'June' ? '1,824' : '1,706'} /><Stat
			label="Average order"
			value="$84"
		/><Stat label="Retention" value="94.2%" />
	</Grid>
	<div class="grid gap-lg lg:grid-cols-3">
		<Card title="Revenue overview" description="USD thousands · sample data" class="lg:col-span-2"
			><Chart
				x={{ scale: { type: 'band', padding: 0.2 } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={period === 'June' ? revenue : revenue.slice(0, 5)}
				marks={[{ type: 'bar', x: 'month', y: 'value', fill: 'primary', radius: 4 }]}
				ariaLabel="Revenue per month"
			/></Card
		><Card title="Quarterly goal" description="A good pace for a strong finish"
			><div class="grid place-items-center gap-lg py-lg">
				<ProgressCircle value={82} diameter={144} label="82% of revenue goal" /><strong
					class="text-3xl">82%</strong
				>
				<p class="text-sm text-neutral/60">$18,000 until your target</p>
			</div></Card
		>
	</div>
	<Card title="Recent transactions" description={`${period} · latest customer payments`}
		><Table
			header={{ name: 'Customer', plan: 'Plan', date: 'Date', amount: 'Amount' }}
			items={transactions.map((transaction) => ({ cells: transaction }))}
		/></Card
	>
</Stack>
