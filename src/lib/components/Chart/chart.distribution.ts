import { deviation, mean, quantileSorted } from 'd3-array';
import type { CompiledMark } from './chart.cartesian.js';
import { chartKeyIdentity, type CompiledChartChannel } from './chart.channels.js';
import { compileEmpiricalDistribution } from './chart.distribution.empirical.js';
import { compileDistributionMarks } from './chart.distribution.render.js';
import type { ChartDistributionInterval, ChartDistributionMark, ChartKey } from './chart.props.js';

type DistributionAccessor<TRow, TValue> = CompiledChartChannel<TRow, TValue>;

export type NormalizedSummaryDistributionVariant =
	| { type: 'violin'; bins: number; showMedian: boolean }
	| { type: 'box'; whiskers: 'tukey' | 'min-max'; showOutliers: boolean }
	| { type: 'error-bar'; interval: ChartDistributionInterval };

export type NormalizedEmpiricalDistributionVariant =
	| { type: 'histogram'; bins: number }
	| { type: 'density'; bandwidth?: number; samples: number }
	| { type: 'ecdf' };

export type NormalizedDistributionVariant =
	NormalizedSummaryDistributionVariant | NormalizedEmpiricalDistributionVariant;

export type DistributionSummary = {
	readonly __entasisDistribution: true;
	readonly __entasisSourceRows: readonly object[];
	readonly identity: string;
	readonly group: ChartKey;
	readonly count: number;
	readonly direction: 'vertical' | 'horizontal';
	readonly variant: NormalizedDistributionVariant['type'];
	readonly values: readonly number[];
	readonly mean: number;
	readonly median: number;
	readonly q1: number;
	readonly q3: number;
	readonly low: number;
	readonly high: number;
	readonly intervalLabel?: string;
};

export type CompiledDistribution = {
	readonly marks: readonly CompiledMark[];
	readonly variant: NormalizedDistributionVariant['type'];
	readonly direction: 'vertical' | 'horizontal';
};

type CompileDistributionInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly mark: ChartDistributionMark<TRow>;
	readonly path: string;
	readonly group: DistributionAccessor<TRow, ChartKey>;
	readonly value: DistributionAccessor<TRow, number>;
	readonly color?: string;
	readonly domain?: readonly [number, number];
};

const CONFIDENCE_MULTIPLIERS = {
	0.9: 1.6448536269514722,
	0.95: 1.959963984540054,
	0.99: 2.5758293035489004
} as const;

export function compileDistribution<TRow extends object>({
	data,
	mark,
	path,
	group,
	value,
	color,
	domain
}: CompileDistributionInput<TRow>): CompiledDistribution {
	const variant = normalizeVariant(mark, path);
	const direction = mark.direction ?? 'vertical';
	const summaries = summarizeDistribution(data, group, value, variant, direction);
	const marks = isEmpiricalDistributionVariant(variant)
		? compileEmpiricalDistribution({
				summaries,
				variant,
				direction,
				baseId: mark.id ?? path,
				color,
				domain
			})
		: compileDistributionMarks({
				summaries,
				variant,
				direction,
				baseId: mark.id ?? path,
				color,
				domain
			});
	return { marks, variant: variant.type, direction };
}

export function isEmpiricalDistributionMark<TRow>(mark: ChartDistributionMark<TRow>): boolean {
	const type = typeof mark.variant === 'string' ? mark.variant : mark.variant.type;
	return type === 'histogram' || type === 'density' || type === 'ecdf';
}

export function isDistributionSummary(value: unknown): value is DistributionSummary {
	return (
		typeof value === 'object' &&
		value !== null &&
		Reflect.get(value, '__entasisDistribution') === true
	);
}

function normalizeVariant<TRow>(
	mark: ChartDistributionMark<TRow>,
	path: string
): NormalizedDistributionVariant {
	const input = mark.variant;
	const type = typeof input === 'string' ? input : input.type;
	if (type === 'violin') {
		const options = typeof input === 'object' && input.type === 'violin' ? input : undefined;
		const bins = options?.bins ?? 16;
		if (!Number.isInteger(bins) || bins < 4) {
			throw new TypeError(
				`[Chart] ${path}.variant.bins must be an integer greater than or equal to 4.`
			);
		}
		return { type: 'violin', bins, showMedian: options?.showMedian ?? true };
	}
	if (type === 'box') {
		const options = typeof input === 'object' && input.type === 'box' ? input : undefined;
		return {
			type: 'box',
			whiskers: options?.whiskers ?? 'tukey',
			showOutliers: options?.showOutliers ?? true
		};
	}
	if (type === 'error-bar') {
		const options = typeof input === 'object' && input.type === 'error-bar' ? input : undefined;
		const interval = options?.interval ?? { type: 'confidence', level: 0.95 };
		validateInterval(interval, `${path}.variant.interval`);
		return { type: 'error-bar', interval };
	}
	if (type === 'histogram') {
		const options = typeof input === 'object' && input.type === 'histogram' ? input : undefined;
		const bins = options?.bins ?? 16;
		if (!Number.isInteger(bins) || bins < 2) {
			throw new TypeError(
				`[Chart] ${path}.variant.bins must be an integer greater than or equal to 2.`
			);
		}
		return { type: 'histogram', bins };
	}
	if (type === 'density') {
		const options = typeof input === 'object' && input.type === 'density' ? input : undefined;
		if (
			options?.bandwidth !== undefined &&
			(!Number.isFinite(options.bandwidth) || options.bandwidth <= 0)
		) {
			throw new TypeError(
				`[Chart] ${path}.variant.bandwidth must be a finite number greater than 0.`
			);
		}
		const samples = options?.samples ?? 64;
		if (!Number.isInteger(samples) || samples < 16) {
			throw new TypeError(
				`[Chart] ${path}.variant.samples must be an integer greater than or equal to 16.`
			);
		}
		return { type: 'density', bandwidth: options?.bandwidth, samples };
	}
	if (type === 'ecdf') return { type: 'ecdf' };
	throw new TypeError(`[Chart] ${path}.variant.type "${String(type)}" is not supported.`);
}

