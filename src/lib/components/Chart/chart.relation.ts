import {
	defineChart,
	type ChartColorLegend,
	type ChartValue,
	type DomChartDefinition,
	type ResponsiveChartDefinition,
	type ChartTooltipInput
} from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { compileChartTheme } from './chart.channels.js';
import type { CompiledMark } from './chart.cartesian.js';
import { unsupportedDiscriminant } from './chart.errors.js';
import type { ChartColor, ChartRelationMark } from './chart.props.js';
import { compileRelationData } from './chart.relation.data.js';
import { compileNetworkRelation } from './chart.relation.network.js';
import { compileSankeyRelation } from './chart.relation.sankey.js';
import { compileTreeRelation } from './chart.relation.tree.js';

type CompileRelationChartInput<TRow extends object> = {
	data: readonly TRow[];
	mark: ChartRelationMark<TRow>;
	path: string;
	palette?: readonly ChartColor[];
	legend?: ChartColorLegend;
	tooltip: false | ChartTooltipInput<TRow, ChartValue, ChartValue, 'dom'>;
};

export function compileRelationChart<TRow extends object>({
	data,
	mark,
	path,
	palette,
	legend,
	tooltip
}: CompileRelationChartInput<TRow>): DomChartDefinition<TRow> {
	const definition: ResponsiveChartDefinition<TRow, ChartValue, ChartValue, 'dom'> = {
		chart({ width, height }) {
			const plotWidth = Math.max(1, width);
			const plotHeight = Math.max(1, height);
			const compiled = compileRelationData(data, mark, path);
			let marks: readonly CompiledMark[];
			switch (mark.variant) {
				case 'tree':
					marks = compileTreeRelation(data, mark, compiled, path, plotWidth, plotHeight);
					break;
				case 'network':
					marks = compileNetworkRelation(data, mark, compiled, path, plotWidth, plotHeight);
					break;
				case 'sankey':
					marks = compileSankeyRelation(data, mark, compiled, path, plotWidth, plotHeight);
					break;
				default:
					return unsupportedDiscriminant(readVariant(mark), `${path}.variant`);
			}
			return {
				marks,
				scales: {
					x: { scale: scaleLinear().domain([0, plotWidth]), axis: false },
					y: { scale: scaleLinear().domain([plotHeight, 0]), axis: false }
				},
				guides: false,
				clip: false,
				margin: 0,
				color: { legend },
				theme: compileChartTheme(palette)
			};
		}
	};
	return defineChart(definition, {
		keyboard: false,
		pointer: false,
		focusRing: false,
		tooltip
	});
}

function readVariant(value: unknown): unknown {
	return typeof value === 'object' && value !== null && 'variant' in value ? value.variant : value;
}
