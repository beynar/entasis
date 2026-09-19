import { createChartRuntime, type SceneNode } from '@tanstack/charts';
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import { createChartOptions } from './chart.adapter.js';
import type { ChartLegendDefinition, ChartMark, ChartProps, ChartValue } from './chart.props.js';
import { renderInThemeServer } from '../Theme/renderInThemeServer.test-helper.js';

type Row = { x: number; y: number; group: string };
const rows: readonly Row[] = [
	{ x: 1, y: 3, group: 'First' },
	{ x: 2, y: 5, group: 'First' },
	{ x: 1, y: 2, group: 'Second' },
	{ x: 2, y: 4, group: 'Second' }
];

function scene(mark: ChartMark<Row>, value?: readonly string[], legend?: ChartLegendDefinition) {
	const options = createChartOptions({
		data: rows,
		marks: [mark],
		x: mark.type === 'bar' ? { scale: { type: 'band' } } : { scale: { type: 'linear' } },
		y: { scale: { type: 'linear' } },
		legend: { interactive: true, value, ...legend },
		idPrefix: 'legend',
		label: 'Legend chart'
	});
	return createChartRuntime<Row, ChartValue, ChartValue>().render(options.definition, {
		width: 640,
		height: 360
	});
}

function legendNode(nodes: readonly SceneNode[]): SceneNode | undefined {
	return nodes
		.flatMap((node) => (node.kind === 'group' ? [node, ...legendNodes(node.children)] : [node]))
		.find((node) => node.key === 'legend');
}

function legendNodes(nodes: readonly SceneNode[]): readonly SceneNode[] {
	return nodes.flatMap((node) =>
		node.kind === 'group' ? [node, ...legendNodes(node.children)] : [node]
	);
}

describe('Chart legend ownership between the engine and the library', () => {
	test.each(['top', 'bottom'] as const)(
		'paints and reserves nothing for a categorical legend at %s',
		(placement) => {
			const mark: ChartMark<Row> = { type: 'series', x: 'x', y: 'y', series: 'group' };
			for (const interactive of [true, false]) {
				const plot = scene(mark, undefined, { placement, interactive });
				// The engine keeps the visibility semantics and gives up the band and the DOM: the
				// `legend` node is empty and no native control is registered.
				expect(plot.controls ?? []).toEqual([]);
				expect(legendNode(plot.nodes)).toMatchObject({ kind: 'group', children: [] });
			}
			// `align` and `orientation` are theme classes on the Svelte row now, so moving them
			// cannot move the plot.
			const left = scene(mark, undefined, { placement, align: 'left' });
			const right = scene(mark, undefined, { placement, align: 'right', orientation: 'vertical' });
			expect(JSON.stringify(right.nodes)).toEqual(JSON.stringify(left.nodes));
			expect(right.scales.x.domain).toEqual(left.scales.x.domain);
			expect(right.points).toHaveLength(left.points.length);
		}
	);

	test.each([
		{ type: 'series', x: 'x', y: 'y', colorBy: 'group', points: true },
		{ type: 'series', x: 'x', y: 'y', series: 'group', area: true, points: true },
		{ type: 'scatter', x: 'x', y: 'y', colorBy: 'group' },
		{ type: 'bar', variant: 'group', x: 'x', y: 'y', series: 'group' },
		{ type: 'bar', variant: 'stack', offset: 'normalize', x: 'x', y: 'y', colorBy: 'group' }
	] satisfies ChartMark<Row>[])('filters $type layers without changing scales', (mark) => {
		const full = scene(mark);
		const filtered = scene(mark, ['Second']);
		expect(new Set(full.points.map((point) => point.group))).toEqual(new Set(['First', 'Second']));
		expect(new Set(filtered.points.map((point) => point.group))).toEqual(new Set(['Second']));
		expect(filtered.scales.x.domain).toEqual(full.scales.x.domain);
		expect(filtered.scales.y.domain).toEqual(full.scales.y.domain);
		expect(filtered.colors.domain).toEqual(full.colors.domain);
		expect(scene(mark, []).points).toHaveLength(0);
	});

	test.each(['histogram', 'density', 'ecdf'] as const)(
		'filters %s distribution groups',
		(variant) => {
			const mark: ChartMark<Row> = { type: 'distribution', variant, group: 'group', value: 'y' };
			const filtered = scene(mark, ['Second']);
			expect(filtered.points.length).toBeGreaterThan(0);
			expect(new Set(filtered.points.map((point) => point.group))).toEqual(new Set(['Second']));
		}
	);

	test('server-renders the interactive legend as pressed toggle buttons', () => {
		const TypedChart = Chart as Component<ChartProps<Row>>;
		const html = renderInThemeServer(TypedChart, {
			data: rows,
			marks: [{ type: 'series', x: 'x', y: 'y', series: 'group', points: true }],
			x: { scale: { type: 'linear' } },
			y: { scale: { type: 'linear' } },
			legend: { interactive: true, format: (key) => `Series ${key}` },
			label: 'Server legend',
			aspectRatio: 640 / 360
		}).body;
		expect(html).toContain('aria-label="Series visibility"');
		expect(html).toContain('Series First');
		expect(html).toContain('Series Second');
		// Pressed is visible, and every series starts visible.
		expect(html.match(/aria-pressed="true"/g)).toHaveLength(2);
		// The swatch carries the colour the mark paints, not a legend colour of its own.
		expect(html).toContain('background-color:var(--color-primary)');
		expect(html).toContain('background-color:var(--color-secondary)');
		expect(html).toContain('ts-chart__line');
		// The engine paints no legend of its own.
		expect(html).not.toContain('ts-chart__legend');
		expect(html).not.toContain('data-chart-legend-key');
	});

	test('server-renders a static legend as plain items, not buttons', () => {
		const TypedChart = Chart as Component<ChartProps<Row>>;
		const html = renderInThemeServer(TypedChart, {
			data: rows,
			marks: [{ type: 'series', x: 'x', y: 'y', series: 'group' }],
			x: { scale: { type: 'linear' } },
			y: { scale: { type: 'linear' } },
			legend: true,
			label: 'Static legend',
			aspectRatio: 640 / 360
		}).body;
		expect(html).toContain('aria-label="Chart legend"');
		expect(html).toContain('data-chart-legend-swatch');
		expect(html).toContain('First');
		expect(html).not.toContain('aria-pressed');
		expect(html).not.toContain('<button');
	});

	test('uses a quantitative legend for hexbin, not category buttons', () => {
		const plot = scene({ type: 'scatter', variant: 'hexbin', x: 'x', y: 'y' });
		expect(plot.colors.kind).toBe('continuous');
		expect(plot.points.length).toBeGreaterThan(0);
		expect(
			(plot.controls ?? []).some((control) => control.extension.id === 'interactive-color-legend')
		).toBe(false);
		// A colour ramp is not a control, so the engine still draws it into the scene.
		expect(JSON.stringify(plot.nodes)).toContain('ts-chart__legend');
	});
});
