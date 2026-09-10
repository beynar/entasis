<script lang="ts">
	import { Accordion } from 'svelai/accordion';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
	const groups = [
		{
			id: 'build',
			title: 'Build something',
			links: [
				{ label: 'Components', href: '/components' },
				{ label: 'Blocks', href: '/blocks' },
				{ label: 'Forms', href: '/components/form' }
			]
		},
		{
			id: 'learn',
			title: 'Learn the patterns',
			links: [
				{ label: 'Documentation', href: '/docs' },
				{ label: 'Colors', href: '/colors' }
			]
		},
		{
			id: 'explore',
			title: 'Explore the details',
			links: [
				{ label: 'Buttons', href: '/components/button' },
				{ label: 'Cards', href: '/components/card' },
				{ label: 'Typography', href: '/components/heading' }
			]
		}
	];
</script>

<footer class="flex flex-col gap-xl bg-surface-recessed p-lg md:p-xl">
	<div class="grid gap-xl md:grid-cols-2">
		<div class="flex flex-col items-start gap-lg">
			<Chip variant="outline">Stay curious</Chip><Heading as="h2" size="h2" weight="bold"
				>The next good idea is one click away.</Heading
			><Button href="/blocks" variant="outline" suffix={arrowRightIcon}
				>Explore the possibilities</Button
			>
		</div>
		<Accordion items={groups} icon="math" oneAtATime={false}
			>{#snippet content({ item })}<nav
					aria-label={item.title + ' navigation'}
					class="flex flex-wrap gap-lg"
				>
					{#each item.links as link (link.href)}<a
							href={link.href}
							class="text-sm text-neutral/70 underline-offset-4 hover:underline">{link.label}</a
						>{/each}
				</nav>{/snippet}</Accordion
		>
	</div>
	<Separator />
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<span class="text-5xl font-semibold tracking-tighter sm:text-7xl">northstar.</span>
		<p class="max-w-xs text-xs text-neutral/50">
			A thoughtful foundation for the products, teams, and ideas that come next.
		</p>
	</div>
</footer>
