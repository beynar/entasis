import { createChartRuntime } from '@tanstack/charts';
import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import { createChartOptions } from './chart.adapter.js';
import type { ChartLegendDefinition, ChartMark, ChartProps, ChartValue } from './chart.props.js';

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
		ariaLabel: 'Legend chart'
	});
	return createChartRuntime<Row, ChartValue, ChartValue>().render(options.definition, {
		width: 640,
		height: 360
	});
}

describe('Chart native legend', () => {
	test.each(['top', 'bottom'] as const)('aligns and stacks native controls at %s', (placement) => {
		const mark: ChartMark<Row> = { type: 'series', x: 'x', y: 'y', series: 'group' };
		const horizontal = scene(mark, undefined, { placement, orientation: 'horizontal' });
		const vertical = scene(mark, undefined, { placement, orientation: 'vertical', align: 'right' });
		expect(horizontal.controls?.[0]).toMatchObject({ columns: 2, bounds: { width: 228 } });
		expect(vertical.controls?.[0]).toMatchObject({ columns: 1, bounds: { width: 110 } });
		expect(vertical.points).toHaveLength(horizontal.points.length);
		for (const interactive of [true, false]) {
			const left = scene(mark, undefined, { placement, interactive, align: 'left' });
			const center = scene(mark, undefined, { placement, interactive, align: 'center' });
			const right = scene(mark, undefined, { placement, interactive, align: 'right' });
			expect(JSON.stringify(center.nodes)).not.toEqual(JSON.stringify(left.nodes));
			expect(JSON.stringify(right.nodes)).not.toEqual(JSON.stringify(center.nodes));
			expect(center.scales.x.domain).toEqual(left.scales.x.domain);
		}
	});
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

	test('initial server output includes all series and their legend', () => {
		const TypedChart = Chart as Component<ChartProps<Row>>;
		const html = render(TypedChart, {
			props: {
				data: rows,
				marks: [{ type: 'series', x: 'x', y: 'y', series: 'group', points: true }],
				x: { scale: { type: 'linear' } },
				y: { scale: { type: 'linear' } },
				legend: { interactive: true },
				ariaLabel: 'Server legend',
				initialDimensions: { width: 640, height: 360 }
			}
		}).body;
		expect(html).toContain('First');
		expect(html).toContain('Second');
		expect(html).toContain('ts-chart__line');
		expect(html).toContain('ts-chart__legend');
	});

	test('uses a quantitative legend for hexbin, not category buttons', () => {
		const plot = scene({ type: 'scatter', variant: 'hexbin', x: 'x', y: 'y' });
		expect(plot.colors.kind).toBe('continuous');
		expect(plot.points.length).toBeGreaterThan(0);
		expect(
			(plot.controls ?? []).some((control) => control.extension.id === 'interactive-color-legend')
		).toBe(false);
		expect(JSON.stringify(plot.nodes)).toContain('legend');
	});
});
