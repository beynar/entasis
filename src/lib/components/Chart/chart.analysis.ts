import { compileAnalysisGroupAccessor } from './chart.analysis.data.js';
import { compileReferenceAnalysis } from './chart.analysis.reference.js';
import { compileRegressionAnalysis } from './chart.analysis.regression.js';
import { compileRollingAnalysis } from './chart.analysis.rolling.js';
import type { CompiledMark } from './chart.cartesian.js';
import type { CompilableChartChannel } from './chart.channels.js';
import { isEmpiricalDistributionMark } from './chart.distribution.js';
import type {
	ChartBarMark,
	ChartChannel,
	ChartDistributionMark,
	ChartKey,
	ChartMark,
	ChartReferenceAnalysis,
	ChartScatterMark,
	ChartSeriesMark,
	ChartValue
} from './chart.props.js';

type AnalyzableMark<TRow extends object> =
	ChartSeriesMark<TRow> | ChartScatterMark<TRow> | ChartBarMark<TRow> | ChartDistributionMark<TRow>;

type CompileMarkAnalysisInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly mark: ChartMark<TRow>;
	readonly path: string;
	readonly fallbackSeries?: ChartChannel<TRow, ChartKey>;
};

export function compileMarkAnalysis<TRow extends object>({
	data,
	mark,
	path,
	fallbackSeries
}: CompileMarkAnalysisInput<TRow>): readonly CompiledMark[] {
	if (!isAnalyzableMark(mark) || mark.analysis === undefined) return [];
	if (!Array.isArray(mark.analysis) || mark.analysis.length === 0) {
		throw new TypeError(`[Chart] ${path}.analysis must contain at least one analysis.`);
	}
	if (mark.type === 'bar' && mark.variant === 'stack') {
		throw new TypeError(
			`[Chart] ${path}.analysis cannot be combined with ${path}.variant "stack" because the displayed values are transformed by the stack layout.`
		);
	}
	if (mark.type === 'series' && mark.layout !== undefined) {
		throw new TypeError(
			`[Chart] ${path}.analysis cannot be combined with ${path}.layout because the displayed values are transformed by the stack layout.`
		);
	}

	const group = compileAnalysisGroupAccessor(resolveAnalysisGroup(mark, fallbackSeries));
	const explicitIds = new Map<string, number>();
	return mark.analysis.flatMap((analysis, index) => {
		const analysisPath = `${path}.analysis[${index}]`;
		if (typeof analysis !== 'object' || analysis === null) {
			throw new TypeError(`[Chart] ${analysisPath} must be an analysis object.`);
		}
		if (analysis.id !== undefined) {
			const previousIndex = explicitIds.get(analysis.id);
			if (previousIndex !== undefined) {
				throw new TypeError(
					`[Chart] ${analysisPath}.id duplicates ${path}.analysis[${previousIndex}].id.`
				);
			}
			explicitIds.set(analysis.id, index);
		}
		const id = analysis.id ?? `${mark.id ?? path}:analysis:${index}:${analysis.type}`;
		switch (analysis.type) {
			case 'reference': {
				const reference = resolveReferenceChannel(mark, analysis, analysisPath);
				return compileReferenceAnalysis({
					data,
					analysis,
					value: reference.value,
					axis: reference.axis,
					group,
					path: analysisPath,
					id
				});
			}
			case 'regression':
				if (mark.type !== 'series' && mark.type !== 'scatter') {
					throw new TypeError(
						`[Chart] ${analysisPath}.type "regression" is supported only by series and scatter marks.`
					);
				}
				if (mark.type === 'series' && mark.direction === 'horizontal') {
					throw new TypeError(
						`[Chart] ${analysisPath}.type "regression" does not support a horizontal series.`
					);
				}
				return compileRegressionAnalysis({
					data,
					analysis,
					x: mark.x,
					y: mark.y,
					group,
					path: analysisPath,
					id
				});
			case 'rolling':
				if (mark.type !== 'series') {
					throw new TypeError(
						`[Chart] ${analysisPath}.type "rolling" is supported only by series marks.`
					);
				}
				if (mark.direction === 'horizontal') {
					throw new TypeError(
						`[Chart] ${analysisPath}.type "rolling" does not support a horizontal series.`
					);
				}
				return compileRollingAnalysis({
					data,
					analysis,
					x: mark.x,
					y: mark.y,
					group,
					path: analysisPath,
					id
				});
			default:
				throw new TypeError(
					`[Chart] ${analysisPath}.type "${String(Reflect.get(analysis, 'type'))}" is not supported.`
				);
		}
	});
}

function isAnalyzableMark<TRow extends object>(
	mark: ChartMark<TRow>
): mark is AnalyzableMark<TRow> {
	return (
		mark.type === 'series' ||
		mark.type === 'scatter' ||
		mark.type === 'bar' ||
		mark.type === 'distribution'
	);
}

function resolveAnalysisGroup<TRow extends object>(
	mark: AnalyzableMark<TRow>,
	fallbackSeries: ChartChannel<TRow, ChartKey> | undefined
): CompilableChartChannel<TRow, ChartKey> | undefined {
	if (mark.type === 'distribution') return mark.group;
	if (mark.type === 'scatter' && mark.variant === 'hexbin') return fallbackSeries;
	return mark.series ?? mark.colorBy ?? fallbackSeries;
}

function resolveReferenceChannel<TRow extends object>(
	mark: AnalyzableMark<TRow>,
	analysis: ChartReferenceAnalysis | { type: 'reference' },
	path: string
): { value: CompilableChartChannel<TRow, ChartValue>; axis: 'x' | 'y' } {
	if (mark.type === 'distribution') {
		const direction = mark.direction ?? 'vertical';
		const valueAxis = isEmpiricalDistributionMark(mark)
			? direction === 'vertical'
				? 'x'
				: 'y'
			: direction === 'vertical'
				? 'y'
				: 'x';
		return { value: mark.value, axis: valueAxis };
	}
	const requestedAxis = 'axis' in analysis ? analysis.axis : undefined;
	if (requestedAxis !== undefined && requestedAxis !== 'x' && requestedAxis !== 'y') {
		throw new TypeError(`[Chart] ${path}.axis "${String(requestedAxis)}" is not supported.`);
	}
	let defaultAxis: 'x' | 'y' = 'y';
	if (mark.type === 'series' || mark.type === 'bar') {
		defaultAxis = (mark.direction ?? 'vertical') === 'vertical' ? 'y' : 'x';
	}
	const axis = requestedAxis ?? defaultAxis;
	return axis === 'x' ? { value: mark.x, axis } : { value: mark.y, axis };
}
