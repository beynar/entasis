<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { checkIcon } from 'svelai/icons/check';
	const plans = [
		{
			name: 'Free',
			description: 'A useful home for your own work.',
			price: '$0',
			unit: ' / month',
			features: ['3 projects', 'Personal workspace', 'Core views'],
			action: 'Explore the basics'
		},
		{
			name: 'Starter',
			description: 'A little more room to grow.',
			price: '$12',
			unit: ' / person',
			features: ['Unlimited projects', 'Guest collaboration', 'Project templates', 'Email support'],
			action: 'Explore Starter'
		},
		{
			name: 'Team',
			description: 'A shared rhythm for a growing team.',
			price: '$24',
			unit: ' / person',
			features: [
				'Everything in Starter',
				'Team insights',
				'Advanced permissions',
				'Priority support'
			],
			action: 'Explore Team'
		},
		{
			name: 'Business',
			description: 'Connected work across your company.',
			price: 'Custom',
			unit: '',
			features: [
				'Everything in Team',
				'Workspace controls',
				'Dedicated onboarding',
				'Custom agreements'
			],
			action: 'Read the details'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="max-w-2xl">
		<Chip variant="outline">A plan for your next chapter</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Start where you are. Grow from there.</Heading
		>
		<p class="mt-lg text-neutral/70">Simple example plans for teams at different stages.</p>
	</div>
	<div class="gap-lg grid sm:grid-cols-2 xl:grid-cols-4">
		{#each plans as plan (plan.name)}<Card
				class="justify-between"
				variant={plan.name === 'Team' ? 'soft' : 'outline'}
				color={plan.name === 'Team' ? 'primary' : 'neutral'}
				><div class="gap-lg flex h-full flex-col items-start">
					<Heading as="h3" size="h4">{plan.name}</Heading>
					<p class="text-neutral/70 min-h-12 text-sm">{plan.description}</p>
					<div>
						<strong class="text-4xl">{plan.price}</strong><span class="text-neutral/70 text-sm"
							>{plan.unit}</span
						>
					</div>
					<Separator />
					<ul class="gap-md flex flex-1 flex-col">
						{#each plan.features as feature (feature)}<li class="gap-sm flex text-sm">
								<span class="text-primary-readable">{@render checkIcon()}</span>{feature}
							</li>{/each}
					</ul>
				</div>
				{#snippet footer()}
					<Button href="/docs" fullWidth variant={plan.name === 'Team' ? 'solid' : 'outline'}
						>{plan.action}</Button
					>
				{/snippet}</Card
			>{/each}
	</div>
	<p class="text-neutral/65 text-xs">
		Illustrative Northstar plans. No purchase is made in this example.
	</p>
</section>
