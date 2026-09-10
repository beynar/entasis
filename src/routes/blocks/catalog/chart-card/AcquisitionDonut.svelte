<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chart } from 'svelai/chart';

	const channels = [
		{ name: 'Organic', value: 48 },
		{ name: 'Direct', value: 28 },
		{ name: 'Referral', value: 16 },
		{ name: 'Paid', value: 8 }
	];
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-2xl"
		title="Where people find us"
		description="New visitors, June 2026"
		><div class="grid items-center gap-xl sm:grid-cols-2">
			<Chart
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
				ariaLabel="Traffic sources: organic 48%, direct 28%, referral 16%, paid 8%"
			/>
			<Stack gap="lg">
				<div>
					<strong class="text-4xl font-semibold">12,480</strong>
					<p class="mt-xs text-sm text-neutral/60">total visitors</p>
				</div>
				{#each channels as source (source)}<div
						class="flex items-center justify-between gap-md border-b border-neutral-muted pb-sm"
					>
						<span class="text-sm">{source.name}</span><strong class="text-sm tabular-nums"
							>{source.value}%</strong
						>
					</div>{/each}
			</Stack>
		</div></Card
	>
</Stack>
