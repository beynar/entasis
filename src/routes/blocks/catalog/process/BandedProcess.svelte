<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	const steps = [
		{
			title: 'Understand',
			description:
				'Bring the problem, the people, and the constraints into focus before choosing a direction.',
			outcome: 'A shared brief with a clear outcome.'
		},
		{
			title: 'Explore',
			description:
				'Make a few useful possibilities tangible. Learn which direction deserves the next investment.',
			outcome: 'A working prototype and real feedback.'
		},
		{
			title: 'Create',
			description:
				'Bring the chosen direction into the details, with the care that makes it useful every day.',
			outcome: 'A product your team can build on.'
		}
	];
</script>

<section class="flex flex-col p-lg md:p-xl">
	<div class="pb-xl">
		<Heading as="h2" size="h2" weight="bold"
			>From a useful question to a thoughtful product.</Heading
		>
	</div>
	{#each steps as step, index (step.title)}<div
			class={'grid gap-xl p-xl md:grid-cols-3 ' +
				['bg-primary-muted', 'bg-secondary-muted', 'bg-surface-recessed'][index]}
		>
			<div class="flex items-start gap-lg">
				<span class="text-sm">0{index + 1}</span><Heading as="h3" size="h3">{step.title}</Heading>
			</div>
			<p class="text-neutral/70">{step.description}</p>
			<Card variant="ghost" density="small" title="What you leave with"
				><p class="font-medium">{step.outcome}</p></Card
			>
		</div>{/each}<Button href="/docs" class="mt-xl self-start" variant="outline"
		>Explore the approach</Button
	>
</section>
