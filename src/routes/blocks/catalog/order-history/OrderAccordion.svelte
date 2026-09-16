<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Accordion } from 'svelai/accordion';
	import { TextInput } from 'svelai/text-input';
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
	let query = $state('');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Order history
		</p>
		<Heading size="h2" weight="bold">Your collection, so far.</Heading>
	</header>
	<TextInput
		label="Find an order"
		placeholder="Order number or product"
		bind:value={query}
		class="max-w-sm"
	/><Accordion
		items={orders
			.filter((order) =>
				(order.id + ' ' + order.name).toLowerCase().includes((query ?? '').toLowerCase())
			)
			.map((order) => ({ ...order, title: order.id, description: order.date }))}
		variant="outline"
		splitted
		>{#snippet title({ item: order })}<div class="gap-lg flex items-center">
				<span>{order.id}</span><Chip
					size="small"
					variant="soft"
					color={order.status === 'Delivered' ? 'success' : 'info'}>{order.status}</Chip
				>
			</div>{/snippet}{#snippet content({ item: order })}<div
				class="gap-xl grid items-center sm:grid-cols-[7rem_1fr_auto]"
			>
				<div>{@render productArt(order.shape, order.color)}</div>
				<div>
					<h3 class="font-medium">{order.name}</h3>
					<p class="mt-md text-neutral/65 text-sm">
						{order.quantity} × {money(order.price)} · {order.color}
					</p>
					<p class="mt-sm text-neutral/65 text-xs">{order.delivery}</p>
				</div>
				<Button variant="outline" size="small" onclick={() => (selectedOrder = order)}
					>View details</Button
				>
			</div>{/snippet}</Accordion
	><Dialog
		open={selectedOrder !== null}
		onOpenChange={(open) => {
			if (!open) selectedOrder = null;
		}}
		title={selectedOrder?.id ?? 'Order details'}
		description="Sample order details"
		>{#if selectedOrder}<div class="gap-xl flex flex-col">
				{@render productArt(selectedOrder.shape, selectedOrder.color)}
				<h3 class="text-xl font-semibold">{selectedOrder.name}</h3>
				<dl class="gap-lg flex flex-col text-sm">
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
