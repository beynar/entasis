<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Avatar } from 'svelai/avatar';
	import { Button } from 'svelai/button';
	import { Separator } from 'svelai/separator';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			The work, in their words
		</p>
		<Heading size="h2" weight="bold">Better experiences. Measurable results.</Heading>
	</header>
	{#each stories.slice(0, 2) as story (story.company)}<div
			class="grid gap-xl md:grid-cols-[1fr_2fr]"
		>
			<div class="flex flex-col gap-md">
				<strong class="text-5xl font-light text-primary">{story.metric}</strong><span
					class="text-neutral/60">{story.label}</span
				>
				<h3 class="mt-lg text-xl font-semibold">{story.company}</h3>
			</div>
			<div class="flex flex-col gap-xl">
				<blockquote class="text-2xl leading-relaxed">“{story.quote}”</blockquote>
				<div class="flex gap-lg items-center justify-between flex-wrap">
					<div class="flex gap-md items-center">
						<Avatar user={{ name: story.company + ' team' }} /><span class="text-sm text-neutral/60"
							>The {story.company} product team</span
						>
					</div>
					<Button href="/docs" variant="link">Explore the story ↗</Button>
				</div>
			</div>
		</div>
		<Separator />{/each}
</section>
