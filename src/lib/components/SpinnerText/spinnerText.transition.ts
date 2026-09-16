import { easingFunctions, type Easing } from '$lib/transitions/easingFunctions.js';
import type { FSOParams } from '$lib/transitions/transition.js';
import type { TransitionConfig } from 'svelte/transition';

type TextTransitionParams = {
	role: 'in' | 'out';
};

/**
 * The resolved motion side (`duration` already in ms, `easing` an easing-function
 * name) the component hands each transition. A getter, because the value is derived
 * and Svelte calls the transition long after the component initialised.
 */
type TextMotion = () => FSOParams;

const timing = (motion: TextMotion) => {
	const side = motion();
	return {
		duration: side.duration ?? 0,
		easing: easingFunctions[(side.easing ?? 'cubicInOut') as Easing]
	};
};

/** Text swaps by sliding through the viewport: new copy rises, old copy sinks. */
export const verticalText =
	(motion: TextMotion) =>
	(_node: HTMLElement, { role }: TextTransitionParams): TransitionConfig => ({
		...timing(motion),
		css: (t) => {
			const offset = (1 - t) * (role === 'in' ? -65 : 65);
			return `transform:translate3d(0,${offset}%,0);opacity:${t};`;
		}
	});

/** Text swaps by wiping: the new copy is revealed left to right, the old one erased. */
export const revealText =
	(motion: TextMotion) =>
	(_node: HTMLElement, { role }: TextTransitionParams): TransitionConfig => ({
		...timing(motion),
		css: (t) => {
			const hidden = (1 - t) * 100;
			const clipPath = role === 'in' ? `inset(0 ${hidden}% 0 0)` : `inset(0 0 0 ${hidden}%)`;
			return `clip-path:${clipPath};`;
		}
	});
