import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { CarouselState, carouselFallbacks } from './carousel.state.svelte.js';

/** jsdom has no layout, so the track reports the width the test hands it. */
const trackOfWidth = (width: number, scrollWidth = 0) => {
	const track = document.createElement('div');
	Object.defineProperty(track, 'clientWidth', { value: width, configurable: true });
	Object.defineProperty(track, 'scrollWidth', { value: scrollWidth, configurable: true });
	document.body.append(track);
	return track;
};

const withCarousel = (
	width: number,
	assert: (state: CarouselState, track: HTMLElement) => void,
	options: ConstructorParameters<typeof CarouselState>[0] = {
		layout: { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 }
	},
	scrollWidth = 0
) => {
	const cleanup = $effect.root(() => {
		const state = new CarouselState(options, 'carousel-test');
		const track = trackOfWidth(width, scrollWidth);
		const destroy = state.attachment(track);
		flushSync();
		assert(state, track);
		destroy?.();
		track.remove();
	});
	cleanup();
};

describe('CarouselState breakpoint', () => {
	// jsdom's window.innerWidth is 1024, which the old viewport-based resolution read as `lg`.
	// Both cases below contradict it, so they fail if measurement ever goes back to the window.
	it('reads the carousel width, not the window width, when the host is wide', () => {
		withCarousel(1152, (state) => {
			expect(state.breakpoint).toBe('xl');
			expect(state.resolvedLayout).toBe(4);
		});
	});

	it('reads the carousel width, not the window width, when the host is narrow', () => {
		withCarousel(360, (state) => {
			expect(state.breakpoint).toBe('xs');
			expect(state.resolvedLayout).toBe(1);
		});
	});

	// The steps come from the shared `containerBreakpoints` table (36/42/56/72rem), the same one
	// the @container rules in Carousel.svelte query.
	it('steps up through sm, md and lg as the carousel itself grows', () => {
		withCarousel(600, (state) => expect(state.breakpoint).toBe('sm'));
		withCarousel(700, (state) => expect(state.breakpoint).toBe('md'));
		withCarousel(900, (state) => expect(state.breakpoint).toBe('lg'));
	});
});

describe('CarouselState responsive props', () => {
	// `xs` is the base: a record that starts at a wider key leaves the narrow bands on the
	// component default, and the nearest DEFINED key holds upward. `{ xs: 1, md: 2, xl: 3 }`
	// resolving back to 1 at lg would show FEWER slides in a WIDER carousel.
	it('holds the md value through the lg band instead of dropping back', () => {
		withCarousel(
			1000,
			(state) => {
				expect(state.breakpoint).toBe('lg');
				expect(state.resolvedLayout).toBe(2);
			},
			{ layout: { xs: 1, md: 2, xl: 3 } }
		);
	});

	it('uses the component default below the narrowest key of a sparse record', () => {
		withCarousel(360, (state) => expect(state.resolvedLayout).toBe(carouselFallbacks.layout), {
			layout: { md: 2, xl: 3 }
		});
	});

	it('accepts a plain value that applies at every width', () => {
		withCarousel(1152, (state) => expect(state.resolvedGaps).toBe(0), { gaps: 0 });
	});

	it('falls back only when the prop is omitted, so a zero gap survives', () => {
		withCarousel(1152, (state) => expect(state.resolvedGaps).toBe(carouselFallbacks.gaps), {});
	});
});

