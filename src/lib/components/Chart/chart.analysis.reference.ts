import {
	ruleX,
	ruleY,
	type ChartPoint,
	type MarkRenderContext,
	type SceneNode
} from '@tanstack/charts';
import { deviation, mean, median, quantileSorted } from 'd3-array';
import {
	assertSingleNumericKind,
	groupAnalysisRows,
	readNumericChartValue,
	resolveAnalysisPaint,
	restoreNumericChartValue,
	type AnalysisGroupAccessor
} from './chart.analysis.data.js';
import { compileChannel, type CompilableChartChannel } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { withoutTooltipPoints } from './chart.mark.js';
import type {
	ChartDistributionReferenceAnalysis,
	ChartKey,
	ChartReferenceAnalysis,
	ChartValue
} from './chart.props.js';

type ReferenceAnalysis = ChartReferenceAnalysis | ChartDistributionReferenceAnalysis;

type ReferenceDatum = {
	readonly identity: string;
	readonly group: ChartKey | null;
	readonly value: number | Date;
	readonly lower?: number | Date;
	readonly upper?: number | Date;
};

type CompileReferenceAnalysisInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly analysis: ReferenceAnalysis;
	readonly value: CompilableChartChannel<TRow, ChartValue>;
	readonly axis: 'x' | 'y';
	readonly group?: AnalysisGroupAccessor<TRow>;
	readonly path: string;
	readonly id: string;
};

export function compileReferenceAnalysis<TRow extends object>({
	data,
	analysis,
	value,
	axis,
	group,
	path,
	id
}: CompileReferenceAnalysisInput<TRow>): readonly CompiledMark[] {
	validateReferenceAnalysis(analysis, path);
	const valueAccessor = compileChannel(value);
	const groupedRows = groupAnalysisRows(data, group, analysis.scope, path);
	const rows = groupedRows.groups.flatMap((sourceGroup) => {
		const values = sourceGroup.rows.flatMap(({ row, index }) => {
			const numeric = readNumericChartValue(valueAccessor(row, { index, data }), `${path}.axis`);
			return numeric ? [numeric] : [];
		});
		const kind = assertSingleNumericKind(values, `${path}.axis`);
		if (!kind || values.length === 0) return [];
		const sorted = values.map((entry) => entry.numeric).toSorted((left, right) => left - right);
		const statistic = referenceStatistic(sorted, analysis);
		if (statistic === undefined) return [];
		const datum: ReferenceDatum = {
			identity: `${sourceGroup.identity}:reference`,
			group: sourceGroup.key,
			value: restoreNumericChartValue(statistic.value, kind),
			lower:
				statistic.lower === undefined ? undefined : restoreNumericChartValue(statistic.lower, kind),
			upper:
				statistic.upper === undefined ? undefined : restoreNumericChartValue(statistic.upper, kind)
		};
		return [datum];
	});
	if (rows.length === 0) return [];
	const paint = resolveAnalysisPaint(analysis, groupedRows.isGrouped, 'neutral');
	const line = compileReferenceLine(rows, axis, id, analysis, paint);
	if (analysis.statistic !== 'standard-deviation') return [line];
	return [compileReferenceBand(rows, axis, `${id}:band`, paint, analysis.fillOpacity ?? 0.1), line];
}

function validateReferenceAnalysis(analysis: ReferenceAnalysis, path: string): void {
	if (
		analysis.statistic !== 'mean' &&
		analysis.statistic !== 'median' &&
		analysis.statistic !== 'quantile' &&
		analysis.statistic !== 'standard-deviation'
	) {
		throw new TypeError(
			`[Chart] ${path}.statistic "${String(analysis.statistic)}" is not supported.`
		);
	}
	if (analysis.statistic === 'quantile') {
		if (!Number.isFinite(analysis.quantile) || analysis.quantile < 0 || analysis.quantile > 1) {
			throw new TypeError(`[Chart] ${path}.quantile must be between 0 and 1.`);
		}
	}
	if (
		analysis.statistic === 'standard-deviation' &&
		analysis.multiplier !== undefined &&
		(!Number.isFinite(analysis.multiplier) || analysis.multiplier <= 0)
	) {
		throw new TypeError(`[Chart] ${path}.multiplier must be a finite number greater than 0.`);
	}
}

function referenceStatistic(
	values: readonly number[],
	analysis: ReferenceAnalysis
): { value: number; lower?: number; upper?: number } | undefined {
	if (analysis.statistic === 'median') {
		const value = median(values);
		return value === undefined ? undefined : { value };
	}
	if (analysis.statistic === 'quantile') {
		const value = quantileSorted([...values], analysis.quantile);
		return value === undefined ? undefined : { value };
	}
	const value = mean(values);
	if (value === undefined) return undefined;
	if (analysis.statistic === 'mean') return { value };
	if (analysis.statistic !== 'standard-deviation') return undefined;
	const spread = (deviation(values) ?? 0) * (analysis.multiplier ?? 1);
	return { value, lower: value - spread, upper: value + spread };
}

