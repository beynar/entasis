<script lang="ts">
	import { Button } from 'entasis/button';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
</script>

<section class="hero-grid gap-xl p-xl flex flex-col items-center overflow-hidden text-center">
	<Chip variant="outline">Designed for the way you think</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		class="max-w-3xl">Good tools make ambitious ideas possible.</Heading
	>
	<p class="text-neutral/70 max-w-xl text-lg">
		Build a clear, expressive interface from components that were made to belong together.
	</p>
	<div class="gap-md flex flex-wrap justify-center">
		<Button href="/components" size="large">Explore the library</Button><Button
			href="/blocks"
			size="large"
			variant="outline">See the blocks</Button
		>
	</div>
	<div
		class="mt-xl gap-xl border-neutral-muted bg-surface p-xl flex w-full max-w-5xl flex-col rounded-2xl border"
	>
		<p class="text-neutral/65 text-xs tracking-widest uppercase">
			A toolkit for every kind of team
		</p>
		<div
			class="gap-xl text-neutral/65 flex flex-wrap items-center justify-center text-xl font-semibold"
		>
			<span>Layers</span><span class="font-serif italic">Quotient</span><span>✳ Capsule</span><span
				class="tracking-tight">Sisyphus</span
			><span>◈ Circooles</span>
		</div>
	</div>
</section>

<style>
	.hero-grid {
		background-image:
			linear-gradient(
				color-mix(in srgb, var(--color-neutral) 5%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				color-mix(in srgb, var(--color-neutral) 5%, transparent) 1px,
				transparent 1px
			);
		background-size: 48px 48px;
	}
</style>
