<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Checkbox } from 'svelai/checkbox';
	import { Select } from 'svelai/select';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	const outfit = [
		{ id: 'tee', name: 'Everyday tee', price: 48, description: 'Olive / Organic cotton' },
		{ id: 'tote', name: 'Daybreak tote', price: 64, description: 'Sand / Heavyweight canvas' },
		{ id: 'cup', name: 'Morning cup', price: 24, description: 'Chalk / Glazed stoneware' }
	];
	let selected = $state(['tee', 'tote', 'cup']);
	let size = $state('M');
	let added = $state('');
	const total = $derived(
		outfit
			.filter((piece) => selected.includes(piece.id))
			.reduce((sum, piece) => sum + piece.price, 0)
	);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">Shop the look</p>
		<Heading size="h2" weight="bold">Ready for the everyday.</Heading>
		<p class="max-w-2xl text-neutral/65">
			Three easy pieces, thoughtfully put together. Make the combination your own.
		</p>
	</header>
	<div class="grid gap-xl md:grid-cols-[1.2fr_1fr]">
		<div class="grid grid-cols-2 gap-lg rounded-lg bg-primary-muted p-xl">
			<div class="col-span-2">{@render productArt('shirt', 'Olive')}</div>
			<div>{@render productArt('bag', 'Sand')}</div>
			<div>{@render productArt('cup', 'Chalk')}</div>
		</div>
		<div class="flex flex-col gap-xl">
			{#each outfit as piece (piece.id)}<div
					class="flex flex-col gap-lg border-b border-neutral/15 pb-xl"
				>
					<div class="flex gap-lg justify-between">
						<Checkbox
							label={piece.name}
							value={selected.includes(piece.id)}
							onValueChange={(value) =>
								(selected = value
									? [...selected, piece.id]
									: selected.filter((id) => id !== piece.id))}
						/><span>{money(piece.price)}</span>
					</div>
					{#if piece.id === 'tee'}<Select
							label="T-shirt size"
							bind:value={size}
							items={['S', 'M', 'L', 'XL'].map((value) => ({ value, label: value }))}
						/>{:else}<p class="text-sm text-neutral/55">{piece.description}</p>{/if}
				</div>{/each}
			<div class="flex justify-between text-xl font-semibold">
				<span>Your look</span><span>{money(total)}</span>
			</div>
			<Button
				fullWidth
				disabled={!selected.length}
				onclick={() =>
					(added = `${selected.length} pieces${selected.includes('tee') ? ' · Tee size ' + size : ''}`)}
				>Add selected pieces</Button
			>
			<p class="text-sm text-success" aria-live="polite">
				{added ? `${added} added to sample bag.` : ''}
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
