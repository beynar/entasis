import { areaX, areaY, d3AreaXCurve, d3Curve, lineY, rect } from '@tanstack/charts';
import { binX } from '@tanstack/charts/transform/bin';
import { deviation } from 'd3-array';
import { curveBasis, curveStepAfter, curveStepBefore } from 'd3-shape';
import type { CompiledMark } from './chart.cartesian.js';
import type {
	DistributionSummary,
	NormalizedEmpiricalDistributionVariant
} from './chart.distribution.js';
import type { ChartKey } from './chart.props.js';
import { withoutTooltipPoints } from './chart.mark.js';

export type DistributionEmpiricalDatum = {
	readonly __entasisDistributionEmpirical: true;
	readonly __entasisSourceRows: readonly object[];
	readonly identity: string;
	readonly group: ChartKey;
	readonly variant: NormalizedEmpiricalDistributionVariant['type'];
	readonly direction: 'vertical' | 'horizontal';
	readonly value: number;
	readonly statistic: number;
	readonly count: number;
	readonly lower?: number;
	readonly upper?: number;
};

type CompileEmpiricalDistributionInput = {
	readonly summaries: readonly DistributionSummary[];
	readonly variant: NormalizedEmpiricalDistributionVariant;
	readonly direction: 'vertical' | 'horizontal';
	readonly baseId: string;
	readonly color?: string;
	readonly domain?: readonly [number, number];
};

export function compileEmpiricalDistribution({
	summaries,
	variant,
	direction,
	baseId,
	color,
	domain
}: CompileEmpiricalDistributionInput): readonly CompiledMark[] {
	const valueDomain = resolveValueDomain(summaries, domain);
	if (variant.type === 'histogram') {
		return [compileHistogram(summaries, variant.bins, direction, baseId, color, valueDomain)];
	}
	const empiricalRows =
		variant.type === 'density'
			? densityRows(summaries, variant.bandwidth, variant.samples, direction, valueDomain)
			: ecdfRows(summaries, direction);
	return compileEmpiricalCurve(empiricalRows, variant.type, direction, baseId, color);
}

function compileHistogram(
	summaries: readonly DistributionSummary[],
	binCount: number,
	direction: 'vertical' | 'horizontal',
	id: string,
	color: string | undefined,
	domain: readonly [number, number]
): CompiledMark {
	const rows = histogramRows(summaries, binCount, direction, domain);
	const common = {
		id: `${id}:histogram`,
		z: 'group',
		color: 'group',
		key: 'identity',
		fill: color,
		fillOpacity: 0.34,
		inset: 0.75,
		radius: 1.5
	} as const;
	return direction === 'vertical'
		? rect(rows, {
				...common,
				x: 'value',
				x1: 'lower',
				x2: 'upper',
				y1: () => 0,
				y2: 'statistic'
			})
		: rect(rows, {
				...common,
				x1: () => 0,
				x2: 'statistic',
				y: 'value',
				y1: 'lower',
				y2: 'upper'
			});
}

function compileEmpiricalCurve(
	rows: readonly DistributionEmpiricalDatum[],
	variant: 'density' | 'ecdf',
	direction: 'vertical' | 'horizontal',
	baseId: string,
	color: string | undefined
): readonly CompiledMark[] {
	const curve =
		variant === 'density'
			? d3Curve(curveBasis)
			: d3Curve(direction === 'vertical' ? curveStepAfter : curveStepBefore);
	const common = {
		z: 'group',
		color: 'group',
		key: 'identity'
	} as const;
	const line =
		direction === 'vertical'
			? lineY(rows, {
					...common,
					id: `${baseId}:${variant}:line`,
					x: 'value',
					y: 'statistic',
					stroke: color,
					strokeWidth: 2,
					curve
				})
			: lineY(rows, {
					...common,
					id: `${baseId}:${variant}:line`,
					x: 'statistic',
					y: 'value',
					stroke: color,
					strokeWidth: 2,
					curve
				});
	if (variant === 'ecdf') return [line];
	const densityArea =
		direction === 'vertical'
			? areaY(rows, {
					...common,
					id: `${baseId}:density:area`,
					x: 'value',
					y1: 0,
					y2: 'statistic',
					fill: color,
					fillOpacity: 0.16,
					curve: d3Curve(curveBasis)
				})
			: areaX(rows, {
					...common,
					id: `${baseId}:density:area`,
					x1: 0,
					x2: 'statistic',
					y: 'value',
					fill: color,
					fillOpacity: 0.16,
					curve: d3AreaXCurve(curveBasis)
				});
	return [withoutTooltipPoints(densityArea), line];
}

