import type { ChartAnimationOptions, ChartValue as TanStackValue } from '@tanstack/charts';
import type { ChartPositionDefinition, ChartValue } from './chart.core.js';
import type { ChartViewport, ChartViewportTransition } from './chart.viewport.props.js';

export type ResolvedChartViewport = {
	readonly reset: boolean;
	readonly animation: false | ChartAnimationOptions;
};

const DEFAULT_TRANSITION = {
	duration: 280,
	easing: 'ease-out'
} as const satisfies ChartViewportTransition;

export function resolveChartViewport(
	input: ChartViewport | undefined,
	x: ChartPositionDefinition | undefined
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
		animation: resolveAnimation(definition.transition)
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
	transition: ChartViewportTransition | boolean | undefined
): false | ChartAnimationOptions {
	if (transition === false) return false;
	const definition =
		transition === undefined || transition === true ? DEFAULT_TRANSITION : transition;
	const duration = definition.duration ?? DEFAULT_TRANSITION.duration;
	const easing = definition.easing ?? DEFAULT_TRANSITION.easing;
	if (!Number.isFinite(duration) || duration < 0) {
		throw new TypeError(
			'[Chart] viewport.transition.duration must be a finite non-negative number.'
		);
	}
	if (
		easing !== 'linear' &&
		easing !== 'ease' &&
		easing !== 'ease-in' &&
		easing !== 'ease-out' &&
		easing !== 'ease-in-out'
	) {
		throw new TypeError(`[Chart] viewport.transition.easing "${String(easing)}" is not supported.`);
	}
	return { duration, easing, respectReducedMotion: true, resize: false };
}

function sameValue(left: ChartValue, right: TanStackValue | undefined): boolean {
	if (left instanceof Date || right instanceof Date) {
		return left instanceof Date && right instanceof Date && left.getTime() === right.getTime();
	}
	return left === right;
}
