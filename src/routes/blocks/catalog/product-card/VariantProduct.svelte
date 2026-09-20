<script lang="ts">
	import { Card } from 'entasis/card';
	import { Button } from 'entasis/button';

	let color = $state('Clay');
	let saved = $state(false);
	let added = $state('');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="mx-auto w-full max-w-md">
		<Card variant="ghost"
			><div class="gap-xl flex flex-col">
				<div class="relative">
					{@render productArt('vase', color)}<Button
						class="right-lg top-lg absolute"
						size="small"
						variant="soft"
						color={saved ? 'primary' : 'neutral'}
						pressed={saved}
						onclick={() => (saved = !saved)}>{saved ? 'Saved ♥' : 'Save ♡'}</Button
					>
				</div>
				<div class="gap-xl flex justify-between">
					<div>
						<h3 class="text-xl font-semibold">Everyday vessel</h3>
						<p class="mt-sm text-neutral/65 text-sm">Hand-finished stoneware</p>
					</div>
					<span class="text-lg">$38</span>
				</div>
				<div class="gap-md flex flex-col">
					<p class="text-sm">Finish: <strong>{color}</strong></p>
					<div class="gap-md flex flex-wrap">
						{#each ['Sand', 'Clay', 'Olive', 'Chalk'] as finish (finish)}<Button
								size="small"
								variant={color === finish ? 'solid' : 'outline'}
								color={color === finish ? 'primary' : 'neutral'}
								onclick={() => (color = finish)}
								pressed={color === finish}>{finish}</Button
							>{/each}
					</div>
				</div>
				<Button variant="outline" fullWidth onclick={() => (added = color)}>Add to bag →</Button
				>{#if added}<p aria-live="polite" class="text-success text-sm">
						{added} vessel added to the sample bag.
					</p>{/if}
			</div></Card
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
