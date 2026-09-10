import { createChartScene, defineChart, lineY, type SceneNode } from '@tanstack/charts';
import { interactiveColorLegend } from '@tanstack/charts/legend';
import { controlledSignal } from '@tanstack/charts/interaction/signal';
import { scaleLinear } from 'd3-scale';
import { describe, expect, test } from 'vitest';
import { compileReferenceAnalysis } from './chart.analysis.reference.js';
import { compileAnnotations } from './chart.annotation.js';
import type { CompiledMark } from './chart.cartesian.js';
import type { ChartReferenceAnalysis } from './chart.props.js';

const observations = [
	{ id: 'a1', group: 'A', x: 1, y: 2 },
	{ id: 'a2', group: 'A', x: 2, y: 4 },
	{ id: 'b1', group: 'B', x: 1, y: 6 },
	{ id: 'b2', group: 'B', x: 2, y: 8 }
];

function colorSeries(mark: CompiledMark): CompiledMark {
	return {
		...mark,
		initialize(context) {
			return { ...mark.initialize(context), seriesFromColor: true };
		}
	};
}

function createScene(marks: readonly CompiledMark[], visible: readonly string[]) {
	return createChartScene(
		defineChart({
			marks,
			scales: {
				x: { scale: scaleLinear().domain([0, 3]), axis: false },
				y: { scale: scaleLinear().domain([0, 10]), axis: false }
			},
			color: {
				domain: ['A', 'B'],
				legend: interactiveColorLegend({ visible: controlledSignal(visible, () => undefined) })
			},
			guides: false,
			margin: 0
		}),
		{ width: 640, height: 320 }
	);
}

function flattenNodes(nodes: readonly SceneNode[]): readonly SceneNode[] {
	return nodes.flatMap((node) =>
		node.kind === 'group' ? [node, ...flattenNodes(node.children)] : [node]
	);
}

function referenceMarks(analysis: ChartReferenceAnalysis, axis: 'x' | 'y' = 'y') {
	return compileReferenceAnalysis({
		data: observations,
		analysis,
		value: axis,
		axis,
		group: (row) => row.group,
		path: 'marks[0].analysis[0]',
		id: 'reference'
	}).map(colorSeries);
}

describe('Chart legend ownership', () => {
	test.each(['x', 'y'] as const)(
		'filters grouped %s reference rules without tooltip points',
		(axis) => {
			const marks = referenceMarks(
				{ type: 'reference', statistic: 'median', color: 'neutral' },
				axis
			);
			for (const visible of [['A', 'B'], ['A'], []]) {
				const scene = createScene(marks, visible);
				const rules = flattenNodes(scene.nodes).filter(
					(node) => node.kind === 'rule' && node.key.startsWith('reference:')
				);
				expect(rules).toHaveLength(visible.length);
				expect(scene.points).toEqual([]);
				expect(rules.every((node) => node.pointOwner === undefined)).toBe(true);
			}
		}
	);

	test('filters grouped standard-deviation bands with their reference lines', () => {
		const marks = referenceMarks({ type: 'reference', statistic: 'standard-deviation' });
		for (const visible of [['A', 'B'], ['B'], []]) {
			const scene = createScene(marks, visible);
			const nodes = flattenNodes(scene.nodes).filter((node) => node.key.startsWith('reference:'));
			expect(nodes.filter((node) => node.kind === 'rect')).toHaveLength(visible.length);
			expect(nodes.filter((node) => node.kind === 'rule')).toHaveLength(visible.length);
			expect(scene.points).toEqual([]);
		}
	});

	test('keeps plot-wide reference geometry when all series are hidden', () => {
		const scene = createScene(
			referenceMarks({ type: 'reference', statistic: 'median', scope: 'plot' }),
			[]
		);
		expect(
			flattenNodes(scene.nodes).filter(
				(node) => node.kind === 'rule' && node.key.startsWith('reference:')
			)
		).toHaveLength(1);
		expect(scene.points).toEqual([]);
	});

	test('hides a mark-owned arrow with its source series and keeps annotations non-interactive', () => {
		const source = colorSeries(
			lineY(observations, { id: 'source', key: 'id', x: 'x', y: 'y', z: 'group', color: 'group' })
		);
		const annotations = compileAnnotations(
			observations,
			{
				key: 'id',
				series: 'group',
				annotations: [{ id: 'selected', type: 'arrow', target: { key: 'b2' }, label: 'Selected' }]
			},
			[source],
			'marks[0]'
		);
		const marks = [source, ...annotations.over];
		const all = createScene(marks, ['A', 'B']);
		const arrow = flattenNodes(all.nodes).filter((node) => node.key.startsWith('selected:'));
		expect(arrow).toHaveLength(3);
		expect(arrow.every((node) => node.pointOwner === undefined)).toBe(true);
		expect(all.points).toHaveLength(observations.length);
		const hidden = createScene(marks, ['A']);
		expect(flattenNodes(hidden.nodes).some((node) => node.key.startsWith('selected:'))).toBe(false);
		expect(hidden.points).toHaveLength(2);
	});
});
