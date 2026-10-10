import { onDestroy, untrack } from 'svelte';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';

type HoverActionHandlerOptions = {
	/** Checked when the pointer enters (after the delay) and leaves, never when attaching. */
	isActive: () => boolean;
	onMouseEnter?: () => void;
	onMouseLeave?: () => void;
	/**
	 * Milliseconds between the pointer entering and `onMouseEnter`. Read on every enter, so a
	 * getter or a function follows a changing value; a function also lets a class field read
	 * options its constructor has not bound yet.
	 */
	delay?: number | (() => number | undefined);
};
type Timeout = ReturnType<typeof setTimeout>;
export const useHoverAction = (props: HoverActionHandlerOptions) => {
	const timeouts = new SvelteMap<HTMLElement, Timeout>();
	const offs = new SvelteSet<() => void>();
	let isHovered = $state(false);
	const readDelay = () => (typeof props.delay === 'function' ? props.delay() : props.delay) ?? 0;
	const wait = async (ref: HTMLElement, delay: number) => {
		return new Promise((resolve) => {
			const timeout = setTimeout(() => {
				resolve(true);
				timeouts.delete(ref);
			}, delay);
			timeouts.set(ref, timeout);
		});
	};

	function onMouseEnter(this: HTMLElement) {
		if (timeouts.get(this)) {
			clearTimeout(timeouts.get(this));
			timeouts.delete(this);
		}
		const delay = readDelay();
		if (delay) {
			wait(this, delay).then(() => {
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
		// Always listens: `isActive` is checked when the pointer moves, so an element attached
		// while the owner is inactive (a popover that starts open) still responds once it is active.
		reference: (ref: HTMLElement) => {
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
