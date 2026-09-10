<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
	import { Empty } from 'svelai/empty';
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
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">
			Your everyday essentials
		</p>
		<Heading size="h2" weight="bold">A little bag of good things.</Heading>
	</header>
	<Popover
		size="large"
		mobileSheet
		trigger={{ content: `Shopping bag (${count})`, variant: 'outline' }}
		><div class="flex flex-col gap-xl">
			<div class="flex gap-md justify-between">
				<Heading size="h4">Your bag</Heading><Chip size="small" variant="soft">{count} items</Chip>
			</div>
			{#each cart as product (product.id)}<div
					class="grid grid-cols-[4rem_1fr_auto] items-center gap-lg"
				>
					<div>{@render productArt(product.shape, product.color)}</div>
					<div>
						<p class="text-sm font-medium">{product.name}</p>
						<p class="mt-sm text-xs text-neutral/50">
							{product.quantity} × {money(product.price)}
						</p>
					</div>
					<Button
						size="small"
						variant="ghost"
						label={`Remove ${product.name}`}
						onclick={() => (cart = cart.filter((entry) => entry.id !== product.id))}>×</Button
					>
				</div>{:else}<Empty
					title="All clear"
					description="Your sample bag is empty."
					actions={[{ content: 'Restore bag', onclick: restore }]}
				/>{/each}{#if cart.length}<div
					class="flex justify-between border-t border-neutral/15 pt-lg font-semibold"
				>
					<span>Subtotal</span><span>{money(subtotal)}</span>
				</div>
				<Button fullWidth onclick={() => (review = true)}>Review bag →</Button>
				<p class="text-center text-xs text-neutral/45">
					{shipping ? 'Delivery ' + money(shipping) : 'Complimentary delivery'}
				</p>{/if}
		</div></Popover
	><Dialog
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
