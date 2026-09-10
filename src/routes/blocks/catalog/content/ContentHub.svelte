<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const topics = [
		{ title: 'Foundations', description: 'The principles beneath the pixels.', count: 8 },
		{ title: 'Interaction', description: 'Make the next step feel natural.', count: 12 },
		{ title: 'Content', description: 'Clarity begins with language.', count: 6 },
		{ title: 'Practice', description: 'Useful ways to do good work.', count: 9 }
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">The library</p>
		<Heading size="h2" weight="bold">A useful place to start.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Practical ideas, clear explanations, and a few good questions for your next project.
		</p>
	</header>
	<div class="grid gap-xl md:grid-cols-2">
		<div class="flex flex-col gap-xl p-xl rounded-lg bg-primary-muted">
			<Chip class="w-fit" variant="soft">Start here</Chip><Heading size="h3"
				>Good design is a series of good decisions.</Heading
			>
			<p class="text-neutral/70">
				Our field guides connect the principles of design with the daily work of making things.
				Choose a topic and explore at your own pace.
			</p>
			<Button href="/docs" class="self-start">Explore the guide ↗</Button>
		</div>
		<div class="grid gap-lg sm:grid-cols-2">
			{#each topics as topic (topic.title)}<Card
					href="/docs"
					title={topic.title}
					description={topic.description}
					><p class="text-xs uppercase tracking-widest text-primary">
						{topic.count} articles ↗
					</p></Card
				>{/each}
		</div>
	</div>
</section>
