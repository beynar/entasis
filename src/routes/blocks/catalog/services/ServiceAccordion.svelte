<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Accordion } from 'svelai/accordion';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { checkIcon } from 'svelai/icons/check';
	const services = [
		{
			id: 'strategy',
			title: '01 · Product strategy',
			description: 'A focused engagement to agree on the problem and choose a direction.',
			scope: ['Stakeholder conversations', 'Customer context', 'Opportunity framing'],
			outcome: 'A shared brief and a practical path into the work.',
			href: '/docs'
		},
		{
			id: 'design',
			title: '02 · Experience design',
			description: 'Make the core flow tangible and learn from the way people use it.',
			scope: ['Information structure', 'Interaction design', 'Working prototypes'],
			outcome: 'A coherent experience, ready for the next round of learning.',
			href: '/blocks'
		},
		{
			id: 'system',
			title: '03 · Design systems',
			description: 'Turn shared decisions into useful, maintainable building blocks.',
			scope: ['Component architecture', 'Visual tokens', 'Usage documentation'],
			outcome: 'A foundation that helps the whole team build with confidence.',
			href: '/components'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-3">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">A connected practice</Chip><Heading as="h2" size="h2" weight="bold"
			>Start with the challenge you have.</Heading
		>
		<p class="text-neutral/70">
			Explore the work inside each discipline and the result it should create.
		</p>
	</div>
	<Accordion class="md:col-span-2" items={services} defaultValue={['strategy']} icon="plus-minus"
		>{#snippet content({ item })}<div class="gap-lg grid sm:grid-cols-2">
				<div class="gap-lg flex flex-col">
					<p class="text-neutral/70">{item.description}</p>
					<ul class="gap-sm flex flex-col">
						{#each item.scope as detail (detail)}<li class="gap-sm flex text-sm">
								<span class="text-primary-readable">{@render checkIcon()}</span>{detail}
							</li>{/each}
					</ul>
				</div>
				<Card variant="soft" color="primary" title="The outcome"
					><Stack gap="lg"
						><p>{item.outcome}</p>
						<Button href={item.href} variant="outline" size="small">Explore examples</Button></Stack
					></Card
				>
			</div>{/snippet}</Accordion
	>
</section>
