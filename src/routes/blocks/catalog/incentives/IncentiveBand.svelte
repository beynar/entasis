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
	<div class="rounded-lg bg-primary p-xl text-primary-contrast">
		<div class="grid gap-xl sm:grid-cols-3">
			{#each guarantees.slice(0, 3) as guarantee (guarantee.title)}<div
					class="flex flex-col gap-lg items-center text-center"
				>
					{@render guarantee.icon({ size: 32 })}<Heading size="h5" weight="bold"
						>{guarantee.title}</Heading
					>
					<p class="max-w-xs text-sm opacity-80">{guarantee.detail}</p>
				</div>{/each}
		</div>
	</div>
</section>
