<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Dialog } from 'entasis/dialog';
	import { Button } from 'entasis/button';
	import { TextInput } from 'entasis/text-input';
	import { Empty } from 'entasis/empty';
	import { Tabbar } from 'entasis/tabbar';
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

	let open = $state(false);
	let query = $state('');
	let category = $state('All');
	let added = $state('');
	const matches = $derived(
		products.filter(
			(product) =>
				(category === 'All' || product.type === category) &&
				(product.name + ' ' + product.type).toLowerCase().includes((query ?? '').toLowerCase())
		)
	);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl flex flex-wrap items-center justify-between">
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Field objects
			</p>
			<Heading size="h2" weight="bold">Discover your next everyday favorite.</Heading>
		</header>
		<Button onclick={() => (open = true)} variant="outline">Search store →</Button>
	</div>
	<Dialog
		type="drawerRight"
		bind:open
		title="Search the collection"
		description="Useful things, easy to find."
		><div class="gap-xl flex flex-col">
			<TextInput
				label="Product name or category"
				placeholder="Search products"
				bind:value={query}
			/><Tabbar items={['All', 'Lighting', 'Objects', 'Carry']} bind:value={category} />
			<p class="text-neutral/65 text-sm">{matches.length} results</p>
			<div class="gap-lg flex flex-col">
				{#each matches as product (product.id)}<div
						class="gap-lg bg-surface-recessed p-lg grid grid-cols-[5rem_1fr_auto] items-center rounded-lg"
					>
						<div>{@render productArt(product.shape, product.color)}</div>
						<div>
							<h3 class="text-sm font-semibold">{product.name}</h3>
							<p class="mt-sm text-neutral/65 text-xs">{product.type} · {money(product.price)}</p>
						</div>
						<Button variant="ghost" size="small" onclick={() => (added = product.name)}>Add</Button>
					</div>{:else}<Empty
						title="No products found"
						description="Try lamp, vessel, tote, or cup."
					/>{/each}
			</div>
			<p class="text-success text-sm" aria-live="polite">
				{added ? `${added} added to sample bag.` : ''}
			</p>
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
