<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';

	let quarter = $state('Q2');
	const revenue = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].flatMap((month, index) => [
		{ month, plan: 'Starter', value: 8 + index },
		{ month, plan: 'Team', value: 14 + index * 3 },
		{ month, plan: 'Enterprise', value: 6 + index * 2 }
	]);
	let visible = $derived(revenue.slice(quarter === 'Q1' ? 0 : 9, quarter === 'Q1' ? 9 : 18));
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card
		class="mx-auto w-full max-w-2xl"
		title="A healthy mix"
		description="Monthly recurring revenue by plan."
		><Stack gap="lg">
			<Stack orientation="horizontal" gap="sm">
				<Button
					size="small"
					variant={quarter === 'Q1' ? 'soft' : 'ghost'}
					onclick={() => (quarter = 'Q1')}>Q1</Button
				><Button
					size="small"
					variant={quarter === 'Q2' ? 'soft' : 'ghost'}
					onclick={() => (quarter = 'Q2')}>Q2</Button
				>
			</Stack>
			<Chart
				x={{ scale: { type: 'band', padding: 0.2 } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={visible}
				marks={[
					{
						type: 'bar',
						variant: 'stack',
						x: 'month',
						y: 'value',
						series: 'plan',
						colorBy: 'plan',
						radius: 3
					}
				]}
				label="Revenue stacked by subscription plan"
			/>
			<p class="text-neutral/70 text-sm">
				Team subscriptions account for the largest share of recurring revenue.
			</p>
		</Stack></Card
	>
</Stack>
