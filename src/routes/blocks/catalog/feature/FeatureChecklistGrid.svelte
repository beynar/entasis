<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { checkIcon } from 'svelai/icons/check';
	import { cursorClickIcon } from 'svelai/icons/cursorClick';
	import { paletteIcon } from 'svelai/icons/palette';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { slidersHorizontalIcon } from 'svelai/icons/slidersHorizontal';
	const features = [
		{
			title: 'One visual language',
			description: 'Make your product feel coherent from the first screen.',
			icon: paletteIcon,
			points: ['Shared semantic colors', 'A consistent spacing rhythm', 'Theme-aware surfaces']
		},
		{
			title: 'State that makes sense',
			description: 'Keep the interaction close to the feature it belongs to.',
			icon: slidersHorizontalIcon,
			points: [
				'Clear values and callbacks',
				'Predictable disclosure patterns',
				'Native event handlers'
			]
		},
		{
			title: 'Compose with confidence',
			description: 'Start with a useful piece and build the next one around it.',
			icon: puzzlePieceIcon,
			points: ['Public component imports', 'Focused examples', 'Readable source']
		},
		{
			title: 'A path for every person',
			description: 'Design for the different ways people use the web.',
			icon: cursorClickIcon,
			points: ['Keyboard-friendly controls', 'Visible focus', 'Responsive compositions']
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="mx-auto max-w-2xl text-center">
		<Chip variant="outline">A considered toolkit</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">Everything should work together.</Heading
		>
	</div>
	<div class="gap-lg grid sm:grid-cols-2">
		{#each features as feature (feature.title)}<Card variant="outline"
				><Stack gap="lg"
					><span class="text-primary-readable">{@render feature.icon({ size: 30 })}</span><Heading
						as="h3"
						size="h4">{feature.title}</Heading
					>
					<p class="text-neutral/70">{feature.description}</p>
					<Separator />
					<ul class="gap-md flex flex-col">
						{#each feature.points as point (point)}<li class="gap-sm flex text-sm">
								<span class="text-success">{@render checkIcon()}</span>{point}
							</li>{/each}
					</ul></Stack
				></Card
			>{/each}
	</div>
</section>
