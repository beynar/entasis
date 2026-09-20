<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
	const posts = [
		{
			title: 'Making room for the things that matter',
			category: 'Design',
			date: '06.12.2026',
			time: '6 min read',
			author: 'Maya Chen',
			photo: '1500534314209-a25ddb2bd429',
			excerpt: 'A quieter approach to spaces, objects, and the way we work.'
		},
		{
			title: 'A field guide to a slower weekend',
			category: 'Culture',
			date: '05.28.2026',
			time: '4 min read',
			author: 'Sam Rivera',
			photo: '1507525428034-b723cf961d3e',
			excerpt: 'Small rituals that bring a little more intention to ordinary days.'
		},
		{
			title: 'The creative value of getting outside',
			category: 'Studio',
			date: '05.16.2026',
			time: '8 min read',
			author: 'Alex Morgan',
			photo: '1464822759023-fed622ff2c3b',
			excerpt: 'What the landscape can teach us about attention and perspective.'
		},
		{
			title: 'Good work begins with a good question',
			category: 'Design',
			date: '04.30.2026',
			time: '5 min read',
			author: 'Maya Chen',
			photo: '1494526585095-c41746248156',
			excerpt: 'A practical guide to finding the real problem before drawing the first line.'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Selected writing
		</p>
		<Heading size="h2" weight="bold">The archive.</Heading>
		<p class="text-neutral/65 max-w-2xl">Collected notes, essays, and useful observations.</p>
	</header>
	{#each ['2026', '2025'] as year, yearIndex (year)}<div
			class="gap-xl grid md:grid-cols-[9rem_1fr]"
		>
			<p class="text-neutral/65 text-4xl font-light">{year}</p>
			<div>
				{#each posts.slice(yearIndex, yearIndex + 3) as post (post.title)}<a
						href="/docs"
						class="group gap-lg border-neutral/15 py-xl flex items-center justify-between border-b"
						><div class="gap-sm flex flex-col">
							<span class="text-neutral/70 text-xs">{post.date.slice(0, 5)}</span>
							<h3 class="group-hover:text-primary-readable text-lg font-medium">{post.title}</h3>
						</div>
						<Chip color="neutral" variant="outline" size="small">{post.category}</Chip></a
					>{/each}
			</div>
		</div>{/each}
</section>
