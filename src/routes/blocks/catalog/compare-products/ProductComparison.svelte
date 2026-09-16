<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Button } from 'svelai/button';
	const money = (amount: number) =>
		new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			maximumFractionDigits: 0
		}).format(amount);

	const lamps = [
		{
			name: 'Arc mini',
			color: 'Chalk',
			label: 'For small spaces',
			description: 'A little light for a bedside table or reading nook.',
			height: '26 cm',
			levels: '2 levels',
			power: '5W LED',
			price: 98
		},
		{
			name: 'Arc original',
			color: 'Sand',
			label: 'For every day',
			description: 'A generous pool of light for a desk or living space.',
			height: '38 cm',
			levels: '3 levels',
			power: '8W LED',
			price: 148
		}
	];
	let added = $state('');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Find your fit
		</p>
		<Heading size="h2" weight="bold">Two good options. Different kinds of light.</Heading>
	</header>
	<div class="gap-xl grid sm:grid-cols-2">
		{#each lamps as lamp (lamp.name)}<Card
				><div class="gap-xl flex flex-col">
					{@render productArt('lamp', lamp.color)}
					<div class="gap-lg flex justify-between">
						<h3 class="text-xl font-semibold">{lamp.name}</h3>
						<Chip variant="soft" size="small">{lamp.label}</Chip>
					</div>
					<p class="text-neutral/65">{lamp.description}</p>
					<dl class="gap-lg flex flex-col text-sm">
						<div class="flex justify-between">
							<dt class="text-neutral/65">Height</dt>
							<dd>{lamp.height}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-neutral/65">Light levels</dt>
							<dd>{lamp.levels}</dd>
						</div>
						<div class="flex justify-between">
							<dt class="text-neutral/65">Power</dt>
							<dd>{lamp.power}</dd>
						</div>
					</dl>
					<Button fullWidth onclick={() => (added = lamp.name)}
						>Add to bag · {money(lamp.price)}</Button
					>
				</div></Card
			>{/each}
	</div>
	<p class="text-success text-sm" aria-live="polite">
		{added ? `${added} added to the sample bag.` : ''}
	</p>
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
