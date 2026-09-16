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
			content: 'Navigation, pagination, and aria labels are driven by the generated slides.',
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
	layout={{ xs: 1, sm: 2, xl: 3 }}
	gaps={18}
	partialDelta={48}
	class="w-full"
	navigationButton={{ color: 'primary' }}
	pagination={{ color: 'primary' }}
>
	{#snippet children({ item, index })}
		<article class="bg-surface raised-lg grid h-[360px] content-between overflow-hidden rounded-xl border border-neutral-muted">
			<div class="bg-primary-muted border-primary h-2 border-b"></div>
			<div class="grid gap-5 p-6">
				<div class="flex items-center justify-between">
					<span class="text-primary-readable text-sm font-semibold">0{index + 1}</span>
					<span class="bg-neutral-muted text-neutral/70 rounded-full px-3 py-1 text-sm">
						generated slide
					</span>
				</div>
				<div>
					<h2 class="text-3xl font-semibold">{item.title}</h2>
					<p class="text-neutral/70 mt-3">{item.description}</p>
				</div>
				<p class="text-neutral/70 text-sm leading-relaxed">{item.content}</p>
			</div>
		</article>
	{/snippet}
</Carousel>`;

	const themedSlidesCode = `<Carousel
	items={items.slice(0, 4)}
	layout={{ xs: 1, md: 2 }}
	gaps={18}
	class="w-full"
	theme={{ slide: { base: 'rounded-xl border border-neutral-muted bg-surface p-2' } }}
	pagination={{ variant: 'dots', color: 'secondary' }}
>
	{#snippet children({ item, index })}
		<article class="bg-secondary-muted grid h-64 content-between rounded-lg p-5">
			<p class="text-secondary text-sm font-semibold">0{index + 1}</p>
			<div>
				<h2 class="text-2xl font-semibold">{item.title}</h2>
				<p class="text-neutral/70 mt-2">{item.description}</p>
			</div>
		</article>
	{/snippet}
</Carousel>`;

	const customNavigationCode = `<!-- A navigationButton snippet renders in the footer's trailing slot, one call per direction. -->
<Carousel
	items={items.slice(0, 5)}
	class="w-full"
	pagination={{ color: 'secondary' }}
>
	{#snippet navigationButton(carousel, attributes, direction)}
		<button
			{...attributes}
			disabled={direction === 'prev' ? !carousel.canScrollPrev : !carousel.canScrollNext}
			onclick={() => direction === 'prev' ? carousel.prev() : carousel.next()}
			class="bg-surface text-neutral raised flex h-8 items-center gap-1 rounded-full border border-neutral-muted px-3 text-sm disabled:opacity-40"
		>
			{direction === 'prev' ? '← Back' : 'Forward →'}
		</button>
	{/snippet}

	{#snippet children({ item })}
		<div class="bg-surface raised-lg grid h-72 content-end rounded-xl border border-neutral-muted p-6">
			<h2 class="text-3xl font-semibold">{item.title}</h2>
			<p class="text-neutral/70 mt-2">{item.content}</p>
		</div>
	{/snippet}
</Carousel>`;

	const dotsCode = `<!-- The other built-in pagination style: one clickable dot per page. -->
<Carousel
	items={items.slice(0, 6)}
	layout={{ xs: 1, md: 3 }}
	gaps={16}
	class="w-full"
	pagination={{ variant: 'dots' }}
>
	{#snippet children({ item })}
		<div class="bg-surface h-40 rounded-xl border border-neutral-muted p-4">{item.title}</div>
	{/snippet}
</Carousel>`;

	const arrowsOnlyCode = `<!-- Pagination off, arrows on: the pair still sits at the trailing end. -->
<Carousel
	items={items}
	layout={{ xs: 1, md: 3 }}
	gaps={16}
	class="w-full"
	pagination={false}
>
	{#snippet children({ item })}
		<div class="bg-surface h-40 rounded-xl border border-neutral-muted p-4">{item.title}</div>
	{/snippet}
</Carousel>`;

	const noChromeCode = `<!-- No footer at all: the track is scrolled by drag, wheel and the keyboard. -->
<Carousel
	items={items}
	layout={{ xs: 1, md: 3 }}
	gaps={16}
	class="w-full"
	pagination={false}
	navigationButton={false}
>
	{#snippet children({ item })}
		<div class="bg-surface h-40 rounded-xl border border-neutral-muted p-4">{item.title}</div>
	{/snippet}
</Carousel>`;

	const containerWidthCode = `<!-- Same carousel, two hosts: slides-per-view follows the carousel's width. -->
<div class="w-[360px]">
	<Carousel
		items={items}
		layout={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
		gaps={14}
		class="w-full"
	>
		{#snippet children({ item })}
			<div class="bg-surface h-40 rounded-xl border border-neutral-muted p-4">{item.title}</div>
		{/snippet}
	</Carousel>
</div>

<Carousel
	items={items}
	layout={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
	gaps={14}
	class="w-full"
>
	{#snippet children({ item })}
		<div class="bg-surface h-40 rounded-xl border border-neutral-muted p-4">{item.title}</div>
	{/snippet}
</Carousel>`;

	const dragFreeCode = `<Carousel
	items={items}
	dragFree
	layout={{ xs: 1, md: 2, xl: 4 }}
	gaps={14}
	class="w-full"
>
	{#snippet children({ item, index })}
		<div class="bg-info-muted h-48 rounded-xl p-5">
			<p class="text-info text-sm font-semibold">Card {index + 1}</p>
			<h2 class="mt-6 text-2xl font-semibold">{item.title}</h2>
			<p class="text-neutral/70 mt-2 text-sm">{item.description}</p>
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
		'Footer row under the slides: progress line left, prev/next right, nothing overlaid',
		{ label: 'aria-roledescription carousel and slide labels', test: 'a11y:carousel.region' },
		{ label: 'Prev/next buttons with aria-labels', test: 'a11y:carousel.navigation-labels' },
		'Slides-per-view from the carousel width, not the viewport',
		{
			label: 'Progress line reports role=progressbar and a named value',
			test: 'carousel:progress.role'
		},
		{ label: 'Dot pagination with aria-current', test: 'a11y:carousel.dots' }
	]}
>
	<ComponentCard
		{controls}
		description="A multi-slide carousel with a partial next-slide preview."
		code={`<Carousel
	items={items.slice(0, 5)}
	layout={{ xs: 1, md: 2, xl: 3 }}
	gaps={16}
	partialDelta={48}
	snapAlign="${controls.value.snapAlign}"
	dragFree={${controls.value.dragFree}}
	class="w-full"
	pagination={{ color: 'primary' }}
>
	{#snippet children({ item, index })}
		<article>...</article>
	{/snippet}
</Carousel>`}
	>
		<Carousel
			items={items.slice(0, 5)}
			layout={{ xs: 1, md: 2, xl: 3 }}
			gaps={16}
			partialDelta={48}
			snapAlign={controls.value.snapAlign}
			dragFree={controls.value.dragFree}
			class="w-full"
			pagination={{ color: 'primary' }}
		>
			{#snippet children({ item, index })}
				<article
					class="bg-surface raised-lg border-neutral-muted grid h-64 content-between rounded-xl border p-5"
				>
					<div class="flex items-start justify-between gap-4">
						<div
							class="bg-primary text-primary-contrast flex h-10 w-10 items-center justify-center rounded font-semibold"
						>
							{index + 1}
						</div>
						<span
							class="bg-primary-muted text-primary-muted-readable rounded-full px-3 py-1 text-sm"
							>item</span
						>
					</div>
					<div>
						<h2 class="text-2xl font-semibold">{item.title}</h2>
						<p class="text-neutral/70 mt-2">{item.description}</p>
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
				layout={{ xs: 1, sm: 2, xl: 3 }}
				gaps={18}
				partialDelta={48}
				class="w-full"
				navigationButton={{ color: 'primary' }}
				pagination={{ color: 'primary' }}
			>
				{#snippet children({ item, index })}
					<article
						class="bg-surface raised-lg border-neutral-muted grid h-[360px] content-between overflow-hidden rounded-xl border"
					>
						<div class="bg-primary-muted border-primary h-2 border-b"></div>
						<div class="grid gap-5 p-6">
							<div class="flex items-center justify-between">
								<span class="text-primary-readable text-sm font-semibold">0{index + 1}</span>
								<span class="bg-neutral-muted text-neutral/70 rounded-full px-3 py-1 text-sm">
									generated slide
								</span>
							</div>
							<div>
								<h2 class="text-3xl font-semibold">{item.title}</h2>
								<p class="text-neutral/70 mt-3">{item.description}</p>
							</div>
							<p class="text-neutral/70 text-sm leading-relaxed">{item.content}</p>
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
				layout={{ xs: 1, md: 2 }}
				gaps={18}
				class="w-full"
				theme={{
					slide: { base: 'rounded-xl border border-neutral-muted bg-surface p-2' }
				}}
				pagination={{ variant: 'dots', color: 'secondary' }}
			>
				{#snippet children({ item, index })}
					<article class="bg-secondary-muted grid h-64 content-between rounded-lg p-5">
						<p class="text-secondary text-sm font-semibold">0{index + 1}</p>
						<div>
							<h2 class="text-2xl font-semibold">{item.title}</h2>
							<p class="text-neutral/70 mt-2">{item.description}</p>
						</div>
					</article>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Custom navigation keeps the same generated slide API."
			code={customNavigationCode}
		>
			<Carousel items={items.slice(0, 5)} class="w-full" pagination={{ color: 'secondary' }}>
				{#snippet navigationButton(carousel, attributes, direction)}
					<button
						{...attributes}
						disabled={direction === 'prev' ? !carousel.canScrollPrev : !carousel.canScrollNext}
						onclick={() => (direction === 'prev' ? carousel.prev() : carousel.next())}
						class="bg-surface text-neutral raised border-neutral-muted flex h-8 items-center gap-1 rounded-full border px-3 text-sm disabled:opacity-40"
					>
						{direction === 'prev' ? '← Back' : 'Forward →'}
					</button>
				{/snippet}

				{#snippet children({ item })}
					<div
						class="bg-surface raised-lg border-neutral-muted grid h-72 content-end rounded-xl border p-6"
					>
						<h2 class="text-3xl font-semibold">{item.title}</h2>
						<p class="text-neutral/70 mt-2">{item.content}</p>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Dots are the other built-in pagination style: same footer slot, one clickable dot per page."
			code={dotsCode}
		>
			<Carousel
				items={items.slice(0, 6)}
				layout={{ xs: 1, md: 3 }}
				gaps={16}
				class="w-full"
				pagination={{ variant: 'dots' }}
			>
				{#snippet children({ item })}
					<div class="bg-surface border-neutral-muted grid h-40 content-end rounded-xl border p-4">
						<h2 class="text-xl font-semibold">{item.title}</h2>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Pagination off, arrows on: with nothing in the leading slot the prev/next pair still sits at the trailing end of the footer row."
			code={arrowsOnlyCode}
		>
			<Carousel {items} layout={{ xs: 1, md: 3 }} gaps={16} class="w-full" pagination={false}>
				{#snippet children({ item })}
					<div class="bg-surface border-neutral-muted grid h-40 content-end rounded-xl border p-4">
						<h2 class="text-xl font-semibold">{item.title}</h2>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Both halves off: no footer is rendered and the track is scrolled by drag, wheel and the keyboard."
			code={noChromeCode}
		>
			<Carousel
				{items}
				layout={{ xs: 1, md: 3 }}
				gaps={16}
				class="w-full"
				pagination={false}
				navigationButton={false}
			>
				{#snippet children({ item })}
					<div class="bg-surface border-neutral-muted grid h-40 content-end rounded-xl border p-4">
						<h2 class="text-xl font-semibold">{item.title}</h2>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard description="Drag-free mode for a loose horizontal rail." code={dragFreeCode}>
			<Carousel {items} dragFree layout={{ xs: 1, md: 2, xl: 4 }} gaps={14} class="w-full">
				{#snippet children({ item, index })}
					<div class="bg-info-muted h-48 rounded-xl p-5">
						<p class="text-info text-sm font-semibold">Card {index + 1}</p>
						<h2 class="mt-6 text-2xl font-semibold">{item.title}</h2>
						<p class="text-neutral/70 mt-2 text-sm">{item.description}</p>
					</div>
				{/snippet}
			</Carousel>
		</ComponentCard>

		<ComponentCard
			description="Slides-per-view is a container query on the carousel itself: the 360px host below shows one slide while the full-width host on the same page shows four."
			code={containerWidthCode}
		>
			<div class="grid w-full gap-8">
				<div data-narrow-host class="w-[360px] max-w-full">
					<p class="text-neutral/70 mb-2 text-sm">360px host</p>
					<Carousel {items} layout={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }} gaps={14} class="w-full">
						{#snippet children({ item })}
							<div
								class="bg-surface border-neutral-muted grid h-40 content-end rounded-xl border p-4"
							>
								<h2 class="text-xl font-semibold">{item.title}</h2>
							</div>
						{/snippet}
					</Carousel>
				</div>

				<div data-wide-host class="w-full">
					<p class="text-neutral/70 mb-2 text-sm">Full-width host</p>
					<Carousel {items} layout={{ xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }} gaps={14} class="w-full">
						{#snippet children({ item })}
							<div
								class="bg-surface border-neutral-muted grid h-40 content-end rounded-xl border p-4"
							>
								<h2 class="text-xl font-semibold">{item.title}</h2>
							</div>
						{/snippet}
					</Carousel>
				</div>
			</div>
		</ComponentCard>
	{/snippet}
</DocPage>
