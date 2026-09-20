<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Carousel } from 'entasis/carousel';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
	const projects = [
		{
			title: 'A quieter place',
			category: 'Architecture',
			year: '2026',
			description: 'A home designed around the changing light.',
			photo: '1494526585095-c41746248156'
		},
		{
			title: 'The long way home',
			category: 'Photography',
			year: '2025',
			description: 'A collection of moments from the road.',
			photo: '1500534314209-a25ddb2bd429'
		},
		{
			title: 'Between the peaks',
			category: 'Identity',
			year: '2025',
			description: 'A new perspective for an outdoor collective.',
			photo: '1464822759023-fed622ff2c3b'
		},
		{
			title: 'Open water',
			category: 'Photography',
			year: '2024',
			description: 'A study of the coast and its rhythms.',
			photo: '1507525428034-b723cf961d3e'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			A closer look
		</p>
		<Heading size="h2" weight="bold">Projects with a point of view.</Heading>
	</header>
	<Carousel
		items={projects}
		layout={{ xs: 1, md: 2, lg: 2, xl: 2 }}
		navigationButton={{ color: 'neutral' }}
		pagination={{ variant: 'dots', color: 'primary' }}
		>{#snippet children({ item: project, index })}<article
				class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg"
			>
				<div class="text-neutral/65 flex justify-between text-xs tracking-widest uppercase">
					<span>Project 0{index + 1}</span><span>{project.year}</span>
				</div>
				<img
					src={`https://images.unsplash.com/photo-${project.photo}?auto=format&fit=crop&w=900&q=80`}
					alt={project.title}
					loading="lazy"
					class="aspect-[3/2] w-full rounded-lg object-cover"
				/>
				<h3 class="text-2xl font-semibold">{project.title}</h3>
				<p class="text-neutral/65">{project.description}</p>
				<div class="gap-md flex justify-between">
					<Chip variant="soft" size="small">{project.category}</Chip><Button
						href="/docs"
						variant="link">View project ↗</Button
					>
				</div>
			</article>{/snippet}</Carousel
	>
</section>
