<script lang="ts">
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	import { Select } from 'svelai/select';
	import { NumberInput } from 'svelai/number-input';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	let expanded = $state(false);
	let size = $state('M');
	let quantity = $state(1);
	let added = $state('');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="mx-auto w-full max-w-md">
		<Card
			><div class="flex flex-col gap-xl">
				{@render productArt('shirt', 'Olive')}
				<div class="flex gap-lg justify-between">
					<div>
						<Chip variant="soft" size="small" class="mb-md w-fit">New season</Chip>
						<h3 class="text-xl font-semibold">The everyday tee</h3>
					</div>
					<span class="text-xl">$48</span>
				</div>
				<p class="text-neutral/60">Heavyweight organic cotton, cut for everyday comfort.</p>
				{#if expanded}<div class="grid grid-cols-2 gap-lg">
						<Select
							label="Size"
							items={['XS', 'S', 'M', 'L', 'XL'].map((value) => ({ label: value, value }))}
							bind:value={size}
						/><NumberInput
							label="Quantity"
							min={1}
							max={10}
							showControls
							value={quantity}
							onValueChange={(value) => (quantity = Math.max(1, Math.min(10, value ?? 1)))}
						/>
					</div>
					<Button fullWidth onclick={() => (added = `${quantity} × ${size}`)}
						>Add {money(quantity * 48)} to bag</Button
					><Button variant="ghost" size="small" onclick={() => (expanded = false)}
						>Close options</Button
					>{:else}<Button variant="outline" fullWidth onclick={() => (expanded = true)}
						>Choose size and quantity</Button
					>{/if}{#if added}<p role="status" class="text-sm text-success">
						Added {added} to the sample bag.
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
