import { createChartScene, defineChart, dot, type SceneNode } from '@tanstack/charts';
import { scaleLinear } from 'd3-scale';
import { describe, expect, test } from 'vitest';
import { compileAnnotations } from './chart.annotation.js';
import {
	compileHexbinColorOptions,
	compileHexbinScatterMark,
	isHexbinDatum
} from './chart.hexbin.js';
import type { ChartScatterMark } from './chart.props.js';
import { compileChartTooltip } from './chart.tooltip.js';

type Observation = { id: string; x: number; y: number };

const mark = {
	id: 'observations',
	type: 'scatter',
	variant: 'hexbin',
	x: 'x',
	y: 'y',
	key: 'id',
	radius: 12,
	color: 'success'
} satisfies ChartScatterMark<Observation>;

function createHexbinScene(
	observations: readonly Observation[],
	width = 640,
	definition: Extract<ChartScatterMark<Observation>, { variant: 'hexbin' }> = mark
) {
	const compiled = compileHexbinScatterMark(observations, definition, 'marks[0]');
	const marks = 'marks' in compiled ? compiled.marks : [compiled.mark];
	const annotations = compileAnnotations(observations, definition, marks, 'marks[0]');
	return createChartScene(
		defineChart({
			marks: [...annotations.under, ...marks, ...annotations.over],
			scales: {
				x: { scale: scaleLinear().domain([0, 100]), axis: false },
				y: { scale: scaleLinear().domain([0, 100]), axis: false }
			},
			color: compileHexbinColorOptions(definition),
			guides: false,
			margin: 0
		}),
		{ width, height: 320 }
	);
}

function flattenNodes(nodes: readonly SceneNode[]): readonly SceneNode[] {
	return nodes.flatMap((node) =>
		node.kind === 'group' ? [node, ...flattenNodes(node.children)] : [node]
	);
}

