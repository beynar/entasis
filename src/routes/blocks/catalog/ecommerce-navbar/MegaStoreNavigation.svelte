<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Popover } from 'svelai/popover';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { TextInput } from 'svelai/text-input';
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

	let query = $state('');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="overflow-hidden rounded-lg border border-neutral/15">
		<p class="bg-primary py-lg text-center text-xs text-primary-contrast">
			A little something for everyday. Free delivery over $150.
		</p>
		<header
			class="flex gap-xl items-center justify-between flex-wrap p-xl border-b border-neutral/15"
		>
			<a href="/components" class="text-xl font-semibold tracking-tight">FIELD OBJECTS</a>
			<nav aria-label="Store categories" class="flex gap-md items-center flex-wrap">
				<Popover
					size="large"
					position="bottom-start"
					mobileSheet
					trigger={{ content: 'Shop collection', variant: 'ghost', color: 'neutral' }}
					><div class="grid gap-xl sm:grid-cols-2">
						<div class="flex flex-col gap-md">
							<p class="text-xs uppercase tracking-widest text-neutral/50">Explore</p>
							{#each ['All objects', 'Lighting', 'Ceramics', 'Everyday carry', 'New arrivals'] as link (link)}<Button
									href="/components"
									variant="ghost"
									color="neutral"
									class="justify-start">{link} ↗</Button
								>{/each}
						</div>
						<div class="flex flex-col gap-lg">
							{@render productArt('vase', 'Clay')}
							<p class="font-medium">The everyday vessel</p>
							<p class="text-sm text-neutral/55">Small things, well made.</p>
						</div>
					</div></Popover
				><Button href="/docs" variant="ghost" color="neutral">Our story</Button><Button
					href="/docs"
					variant="ghost"
					color="neutral">Journal</Button
				>
			</nav>
			<Popover size="normal" trigger={{ content: 'Search', variant: 'outline', size: 'small' }}
				><div class="flex flex-col gap-lg">
					<TextInput
						label="Search collection"
						placeholder="Product name"
						bind:value={query}
					/>{#each products.filter((product) => product.name
							.toLowerCase()
							.includes((query ?? '').toLowerCase())) as product (product.id)}<Button
							href="/components"
							variant="ghost"
							color="neutral"
							class="justify-start">{product.name} · {money(product.price)}</Button
						>{:else}<p class="text-sm text-neutral/55">No matching objects.</p>{/each}
				</div></Popover
			>
		</header>
		<div class="flex flex-col gap-xl p-xl bg-surface-recessed">
			<Chip variant="soft" class="w-fit">New season</Chip><Heading size="h3"
				>Good things start with a little curiosity.</Heading
			>
			<p class="max-w-xl text-neutral/60">Explore the collection through the menu above.</p>
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
