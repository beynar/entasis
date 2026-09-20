<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
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

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-3">
	<div class="gap-xl flex flex-col items-start md:sticky md:top-0 md:self-start">
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
				class="gap-lg border-neutral-muted py-xl grid border-t sm:grid-cols-4"
			>
				<div class="text-primary-readable text-5xl font-light">0{index + 1}</div>
				<div class="gap-lg flex flex-col sm:col-span-3">
					<Heading as="h3" size="h3">{step.title}</Heading>
					<p class="text-neutral/70">{step.description}</p>
					<div class="gap-sm flex flex-wrap">
						{#each step.tags as tag (tag)}<Chip variant="outline" size="small">{tag}</Chip>{/each}
					</div>
				</div>
			</div>{/each}
	</div>
</section>
