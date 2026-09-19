import type { Component } from 'svelte';
import { describe, expect, test } from 'vitest';
import Chart from './Chart.svelte';
import type { ChartProps } from './chart.props.js';
import { renderInThemeServer } from '../Theme/renderInThemeServer.test-helper.js';

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
	label: string
): string {
	const TypedChart = Chart as Component<ChartProps<TRow>>;
	return renderInThemeServer(TypedChart, {
		data,
		...definition,
		label,
		aspectRatio: 640 / 360
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

type WideRow = {
	month: string;
	completed: number;
	inProgress: number;
	pending: number;
};

const wideRows: readonly WideRow[] = [
	{ month: 'January', completed: 12, inProgress: 8, pending: 4 },
	{ month: 'February', completed: 10, inProgress: 9, pending: 6 },
	{ month: 'March', completed: 14, inProgress: 5, pending: 3 }
];

const wideStack = {
	x: { scale: { type: 'band' } },
	y: { scale: { type: 'linear' } },
	marks: [
		{
			type: 'bar',
			variant: 'stack',
			x: 'month',
			y: ['completed', 'inProgress', 'pending']
		}
	]
} satisfies ChartConfiguration<WideRow>;

function renderWide(
	definition: ChartConfiguration<WideRow>,
	extra: Partial<ChartProps<WideRow>> = {}
): string {
	const TypedChart = Chart as Component<ChartProps<WideRow>>;
	return renderInThemeServer(TypedChart, {
		data: wideRows,
		...definition,
		...extra,
		label: 'Task status',
		height: 320
	} as ChartProps<WideRow>).body;
}

/** Painted segment heights, without the full-height plot background rectangle. */
function barHeights(body: string): number[] {
	return [...body.matchAll(/<rect[^>]*\sheight="([\d.]+)"/g)]
		.map((match) => Number(match[1]))
		.filter((height) => height < 320);
}

describe('Chart wide value fields', () => {
	test('melts a list of fields into one stacked series per field', () => {
		const body = renderWide(wideStack);
		// three months × three melted series
		expect(barHeights(body)).toHaveLength(9);
		expect(body).toContain('aria-label="Task status"');
	});

	test('names series colors by key through a record palette', () => {
		const body = renderWide(wideStack, {
			palette: { completed: 'success', pending: 'danger' }
		});
		expect(body).toContain('var(--color-success)');
		expect(body).toContain('var(--color-danger)');
		// `inProgress` has no entry and falls back to the first default palette color.
		expect(body).toContain('var(--color-primary)');
	});

	test('resolves the surface family like the semantic roles', () => {
		const body = renderWide(wideStack, { palette: { completed: 'surface-raised' } });
		expect(body).toContain('var(--color-surface-raised)');
	});

	test('formats legend entries without renaming the series key', () => {
		const body = renderWide(wideStack, {
			legend: { format: (key) => (key === 'inProgress' ? 'In progress' : String(key)) }
		});
		expect(body).toContain('In progress');
		expect(body).not.toContain('>inProgress<');
	});

	test('takes the stack gap out of every segment that follows another', () => {
		const flush = barHeights(renderWide(wideStack));
		const spaced = barHeights(
			renderWide({
				...wideStack,
				marks: [{ ...wideStack.marks[0], gap: 4 }]
			} as ChartConfiguration<WideRow>)
		);
		expect(spaced).toHaveLength(flush.length);
		const removed = flush.reduce((total, value, index) => total + value - spaced[index], 0);
		// Six of the nine segments sit on another segment; each gives back four pixels.
		expect(Math.round(removed)).toBe(24);
	});

	test('rejects analysis on a wide stack', () => {
		expect(() =>
			renderWide({
				...wideStack,
				marks: [{ ...wideStack.marks[0], analysis: [{ type: 'reference', statistic: 'mean' }] }]
			} as ChartConfiguration<WideRow>)
		).toThrow(
			'[Chart] marks[0].analysis cannot be combined with a wide marks[0].y because the displayed values are transformed by the stack layout.'
		);
	});

	test('rejects a repeated field', () => {
		expect(() =>
			renderWide({
				...wideStack,
				marks: [{ type: 'bar', variant: 'stack', x: 'month', y: ['completed', 'completed'] }]
			} as ChartConfiguration<WideRow>)
		).toThrow('[Chart] marks[0].y lists the field "completed" twice.');
	});
});
