<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
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

	let saved = $state(products);
	let bag = $state(0);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl flex flex-wrap justify-between">
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Saved for later
			</p>
			<Heading size="h2" weight="bold">A few things worth remembering.</Heading>
		</header>
		<Chip variant="soft">{saved.length} favorites</Chip>
	</div>
	<div class="gap-xl grid sm:grid-cols-2 lg:grid-cols-3">
		{#each saved as product (product.id)}<Card
				><div class="gap-xl flex flex-col">
					<div class="relative">
						{@render productArt(product.shape, product.color)}
						<div class="left-lg top-lg absolute">
							<Chip color="danger" size="small">Price drop</Chip>
						</div>
						<Button
							class="right-lg top-lg absolute"
							variant="soft"
							color="neutral"
							size="small"
							label={`Remove ${product.name} from wishlist`}
							onclick={() => (saved = saved.filter((entry) => entry.id !== product.id))}>×</Button
						>
					</div>
					<h3 class="text-lg font-semibold">{product.name}</h3>
					<div class="gap-md flex items-center">
						<span class="font-semibold">{money(product.price)}</span><s
							class="text-neutral/65 text-sm">{money(product.price * 1.2)}</s
						>
					</div>
					<Button
						fullWidth
						variant="outline"
						onclick={() => {
							bag += 1;
							saved = saved.filter((entry) => entry.id !== product.id);
						}}>Move to bag</Button
					>
				</div></Card
			>{/each}
	</div>
	{#if !saved.length}<Empty
			title="All your favorites are taken care of"
			description="Restore the sample list to keep exploring."
			actions={[{ content: 'Restore favorites', onclick: () => (saved = products) }]}
		/>{/if}
	<p class="text-success text-sm" aria-live="polite">
		{bag ? `${bag} items moved to the sample bag.` : ''}
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
