import {
	barX,
	barY,
	dot,
	link,
	tickX,
	tickY,
	type ChartMark as TanStackMark,
	type ChartValue as TanStackValue,
	type SceneNode
} from '@tanstack/charts';
import { bin } from 'd3-array';
import { area, curveBasis } from 'd3-shape';
import type { CompiledMark } from './chart.cartesian.js';
import type {
	DistributionSummary,
	NormalizedSummaryDistributionVariant
} from './chart.distribution.js';
import type { ChartKey } from './chart.props.js';
import { withoutTooltipPoints } from './chart.mark.js';

type DistributionOutlier = {
	readonly identity: string;
	readonly group: ChartKey;
	readonly value: number;
};

type DensityPoint = {
	readonly value: number;
	readonly density: number;
};

type ScreenDensityPoint = {
	readonly position: number;
	readonly low: number;
	readonly high: number;
};

type CompileDistributionMarksInput = {
	readonly summaries: readonly DistributionSummary[];
	readonly variant: NormalizedSummaryDistributionVariant;
	readonly direction: 'vertical' | 'horizontal';
	readonly baseId: string;
	readonly color?: string;
	readonly domain?: readonly [number, number];
};

const verticalArea = area<ScreenDensityPoint>()
	.x0((point) => point.low)
	.x1((point) => point.high)
	.y((point) => point.position)
	.curve(curveBasis);

const horizontalArea = area<ScreenDensityPoint>()
	.x((point) => point.position)
	.y0((point) => point.low)
	.y1((point) => point.high)
	.curve(curveBasis);

export function compileDistributionMarks({
	summaries,
	variant,
	direction,
	baseId,
	color,
	domain
}: CompileDistributionMarksInput): readonly CompiledMark[] {
	if (variant.type === 'violin') {
		return compileViolinMarks(summaries, variant, direction, baseId, color, domain);
	}
	if (variant.type === 'box') {
		return compileBoxMarks(summaries, variant, direction, baseId, color);
	}
	return compileErrorBarMarks(summaries, direction, baseId, color);
}

function compileViolinMarks(
	summaries: readonly DistributionSummary[],
	variant: Extract<NormalizedSummaryDistributionVariant, { type: 'violin' }>,
	direction: 'vertical' | 'horizontal',
	baseId: string,
	color: string | undefined,
	domain: readonly [number, number] | undefined
): readonly CompiledMark[] {
	const densities = violinDensities(summaries, variant.bins, domain);
	const violin = violinMark(
		summaries,
		densities,
		direction,
		`${baseId}:violin`,
		color,
		variant.showMedian
	);
	const anchor = summaryAnchor(
		summaries,
		direction,
		`${baseId}:summary`,
		color,
		variant.showMedian ? 3.5 : 0,
		(summary) => summary.median
	);
	return [violin, anchor];
}

function compileBoxMarks(
	summaries: readonly DistributionSummary[],
	variant: Extract<NormalizedSummaryDistributionVariant, { type: 'box' }>,
	direction: 'vertical' | 'horizontal',
	baseId: string,
	color: string | undefined
): readonly CompiledMark[] {
	const outliers: DistributionOutlier[] = variant.showOutliers
		? summaries.flatMap((summary) =>
				summary.values
					.filter((value) => value < summary.low || value > summary.high)
					.map((value, index) => ({
						identity: `${summary.identity}:outlier:${index}`,
						group: summary.group,
						value
					}))
			)
		: [];
	const common = { z: 'group', color: 'group', key: 'identity' } as const;
	const stroke = color;
	const body =
		direction === 'vertical'
			? barY(summaries, {
					...common,
					id: `${baseId}:box`,
					x: 'group',
					y1: 'q1',
					y2: 'q3',
					fill: color,
					fillOpacity: 0.24,
					inset: 12,
					radius: 3
				})
			: barX(summaries, {
					...common,
					id: `${baseId}:box`,
					x1: 'q1',
					x2: 'q3',
					y: 'group',
					fill: color,
					fillOpacity: 0.24,
					inset: 12,
					radius: 3
				});
	const whisker =
		direction === 'vertical'
			? link(summaries, {
					...common,
					id: `${baseId}:whisker`,
					x1: 'group',
					x2: 'group',
					y1: 'low',
					y2: 'high',
					stroke,
					strokeWidth: 1.5
				})
			: link(summaries, {
					...common,
					id: `${baseId}:whisker`,
					x1: 'low',
					x2: 'high',
					y1: 'group',
					y2: 'group',
					stroke,
					strokeWidth: 1.5
				});
	const caps = boxTicks(summaries, direction, `${baseId}:caps`, color, ['low', 'high'], 16, 1.5);
	const median = boxTicks(summaries, direction, `${baseId}:median`, color, ['median'], 28, 2.25);
	const outlierMark =
		direction === 'vertical'
			? dot(outliers, {
					...common,
					id: `${baseId}:outliers`,
					x: 'group',
					y: 'value',
					r: 2.5,
					fill: color,
					fillOpacity: 0.82
				})
			: dot(outliers, {
					...common,
					id: `${baseId}:outliers`,
					x: 'value',
					y: 'group',
					r: 2.5,
					fill: color,
					fillOpacity: 0.82
				});
	const anchor = summaryAnchor(
		summaries,
		direction,
		`${baseId}:summary`,
		color,
		0,
		(summary) => summary.median
	);
	return [
		withoutTooltipPoints(whisker),
		withoutTooltipPoints(body),
		...caps.map(withoutTooltipPoints),
		...median.map(withoutTooltipPoints),
		withoutTooltipPoints(outlierMark),
		anchor
	];
}

