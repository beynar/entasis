<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const stories = [
		{
			company: 'Northstar',
			category: 'Commerce',
			title: 'A calmer path from browsing to buying.',
			metric: '+34%',
			label: 'conversion rate',
			quote: 'We made the essentials easy to find, and gave every detail room to breathe.',
			photo: '1494526585095-c41746248156'
		},
		{
			company: 'Forma',
			category: 'SaaS',
			title: 'An interface that grows with the team.',
			metric: '2.4×',
			label: 'faster onboarding',
			quote: 'A shared design language changed the way our product team works.',
			photo: '1500534314209-a25ddb2bd429'
		},
		{
			company: 'Evergreen',
			category: 'Climate',
			title: 'Making a complex mission feel simple.',
			metric: '−42%',
			label: 'support requests',
			quote: 'People can understand their impact without reading a manual.',
			photo: '1464822759023-fed622ff2c3b'
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Customer stories</p>
		<Heading size="h2" weight="bold">Small details. Real impact.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Three teams, three different challenges, one considered approach.
		</p>
	</header>
	<div class="grid gap-xl md:grid-cols-3">
		{#each stories as story (story.company)}<Card
				><div class="flex flex-col gap-xl">
					<div class="flex gap-md items-center justify-between">
						<h3 class="text-xl font-semibold">{story.company}</h3>
						<Chip size="small" variant="soft" color="neutral">{story.category}</Chip>
					</div>
					<img
						src={`https://images.unsplash.com/photo-${story.photo}?auto=format&fit=crop&w=700&q=80`}
						alt={story.company + ' story landscape'}
						loading="lazy"
						class="aspect-[4/3] w-full rounded-lg object-cover"
					/>
					<h4 class="text-lg font-medium">{story.title}</h4>
					<p>
						<strong class="text-3xl font-semibold text-primary">{story.metric}</strong><br /><span
							class="text-neutral/60">{story.label}</span
						>
					</p>
					<Button href="/docs" variant="link" class="self-start">Read story ↗</Button>
				</div></Card
			>{/each}
	</div>
</section>
