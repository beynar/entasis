<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { chartBarIcon } from 'svelai/icons/chartBar';
	import { usersThreeIcon } from 'svelai/icons/usersThree';
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="max-w-2xl">
		<Chip variant="outline">A little more, where it matters</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Shape the workspace around your team.</Heading
		>
		<p class="mt-lg text-neutral/70">
			Example add-ons for teams with a more specific way of working.
		</p>
	</div>
	<div class="grid gap-lg md:grid-cols-2">
		<Card variant="soft" color="primary" title="Advanced insights"
			><Stack gap="lg"
				><span class="text-primary">{@render chartBarIcon({ size: 34 })}</span>
				<p>See the patterns behind the projects, with a clearer view of momentum and capacity.</p>
				<div class="flex flex-wrap items-end justify-between gap-lg">
					<div>
						<strong class="text-4xl">$49</strong><span class="text-sm"> / workspace / month</span>
					</div>
					<Button href="/docs" variant="outline">Explore insights</Button>
				</div></Stack
			></Card
		><Card variant="outline" title="Guided onboarding"
			><Stack gap="lg"
				><span class="text-primary">{@render usersThreeIcon({ size: 34 })}</span>
				<p>A focused working session to help your team find a shared starting point.</p>
				<div class="flex flex-wrap items-end justify-between gap-lg">
					<div><strong class="text-4xl">$250</strong><span class="text-sm"> / session</span></div>
					<Button href="/docs" variant="outline">Explore onboarding</Button>
				</div></Stack
			></Card
		>
	</div>
	<div class="flex flex-col gap-lg">
		{#each [{ name: 'Extended history', description: 'Keep a longer view of project decisions.', price: '$10 / workspace' }, { name: 'Additional guest seats', description: 'Bring outside collaborators into the work.', price: '$5 / guest' }] as addon (addon.name)}<div
				class="flex flex-wrap items-center justify-between gap-lg border-t border-neutral-muted pt-lg"
			>
				<div>
					<strong>{addon.name}</strong>
					<p class="mt-sm text-sm text-neutral/60">{addon.description}</p>
				</div>
				<Chip variant="outline">{addon.price}</Chip>
			</div>{/each}
	</div>
</section>
