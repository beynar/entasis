<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Timeline } from 'svelai/timeline';
	import { Chip } from 'svelai/chip';
	import { Card } from 'svelai/card';
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl grid md:grid-cols-[1.3fr_1fr]">
		<div class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Sample order FLD-1026
				</p>
				<Heading size="h2" weight="bold">Your vessels are on the move.</Heading>
				<p class="text-neutral/65 max-w-2xl">A little closer to their new home.</p>
			</header>
			<Timeline
				color="primary"
				items={[
					{
						title: 'Order confirmed',
						date: 'May 28 · 10:42',
						description: 'Your two everyday vessels are reserved.'
					},
					{
						title: 'Packed with care',
						date: 'May 29 · 14:10',
						description: 'Wrapped in plastic-free protective packaging.'
					},
					{
						title: 'On the way',
						date: 'May 30 · 08:35',
						description: 'Your sample parcel is in transit.',
						color: 'info'
					},
					{
						title: 'At your door',
						date: 'Estimated June 2',
						description: 'Delivery to 18 Rue des Archives, Paris.',
						color: 'neutral'
					}
				]}
				variant="outline"
			/>
		</div>
		<aside>
			<Card title="Your order" description="Two good things, together"
				><div class="gap-xl flex flex-col">
					{@render productArt('vase', 'Clay')}
					<div class="flex justify-between">
						<h3 class="font-semibold">Everyday vessel</h3>
						<span>$76</span>
					</div>
					<p class="text-neutral/65 text-sm">Clay · Quantity 2</p>
					<dl class="gap-lg border-neutral/15 pt-lg flex flex-col border-t text-sm">
						<div class="flex justify-between">
							<dt>Delivery</dt>
							<dd>$8</dd>
						</div>
						<div class="flex justify-between font-semibold">
							<dt>Total</dt>
							<dd>$84</dd>
						</div>
					</dl>
					<Chip class="w-fit" variant="soft" color="info">In transit</Chip>
				</div></Card
			>
		</aside>
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
	.product-art[data-color='Clay'] {
		--object-color: var(--color-secondary);
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
	[data-shape='vase'] .object {
		clip-path: polygon(
			28% 0,
			72% 0,
			68% 25%,
			91% 58%,
			100% 85%,
			87% 100%,
			13% 100%,
			0 85%,
			9% 58%,
			32% 25%
		);
		border-radius: 32%;
	}
</style>
