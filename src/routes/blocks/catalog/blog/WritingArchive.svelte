<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Selected writing</p>
		<Heading size="h2" weight="bold">The archive.</Heading>
		<p class="max-w-2xl text-neutral/65">Collected notes, essays, and useful observations.</p>
	</header>
	{#each ['2026', '2025'] as year, yearIndex (year)}<div
			class="grid gap-xl md:grid-cols-[9rem_1fr]"
		>
			<p class="text-4xl font-light text-neutral/35">{year}</p>
			<div>
				{#each posts.slice(yearIndex, yearIndex + 3) as post (post.title)}<a
						href="/docs"
						class="group flex items-center justify-between gap-lg border-b border-neutral/15 py-xl"
						><div class="flex flex-col gap-sm">
							<span class="text-xs text-neutral/60">{post.date.slice(0, 5)}</span>
							<h3 class="text-lg font-medium group-hover:text-primary">{post.title}</h3>
						</div>
						<Chip color="neutral" variant="outline" size="small">{post.category}</Chip></a
					>{/each}
			</div>
		</div>{/each}
</section>
