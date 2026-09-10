<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">In good company</p>
		<Heading size="h2" weight="bold">Built around their ambitions.</Heading>
	</header>
	<Carousel
		items={stories}
		layout={{ default: 1, md: 2, lg: 2, xl: 2 }}
		navigationButton={{ color: 'neutral' }}
		dots={{ color: 'primary' }}
		>{#snippet children({ item: story })}<article
				class="flex h-full flex-col overflow-hidden rounded-lg bg-surface-recessed"
			>
				<img
					src={`https://images.unsplash.com/photo-${story.photo}?auto=format&fit=crop&w=900&q=80`}
					alt={story.company + ' editorial landscape'}
					loading="lazy"
					class="aspect-video w-full object-cover"
				/>
				<div class="flex flex-col gap-xl p-xl flex-1">
					<div class="flex gap-md justify-between">
						<h3 class="text-2xl font-semibold">{story.company}</h3>
						<Chip size="small" variant="soft">{story.category}</Chip>
					</div>
					<p class="text-xl">{story.title}</p>
					<div class="flex gap-lg items-end justify-between">
						<p>
							<strong class="text-3xl">{story.metric}</strong><br /><span
								class="text-sm text-neutral/55">{story.label}</span
							>
						</p>
						<Button href="/docs" variant="outline">Read case study ↗</Button>
					</div>
				</div>
			</article>{/snippet}</Carousel
	>
</section>
