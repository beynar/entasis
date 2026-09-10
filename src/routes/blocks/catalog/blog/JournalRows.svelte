<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">From the studio</p>
		<Heading size="h2" weight="bold">Stories worth your time.</Heading>
		<p class="max-w-2xl text-neutral/65">Explore our latest thinking and practical field notes.</p>
	</header>
	<div class="flex flex-col gap-xl">
		{#each posts.slice(0, 3) as post (post.title)}<article
				class="grid gap-lg border-t border-neutral/15 pt-xl sm:grid-cols-[14rem_1fr_auto]"
			>
				<img
					src={`https://images.unsplash.com/photo-${post.photo}?auto=format&fit=crop&w=900&q=80`}
					alt={post.title}
					loading="lazy"
					class="aspect-[3/2] w-full rounded-lg object-cover"
				/>
				<div class="flex flex-col gap-md items-start">
					<Chip size="small" color="neutral" variant="soft">{post.category}</Chip>
					<h3 class="text-xl font-semibold">{post.title}</h3>
					<p class="text-neutral/60">{post.excerpt}</p>
					<p class="text-xs text-neutral/50">{post.author} · {post.time}</p>
				</div>
				<Button href="/docs" variant="outline" class="self-center">Read ↗</Button>
			</article>{/each}
	</div>
</section>
