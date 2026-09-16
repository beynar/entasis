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
	<div class="bg-primary p-xl text-primary-contrast rounded-lg">
		<div class="gap-xl grid sm:grid-cols-3">
			{#each guarantees.slice(0, 3) as guarantee (guarantee.title)}<div
					class="gap-lg flex flex-col items-center text-center"
				>
					{@render guarantee.icon({ size: 32 })}<Heading size="h5" weight="bold"
						>{guarantee.title}</Heading
					>
					<p class="max-w-xs text-sm">{guarantee.detail}</p>
				</div>{/each}
		</div>
	</div>
</section>
