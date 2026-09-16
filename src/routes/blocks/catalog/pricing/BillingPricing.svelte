<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { SegmentedControl } from 'svelai/segmented-control';
	import { checkIcon } from 'svelai/icons/check';
	let billing = $state<'monthly' | 'annual'>('monthly');
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<div class="text-center">
		<Heading as="h2" size="h2" weight="bold">More clarity, at every stage.</Heading>
		<p class="mt-lg text-neutral/70">Choose the rhythm that fits your team.</p>
	</div>
	<SegmentedControl
		class="self-center"
		label="Billing period"
		bind:value={billing}
		items={[
			{ value: 'monthly', label: 'Monthly' },
			{ value: 'annual', label: 'Annual · Save 20%' }
		]}
	/>
	<div class="gap-lg grid md:grid-cols-2">
		{#each [{ name: 'Independent', price: 15, annual: 12, description: 'A focused workspace for your own work.', features: ['Unlimited projects', 'Personal planning', 'File attachments'] }, { name: 'Together', price: 30, annual: 24, description: 'A connected place for a team to build.', features: ['Everything in Independent', 'Shared team views', 'Project permissions', 'Workspace insights'] }] as plan, index (plan.name)}<Card
				variant={index === 1 ? 'soft' : 'outline'}
				color={index === 1 ? 'primary' : 'neutral'}
				><div class="gap-xl flex flex-col">
					<div class="gap-md flex items-center justify-between">
						<Heading as="h3" size="h3">{plan.name}</Heading>{#if index === 1}<Chip size="small"
								>For teams</Chip
							>{/if}
					</div>
					<p class="text-neutral/70">{plan.description}</p>
					<div>
						<strong class="text-5xl">${billing === 'annual' ? plan.annual : plan.price}</strong
						><span class="text-neutral/70"> / person / month</span>
						<p class="mt-sm text-neutral/65 text-xs">
							{billing === 'annual' ? `Billed as $${plan.annual * 12} per year` : 'Billed monthly'}
						</p>
					</div>
					<ul class="gap-md flex flex-col">
						{#each plan.features as feature (feature)}<li class="gap-sm flex">
								<span class="text-primary-readable">{@render checkIcon()}</span>{feature}
							</li>{/each}
					</ul>
					<Button href="/docs" variant={index === 1 ? 'solid' : 'outline'}>Explore this plan</Button
					>
				</div></Card
			>{/each}
	</div>
</section>
