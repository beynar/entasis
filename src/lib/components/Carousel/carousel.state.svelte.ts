import { untrack } from 'svelte';
import { bind } from './utils.js';
import { Blossom } from '@blossom-carousel/core';
import { on } from 'svelte/events';
import { MediaQuery, SvelteMap } from 'svelte/reactivity';
import { resolveContainerBreakpoint, resolveResponsive } from '../Theme/responsive.js';
import type { Breakpoint } from '../Theme/theme.js';
import type { CarouselProps } from './carousel.props.js';
import { en, type Messages } from '$lib/i18n/en.js';

// Blossom's drag-to-scroll is only wanted where there is a real pointer; touch panning is
// native. Lazily built and shared: `MediaQuery` calls `window.matchMedia` in its constructor,
// so it must not run on the server, and one instance owns the listener for every carousel.
let finePointerQuery: MediaQuery | null = null;
const hasFinePointer = () =>
	(finePointerQuery ??= new MediaQuery('(hover: hover) and (pointer: fine)')).current;

/**
 * What a responsive prop resolves to at a breakpoint no key of it covers: `layout={{ md: 2 }}`
 * shows one slide below 42rem of carousel width. These are the props' only defaults — the
 * component declares no destructuring default — so an omitted prop and a record that starts at a
 * wider key land on the same number.
 */
export const carouselFallbacks = { layout: 1, gaps: 20, partialDelta: 0 } as const;

const memoizedDerived = <T>(fn: () => T) => {
	let value = $state<T | null>(fn());
	$effect(() => {
		const newValue = fn();
		untrack(() => {
			if (newValue) {
				value = newValue;
			}
		});
	});
	return {
		get current() {
			return value;
		}
	};
};

type CarouselOptions = Pick<CarouselProps<unknown>, 'layout' | 'gaps' | 'partialDelta'> & {
	/** Active i18n catalog, used for the slide and navigation accessible names. */
	messages?: Messages;
};
// `bind(this, options)` installs the option properties on the instance; this type-only base
// class is what declares them to TypeScript. (Merging an empty `interface` into the class
// would be unsafe declaration merging: the interface promises members the class never defines.)
const CarouselOptionsBase = class {} as unknown as new () => CarouselOptions;

type Slide = {
	index: number;
	intersectionObserver: IntersectionObserver;
	node: HTMLElement;
	inView: boolean;
};

export class CarouselState extends CarouselOptionsBase {
	container = $state<HTMLElement>();
	scrollLeft = $state(0);
	/**
	 * How far the track can scroll: `scrollWidth - clientWidth`, re-read on every scroll and
	 * resize because neither is reactive on its own. Zero on the server and for a track that
	 * does not overflow, which is what makes `progress` start at 0 instead of dividing by it.
	 */
	scrollRange = $state(0);
	slides = new SvelteMap<HTMLElement, Slide>();
	slideWidth = $state(0);
	slideHeight = $state(0);

	breakpoint = $state<Breakpoint>('xs');
	resolvedLayout = $derived(
		resolveResponsive(this.layout, this.breakpoint, carouselFallbacks.layout)
	);
	resolvedGaps = $derived(resolveResponsive(this.gaps, this.breakpoint, carouselFallbacks.gaps));
	sortedSlides = $derived(Array.from(this.slides.values()).sort((a, b) => a.index - b.index));

	currentSlide = memoizedDerived<Slide | null>(() => {
		return this.sortedSlides.find((slide) => slide?.inView) || null;
	});

	lastSlideInView = $derived(this.sortedSlides.findLast((slide) => slide?.inView));
	canScrollNext = $derived(
		this.lastSlideInView && this.lastSlideInView.index < this.sortedSlides.length - 1
	);
	canScrollPrev = $derived(this.currentSlide.current && this.currentSlide.current.index > 0);

	/**
	 * Fraction of the scrollable range already scrolled: 0 with the first slide at the start
	 * edge, 1 with the last slide fully in view. This is the progress line's only input, so it
	 * follows a free drag and a momentum flick as closely as it follows `next()`. `scrollLeft`
	 * is negative in RTL, where the range is walked from the other end, so its magnitude is
	 * what counts. SSR renders 0: there is no track to measure yet.
	 */
	progress = $derived(
		this.scrollRange > 0 ? Math.min(1, Math.abs(this.scrollLeft) / this.scrollRange) : 0
	);

	dots = $derived.by(() => {
		const dotCounts = Math.ceil(this.sortedSlides.length / this.resolvedLayout);
		return Array.from({ length: dotCounts }, (_, index) => {
			const startIndex = index * this.resolvedLayout;
			const endIndex = startIndex + this.resolvedLayout;
			const isLast = index === dotCounts - 1;
			const isLastSlide = this.lastSlideInView?.index === this.sortedSlides.at(-1)?.index;
			const active =
				((this.currentSlide.current?.index || 0) >= startIndex &&
					(this.currentSlide.current?.index || 0) < endIndex &&
					!isLastSlide) ||
				(isLast && isLastSlide);
			return {
				active,
				attributes: {
					'data-active': active,
					'aria-controls': `${this.id}-slide-${index + 1}`,
					'aria-label': (this.messages ?? en).slideIndex(index + 1),
					'aria-current': active ? ('true' as const) : undefined,
					onclick: () => {
						this.moveToSlide({ node: this.sortedSlides[index * this.resolvedLayout]?.node });
					}
				}
			};
		});
	});

