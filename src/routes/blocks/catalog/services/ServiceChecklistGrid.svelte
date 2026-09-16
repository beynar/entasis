<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { checkIcon } from 'svelai/icons/check';
	import { compassIcon } from 'svelai/icons/compass';
	import { paletteIcon } from 'svelai/icons/palette';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	const services = [
		{
			title: 'Product strategy',
			description: 'Find a direction your team can act on.',
			icon: compassIcon,
			deliverables: ['Research and context', 'A shared product brief', 'A focused opportunity map'],
			href: '/docs'
		},
		{
			title: 'Interface design',
			description: 'Make the experience feel clear and coherent.',
			icon: paletteIcon,
			deliverables: ['Core flows and structure', 'Interactive prototypes', 'A visual language'],
			href: '/blocks'
		},
		{
			title: 'Component systems',
			description: 'Give the next screen a thoughtful foundation.',
			icon: puzzlePieceIcon,
			deliverables: ['Shared interface primitives', 'Consistent themes', 'Practical documentation'],
			href: '/components'
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="max-w-2xl">
		<Chip variant="outline">How we can help</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">The right care, at the right moment.</Heading
		>
		<p class="mt-lg text-neutral/70">
			A small set of disciplines, connected by a shared focus on useful outcomes.
		</p>
	</div>
	<div class="gap-lg grid md:grid-cols-3">
		{#each services as service (service.title)}<Card variant="outline"
				><Stack gap="lg"
					><span class="text-primary-readable">{@render service.icon({ size: 32 })}</span><Heading
						as="h3"
						size="h4">{service.title}</Heading
					>
					<p class="text-neutral/70 text-sm">{service.description}</p>
					<Separator />
					<ul class="gap-md flex flex-col">
						{#each service.deliverables as deliverable (deliverable)}<li
								class="gap-sm flex text-sm"
							>
								<span class="text-primary-readable">{@render checkIcon()}</span>{deliverable}
							</li>{/each}
					</ul>
					<Button href={service.href} variant="link" class="self-start" suffix={arrowRightIcon}
						>Explore the practice</Button
					></Stack
				></Card
			>{/each}
	</div>
</section>
