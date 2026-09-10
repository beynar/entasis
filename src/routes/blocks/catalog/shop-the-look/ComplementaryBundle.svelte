<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Checkbox } from 'svelai/checkbox';
	import { Chip } from 'svelai/chip';
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
		{ id: 'tote', name: 'Daybreak tote', type: 'Carry', price: 64, color: 'Olive', shape: 'bag' },
		{ id: 'cup', name: 'Morning cup', type: 'Objects', price: 24, color: 'Chalk', shape: 'cup' }
	];
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	const bundle = [products[0], products[1], products[3]];
	let selected = $state(bundle.map((product) => product.id));
	let added = $state(0);
	const total = $derived(
		bundle
			.filter((product) => selected.includes(product.id))
			.reduce((sum, product) => sum + product.price, 0)
	);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Better together</p>
		<Heading size="h2" weight="bold">Make yourself a good morning.</Heading>
		<p class="max-w-2xl text-neutral/65">A few favorites that feel even better in company.</p>
	</header>
	<div class="grid gap-xl lg:grid-cols-[2fr_1fr]">
		<div class="grid gap-xl sm:grid-cols-3">
			{#each bundle as product (product.id)}<article class="flex flex-col gap-lg">
					{@render productArt(product.shape, product.color)}<Checkbox
						label={product.name}
						value={selected.includes(product.id)}
						onValueChange={(value) =>
							(selected = value
								? [...selected, product.id]
								: selected.filter((id) => id !== product.id))}
					/>
					<p class="text-sm text-neutral/55">{money(product.price)}</p>
				</article>{/each}
		</div>
		<div class="flex flex-col gap-xl justify-center p-xl rounded-lg bg-surface-recessed">
			<Chip variant="soft" class="w-fit">Save 10% with all three</Chip><Heading size="h3"
				>Your everyday set</Heading
			>
			<p class="text-neutral/60">{selected.length} of 3 pieces selected</p>
			<p class="text-3xl font-semibold">{money(total * (selected.length === 3 ? 0.9 : 1))}</p>
			{#if selected.length === 3}<p class="text-sm text-success">
					You save {money(total * 0.1)}
				</p>{/if}<Button
				fullWidth
				disabled={!selected.length}
				onclick={() => (added = selected.length)}>Add selected to bag</Button
			>
			<p aria-live="polite" class="text-xs text-neutral/55">
				{added ? `${added} pieces added to sample bag.` : 'Choose the pieces you would like.'}
			</p>
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
	.product-art[data-color='Clay'] {
		--object-color: var(--color-secondary);
	}
	.product-art[data-color='Olive'] {
		--object-color: var(--color-success);
	}
	.product-art[data-color='Chalk'] {
		--object-color: var(--color-neutral-light);
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
	[data-shape='cup'] .object {
		width: 31%;
		height: 36%;
		border-radius: 0.3rem 0.3rem 2rem 2rem;
	}
	[data-shape='cup'] .object::after {
		content: '';
		position: absolute;
		width: 45%;
		height: 64%;
		border: 0.8rem solid var(--object-color);
		border-left: 0;
		border-radius: 0 50% 50% 0;
		right: -38%;
		top: 8%;
	}
</style>
