<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { NumberInput } from 'svelai/number-input';
	import { Card } from 'svelai/card';
	import { Empty } from 'svelai/empty';
	import { Dialog } from 'svelai/dialog';
	import { Meter } from 'svelai/meter';
	const products = [
		{
			id: 'arc',
			name: 'Arc desk lamp',
			type: 'Lighting',
			price: 148,
			color: 'Sand',
			shape: 'lamp'
		},
		{
			id: 'vessel',
			name: 'Everyday vessel',
			type: 'Objects',
			price: 38,
			color: 'Clay',
			shape: 'vase'
		},
		{ id: 'tote', name: 'Daybreak tote', type: 'Carry', price: 64, color: 'Olive', shape: 'bag' }
	];
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let cart = $state(products.map((product) => ({ ...product, quantity: 1 })));
	const subtotal = $derived(
		cart.reduce((total, product) => total + product.price * product.quantity, 0)
	);
	const count = $derived(cart.reduce((total, product) => total + product.quantity, 0));
	const shipping = $derived(subtotal === 0 || subtotal >= 150 ? 0 : 8);
	let review = $state(false);
	function changeQuantity(id: string, quantity: number) {
		cart = cart.map((product) =>
			product.id === id ? { ...product, quantity: Math.max(1, Math.min(10, quantity)) } : product
		);
	}
	function restore() {
		cart = products.map((product) => ({ ...product, quantity: 1 }));
	}
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="flex gap-xl items-center justify-between flex-wrap">
		<header class="flex flex-col gap-lg">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">Your shopping bag</p>
			<Heading size="h2" weight="bold">A few good choices.</Heading>
		</header>
		<Chip variant="soft">{count} items</Chip>
	</div>
	{#if cart.length}<div class="grid gap-xl lg:grid-cols-[1fr_20rem]">
			<div>
				{#each cart as product (product.id)}<article
						class="grid gap-xl border-t border-neutral/15 py-xl sm:grid-cols-[8rem_1fr_auto]"
					>
						<div>{@render productArt(product.shape, product.color)}</div>
						<div class="flex flex-col gap-lg">
							<h3 class="font-semibold">{product.name}</h3>
							<p class="text-sm text-neutral/55">{product.color} / {product.type}</p>
							<NumberInput
								label="Quantity"
								size="small"
								value={product.quantity}
								onValueChange={(value) => changeQuantity(product.id, value ?? 1)}
								min={1}
								max={10}
								showControls
								class="max-w-36"
							/>
						</div>
						<div class="flex flex-col gap-lg items-end justify-between">
							<span>{money(product.price * product.quantity)}</span><Button
								size="small"
								variant="ghost"
								color="neutral"
								onclick={() => (cart = cart.filter((entry) => entry.id !== product.id))}
								>Remove</Button
							>
						</div>
					</article>{/each}
			</div>
			<Card title="Order summary" class="h-fit"
				><div class="flex flex-col gap-xl">
					<Meter
						value={{ value: Math.min(subtotal, 150), color: 'primary' }}
						max={150}
						label={subtotal >= 150
							? 'Your delivery is on us'
							: `${money(150 - subtotal)} to free delivery`}
					/>
					<dl class="flex flex-col gap-lg text-sm">
						<div class="flex justify-between">
							<dt>Subtotal</dt>
							<dd>{money(subtotal)}</dd>
						</div>
						<div class="flex justify-between">
							<dt>Delivery</dt>
							<dd>{shipping ? money(shipping) : 'Complimentary'}</dd>
						</div>
						<div
							class="flex justify-between border-t border-neutral/15 pt-lg text-lg font-semibold"
						>
							<dt>Total</dt>
							<dd>{money(subtotal + shipping)}</dd>
						</div>
					</dl>
					<Button fullWidth onclick={() => (review = true)}>Review checkout →</Button>
					<p class="text-xs text-neutral/50">Taxes calculated by your store at checkout.</p>
				</div></Card
			>
		</div>{:else}<Empty
			title="Your bag has room for good things"
			description="The sample bag is empty."
			actions={[{ content: 'Restore sample products', onclick: restore }]}
		/>{/if}<Dialog
		bind:open={review}
		title="Your bag, ready to review"
		description="This is a local checkout preview. No order has been placed."
		><div class="flex flex-col gap-xl">
			{#each cart as product (product.id)}<div class="flex gap-lg justify-between text-sm">
					<span>{product.name} × {product.quantity}</span><span
						>{money(product.price * product.quantity)}</span
					>
				</div>{/each}
			<div class="flex justify-between border-t border-neutral/15 pt-lg font-semibold">
				<span>Estimated total</span><span>{money(subtotal + shipping)}</span>
			</div>
			<Button variant="outline" onclick={() => (review = false)}>Continue editing bag</Button>
		</div></Dialog
	>
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
	.product-art[data-color='Olive'] {
		--object-color: var(--color-success);
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
	[data-shape='bag'] .object {
		width: 47%;
		height: 47%;
		border-radius: 0.4rem 0.4rem 1rem 1rem;
	}
	[data-shape='bag'] .object::before {
		content: '';
		position: absolute;
		width: 48%;
		height: 48%;
		border: 0.65rem solid var(--object-color);
		border-bottom: 0;
		border-radius: 50% 50% 0 0;
		left: 26%;
		top: -39%;
	}
</style>
