<script lang="ts" generics="Item">
	import type { WithAttachments } from '$lib/types/props.js';
	import { caretLeftIcon } from '../Icons/caretLeft.js';
	import { caretRightIcon } from '../Icons/caretRight.js';
	import { CarouselState, carouselFallbacks } from './carousel.state.svelte.js';
	import { responsiveVariables } from '../Theme/responsive.js';
	import type { CarouselProps } from './carousel.props.js';
	import { useCarouselTheme } from './carousel.theme.js';
	import { useDefaultColor } from '../Theme/theme.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	let {
		class: className,
		dragFree = false,
		items = [] as Item[],
		layout,
		gaps,
		partialDelta,
		pagination = { variant: 'line' },
		theme,
		children: slide,
		navigationButton = { color: 'neutral' },
		snapAlign = 'center',
		...attachments
	}: WithAttachments<CarouselProps<Item>> = $props();

	let id = $props.id();
	const t = $derived(useI18n());

	const carousel = new CarouselState(
		{
			get layout() {
				return layout;
			},
			get gaps() {
				return gaps;
			},
			get partialDelta() {
				return partialDelta;
			},
			get messages() {
				return t;
			}
		},
		id
	);

	const classes = $derived(useCarouselTheme(theme));
	/** The built-in prev/next pair, or `undefined` when a snippet or `false` was passed instead. */
	const buttonOptions = $derived(
		navigationButton && typeof navigationButton === 'object' ? navigationButton : undefined
	);
	const navigationSnippet = $derived(
		typeof navigationButton === 'function' ? navigationButton : undefined
	);
	/** The built-in pagination options, or `undefined` for a snippet or `false`. */
	const paginationOptions = $derived(
		pagination && typeof pagination === 'object' ? pagination : undefined
	);
	const paginationSnippet = $derived(typeof pagination === 'function' ? pagination : undefined);
	const resolvedNavigationColor = $derived(useDefaultColor(buttonOptions?.color));
	const resolvedPaginationColor = $derived(useDefaultColor(paginationOptions?.color));

	/**
	 * Slides-per-view, gap and peek for ALL FIVE breakpoints, written as custom properties on the
	 * track. The `@container carousel (…)` rules below pick the pair matching the width the host
	 * actually gave the carousel, so the first painted frame — and the server-rendered HTML — is
	 * already laid out correctly, with no measurement and no JS. The ResizeObserver in
	 * `carousel.state.svelte.ts` exists only for what CSS cannot answer: how many dots there are
	 * and how far `next()` jumps.
	 */
	const trackStyle = $derived(
		Object.entries({
			...responsiveVariables(
				'carousel-layout',
				layout,
				carouselFallbacks.layout,
				// A slide is a fraction of the track, so the count becomes a percentage width.
				(slides) => `${(100 / slides).toFixed(2)}%`
			),
			...responsiveVariables('carousel-gap', gaps, carouselFallbacks.gaps, (px) => `${px}px`),
			...responsiveVariables(
				'carousel-partial-delta',
				partialDelta,
				carouselFallbacks.partialDelta,
				(px) => `${px}px`
			),
			'--carousel-snap-align': snapAlign
		})
			.map(([property, value]) => `${property}:${value}`)
			.join(';')
	);

	/**
	 * Chrome is worth showing unless there is provably exactly one page to show it for. The dot
	 * count is 0 on the server and until the slides register, so `!== 1` (rather than `> 1`)
	 * keeps the footer in the server-rendered HTML and only drops it once a single-page carousel
	 * has actually measured itself — the footer never appears after hydration, it only leaves.
	 */
	const canNavigate = $derived(carousel.dots.length !== 1);
	const hasFooter = $derived(
		Boolean(paginationOptions || paginationSnippet || buttonOptions || navigationSnippet) &&
			canNavigate
	);
	const progressPercent = $derived(carousel.progress * 100);
</script>

