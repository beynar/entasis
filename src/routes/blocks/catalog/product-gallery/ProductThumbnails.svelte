<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';

	const finishes = ['Clay', 'Sand', 'Olive', 'Chalk'];
	let selected = $state(0);
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Form & finish
		</p>
		<Heading size="h2" weight="bold">Find your favorite finish.</Heading>
	</header>
	<div class="gap-xl grid md:grid-cols-[10rem_1fr]">
		<nav aria-label="Product finish views" class="gap-lg flex md:flex-col">
			{#each finishes as finish, i (finish)}<Button
					variant={selected === i ? 'soft' : 'outline'}
					class="flex-1 md:flex-none"
					onclick={() => (selected = i)}
					pressed={selected === i}>{finish}</Button
				>{/each}
		</nav>
		<figure class="gap-xl flex flex-col">
			{@render productArt('vase', finishes[selected])}
			<figcaption class="gap-lg flex flex-wrap justify-between">
				<div>
					<Heading size="h4">Everyday vessel / {finishes[selected]}</Heading>
					<p class="mt-md text-neutral/65">
						Hand-finished glaze. Small variations make each piece its own.
					</p>
				</div>
				<Chip class="h-fit" variant="soft">{selected + 1} of {finishes.length}</Chip>
			</figcaption>
		</figure>
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
</style>
