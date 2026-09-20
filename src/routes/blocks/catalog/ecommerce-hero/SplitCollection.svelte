<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Carousel } from 'entasis/carousel';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
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
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="gap-xl grid lg:grid-cols-[1fr_1.2fr]">
		<div class="gap-xl p-xl bg-primary-muted flex flex-col justify-between rounded-lg">
			<Chip variant="soft" class="w-fit">The everyday collection</Chip>
			<div class="gap-xl flex flex-col">
				<Heading size="h2">Good things.<br />For ordinary days.</Heading>
				<p class="text-neutral/65 max-w-md text-lg">
					Useful objects, thoughtful materials, and a little attention to the details you touch
					every day.
				</p>
				<Button href="/components" class="self-start">Discover the collection ↗</Button>
			</div>
			<p class="text-neutral/65 text-xs tracking-widest uppercase">Made to use. Made to keep.</p>
		</div>
		<Carousel
			items={products}
			layout={1}
			navigationButton={{ color: 'neutral' }}
			pagination={{ variant: 'dots', color: 'primary' }}
			>{#snippet children({ item: product })}<div class="gap-xl flex flex-col">
					{@render productArt(product.shape, product.color)}
					<div class="gap-lg flex items-center justify-between">
						<div>
							<h3 class="text-xl font-medium">{product.name}</h3>
							<p class="mt-sm text-neutral/65 text-sm">{product.color} / {product.type}</p>
						</div>
						<span>{money(product.price)}</span>
					</div>
				</div>{/snippet}</Carousel
		>
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
