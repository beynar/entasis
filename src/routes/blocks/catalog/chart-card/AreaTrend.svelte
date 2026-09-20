<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Card } from 'entasis/card';
	import { Chart } from 'entasis/chart';
	import { Chip } from 'entasis/chip';
	import { Select } from 'entasis/select';

	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
	const revenue = months.map((month, index) => ({
		month,
		value: [18, 25, 21, 34, 42, 48][index] ?? 0
	}));
	let period = $state<string | null>('6');
	let visible = $derived(revenue.slice(-(Number(period) || 6)));
	let total = $derived(visible.reduce((sum, month) => sum + month.value, 0));
</script>

<Stack as="section" gap="lg" class="p-md text-neutral sm:p-xl mx-auto w-full max-w-5xl">
	<Card class="mx-auto w-full max-w-2xl" title="Revenue" description="A steady start to the year."
		><Stack gap="lg">
			<div class="gap-md flex flex-wrap items-center justify-between">
				<span class="text-4xl font-semibold tabular-nums">${total}k</span><Select
					class="w-40"
					label="Period"
					bind:value={period}
					items={[
						{ value: '6', label: 'Six months' },
						{ value: '3', label: 'Three months' }
					]}
				/>
			</div>
			<Chart
				x={{ scale: { type: 'point' } }}
				y={{ scale: { type: 'linear' }, grid: true }}
				class="h-64"
				data={visible}
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
				label="Monthly revenue in thousands of dollars"
			/>
			<div
				class="gap-md border-neutral-muted pt-lg flex flex-wrap items-center justify-between border-t"
			>
				<Chip color="success">+18.4% growth</Chip><span class="text-neutral/70 text-xs"
					>Illustrative revenue · USD</span
				>
			</div>
		</Stack></Card
	>
</Stack>
