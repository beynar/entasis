<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
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
			Selected work
		</p>
		<Heading size="h2" weight="bold">Good things, made together.</Heading>
	</header>
	<div class="gap-xl grid md:grid-cols-2">
		{#each projects as project (project.title)}<a href="/docs" class="group gap-lg flex flex-col"
				><div class="overflow-hidden rounded-lg">
					<img
						src={`https://images.unsplash.com/photo-${project.photo}?auto=format&fit=crop&w=900&q=80`}
						alt={project.title}
						loading="lazy"
						class="aspect-[4/3] w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
					/>
				</div>
				<div class="gap-lg flex items-center justify-between">
					<div>
						<h3 class="text-xl font-semibold">{project.title}</h3>
						<p class="mt-sm text-neutral/65 text-sm">{project.category}</p>
					</div>
					<Chip variant="outline" color="neutral" size="small">{project.year} ↗</Chip>
				</div></a
			>{/each}
	</div>
</section>
