<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-2">
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
			<p class="text-neutral/65 text-xs">Illustrative studio pricing.</p></Stack
		></Card
	>
	<div class="gap-xl flex flex-col justify-center">
		{#each [{ title: 'Share the next challenge', description: 'Bring a clear brief or a question we can shape together.' }, { title: 'Work in a steady rhythm', description: 'Review progress twice a week and keep the feedback close.' }, { title: 'Keep what moves you forward', description: 'Receive the files, context, and decisions your team needs.' }] as step, index (step.title)}<div
				class="gap-lg flex"
			>
				<Chip variant="outline" class="self-start">0{index + 1}</Chip>
				<div>
					<Heading as="h3" size="h4">{step.title}</Heading>
					<p class="mt-md text-neutral/70">{step.description}</p>
				</div>
			</div>{/each}
	</div>
</section>
