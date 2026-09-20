<script lang="ts">
	import { Heading } from 'entasis/heading';
	import { Chip } from 'entasis/chip';
	import { Button } from 'entasis/button';
	import { Rating } from 'entasis/rating';

	let finish = $state('Clay');
	let added = $state('');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-xl flex flex-wrap justify-between">
		<div>
			<div class="gap-lg flex flex-col">
				<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
					Objects for everyday
				</p>
				<Heading size="h2" weight="bold">The everyday vessel.</Heading>
			</div>
		</div>
		<Chip variant="outline" color="neutral" class="h-fit">Collection № 04</Chip>
	</header>
	<div class="gap-xl grid lg:grid-cols-[1fr_1.6fr_1fr]">
		<div class="gap-xl flex flex-col justify-center">
			<p class="text-xl leading-relaxed">Useful on its own.<br />Beautiful in company.</p>
			<p class="text-neutral/70">
				A small stoneware vessel for flowers, kitchen tools, or nothing at all. Each one is finished
				by hand.
			</p>
			<dl class="gap-lg flex flex-col text-sm">
				<div>
					<dt class="text-neutral/65">Material</dt>
					<dd>Glazed stoneware</dd>
				</div>
				<div>
					<dt class="text-neutral/65">Dimensions</dt>
					<dd>H 18 × Ø 12 cm</dd>
				</div>
			</dl>
		</div>
		<div class="flex items-center">{@render productArt('vase', finish)}</div>
		<div class="gap-xl flex flex-col justify-center">
			<p class="text-3xl">$38</p>
			<Rating value={4.9} size="small" />
			<p class="text-sm">Finish: {finish}</p>
			<div class="gap-md flex flex-col">
				{#each ['Clay', 'Sand', 'Chalk'] as color (color)}<Button
						fullWidth
						variant={finish === color ? 'soft' : 'outline'}
						onclick={() => (finish = color)}
						pressed={finish === color}>{color}</Button
					>{/each}
			</div>
			<Button fullWidth onclick={() => (added = finish)}>Add to bag →</Button>
			<p class="text-neutral/65 text-xs" aria-live="polite">
				{added ? `${added} added to the sample bag.` : 'Made in small batches. Packed with care.'}
			</p>
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
