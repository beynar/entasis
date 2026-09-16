<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Form } from 'svelai/form';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
	const products = [
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

	let delivery = $state(0);
	let open = $state(false);
	let reviewDetails = $state({ name: '', email: '', street: '', city: '', postal: '' });
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl grid lg:grid-cols-[1.3fr_1fr]">
		<div class="gap-xl flex flex-col">
			<header class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Field objects / Checkout
				</p>
				<Heading size="h2" weight="bold">One step closer to a good thing.</Heading>
			</header>
			<Form
				inputs={{
					contact: {
						type: 'group',
						label: 'Contact',
						inputs: {
							email: { type: 'email', label: 'Email address', required: true },
							name: { type: 'text', label: 'Full name', required: true }
						}
					},
					delivery: {
						type: 'group',
						label: 'Delivery address',
						inputs: {
							street: { type: 'text', label: 'Street address', required: true },
							city: { type: 'text', label: 'City', required: true },
							postal: { type: 'text', label: 'Postal code', required: true }
						}
					}
				}}
				onSubmit={(values) => {
					reviewDetails = {
						name: values.name,
						email: values.email,
						street: values.street,
						city: values.city,
						postal: values.postal
					};
					open = true;
				}}
				actions={[{ children: 'Review order', onAction: (form) => form.submit() }]}
			/>
			<p class="text-neutral/65 text-xs">
				This preview collects local form state. No order is placed and no payment is taken.
			</p>
		</div>
		<aside class="gap-xl p-xl bg-surface-recessed flex flex-col rounded-lg">
			<Heading size="h3">Order summary</Heading>{#each products as product (product.id)}<div
					class="gap-lg grid grid-cols-[6rem_1fr_auto] items-center"
				>
					<div>{@render productArt(product.shape, product.color)}</div>
					<div>
						<h3 class="text-sm font-semibold">{product.name}</h3>
						<p class="mt-sm text-neutral/65 text-xs">{product.color} · Qty 1</p>
					</div>
					<span class="text-sm">{money(product.price)}</span>
				</div>{/each}
			<div class="gap-lg border-neutral/15 pt-xl flex flex-col border-t">
				<h3 class="text-sm font-semibold">Delivery method</h3>
				{#each [{ name: 'Standard delivery', days: '3–5 working days', price: 8 }, { name: 'Express delivery', days: '1–2 working days', price: 18 }] as method, i (method.name)}<Button
						variant={delivery === i ? 'soft' : 'outline'}
						color={delivery === i ? 'primary' : 'neutral'}
						onclick={() => (delivery = i)}
						class="py-lg h-auto! justify-between text-left"
						pressed={delivery === i}
						><span>{method.name}<br /><span class="text-xs font-normal">{method.days}</span></span
						><span>{money(method.price)}</span></Button
					>{/each}
			</div>
			<dl class="gap-lg border-neutral/15 pt-xl flex flex-col border-t text-sm">
				<div class="flex justify-between">
					<dt>Subtotal</dt>
					<dd>$102</dd>
				</div>
				<div class="flex justify-between">
					<dt>Delivery</dt>
					<dd>{money(delivery === 0 ? 8 : 18)}</dd>
				</div>
				<div class="flex justify-between text-xl font-semibold">
					<dt>Total</dt>
					<dd>{money(102 + (delivery === 0 ? 8 : 18))}</dd>
				</div>
			</dl>
			<Chip variant="soft" class="w-fit" color="neutral">Carefully packed</Chip>
		</aside>
	</div>
	<Dialog
		bind:open
		title="Your order review"
		description="Your details passed validation. No order has been placed."
		><div class="gap-xl flex flex-col">
			<p class="text-neutral/65">
				2 objects · {delivery === 0 ? 'Standard' : 'Express'} delivery
			</p>
			<p class="text-3xl font-semibold">{money(102 + (delivery === 0 ? 8 : 18))}</p>
			<div class="gap-lg flex flex-col text-sm">
				<p><strong>{reviewDetails.name}</strong><br />{reviewDetails.email}</p>
				<address class="text-neutral/65 not-italic">
					{reviewDetails.street}<br />{reviewDetails.postal}
					{reviewDetails.city}
				</address>
			</div>
			<Button variant="outline" onclick={() => (open = false)}>Back to checkout</Button>
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
