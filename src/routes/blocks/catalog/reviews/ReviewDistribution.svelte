<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
	import { Rating } from 'entasis/rating';
	import { Button } from 'entasis/button';
	import { Avatar } from 'entasis/avatar';
	const reviews = [
		{
			id: 1,
			name: 'Maya Chen',
			rating: 5,
			title: 'Exactly the light I was looking for',
			body: 'Warm, easy to dim, and beautifully balanced. The lamp has become the first thing I switch on when I sit down to work.',
			product: 'Arc desk lamp',
			date: 'June 14, 2026',
			helpful: 18
		},
		{
			id: 2,
			name: 'Sam Rivera',
			rating: 4,
			title: 'A small everyday upgrade',
			body: 'The finish feels great and the light is lovely. I would have liked a slightly longer cord, but it works well on my bedside table.',
			product: 'Arc desk lamp',
			date: 'June 8, 2026',
			helpful: 9
		},
		{
			id: 3,
			name: 'Alex Morgan',
			rating: 5,
			title: 'Thoughtful from the box onwards',
			body: 'Simple packaging, easy setup, and a really satisfying touch dimmer. It feels like something I will keep for a long time.',
			product: 'Arc desk lamp',
			date: 'May 30, 2026',
			helpful: 12
		}
	];
	const distribution = [
		{ stars: 5, count: 105 },
		{ stars: 4, count: 18 },
		{ stars: 3, count: 4 },
		{ stars: 2, count: 1 },
		{ stars: 1, count: 0 }
	];
	let filter = $state(0);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Customer reviews
		</p>
		<Heading size="h2" weight="bold">A little outside perspective.</Heading>
	</header>
	<div class="gap-xl grid md:grid-cols-[15rem_1fr]">
		<aside class="gap-xl flex flex-col">
			<p class="text-5xl font-semibold">
				4.8<span class="text-neutral/65 text-lg font-normal"> / 5</span>
			</p>
			<Rating value={4.8} />
			<p class="text-neutral/65 text-sm">128 sample reviews</p>
			{#each distribution as row (row.stars)}<Button
					variant={filter === row.stars ? 'soft' : 'ghost'}
					color="neutral"
					class="w-full justify-between"
					onclick={() => (filter = filter === row.stars ? 0 : row.stars)}
					><span>{row.stars} ★</span><span class="flex-1"
						><Meter value={row.count} color="primary" max={128} /></span
					><span class="text-xs">{row.count}</span></Button
				>{/each}<Button variant="link" size="small" onclick={() => (filter = 0)}
				>Show all ratings</Button
			>
		</aside>
		<div class="gap-xl flex flex-col">
			{#each reviews.filter((review) => filter === 0 || review.rating === filter) as review (review.id)}<article
					class="gap-lg p-xl border-neutral/15 flex flex-col rounded-lg border"
				>
					<div class="gap-lg flex items-center justify-between">
						<div class="gap-md flex items-center">
							<Avatar size="small" name={review.name} /><span class="font-medium"
								>{review.name}</span
							>
						</div>
						<Rating value={review.rating} size="small" />
					</div>
					<h3 class="font-semibold">{review.title}</h3>
					<p class="text-neutral/65">{review.body}</p>
				</article>{:else}<p class="bg-surface-recessed p-xl text-neutral/70 rounded-lg">
					There are no {filter}-star reviews in this sample.
				</p>{/each}
		</div>
	</div>
</section>
