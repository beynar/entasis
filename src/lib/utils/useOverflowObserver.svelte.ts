export type OverflowAxis = 'x' | 'y';

export type OverflowObserverOptions = {
	/** Which axis to measure. Re-read on every attach, so it may be a getter. Defaults to `'x'`. */
	axis?: OverflowAxis | (() => OverflowAxis);
	/**
	 * Descendants to observe alongside the container. Content that resizes without resizing
	 * the container (a tab relabelling, a timeline entry wrapping) only shows up here.
	 */
	selector?: string;
	/** While this returns `false` nothing is observed and `overflowing` stays `false`. */
	enabled?: () => boolean;
};

/**
 * `true` when `node`'s content is larger than its box on `axis`. The 1px slack absorbs
 * sub-pixel layout rounding, which otherwise reports a permanent 1px overflow.
 */
export const isOverflowing = (node: Element, axis: OverflowAxis = 'x'): boolean =>
	axis === 'x'
		? node.scrollWidth > node.clientWidth + 1
		: node.scrollHeight > node.clientHeight + 1;

/**
 * Tracks whether a scroll container overflows, coalescing measurements into one frame.
 *
 * Returns a Svelte attachment plus a reactive `overflowing` flag:
 * ```svelte
 * const overflow = useOverflowObserver({ selector: '[role="tab"]' });
 * <div {@attach overflow.attachment} data-overflowing={overflow.overflowing}>
 * ```
 */
export const useOverflowObserver = (options: OverflowObserverOptions = {}) => {
	let overflowing = $state(false);

	const attachment = (node: HTMLElement) => {
		if (options.enabled?.() === false) {
			overflowing = false;
			return;
		}
		const axis = (typeof options.axis === 'function' ? options.axis() : options.axis) ?? 'x';

		let frame: number | undefined;
		const measure = () => {
			frame = undefined;
			overflowing = isOverflowing(node, axis);
		};
		const schedule = () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			frame = requestAnimationFrame(measure);
		};
		const resizeObserver = new ResizeObserver(schedule);
		const observeLayout = () => {
			resizeObserver.disconnect();
			resizeObserver.observe(node);
			if (options.selector) {
				node
					.querySelectorAll<HTMLElement>(options.selector)
					.forEach((child) => resizeObserver.observe(child));
			}
			schedule();
		};
		const mutationObserver = new MutationObserver(observeLayout);
		mutationObserver.observe(node, { childList: true, characterData: true, subtree: true });
		observeLayout();

		return () => {
			if (frame !== undefined) cancelAnimationFrame(frame);
			mutationObserver.disconnect();
			resizeObserver.disconnect();
		};
	};

	return {
		attachment,
		get overflowing() {
			return overflowing;
		}
	};
};