function histogramRows(
	summaries: readonly DistributionSummary[],
	binCount: number,
	direction: 'vertical' | 'horizontal',
	[minimum, maximum]: readonly [number, number]
): readonly DistributionEmpiricalDatum[] {
	const step = (maximum - minimum) / binCount;
	const boundaries = Array.from({ length: binCount + 1 }, (_value, index) =>
		index === binCount ? maximum : minimum + step * index
	);
	return summaries.flatMap((summary) =>
		binX(summary.values, { value: (value) => value, thresholds: boundaries }).map((bin, index) =>
			empiricalDatum(summary, 'histogram', direction, bin.x, bin.value, index, {
				lower: bin.x1,
				upper: bin.x2,
				count: bin.value
			})
		)
	);
}

function densityRows(
	summaries: readonly DistributionSummary[],
	configuredBandwidth: number | undefined,
	sampleCount: number,
	direction: 'vertical' | 'horizontal',
	[minimum, maximum]: readonly [number, number]
): readonly DistributionEmpiricalDatum[] {
	const step = (maximum - minimum) / (sampleCount - 1);
	return summaries.flatMap((summary) => {
		const bandwidth = configuredBandwidth ?? inferBandwidth(summary.values, maximum - minimum);
		return Array.from({ length: sampleCount }, (_value, index) => {
			const value = minimum + step * index;
			const statistic = gaussianDensity(summary.values, value, bandwidth);
			return empiricalDatum(summary, 'density', direction, value, statistic, index);
		});
	});
}

function ecdfRows(
	summaries: readonly DistributionSummary[],
	direction: 'vertical' | 'horizontal'
): readonly DistributionEmpiricalDatum[] {
	const values = [...new Set(summaries.flatMap((summary) => summary.values))].toSorted(
		(left, right) => left - right
	);
	return summaries.flatMap((summary) =>
		values.map((value, index) => {
			const count = summary.values.filter((candidate) => candidate <= value).length;
			return empiricalDatum(summary, 'ecdf', direction, value, count / summary.count, index, {
				count
			});
		})
	);
}

function empiricalDatum(
	summary: DistributionSummary,
	variant: DistributionEmpiricalDatum['variant'],
	direction: 'vertical' | 'horizontal',
	value: number,
	statistic: number,
	index: number,
	fields: Pick<DistributionEmpiricalDatum, 'count'> &
		Partial<Pick<DistributionEmpiricalDatum, 'lower' | 'upper'>> = { count: summary.count }
): DistributionEmpiricalDatum {
	return {
		__entasisDistributionEmpirical: true,
		__entasisSourceRows: summary.__entasisSourceRows,
		identity: `${summary.identity}:${variant}:${index}`,
		group: summary.group,
		variant,
		direction,
		value,
		statistic,
		...fields
	};
}

function gaussianDensity(values: readonly number[], position: number, bandwidth: number): number {
	const denominator = values.length * bandwidth * Math.sqrt(2 * Math.PI);
	return (
		values.reduce((total, value) => {
			const distance = (position - value) / bandwidth;
			return total + Math.exp(-0.5 * distance * distance);
		}, 0) / denominator
	);
}

function inferBandwidth(values: readonly number[], domainWidth: number): number {
	const sampleDeviation = deviation(values);
	const silverman =
		sampleDeviation === undefined ? 0 : 1.06 * sampleDeviation * values.length ** -0.2;
	if (Number.isFinite(silverman) && silverman > 0) return silverman;
	return Math.max(domainWidth / 20, Number.EPSILON);
}

function resolveValueDomain(
	summaries: readonly DistributionSummary[],
	domain: readonly [number, number] | undefined
): readonly [number, number] {
	if (domain) return domain;
	const values = summaries.flatMap((summary) => summary.values);
	const minimum = Math.min(...values);
	const maximum = Math.max(...values);
	if (!Number.isFinite(minimum) || !Number.isFinite(maximum)) return [0, 1];
	if (minimum !== maximum) return [minimum, maximum];
	return [minimum - 0.5, maximum + 0.5];
}