	nextButton = $derived.by(() => {
		return {
			disabled: !this.canScrollNext,
			'aria-controls': `${this.id}`,
			'aria-label': `${(this.messages ?? en).next} ${(this.messages ?? en).slide}`,
			onclick: () => {
				this.next();
			}
		};
	});

	prevButton = $derived.by(() => {
		return {
			disabled: !this.canScrollPrev,
			'aria-controls': `${this.id}`,
			'aria-label': `${(this.messages ?? en).previous} ${(this.messages ?? en).slide}`,
			onclick: () => {
				this.prev();
			}
		};
	});

	constructor(
		public props: CarouselOptions,
		public id: string
	) {
		super();
		bind(this, props);
	}

	private refreshSlideMetadata = () => {
		if (!this.container) return;
		const slideNodes = Array.from(this.container.children).filter(
			(node): node is HTMLElement => node instanceof HTMLElement
		);
		slideNodes.forEach((node, index) => {
			const slide = this.slides.get(node);
			if (!slide) return;
			node.setAttribute('id', `${this.id}-slide-${index + 1}`);
			node.setAttribute('aria-roledescription', 'slide');
			node.setAttribute('role', 'tabpanel');
			node.setAttribute('data-carousel-slide', index.toString());
			node.setAttribute('aria-label', (this.messages ?? en).slideOf(index + 1, slideNodes.length));
			this.slides.set(node, {
				...slide,
				index
			});
		});
		// Appending or removing slides changes the track's scrollWidth without resizing the
		// container's own border box, so the ResizeObserver never fires; re-measure here or
		// `progress` keeps reporting the old range until the next scroll event.
		this.measureScrollRange();
	};

