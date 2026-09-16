import { Spring } from 'svelte/motion';
import { prefersReducedMotion } from './motion.svelte.js';

interface SpringOpts {
	stiffness?: number;
	damping?: number;
	precision?: number;
}
export const useSpringState = (opts: SpringOpts) => {
	return (value: number) => {
		// Stiffness/damping/precision of 1 make the spring settle in a single step.
		const reduce = prefersReducedMotion();
		return new Spring(value, {
			stiffness: reduce ? 1 : opts.stiffness,
			damping: reduce ? 1 : opts.damping,
			precision: reduce ? 1 : opts.precision
		});
	};
};
