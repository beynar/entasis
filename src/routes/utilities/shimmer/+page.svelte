<script lang="ts">
	import Code from '$lib/components/Code/Code.svelte';
	import Separator from '$lib/components/Separator/Separator.svelte';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';

	const controls = createComponentControls([
		{
			name: 'effect',
			type: 'segmented',
			label: 'Effect',
			value: 'loop',
			options: ['loop', 'once', 'reverse', 'off']
		}
	]);
	const effectClasses = {
		loop: '',
		once: 'shimmer-once',
		reverse: 'shimmer-reverse',
		off: 'shimmer-none'
	} as const;

	const usageCode = `<p class="shimmer text-neutral/70">
	Generating response...
</p>`;

	const colorCode = `<p class="shimmer shimmer-color-blue-500/60">
	Generating response...
</p>

<p class="shimmer shimmer-color-[#378ADD]/25">
	Generating response...
</p>`;

	const timingCode = `<p class="shimmer shimmer-duration-1000 shimmer-spread-24 shimmer-angle-45">
	Generating response...
</p>

<p class="shimmer shimmer-spread-[15%]">
	Percentage spread
</p>

<p class="shimmer shimmer-spread-[5rem]">
	Length spread
</p>`;

	const utilityRows = [
		['shimmer', 'Applies the text shimmer animation.'],
		['shimmer-once', 'Runs one sweep instead of looping.'],
		['shimmer-reverse', 'Reverses the sweep direction.'],
		['shimmer-none', 'Disables the shimmer and renders normal text.'],
		['shimmer-color-<color>', 'Sets the highlight color. Opacity modifiers are supported.'],
		['shimmer-duration-<number>', 'Sets one sweep duration in milliseconds.'],
		['shimmer-spread-<number>', 'Sets highlight width from the spacing scale.'],
		['shimmer-spread-[<value>]', 'Sets a one-off highlight width.'],
		['shimmer-angle-<number>', 'Sets the highlight angle in degrees.']
	];
</script>

{#snippet ic(text: string)}
	<code class="bg-neutral-muted rounded px-1 py-0.5 text-sm">{text}</code>
{/snippet}

<article class="text-neutral mx-auto grid max-w-3xl gap-4 pb-20">
	<header class="grid gap-2">
		<h1 class="text-3xl font-semibold">Shimmer</h1>
		<p class="text-neutral/70 text-balance">
			Tailwind utilities for adding a shadcn-style shimmer effect to text.
		</p>
	</header>

	<ComponentCard
		{controls}
		description="Add the shimmer class to text that is waiting, loading, or streaming."
		code={usageCode}
		class="!min-h-[220px]"
	>
		<p class="shimmer text-neutral/70 text-sm {effectClasses[controls.value.effect]}">
			Generating response...
		</p>
	</ComponentCard>

	<Separator class="my-2" children="Usage" />

	<p class="text-neutral/70">
		Use {@render ic('shimmer')} on the text element. The highlight is based on
		{@render ic('currentColor')}, so it follows semantic text classes.
	</p>
	<Code language="html" code={usageCode} />

	<div class="border-neutral-muted overflow-hidden rounded-xl border">
		{#each utilityRows as [name, description], index (name)}
			<div
				class="grid gap-2 p-3 md:grid-cols-[14rem_1fr] {index % 2 === 0
					? 'bg-surface'
					: 'bg-surface-canvas'}"
			>
				<code class="text-primary-readable text-sm font-medium">{name}</code>
				<p class="text-neutral/70 text-sm">{description}</p>
			</div>
		{/each}
	</div>

	<Separator class="my-2" children="Examples" />

	<ComponentCard
		description="Set a custom shimmer color with theme colors, opacity modifiers, or arbitrary colors."
		code={colorCode}
		class="!min-h-[240px]"
	>
		<div class="grid gap-3 text-sm">
			<p class="shimmer shimmer-color-blue-500/60 text-neutral/70">Generating response...</p>
			<p class="shimmer shimmer-color-[#378ADD]/25 text-neutral/70">Generating response...</p>
		</div>
	</ComponentCard>

	<ComponentCard
		description="Tune timing, spread, and angle with numeric utilities."
		code={timingCode}
		class="!min-h-[240px]"
	>
		<div class="text-neutral/70 grid gap-3 text-center text-sm sm:grid-cols-2">
			<p class="shimmer shimmer-duration-1000">shimmer-duration-1000</p>
			<p class="shimmer shimmer-spread-24 shimmer-angle-45">spread 24 / angle 45</p>
			<p class="shimmer shimmer-spread-[15%]">spread 15%</p>
			<p class="shimmer shimmer-spread-[5rem]">spread 5rem</p>
		</div>
	</ComponentCard>
</article>
