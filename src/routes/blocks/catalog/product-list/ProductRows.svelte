<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
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
		{ id: 'tote', name: 'Daybreak tote', type: 'Carry', price: 64, color: 'Olive', shape: 'bag' }
	];
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let added = $state('');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="grid gap-xl md:grid-cols-[1fr_2fr]">
		<aside class="flex flex-col gap-xl justify-center p-xl rounded-lg bg-primary-muted">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">A few favorites</p>
				<Heading size="h2" weight="bold">Everyday,<br />made better.</Heading>
				<p class="max-w-2xl text-neutral/65">
					Small, useful upgrades to the objects you reach for most.
				</p>
			</header>
			<Chip variant="soft" class="w-fit">Made to keep</Chip>
		</aside>
		<div>
			{#each products as product (product.id)}<article
					class="grid grid-cols-[7rem_1fr_auto] items-center gap-xl border-b border-neutral/15 py-xl"
				>
					<div>{@render productArt(product.shape, product.color)}</div>
					<div class="flex flex-col gap-md">
						<span class="text-xs uppercase tracking-widest text-neutral/45">{product.type}</span>
						<h3 class="font-semibold">{product.name}</h3>
						<p class="text-sm text-neutral/55">{product.color} / {money(product.price)}</p>
					</div>
					<Button size="small" variant="outline" onclick={() => (added = product.name)}>Add</Button>
				</article>{/each}
		</div>
	</div>
	<p class="text-sm text-success" aria-live="polite">
		{added ? `${added} added to the sample bag.` : ''}
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
