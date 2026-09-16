import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

type HoverActionHandlerOptions = {
	isActive: () => boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	delay?: number;
};
type Timeout = ReturnType<typeof setTimeout>;
export const useHoverAction = (props: HoverActionHandlerOptions) => {
	const timeouts = new SvelteMap<HTMLElement, Timeout>();
	const offs = new SvelteSet<() => void>();
	let isHovered = $state(false);
	const wait = async (ref: HTMLElement) => {
		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				resolve(true);
				timeouts.delete(ref);
			}, props.delay);
			timeouts.set(ref, timeout);
		});
	};

	function onMouseEnter(this: HTMLElement) {
		if (timeouts.get(this)) {
			clearTimeout(timeouts.get(this));
			timeouts.delete(this);
		}
		if (props.delay) {
			wait(this).then(() => {
				if (props.isActive()) props.onMouseEnter?.();
				isHovered = true;
			});
		} else {
			if (props.isActive()) props.onMouseEnter?.();
			isHovered = true;
		}
	}
	function onMouseLeave(this: HTMLElement) {
		if (timeouts.get(this)) {
			clearTimeout(timeouts.get(this));
			timeouts.delete(this);
		}
		if (props.isActive()) props.onMouseLeave?.();
		isHovered = false;
	}

	const destroy = () => {
		offs.forEach((off) => off());
		offs.clear();
		timeouts.forEach((timeout) => clearTimeout(timeout));
		timeouts.clear();
		isHovered = false;
	};
	onDestroy(destroy);

	return {
		reference: (ref: HTMLElement) => {
			if (!props.isActive()) return null;
			return untrack(() => {
				const offEnter = on(ref, 'mouseenter', onMouseEnter.bind(ref));
				const offLeave = on(ref, 'mouseleave', onMouseLeave.bind(ref));
				offs.add(offEnter);
				offs.add(offLeave);

				return () => {
					offLeave();
					offEnter();
					offs.delete(offEnter);
					offs.delete(offLeave);
					const timeout = timeouts.get(ref);
					if (timeout) {
						clearTimeout(timeout);
						timeouts.delete(ref);
					}
				};
			});
		},
		destroy,
		get isHovered() {
			return isHovered;
		}
	};
};
