<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
	import { Rating } from 'entasis/rating';
	import { Accordion } from 'entasis/accordion';
	import { NumberInput } from 'entasis/number-input';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let quantity = $state(1);
	let added = $state(0);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl grid md:grid-cols-2">
		<div class="gap-xl flex flex-col">
			{@render productArt('lamp', 'Sand')}
			<div class="gap-lg text-neutral/70 grid grid-cols-3 text-center text-xs">
				<span>Warm 2700K light</span><span>Touch dimming</span><span>5-year warranty</span>
			</div>
		</div>
		<div class="gap-xl flex flex-col">
			<Chip class="w-fit" variant="soft">Field objects / Lighting</Chip><Heading size="h2"
				>Arc desk lamp</Heading
			>
			<div class="gap-lg flex items-center">
				<Rating value={4.8} size="small" /><span class="text-neutral/65 text-sm"
					>4.8 · 128 reviews</span
				>
			</div>
			<p class="text-2xl font-semibold">$148</p>
			<p class="text-neutral/65 leading-relaxed">
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
			<p class="text-success-readable text-sm" aria-live="polite">
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
