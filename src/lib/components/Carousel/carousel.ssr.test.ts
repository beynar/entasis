import { render } from 'svelte/server';
import { describe, expect, test } from 'vitest';
import Carousel from './Carousel.svelte';
import { breakpoints } from '../Theme/responsive.js';
import { carouselFallbacks } from './carousel.state.svelte.js';

/** The `--carousel-<name>-<breakpoint>` declarations the server put on the slider track. */
const trackVariables = (name: string, props: Record<string, unknown>) => {
	const { body } = render(Carousel, { props: { items: [1, 2, 3], ...props } });
	return breakpoints.map((breakpoint) => {
		const match = body.match(new RegExp(`--carousel-${name}-${breakpoint}:\\s*([^;"]+)`));
		return match?.[1]?.trim();
	});
};

// The whole point of writing five custom properties instead of measuring: the server already
// knows what every breakpoint should look like, so the first painted frame is laid out correctly
// and the ResizeObserver only ever has to catch up on the dot count.
describe('Carousel server-rendered layout', () => {
	test('writes every breakpoint of a record with the cascade already flattened', () => {
		// `{ md: 2, xl: 4 }` — md holds through lg, and the bands below md take the default.
		expect(trackVariables('layout', { layout: { md: 2, xl: 4 } })).toStrictEqual([
			'100.00%',
			'100.00%',
			'50.00%',
			'50.00%',
			'25.00%'
		]);
	});

	test('spreads a plain value across every breakpoint', () => {
		expect(trackVariables('gap', { gaps: 12 })).toStrictEqual(Array(5).fill('12px'));
	});

	test('holds a record key at every wider breakpoint', () => {
		expect(trackVariables('partial-delta', { partialDelta: { xs: 8 } })).toStrictEqual(
			Array(5).fill('8px')
		);
	});

	// `gaps={0}` used to resolve to the 20px default, because the old resolver fell back on any
	// falsy value rather than on `undefined` alone.
	test('keeps a zero instead of replacing it with the default', () => {
		expect(trackVariables('gap', { gaps: 0 })).toStrictEqual(Array(5).fill('0px'));
	});

	test('falls back to the documented defaults when the props are omitted', () => {
		expect(trackVariables('layout', {})).toStrictEqual(Array(5).fill('100.00%'));
		expect(trackVariables('gap', {})).toStrictEqual(Array(5).fill(`${carouselFallbacks.gaps}px`));
		expect(trackVariables('partial-delta', {})).toStrictEqual(
			Array(5).fill(`${carouselFallbacks.partialDelta}px`)
		);
	});
});

// The chrome moved out from over the slides into a footer row below them, so what the server
// renders is now the whole default chrome — not just the track. These three cases pin the
// defaults and the two ways to turn them off.
describe('Carousel footer chrome', () => {
	const body = (props: Record<string, unknown>) =>
		render(Carousel, { props: { items: [1, 2, 3], ...props } }).body;

	test('carousel:progress.role renders the progress line and the prev/next pair by default', () => {
		const html = body({});
		expect(html).toContain('data-carousel-footer');
		expect(html).toContain('role="progressbar"');
		expect(html).toContain('aria-valuenow="0"');
		expect(html).toContain('aria-valuemin="0"');
		expect(html).toContain('aria-valuemax="100"');
		expect(html).toContain('aria-label="Carousel progress"');
		// Presentational: the bar reports the position, it never moves the track.
		expect(html).not.toMatch(/<button[^>]*role="progressbar"/);
		expect(html).toContain('data-carousel-navigation');
		expect(html).toContain('aria-label="Previous slide"');
		expect(html).toContain('aria-label="Next slide"');
	});

	test('swaps the line for dots without moving the footer', () => {
		const html = body({ pagination: { variant: 'dots' } });
		expect(html).toContain('data-carousel-footer');
		expect(html).toContain('data-carousel-dots');
		expect(html).not.toContain('role="progressbar"');
	});

	test('renders no footer at all when both halves are false', () => {
		const html = body({ pagination: false, navigationButton: false });
		expect(html).not.toContain('data-carousel-footer');
		expect(html).not.toContain('role="progressbar"');
		expect(html).not.toContain('data-carousel-navigation');
	});

	// `justify-between` alone only spaces two halves apart: drop the pagination and the navigation
	// becomes the footer's only child, which `justify-between` parks at the LEADING edge. The pair
	// carries its own auto inline-start margin so it stays trailing either way.
	test('keeps the prev/next pair trailing when the pagination half is dropped', () => {
		const navigationClass = (props: Record<string, unknown>) =>
			body(props).match(/<div[^>]*data-carousel-navigation[^>]*class="([^"]*)"/)?.[1] ??
			body(props).match(/<div[^>]*class="([^"]*)"[^>]*data-carousel-navigation/)?.[1] ??
			'';
		const html = body({ pagination: false });
		expect(html).toContain('data-carousel-footer');
		expect(html).toContain('data-carousel-navigation');
		expect(html).not.toContain('role="progressbar"');
		expect(html).not.toContain('data-carousel-dots');
		expect(navigationClass({ pagination: false })).toContain('ms-auto');
		// Same class with a pagination present — it is inert there, not a per-case override.
		expect(navigationClass({})).toContain('ms-auto');
	});

	// Nothing in the footer is positioned, so it cannot sit over the slides the way the old
	// absolute buttons and dots did.
	test('leaves the footer unpositioned so it cannot overlay the slides', () => {
		const footer =
			body({}).match(/<div[^>]*data-carousel-footer[^>]*class="([^"]*)"/)?.[1] ??
			body({}).match(/<div[^>]*class="([^"]*)"[^>]*data-carousel-footer/)?.[1] ??
			'';
		expect(footer).not.toMatch(/\babsolute\b/);
		expect(footer).toContain('flex');
	});
});
