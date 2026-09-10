<script lang="ts">
	import { Button } from 'svelai/button';
	import { Card } from 'svelai/card';
	import { Chip } from 'svelai/chip';
	import { Heading } from 'svelai/heading';
	import { Meter } from 'svelai/meter';
</script>

<section
	class="blueprint relative isolate grid min-h-96 items-center gap-xl overflow-hidden p-xl md:grid-cols-2"
>
	<div class="relative flex flex-col gap-lg">
		<span class="text-sm uppercase tracking-widest text-primary">Built with intention</span><Heading
			as="h2"
			size="h1"
			weight="bold">Every idea needs a foundation.</Heading
		><Button href="/docs" variant="outline" class="self-start">Read the foundations</Button>
	</div>
	<Card
		class="relative md:rotate-3"
		title="Your next product"
		description="One thoughtful decision at a time."
		><div class="flex flex-col gap-lg">
			<div class="flex items-center gap-md">
				<Chip color="success">Ready</Chip><span class="text-sm text-neutral/60"
					>Design system connected</span
				>
			</div>
			<Meter label="Foundation complete" value={{ value: 76, color: 'primary' }} />
			<div class="flex justify-between text-sm">
				<span>24 components</span><span>One shared language</span>
			</div>
		</div></Card
	>
</section>

<style>
	.blueprint {
		background-color: var(--color-surface);
		background-image:
			linear-gradient(
				color-mix(in srgb, var(--color-neutral) 9%, transparent) 1px,
				transparent 1px
			),
			linear-gradient(
				90deg,
				color-mix(in srgb, var(--color-neutral) 9%, transparent) 1px,
				transparent 1px
			);
		background-size: 36px 36px;
	}
	.blueprint::before {
		position: absolute;
		inset: 0;
		content: '';
		background: radial-gradient(ellipse at top right, transparent, var(--color-surface) 90%);
	}
</style>
