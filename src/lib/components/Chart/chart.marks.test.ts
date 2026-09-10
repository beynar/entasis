import { render } from 'svelte/server';
import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import type { ChartProps } from './chart.props.js';

type ChartConfiguration<TRow extends object> = Pick<
	ChartProps<TRow>,
	'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip'
>;

type Row = {
	id: string;
	category: string;
	group: string;
	x: number;
	y: number;
};

const rows: readonly Row[] = [
	{ id: 'a', category: 'A', group: 'First', x: 1, y: 3 },
	{ id: 'b', category: 'B', group: 'First', x: 2, y: 5 },
	{ id: 'c', category: 'C', group: 'Second', x: 3, y: 4 }
];

const xy = {
	x: { scale: { type: 'linear' } },
	y: { scale: { type: 'linear' } }
} as const;

const semanticCases = [
	[
		'line',
		{
			...xy,
			marks: [{ type: 'series', x: 'x', y: 'y', points: true }]
		} satisfies ChartConfiguration<Row>
	],
	[
		'area',
		{
			...xy,
			marks: [{ type: 'series', area: true, x: 'x', y: 'y', line: true }]
		} satisfies ChartConfiguration<Row>
	],
	[
		'bar',
		{
			x: { scale: { type: 'band' } },
			y: { scale: { type: 'linear' } },
			marks: [{ type: 'bar', x: 'category', y: 'y' }]
		} satisfies ChartConfiguration<Row>
	],
	[
		'scatter',
		{
			...xy,
			marks: [{ type: 'scatter', x: 'x', y: 'y', size: 'y' }]
		} satisfies ChartConfiguration<Row>
	],
	[
		'matrix',
		{
			x: { scale: { type: 'band' } },
			y: { scale: { type: 'band' } },
			marks: [{ type: 'matrix', x: 'category', y: 'group' }]
		} satisfies ChartConfiguration<Row>
	],
	[
		'facet',
		{
			...xy,
			marks: [
				{
					type: 'facet',
					by: 'group',
					marks: [{ type: 'series', x: 'x', y: 'y' }]
				}
			]
		} satisfies ChartConfiguration<Row>
	]
] as const;

function renderDefinition<TRow extends object>(
	data: readonly TRow[],
	definition: ChartConfiguration<TRow>,
	ariaLabel: string
): string {
	const TypedChart = Chart as Component<ChartProps<TRow>>;
	return render(TypedChart, {
		props: {
			data,
			...definition,
			ariaLabel,
			initialDimensions: { width: 640, height: 360 }
		}
	}).body;
}

describe('Chart mark rendering', () => {
	test.each(semanticCases)('renders the %s mark', (name, definition) => {
		const body = renderDefinition(rows, definition, `${name} chart`);
		expect(body).toContain('<svg');
		expect(body).toContain(`aria-label="${name} chart"`);
	});

	test.each(['radar', 'circular', 'radial-bar', 'rose'] as const)(
		'renders the %s polar variant',
		(variant) => {
			const definition = {
				marks: [
					{
						type: 'polar',
						variant,
						angle: 'category',
						radius: 'y',
						domain: [0, 10]
					}
				]
			} satisfies ChartConfiguration<Row>;

			const body = renderDefinition(rows, definition, `${variant} chart`);
			expect(body).toContain('ts-chart__polar');
		}
	);

	test('renders mark-owned annotations and a plot frame', () => {
		const definition = {
			...xy,
			frame: true,
			marks: [
				{
					type: 'series',
					x: 'x',
					y: 'y',
					key: 'id',
					annotations: [
						{
							id: 'selected-band',
							type: 'band',
							target: { key: 'b' },
							axis: 'x',
							thickness: 24,
							inset: 2,
							placement: 'under'
						},
						{ type: 'arrow', target: { key: 'b' }, label: 'Selected point' }
					]
				}
			]
		} satisfies ChartConfiguration<Row>;

		const body = renderDefinition(rows, definition, 'Annotated series');
		expect(body).toContain('data-ts-key="selected-band"');
		expect(body).toContain('width="20"');
		expect(body).toContain('Selected point');
	});
});
