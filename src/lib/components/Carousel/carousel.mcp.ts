export const carouselDescription = `
# Carousel Component

Carousel renders a scrollable collection from items. Its public data contract matches Stepper and Tabs: pass items, then render one generated slide with children({ carousel, item, index }).

The component owns the direct slide wrappers. Do not put a consumer-owned repeated slide loop directly inside Carousel.

The chrome is a FOOTER ROW under the slides, never an overlay: pagination fills the leading side, the prev/next pair sits at the trailing end — including with pagination={false}, where the arrows are the row's only child and still sit trailing. By default the pagination is a progress line whose fill is the fraction of the scrollable range already scrolled.

## Basic Usage

<script lang="ts">
	import { Carousel } from 'svelai/carousel';

	const items = [
		{ title: 'Signal', description: 'Collect the first insight.' },
		{ title: 'Orbit', description: 'Review the second item.' },
		{ title: 'Focus', description: 'Finish with the third item.' }
	];
</script>

<Carousel items={items} navigationButton={{ color: 'primary' }} pagination={{ color: 'primary' }}>
	{#snippet children({ item, index, carousel })}
		<article>
			<p>Slide {index + 1}</p>
			<h3>{item.title}</h3>
			<p>{item.description}</p>
			<button onclick={() => carousel.next()}>Next</button>
		</article>
	{/snippet}
</Carousel>

## Core Props

- items: Item[] - the collection used to generate one slide per item.
- children: Snippet<[CarouselRenderPayload<Item>]> - renders content inside each generated slide wrapper.
- layout: ResponsiveProps<number> - number of slides visible. Default: 1.
- gaps: ResponsiveProps<number> - gap in pixels between generated slides. Default: 20.
- partialDelta: ResponsiveProps<number> - pixels to reveal from the adjacent slide. Default: 0.
- dragFree: boolean - disables strict snap behavior when true.
- navigationButton: object, snippet or false - built-in prev/next controls, custom controls, or no buttons. The object takes color and size: 'small' | 'normal' | 'large' (default 'normal'). Default: { color: 'neutral' }.
- pagination: object, snippet or false - built-in pagination, custom pagination, or none. The object takes variant: 'line' | 'dots', color and size. Default: { variant: 'line' }. 'line' is a presentational progress bar (role="progressbar", not clickable); 'dots' renders one clickable dot per page.

When pagination and navigationButton are both false no footer is rendered and the track is scrolled by drag, wheel and the keyboard.
- class: string - classes for the root container.
- theme: CarouselThemeProps - theme overrides for public parts.

Those three props take the shared ResponsiveProps shape: a plain number used at every width (gaps={16}) or a record keyed by breakpoint (layout={{ xs: 1, md: 2 }}). In the record form xs is the base — there is no default key — and the nearest defined key at or below the active width wins, so { xs: 1, md: 2 } shows two slides from md up. A key you leave unset below the narrowest one falls back to the prop default.

The xs / sm / md / lg / xl keys are the CAROUSEL's own width, not the viewport's: sm from 36rem, md from 42rem, lg from 56rem, xl from 72rem of carousel width, with xs below that. These are the shared container breakpoints exported from svelai/theme, so sm means the same box width in Carousel, Grid and Stack. A 360px carousel in a sidebar of a wide page is xs; the same carousel run full-bleed is xl. Give the carousel a width that fills its host (the default root is w-full) so it can measure itself.

## Render Payload

children receives:

- carousel: CarouselState - state and navigation helpers.
- item: Item - the current item, preserving the caller's item shape.
- index: number - zero-based generated slide index.

Use item fields directly. For example, if items contains { title, image }, item.title and item.image are typed inside the snippet.

## Responsive Example

<Carousel
	items={items}
	layout={{ xs: 1, sm: 2, lg: 3 }}
	gaps={{ xs: 16, lg: 24 }}
	partialDelta={48}
	navigationButton={{ color: 'primary' }}
	pagination={{ color: 'primary' }}
>
	{#snippet children({ item })}
		<div class="rounded bg-surface p-6">
			<h3>{item.title}</h3>
			<p>{item.description}</p>
		</div>
	{/snippet}
</Carousel>

## Custom Navigation

The snippet is rendered once per direction inside the footer's trailing slot, so it needs no positioning of its own.

<Carousel items={items} pagination={{ color: 'primary' }}>
	{#snippet navigationButton(carousel, attributes, direction)}
		<button
			{...attributes}
			onclick={() => direction === 'prev' ? carousel.prev() : carousel.next()}
		>
			{direction === 'prev' ? 'Previous' : 'Next'}
		</button>
	{/snippet}

	{#snippet children({ item })}
		<div>{item.title}</div>
	{/snippet}
</Carousel>

## Custom Pagination

<Carousel items={items} navigationButton={{ color: 'primary' }}>
	{#snippet pagination(carousel, dotItems)}
		<div class="flex justify-center gap-2">
			{#each dotItems as dot, index}
				<button {...dot.attributes}>
					<span class="sr-only">Slide {index + 1}</span>
				</button>
			{/each}
		</div>
	{/snippet}

	{#snippet children({ item })}
		<div>{item.title}</div>
	{/snippet}
</Carousel>

## CarouselState

- currentSlide - currently visible slide.
- lastSlideInView - last visible slide in the viewport.
- canScrollNext - whether next navigation is possible.
- canScrollPrev - whether previous navigation is possible.
- sortedSlides - generated slide records in DOM order.
- dots - pagination dot records with active state and attributes.
- progress - 0..1 fraction of the scrollable range already scrolled; the progress line's fill width. 0 on the server.
- scrollRange - the track's scrollable distance (scrollWidth - clientWidth).
- breakpoint - active breakpoint, resolved from the carousel's own measured width.
- resolvedLayout - active slides-per-view value.
- resolvedGaps - active gap value.
- next(count?) - move forward by count slides, defaulting to the active layout size.
- prev(count?) - move backward by count slides, defaulting to the active layout size.
- nextButton and prevButton - attributes for custom button composition.

## Keyboard and Accessibility

- The slider track is a focusable landmark: role="region", aria-roledescription="carousel", tabindex="0"; each slide is labelled "Slide n of m".
- With the track focused, ArrowRight / ArrowLeft move to the next / previous slide (mirrored in RTL), Home and End jump to the first and last slide.
- Built-in dots mark the active slide with aria-current (not aria-selected); custom dots receive the same attributes through dot.attributes.
- The progress line is presentational: role="progressbar" with aria-valuenow/min/max and an i18n accessible name. It is not focusable and not clickable.

## Theme Parts

- root - outer carousel container.
- slider - scrollable track.
- slide - generated direct slide wrapper.
- footer - the chrome row under the slider.
- progress - the progress line's recessed track.
- progressFill - the progress line's coloured fill.
- navigation - the prev/next pair's container.
- navigationButton - built-in previous and next buttons.
- dots - built-in dots container.
- dot - built-in dot button.

Use the slide theme part to style every generated wrapper consistently:

<Carousel
	items={items}
	theme={{ slide: { base: 'rounded-lg bg-surface p-4' } }}
>
	{#snippet children({ item })}
		<h3>{item.title}</h3>
	{/snippet}
</Carousel>
`;
