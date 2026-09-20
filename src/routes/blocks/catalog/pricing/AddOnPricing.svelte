<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { chartBarIcon } from 'entasis/icons/chartBar';
	import { usersThreeIcon } from 'entasis/icons/usersThree';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
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
	<div class="gap-lg grid md:grid-cols-2">
		<Card variant="soft" color="primary" title="Advanced insights"
			><Stack gap="lg"
				><span class="text-primary-readable">{@render chartBarIcon({ size: 34 })}</span>
				<p>See the patterns behind the projects, with a clearer view of momentum and capacity.</p>
				<div class="gap-lg flex flex-wrap items-end justify-between">
					<div>
						<strong class="text-4xl">$49</strong><span class="text-sm"> / workspace / month</span>
					</div>
					<Button href="/docs" variant="outline">Explore insights</Button>
				</div></Stack
			></Card
		><Card variant="outline" title="Guided onboarding"
			><Stack gap="lg"
				><span class="text-primary-readable">{@render usersThreeIcon({ size: 34 })}</span>
				<p>A focused working session to help your team find a shared starting point.</p>
				<div class="gap-lg flex flex-wrap items-end justify-between">
					<div><strong class="text-4xl">$250</strong><span class="text-sm"> / session</span></div>
					<Button href="/docs" variant="outline">Explore onboarding</Button>
				</div></Stack
			></Card
		>
	</div>
	<div class="gap-lg flex flex-col">
		{#each [{ name: 'Extended history', description: 'Keep a longer view of project decisions.', price: '$10 / workspace' }, { name: 'Additional guest seats', description: 'Bring outside collaborators into the work.', price: '$5 / guest' }] as addon (addon.name)}<div
				class="gap-lg border-neutral-muted pt-lg flex flex-wrap items-center justify-between border-t"
			>
				<div>
					<strong>{addon.name}</strong>
					<p class="mt-sm text-neutral/70 text-sm">{addon.description}</p>
				</div>
				<Chip variant="outline">{addon.price}</Chip>
			</div>{/each}
	</div>
</section>
