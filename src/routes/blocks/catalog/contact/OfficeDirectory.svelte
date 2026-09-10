<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Heading } from 'svelai/heading';
	import { Separator } from 'svelai/separator';
	import { mapPinIcon } from 'svelai/icons/mapPin';
</script>

<section class="flex flex-col gap-xl p-lg md:p-xl">
	<div class="grid gap-xl md:grid-cols-2">
		<Heading as="h2" size="h1" weight="bold">Close to the work.<br />Open to the world.</Heading>
		<p class="self-end text-lg text-neutral/70">
			Our example studio is built across cities, with a shared rhythm and room for local
			perspective.
		</p>
	</div>
	<Separator />
	<div class="grid gap-xl md:grid-cols-3">
		{#each [{ city: 'Paris', time: 'Central European time', address: 'The Marais studio', note: 'Design and product strategy' }, { city: 'Copenhagen', time: 'Central European time', address: 'The harbor workspace', note: 'Engineering and research' }, { city: 'Toronto', time: 'Eastern time', address: 'The west-end studio', note: 'Customer experience' }] as office, index (office.city)}<div
				class="flex flex-col gap-lg"
			>
				<span class="text-sm text-neutral/50">0{index + 1}</span><Heading as="h3" size="h3"
					>{office.city}</Heading
				>
				<p class="text-sm text-neutral/60">{office.time}</p>
				<div class="rounded-lg bg-surface-recessed p-lg">
					<span class="text-primary">{@render mapPinIcon({ size: 28 })}</span>
					<p class="mt-md font-medium">{office.address}</p>
					<p class="mt-sm text-sm text-neutral/60">{office.note}</p>
				</div>
			</div>{/each}
	</div>
	<Card variant="soft" color="primary"
		><div class="flex flex-wrap items-center justify-between gap-lg">
			<div>
				<Heading as="h3" size="h4">Good work travels well.</Heading>
				<p class="mt-sm">Start with the shared toolkit, wherever you are.</p>
			</div>
			<Button href="/docs" variant="outline">Explore our approach</Button>
		</div></Card
	>
</section>
