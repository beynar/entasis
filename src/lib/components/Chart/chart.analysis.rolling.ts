import { lineY } from '@tanstack/charts';
import { median } from '@tanstack/charts/transform/reduce';
import { rollingWindow } from '@tanstack/charts/transform/rolling-window';
import {
	groupAnalysisRows,
	readChartValue,
	readFiniteNumber,
	resolveAnalysisPaint,
	type AnalysisGroupAccessor
} from './chart.analysis.data.js';
import { compileChannel, type CompilableChartChannel } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { withoutTooltipPoints } from './chart.mark.js';
import type { ChartKey, ChartRollingAnalysis, ChartValue } from './chart.props.js';

type RollingDatum = {
	readonly identity: string;
	readonly group: ChartKey | null;
	readonly x: ChartValue;
	readonly y: number;
};

type CompileRollingAnalysisInput<TRow extends object> = {
	readonly data: readonly TRow[];
	readonly analysis: ChartRollingAnalysis;
	readonly x: CompilableChartChannel<TRow, ChartValue>;
	readonly y: CompilableChartChannel<TRow, number>;
	readonly group?: AnalysisGroupAccessor<TRow>;
	readonly path: string;
	readonly id: string;
};

export function compileRollingAnalysis<TRow extends object>({
	data,
	analysis,
	x,
	y,
	group,
	path,
	id
}: CompileRollingAnalysisInput<TRow>): readonly CompiledMark[] {
	if (analysis.statistic !== 'mean' && analysis.statistic !== 'median') {
		throw new TypeError(
			`[Chart] ${path}.statistic "${String(analysis.statistic)}" is not supported.`
		);
	}
	if (!Number.isInteger(analysis.window) || analysis.window < 2) {
		throw new TypeError(`[Chart] ${path}.window must be an integer greater than or equal to 2.`);
	}
	const xAccessor = compileChannel(x);
	const yAccessor = compileChannel(y);
	const groupedRows = groupAnalysisRows(data, group, analysis.scope, path);
	const rows = groupedRows.groups.flatMap((sourceGroup) => {
		const observations = sourceGroup.rows.flatMap(({ row, index }) => {
			const context = { index, data };
			const xValue = readChartValue(xAccessor(row, context), `${path}.x`);
			const yValue = readFiniteNumber(yAccessor(row, context), `${path}.y`);
			return xValue !== undefined && yValue !== undefined ? [{ x: xValue, y: yValue }] : [];
		});
		return rollingWindow(observations, {
			size: analysis.window,
			anchor: 'end',
			partial: false,
			outputs: { y: { value: 'y', reduce: analysis.statistic === 'mean' ? 'mean' : median } }
		}).map(
			(observation, index) =>
				({
					identity: `${sourceGroup.identity}:${index + analysis.window - 1}`,
					group: sourceGroup.key,
					x: observation.x,
					y: observation.y
				}) satisfies RollingDatum
		);
	});
	if (rows.length === 0) return [];
	const paint = resolveAnalysisPaint(analysis, groupedRows.isGrouped, 'secondary');
	return [
		withoutTooltipPoints(
			lineY(rows, {
				id,
				x: 'x',
				y: 'y',
				z: paint.groupChannel,
				color: paint.colorChannel,
				key: 'identity',
				stroke: paint.paint,
				strokeOpacity: analysis.strokeOpacity ?? 0.92,
				strokeWidth: analysis.strokeWidth ?? 2,
				strokeDasharray: analysis.strokeDasharray ?? '4 3'
			})
		)
	];
}