describe('Chart native hexbin', () => {
	test('aggregates finite observations and retains original source rows and indexes', () => {
		const observations: readonly Observation[] = [
			{ id: 'a', x: 25, y: 25 },
			{ id: 'invalid-x', x: Number.NaN, y: 25 },
			{ id: 'b', x: 25, y: 25 },
			{ id: 'c', x: 25, y: 25 },
			{ id: 'invalid-y', x: 25, y: Number.POSITIVE_INFINITY },
			{ id: 'd', x: 75, y: 75 }
		];
		const scene = createHexbinScene(observations);
		const bins = scene.points.map((point) => point.datum).filter(isHexbinDatum);
		expect(bins).toHaveLength(2);
		expect(bins.map((bin) => bin.count).sort()).toEqual([1, 3]);
		expect(bins.flatMap((bin) => bin.sourceIndexes).sort()).toEqual([0, 2, 3, 5]);
		for (const bin of bins) {
			expect(bin.__svelaiSourceRows).toEqual(bin.source);
			bin.sourceIndexes.forEach((sourceIndex, index) => {
				expect(bin.source[index]).toBe(observations[sourceIndex]);
			});
		}
	});

	test('renders native hexagons at the public radius with count-based continuous colors', () => {
		const scene = createHexbinScene([
			{ id: 'a', x: 25, y: 25 },
			{ id: 'b', x: 25, y: 25 },
			{ id: 'c', x: 25, y: 25 },
			{ id: 'd', x: 75, y: 75 }
		]);
		expect(scene.colors.kind).toBe('continuous');
		expect(scene.colors.domain).toEqual([1, 3]);
		expect(scene.colors.map(1)).toContain('16%');
		expect(scene.colors.map(3)).toContain('94%');
		expect(scene.colors.map(2)).toContain('var(--color-success)');
		const polygons = flattenNodes(scene.nodes).filter((node) => node.kind === 'area');
		expect(polygons).toHaveLength(2);
		for (const polygon of polygons) {
			expect(polygon.points).toHaveLength(6);
			expect(polygon.style?.stroke).toBeUndefined();
			const point = scene.points.find((candidate) => candidate.key === polygon.key);
			if (!point) throw new Error('Expected a native interaction point for the hexagon.');
			for (const [x, y] of polygon.points) {
				expect(Math.hypot(x - point.x, y - point.y)).toBeCloseTo(mark.radius - 0.75);
			}
			expect(scene.scales.x.map(point.xValue)).toBeCloseTo(point.x);
			expect(scene.scales.y.map(point.yValue)).toBeCloseTo(point.y);
			if (!isHexbinDatum(point.datum)) throw new Error('Expected an aggregate bin datum.');
			expect(point.color).toBe(scene.colors.map(point.datum.count));
		}
	});

	test('recomputes bins after resize and remains deterministic at the same dimensions', () => {
		const observations = [
			{ id: 'a', x: 10, y: 50 },
			{ id: 'b', x: 10.2, y: 50 }
		];
		const narrow = createHexbinScene(observations, 100);
		const wide = createHexbinScene(observations, 20_000);
		expect(narrow.points).toHaveLength(1);
		expect(wide.points).toHaveLength(2);
		expect(wide.points).toEqual(createHexbinScene(observations, 20_000).points);
		expect(
			wide.points
				.map((point) => point.datum)
				.filter(isHexbinDatum)
				.flatMap((bin) => bin.sourceIndexes)
				.sort()
		).toEqual([0, 1]);
	});

	test('preserves the categorical color scale when composed with other marks', () => {
		const observations = [
			{ id: 'a', x: 25, y: 25 },
			{ id: 'b', x: 25, y: 25 },
			{ id: 'c', x: 75, y: 75 }
		];
		const compiled = compileHexbinScatterMark(observations, mark, 'marks[0]', false);
		const marks = 'marks' in compiled ? compiled.marks : [compiled.mark];
		const scene = createChartScene(
			defineChart({
				marks: [...marks, dot(observations, { x: 'x', y: 'y', color: 'id', key: 'id' })],
				scales: {
					x: { scale: scaleLinear().domain([0, 100]) },
					y: { scale: scaleLinear().domain([0, 100]) }
				}
			}),
			{ width: 640, height: 320 }
		);
		expect(scene.colors.kind).toBe('categorical');
		expect(scene.colors.domain).toEqual(['a', 'b', 'c']);
		const bins = scene.points.filter((point) => isHexbinDatum(point.datum));
		expect(bins).toHaveLength(2);
		expect(bins[0].color).not.toBe(bins[1].color);
		expect(bins.every((bin) => bin.color.includes('var(--color-success)'))).toBe(true);
	});

	test('keeps mark-owned annotations on the bin containing their source observation', () => {
		const scene = createHexbinScene(
			[
				{ id: 'a', x: 25, y: 25 },
				{ id: 'b', x: 25, y: 25 }
			],
			640,
			{
				...mark,
				annotations: [{ id: 'selected', type: 'marker', target: { key: 'b' } }]
			}
		);
		const annotation = flattenNodes(scene.nodes).find((node) => node.key === 'selected');
		expect(annotation?.kind).toBe('dot');
		if (annotation?.kind !== 'dot') throw new Error('Expected the source annotation marker.');
		expect(annotation.x).toBe(scene.points[0].x);
		expect(annotation.y).toBe(scene.points[0].y);
	});

	test('accepts empty observations without producing synthetic bins', () => {
		expect(createHexbinScene([]).points).toEqual([]);
	});

	test('keeps the native bin count and center available to the tooltip', () => {
		const scene = createHexbinScene([
			{ id: 'a', x: 25, y: 25 },
			{ id: 'b', x: 25, y: 25 }
		]);
		const point = scene.points[0];
		if (!point || !isHexbinDatum(point.datum)) throw new Error('Expected an aggregate bin.');
		const tooltip = compileChartTooltip(true, undefined, undefined, { type: 'hexbin' });
		if (!tooltip.input || !('content' in tooltip.input) || !tooltip.input.content) {
			throw new Error('Expected built-in hexbin tooltip content.');
		}
		expect(
			tooltip.input.content([{ ...point, datum: point.datum }], {
				pinned: false,
				xLabel: 'Signal A',
				yLabel: 'Signal B',
				formatX: String,
				formatY: String
			})
		).toEqual({
			title: '2 observations',
			color: point.color,
			rows: [
				{ label: 'x', value: String(point.datum.x) },
				{ label: 'y', value: String(point.datum.y) }
			]
		});
	});

	test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
		'rejects an invalid radius of %s',
		(radius) => {
			expect(() => createHexbinScene([], 640, { ...mark, radius })).toThrow(
				'[Chart] marks[0].radius must be a finite number greater than 0.'
			);
		}
	);
});
