<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { mapPinIcon } from 'svelai/icons/mapPin';
</script>

<section class="gap-xl p-lg md:p-xl flex flex-col">
	<div class="gap-xl grid md:grid-cols-2">
		<Heading as="h2" size="h1" weight="bold">Close to the work.<br />Open to the world.</Heading>
		<p class="text-neutral/70 self-end text-lg">
			Our example studio is built across cities, with a shared rhythm and room for local
			perspective.
		</p>
	</div>
	<Separator />
	<div class="gap-xl grid md:grid-cols-3">
		{#each [{ city: 'Paris', time: 'Central European time', address: 'The Marais studio', note: 'Design and product strategy' }, { city: 'Copenhagen', time: 'Central European time', address: 'The harbor workspace', note: 'Engineering and research' }, { city: 'Toronto', time: 'Eastern time', address: 'The west-end studio', note: 'Customer experience' }] as office, index (office.city)}<div
				class="gap-lg flex flex-col"
			>
				<span class="text-neutral/65 text-sm">0{index + 1}</span><Heading as="h3" size="h3"
					>{office.city}</Heading
				>
				<p class="text-neutral/70 text-sm">{office.time}</p>
				<div class="bg-surface-recessed p-lg rounded-lg">
					<span class="text-primary-readable">{@render mapPinIcon({ size: 28 })}</span>
					<p class="mt-md font-medium">{office.address}</p>
					<p class="mt-sm text-neutral/70 text-sm">{office.note}</p>
				</div>
			</div>{/each}
	</div>
	<Card variant="soft" color="primary"
		><div class="gap-lg flex flex-wrap items-center justify-between">
			<div>
				<Heading as="h3" size="h4">Good work travels well.</Heading>
				<p class="mt-sm">Start with the shared toolkit, wherever you are.</p>
			</div>
			<Button href="/docs" variant="outline">Explore our approach</Button>
		</div></Card
	>
</section>
