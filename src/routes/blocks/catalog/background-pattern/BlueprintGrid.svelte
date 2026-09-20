<script lang="ts">
	import { Button } from 'entasis/button';
	import { Card } from 'entasis/card';
	import { Chip } from 'entasis/chip';
	import { Heading } from 'entasis/heading';
	import { Meter } from 'entasis/meter';
</script>

<section
	class="blueprint gap-xl p-xl relative isolate grid min-h-96 items-center overflow-hidden md:grid-cols-2"
>
	<div class="gap-lg relative flex flex-col">
		<span class="text-primary-readable text-sm tracking-widest uppercase">Built with intention</span
		><Heading as="h2" size="h1" weight="bold">Every idea needs a foundation.</Heading><Button
			href="/docs"
			variant="outline"
			class="self-start">Read the foundations</Button
		>
	</div>
	<Card
		class="relative md:rotate-3"
		title="Your next product"
		description="One thoughtful decision at a time."
		><div class="gap-lg flex flex-col">
			<div class="gap-md flex items-center">
				<Chip color="success">Ready</Chip><span class="text-neutral/70 text-sm"
					>Design system connected</span
				>
			</div>
			<Meter label="Foundation complete" value={76} color="primary" />
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
