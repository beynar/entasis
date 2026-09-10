<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Separator } from 'svelai/separator';
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
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Fieldnotes / Issue 08
		</p>
		<Heading size="h2" weight="bold">A fresh perspective.</Heading>
	</header>
	<div class="grid gap-xl lg:grid-cols-[1.6fr_1fr]">
		<article class="flex flex-col gap-lg">
			<img
				src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&amp;fit=crop&amp;w=1100&amp;q=80"
				alt="Desert light"
				loading="lazy"
				class="aspect-video w-full rounded-lg object-cover"
			/><Chip size="small" variant="soft" class="w-fit">Editor's pick</Chip><Heading size="h3"
				>Making room for the things that matter</Heading
			>
			<p class="text-neutral/65">
				A conversation about the objects we live with, and the space between them.
			</p>
			<Button href="/docs" variant="link" class="self-start">Read the story ↗</Button>
		</article>
		<aside class="flex flex-col gap-xl">
			<h3 class="text-sm font-semibold uppercase tracking-widest">Popular this month</h3>
			{#each posts.slice(1) as post, i (post.title)}<article
					class="grid grid-cols-[auto_1fr] gap-lg"
				>
					<span class="text-3xl font-light text-neutral/30">0{i + 1}</span>
					<div class="flex flex-col gap-sm">
						<p class="text-xs text-neutral/60">{post.category} · {post.time}</p>
						<a href="/docs" class="text-lg font-medium">{post.title}</a>
					</div>
				</article>
				<Separator />{/each}
		</aside>
	</div>
</section>
