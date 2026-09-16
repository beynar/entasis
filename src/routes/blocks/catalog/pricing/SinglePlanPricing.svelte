<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	const groups = [
		{
			title: 'A place for the work',
			features: [
				'Unlimited projects',
				'Flexible project views',
				'Shared documents',
				'File attachments',
				'Reusable templates'
			]
		},
		{
			title: 'A place for the team',
			features: [
				'Team workspace',
				'Guest collaboration',
				'Project permissions',
				'Activity history',
				'Workspace insights'
			]
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<div class="max-w-2xl">
		<Chip variant="outline">One plan. Room to do good work.</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Everything your team needs to find its rhythm.</Heading
		>
	</div>
	<Card variant="outline"
		><div class="gap-xl grid md:grid-cols-3">
			<div class="gap-xl flex flex-col items-start">
				<Heading as="h3" size="h3">The complete workspace</Heading>
				<p class="text-neutral/70 text-sm">For a small team with big ideas.</p>
				<div>
					<strong class="text-5xl">$29</strong>
					<p class="mt-sm text-neutral/70 text-sm">per person, per month</p>
				</div>
				<Button href="/docs" fullWidth>Explore the workspace</Button>
			</div>
			<div class="gap-xl grid sm:grid-cols-2 md:col-span-2">
				{#each groups as group (group.title)}<div class="gap-lg flex flex-col">
						<Heading as="h4" size="h5">{group.title}</Heading>
						<ul class="gap-lg flex flex-col">
							{#each group.features as feature (feature)}<li class="gap-sm flex text-sm">
									<span class="text-primary-readable">{@render checkCircleIcon()}</span>{feature}
								</li>{/each}
						</ul>
					</div>{/each}
			</div>
		</div></Card
	>
	<p class="text-neutral/70 text-center text-sm">
		A straightforward example plan. All the context before the commitment.
	</p>
</section>
