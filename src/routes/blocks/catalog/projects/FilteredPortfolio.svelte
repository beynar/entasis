<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { Chip } from 'svelai/chip';
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
	let filter = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Portfolio</p>
		<Heading size="h2" weight="bold">Different challenges. A considered approach.</Heading>
	</header>
	<Tabbar items={['All work', 'Architecture', 'Photography', 'Identity']} bind:value={filter} />
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
		{#each projects.filter((project) => filter === 0 || project.category === ['', 'Architecture', 'Photography', 'Identity'][filter]) as project (project.title)}<a
				href="/docs"
				class="flex flex-col gap-lg"
				><img
					src={`https://images.unsplash.com/photo-${project.photo}?auto=format&fit=crop&w=800&q=80`}
					alt={project.title}
					loading="lazy"
					class="aspect-[3/4] w-full rounded-lg object-cover"
				/>
				<div class="flex gap-lg items-center justify-between">
					<h3 class="text-lg font-semibold">{project.title}</h3>
					<span aria-hidden="true">↗</span>
				</div>
				<Chip variant="soft" color="neutral" class="w-fit" size="small">{project.category}</Chip></a
			>{/each}
	</div>
</section>
