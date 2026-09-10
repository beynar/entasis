<script lang="ts">
	import { Button } from 'svelai/button';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
</script>

<section
	class="atmosphere relative isolate flex min-h-96 flex-col items-center justify-center gap-xl overflow-hidden p-xl text-center"
>
	<Chip variant="outline">A little room to think</Chip><Heading
		as="h2"
		size="h1"
		weight="bold"
		class="max-w-2xl">Turn an open canvas into your next chapter.</Heading
	>
	<p class="max-w-lg text-neutral/70">
		A soft background that gives your message space, with colors drawn from your active theme.
	</p>
	<Button href="/components">Start exploring</Button>
</section>

<style>
	.atmosphere {
		background:
			radial-gradient(
				ellipse at 50% 50%,
				color-mix(in srgb, var(--color-primary) 24%, transparent),
				transparent 70%
			),
			var(--color-surface);
	}
</style>
