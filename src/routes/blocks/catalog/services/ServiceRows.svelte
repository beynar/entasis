<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowUpRightIcon } from 'svelai/icons/arrowUpRight';
	const services = [
		{
			title: 'Direction',
			description: 'Make the important choices clear before investing in the details.',
			tags: ['Strategy', 'Research', 'Positioning'],
			href: '/docs'
		},
		{
			title: 'Experience',
			description: 'Turn a useful idea into a product people can understand and enjoy.',
			tags: ['Flows', 'Prototypes', 'Interface'],
			href: '/blocks'
		},
		{
			title: 'Foundation',
			description: 'Build a coherent system that makes the next good decision easier.',
			tags: ['Components', 'Themes', 'Documentation'],
			href: '/components'
		}
	];
</script>

<section class="mx-auto flex max-w-6xl flex-col gap-xl p-lg md:p-xl">
	<div class="flex flex-wrap items-end justify-between gap-lg">
		<Heading as="h2" size="h1" weight="bold">Good ideas.<br />Useful execution.</Heading>
		<p class="max-w-sm text-neutral/70">
			We connect the strategy, the experience, and the system that helps it grow.
		</p>
	</div>
	{#each services as service, index (service.title)}<div
			class="grid items-start gap-xl border-t border-neutral-muted py-xl md:grid-cols-3"
		>
			<div class="flex items-start gap-lg">
				<span class="text-sm text-neutral/40">0{index + 1}</span><Heading as="h3" size="h3"
					>{service.title}</Heading
				>
			</div>
			<p class="text-neutral/70">{service.description}</p>
			<div class="flex flex-col items-start gap-lg">
				<div class="flex flex-wrap gap-sm">
					{#each service.tags as tag (tag)}<Chip size="small" variant="outline">{tag}</Chip>{/each}
				</div>
				<Button href={service.href} variant="link" suffix={arrowUpRightIcon}>Explore</Button>
			</div>
		</div>{/each}
</section>
