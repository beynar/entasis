<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';
	import { Chip } from 'svelai/chip';
	import { Meter } from 'svelai/meter';
	import { ProgressCircle } from 'svelai/progress-circle';
	import { Stat } from 'svelai/stat';
	import { Timeline } from 'svelai/timeline';

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const revenue = months.map((month, index) => ({
		month,
		value: [18, 25, 21, 34, 42, 48][index] ?? 0
	}));
	const channels = [
		{ name: 'Organic', value: 48 },
		{ name: 'Direct', value: 28 },
		{ name: 'Referral', value: 16 },
		{ name: 'Paid', value: 8 }
	];
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<header class="gap-md flex flex-wrap items-end justify-between">
		<div>
			<Chip color="primary">Monthly snapshot</Chip>
			<h2 class="mt-lg text-3xl font-semibold">A clearer view of growth.</h2>
		</div>
		<span class="text-neutral/70 text-sm">June 2026 · Sample data</span>
	</header>
	<div class="gap-lg grid md:grid-cols-3">
		<Card
			class="md:col-span-2"
			title="Audience growth"
			description="Visitors who are finding their way to your product"
			><Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={revenue}
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
				label="Audience growth over six months"
			/></Card
		><Card title="Conversion" description="From visitor to active customer"
			><div class="gap-lg py-lg grid place-items-center">
				<ProgressCircle value={68} size="large" label="68% activation" /><strong class="text-4xl"
					>68%</strong
				><Chip color="success">+4.2 points</Chip>
			</div></Card
		><Card title="Top sources"
			><Chart
				class="h-52"
				data={channels}
				marks={[
					{
						type: 'proportion',
						variant: { type: 'donut', innerRadius: 0.68 },
						category: 'name',
						value: 'value'
					}
				]}
				label="Traffic source distribution"
			/></Card
		><Card title="Revenue" description="A strong finish to the quarter"
			><Stack gap="lg"
				><Stat
					label="Monthly recurring"
					value="$48,200"
					trend="+14.3%"
					trendDirection="up"
					variant="ghost"
				/><Meter label="Quarterly goal" value={82} color="primary" /></Stack
			></Card
		><Card title="Milestones"
			><Timeline
				items={[
					{ id: 'a', title: '10k visitors', date: 'June 4' },
					{ id: 'b', title: '500 teams', date: 'June 16' },
					{ id: 'c', title: 'New revenue high', date: 'June 28' }
				]}
				density="compact"
			/></Card
		>
	</div>
</Stack>
