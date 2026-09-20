<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Customer stories
		</p>
		<Heading size="h2" weight="bold">Small details. Real impact.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			Three teams, three different challenges, one considered approach.
		</p>
	</header>
	<div class="gap-xl grid md:grid-cols-3">
		{#each stories as story (story.company)}<Card
				><div class="gap-xl flex flex-col">
					<div class="gap-md flex items-center justify-between">
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
						<strong class="text-primary-readable text-3xl font-semibold">{story.metric}</strong><br
						/><span class="text-neutral/70">{story.label}</span>
					</p>
					<Button href="/docs" variant="link" class="self-start">Read story ↗</Button>
				</div></Card
			>{/each}
	</div>
</section>
