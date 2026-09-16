<script lang="ts">
	import { Marquee } from '$lib/components/Marquee/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	const controls = createComponentControls([
		{
			name: 'size',
			type: 'segmented',
			label: 'Size',
			value: 'normal',
			options: ['small', 'normal', 'large']
		},
		{
			name: 'speed',
			type: 'segmented',
			label: 'Speed',
			value: 'fast',
			options: ['fast', 'normal', 'slow']
		},
		{ name: 'pauseOnHover', type: 'switch', label: 'Pause on hover', value: true }
	]);

	const testimonials = $state([
		{ id: 1, author: 'John Doe', quote: 'Amazing product! Highly recommended.' },
		{ id: 2, author: 'Jane Smith', quote: "Best purchase I've ever made." },
		{ id: 3, author: 'Bob Johnson', quote: 'Exceeded all my expectations.' },
		{ id: 4, author: 'Alice Williams', quote: 'Outstanding quality and service.' },
		{ id: 5, author: 'Charlie Brown', quote: "Couldn't be happier with this!" }
	]);

	const simpleItems = $state([
		{ id: 1, text: 'Item 1' },
		{ id: 2, text: 'Item 2' },
		{ id: 3, text: 'Item 3' },
		{ id: 4, text: 'Item 4' },
		{ id: 5, text: 'Item 5' }
	]);
</script>

<DocPage
	title="Marquee"
	subtitle="Continuously scrolls content in a horizontal or vertical loop."
	component="Marquee"
	features={[
		'CSS animation, no external library',
		'Pause on hover toggle',
		'Edge fade via the shared scroll-fade utility',
		'Horizontal or vertical direction',
		'Seamless loop via duplicated copies'
	]}
>
	<ComponentCard
		{controls}
		description="Basic horizontal marquee with simple items."
		code={`<Marquee
	size="${controls.value.size}"
	speed="${controls.value.speed}"
	pauseOnHover={${controls.value.pauseOnHover}}
	class="w-full max-w-[90vw]"
>
	<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">Item 1</div>
	<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">Item 2</div>
	<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">Item 3</div>
	<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">Item 4</div>
	<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">Item 5</div>
</Marquee>`}
	>
		<Marquee
			size={controls.value.size}
			speed={controls.value.speed}
			pauseOnHover={controls.value.pauseOnHover}
			class="w-full max-w-[90vw]"
		>
			{#each simpleItems as item, index (index)}
				<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">
					{item.text}
				</div>
			{/each}
		</Marquee>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard description="Basic horizontal marquee.">
			<Marquee class="w-full max-w-[90vw]">
				{#each simpleItems as item, index (index)}
					<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">
						{item.text}
					</div>
				{/each}
			</Marquee>
		</ComponentCard>

		<ComponentCard description="Testimonial cards in a continuous scroll.">
			<Marquee class="w-full">
				{#each testimonials as item, index (index)}
					<div
						class="bg-surface border-neutral-muted w-[400px] flex-shrink-0 rounded-xl border px-8 py-6"
					>
						<p class="mb-2 text-lg font-semibold">"{item.quote}"</p>
						<p class="text-neutral/70 text-sm">— {item.author}</p>
					</div>
				{/each}
			</Marquee>
		</ComponentCard>

		<ComponentCard description="Marquee above static content.">
			<Marquee class="w-full max-w-[90vw]">
				{#each simpleItems as item, index (index)}
					<div class="bg-surface border-neutral-muted rounded-lg border px-6 py-4">
						{item.text}
					</div>
				{/each}
			</Marquee>

			<div class="bg-neutral-muted text-neutral/70 flex h-10 w-full items-center justify-center">
				<p class="text-sm">This is a test of the marquee component.</p>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
