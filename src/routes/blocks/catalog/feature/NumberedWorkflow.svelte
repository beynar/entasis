<script lang="ts">
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	const steps = [
		{
			title: 'Agree on the outcome',
			description:
				'Start with what should change for the person using the product. Make the goal concrete.',
			label: '01 · The brief',
			preview: 'A simpler way to plan a project',
			tags: ['Outcome', 'Audience', 'Constraints']
		},
		{
			title: 'Compose a working version',
			description:
				'Use familiar components to bring the flow to life. Focus on the decisions that belong to your product.',
			label: '02 · The prototype',
			preview: 'A useful first draft',
			tags: ['Components', 'Content', 'State']
		},
		{
			title: 'Learn from real use',
			description:
				'Put the version in front of people, notice the friction, and improve the part that matters.',
			label: '03 · The review',
			preview: 'Small changes, clearer decisions',
			tags: ['Feedback', 'Evidence', 'Iteration']
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-6xl flex-col">
	<Heading as="h2" size="h2" weight="bold">A clear path from idea to interface.</Heading
	>{#each steps as step, index (step.title)}<div
			class="gap-xl border-neutral-muted py-xl grid items-center border-t md:grid-cols-2"
		>
			<div class="gap-lg flex">
				<Chip variant="outline" class="self-start">0{index + 1}</Chip>
				<div>
					<Heading as="h3" size="h3">{step.title}</Heading>
					<p class="mt-lg text-neutral/70">{step.description}</p>
				</div>
			</div>
			<Card variant="outline" color={index === 1 ? 'secondary' : 'primary'}
				><div class="gap-lg flex flex-col">
					<span class="text-xs tracking-widest uppercase">{step.label}</span><Heading
						as="h4"
						size="h4">{step.preview}</Heading
					><Meter value={(index + 1) * 32} color={index === 1 ? 'secondary' : 'primary'} />
					<div class="gap-sm flex">
						{#each step.tags as tag (tag)}<Chip size="small" variant="outline">{tag}</Chip>{/each}
					</div>
				</div></Card
			>
		</div>{/each}
</section>
