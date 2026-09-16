import { on } from 'svelte/events';
import { SvelteSet } from 'svelte/reactivity';

type UseDragOptions = {
	onDragStart?: (event: PointerEvent) => void;
	onDragEnd?: (event: PointerEvent) => void;
	onDrag?: (event: PointerEvent) => void;
	isActive?: boolean;
};
export const useDrag = (opts: UseDragOptions) => {
	const offs = new SvelteSet<() => void>();
	let isDragging = $state(false);
	let moveOff: (() => void) | null = null;
	let upOff: (() => void) | null = null;

	const destroy = () => {
		offs.forEach((off) => off());
		offs.clear();
		if (moveOff) moveOff();
		if (upOff) upOff();
	};

	const onMove = (e: PointerEvent) => {
		opts.onDrag?.(e);
	};

	const onUp = (e: PointerEvent) => {
		isDragging = false;
		opts.onDragEnd?.(e);
		// Remove move/up listeners when drag ends
		if (moveOff) {
			moveOff();
			moveOff = null;
		}
		if (upOff) {
			upOff();
			upOff = null;
		}
	};

	const onDown = (e: PointerEvent) => {
		isDragging = true;
		opts.onDragStart?.(e);
		// Add move/up listeners only when drag starts
		moveOff = on(window, 'pointermove', onMove);
		upOff = on(window, 'pointerup', onUp);
	};

	return {
		get reference() {
			if (!opts.isActive) return null;
			return (ref: HTMLElement) => {
				const offDown = on(ref, 'pointerdown', onDown);
				offs.add(offDown);
				return () => {
					destroy();
				};
			};
		},
		get isDragging() {
			return isDragging;
		}
	};
};
