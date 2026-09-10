<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Rating } from 'svelai/rating';
	import { Accordion } from 'svelai/accordion';
	import { NumberInput } from 'svelai/number-input';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let quantity = $state(1);
	let added = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="grid gap-xl md:grid-cols-2">
		<div class="flex flex-col gap-xl">
			{@render productArt('lamp', 'Sand')}
			<div class="grid grid-cols-3 gap-lg text-center text-xs text-neutral/60">
				<span>Warm 2700K light</span><span>Touch dimming</span><span>5-year warranty</span>
			</div>
		</div>
		<div class="flex flex-col gap-xl">
			<Chip class="w-fit" variant="soft">Field objects / Lighting</Chip><Heading size="h2"
				>Arc desk lamp</Heading
			>
			<div class="flex gap-lg items-center">
				<Rating value={4.8} size="small" /><span class="text-sm text-neutral/55"
					>4.8 · 128 reviews</span
				>
			</div>
			<p class="text-2xl font-semibold">$148</p>
			<p class="leading-relaxed text-neutral/65">
				A simple silhouette and a warm, adjustable light. Designed to feel at home on a working desk
				or a quiet bedside table.
			</p>
			<NumberInput
				label="Quantity"
				min={1}
				max={10}
				value={quantity}
				onValueChange={(value) => (quantity = Math.max(1, Math.min(10, value ?? 1)))}
				showControls
				class="max-w-40"
			/><Button fullWidth onclick={() => (added += quantity)}
				>Add to bag · {money(quantity * 148)}</Button
			>
			<p class="text-sm text-success" aria-live="polite">
				{added ? `${added} in your sample bag` : 'In stock · Ready to dispatch'}
			</p>
			<Accordion
				items={[
					{
						title: 'Materials and dimensions',
						content:
							'Powder-coated aluminum. Height 38 cm, shade diameter 24 cm. A weighted base keeps the lamp steady.'
					},
					{
						title: 'Light and power',
						content:
							'Integrated 8W LED, 2700K warm white. Touch dimmer with three brightness levels. 2 m textile cable.'
					},
					{
						title: 'Delivery and returns',
						content:
							'Sample store policy: complimentary delivery over $150 and returns within 30 days.'
					}
				]}
			/>
		</div>
	</div>
</section>

<style>
	.product-art {
		position: relative;
		display: grid;
		place-items: center;
		width: 100%;
		aspect-ratio: 4/3;
		overflow: hidden;
		border-radius: var(--radius-lg);
		background: var(--color-surface-recessed);
		--object-color: var(--color-primary);
	}
	.object {
		position: relative;
		background: var(--object-color);
		width: 35%;
		height: 56%;
		box-shadow:
			inset -1.2rem 0 2rem #0002,
			0.8rem 1rem 1.4rem #0002;
	}
	[data-shape='lamp'] .object {
		width: 7%;
		height: 43%;
		border-radius: 1rem;
	}
	[data-shape='lamp'] .object::before {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 650%;
		height: 65%;
		left: -275%;
		top: -20%;
		border-radius: 10rem 10rem 0.6rem 0.6rem;
		box-shadow: inset -1rem 0 1.5rem #0002;
	}
	[data-shape='lamp'] .object::after {
		content: '';
		position: absolute;
		background: var(--object-color);
		width: 420%;
		height: 12%;
		left: -160%;
		bottom: -3%;
		border-radius: 50%;
	}
</style>
