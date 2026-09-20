<script lang="ts">
	import { Button } from 'entasis/button';
	import { Heading } from 'entasis/heading';
	import { Separator } from 'entasis/separator';
	import { arrowsOutIcon } from 'entasis/icons/arrowsOut';
	import { checkCircleIcon } from 'entasis/icons/checkCircle';
	import { cursorClickIcon } from 'entasis/icons/cursorClick';
	import { paletteIcon } from 'entasis/icons/palette';
	import { puzzlePieceIcon } from 'entasis/icons/puzzlePiece';
	import { textAlignLeftIcon } from 'entasis/icons/textAlignLeft';
	const features = [
		{
			title: 'A familiar rhythm',
			description: 'Spacing and type that make a screen easier to scan.',
			icon: textAlignLeftIcon
		},
		{
			title: 'Useful feedback',
			description: 'Clear states for the moments between an action and its result.',
			icon: checkCircleIcon
		},
		{
			title: 'Room to adapt',
			description: 'A composition that grows with your actual content.',
			icon: arrowsOutIcon
		},
		{
			title: 'Meaningful color',
			description: 'Colors that communicate purpose and follow your theme.',
			icon: paletteIcon
		},
		{
			title: 'A clear next step',
			description: 'Controls that make the available actions easy to find.',
			icon: cursorClickIcon
		},
		{
			title: 'A shared foundation',
			description: 'Reusable patterns that keep your product coherent.',
			icon: puzzlePieceIcon
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-xl flex flex-wrap items-end justify-between">
		<div class="max-w-xl">
			<Heading as="h2" size="h2" weight="bold">The details that make a product feel right.</Heading>
			<p class="mt-lg text-neutral/70">
				A small collection of thoughtful choices, carried through the whole experience.
			</p>
		</div>
		<Button href="/components" variant="outline">Explore every component</Button>
	</div>
	<Separator />
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-3">
		{#each features as feature (feature.title)}<div class="gap-lg flex flex-col items-start">
				<div class="bg-primary-muted p-md text-primary-readable rounded-lg">
					{@render feature.icon({ size: 26 })}
				</div>
				<Heading as="h3" size="h4">{feature.title}</Heading>
				<p class="text-neutral/70 text-sm">{feature.description}</p>
			</div>{/each}
	</div>
</section>
