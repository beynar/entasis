import type { CrossfadeParams, TransitionConfig } from 'svelte/transition';
import { cubicInOut } from 'svelte/easing';

type ArcCrossfadeParams = CrossfadeParams & { key: unknown };
type Fallback = (node: Element, params: ArcCrossfadeParams, intro: boolean) => TransitionConfig;

/**
 * Svelte's `crossfade`, travelling along a curve instead of a straight line. Things that move
 * between two places move like objects thrown from one to the other: the vertical part of the trip
 * leads and the horizontal part follows, so the path bows. The outgoing and incoming nodes trace
 * the same curve, so the crossfade between them stays aligned.
 */
export function arcCrossfade({
	fallback,
	...defaults
}: CrossfadeParams & { fallback?: Fallback }): [
	(node: Element, params: ArcCrossfadeParams) => () => TransitionConfig,
	(node: Element, params: ArcCrossfadeParams) => () => TransitionConfig
] {
	const toReceive = new Map<unknown, Element>();
	const toSend = new Map<unknown, Element>();

	// Progress along the trip, 0 at the node leaving and 1 at the node arriving: the horizontal
	// share follows it, the vertical share leads it.
	const lead = (p: number) => 1 - (1 - p) * (1 - p);

	function travel(fromNode: Element, node: Element, params: ArcCrossfadeParams, intro: boolean) {
		const {
			delay = 0,
			duration = (d: number) => Math.sqrt(d) * 30,
			easing = cubicInOut
		} = { ...defaults, ...params };
		const from = fromNode.getBoundingClientRect();
		const to = node.getBoundingClientRect();
		const dx = from.left - to.left;
		const dy = from.top - to.top;
		const dw = from.width / to.width;
		const dh = from.height / to.height;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const style = getComputedStyle(node);
		const transform = style.transform === 'none' ? '' : style.transform;
		const opacity = +style.opacity;
		return {
			delay,
			duration: typeof duration === 'function' ? duration(distance) : duration,
			easing,
			css: (t: number, u: number) => {
				// The arriving node starts at the leaving one (offset `d`) and reaches its place;
				// the leaving node starts in place and ends at the arriving one. Both sit on the
				// point of the curve at the same progress.
				const progress = intro ? t : u;
				const x = intro ? u : progress;
				const y = intro ? 1 - lead(progress) : lead(progress);
				return `
					opacity: ${t * opacity};
					transform-origin: top left;
					transform: ${transform} translate(${x * dx}px,${y * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
				`;
			}
		};
	}

	function transition(
		items: Map<unknown, Element>,
		counterparts: Map<unknown, Element>,
		intro: boolean
	) {
		return (node: Element, params: ArcCrossfadeParams) => {
			items.set(params.key, node);
			return () => {
				const other = counterparts.get(params.key);
				if (other) {
					counterparts.delete(params.key);
					return travel(other, node, params, intro);
				}
				items.delete(params.key);
				return fallback ? fallback(node, params, intro) : {};
			};
		};
	}

	return [transition(toSend, toReceive, false), transition(toReceive, toSend, true)];
}
