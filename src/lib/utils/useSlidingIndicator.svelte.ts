import { untrack } from 'svelte';

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
