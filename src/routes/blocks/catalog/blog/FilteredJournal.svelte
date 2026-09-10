<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Tabbar } from 'svelai/tabbar';
	import { Avatar } from 'svelai/avatar';
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
	let selected = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">The journal</p>
		<Heading size="h2" weight="bold">Ideas for a more considered everyday.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Notes on design, culture, and the things we choose to keep.
		</p>
	</header>
	<Tabbar items={['All stories', 'Design', 'Culture', 'Studio']} bind:value={selected} />
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
		{#each posts.filter((post) => selected === 0 || post.category === ['', 'Design', 'Culture', 'Studio'][selected]) as post (post.title)}
			<Card variant="ghost">
				<div class="flex flex-col gap-lg">
					<img
						src={`https://images.unsplash.com/photo-${post.photo}?auto=format&fit=crop&w=900&q=80`}
						alt={post.title}
						loading="lazy"
						class="aspect-[4/3] w-full rounded-lg object-cover"
					/><Chip size="small" variant="soft" class="w-fit">{post.category}</Chip>
					<h3 class="text-xl font-semibold"><a href="/docs">{post.title}</a></h3>
					<p class="text-neutral/65">{post.excerpt}</p>
					<div class="flex gap-sm items-center">
						<Avatar size="small" user={{ name: post.author }} /><span
							>{post.author} · {post.time}</span
						>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</section>
