import { areaY, lineY } from '@tanstack/charts';
import { linearRegressionRowsY } from '@tanstack/charts/regression';
import {
	assertSingleNumericKind,
	groupAnalysisRows,
	readFiniteNumber,
	readNumericChartValue,
	resolveAnalysisPaint,
	restoreNumericChartValue,
	type AnalysisGroupAccessor
} from './chart.analysis.data.js';
import { compileChannel, type CompilableChartChannel } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { withoutTooltipPoints } from './chart.mark.js';
import type { ChartKey, ChartRegressionAnalysis, ChartValue } from './chart.props.js';

type RegressionDatum = {
	readonly identity: string;
	readonly group: ChartKey | null;
	readonly x: number | Date;
	readonly y: number;
	readonly lower?: number;
	readonly upper?: number;
};

type CompileRegressionAnalysisInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly analysis: ChartRegressionAnalysis;
	readonly x: CompilableChartChannel<TRow, ChartValue>;
	readonly y: CompilableChartChannel<TRow, ChartValue>;
	readonly group?: AnalysisGroupAccessor<TRow>;
	readonly path: string;
	readonly id: string;
};

export function compileRegressionAnalysis<TRow extends object>({
	data,
	analysis,
	x,
	y,
	group,
	path,
	id
}: CompileRegressionAnalysisInput<TRow>): readonly CompiledMark[] {
	validateRegressionAnalysis(analysis, path);
	const xAccessor = compileChannel(x);
	const yAccessor = compileChannel(y);
	const groupedRows = groupAnalysisRows(data, group, analysis.scope, path);
	const samples = analysis.samples ?? 64;
	const rows = groupedRows.groups.flatMap((sourceGroup) => {
		const observations = sourceGroup.rows.flatMap(({ row, index }) => {
			const context = { index, data };
			const xValue = readNumericChartValue(xAccessor(row, context), `${path}.x`);
			const yValue = readFiniteNumber(yAccessor(row, context), `${path}.y`);
			return xValue && yValue !== undefined ? [{ x: xValue, y: yValue }] : [];
		});
		if (observations.length === 0) return [];
		if (observations.length < 2) {
			throw new TypeError(`[Chart] ${path} requires at least two observations per scope.`);
		}
		const xKind = assertSingleNumericKind(
			observations.map((observation) => observation.x),
			`${path}.x`
		);
		if (!xKind) return [];
		if (observations.every((observation) => observation.x.numeric === observations[0]?.x.numeric)) {
			throw new TypeError(`[Chart] ${path} requires at least two distinct x values.`);
		}
		if (analysis.interval && observations.length < 3) {
			throw new TypeError(
				`[Chart] ${path}.interval requires at least three observations per scope.`
			);
		}
		const fittedRows = linearRegressionRowsY(observations, {
			x: (observation) => observation.x.numeric,
			y: 'y',
			ci: analysis.interval ? (analysis.interval.level ?? 0.95) : 0,
			samples
		});
		if (fittedRows.length === 0) {
			throw new TypeError(`[Chart] ${path} cannot compute a finite regression for this scope.`);
		}
		const prediction =
			analysis.interval?.type === 'prediction'
				? predictionLeverage(observations.map((observation) => observation.x.numeric))
				: undefined;
		return fittedRows.map((observation, index) => {
			let lower = observation.y1;
			let upper = observation.y2;
			if (prediction && lower !== undefined && upper !== undefined) {
				// A new observation adds residual variance to the fitted-mean interval.
				const multiplier = Math.sqrt(1 + 1 / prediction(observation.x));
				lower = observation.y - (observation.y - lower) * multiplier;
				upper = observation.y + (upper - observation.y) * multiplier;
				if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
					throw new TypeError(`[Chart] ${path}.interval cannot compute finite prediction bounds.`);
				}
			}
			return {
				identity: `${sourceGroup.identity}:${index}`,
				group: sourceGroup.key,
				x: restoreNumericChartValue(observation.x, xKind),
				y: observation.y,
				lower,
				upper
			} satisfies RegressionDatum;
		});
	});
	if (rows.length === 0) return [];
	const paint = resolveAnalysisPaint(analysis, groupedRows.isGrouped, 'primary');
	const channels = {
		z: paint.groupChannel,
		color: paint.colorChannel,
		key: 'identity' as const
	};
	const line = withoutTooltipPoints(
		lineY(rows, {
			...channels,
			id,
			x: 'x',
			y: 'y',
			stroke: paint.paint,
			strokeOpacity: analysis.strokeOpacity ?? 0.92,
			strokeWidth: analysis.strokeWidth ?? 2,
			strokeDasharray: analysis.strokeDasharray
		})
	);
	if (!analysis.interval) return [line];
	const band = withoutTooltipPoints(
		areaY(rows, {
			...channels,
			id: `${id}:interval`,
			x: 'x',
			y1: 'lower',
			y2: 'upper',
			fill: paint.paint,
			fillOpacity: analysis.interval.fillOpacity ?? 0.14
		})
	);
	return [band, line];
}

function validateRegressionAnalysis(analysis: ChartRegressionAnalysis, path: string): void {
	if (analysis.method !== undefined && analysis.method !== 'linear') {
		throw new TypeError(`[Chart] ${path}.method "${String(analysis.method)}" is not supported.`);
	}
	if (
		analysis.samples !== undefined &&
		(!Number.isInteger(analysis.samples) || analysis.samples < 2)
	) {
		throw new TypeError(`[Chart] ${path}.samples must be an integer greater than or equal to 2.`);
	}
	if (
		analysis.interval !== undefined &&
		analysis.interval.type !== 'confidence' &&
		analysis.interval.type !== 'prediction'
	) {
		throw new TypeError(
			`[Chart] ${path}.interval.type "${String(analysis.interval.type)}" is not supported.`
		);
	}
	if (
		analysis.interval?.level !== undefined &&
		analysis.interval.level !== 0.9 &&
		analysis.interval.level !== 0.95 &&
		analysis.interval.level !== 0.99
	) {
		throw new TypeError(`[Chart] ${path}.interval.level must be 0.9, 0.95, or 0.99.`);
	}
}

function predictionLeverage(values: readonly number[]): (value: number) => number {
	let meanX = 0;
	let sumSquaredX = 0;
	values.forEach((value, index) => {
		const delta = value - meanX;
		meanX += delta / (index + 1);
		sumSquaredX += delta * (value - meanX);
	});
	return (value) => 1 / values.length + (value - meanX) ** 2 / sumSquaredX;
}
