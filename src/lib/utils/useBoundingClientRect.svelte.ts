import { useResizeObserver } from './useResizeObserver.svelte.js';

const defaultRect = {
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
	width: 0,
	height: 0,
	x: 0,
	y: 0
};
export const useBoundingClientRect = () => {
	let rect = $state<DOMRect>({
		...defaultRect,
		toJSON() {
			return defaultRect;
		}
	});
	const resize = useResizeObserver({
		isActive: () => true,
		// `contentRect` is relative to the element's own padding box, so re-read the
		// viewport-relative rect from the observed node instead.
		callback: (entry) => {
			rect = entry.target.getBoundingClientRect();
		}
	});

	return {
		get current() {
			return rect;
		},
		reference: (ref: HTMLElement) => {
			const cleanup = resize.reference(ref);
			rect = ref.getBoundingClientRect();
			return cleanup;
		}
	};
};
