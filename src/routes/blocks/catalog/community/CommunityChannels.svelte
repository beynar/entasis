<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
	import { bookOpenIcon } from 'svelai/icons/bookOpen';
	import { paletteIcon } from 'svelai/icons/palette';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { squaresFourIcon } from 'svelai/icons/squaresFour';
	const channels = [
		{
			title: 'Learn',
			description: 'Practical guides for making a thoughtful interface.',
			action: 'Read the guides',
			href: '/docs',
			icon: bookOpenIcon
		},
		{
			title: 'Explore',
			description: 'Find a component for the next part of your product.',
			action: 'Browse components',
			href: '/components',
			icon: squaresFourIcon
		},
		{
			title: 'Experiment',
			description: 'See how small pieces become complete workflows.',
			action: 'Explore blocks',
			href: '/blocks',
			icon: puzzlePieceIcon
		},
		{
			title: 'Make it yours',
			description: 'A shared theme that reflects your own point of view.',
			action: 'Explore color',
			href: '/colors',
			icon: paletteIcon
		}
	];
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-lg flex flex-wrap items-end justify-between">
		<div class="max-w-xl">
			<Heading as="h2" size="h2" weight="bold">Find your kind of conversation.</Heading>
			<p class="mt-lg text-neutral/70">Start wherever your curiosity takes you.</p>
		</div>
		<Chip variant="outline">Open by design</Chip>
	</div>
	<div class="gap-lg grid sm:grid-cols-2 lg:grid-cols-4">
		{#each channels as channel (channel.title)}<Card variant="outline"
				><div class="gap-lg flex min-h-60 flex-col items-start">
					<span class="text-primary-readable">{@render channel.icon({ size: 30 })}</span><Heading
						as="h3"
						size="h4">{channel.title}</Heading
					>
					<p class="text-neutral/70 flex-1 text-sm">{channel.description}</p>
					<Button href={channel.href} variant="link" suffix={arrowUpRightIcon}
						>{channel.action}</Button
					>
				</div></Card
			>{/each}
	</div>
</section>
