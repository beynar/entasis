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

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Good things, from start to finish
		</p>
		<Heading size="h2" weight="bold">A little extra care.</Heading>
	</header>
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-4">
		{#each guarantees as guarantee (guarantee.title)}<div
				class="gap-lg border-neutral/15 pt-xl flex flex-col border-t"
			>
				<div class="text-primary-readable">{@render guarantee.icon({ size: 28 })}</div>
				<h3 class="font-semibold">{guarantee.title}</h3>
				<p class="text-neutral/70 text-sm leading-relaxed">{guarantee.detail}</p>
			</div>{/each}
	</div>
</section>
