<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Tabbar } from 'svelai/tabbar';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Dialog } from 'svelai/dialog';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	const orders = [
		{
			id: 'FLD-1048',
			date: 'June 12, 2026',
			status: 'Delivered',
			name: 'Arc desk lamp',
			shape: 'lamp',
			color: 'Sand',
			price: 148,
			quantity: 1,
			delivery: 'June 16, 2026'
		},
		{
			id: 'FLD-1026',
			date: 'May 28, 2026',
			status: 'In transit',
			name: 'Everyday vessel',
			shape: 'vase',
			color: 'Clay',
			price: 38,
			quantity: 2,
			delivery: 'Estimated June 2, 2026'
		},
		{
			id: 'FLD-0982',
			date: 'April 18, 2026',
			status: 'Delivered',
			name: 'Daybreak tote',
			shape: 'bag',
			color: 'Olive',
			price: 64,
			quantity: 1,
			delivery: 'April 22, 2026'
		}
	];
	let selectedOrder = $state<(typeof orders)[number] | null>(null);
	let filter = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Your account</p>
		<Heading size="h2" weight="bold">Good things, on their way.</Heading>
	</header>
	<Tabbar items={['All orders', 'In transit', 'Delivered']} bind:value={filter} />
	<div class="flex flex-col gap-xl">
		{#each orders.filter((order) => filter === 0 || order.status === ['', 'In transit', 'Delivered'][filter]) as order (order.id)}<article
				class="overflow-hidden rounded-lg border border-neutral/15"
			>
				<div class="flex gap-lg justify-between flex-wrap p-lg bg-surface-recessed text-sm">
					<span><strong>{order.id}</strong> · {order.date}</span><Chip
						size="small"
						variant="soft"
						color={order.status === 'Delivered' ? 'success' : 'info'}>{order.status}</Chip
					>
				</div>
				<div class="grid items-center gap-xl p-xl sm:grid-cols-[7rem_1fr_auto]">
					<div>{@render productArt(order.shape, order.color)}</div>
					<div>
						<h3 class="font-semibold">{order.name}</h3>
						<p class="mt-md text-sm text-neutral/55">{order.color} · Qty {order.quantity}</p>
						<p class="mt-sm text-sm">{money(order.price * order.quantity)}</p>
					</div>
					<Button variant="outline" size="small" onclick={() => (selectedOrder = order)}
						>Order details</Button
					>
				</div>
			</article>{/each}
	</div>
	<Dialog
		open={selectedOrder !== null}
		onOpenChange={(open) => {
			if (!open) selectedOrder = null;
		}}
		title={selectedOrder?.id ?? 'Order details'}
		description="Sample order details"
		>{#if selectedOrder}<div class="flex flex-col gap-xl">
				{@render productArt(selectedOrder.shape, selectedOrder.color)}
				<h3 class="text-xl font-semibold">{selectedOrder.name}</h3>
				<dl class="flex flex-col gap-lg text-sm">
					<div class="flex justify-between">
						<dt>Status</dt>
						<dd>{selectedOrder.status}</dd>
					</div>
					<div class="flex justify-between">
						<dt>Quantity</dt>
						<dd>{selectedOrder.quantity}</dd>
					</div>
					<div class="flex justify-between">
						<dt>Delivery</dt>
						<dd>{selectedOrder.delivery}</dd>
					</div>
					<div class="flex justify-between">
						<dt>Total</dt>
						<dd>{money(selectedOrder.price * selectedOrder.quantity)}</dd>
					</div>
				</dl>
			</div>{/if}</Dialog
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
