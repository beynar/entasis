<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Avatar } from 'entasis/avatar';
	import { Button } from 'entasis/button';
	import { Separator } from 'entasis/separator';
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
			The work, in their words
		</p>
		<Heading size="h2" weight="bold">Better experiences. Measurable results.</Heading>
	</header>
	{#each stories.slice(0, 2) as story (story.company)}<div
			class="gap-xl grid md:grid-cols-[1fr_2fr]"
		>
			<div class="gap-md flex flex-col">
				<strong class="text-primary-readable text-5xl font-light">{story.metric}</strong><span
					class="text-neutral/70">{story.label}</span
				>
				<h3 class="mt-lg text-xl font-semibold">{story.company}</h3>
			</div>
			<div class="gap-xl flex flex-col">
				<blockquote class="text-2xl leading-relaxed">“{story.quote}”</blockquote>
				<div class="gap-lg flex flex-wrap items-center justify-between">
					<div class="gap-md flex items-center">
						<Avatar name={story.company + ' team'} /><span class="text-neutral/70 text-sm"
							>The {story.company} product team</span
						>
					</div>
					<Button href="/docs" variant="link">Explore the story ↗</Button>
				</div>
			</div>
		</div>
		<Separator />{/each}
</section>
