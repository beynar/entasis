<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { Table } from 'svelai/table';
	let active = $state(0);
	const rows = [
		[
			['Typical cycle', 'A few days', 'Two weeks', 'A month'],
			['Review cadence', 'At milestones', 'Weekly', 'Twice weekly'],
			['Ownership', 'One person', 'Shared team', 'Dedicated leads'],
			['Best for', 'Focused work', 'Product features', 'Connected products']
		],
		[
			['Participants', '1–2', '3–8', '9–24'],
			['Feedback', 'Direct conversation', 'Async reviews', 'Cross-team sessions'],
			['Documentation', 'Working notes', 'Project brief', 'Shared knowledge base'],
			['Planning', 'Next task', 'Sprint outcomes', 'Product roadmap']
		]
	];
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-xl p-lg md:p-xl">
	<div class="grid items-end gap-xl md:grid-cols-2">
		<Heading as="h2" size="h2" weight="bold">Find the right shape for your team.</Heading>
		<p class="text-neutral/70">
			Different stages call for different ways of working. Explore these illustrative team models.
		</p>
	</div>
	<Tabbar items={['Delivery', 'Collaboration']} bind:value={active} />
	<div class="overflow-x-auto">
		<Table
			header={{ feature: 'Team model', solo: 'Independent', team: 'Small team', studio: 'Studio' }}
			items={rows[active].map((row) => ({
				cells: {
					feature: row[0],
					solo: row[1],
					team: { content: row[2], class: 'bg-primary-muted' },
					studio: row[3]
				}
			}))}
		/>
	</div>
	<div class="rounded-lg bg-surface-recessed p-lg">
		<strong>{active === 0 ? 'Keep the handoff simple.' : 'Make room for the right voices.'}</strong>
		<p class="mt-sm text-sm text-neutral/70">
			{active === 0
				? 'Choose the smallest delivery process that gives everyone enough context to do their best work.'
				: 'A regular review rhythm helps teams make decisions without making every hour a meeting.'}
		</p>
	</div>
</section>
