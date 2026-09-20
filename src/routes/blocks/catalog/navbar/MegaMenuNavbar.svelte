<script lang="ts">
	import { Stack } from 'entasis/stack';
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Popover } from 'entasis/popover';
	import { caretDownIcon } from 'entasis/icons/caretDown';
	import { listChecksIcon } from 'entasis/icons/listChecks';
	import { paletteIcon } from 'entasis/icons/palette';
	import { puzzlePieceIcon } from 'entasis/icons/puzzlePiece';
	import { squaresFourIcon } from 'entasis/icons/squaresFour';
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

<section class="bg-surface-recessed min-h-96">
	<header
		class="gap-lg border-neutral-muted bg-surface p-lg flex flex-wrap items-center justify-between border-b"
	>
		<a href="/" class="text-xl font-semibold">Northstar®</a>
		<div class="gap-sm flex items-center">
			<Popover
				trigger={{ content: 'Explore', variant: 'ghost', suffix: caretDownIcon }}
				position="bottom"
				lockScroll={false}
				class="max-w-3xl"
				><div class="gap-lg grid sm:grid-cols-3">
					<Card color="primary" variant="soft" class="sm:col-span-1" title="A thoughtful foundation"
						><Stack gap="lg"
							><p class="text-sm">
								Start with the patterns that make the whole product feel coherent.
							</p>
							<Button href="/docs" variant="outline" size="small">Get started</Button></Stack
						></Card
					>
					<nav aria-label="Product menu" class="gap-sm grid sm:col-span-2 sm:grid-cols-2">
						{#each links as link (link.href)}<Card
								href={link.href}
								variant="ghost"
								density="compact"
								><Stack gap="lg"
									><span class="text-primary-readable">{@render link.icon({ size: 24 })}</span
									><strong>{link.title}</strong>
									<p class="text-neutral/70 text-xs">{link.description}</p></Stack
								></Card
							>{/each}
					</nav>
				</div></Popover
			><Button href="/docs" variant="ghost">Guides</Button><Button href="/components" size="small"
				>Build</Button
			>
		</div>
	</header>
	<div class="gap-lg p-xl mx-auto flex max-w-2xl flex-col text-center">
		<Chip class="self-center" variant="outline">Discover the details</Chip><Heading
			as="h2"
			size="h2">A clear path into the product.</Heading
		>
		<p class="text-neutral/70">
			Open Explore to find the component, pattern, or principle you need.
		</p>
	</div>
</section>
