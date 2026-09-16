<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Select } from 'svelai/select';
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
		{ id: 'tote', name: 'Daybreak tote', type: 'Carry', price: 64, color: 'Olive', shape: 'bag' },
		{ id: 'cup', name: 'Morning cup', type: 'Objects', price: 24, color: 'Chalk', shape: 'cup' }
	];
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let saved = $state([...products]);
	let bag = $state(0);
	let sort = $state('saved');
	let copied = $state(false);
	let copyError = $state('');
	const sorted = $derived(
		[...saved].sort((a, b) =>
			sort === 'price' ? a.price - b.price : sort === 'name' ? a.name.localeCompare(b.name) : 0
		)
	);
	async function copyList() {
		try {
			await navigator.clipboard.writeText(
				saved.map((product) => `${product.name} — ${money(product.price)}`).join('\n')
			);
			copied = true;
			copyError = '';
		} catch (error) {
			copyError = error instanceof Error ? error.message : 'The browser could not copy your list.';
		}
	}
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl flex flex-wrap items-end justify-between">
		<header class="gap-lg flex flex-col">
			<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
				Your wishlist
			</p>
			<Heading size="h2" weight="bold">Keep the good ideas close.</Heading>
		</header>
		<Button variant="outline" onclick={copyList}>{copied ? 'List copied' : 'Copy wishlist'}</Button>
	</div>
	<Select
		label="Sort wishlist"
		bind:value={sort}
		items={[
			{ value: 'saved', label: 'Recently saved' },
			{ value: 'price', label: 'Price: low to high' },
			{ value: 'name', label: 'Product name' }
		]}
		class="max-w-xs"
	/>{#each sorted as product (product.id)}<article
			class="gap-xl border-neutral/15 py-xl grid items-center border-t sm:grid-cols-[6rem_1fr_auto]"
		>
			<div>{@render productArt(product.shape, product.color)}</div>
			<div>
				<h3 class="font-semibold">{product.name}</h3>
				<p class="mt-md text-neutral/65 text-sm">{product.color} · {money(product.price)}</p>
			</div>
			<div class="gap-md flex flex-wrap">
				<Button
					variant="outline"
					size="small"
					onclick={() => {
						bag += 1;
						saved = saved.filter((entry) => entry.id !== product.id);
					}}>Move to bag</Button
				><Button
					variant="ghost"
					color="neutral"
					size="small"
					onclick={() => (saved = saved.filter((entry) => entry.id !== product.id))}>Remove</Button
				>
			</div>
		</article>{:else}<Empty
			title="Your list is empty"
			actions={[{ content: 'Restore favorites', onclick: () => (saved = [...products]) }]}
		/>{/each}
	<p class="text-success text-sm" aria-live="polite">
		{bag ? `${bag} items moved to sample bag.` : ''}
	</p>
	{#if copyError}<p role="alert" class="text-danger text-sm">{copyError}</p>{/if}
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
