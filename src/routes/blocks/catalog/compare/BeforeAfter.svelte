<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
	import { minusCircleIcon } from 'svelai/icons/minusCircle';
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<Heading as="h2" size="h2" align="center" weight="bold">Bring the work back together.</Heading>
	<div class="grid gap-lg md:grid-cols-2">
		<Card variant="outline" title="When work is scattered" description="A familiar kind of friction"
			><ul class="flex flex-col gap-lg">
				{#each ['Decisions disappear into long threads', 'The latest file is hard to find', 'Every project starts with another setup', 'Progress lives in someone’s head'] as pain (pain)}<li
						class="flex gap-md text-neutral/60"
					>
						<span>{@render minusCircleIcon()}</span>{pain}
					</li>{/each}
			</ul></Card
		><Card
			variant="soft"
			color="primary"
			title="When the context is shared"
			description="A clearer way forward"
			><ul class="flex flex-col gap-lg">
				{#each ['Decisions stay beside the work', 'One home for the current version', 'Useful patterns carry into the next project', 'Everyone can see the next step'] as benefit (benefit)}<li
						class="flex gap-md"
					>
						<span class="text-primary">{@render checkCircleIcon()}</span>{benefit}
					</li>{/each}
			</ul></Card
		>
	</div>
	<p class="max-w-2xl self-center text-center text-neutral/70">
		The goal is simple: less time finding the work, more time making it good.
	</p>
	<Button href="/blocks" class="self-center">See it in practice</Button>
</section>
