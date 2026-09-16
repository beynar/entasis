<script lang="ts">
	import { Heading } from 'svelai/heading';
	import { Button } from 'svelai/button';
	import { Checkbox } from 'svelai/checkbox';

	const rows = [
		['Height', '26 cm', '38 cm'],
		['Material', 'Aluminum', 'Aluminum'],
		['Light source', '5W LED', '8W LED'],
		['Dimming', '2 levels', '3 levels'],
		['Warranty', '5 years', '5 years']
	];
	let differences = $state(false);
	let selected = $state('');
</script>

<section class="gap-xl p-xl text-neutral mx-auto flex w-full max-w-6xl flex-col">
	{#snippet productArt(shape: string, color: string)}
		<div class="product-art" data-shape={shape} data-color={color} aria-hidden="true">
			<div class="object"></div>
		</div>
	{/snippet}
	<header class="gap-lg flex flex-col">
		<p class="text-primary-readable text-xs font-semibold tracking-widest uppercase">
			Side by side
		</p>
		<Heading size="h2" weight="bold">Choose the one that feels right.</Heading>
	</header>
	<Checkbox label="Show differences only" bind:value={differences} />
	<div class="overflow-x-auto">
		<table class="w-full min-w-[32rem] text-left text-sm">
			<thead
				><tr
					><th class="pb-xl text-neutral/65 w-1/3 font-normal">Arc collection</th><th
						class="pb-xl w-1/3 text-center"
						><div>{@render productArt('lamp', 'Chalk')}</div>
						<p class="mt-lg text-lg">Arc mini</p>
						<p class="mt-sm font-normal">$98</p></th
					><th class="pb-xl w-1/3 text-center"
						><div>{@render productArt('lamp', 'Sand')}</div>
						<p class="mt-lg text-lg">Arc original</p>
						<p class="mt-sm font-normal">$148</p></th
					></tr
				></thead
			><tbody
				>{#each rows.filter((row) => !differences || row[1] !== row[2]) as row (row[0])}<tr
						class="border-neutral/15 border-t"
						><th class="py-lg text-neutral/70 font-normal">{row[0]}</th><td class="text-center"
							>{row[1]}</td
						><td class="text-center">{row[2]}</td></tr
					>{/each}<tr
					><td></td><td class="p-lg"
						><Button fullWidth variant="outline" onclick={() => (selected = 'Arc mini')}
							>Choose mini</Button
						></td
					><td class="p-lg"
						><Button fullWidth onclick={() => (selected = 'Arc original')}>Choose original</Button
						></td
					></tr
				></tbody
			>
		</table>
	</div>
	<p class="text-success text-sm" aria-live="polite">
		{selected ? `${selected} selected for the sample bag.` : ''}
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
