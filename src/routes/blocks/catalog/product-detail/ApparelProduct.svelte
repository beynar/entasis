<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Select } from 'svelai/select';
	import { Accordion } from 'svelai/accordion';

	let color = $state('Olive');
	let size = $state('M');
	let added = $state('');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="grid gap-xl md:grid-cols-[1.3fr_1fr]">
		<div class="grid gap-lg sm:grid-cols-2">
			<div class="sm:col-span-2">{@render productArt('shirt', color)}</div>
			<div class="rounded-lg bg-surface-recessed p-xl">
				<p class="text-xs uppercase tracking-widest text-neutral/50">The fabric</p>
				<p class="mt-lg text-3xl font-light">100%<br />organic cotton</p>
			</div>
			<div class="rounded-lg bg-primary-muted p-xl">
				<p class="text-xs uppercase tracking-widest text-primary">The fit</p>
				<p class="mt-lg text-3xl font-light">Relaxed.<br />Not oversized.</p>
			</div>
		</div>
		<div class="flex flex-col gap-xl">
			<Chip class="w-fit" variant="soft">Core collection</Chip><Heading size="h2"
				>The everyday tee</Heading
			>
			<p class="text-2xl">$48</p>
			<p class="text-neutral/65">
				A substantial cotton tee with a soft hand and a neckline that holds its shape. An everyday
				essential, carefully considered.
			</p>
			<div class="flex flex-col gap-lg">
				<p class="text-sm font-medium">Color / {color}</p>
				<div class="flex gap-md flex-wrap">
					{#each ['Sand', 'Olive', 'Chalk'] as finish (finish)}<Button
							size="small"
							variant={color === finish ? 'soft' : 'outline'}
							onclick={() => (color = finish)}
							aria-pressed={color === finish}>{finish}</Button
						>{/each}
				</div>
			</div>
			<Select
				label="Size"
				bind:value={size}
				items={['XS', 'S', 'M', 'L', 'XL'].map((value) => ({ value, label: value }))}
			/>
			<p class="text-xs text-neutral/55">True to size. Choose one size up for a looser fit.</p>
			<Button fullWidth onclick={() => (added = `${color} / ${size}`)}>Add to bag</Button
			>{#if added}<p role="status" class="text-sm text-success">
					{added} added to the sample bag.
				</p>{/if}<Accordion
				items={[
					{
						title: 'Care guide',
						content:
							'Wash at 30°C with similar colors. Reshape while damp and air dry. Avoid tumble drying to preserve the fit.'
					},
					{
						title: 'Size guide',
						content:
							'Chest width: XS 48 cm, S 51 cm, M 54 cm, L 57 cm, XL 60 cm. Measurements are taken flat.'
					}
				]}
			/>
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
	[data-shape='shirt'] .object {
		width: 58%;
		height: 64%;
		clip-path: polygon(
			28% 0,
			39% 6%,
			61% 6%,
			72% 0,
			100% 18%,
			85% 41%,
			74% 33%,
			74% 100%,
			26% 100%,
			26% 33%,
			15% 41%,
			0 18%
		);
	}
</style>
