<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Form } from 'svelai/form';
	import { Meter } from 'svelai/meter';
	import { Card } from 'svelai/card';

	let step = $state(0);
	let furthest = $state(0);
	let contact = $state({ name: '', email: '' });
	let address = $state({ street: '', city: '', postal: '', country: 'France' });
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="flex flex-col gap-xl mx-auto w-full max-w-4xl">
		<header class="flex flex-col gap-lg">
			<p class="text-xs font-semibold uppercase tracking-widest text-primary">
				Secure checkout preview
			</p>
			<Heading size="h2" weight="bold">Just a few useful details.</Heading>
		</header>
		<Meter
			value={{ value: step + 1, color: 'primary' }}
			max={3}
			label={`Step ${step + 1} of 3 · ${['Contact', 'Delivery', 'Review'][step]}`}
		/>
		<div class="grid gap-xl md:grid-cols-[1fr_16rem]">
			<div class="flex flex-col gap-xl">
				<nav aria-label="Checkout steps" class="flex gap-md flex-wrap">
					{#each ['Contact', 'Delivery', 'Review'] as label, index (label)}<Button
							size="small"
							variant={index === step ? 'soft' : 'ghost'}
							disabled={index > furthest}
							onclick={() => (step = index)}>{index + 1}. {label}</Button
						>{/each}
				</nav>
				{#if step === 0}<Form
						title="Contact details"
						description="Where should your sample order details go?"
						inputs={{
							name: {
								type: 'text',
								label: 'Full name',
								required: true,
								defaultValue: contact.name
							},
							email: {
								type: 'email',
								label: 'Email address',
								required: true,
								defaultValue: contact.email
							}
						}}
						onSubmit={(values) => {
							contact = { name: values.name ?? '', email: values.email ?? '' };
							step = 1;
							furthest = Math.max(furthest, 1);
						}}
						actions={[{ children: 'Continue to delivery', onAction: (form) => form.submit() }]}
					/>{:else if step === 1}<Form
						title="Delivery address"
						inputs={{
							street: {
								type: 'text',
								label: 'Street address',
								required: true,
								defaultValue: address.street
							},
							city: { type: 'text', label: 'City', required: true, defaultValue: address.city },
							postal: {
								type: 'text',
								label: 'Postal code',
								required: true,
								defaultValue: address.postal
							},
							country: {
								type: 'select',
								label: 'Country',
								required: true,
								defaultValue: address.country,
								items: [
									{ value: 'France', label: 'France' },
									{ value: 'United Kingdom', label: 'United Kingdom' },
									{ value: 'United States', label: 'United States' }
								]
							}
						}}
						onSubmit={(values) => {
							address = {
								street: values.street ?? '',
								city: values.city ?? '',
								postal: values.postal ?? '',
								country: values.country ?? ''
							};
							step = 2;
							furthest = 2;
						}}
						actions={[
							{ children: 'Review order', onAction: (form) => form.submit() },
							{ children: 'Back', variant: 'ghost', onAction: () => (step = 0) }
						]}
					/>{:else}<Card
						title="Review your details"
						description="No payment or order has been submitted."
						><div class="flex flex-col gap-xl">
							<div>
								<h3 class="font-medium">Contact</h3>
								<p class="mt-lg text-sm text-neutral/60">{contact.name}<br />{contact.email}</p>
							</div>
							<div>
								<h3 class="font-medium">Delivery</h3>
								<address class="mt-lg text-sm not-italic text-neutral/60">
									{address.street}<br />{address.postal}
									{address.city}<br />{address.country}
								</address>
							</div>
							<Chip variant="soft" color="success" class="w-fit"
								>Details checked · No order placed</Chip
							><Button variant="outline" onclick={() => (step = 0)}>Edit details</Button>
						</div></Card
					>{/if}
			</div>
			<aside>
				<Card title="Your order"
					><div class="flex flex-col gap-xl">
						{@render productArt('lamp', 'Sand')}
						<h3 class="font-medium">Arc desk lamp</h3>
						<p class="text-sm text-neutral/55">Sand · Quantity 1</p>
						<dl class="flex flex-col gap-lg text-sm">
							<div class="flex justify-between">
								<dt>Subtotal</dt>
								<dd>$148</dd>
							</div>
							<div class="flex justify-between">
								<dt>Delivery</dt>
								<dd>$8</dd>
							</div>
							<div class="flex justify-between border-t border-neutral/15 pt-lg font-semibold">
								<dt>Total</dt>
								<dd>$156</dd>
							</div>
						</dl>
					</div></Card
				>
			</aside>
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
