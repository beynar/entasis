import type { ChartAnimationOptions, ChartValue as TanStackValue } from '@tanstack/charts';
import { easingFunctions, type Easing } from '$lib/transitions/easingFunctions.js';
import type { FSOParams } from '$lib/transitions/transition.js';
import type { ChartPositionDefinition, ChartValue } from './chart.core.js';
import type { ChartViewport, ChartViewportTransition } from './chart.viewport.props.js';

export type ResolvedChartViewport = {
	readonly reset: boolean;
	readonly animation: false | ChartAnimationOptions;
};

/**
 * Defaults for a viewport that does not spell its own timing out: the resolved
 * `chartTheme.motion` side, so `<Theme motion>` and a reduced-motion preference own
 * the zoom settle. Falls back to the library scale when no motion is handed in.
 */
const fallbackMotion = { duration: 300, easing: 'cubicOut' } satisfies FSOParams;

export function resolveChartViewport(
	input: ChartViewport | undefined,
	x: ChartPositionDefinition | undefined,
	motion?: FSOParams
): ResolvedChartViewport | undefined {
	if (input === undefined || input === false) return undefined;
	if (input !== true && (typeof input !== 'object' || input === null)) {
		throw new TypeError('[Chart] viewport must be a boolean or viewport definition.');
	}
	const definition = input === true ? {} : input;
	if (definition.axis !== undefined && definition.axis !== 'x') {
		throw new TypeError(`[Chart] viewport.axis "${String(definition.axis)}" is not supported.`);
	}
	if (!x) throw new TypeError('[Chart] viewport requires the x prop.');
	return {
		reset: definition.reset ?? true,
		animation: resolveAnimation(definition.transition, motion ?? fallbackMotion)
	};
}

export function sameChartViewportDomain(
	left: readonly ChartValue[],
	right: readonly TanStackValue[] | undefined
): boolean {
	if (!right || left.length !== right.length) return false;
	return left.every((value, index) => sameValue(value, right[index]));
}

function resolveAnimation(
	transition: ChartViewportTransition | boolean | undefined,
	motion: FSOParams
): false | ChartAnimationOptions {
	if (transition === false) return false;
	const definition = transition === undefined || transition === true ? {} : transition;
	const duration = definition.duration ?? motion.duration ?? fallbackMotion.duration;
	if (!Number.isFinite(duration) || duration < 0) {
		throw new TypeError(
			'[Chart] viewport.transition.duration must be a finite non-negative number.'
		);
	}
	const easing = definition.easing;
	if (
		easing !== undefined &&
		easing !== 'linear' &&
		easing !== 'ease' &&
		easing !== 'ease-in' &&
		easing !== 'ease-out' &&
		easing !== 'ease-in-out'
	) {
		throw new TypeError(`[Chart] viewport.transition.easing "${String(easing)}" is not supported.`);
	}
	return {
		duration,
		// The chart engine takes either a CSS keyword or an easing function, so a motion
		// token can be handed over as the function it names.
		easing: easing ?? easingFunctions[(motion.easing ?? fallbackMotion.easing) as Easing],
		respectReducedMotion: true,
		resize: false
	};
}

function sameValue(left: ChartValue, right: TanStackValue | undefined): boolean {
	if (left instanceof Date || right instanceof Date) {
		return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
	}
	return left === right;
}
