<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
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
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<div class="flex gap-xl items-end justify-between flex-wrap">
		<header class="flex flex-col gap-lg">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">Community notes</p>
			<Heading size="h2" weight="bold">Good things, in good company.</Heading>
		</header>
		<div class="flex flex-col gap-md">
			<Rating value={4.8} />
			<p class="text-sm text-neutral/55">4.8 out of 5 · 128 sample reviews</p>
		</div>
	</div>
	{#each reviews as review (review.id)}<article
			class="grid gap-xl border-t border-neutral/15 pt-xl md:grid-cols-[12rem_1fr]"
		>
			<div class="flex flex-col gap-lg">
				<div class="flex gap-md items-center">
					<Avatar user={{ name: review.name }} /><span class="text-sm font-medium"
						>{review.name}</span
					>
				</div>
				<Chip class="w-fit" color="success" variant="soft" size="small">Verified buyer</Chip><time
					class="text-xs text-neutral/45">{review.date}</time
				>
			</div>
			<div class="flex flex-col gap-lg">
				<Rating value={review.rating} size="small" />
				<h3 class="text-lg font-semibold">{review.title}</h3>
				<p class="leading-relaxed text-neutral/65">{review.body}</p>
			</div>
		</article>{/each}
</section>
