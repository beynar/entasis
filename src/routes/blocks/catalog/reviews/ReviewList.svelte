<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Rating } from 'entasis/rating';
	import { Avatar } from 'entasis/avatar';
	import { Chip } from 'entasis/chip';
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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<div class="gap-xl flex flex-wrap items-end justify-between">
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Community notes
			</p>
			<Heading size="h2" weight="bold">Good things, in good company.</Heading>
		</header>
		<div class="gap-md flex flex-col">
			<Rating value={4.8} />
			<p class="text-neutral/65 text-sm">4.8 out of 5 · 128 sample reviews</p>
		</div>
	</div>
	{#each reviews as review (review.id)}<article
			class="gap-xl border-neutral/15 pt-xl grid border-t md:grid-cols-[12rem_1fr]"
		>
			<div class="gap-lg flex flex-col">
				<div class="gap-md flex items-center">
					<Avatar name={review.name} /><span class="text-sm font-medium">{review.name}</span>
				</div>
				<Chip class="w-fit" color="success" variant="soft" size="small">Verified buyer</Chip><time
					class="text-neutral/65 text-xs">{review.date}</time
				>
			</div>
			<div class="gap-lg flex flex-col">
				<Rating value={review.rating} size="small" />
				<h3 class="text-lg font-semibold">{review.title}</h3>
				<p class="text-neutral/65 leading-relaxed">{review.body}</p>
			</div>
		</article>{/each}
</section>
