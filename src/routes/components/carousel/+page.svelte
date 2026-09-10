<script lang="ts">
	import { Carousel } from '$lib/components/Carousel/index.js';
	import ComponentCard from '../../ComponentCard.svelte';
	import { createComponentControls } from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';

	let items = $state([
		{
			title: 'Signal',
			description: 'A compact slide rendered from the first item.',
			content: 'Use the typed item payload inside the generated slide wrapper.',
			icon: 'chevron'
		},
		{
			title: 'Orbit',
			description: 'The second item keeps the same slide structure.',
			content: 'Navigation, dots, and aria labels are driven by the generated slides.',
			icon: 'chevron'
		},
		{
			title: 'Focus',
			description: 'The third item completes the basic example.',
			content: 'Responsive layouts still use the same item payload.',
			icon: 'chevron'
		},
		{
			title: 'Scale',
			description: 'Multiple visible slides can be configured by breakpoint.',
			content: 'The carousel owns the direct slide wrappers.',
			customKey: 'custom value'
		},
		{
			title: 'Preview',
			description: 'Partial delta can reveal the next generated slide.',
			content: 'The user renders content inside the wrapper, not the wrapper itself.',
			customKey: 'custom value'
		},
		{
			title: 'Control',
			description: 'The payload also exposes the carousel state.',
			content: 'Use carousel.next() or carousel.prev() when building custom controls.',
			customKey: 'custom value'
		},
		{
			title: 'Theme',
			description: 'The generated slide wrapper has a theme part.',
			content: 'Override the slide part when every generated wrapper needs styling.',
			customKey: 'custom value'
		}
	]);

	const snapAlignments = ['start', 'center', 'end'] as const;
	const controls = createComponentControls([
		{
			name: 'snapAlign',
			type: 'segmented',
			label: 'Snap',
			value: 'start',
			options: snapAlignments
		},
		{ name: 'dragFree', type: 'switch', label: 'Drag free', value: false }
	]);

	const responsiveCode = `<Carousel
	items={items}
	layout={{ default: 1, sm: 2, xl: 3 }}
	gaps={{ default: 18 }}
	partialDelta={{ default: 48 }}
	class="w-full max-w-[90vw]"
	navigationButton={{ color: 'primary' }}
	dots={{ color: 'primary' }}
>
	{#snippet children({ item, index })}
		<article class="bg-surface raised-lg grid h-[360px] content-between overflow-hidden rounded-xl border border-neutral-muted">
			<div class="bg-primary-muted border-primary h-2 border-b"></div>
			<div class="grid gap-5 p-6">
				<div class="flex items-center justify-between">
					<span class="text-primary text-sm font-semibold">0{index + 1}</span>
					<span class="bg-neutral-muted text-neutral/60 rounded-full px-3 py-1 text-sm">
						generated slide
					</span>
				</div>
				<div>
					<h2 class="text-3xl font-semibold">{item.title}</h2>
					<p class="text-neutral/60 mt-3">{item.description}</p>
				</div>
				<p class="text-neutral/60 text-sm leading-relaxed">{item.content}</p>
			</div>
		</article>
	{/snippet}
</Carousel>`;

	const themedSlidesCode = `<Carousel
	items={items.slice(0, 4)}
	layout={{ default: 1, md: 2 }}
	gaps={{ default: 18 }}
	class="w-full max-w-[90vw]"
	theme={{ slide: { base: 'rounded-xl border border-neutral-muted bg-surface p-2' } }}
	dots={{ color: 'secondary' }}
>
	{#snippet children({ item, index })}
		<article class="bg-secondary-muted grid h-64 content-between rounded-lg p-5">
			<p class="text-secondary text-sm font-semibold">0{index + 1}</p>
			<div>
				<h2 class="text-2xl font-semibold">{item.title}</h2>
				<p class="text-neutral/60 mt-2">{item.description}</p>
			</div>
		</article>
	{/snippet}
</Carousel>`;

	const customNavigationCode = `<Carousel
	items={items.slice(0, 5)}
	class="w-full max-w-[90vw]"
	dots={{ color: 'secondary' }}
>
	{#snippet navigationButton(carousel, attributes, direction)}
		<button
			{...attributes}
			disabled={direction === 'prev' ? !carousel.canScrollPrev : !carousel.canScrollNext}
			onclick={() => direction === 'prev' ? carousel.prev() : carousel.next()}
			class="bg-surface/90 text-neutral raised absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-muted disabled:opacity-40"
			class:left-3={direction === 'prev'}
			class:right-3={direction === 'next'}
		>
			{direction === 'prev' ? '<' : '>'}
		</button>
	{/snippet}

	{#snippet children({ item })}
		<div class="bg-surface raised-lg grid h-72 content-end rounded-xl border border-neutral-muted p-6">
			<h2 class="text-3xl font-semibold">{item.title}</h2>
			<p class="text-neutral/60 mt-2">{item.content}</p>
		</div>
	{/snippet}
</Carousel>`;

	const dragFreeCode = `<Carousel
	items={items}
	dragFree
	layout={{ default: 1, md: 2, xl: 4 }}
	gaps={{ default: 14 }}
	class="w-full max-w-[90vw]"
>
	{#snippet children({ item, index })}
		<div class="bg-info-muted h-48 rounded-xl p-5">
			<p class="text-info text-sm font-semibold">Card {index + 1}</p>
			<h2 class="mt-6 text-2xl font-semibold">{item.title}</h2>
			<p class="text-neutral/60 mt-2 text-sm">{item.description}</p>
		</div>
	{/snippet}
</Carousel>`;
</script>

