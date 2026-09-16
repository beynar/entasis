import { onDestroy } from 'svelte';
import { on } from 'svelte/events';
import { SvelteSet } from 'svelte/reactivity';

export const usePointerDown = (opts: {
	isActive: () => boolean;
	onDown?: (event: PointerEvent) => void;
	onUp?: (event: PointerEvent) => void;
}) => {
	const offs = new SvelteSet<() => void>();
	let isDown = $state(false);
	const onDown = (event: PointerEvent) => {
		isDown = true;
		opts.onDown?.(event);
	};

	const onUp = (event: PointerEvent) => {
		isDown = false;
		opts.onUp?.(event);
	};

	const destroy = () => {
		offs.forEach((off) => off());
		offs.clear();
		isDown = false;
	};

	onDestroy(destroy);

	return {
		reference: (node: HTMLElement) => {
			if (!opts.isActive()) return;

			offs.add(on(node, 'pointerdown', onDown));
			offs.add(on(node, 'pointerup', onUp));
			return destroy;
		},
		get isDown() {
			return isDown;
		}
	};
};
