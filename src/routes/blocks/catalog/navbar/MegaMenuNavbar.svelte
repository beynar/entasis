<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Popover } from 'svelai/popover';
	import { caretDownIcon } from 'svelai/icons/caretDown';
	import { listChecksIcon } from 'svelai/icons/listChecks';
	import { paletteIcon } from 'svelai/icons/palette';
	import { puzzlePieceIcon } from 'svelai/icons/puzzlePiece';
	import { squaresFourIcon } from 'svelai/icons/squaresFour';
	const links = [
		{
			title: 'Components',
			description: 'The essential interface pieces.',
			href: '/components',
			icon: puzzlePieceIcon
		},
		{
			title: 'Blocks',
			description: 'Complete patterns in context.',
			href: '/blocks',
			icon: squaresFourIcon
		},
		{
			title: 'Forms',
			description: 'State, validation, and useful feedback.',
			href: '/components/form',
			icon: listChecksIcon
		},
		{
			title: 'Colors',
			description: 'A shared visual language.',
			href: '/colors',
			icon: paletteIcon
		}
	];
</script>

<section class="min-h-96 bg-surface-recessed">
	<header
		class="flex flex-wrap items-center justify-between gap-lg border-b border-neutral-muted bg-surface p-lg"
	>
		<a href="/" class="text-xl font-semibold">Northstar®</a>
		<div class="flex items-center gap-sm">
			<Popover
				trigger={{ children: 'Explore', variant: 'ghost', suffix: caretDownIcon }}
				position="bottom"
				lockScroll={false}
				class="max-w-3xl"
				><div class="grid gap-lg sm:grid-cols-3">
					<Card color="primary" variant="soft" class="sm:col-span-1" title="A thoughtful foundation"
						><Stack gap="lg"
							><p class="text-sm">
								Start with the patterns that make the whole product feel coherent.
							</p>
							<Button href="/docs" variant="outline" size="small">Get started</Button></Stack
						></Card
					>
					<nav aria-label="Product menu" class="grid gap-sm sm:col-span-2 sm:grid-cols-2">
						{#each links as link (link.href)}<Card href={link.href} variant="ghost" density="small"
								><Stack gap="lg"
									><span class="text-primary">{@render link.icon({ size: 24 })}</span><strong
										>{link.title}</strong
									>
									<p class="text-xs text-neutral/60">{link.description}</p></Stack
								></Card
							>{/each}
					</nav>
				</div></Popover
			><Button href="/docs" variant="ghost">Guides</Button><Button href="/components" size="small"
				>Build</Button
			>
		</div>
	</header>
	<div class="mx-auto flex max-w-2xl flex-col gap-lg p-xl text-center">
		<Chip class="self-center" variant="outline">Discover the details</Chip><Heading
			as="h2"
			size="h2">A clear path into the product.</Heading
		>
		<p class="text-neutral/60">
			Open Explore to find the component, pattern, or principle you need.
		</p>
	</div>
</section>
