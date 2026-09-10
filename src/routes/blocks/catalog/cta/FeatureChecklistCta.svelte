<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { checkCircleIcon } from 'svelai/icons/checkCircle';
</script>

<section class="p-lg md:p-xl">
	<Card color="primary" variant="soft"
		><div class="grid gap-xl md:grid-cols-2">
			<div class="flex flex-col items-start gap-xl">
				<Chip variant="outline">Your next starting point</Chip><Heading
					as="h2"
					size="h2"
					weight="bold">Build the part that makes your product different.</Heading
				><Button href="/components" suffix={arrowRightIcon}>Explore the components</Button>
			</div>
			<div class="flex flex-col justify-center gap-lg">
				{#each ['Consistent state and callback patterns', 'A theme that reaches every component', 'Responsive layouts from the first draft', 'Examples you can read, adapt, and own'] as feature (feature)}<div
						class="flex items-center gap-md"
					>
						<span class="text-primary">{@render checkCircleIcon()}</span><span>{feature}</span>
					</div>{/each}<Separator />
				<p class="text-sm text-neutral/60">Start small. Compose what you need.</p>
			</div>
		</div></Card
	>
</section>
