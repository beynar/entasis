<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Dialog } from 'svelai/dialog';
	import { Rating } from 'svelai/rating';
	import { Accordion } from 'svelai/accordion';

	let open = $state(false);
	let added = $state(0);
</script>

<section class="flex flex-col gap-xl p-xl mx-auto w-full max-w-6xl text-neutral">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<div class="grid items-center gap-xl sm:grid-cols-2">
		<div>{@render productArt('lamp', 'Sand')}</div>
		<div class="flex flex-col gap-xl">
			<header class="flex flex-col gap-lg">
				<p class="text-xs font-semibold uppercase tracking-widest text-primary">
					Lighting / New season
				</p>
				<Heading size="h2" weight="bold">A better light for your everyday.</Heading>
			</header>
			<Button class="self-start" variant="outline" onclick={() => (open = true)}
				>Explore Arc lamp →</Button
			>
		</div>
	</div>
	<Dialog type="drawerRight" bind:open title="Arc desk lamp" description="Field objects / Lighting"
		><div class="flex flex-col gap-xl">
			{@render productArt('lamp', 'Sand')}
			<div class="flex gap-lg items-center justify-between">
				<p class="text-2xl">$148</p>
				<Rating value={4.8} size="small" />
			</div>
			<p class="text-neutral/65">
				Warm light, touch dimming, and a quiet silhouette. Designed for wherever your day takes you.
			</p>
			<Accordion
				items={[
					{
						title: 'Dimensions',
						content: '38 cm high, 24 cm shade diameter, 2 m textile cable.'
					},
					{ title: 'Materials', content: 'Powder-coated aluminum with a weighted steel base.' }
				]}
			/><Button fullWidth onclick={() => (added += 1)}>Add to bag</Button>
			<p class="text-sm text-success" aria-live="polite">
				{added ? `${added} in the sample bag` : 'In stock'}
			</p>
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
