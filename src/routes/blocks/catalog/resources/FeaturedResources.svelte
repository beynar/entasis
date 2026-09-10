<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Separator } from 'svelai/separator';
	const resources = [
		{
			title: 'Design system foundations',
			type: 'Guide',
			description: 'Build a useful shared language for your product team.',
			duration: '12 min read'
		},
		{
			title: 'A better component API',
			type: 'Article',
			description: 'Small contracts that make complex interfaces easier to build.',
			duration: '6 min read'
		},
		{
			title: 'Interface review checklist',
			type: 'Checklist',
			description: 'Questions to ask before an interface meets its users.',
			duration: '8 questions'
		},
		{
			title: 'Designing clear empty states',
			type: 'Article',
			description: 'Help people find the first useful action.',
			duration: '5 min read'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Learn something useful
		</p>
		<Heading size="h2" weight="bold">A little direction for your next idea.</Heading>
	</header>
	<div class="grid gap-xl lg:grid-cols-[1.4fr_1fr]">
		<article class="flex flex-col gap-xl p-xl rounded-lg bg-primary-muted">
			<img
				src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Mountain night"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/><Chip class="w-fit" variant="soft">Featured guide</Chip><Heading size="h3"
				>Design system foundations</Heading
			>
			<p class="text-neutral/70">
				A practical starting point for creating a shared language your team can use every day.
			</p>
			<Button href="/docs" class="self-start">Read the guide ↗</Button>
		</article>
		<div class="flex flex-col gap-xl">
			<p class="text-xs uppercase tracking-widest text-neutral/50">More useful reading</p>
			{#each resources.slice(1) as resource (resource.title)}<article class="flex flex-col gap-lg">
					<Chip variant="outline" color="neutral" size="small" class="w-fit">{resource.type}</Chip
					><a href="/docs" class="text-xl font-semibold">{resource.title}</a>
					<p class="text-neutral/65">{resource.description}</p>
					<p class="text-xs text-neutral/50">{resource.duration}</p>
				</article>
				<Separator />{/each}
		</div>
	</div>
</section>
