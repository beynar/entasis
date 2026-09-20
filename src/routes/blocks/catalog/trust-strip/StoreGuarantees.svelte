<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { truckIcon } from 'entasis/icons/truck';
	import { packageIcon } from 'entasis/icons/package';
	import { shieldCheckIcon } from 'entasis/icons/shieldCheck';
	import { leafIcon } from 'entasis/icons/leaf';
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
	<div class="gap-xl border-neutral/15 p-xl grid rounded-lg border sm:grid-cols-2 lg:grid-cols-4">
		{#each guarantees as guarantee (guarantee.title)}<div class="gap-lg flex items-start">
				<span class="text-primary-readable">{@render guarantee.icon({ size: 26 })}</span>
				<div>
					<Heading size="h5" weight="bold">{guarantee.title}</Heading>
					<p class="mt-md text-neutral/65 text-xs">{guarantee.detail}</p>
				</div>
			</div>{/each}
	</div>
</section>