function compileErrorBarMarks(
	summaries: readonly DistributionSummary[],
	direction: 'vertical' | 'horizontal',
	baseId: string,
	color: string | undefined
): readonly CompiledMark[] {
	const common = { z: 'group', color: 'group', key: 'identity' } as const;
	const intervalSummaries = summaries.filter((summary) => summary.count > 1);
	const interval =
		direction === 'vertical'
			? link(intervalSummaries, {
					...common,
					id: `${baseId}:interval`,
					x1: 'group',
					x2: 'group',
					y1: 'low',
					y2: 'high',
					stroke: color,
					strokeWidth: 1.75
				})
			: link(intervalSummaries, {
					...common,
					id: `${baseId}:interval`,
					x1: 'low',
					x2: 'high',
					y1: 'group',
					y2: 'group',
					stroke: color,
					strokeWidth: 1.75
				});
	const caps = boxTicks(
		intervalSummaries,
		direction,
		`${baseId}:caps`,
		color,
		['low', 'high'],
		16,
		1.75
	);
	const anchor = summaryAnchor(
		summaries,
		direction,
		`${baseId}:summary`,
		color,
		3.5,
		(summary) => summary.mean
	);
	return [withoutTooltipPoints(interval), ...caps.map(withoutTooltipPoints), anchor];
}

function boxTicks(
	summaries: readonly DistributionSummary[],
	direction: 'vertical' | 'horizontal',
	baseId: string,
	color: string | undefined,
	fields: readonly ('low' | 'high' | 'median')[],
	length: number,
	strokeWidth: number
): readonly TanStackMark<DistributionSummary, TanStackValue, TanStackValue>[] {
	const common = { z: 'group', color: 'group', key: 'identity' } as const;
	return fields.map((field) =>
		direction === 'vertical'
			? tickY(summaries, {
					...common,
					id: `${baseId}:${field}`,
					x: 'group',
					y: field,
					stroke: color,
					length,
					strokeWidth
				})
			: tickX(summaries, {
					...common,
					id: `${baseId}:${field}`,
					x: field,
					y: 'group',
					stroke: color,
					length,
					strokeWidth
				})
	);
}

function summaryAnchor(
	summaries: readonly DistributionSummary[],
	direction: 'vertical' | 'horizontal',
	id: string,
	color: string | undefined,
	radius: number,
	center: (summary: DistributionSummary) => number
): TanStackMark<DistributionSummary, TanStackValue, TanStackValue> {
	const options = {
		id,
		z: 'group',
		color: 'group',
		key: 'identity',
		r: radius,
		fill: color
	} as const;
	return direction === 'vertical'
		? dot(summaries, { ...options, x: 'group', y: center })
		: dot(summaries, { ...options, x: center, y: 'group' });
}

