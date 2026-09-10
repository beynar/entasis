<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	const steps = [
		{
			title: 'Find the real question',
			description:
				'Listen to the people closest to the problem. Make the desired outcome specific enough to guide a decision.',
			tags: ['Interviews', 'Context', 'Brief']
		},
		{
			title: 'Make the idea tangible',
			description:
				'Turn the strongest direction into a small working version. Give the team something real to react to.',
			tags: ['Concept', 'Prototype', 'Content']
		},
		{
			title: 'Learn in the open',
			description:
				'Bring the work back to the people who will use it. Notice where the experience helps and where it gets in the way.',
			tags: ['Review', 'Evidence', 'Iteration']
		},
		{
			title: 'Build what matters',
			description:
				'Keep the useful parts, refine the rough edges, and make the next decision with a little more clarity.',
			tags: ['Craft', 'Delivery', 'Learning']
		}
	];
</script>

<section class="mx-auto grid max-w-6xl gap-xl p-lg md:grid-cols-3 md:p-xl">
	<div class="flex flex-col items-start gap-xl md:sticky md:top-0 md:self-start">
		<Chip variant="outline">How we work</Chip><Heading as="h2" size="h2" weight="bold"
			>A good process makes room for discovery.</Heading
		>
		<p class="text-neutral/70">
			Clear steps. Useful conversations. Space to change your mind when the evidence changes.
		</p>
		<Button href="/blocks" variant="outline">See the work in context</Button>
	</div>
	<div class="flex flex-col md:col-span-2">
		{#each steps as step, index (step.title)}<div
				class="grid gap-lg border-t border-neutral-muted py-xl sm:grid-cols-4"
			>
				<div class="text-5xl font-light text-primary/60">0{index + 1}</div>
				<div class="flex flex-col gap-lg sm:col-span-3">
					<Heading as="h3" size="h3">{step.title}</Heading>
					<p class="text-neutral/70">{step.description}</p>
					<div class="flex flex-wrap gap-sm">
						{#each step.tags as tag (tag)}<Chip variant="outline" size="small">{tag}</Chip>{/each}
					</div>
				</div>
			</div>{/each}
	</div>
</section>
