import type { Snippet } from 'svelte';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { CarouselThemeProps } from './carousel.theme.js';
import type { ResponsiveProps } from '../Theme/theme.js';
import type { CarouselState } from './carousel.state.svelte.js';

export type CarouselRenderPayload<Item = unknown> = {
	carousel: CarouselState;
	item: Item;
	index: number;
};

/** ARIA attributes passed to a custom navigation button snippet. */
type NavigationButton = {
	'aria-controls': string;
	'aria-label': string;
};

/** A pagination dot's active state and the attributes to spread onto its control. */
type Dot = {
	active: boolean;
	attributes: {
		'data-active': boolean;
		'aria-controls': string;
		'aria-label': string;
		'aria-current': 'true' | undefined;
		onclick: () => void;
	};
};

export interface CarouselProps<Item = unknown> {
	/** CSS classes applied to the carousel's root element. */
	class?: string;
	/** Allow free-form dragging instead of snapping to slide boundaries. */
	dragFree?: boolean;
	/** Collection used to generate one carousel slide per item. */
	items: Item[];
	/** Renders the content inside each generated slide wrapper. */
	children?: Snippet<[CarouselRenderPayload<Item>]>;
	/** How slides align within the viewport when snapped. */
	snapAlign?: 'start' | 'center' | 'end';
	/**
	 * Pagination in the footer row, to the leading side of the prev/next pair: an object to pick
	 * and style a built-in style, `false` to drop it, or a snippet receiving the state and the
	 * dot records for full control. Default `{ variant: 'line' }`.
	 */
	pagination?:
		| false
		| Snippet<[CarouselState, Dot[]]>
		| {
				/**
				 * `'line'` (default) fills a recessed track by the fraction of the scrollable range
				 * already scrolled and is presentational; `'dots'` renders one clickable dot per page.
				 */
				variant?: 'line' | 'dots';
				/** Fill and dot color. */
				color?: Colors;
				/** Line thickness, or dot diameter and the gap between dots. */
				size?: Sizes;
		  };
	/**
	 * Prev/next navigation at the trailing end of the footer row: an object to style the built-in
	 * buttons, `false` to drop them, or a snippet receiving the button attributes and direction
	 * for full control. Default `{ color: 'neutral' }`.
	 */
	navigationButton?:
		| false
		| {
				/** Button color. */
				color?: Colors;
				/** Button square size. */
				size?: Sizes;
		  }
		| Snippet<[CarouselState, NavigationButton, 'prev' | 'next']>;
	/** Theme overrides for the carousel's structural parts. */
	theme?: CarouselThemeProps;

	/**
	 * Number of slides visible: one number for every width, or a record keyed by breakpoint. The
	 * xs/sm/md/lg/xl keys address the CAROUSEL's own width, not the viewport's — sm from 36rem, md
	 * from 42rem, lg from 56rem, xl from 72rem of carousel width, xs below that — and the nearest
	 * defined key at or below the active width wins, so `{ xs: 1, md: 2 }` shows two slides from
	 * 42rem up. Default 1.
	 */
	layout?: ResponsiveProps<number>;
	/** Gap between slides in pixels, per carousel-width breakpoint. Default 20. */
	gaps?: ResponsiveProps<number>;
	/**
	 * Pixels of the adjacent slide to reveal (partial peek), per carousel-width breakpoint.
	 * Default 0.
	 */
	partialDelta?: ResponsiveProps<number>;
}
