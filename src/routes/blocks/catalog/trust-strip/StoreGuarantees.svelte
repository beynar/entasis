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
	<div class="grid gap-xl rounded-lg border border-neutral/15 p-xl sm:grid-cols-2 lg:grid-cols-4">
		{#each guarantees as guarantee (guarantee.title)}<div class="flex gap-lg items-start">
				<span class="text-primary">{@render guarantee.icon({ size: 26 })}</span>
				<div>
					<Heading size="h5" weight="bold">{guarantee.title}</Heading>
					<p class="mt-md text-xs text-neutral/55">{guarantee.detail}</p>
				</div>
			</div>{/each}
	</div>
</section>
