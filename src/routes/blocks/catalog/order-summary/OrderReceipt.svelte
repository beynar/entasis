<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Card } from 'svelai/card';
	import { Button } from 'svelai/button';
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="flex flex-col gap-xl mx-auto w-full max-w-3xl">
		<header class="flex flex-col gap-xl items-center text-center">
			<Chip color="success" variant="soft">Sample order / Confirmed</Chip><Heading size="h2"
				>Good things are on their way.</Heading
			>
			<p class="text-neutral/60">Order FLD-1048 · June 12, 2026</p>
		</header>
		<Card
			><div class="flex flex-col gap-xl">
				<div class="grid grid-cols-[6rem_1fr_auto] items-center gap-xl">
					<div>{@render productArt('lamp', 'Sand')}</div>
					<div>
						<h3 class="font-semibold">Arc desk lamp</h3>
						<p class="mt-md text-sm text-neutral/55">Sand · Quantity 1</p>
					</div>
					<span>$148.00</span>
				</div>
				<dl class="flex flex-col gap-lg border-t border-neutral/15 pt-xl text-sm">
					<div class="flex justify-between">
						<dt>Subtotal</dt>
						<dd>$148.00</dd>
					</div>
					<div class="flex justify-between">
						<dt>Delivery</dt>
						<dd>$8.00</dd>
					</div>
					<div class="flex justify-between border-t border-neutral/15 pt-lg text-lg font-semibold">
						<dt>Total</dt>
						<dd>$156.00</dd>
					</div>
				</dl>
				<div class="grid gap-xl border-t border-neutral/15 pt-xl sm:grid-cols-2">
					<div>
						<h4 class="font-medium">Delivery address</h4>
						<address class="mt-lg text-sm not-italic text-neutral/60">
							Alex Morgan<br />18 Rue des Archives<br />75004 Paris, France
						</address>
					</div>
					<div>
						<h4 class="font-medium">Payment</h4>
						<p class="mt-lg text-sm text-neutral/60">
							Visa ending in 4242<br />Sample payment record
						</p>
					</div>
				</div>
			</div></Card
		><Button href="/components" variant="outline" class="self-center">Continue exploring ↗</Button>
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
