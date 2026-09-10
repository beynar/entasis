<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';
	import { Stat } from 'svelai/stat';

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

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<header>
		<p class="text-sm text-primary-readable">Growth analytics</p>
		<h2 class="mt-sm text-3xl font-semibold">The shape of a good month.</h2>
	</header>
	<div class="grid gap-lg lg:grid-cols-3">
		<Card
			title="Revenue trend"
			description="First half of 2026 · USD thousands"
			class="lg:col-span-2"
			><Stack gap="lg"
				><Chart
					x={{ scale: { type: 'band', padding: 0.2 } }}
					y={{ scale: { type: 'linear' }, grid: true }}
					class="h-64"
					data={revenue}
					marks={[{ type: 'bar', x: 'month', y: 'value', fill: 'primary', radius: 4 }]}
					ariaLabel="Monthly revenue from January to June"
				/>
				<div class="grid grid-cols-1 gap-lg sm:grid-cols-2">
					<Stat label="Revenue" value="$188k" variant="ghost" /><Stat
						label="Monthly growth"
						value="14.3%"
						variant="ghost"
					/>
				</div></Stack
			></Card
		><Card title="Acquisition" description="A balanced channel mix"
			><Stack gap="lg"
				><Chart
					class="h-64"
					data={channels}
					marks={[
						{
							type: 'proportion',
							variant: { type: 'donut', innerRadius: 0.68 },
							category: 'name',
							value: 'value'
						}
					]}
					ariaLabel="Acquisition channel shares"
				/>
				<p class="text-sm text-neutral/60">Organic traffic leads at 48%.</p></Stack
			></Card
		>
	</div>
</Stack>
