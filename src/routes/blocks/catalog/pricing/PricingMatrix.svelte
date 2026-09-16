<script lang="ts">
	import { Button } from 'svelai/button';
	import { Heading } from 'svelai/heading';
	import { Switch } from 'svelai/switch';
	import { Table } from 'svelai/table';
	let annual = $state(false);
	const features = [
		['Projects', 'Unlimited', 'Unlimited', 'Unlimited'],
		['Team members', 'Up to 5', 'Up to 25', 'Unlimited'],
		['Guest access', '3 guests', '20 guests', 'Unlimited'],
		['Project permissions', 'Basic', 'Advanced', 'Advanced'],
		['Activity history', '30 days', '1 year', 'Unlimited'],
		['Workspace insights', '—', 'Included', 'Included'],
		['Dedicated onboarding', '—', '—', 'Included']
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-xl flex flex-wrap items-end justify-between">
		<div>
			<Heading as="h2" size="h2" weight="bold">The details, side by side.</Heading>
			<p class="mt-lg text-neutral/70">
				Choose the example plan that fits the way your team works.
			</p>
		</div>
		<Switch label="Annual billing" bind:value={annual} />
	</div>
	<div class="border-neutral-muted overflow-x-auto rounded-xl border">
		<Table
			header={{
				feature: 'Included in your plan',
				starter: { content: `Starter · $${annual ? 12 : 15}/mo`, class: 'min-w-40' },
				team: { content: `Team · $${annual ? 24 : 30}/mo`, class: 'min-w-40 bg-primary-muted' },
				business: { content: `Business · $${annual ? 40 : 50}/mo`, class: 'min-w-40' }
			}}
			items={features.map((feature) => ({
				cells: {
					feature: feature[0],
					starter: feature[1],
					team: { content: feature[2], class: 'bg-primary-muted' },
					business: feature[3]
				}
			}))}
		/>
	</div>
	<div class="gap-lg flex flex-wrap items-center justify-between">
		<p class="text-neutral/70 text-sm">
			{annual
				? 'Example annual prices are billed for 12 months.'
				: 'Example monthly prices have no annual commitment.'}
		</p>
		<Button href="/docs" variant="outline">Read the plan details</Button>
	</div>
</section>
