<script lang="ts">
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Rating } from 'svelai/rating';

	let quantity = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="mx-auto w-full max-w-sm">
		<Card
			><div class="flex flex-col gap-xl">
				<div class="relative">
					{@render productArt('lamp', 'Sand')}
					<div class="absolute left-lg top-lg">
						<Chip color="danger" size="small">Save 20%</Chip>
					</div>
				</div>
				<div class="flex gap-lg justify-between">
					<div>
						<p class="text-xs uppercase tracking-widest text-neutral/50">Field objects</p>
						<h3 class="mt-md text-xl font-semibold">Arc desk lamp</h3>
					</div>
					<div class="text-right">
						<p class="text-lg font-semibold">$148</p>
						<s class="text-sm text-neutral/45">$185</s>
					</div>
				</div>
				<Rating value={4.8} size="small" />
				<p class="text-neutral/65">A warm pool of light, right where you need it.</p>
				<Button fullWidth onclick={() => (quantity += 1)}>Add to bag</Button>
				<p class="text-center text-xs text-neutral/55" aria-live="polite">
					{quantity ? `${quantity} in your sample bag` : 'Free delivery on orders over $150'}
				</p>
			</div></Card
		>
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
