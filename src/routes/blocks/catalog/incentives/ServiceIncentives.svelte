<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { truckIcon } from 'svelai/icons/truck';
	import { packageIcon } from 'svelai/icons/package';
	import { shieldCheckIcon } from 'svelai/icons/shieldCheck';
	import { leafIcon } from 'svelai/icons/leaf';
	const guarantees = [
		{
			title: 'Delivery, on us',
			detail: 'Complimentary shipping on orders over $150.',
			icon: truckIcon
		},
		{ title: 'Time to decide', detail: 'Return unused items within 30 days.', icon: packageIcon },
		{
			title: 'Made to last',
			detail: 'Thoughtful materials and a 5-year warranty.',
			icon: shieldCheckIcon
		},
		{
			title: 'A lighter footprint',
			detail: 'Plastic-free packaging, carefully considered.',
			icon: leafIcon
		}
	];
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Good things, from start to finish
		</p>
		<Heading size="h2" weight="bold">A little extra care.</Heading>
	</header>
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-4">
		{#each guarantees as guarantee (guarantee.title)}<div
				class="flex flex-col gap-lg border-t border-neutral/15 pt-xl"
			>
				<div class="text-primary">{@render guarantee.icon({ size: 28 })}</div>
				<h3 class="font-semibold">{guarantee.title}</h3>
				<p class="text-sm leading-relaxed text-neutral/60">{guarantee.detail}</p>
			</div>{/each}
	</div>
</section>
