<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Dialog } from 'svelai/dialog';
	import { Select } from 'svelai/select';

	let open = $state(false);
	let color = $state('Clay');
	let added = $state('');
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="flex flex-col gap-lg">
		<p class="text-xs font-semibold uppercase tracking-widest text-primary">A quick look</p>
		<Heading size="h2" weight="bold">Meet the everyday vessel.</Heading>
	</header>
	<div class="mx-auto w-full max-w-sm">
		<Card
			><div class="flex flex-col gap-xl">
				{@render productArt('vase', 'Clay')}
				<div class="flex justify-between">
					<h3 class="font-semibold">Everyday vessel</h3>
					<span>$38</span>
				</div>
				<Button variant="outline" fullWidth onclick={() => (open = true)}>Quick view</Button>
			</div></Card
		>
	</div>
	<Dialog bind:open title="Everyday vessel" description="Hand-finished stoneware · $38" size="large"
		><div class="grid gap-xl sm:grid-cols-2">
			{@render productArt('vase', color)}
			<div class="flex flex-col gap-xl">
				<Chip class="w-fit" variant="soft">Small batch</Chip>
				<p class="text-neutral/65">
					A versatile vessel for flowers, useful tools, or nothing at all.
				</p>
				<Select
					label="Finish"
					bind:value={color}
					items={['Clay', 'Sand', 'Chalk'].map((value) => ({ value, label: value }))}
				/><Button onclick={() => (added = color)}>Add to sample bag</Button>{#if added}<p
						class="text-sm text-success"
						role="status"
					>
						{added} vessel added.
					</p>{/if}<Button href="/components" variant="link">View collection ↗</Button>
			</div>
		</div></Dialog
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
