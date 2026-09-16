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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">The library</p>
		<Heading size="h2" weight="bold">A useful place to start.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			Practical ideas, clear explanations, and a few good questions for your next project.
		</p>
	</header>
	<div class="gap-xl grid md:grid-cols-2">
		<div class="gap-xl p-xl bg-primary-muted flex flex-col rounded-lg">
			<Chip class="w-fit" variant="soft">Start here</Chip><Heading size="h3"
				>Good design is a series of good decisions.</Heading
			>
			<p class="text-neutral/70">
				Our field guides connect the principles of design with the daily work of making things.
				Choose a topic and explore at your own pace.
			</p>
			<Button href="/docs" class="self-start">Explore the guide ↗</Button>
		</div>
		<div class="gap-lg grid sm:grid-cols-2">
			{#each topics as topic (topic.title)}<Card
					href="/docs"
					title={topic.title}
					description={topic.description}
					><p class="text-primary-readable text-xs tracking-widest uppercase">
						{topic.count} articles ↗
					</p></Card
				>{/each}
		</div>
	</div>
</section>
