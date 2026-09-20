<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { arrowUpRightIcon } from 'entasis/icons/arrowUpRight';
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

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-6xl flex-col">
	<div class="gap-lg flex flex-wrap items-end justify-between">
		<Heading as="h2" size="h1" weight="bold">Good ideas.<br />Useful execution.</Heading>
		<p class="text-neutral/70 max-w-sm">
			We connect the strategy, the experience, and the system that helps it grow.
		</p>
	</div>
	{#each services as service, index (service.title)}<div
			class="gap-xl border-neutral-muted py-xl grid items-start border-t md:grid-cols-3"
		>
			<div class="gap-lg flex items-start">
				<span class="text-neutral/65 text-sm">0{index + 1}</span><Heading as="h3" size="h3"
					>{service.title}</Heading
				>
			</div>
			<p class="text-neutral/70">{service.description}</p>
			<div class="gap-lg flex flex-col items-start">
				<div class="gap-sm flex flex-wrap">
					{#each service.tags as tag (tag)}<Chip size="small" variant="outline">{tag}</Chip>{/each}
				</div>
				<Button href={service.href} variant="link" suffix={arrowUpRightIcon}>Explore</Button>
			</div>
		</div>{/each}
</section>
