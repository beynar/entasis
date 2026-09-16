<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { checkIcon } from 'svelai/icons/check';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-5xl flex-col">
	<Heading as="h2" size="h2" weight="bold">Good work starts with a clear agreement.</Heading>
	<div class="gap-lg grid md:grid-cols-2">
		{#each [{ name: 'A focused sprint', description: 'For a specific question or a well-defined product moment.', price: '$3,200', period: 'per two-week sprint', details: ['One clear outcome', 'Dedicated discovery and design', 'Two review sessions', 'Source files and handoff notes'] }, { name: 'A steady partnership', description: 'For a team with a growing list of meaningful challenges.', price: '$5,600', period: 'per month', details: ['One active request at a time', 'Weekly working sessions', 'Ongoing product context', 'Flexible monthly rhythm'] }] as plan, index (plan.name)}<Card
				variant={index === 1 ? 'soft' : 'outline'}
				color={index === 1 ? 'primary' : 'neutral'}
				><Stack gap="lg"
					><Chip class="self-start" variant="outline"
						>{index === 0 ? 'A clear beginning' : 'Room to keep going'}</Chip
					><Heading as="h3" size="h3">{plan.name}</Heading>
					<p class="text-neutral/70">{plan.description}</p>
					<div>
						<strong class="text-5xl">{plan.price}</strong>
						<p class="mt-sm text-neutral/70 text-sm">{plan.period}</p>
					</div>
					<Separator />
					<ul class="gap-md flex flex-col">
						{#each plan.details as detail (detail)}<li class="gap-sm flex text-sm">
								<span class="text-primary-readable">{@render checkIcon()}</span>{detail}
							</li>{/each}
					</ul>
					<Button href="/docs" variant={index === 1 ? 'solid' : 'outline'}
						>Explore the arrangement</Button
					></Stack
				></Card
			>{/each}
	</div>
	<p class="text-neutral/65 text-xs">Example rates for an illustrative studio.</p>
</section>