<!-- {carousel.currentSlide?.index} -->
<div data-carousel class={classes.root({ class: className })} {...attachments}>
	<div
		{id}
		role="region"
		aria-roledescription="carousel"
		tabindex="0"
		onkeydown={carousel.onKeyDown}
		{@attach carousel.attachment}
		data-carousel-slider
		data-drag-free={dragFree}
		data-can-scroll-next={carousel.canScrollNext}
		data-can-scroll-prev={carousel.canScrollPrev}
		data-axis="x"
		class={classes.slider()}
		style={trackStyle}
	>
		{#each items as item, index (index)}
			<div class={classes.slide()}>
				{@render slide?.({ carousel, item, index })}
			</div>
		{/each}
	</div>

	{#if hasFooter}
		<div data-carousel-footer class={classes.footer()}>
			{#if paginationOptions}
				{#if paginationOptions.variant === 'dots'}
					<div data-carousel-dots class={classes.dots({ size: paginationOptions.size })}>
						{#each carousel.dots as dotItem, dotIndex (dotIndex)}
							<button
								data-color={resolvedPaginationColor}
								{...dotItem.attributes}
								class={classes.dot({
									color: paginationOptions.color,
									size: paginationOptions.size,
									active: dotItem.active
								})}
							>
							</button>
						{/each}
					</div>
				{:else}
					<!-- A readout, not a control: it reports where the track is, it does not move it. -->
					<div
						data-carousel-progress
						data-color={resolvedPaginationColor}
						role="progressbar"
						aria-controls={carousel.id}
						aria-label={t.carouselProgress}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-valuenow={Math.round(progressPercent)}
						class={classes.progress({ size: paginationOptions.size })}
					>
						<div
							data-carousel-progress-fill
							class={classes.progressFill({ color: paginationOptions.color })}
							style:width="{progressPercent}%"
						></div>
					</div>
				{/if}
			{:else if paginationSnippet}
				{@render paginationSnippet(carousel, carousel.dots)}
			{/if}

			{#if buttonOptions || navigationSnippet}
				<div data-carousel-navigation class={classes.navigation()}>
					{#if buttonOptions}
						<button
							data-color={resolvedNavigationColor}
							{...carousel.prevButton}
							class={classes.navigationButton({
								...buttonOptions,
								disabled: carousel.prevButton.disabled
							})}
						>
							{@render caretLeftIcon()}
						</button>

						<button
							data-color={resolvedNavigationColor}
							{...carousel.nextButton}
							class={classes.navigationButton({
								...buttonOptions,
								disabled: carousel.nextButton.disabled
							})}
						>
							{@render caretRightIcon()}
						</button>
					{:else if navigationSnippet}
						{@render navigationSnippet(
							carousel,
							{
								'aria-controls': carousel.id,
								'aria-label': `${t.previous} ${t.slide}`
							},
							'prev'
						)}

						{@render navigationSnippet(
							carousel,
							{
								'aria-controls': carousel.id,
								'aria-label': `${t.next} ${t.slide}`
							},
							'next'
						)}
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	[data-carousel-slider]:not([data-drag-free='true']) {
		scroll-snap-type: x mandatory;

		:global(& > *) {
			scroll-snap-align: var(--carousel-snap-align);
		}
	}

	[data-carousel-slider] {
		display: grid;
		position: relative;
		white-space: nowrap;
		overflow-x: scroll;
		overflow-y: clip;
		scroll-behavior: smooth;
		overscroll-behavior-x: contain;
		inline-size: 100%;
		max-inline-size: 100%;
		box-sizing: border-box;
		scrollbar-width: none;
		&::-webkit-scrollbar {
			display: none;
		}

		/*
		 * The bleed is a hole punched in the page's hit-testing, so it must not take pointer input:
		 * the padding zone below carries no slide, yet it is part of the scroll container's box and
		 * would sit on top of whatever the host drew there — a tab bar above, the footer row below —
		 * and swallow its clicks. Input starting on a SLIDE still reaches the scroller by bubbling,
		 * which is all the drag needs: blossom-carousel binds `pointerdown` and `wheel` on this
		 * element and then listens for `pointermove`/`pointerup` on the window, with no pointer
		 * capture, so a press that begins on a slide drives the drag exactly as before. `cursor` is
		 * inherited, so the grab cursor still shows over the slides and correctly does not show over
		 * the bleed.
		 */
		pointer-events: none;

		/* Bleed allowance for the first and last slides' rings and shadows; see carousel.theme.ts. */
		&:not([has-repeat='true']) {
			/* At least a ring's worth of room, or as far as the elevation scale's largest shadow. */
			--carousel-bleed-x: max(var(--space-sm), var(--elevation-bleed-x, 0px));
			--carousel-bleed-y: max(var(--space-sm), var(--elevation-bleed-y, 0px));
			/*
			 * The negative inline margins let the border box grow PAST the host by the bleed on each
			 * side, and the matching padding puts the slides back on the host's edges: the clip edge
			 * (the border box, where a partly visible slide is cut) ends up `--carousel-bleed-x`
			 * outside the root, and the content box ends up flush with it. That only holds while the
			 * track is free to take its stretch size — an `inline-size: 100%` would pin the border
			 * box to the root's width and the margins would merely SHIFT it, leaving the clip edge
			 * two bleeds short of the arrows. Hence `inline-size: auto` here and no inline width in
			 * the markup.
			 */
			/*
			 * Per side, and physical: the bleed is capped at the room between the root and the
			 * viewport edge (`--carousel-room-*`, set by the state from a measurement), so a carousel
			 * flush with a phone screen's edge never widens the page. Unmeasured — before hydration,
			 * or in a test without the root — the room is unbounded and the full bleed applies.
			 */
			--carousel-bleed-left: min(
				var(--carousel-bleed-x),
				var(--carousel-room-left, calc(infinity * 1px))
			);
			--carousel-bleed-right: min(
				var(--carousel-bleed-x),
				var(--carousel-room-right, calc(infinity * 1px))
			);
			margin-left: calc(var(--carousel-bleed-left) * -1);
			margin-right: calc(var(--carousel-bleed-right) * -1);
			padding-left: var(--carousel-bleed-left);
			padding-right: var(--carousel-bleed-right);
			scroll-padding-left: var(--carousel-bleed-left);
			scroll-padding-right: var(--carousel-bleed-right);
			/* Net block padding stays `--space-xl` (room for the dots); the bleed hides in the margin. */
			margin-block: calc(var(--space-xl) - var(--carousel-bleed-y));
			padding-block: var(--carousel-bleed-y);
			/* A flex basis of 0 lets the negative margins grow the border box by the bleed. */
			flex: 1 1 0%;
			inline-size: auto;
			min-inline-size: 0;
			max-inline-size: none;
		}

		:global(&[has-repeat='true']) {
			scroll-padding-inline: 50% !important;
			padding-inline: 50% !important;
		}

		:global(&[has-overflow='true']) {
			cursor: grab;

			&:active {
				cursor: grabbing;
				@media (pointer: fine) {
					scroll-snap-type: none !important;
				}
			}
		}

		:global(&[has-snap='true']) {
			scroll-snap-type: var(--snap-type) !important;
		}

		:global(& > *) {
			display: inline-block;
			white-space: initial;
			vertical-align: top;
			/* The slides are the only part of the track that takes input; see `pointer-events` above. */
			pointer-events: auto;
		}

		/* prevent drag interaction on children */
		:global(& *) {
			-webkit-user-drag: none;
			-webkit-touch-callout: none;
			user-select: none;
		}
	}

	[data-carousel-slider][data-axis='y'] {
		grid-auto-flow: row;
	}

	/*
	 * Slides-per-view is chosen from the CAROUSEL's own width (the root carries
	 * `@container/carousel`), never from the viewport: a narrow carousel in a sidebar of a wide
	 * page shows one slide, and the same carousel run full-bleed shows four.
	 *
	 * The four thresholds are the SHARED `containerBreakpoints` table exported from Theme, the one
	 * Grid and Stack query too, so `sm` means the same box width in every host-sized component.
	 * A Svelte <style> block cannot import a value, so they are hand-written here; utils.test.ts
	 * parses this block and fails if it drifts from the table.
	 *
	 * Each `--carousel-*-<step>` property already carries its breakpoint's effective value — the
	 * nearest-below cascade is flattened in `responsiveVariables` before it reaches CSS — so a rule
	 * reads one property and never has to fall back through the others.
	 */
	[data-carousel-slider][data-axis='x'] {
		grid-auto-flow: column;
		grid-auto-columns: calc(
			var(--carousel-layout-xs) - var(--carousel-gap-xs) - var(--carousel-partial-delta-xs)
		);
		column-gap: var(--carousel-gap-xs);
	}

	@container carousel (width >= 36rem) {
		[data-carousel-slider][data-axis='x'] {
			grid-auto-columns: calc(
				var(--carousel-layout-sm) - var(--carousel-gap-sm) - var(--carousel-partial-delta-sm)
			);
			column-gap: var(--carousel-gap-sm);
		}
	}

	@container carousel (width >= 42rem) {
		[data-carousel-slider][data-axis='x'] {
			grid-auto-columns: calc(
				var(--carousel-layout-md) - var(--carousel-gap-md) - var(--carousel-partial-delta-md)
			);
			column-gap: var(--carousel-gap-md);
		}
	}

	@container carousel (width >= 56rem) {
		[data-carousel-slider][data-axis='x'] {
			grid-auto-columns: calc(
				var(--carousel-layout-lg) - var(--carousel-gap-lg) - var(--carousel-partial-delta-lg)
			);
			column-gap: var(--carousel-gap-lg);
		}
	}

	@container carousel (width >= 72rem) {
		[data-carousel-slider][data-axis='x'] {
			grid-auto-columns: calc(
				var(--carousel-layout-xl) - var(--carousel-gap-xl) - var(--carousel-partial-delta-xl)
			);
			column-gap: var(--carousel-gap-xl);
		}
	}

	:global([data-carousel-slider] img) {
		user-select: none;
	}
</style>