<DocPage
	title="Carousel"
	subtitle="A scrollable, snapping track for browsing slides."
	component="Carousel"
	features={[
		'Blossom-carousel drag on fine pointers',
		'aria-roledescription carousel and slide labels',
		'Prev/next buttons with aria-labels',
		'Responsive slides-per-view breakpoints',
		'Dot pagination with aria-selected'
	]}
>
	<ComponentCard
		{controls}
		description="A multi-slide carousel with a partial next-slide preview."
		code={`<Carousel
	items={items.slice(0, 5)}
	layout={{ default: 1, md: 2, xl: 3 }}
	gaps={{ default: 16 }}
	partialDelta={{ default: 48 }}
	snapAlign="${controls.value.snapAlign}"
	dragFree={${controls.value.dragFree}}
	class="w-full max-w-[90vw]"
	dots={{ color: 'primary' }}
>
	{#snippet children({ item, index })}
		<article>...</article>
	{/snippet}
</Carousel>`}
	>
		<Carousel
			items={items.slice(0, 5)}
			layout={{ default: 1, md: 2, xl: 3 }}
			gaps={{ default: 16 }}
			partialDelta={{ default: 48 }}
			snapAlign={controls.value.snapAlign}
			dragFree={controls.value.dragFree}
			class="w-full max-w-[90vw]"
			dots={{ color: 'primary' }}
		>
			{#snippet children({ item, index })}
				<article
					class="bg-surface raised-lg grid h-64 content-between rounded-xl border border-neutral-muted p-5"
				>
					<div class="flex items-start justify-between gap-4">
						<div
							class="bg-primary text-primary-contrast flex h-10 w-10 items-center justify-center rounded font-semibold"
						>
							{index + 1}
						</div>
						<span class="bg-primary-muted text-primary rounded-full px-3 py-1 text-sm">item</span>
					</div>
					<div>
						<h2 class="text-2xl font-semibold">{item.title}</h2>
						<p class="text-neutral/60 mt-2">{item.description}</p>
					</div>
				</article>
			{/snippet}
		</Carousel>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			description="Responsive layout, navigation buttons, dot pagination, and partial slide preview."
			code={responsiveCode}
		>
			<Carousel
				{items}
				layout={{ default: 1, sm: 2, xl: 3 }}
				gaps={{ default: 18 }}
				partialDelta={{ default: 48 }}
				class="w-full max-w-[90vw]"
				navigationButton={{ color: 'primary' }}
				dots={{ color: 'primary' }}
			>
				{#snippet children({ item, index })}
					<article
						class="bg-surface raised-lg grid h-[360px] content-between overflow-hidden rounded-xl border border-neutral-muted"
					>
						<div class="bg-primary-muted border-primary h-2 border-b"></div>
						<div class="grid gap-5 p-6">
							<div class="flex items-center justify-between">
								<span class="text-primary text-sm font-semibold">0{index + 1}</span>
								<span
									class="bg-neutral-muted text-neutral/60 rounded-full px-3 py-1 text-sm"
								>
									generated slide
								</span>
							</div>
							<div>
								<h2 class="text-3xl font-semibold">{item.title}</h2>
								<p class="text-neutral/60 mt-3">{item.description}</p>
							</div>
							<p class="text-neutral/60 text-sm leading-relaxed">{item.content}</p>
						</div>
					</article>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Theme the generated slide wrapper instead of wrapping every item yourself."
			code={themedSlidesCode}
		>
			<Carousel
				items={items.slice(0, 4)}
				layout={{ default: 1, md: 2 }}
				gaps={{ default: 18 }}
				class="w-full max-w-[90vw]"
				theme={{
					slide: { base: 'rounded-xl border border-neutral-muted bg-surface p-2' }
				}}
				dots={{ color: 'secondary' }}
			>
				{#snippet children({ item, index })}
					<article class="bg-secondary-muted grid h-64 content-between rounded-lg p-5">
						<p class="text-secondary text-sm font-semibold">0{index + 1}</p>
						<div>
							<h2 class="text-2xl font-semibold">{item.title}</h2>
							<p class="text-neutral/60 mt-2">{item.description}</p>
						</div>
					</article>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Custom navigation keeps the same generated slide API."
			code={customNavigationCode}
		>
			<Carousel items={items.slice(0, 5)} class="w-full max-w-[90vw]" dots={{ color: 'secondary' }}>
				{#snippet navigationButton(carousel, attributes, direction)}
					<button
						{...attributes}
						disabled={direction === 'prev' ? !carousel.canScrollPrev : !carousel.canScrollNext}
						onclick={() => (direction === 'prev' ? carousel.prev() : carousel.next())}
						class="bg-surface/90 text-neutral raised absolute top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-muted disabled:opacity-40"
						class:left-3={direction === 'prev'}
						class:right-3={direction === 'next'}
					>
						{direction === 'prev' ? '<' : '>'}
					</button>
				{/snippet}

				{#snippet children({ item })}
					<div
						class="bg-surface raised-lg grid h-72 content-end rounded-xl border border-neutral-muted p-6"
					>
						<h2 class="text-3xl font-semibold">{item.title}</h2>
						<p class="text-neutral/60 mt-2">{item.content}</p>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard description="Drag-free mode for a loose horizontal rail." code={dragFreeCode}>
			<Carousel
				{items}
				dragFree
				layout={{ default: 1, md: 2, xl: 4 }}
				gaps={{ default: 14 }}
				class="w-full max-w-[90vw]"
			>
				{#snippet children({ item, index })}
					<div class="bg-info-muted h-48 rounded-xl p-5">
						<p class="text-info text-sm font-semibold">Card {index + 1}</p>
						<h2 class="mt-6 text-2xl font-semibold">{item.title}</h2>
						<p class="text-neutral/60 mt-2 text-sm">{item.description}</p>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>
	{/snippet}
</DocPage>
