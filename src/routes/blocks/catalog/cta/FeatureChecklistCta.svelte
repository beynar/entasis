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
		><div class="gap-xl grid md:grid-cols-2">
			<div class="gap-xl flex flex-col items-start">
				<Chip variant="outline">Your next starting point</Chip><Heading
					as="h2"
					size="h2"
					weight="bold">Build the part that makes your product different.</Heading
				><Button href="/components" suffix={arrowRightIcon}>Explore the components</Button>
			</div>
			<div class="gap-lg flex flex-col justify-center">
				{#each ['Consistent state and callback patterns', 'A theme that reaches every component', 'Responsive layouts from the first draft', 'Examples you can read, adapt, and own'] as feature (feature)}<div
						class="gap-md flex items-center"
					>
						<span class="text-primary-readable">{@render checkCircleIcon()}</span><span
							>{feature}</span
						>
					</div>{/each}<Separator />
				<p class="text-neutral/70 text-sm">Start small. Compose what you need.</p>
			</div>
		</div></Card
	>
</section>
