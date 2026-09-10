<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
</script>

<section class="mx-auto grid max-w-6xl gap-xl p-lg md:grid-cols-2 md:p-xl">
	<Card color="primary" variant="soft"
		><Stack gap="xl"
			><Stack gap="md"
				><Chip class="self-start" variant="outline">An extension of your team</Chip><Heading
					as="h2"
					size="h2"
					weight="bold">A thoughtful design partner, month by month.</Heading
				></Stack
			>
			<Stack gap="md">
				<strong class="text-5xl">$4,800</strong>
				<p class="text-neutral/70">per month · One active request at a time</p>
			</Stack>
			<Button href="/docs" class="self-start">Explore the working model</Button>
			<p class="text-xs text-neutral/50">Illustrative studio pricing.</p></Stack
		></Card
	>
	<div class="flex flex-col justify-center gap-xl">
		{#each [{ title: 'Share the next challenge', description: 'Bring a clear brief or a question we can shape together.' }, { title: 'Work in a steady rhythm', description: 'Review progress twice a week and keep the feedback close.' }, { title: 'Keep what moves you forward', description: 'Receive the files, context, and decisions your team needs.' }] as step, index (step.title)}<div
				class="flex gap-lg"
			>
				<Chip variant="outline" class="self-start">0{index + 1}</Chip>
				<div>
					<Heading as="h3" size="h4">{step.title}</Heading>
					<p class="mt-md text-neutral/70">{step.description}</p>
				</div>
			</div>{/each}
	</div>
</section>
