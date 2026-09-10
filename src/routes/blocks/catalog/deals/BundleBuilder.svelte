<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Checkbox } from 'svelai/checkbox';
	import { Meter } from 'svelai/meter';
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

	let selected = $state<string[]>([]);
	let added = $state(0);
	const total = $derived(
		products
			.filter((product) => selected.includes(product.id))
			.reduce((sum, product) => sum + product.price, 0)
	);
	const discount = $derived(selected.length >= 3 ? 0.15 : selected.length >= 2 ? 0.1 : 0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Better together</p>
		<Heading size="h2" weight="bold">Build a little collection.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Pick two objects and save 10%. Pick three or more and save 15%.
		</p>
	</header>
	<Meter
		value={{ value: selected.length, color: 'primary' }}
		max={3}
		label={`${selected.length} objects selected`}
	/>
	<div class="grid gap-xl sm:grid-cols-2 lg:grid-cols-4">
		{#each products as product (product.id)}<article
				class="flex flex-col gap-lg p-lg rounded-lg border border-neutral/15"
			>
				{@render productArt(product.shape, product.color)}<Checkbox
					label={product.name}
					value={selected.includes(product.id)}
					onValueChange={(value) =>
						(selected = value
							? [...selected, product.id]
							: selected.filter((id) => id !== product.id))}
				/><span class="text-sm text-neutral/55">{money(product.price)}</span>
			</article>{/each}
	</div>
	<div class="flex gap-xl items-center justify-between flex-wrap p-xl rounded-lg bg-primary-muted">
		<div>
			<Chip variant="soft" class="mb-lg w-fit">{Math.round(discount * 100)}% bundle saving</Chip>
			<p class="text-2xl font-semibold">
				{money(total * (1 - discount))}
				{#if discount}<s class="text-lg font-normal text-neutral/45">{money(total)}</s>{/if}
			</p>
		</div>
		<Button disabled={!selected.length} onclick={() => (added = selected.length)}
			>Add collection to bag</Button
		>
	</div>
	<p class="text-sm text-success" aria-live="polite">
		{added ? `${added} objects added to the sample bag.` : ''}
	</p>
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
