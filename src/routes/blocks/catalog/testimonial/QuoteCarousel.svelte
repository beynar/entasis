<script lang="ts">
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Carousel } from 'svelai/carousel';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
	const quotes = [
		{
			quote:
				'It gave the whole team a shared picture of the work, without turning every update into another meeting.',
			name: 'Maya Chen',
			role: 'Product lead · Fieldwork'
		},
		{
			quote:
				'The system was clear enough to get out of our way and flexible enough to feel like our product.',
			name: 'Theo Park',
			role: 'Engineering lead · Layers'
		},
		{
			quote:
				'We spent less time explaining where things were and more time deciding what to do next.',
			name: 'Nora Ellis',
			role: 'Founder · Quotient'
		}
	];
</script>

<section class="mx-auto flex max-w-4xl flex-col gap-xl p-lg md:p-xl">
	<div class="text-center">
		<Chip variant="outline">In their own words</Chip><Heading
			as="h2"
			size="h2"
			weight="bold"
			class="mt-xl">A clearer way to work, together.</Heading
		>
	</div>
	<Carousel
		items={quotes}
		layout={{ default: 1 }}
		navigationButton={{ color: 'neutral' }}
		dots={{ color: 'primary' }}
		>{#snippet children({ item })}<Card variant="outline"
				><div class="flex min-h-72 flex-col items-center justify-center gap-xl text-center">
					<Rating value={5} color="primary" />
					<blockquote class="max-w-2xl text-2xl leading-relaxed">“{item.quote}”</blockquote>
					<div class="flex items-center gap-md">
						<Avatar user={{ name: item.name }} />
						<div class="text-left">
							<strong>{item.name}</strong>
							<p class="text-sm text-neutral/60">{item.role}</p>
						</div>
					</div>
				</div></Card
			>{/snippet}</Carousel
	>
	<p class="text-center text-xs text-neutral/50">Illustrative customer stories.</p>
</section>
