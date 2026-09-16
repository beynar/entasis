import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import type { ChartProps } from './chart.props.js';

type ChartConfiguration<TRow extends object> = Pick<
	ChartProps<TRow>,
	'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip'
>;

type Row = { id: string; category: string; group: string; value: number };

const rows: readonly Row[] = [
	{ id: 'a', category: 'A', group: 'First', value: 2 },
	{ id: 'b', category: 'B', group: 'Second', value: 3 }
];

const RowChart = Chart as Component<ChartProps<Row>>;

function compileInvalidDefinition(definition: unknown): unknown {
	try {
		const output = render(RowChart, {
			props: {
				data: rows,
				...(definition as ChartConfiguration<Row>),
				label: 'Invalid chart',
				aspectRatio: 640 / 360
			}
		});
		void output.body;
	} catch (error) {
		return error;
	}
	throw new Error('Expected the Chart definition to fail.');
}

describe('Chart configuration errors', () => {
	test.each([
		['empty marks', { marks: [] }, '[Chart] marks must contain at least one mark.'],
		[
			'unknown mark',
			{ marks: [{ type: 'spark' }] },
			'[Chart] marks[0].type "spark" is not supported.'
		],
		[
			'missing axis',
			{
				x: { scale: { type: 'band' } },
				marks: [{ type: 'bar', x: 'category', y: 'value' }]
			},
			'[Chart] y is required by marks[0].'
		],
		[
			'duplicate IDs',
			{
				marks: [
					{ type: 'polar', variant: 'radar', id: 'plot', angle: 'category', radius: 'value' },
					{ type: 'polar', variant: 'radar', id: 'plot', angle: 'category', radius: 'value' }
				]
			},
			'[Chart] marks[1].id duplicates marks[0].id "plot".'
		],
		[
			'empty palette',
			{
				marks: [{ type: 'polar', variant: 'radar', angle: 'category', radius: 'value' }],
				palette: []
			},
			'[Chart] palette must contain at least one color.'
		],
		[
			'categorical nicening',
			{
				x: { scale: { type: 'band' }, nice: true },
				y: { scale: { type: 'linear' } },
				marks: [{ type: 'bar', x: 'category', y: 'value' }]
			},
			'[Chart] x.nice is not supported by the "band" scale.'
		],
		[
			'group without a channel',
			{
				x: { scale: { type: 'band' } },
				y: { scale: { type: 'linear' } },
				marks: [
					{
						type: 'bar',
						variant: 'group',
						x: 'category',
						y: 'value'
					}
				]
			},
			'[Chart] marks[0].variant "group" requires marks[0].series or marks[0].colorBy.'
		],
		[
			'annotation without parent key',
			{
				x: { scale: { type: 'band' } },
				y: { scale: { type: 'linear' } },
				marks: [
					{
						type: 'bar',
						x: 'category',
						y: 'value',
						annotations: [{ type: 'marker', target: { key: 'a' } }]
					}
				]
			},
			'[Chart] marks[0].annotations[0].target.key requires the parent mark to define key.'
		]
	] as const)('rejects %s', (_name, definition, message) => {
		const error = compileInvalidDefinition(definition);
		expect(error).toBeInstanceOf(TypeError);
		expect((error as Error).message).toBe(message);
	});

	test('rejects a matrix without two band scales', () => {
		const error = compileInvalidDefinition({
			x: { scale: { type: 'band' } },
			y: { scale: { type: 'point' } },
			marks: [{ type: 'matrix', x: 'category', y: 'group' }]
		});
		expect(error).toBeInstanceOf(TypeError);
		expect((error as Error).message).toBe('[Chart] marks[0].y requires y.scale.type to be "band".');
	});
});
