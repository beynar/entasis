<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Meter } from 'svelai/meter';
	import { Stat } from 'svelai/stat';
</script>

<Stack as="section" gap="lg" class="mx-auto w-full max-w-5xl p-md text-neutral sm:p-xl">
	<Card
		class="mx-auto w-full max-w-lg"
		title="Recurring revenue"
		description="June 2026 · illustrative breakdown"
		><Stack gap="lg">
			<Stat
				label="Total MRR"
				value="$48,200"
				trend="+$5,800"
				trendDirection="up"
				variant="ghost"
			/><Meter
				value={[
					{ value: 25, color: 'primary', label: 'Starter' },
					{ value: 55, color: 'secondary', label: 'Team' },
					{ value: 20, color: 'info', label: 'Enterprise' }
				]}
				showLegend
			/>{#each [{ name: 'Starter', amount: '$12,050', share: '25%' }, { name: 'Team', amount: '$26,510', share: '55%' }, { name: 'Enterprise', amount: '$9,640', share: '20%' }] as plan (plan)}<div
					class="flex items-center justify-between border-b border-neutral-muted pb-md text-sm"
				>
					<span>{plan.name}</span>
					<Stack orientation="horizontal" gap="lg">
						<strong>{plan.amount}</strong><span class="text-neutral/60">{plan.share}</span>
					</Stack>
				</div>{/each}
		</Stack></Card
	>
</Stack>
