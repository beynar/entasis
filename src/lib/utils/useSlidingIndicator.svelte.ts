import { untrack } from 'svelte';

/** An item's box in its offset parent's padding box, in CSS pixels, before any transform. */
export type IndicatorBox = { x: number; y: number; width: number; height: number };

/**
 * Where `element` sits in its offset parent, like `offsetLeft`/`offsetWidth` but fractional:
 * those round to whole pixels, so an indicator sized from them can stop a pixel short of an item
 * laid out at 80.5px. The rectangles are taken relative to the parent's padding box (its border
 * excluded, its scroll position added back), and divided by the parent's scale so an ancestor
 * transform (a dialog zooming in) does not shrink the measure.
 */
export const measureIndicatorBox = (element: HTMLElement): IndicatorBox => {
	const parent = element.offsetParent;
	if (!(parent instanceof HTMLElement)) {
		const { offsetLeft: x, offsetTop: y, offsetWidth: width, offsetHeight: height } = element;
		return { x, y, width, height };
	}
	const box = element.getBoundingClientRect();
	const frame = parent.getBoundingClientRect();
	const scaleX = scaleOf(frame.width, parent.offsetWidth);
	const scaleY = scaleOf(frame.height, parent.offsetHeight);
	return {
		x: (box.left - frame.left) / scaleX - parent.clientLeft + parent.scrollLeft,
		y: (box.top - frame.top) / scaleY - parent.clientTop + parent.scrollTop,
		width: box.width / scaleX,
		height: box.height / scaleY
	};
};

// The offset size is rounded to a whole pixel, so a gap under one pixel is that rounding, not a
// transform; a scale too slight to open a one-pixel gap moves the indicator by less than that.
const scaleOf = (rendered: number, offset: number) =>
	offset > 0 && rendered > 0 && Math.abs(rendered - offset) >= 1 ? rendered / offset : 1;

type SlidingIndicatorOptions = {
	activeIndex: () => number;
	getStyle: (element: HTMLElement) => string;
	observe?: () => unknown;
};

export const useSlidingIndicator = (options: SlidingIndicatorOptions) => {
	const itemElements: Array<HTMLElement | undefined> = [];
	let resizeObserver: ResizeObserver | undefined;
	let firstFrame: number | undefined;
	let secondFrame: number | undefined;
	let style = $state('');
	let isHydrated = $state(false);
	let isReady = $state(false);
	let isVisible = $state(false);

	const cancelFrames = () => {
		if (firstFrame !== undefined) cancelAnimationFrame(firstFrame);
		if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
		firstFrame = undefined;
		secondFrame = undefined;
	};

	const enableTransition = () => {
		if (isReady || firstFrame !== undefined || secondFrame !== undefined) return;

		firstFrame = requestAnimationFrame(() => {
			firstFrame = undefined;
			secondFrame = requestAnimationFrame(() => {
				secondFrame = undefined;
				isReady = true;
			});
		});
	};

	// No active item: drop the last position instead of leaving the indicator on a tab that is
	// no longer selected, and let the next placement snap into place before transitions resume.
	const hideIndicator = () => {
		style = '';
		isVisible = false;
		isReady = false;
		cancelFrames();
	};

	const placeIndicator = (index = options.activeIndex()) => {
		if (index < 0) return hideIndicator();
		// An item that is not attached yet places the indicator from its own `itemReference`.
		const element = itemElements[index];
		if (!element) return;

		style = options.getStyle(element);
		isVisible = true;
		isHydrated = true;
		enableTransition();
	};

	$effect(() => {
		const index = options.activeIndex();
		options.observe?.();
		untrack(() => placeIndicator(index));
	});

	const itemReference = (index: number) => (node: HTMLElement) => {
		return untrack(() => {
			itemElements[index] = node;
			resizeObserver?.observe(node);
			placeIndicator();

			return () => {
				resizeObserver?.unobserve(node);
				itemElements[index] = undefined;
			};
		});
	};

	const containerReference = (node: HTMLElement) => {
		return untrack(() => {
			resizeObserver = new ResizeObserver(() => placeIndicator());
			resizeObserver.observe(node);
			itemElements.forEach((element) => element && resizeObserver?.observe(element));
			placeIndicator();

			return () => {
				resizeObserver?.disconnect();
				resizeObserver = undefined;
				cancelFrames();
			};
		});
	};

	return {
		containerReference,
		itemReference,
		get style() {
			return style;
		},
		get isHydrated() {
			return isHydrated;
		},
		get isReady() {
			return isReady;
		},
		/** True while the indicator sits on an active item; false when no item is active. */
		get isVisible() {
			return isVisible;
		}
	};
};