function isEmpiricalDistributionVariant(
	variant: NormalizedDistributionVariant
): variant is NormalizedEmpiricalDistributionVariant {
	return variant.type === 'histogram' || variant.type === 'density' || variant.type === 'ecdf';
}

function validateInterval(interval: ChartDistributionInterval, path: string): void {
	if (interval.type === 'confidence') {
		const level = interval.level ?? 0.95;
		if (!(level in CONFIDENCE_MULTIPLIERS)) {
			throw new TypeError(`[Chart] ${path}.level must be 0.9, 0.95, or 0.99.`);
		}
		return;
	}
	const multiplier = interval.multiplier ?? 1;
	if (!Number.isFinite(multiplier) || multiplier <= 0) {
		throw new TypeError(`[Chart] ${path}.multiplier must be a finite number greater than 0.`);
	}
}

function summarizeDistribution<TRow extends object>(
	data: readonly TRow[],
	groupAccessor: DistributionAccessor<TRow, ChartKey>,
	valueAccessor: DistributionAccessor<TRow, number>,
	variant: NormalizedDistributionVariant,
	direction: 'vertical' | 'horizontal'
): readonly DistributionSummary[] {
	const groups = new Map<string, { group: ChartKey; values: number[]; rows: TRow[] }>();
	data.forEach((row, index) => {
		const context = { index, data };
		const group = groupAccessor(row, context);
		const value = valueAccessor(row, context);
		if ((typeof group !== 'string' && typeof group !== 'number') || !Number.isFinite(value)) return;
		const identity = chartKeyIdentity(group);
		const entry = groups.get(identity);
		if (entry) {
			entry.values.push(value as number);
			entry.rows.push(row);
		} else groups.set(identity, { group, values: [value as number], rows: [row] });
	});

	return [...groups].map(([identity, entry]) => {
		const values = entry.values.toSorted((left, right) => left - right);
		const q1 = quantileSorted(values, 0.25) ?? values[0];
		const median = quantileSorted(values, 0.5) ?? values[0];
		const q3 = quantileSorted(values, 0.75) ?? values[0];
		const average = mean(values) ?? values[0];
		if (q1 === undefined || median === undefined || q3 === undefined || average === undefined) {
			throw new Error('[Chart] Distribution summary received an empty internal group.');
		}
		const range = distributionRange(values, q1, q3, average, variant);
		return {
			__entasisDistribution: true,
			__entasisSourceRows: entry.rows,
			identity,
			group: entry.group,
			count: values.length,
			direction,
			variant: variant.type,
			values,
			mean: average,
			median,
			q1,
			q3,
			...range
		};
	});
}

function distributionRange(
	values: readonly number[],
	q1: number,
	q3: number,
	average: number,
	variant: NormalizedDistributionVariant
): { low: number; high: number; intervalLabel?: string } {
	if (variant.type === 'box') {
		if (variant.whiskers === 'min-max') {
			return { low: values[0] ?? q1, high: values.at(-1) ?? q3 };
		}
		const interquartileRange = q3 - q1;
		const lowerFence = q1 - interquartileRange * 1.5;
		const upperFence = q3 + interquartileRange * 1.5;
		return {
			low: values.find((value) => value >= lowerFence) ?? q1,
			high: values.findLast((value) => value <= upperFence) ?? q3
		};
	}
	if (variant.type !== 'error-bar') {
		return { low: values[0] ?? average, high: values.at(-1) ?? average };
	}
	const sampleDeviation = deviation(values);
	if (sampleDeviation === undefined) {
		return { low: average, high: average, intervalLabel: 'Interval unavailable' };
	}
	if (variant.interval.type === 'standard-deviation') {
		const multiplier = variant.interval.multiplier ?? 1;
		return {
			low: average - sampleDeviation * multiplier,
			high: average + sampleDeviation * multiplier,
			intervalLabel: `${multiplier} standard deviation${multiplier === 1 ? '' : 's'}`
		};
	}
	const standardError = sampleDeviation / Math.sqrt(values.length);
	if (variant.interval.type === 'standard-error') {
		const multiplier = variant.interval.multiplier ?? 1;
		return {
			low: average - standardError * multiplier,
			high: average + standardError * multiplier,
			intervalLabel: `${multiplier} standard error${multiplier === 1 ? '' : 's'}`
		};
	}
	const level = variant.interval.level ?? 0.95;
	const margin = standardError * CONFIDENCE_MULTIPLIERS[level];
	return {
		low: average - margin,
		high: average + margin,
		intervalLabel: `${Math.round(level * 100)}% normal confidence interval`
	};
}
