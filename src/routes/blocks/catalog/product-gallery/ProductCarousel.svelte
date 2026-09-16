<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
	import { Chip } from 'svelai/chip';

	const views = [
		{ label: 'Sand / Front', color: 'Sand', rotation: 0 },
		{ label: 'Olive / Profile', color: 'Olive', rotation: -8 },
		{ label: 'Chalk / Detail', color: 'Chalk', rotation: 8 }
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			A closer look
		</p>
		<Heading size="h2" weight="bold">Arc, from every angle.</Heading>
	</header>
	<Carousel
		items={views}
		layout={{ xs: 1, md: 2, lg: 2, xl: 2 }}
		navigationButton={{ color: 'neutral' }}
		pagination={{ variant: 'dots', color: 'primary' }}
		>{#snippet children({ item: view, index })}<figure class="gap-lg flex flex-col">
				<div style:transform={`rotate(${view.rotation}deg)`}>
					{@render productArt('lamp', view.color)}
				</div>
				<figcaption class="gap-lg flex justify-between">
					<span>{view.label}</span><Chip size="small" variant="soft">0{index + 1}</Chip>
				</figcaption>
			</figure>{/snippet}</Carousel
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
</style>
