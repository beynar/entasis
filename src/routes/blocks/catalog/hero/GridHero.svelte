<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
</script>

<section class="hero-grid flex flex-col items-center gap-xl overflow-hidden p-xl text-center">
	<Chip variant="outline">Designed for the way you think</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		class="max-w-3xl">Good tools make ambitious ideas possible.</Heading
	>
	<p class="max-w-xl text-lg text-neutral/70">
		Build a clear, expressive interface from components that were made to belong together.
	</p>
	<div class="flex flex-wrap justify-center gap-md">
		<Button href="/components" size="large">Explore the library</Button><Button
			href="/blocks"
			size="large"
			variant="outline">See the blocks</Button
		>
	</div>
	<div
		class="mt-xl flex w-full max-w-5xl flex-col gap-xl rounded-2xl border border-neutral-muted bg-surface p-xl"
	>
		<p class="text-xs uppercase tracking-widest text-neutral/50">
			A toolkit for every kind of team
		</p>
		<div
			class="flex flex-wrap items-center justify-center gap-xl text-xl font-semibold text-neutral/50"
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
