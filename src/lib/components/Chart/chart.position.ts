import type { ChartAxisOptions } from '@tanstack/charts';
import type { ChartPositionDefinition, ChartScaleDefinition, ChartValue } from './chart.props.js';
import { compileChartScale } from './chart.scale.js';

export function compilePosition(
	position: ChartPositionDefinition,
	path: string,
	viewportDomain?: readonly ChartValue[]
): ChartAxisOptions<ChartValue> {
	validateScaleNice(position.scale, position.nice, path);
	const scale = viewportDomain
		? viewportScale(position.scale, viewportDomain, path)
		: position.scale;
	// Native brush inversion reads the scale; native focus clipping reads the viewport.
	const viewport =
		viewportDomain && scale.type !== 'band' && scale.type !== 'point' && scale.domain
			? { domain: scale.domain }
			: undefined;
	return {
		scale: compileChartScale(scale, `${path}.scale`),
		viewport,
		nice: position.nice,
		reverse: position.reverse,
		grid: position.grid,
		axis: position.axis
	};
}

function viewportScale(
	scale: ChartScaleDefinition,
	domain: readonly ChartValue[],
	path: string
): ChartScaleDefinition {
	if (scale.type === 'band' || scale.type === 'point') return { ...scale, domain };
	const [start, end] = domain;
	if (domain.length === 2) {
		if (scale.type === 'time' || scale.type === 'utc') {
			if (start instanceof Date && end instanceof Date) return { ...scale, domain: [start, end] };
		} else if (typeof start === 'number' && typeof end === 'number') {
			return { ...scale, domain: [start, end] };
		}
	}
	throw new TypeError(`[Chart] ${path}.viewport must match the scale's value type.`);
}

export function validateScaleNice(
	scale: ChartPositionDefinition['scale'],
	nice: boolean | number | undefined,
	path: string
): void {
	if (nice === undefined || (scale.type !== 'band' && scale.type !== 'point')) return;
	throw new TypeError(`[Chart] ${path}.nice is not supported by the "${scale.type}" scale.`);
}
