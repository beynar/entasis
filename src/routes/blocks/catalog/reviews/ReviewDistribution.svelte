<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
	import { Rating } from 'svelai/rating';
	import { Button } from 'svelai/button';
	import { Avatar } from 'svelai/avatar';
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

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Customer reviews</p>
		<Heading size="h2" weight="bold">A little outside perspective.</Heading>
	</header>
	<div class="grid gap-xl md:grid-cols-[15rem_1fr]">
		<aside class="flex flex-col gap-xl">
			<p class="text-5xl font-semibold">
				4.8<span class="text-lg font-normal text-neutral/45"> / 5</span>
			</p>
			<Rating value={4.8} />
			<p class="text-sm text-neutral/50">128 sample reviews</p>
			{#each distribution as row (row.stars)}<Button
					variant={filter === row.stars ? 'soft' : 'ghost'}
					color="neutral"
					class="w-full justify-between"
					onclick={() => (filter = filter === row.stars ? 0 : row.stars)}
					><span>{row.stars} ★</span><span class="flex-1"
						><Meter value={{ value: row.count, color: 'primary' }} max={128} /></span
					><span class="text-xs">{row.count}</span></Button
				>{/each}<Button variant="link" size="small" onclick={() => (filter = 0)}
				>Show all ratings</Button
			>
		</aside>
		<div class="flex flex-col gap-xl">
			{#each reviews.filter((review) => filter === 0 || review.rating === filter) as review (review.id)}<article
					class="flex flex-col gap-lg p-xl rounded-lg border border-neutral/15"
				>
					<div class="flex gap-lg items-center justify-between">
						<div class="flex gap-md items-center">
							<Avatar size="small" user={{ name: review.name }} /><span class="font-medium"
								>{review.name}</span
							>
						</div>
						<Rating value={review.rating} size="small" />
					</div>
					<h3 class="font-semibold">{review.title}</h3>
					<p class="text-neutral/65">{review.body}</p>
				</article>{:else}<p class="rounded-lg bg-surface-recessed p-xl text-neutral/60">
					There are no {filter}-star reviews in this sample.
				</p>{/each}
		</div>
	</div>
</section>