function compileReferenceLine(
	rows: readonly ReferenceDatum[],
	axis: 'x' | 'y',
	id: string,
	analysis: ReferenceAnalysis,
	paint: ReturnType<typeof resolveAnalysisPaint>
): CompiledMark {
	const style = {
		id,
		color: paint.colorChannel,
		stroke: paint.paint,
		strokeOpacity: analysis.strokeOpacity ?? 0.82,
		strokeWidth: analysis.strokeWidth ?? 1.5,
		strokeDasharray: analysis.strokeDasharray ?? '5 4'
	};
	const rule =
		axis === 'x' ? ruleX(rows, { ...style, x: 'value' }) : ruleY(rows, { ...style, y: 'value' });
	return withoutTooltipPoints({
		...rule,
		initialize(context) {
			const initialized = rule.initialize(context);
			return {
				...initialized,
				render(renderContext) {
					const rendered = initialized.render(renderContext);
					const owners = new Map(
						(rendered.focusAnchors ?? []).map((anchor) => [
							anchor.key,
							referencePoint(
								rows[anchor.datumIndex],
								anchor.datumIndex,
								anchor.key,
								axis,
								id,
								paint,
								renderContext
							)
						])
					);
					const ownNode = (node: SceneNode): SceneNode => {
						if (node.kind === 'group') return { ...node, children: node.children.map(ownNode) };
						return { ...node, pointOwner: owners.get(node.key) };
					};
					return { ...rendered, nodes: rendered.nodes.map(ownNode) };
				}
			};
		}
	});
}

function compileReferenceBand(
	rows: readonly ReferenceDatum[],
	axis: 'x' | 'y',
	id: string,
	paint: ReturnType<typeof resolveAnalysisPaint>,
	fillOpacity: number
): CompiledMark {
	return withoutTooltipPoints({
		initialize() {
			return {
				id,
				channels: {
					x: {
						scale: 'x',
						values:
							axis === 'x' ? rows.flatMap((row) => [row.lower, row.upper].filter(isChartValue)) : []
					},
					y: {
						scale: 'y',
						values:
							axis === 'y' ? rows.flatMap((row) => [row.lower, row.upper].filter(isChartValue)) : []
					},
					color: {
						scale: 'color',
						values: paint.colorChannel
							? rows.flatMap((row) => (row.group === null ? [] : [row.group]))
							: []
					}
				},
				render(renderContext) {
					const { chart, scales, color: resolveColor } = renderContext;
					const children: SceneNode[] = rows.flatMap((row, index) => {
						if (!isChartValue(row.lower) || !isChartValue(row.upper)) return [];
						const first = scales[axis].map(row.lower);
						const second = scales[axis].map(row.upper);
						const start = Math.min(first, second);
						const size = Math.abs(second - first);
						return [
							{
								kind: 'rect',
								key: `${id}:${row.identity}`,
								pointOwner: referencePoint(
									row,
									index,
									`${id}:${row.identity}`,
									axis,
									id,
									paint,
									renderContext
								),
								x: axis === 'x' ? start : chart.x,
								y: axis === 'y' ? start : chart.y,
								width: axis === 'x' ? size : chart.width,
								height: axis === 'y' ? size : chart.height,
								ariaHidden: true,
								style: {
									fill: paint.paint ?? resolveColor(row.group),
									fillOpacity
								}
							} satisfies SceneNode
						];
					});
					return {
						nodes: [
							{
								kind: 'group',
								key: id,
								className: 'ts-chart__analysis-band',
								ariaHidden: true,
								clip: chart,
								children
							}
						],
						points: []
					};
				}
			};
		}
	});
}

function referencePoint(
	row: ReferenceDatum,
	datumIndex: number,
	key: string,
	axis: 'x' | 'y',
	id: string,
	paint: ReturnType<typeof resolveAnalysisPaint>,
	{ chart, scales, color }: MarkRenderContext
): ChartPoint<ReferenceDatum> {
	return {
		key,
		markId: id,
		group: row.group,
		groupLabel: row.group === null ? id : String(row.group),
		datum: row,
		datumIndex,
		xValue: axis === 'x' ? row.value : (scales.x?.domain[0] ?? 0),
		yValue: axis === 'y' ? row.value : (scales.y?.domain[0] ?? 0),
		x: axis === 'x' ? scales.x.map(row.value) : chart.x,
		y: axis === 'y' ? scales.y.map(row.value) : chart.y,
		color: paint.paint ?? color(row.group)
	};
}

function isChartValue(value: unknown): value is number | Date {
	return (
		(typeof value === 'number' && Number.isFinite(value)) ||
		(value instanceof Date && Number.isFinite(value.getTime()))
	);
}
