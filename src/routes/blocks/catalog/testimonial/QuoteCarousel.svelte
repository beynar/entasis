<script lang="ts">
	import { Avatar } from 'entasis/avatar';
	import { Card } from 'entasis/card';
	import { Carousel } from 'entasis/carousel';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Rating } from 'entasis/rating';
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

<section class="gap-xl p-lg md:p-xl mx-auto flex max-w-4xl flex-col">
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
		layout={1}
		navigationButton={{ color: 'neutral' }}
		pagination={{ variant: 'dots', color: 'primary' }}
		>{#snippet children({ item })}<Card variant="outline"
				><div class="gap-xl flex min-h-72 flex-col items-center justify-center text-center">
					<Rating value={5} color="primary" />
					<blockquote class="max-w-2xl text-2xl leading-relaxed">“{item.quote}”</blockquote>
					<div class="gap-md flex items-center">
						<Avatar name={item.name} />
						<div class="text-left">
							<strong>{item.name}</strong>
							<p class="text-neutral/70 text-sm">{item.role}</p>
						</div>
					</div>
				</div></Card
			>{/snippet}</Carousel
	>
	<p class="text-neutral/65 text-center text-xs">Illustrative customer stories.</p>
</section>
