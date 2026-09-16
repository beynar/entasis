<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Carousel } from 'svelai/carousel';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';

	const collections = [
		{
			title: 'A warmer kind of everyday.',
			description: 'Thoughtful lighting for the moments between the busy ones.',
			shape: 'lamp',
			color: 'Sand'
		},
		{
			title: 'Small things. Lasting company.',
			description: 'Everyday objects that feel a little more personal.',
			shape: 'vase',
			color: 'Clay'
		},
		{
			title: 'Take the good things with you.',
			description: 'Made for the morning commute and the long way home.',
			shape: 'bag',
			color: 'Olive'
		}
	];
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<Carousel
		items={collections}
		layout={1}
		pagination={{ variant: 'dots', color: 'primary' }}
		navigationButton={{ color: 'neutral' }}
		>{#snippet children({ item: collection, index })}<div
				class="bg-primary-muted grid overflow-hidden rounded-lg md:grid-cols-[1.1fr_1fr]"
			>
				<div class="gap-xl p-xl flex flex-col justify-center">
					<div class="gap-lg flex">
						<Chip size="small" variant="soft">Collection 0{index + 1}</Chip><span
							class="text-neutral/65 text-xs tracking-widest uppercase">Field objects</span
						>
					</div>
					<Heading size="h2" weight="normal">{collection.title}</Heading>
					<p class="text-neutral/65 max-w-md text-lg">{collection.description}</p>
					<Button href="/components" class="self-start">Shop the collection ↗</Button>
					<p class="text-neutral/65 text-xs">Considered design. Everyday purpose.</p>
				</div>
				<div class="p-xl">{@render productArt(collection.shape, collection.color)}</div>
			</div>{/snippet}</Carousel
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
