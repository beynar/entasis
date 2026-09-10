<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	import { bookOpenIcon } from 'svelai/icons/bookOpen';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { squaresFourIcon } from 'svelai/icons/squaresFour';
	const channels = [
		{
			title: 'Getting started',
			description: 'The essentials, explained one step at a time.',
			href: '/docs',
			action: 'Read the guides',
			icon: bookOpenIcon
		},
		{
			title: 'Build a feature',
			description: 'Explore the components that fit your next idea.',
			href: '/components',
			action: 'Find a component',
			icon: puzzlePieceIcon
		},
		{
			title: 'See the bigger picture',
			description: 'Complete interface patterns to learn from and adapt.',
			href: '/blocks',
			action: 'Browse the blocks',
			icon: squaresFourIcon
		}
	];
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="max-w-xl">
		<Chip variant="soft">Let's talk</Chip><Heading as="h2" size="h1" weight="bold" class="mt-xl"
			>A good question opens a door.</Heading
		>
		<p class="mt-lg text-neutral/70">
			Find the right place to start, whether you are exploring, building, or looking for a new
			pattern.
		</p>
	</div>
	<div class="grid gap-lg md:grid-cols-3">
		{#each channels as channel (channel.title)}<Card variant="outline"
				><div class="flex min-h-60 flex-col items-start gap-lg">
					<span class="text-primary">{@render channel.icon({ size: 32 })}</span><Heading
						as="h3"
						size="h4">{channel.title}</Heading
					>
					<p class="flex-1 text-neutral/70">{channel.description}</p>
					<Button href={channel.href} variant="link" suffix={arrowRightIcon}
						>{channel.action}</Button
					>
				</div></Card
			>{/each}
	</div>
</section>
