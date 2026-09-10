<script lang="ts">
	import { Stack } from 'svelai/stack';
	import { Avatar } from 'svelai/avatar';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Rating } from 'svelai/rating';
	import { Separator } from 'svelai/separator';
	const quotes = [
		{
			name: 'Maya Chen',
			role: 'Product lead',
			rating: 5,
			text: 'A shared language made the reviews more useful. We could talk about the experience instead of arguing over every individual detail.'
		},
		{
			name: 'Theo Park',
			role: 'Engineer',
			rating: 5,
			text: 'The next screen finally felt like part of the same product.'
		},
		{
			name: 'Nora Ellis',
			role: 'Researcher',
			rating: 4.5,
			text: 'A little structure gave the findings somewhere to live. The team could return to the evidence when the next question came up.'
		},
		{
			name: 'Ari Costa',
			role: 'Founder',
			rating: 5,
			text: 'Less setup, more time to test the actual idea.'
		},
		{
			name: 'Jules Bernard',
			role: 'Designer',
			rating: 5,
			text: 'The thoughtful defaults helped us start. The flexibility let us finish in our own voice.'
		},
		{
			name: 'Sam Rivera',
			role: 'Product manager',
			rating: 4.5,
			text: 'Everyone could see the work and the reason behind it. That changed the conversation.'
		}
	];
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="mx-auto max-w-2xl text-center">
		<Heading as="h2" size="h2" weight="bold">Small changes. Better everyday work.</Heading>
		<p class="mt-lg text-neutral/70">
			A few illustrative voices from teams finding a clearer rhythm.
		</p>
	</div>
	<div class="columns-1 gap-lg sm:columns-2 lg:columns-3">
		{#each quotes as quote (quote.name)}<div class="mb-lg break-inside-avoid">
				<Card variant="outline"
					><Stack gap="lg"
						><Rating value={quote.rating} size="small" />
						<blockquote class="leading-relaxed">“{quote.text}”</blockquote>
						<Separator />
						<div class="flex items-center gap-md">
							<Avatar size="small" user={{ name: quote.name }} />
							<div>
								<strong class="text-sm">{quote.name}</strong>
								<p class="text-xs text-neutral/50">{quote.role}</p>
							</div>
						</div></Stack
					></Card
				>
			</div>{/each}
	</div>
</section>
