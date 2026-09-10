<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
	import { Avatar } from 'svelai/avatar';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';

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
	let votes = $state<number[]>([]);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			From real everyday use
		</p>
		<Heading size="h2" weight="bold">The details people notice.</Heading>
	</header>
	<div class="grid gap-xl md:grid-cols-2">
		{#each reviews.slice(0, 2) as review, i (review.id)}<article
				class="flex flex-col gap-xl p-xl rounded-lg border border-neutral/15"
			>
				<div class="flex gap-md items-center">
					<Avatar user={{ name: review.name }} />
					<div>
						<p class="font-medium">{review.name}</p>
						<p class="text-xs text-neutral/50">{review.date}</p>
					</div>
				</div>
				<Rating value={review.rating} size="small" />
				<h3 class="text-lg font-semibold">{review.title}</h3>
				<p class="text-neutral/65">{review.body}</p>
				<div class="max-w-48">{@render productArt('lamp', i === 0 ? 'Sand' : 'Olive')}</div>
				<div class="flex gap-lg items-center justify-between">
					<Chip variant="soft" color="success" size="small">Verified buyer</Chip><Button
						variant={votes.includes(review.id) ? 'soft' : 'outline'}
						size="small"
						aria-pressed={votes.includes(review.id)}
						onclick={() =>
							(votes = votes.includes(review.id)
								? votes.filter((id) => id !== review.id)
								: [...votes, review.id])}
						>Helpful ({review.helpful + (votes.includes(review.id) ? 1 : 0)})</Button
					>
				</div>
			</article>{/each}
	</div>
	<p class="text-xs text-neutral/45">Sample reviews and local helpful votes.</p>
</section>

<style>
	.product-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-surface-recessed);
		--object-color: var(--color-primary);
	}
	.product-art[data-color='Olive'] {
		--object-color: var(--color-success);
	}
	.object {
		position: relative;
		background: var(--object-color);
		width: 35%;
		height: 56%;
		box-shadow:
			inset -1.2rem 0 2rem #0002,
			0.8rem 1rem 1.4rem #0002;
	}
	[data-shape='lamp'] .object {
		width: 7%;
		height: 43%;
		border-radius: 1rem;
	}
	[data-shape='lamp'] .object::before {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 650%;
		height: 65%;
		left: -275%;
		top: -20%;
		border-radius: 10rem 10rem 0.6rem 0.6rem;
		box-shadow: inset -1rem 0 1.5rem #0002;
	}
	[data-shape='lamp'] .object::after {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 420%;
		height: 12%;
		left: -160%;
		bottom: -3%;
		border-radius: 50%;
	}
</style>
