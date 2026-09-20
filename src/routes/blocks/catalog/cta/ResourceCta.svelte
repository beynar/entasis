<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowRightIcon } from 'entasis/icons/arrowRight';
	import { arrowUpRightIcon } from 'entasis/icons/arrowUpRight';
	import { bookOpenIcon } from 'entasis/icons/bookOpen';
	import { paletteIcon } from 'entasis/icons/palette';
	import { squaresFourIcon } from 'entasis/icons/squaresFour';
</script>

<section class="gap-xl p-lg md:p-xl mx-auto grid max-w-6xl md:grid-cols-2">
	<div class="gap-xl flex flex-col items-start">
		<Chip variant="outline">Keep the momentum</Chip><Heading as="h2" size="h1" weight="bold"
			>Where will you take it from here?</Heading
		>
		<p class="text-neutral/70 text-lg">
			There is more than one good place to start. Find the one that fits how you like to work.
		</p>
		<Button href="/components" suffix={arrowRightIcon}>Explore the library</Button>
	</div>
	<div class="gap-md flex flex-col">
		{#each [{ title: 'Understand the foundations', description: 'A practical introduction to the shared system.', href: '/docs', icon: bookOpenIcon }, { title: 'Learn from a working example', description: 'Complete patterns, made from familiar components.', href: '/blocks', icon: squaresFourIcon }, { title: 'Find your visual language', description: 'Build a palette that belongs to your product.', href: '/colors', icon: paletteIcon }] as resource (resource.title)}<Card
				href={resource.href}
				variant="outline"
				><div class="gap-lg flex items-center">
					<span class="text-primary-readable">{@render resource.icon({ size: 28 })}</span>
					<div class="flex-1">
						<strong>{resource.title}</strong>
						<p class="mt-sm text-neutral/70 text-sm">{resource.description}</p>
					</div>
					{@render arrowUpRightIcon()}
				</div></Card
			>{/each}
	</div>
</section>
