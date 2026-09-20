<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Tabbar } from 'entasis/tabbar';
	import { Avatar } from 'entasis/avatar';
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
	let selected = $state('All stories');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">The journal</p>
		<Heading size="h2" weight="bold">Ideas for a more considered everyday.</Heading>
		<p class="text-neutral/65 max-w-2xl">
			Notes on design, culture, and the things we choose to keep.
		</p>
	</header>
	<Tabbar items={['All stories', 'Design', 'Culture', 'Studio']} bind:value={selected} />
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-3">
		{#each posts.filter((post) => selected === 'All stories' || post.category === selected) as post (post.title)}
			<Card variant="ghost">
				<div class="gap-lg flex flex-col">
					<img
						src={`https://images.unsplash.com/photo-${post.photo}?auto=format&fit=crop&w=900&q=80`}
						alt={post.title}
						loading="lazy"
						class="aspect-[4/3] w-full rounded-lg object-cover"
					/><Chip size="small" variant="soft" class="w-fit">{post.category}</Chip>
					<h3 class="text-xl font-semibold"><a href="/docs">{post.title}</a></h3>
					<p class="text-neutral/65">{post.excerpt}</p>
					<div class="gap-sm flex items-center">
						<Avatar size="small" name={post.author} /><span>{post.author} · {post.time}</span>
					</div>
				</div>
			</Card>
		{/each}
	</div>
</section>