// The progress line is the default pagination, and its fill width is this number. It is read
// off the scroll position rather than the dot index so a free drag moves it too, which also
// means it must survive a track that cannot scroll at all (division by a zero range).
describe('CarouselState progress', () => {
	const scrollTo = (track: HTMLElement, left: number) => {
		Object.defineProperty(track, 'scrollLeft', { value: left, configurable: true });
		track.dispatchEvent(new Event('scroll'));
		flushSync();
	};

	it('starts at 0 with the track at rest', () => {
		withCarousel(700, (state) => expect(state.progress).toBe(0), undefined, 2100);
	});

	it('stays at 0 when the slides do not overflow the track', () => {
		withCarousel(
			700,
			(state, track) => {
				scrollTo(track, 40);
				expect(state.scrollRange).toBe(0);
				expect(state.progress).toBe(0);
			},
			undefined,
			700
		);
	});

	it('reaches 1 once the track is scrolled to the end of its range', () => {
		withCarousel(
			700,
			(state, track) => {
				expect(state.scrollRange).toBe(1400);
				scrollTo(track, 700);
				expect(state.progress).toBeCloseTo(0.5, 5);
				scrollTo(track, 1400);
				expect(state.progress).toBeCloseTo(1, 5);
			},
			undefined,
			2100
		);
	});

	// A momentum flick can overshoot into the overscroll area, and RTL walks the range with a
	// negative scrollLeft; neither may push the fill past the end of its track.
	it('clamps an overscroll and reads an RTL scroll by its magnitude', () => {
		withCarousel(
			700,
			(state, track) => {
				scrollTo(track, 1600);
				expect(state.progress).toBe(1);
				scrollTo(track, -700);
				expect(state.progress).toBeCloseTo(0.5, 5);
			},
			undefined,
			2100
		);
	});

	// Appending slides grows the track's scrollWidth without touching the container's own border
	// box, so the ResizeObserver never fires. The range has to be re-read when the slide list
	// changes, or `progress` keeps dividing by the old range and the fill renders far too wide
	// until something happens to dispatch a scroll event.
	it('re-measures the scrollable range when slides are appended, with no scroll event', async () => {
		const track = trackOfWidth(700, 2100);
		let state!: CarouselState;
		let destroy: (() => void) | undefined;
		const cleanup = $effect.root(() => {
			state = new CarouselState({ layout: { xs: 1 } }, 'carousel-growing');
			destroy = state.attachment(track);
		});
		flushSync();

		Object.defineProperty(track, 'scrollLeft', { value: 500, configurable: true });
		track.dispatchEvent(new Event('scroll'));
		flushSync();
		expect(state.scrollRange).toBe(1400);
		expect(state.progress).toBeCloseTo(500 / 1400, 5);

		track.append(document.createElement('div'), document.createElement('div'));
		Object.defineProperty(track, 'scrollWidth', { value: 4200, configurable: true });
		// The MutationObserver that notices the new children delivers on a microtask.
		await Promise.resolve();
		flushSync();

		expect(state.scrollRange).toBe(3500);
		expect(state.progress).toBeCloseTo(500 / 3500, 5);

		destroy?.();
		cleanup();
		track.remove();
	});
});

// The `@container carousel (…)` rules that pick slides-per-view resolve against the ROOT's
// content box, and the track is deliberately wider than it: the bleed rule grows the track's
// border box past the root by one allowance on each side. Measuring the track would therefore
// flip the JS breakpoint one bleed early and hand `dots` and `next()` a slides-per-view the CSS
// is not using in a band two allowances wide.
describe('CarouselState breakpoint source', () => {
	it('measures the carousel root, not the track that bleeds past it', () => {
		const root = document.createElement('div');
		root.setAttribute('data-carousel', '');
		// 1140px of root is still `lg`; the track's 1204px border box would read `xl`.
		Object.defineProperty(root, 'clientWidth', { value: 1140, configurable: true });
		document.body.append(root);
		const track = document.createElement('div');
		Object.defineProperty(track, 'clientWidth', { value: 1204, configurable: true });
		root.append(track);

		const cleanup = $effect.root(() => {
			const state = new CarouselState({ layout: { xs: 1, lg: 3, xl: 4 } }, 'carousel-rooted');
			const destroy = state.attachment(track);
			flushSync();
			expect(state.breakpoint).toBe('lg');
			expect(state.resolvedLayout).toBe(3);
			destroy?.();
		});
		cleanup();
		root.remove();
	});
});
