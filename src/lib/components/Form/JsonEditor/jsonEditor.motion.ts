// How a row comes and goes: it grows from nothing and fades, quickly enough to stay out of the way.
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';
import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';

export const rowTransition = (node: Element): TransitionConfig => {
	if (prefersReducedMotion()) return { duration: 0 };
	const height = (node as HTMLElement).offsetHeight;
	return {
		duration: 140,
		easing: cubicOut,
		css: (t) => `overflow: hidden; height: ${t * height}px; opacity: ${t};`
	};
};
