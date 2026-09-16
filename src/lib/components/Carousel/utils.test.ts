import { describe, expect, it } from 'vitest';
import carouselSource from './Carousel.svelte?raw';
import { breakpoints, containerBreakpoints } from '../Theme/responsive.js';
import { carouselTheme } from './carousel.theme.js';

/** The `@container carousel (width >= …rem)` thresholds hand-written in the <style> block. */
const cssThresholds = [...carouselSource.matchAll(/@container carousel \(width >= ([\d.]+rem)\)/g)]
	.map((match) => match[1])
	.sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));

describe('Carousel container queries', () => {
	// A Svelte <style> block cannot import a value, so the carousel hand-writes the widths it
	// shares with Grid and Stack. This is the guard that keeps the copy honest: change a width in
	// `containerBreakpoints` and this fails until the style block follows, so `sm` cannot come to
	// mean 36rem in Grid and 40rem here.
	it('queries the shared containerBreakpoints table, not a table of its own', () => {
		expect(cssThresholds).toStrictEqual(Object.values(containerBreakpoints));
	});

	it('names the container the theme root actually opens', () => {
		expect(carouselTheme.root()).toContain('@container/carousel');
		expect(carouselSource).toContain('@container carousel (width >=');
	});

	// Slides-per-view, gap and peek are styled entirely from these properties, which
	// `responsiveVariables` writes with the nearest-below cascade already flattened. A missing one
	// would make that breakpoint inherit the step below it in CSS while the JS breakpoint moved on.
	it('reads one flattened custom property per breakpoint for every responsive prop', () => {
		for (const breakpoint of breakpoints)
			for (const property of ['layout', 'gap', 'partial-delta'])
				expect(carouselSource).toContain(`var(--carousel-${property}-${breakpoint})`);
	});

	it('leaves no viewport media query behind in the style block', () => {
		expect(carouselSource).not.toMatch(/@media \((min|max)-width/);
	});
});

// The two invariants below live entirely in the <style> block: they leave no trace in the
// server-rendered HTML and jsdom has no layout to catch them, so the source is what is checked.
const sliderRuleStart = carouselSource.indexOf('\n\t[data-carousel-slider] {');
const sliderRule = carouselSource.slice(
	sliderRuleStart,
	carouselSource.indexOf('\n\t}', sliderRuleStart)
);
const markup = carouselSource.slice(0, carouselSource.indexOf('<style>'));
/** The slider element's own opening tag, attributes included. */
const sliderTag = (() => {
	const at = markup.indexOf('data-carousel-slider');
	return markup.slice(markup.lastIndexOf('<div', at), markup.indexOf('\n\t>', at));
})();

describe('Carousel bleed zone', () => {
	// The bleed is padding on a SCROLL CONTAINER: invisible, but it lies on top of whatever the
	// host drew above and below the track — a tab bar, the footer row — and would eat their
	// clicks. The track takes no pointer input and the slides take it back, so a press that
	// starts on a slide still bubbles to the scroller (blossom-carousel's drag) while a press in
	// the bleed falls through to what is really there.
	it('takes no pointer input on the track and re-arms it on the slides', () => {
		expect(sliderRule).toMatch(/^\t\tpointer-events: none;$/m);
		expect(sliderRule).toMatch(/:global\(& > \*\) \{[^}]*pointer-events: auto;/);
	});

	// The negative inline margins can only GROW the border box past the host while the track is
	// free to take its stretch size. An inline `width: 100%` in the markup pinned it to the
	// root's width instead, so the margins merely shifted the box and the clip edge — where a
	// partly visible slide is cut — landed two bleeds short of the footer's trailing arrows.
	it('leaves the track free to stretch past the host by the bleed on each side', () => {
		expect(sliderRule).toContain('inline-size: auto;');
		expect(sliderTag).not.toMatch(/style:(width|inline-size)/);
	});
});