function violinDensities(
	summaries: readonly DistributionSummary[],
	binCount: number,
	domain: readonly [number, number] | undefined
): ReadonlyMap<string, readonly DensityPoint[]> {
	const allValues = summaries.flatMap((summary) => summary.values);
	const minimum = domain?.[0] ?? Math.min(...allValues);
	const maximum = domain?.[1] ?? Math.max(...allValues);
	if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum === maximum) {
		return new Map();
	}
	const step = (maximum - minimum) / binCount;
	const thresholds = Array.from(
		{ length: binCount - 1 },
		(_value, index) => minimum + step * (index + 1)
	);
	const createBins = bin<number, number>().domain([minimum, maximum]).thresholds(thresholds);
	return new Map<string, readonly DensityPoint[]>(
		summaries.map((summary): readonly [string, readonly DensityPoint[]] => {
			if (summary.values.length < 2) return [summary.identity, []] as const;
			const bins = createBins(summary.values);
			const maximumCount = Math.max(...bins.map((bucket) => bucket.length), 1);
			return [
				summary.identity,
				bins.flatMap((bucket) =>
					bucket.x0 === undefined || bucket.x1 === undefined
						? []
						: [{ value: (bucket.x0 + bucket.x1) / 2, density: bucket.length / maximumCount }]
				)
			] as const;
		})
	);
}

function violinMark(
	summaries: readonly DistributionSummary[],
	densities: ReadonlyMap<string, readonly DensityPoint[]>,
	direction: 'vertical' | 'horizontal',
	id: string,
	color: string | undefined,
	showMedian: boolean
): TanStackMark<DistributionSummary, TanStackValue, TanStackValue> {
	return {
		initialize() {
			return {
				id,
				channels: {
					x: {
						scale: 'x',
						values:
							direction === 'vertical'
								? summaries.map((summary) => summary.group)
								: summaries.flatMap((summary) => summary.values)
					},
					y: {
						scale: 'y',
						values:
							direction === 'vertical'
								? summaries.flatMap((summary) => summary.values)
								: summaries.map((summary) => summary.group)
					},
					color: { scale: 'color', values: summaries.map((summary) => summary.group) }
				},
				render({ scales, color: resolveColor }) {
					const groupScale = direction === 'vertical' ? scales.x : scales.y;
					const valueScale = direction === 'vertical' ? scales.y : scales.x;
					const halfWidth = groupScale.bandwidth * 0.4;
					const children: SceneNode[] = [];
					for (const summary of summaries) {
						const density = densities.get(summary.identity);
						if (!density?.length) continue;
						const center = groupScale.map(summary.group);
						const screenPoints = density.map((point) => ({
							position: valueScale.map(point.value),
							low: center - halfWidth * point.density,
							high: center + halfWidth * point.density
						}));
						const fill = color ?? resolveColor(summary.group);
						const right = screenPoints.map((point) =>
							direction === 'vertical'
								? ([point.high, point.position] as const)
								: ([point.position, point.high] as const)
						);
						const left = screenPoints
							.toReversed()
							.map((point) =>
								direction === 'vertical'
									? ([point.low, point.position] as const)
									: ([point.position, point.low] as const)
							);
						children.push({
							kind: 'area',
							key: `${id}:${summary.identity}:area`,
							className: 'ts-chart__distribution-violin-area',
							points: [...right, ...left],
							path:
								direction === 'vertical'
									? (verticalArea(screenPoints) ?? undefined)
									: (horizontalArea(screenPoints) ?? undefined),
							style: { fill, fillOpacity: 0.42, stroke: fill, strokeWidth: 1.5 }
						});
						if (!showMedian) continue;
						const median = valueScale.map(summary.median);
						children.push({
							kind: 'rule',
							key: `${id}:${summary.identity}:median`,
							className: 'ts-chart__distribution-median',
							x1: direction === 'vertical' ? center - halfWidth * 0.45 : median,
							x2: direction === 'vertical' ? center + halfWidth * 0.45 : median,
							y1: direction === 'vertical' ? median : center - halfWidth * 0.45,
							y2: direction === 'vertical' ? median : center + halfWidth * 0.45,
							style: { stroke: fill, strokeWidth: 2 }
						});
					}
					return {
						nodes: [
							{
								kind: 'group',
								key: id,
								className: 'ts-chart__distribution ts-chart__distribution--violin',
								ariaHidden: true,
								children
							}
						]
					};
				}
			};
		}
	};
}