	private onSlide = (node: HTMLElement) => {
		if (!this.container) return;
		if (this.slides.has(node)) {
			this.refreshSlideMetadata();
			return;
		}
		if (!this.slideWidth) this.slideWidth = node.clientWidth;
		if (!this.slideHeight) this.slideHeight = node.clientHeight;
		const index = Array.from(this.container.children).indexOf(node);
		const intersectionObserver = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					const slide = this.slides.get(entry.target as HTMLElement);
					if (slide) {
						this.slides.set(node, {
							...slide,
							inView: entry.isIntersecting
						});
						entry.target.setAttribute('data-in-view', entry.isIntersecting.toString());
					}
				});
			},
			{
				root: this.container,
				threshold: 0.9
			}
		);
		intersectionObserver.observe(node);
		this.slides.set(node, {
			index,
			node,
			intersectionObserver,
			inView: false
		});
		this.refreshSlideMetadata();
	};

	/**
	 * The active breakpoint follows the carousel's own inline size, read through the shared
	 * `containerBreakpoints` table so `sm` means the same box width here as in Grid and Stack.
	 * What is measured is the ROOT (`[data-carousel]`), because the root is the element carrying
	 * `@container/carousel` and its content box is what the `@container carousel (…)` rules in
	 * Carousel.svelte resolve against — so the JS breakpoint and the CSS breakpoint flip on the
	 * same pixel. The track itself would answer a different number: its border box is one bleed
	 * allowance wider than the root on each side.
	 *
	 * Only the dot count and the `next()` / `prev()` step size need this: slides-per-view, gap and
	 * peek are styled from the five custom properties the component writes on the server, so they
	 * are already right on first paint, before this observer has ever fired.
	 */
	private measure = (width: number) => {
		this.breakpoint = resolveContainerBreakpoint(width);
		this.measureScrollRange();
	};

	/** Re-reads the track's scrollable range. Cheap, and the only way `progress` stays honest
	 * when slides are added, the layout changes or the host is resized. */
	private measureScrollRange = () => {
		if (!this.container) return;
		this.scrollRange = Math.max(0, this.container.scrollWidth - this.container.clientWidth);
	};

	private moveToSlide = (slide?: { node: HTMLElement }) => {
		if (!slide) return;
		// `offsetLeft` is measured from the slider's padding edge, while a snap lands the slide at
		// the scroll-padding edge; aim for the snap position so a bleed allowance never fights it.
		const scrollPadding = this.container ? getComputedStyle(this.container).scrollPaddingLeft : '';
		const scrollPaddingPx = scrollPadding.endsWith('px') ? parseFloat(scrollPadding) : 0;
		this.container?.scrollTo({
			left: slide.node.offsetLeft - scrollPaddingPx,
			behavior: 'smooth'
		});
	};
	next = (count: number = this.resolvedLayout) => {
		if (!this.currentSlide.current || !this.canScrollNext) return;
		const nextSlideIndex = Math.min(this.slides.size - 1, this.currentSlide.current.index + count);
		const nextSlide = this.sortedSlides.find((slide) => slide?.index === nextSlideIndex);
		this.moveToSlide(nextSlide);
	};
	prev = (count: number = this.resolvedLayout) => {
		if (!this.currentSlide.current || !this.canScrollPrev) return;
		const prevSlideIndex = Math.max(0, this.currentSlide.current.index - count);
		const prevSlide = this.sortedSlides.find((slide) => slide?.index === prevSlideIndex);
		this.moveToSlide(prevSlide);
	};

	private observeSlides = (container: HTMLElement) => {
		const directChildrenObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node instanceof HTMLElement && node.parentElement === container) {
						this.onSlide(node);
					}
				});
				mutation.removedNodes.forEach((node) => {
					if (node instanceof HTMLElement) {
						const slide = this.slides.get(node);
						if (slide) {
							slide.intersectionObserver.disconnect();
							this.slides.delete(node);
						}
					}
				});
			});
			this.refreshSlideMetadata();
		});
		// Initialize existing slides
		Array.from(container.children).forEach((node) => {
			if (node instanceof HTMLElement) {
				this.onSlide(node);
			}
		});
		directChildrenObserver.observe(container, {
			childList: true,
			subtree: false
		});

		return () => {
			directChildrenObserver.disconnect();
			Array.from(this.slides.values()).forEach((slide) => {
				slide.intersectionObserver.disconnect();
			});
			this.slides.clear();
		};
	};

	onScroll = (e: Event) => {
		this.scrollLeft = (e.target as HTMLElement).scrollLeft;
		this.measureScrollRange();
	};

	/** Keyboard navigation for the slider region: arrows (writing-direction aware), Home, End. */
	onKeyDown = (event: KeyboardEvent) => {
		const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		const next = rtl ? 'ArrowLeft' : 'ArrowRight';
		const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
		if (event.key === next) this.next();
		else if (event.key === prev) this.prev();
		else if (event.key === 'Home') this.moveToSlide(this.sortedSlides[0]);
		else if (event.key === 'End') this.moveToSlide(this.sortedSlides.at(-1));
		else return;
		event.preventDefault();
	};

	attachment = (container: HTMLElement) => {
		return untrack(() => {
			this.container = container;
			const hasMouse = hasFinePointer();
			const blossom = Blossom(container, {});
			if (hasMouse) {
				blossom.init();
			}
			// The root is the query container; the track bleeds past it (see `measure`). A carousel
			// built without that root — the state's own unit tests — falls back to the track.
			const host = container.closest<HTMLElement>('[data-carousel]') ?? container;
			// The track bleeds past the root by the shadow allowance, and a box that extends past the
			// viewport is horizontal page scroll on a phone. CSS cannot see the viewport edge from
			// inside a box, so the room on each side is measured here and the bleed rule takes the
			// smaller of the allowance and the room (see the `--carousel-room-*` reads in
			// Carousel.svelte). Clipping the root instead would cut the shadows on every side.
			const room = () => {
				// Layout position, not `getBoundingClientRect`: the rect includes transforms, and a
				// carousel mounted inside a tab panel that is still sliding in would measure its room
				// mid-flight and keep that answer until the next resize. The offset chain ignores
				// transforms and reports where the root rests.
				let left = -window.scrollX;
				for (let element: HTMLElement | null = host; element;) {
					const parent = element.offsetParent as HTMLElement | null;
					left += element.offsetLeft + (parent?.clientLeft ?? 0);
					element = parent;
				}
				const right = document.documentElement.clientWidth - (left + host.offsetWidth);
				host.style.setProperty('--carousel-room-left', `${Math.max(0, left)}px`);
				host.style.setProperty('--carousel-room-right', `${Math.max(0, right)}px`);
			};
			const resizeObserver = new ResizeObserver(([entry]) => {
				// Border box, not `contentRect`: the root takes no padding, and a track measured as the
				// fallback takes `padding-inline: 50%` in repeat mode, which would otherwise report a
				// content width far wider than the carousel.
				this.measure(entry?.borderBoxSize?.[0]?.inlineSize ?? entry?.target.clientWidth ?? 0);
				room();
			});
			resizeObserver.observe(host, { box: 'border-box' });
			// A viewport resize can change the room without changing the root's own size.
			const offWindowResize = on(window, 'resize', room);
			const offScroll = on(container, 'scroll', this.onScroll);
			this.measure(host.clientWidth);
			room();
			const offSlides = this.observeSlides(container);
			this.measureScrollRange();
			return () => {
				if (hasMouse) {
					blossom?.destroy();
				}
				resizeObserver.disconnect();
				offWindowResize();
				offSlides();
				offScroll();
			};
		});
	};
}
