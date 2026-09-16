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

	const enableTransition = () => {
		if (isReady || firstFrame !== undefined) return;

		firstFrame = requestAnimationFrame(() => {
			firstFrame = undefined;
			secondFrame = requestAnimationFrame(() => {
				secondFrame = undefined;
				isReady = true;
			});
		});
	};

	const placeIndicator = (index = options.activeIndex()) => {
		const element = itemElements[index];
		if (!element) return;

		style = options.getStyle(element);
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
				if (firstFrame !== undefined) cancelAnimationFrame(firstFrame);
				if (secondFrame !== undefined) cancelAnimationFrame(secondFrame);
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
		}
	};
};
