<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { arrowRightIcon } from 'svelai/icons/arrowRight';
</script>

<section
	class="relative isolate flex min-h-96 flex-col items-center justify-center gap-xl overflow-hidden bg-surface-recessed p-xl text-center"
>
	<div class="rings pointer-events-none absolute inset-0 -z-10" aria-hidden="true"></div>
	<Chip variant="outline">A small beginning</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		class="max-w-2xl">Make something worth coming back to.</Heading
	>
	<p class="max-w-lg text-neutral/70">
		Thoughtful components for the moments that turn a useful product into a great experience.
	</p>
	<Button href="/blocks" size="large" suffix={arrowRightIcon}>Find your starting point</Button>
</section>

<style>
	.rings {
		background: repeating-radial-gradient(
			circle at center,
			transparent 0,
			transparent 62px,
			color-mix(in srgb, var(--color-primary) 13%, transparent) 63px,
			transparent 64px
		);
		mask-image: linear-gradient(transparent, black);
	}
</style>
