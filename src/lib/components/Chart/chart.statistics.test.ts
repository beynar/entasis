import { createChartRuntime, isResponsiveChartDefinition } from '@tanstack/charts';
import { describe, expect, test } from 'vitest';
import { createChartOptions } from './chart.adapter.js';
import type { ChartProps, ChartRegressionAnalysis, ChartValue } from './chart.props.js';

type Configuration<TRow extends object> = Pick<ChartProps<TRow>, 'data' | 'marks' | 'x' | 'y'>;

function definition<TRow extends object>(configuration: Configuration<TRow>) {
	return createChartOptions({
		...configuration,
		tooltip: false,
		label: 'Statistical chart',
		idPrefix: 'statistics'
	}).definition;
}

function channels<TRow extends object>(configuration: Configuration<TRow>, id: string) {
	const chart = definition(configuration);
	if (isResponsiveChartDefinition(chart)) throw new Error('Expected a static statistical chart.');
	const mark = chart.marks
		.map((mark, markIndex) => mark.initialize({ markIndex }))
		.find((mark) => mark.id === id);
	if (!mark) throw new Error(`Expected statistical mark ${id}.`);
	return mark.channels;
}

function scene<TRow extends object>(configuration: Configuration<TRow>) {
	return createChartRuntime<TRow, ChartValue, ChartValue>().render(definition(configuration), {
		width: 640,
		height: 360
	});
}

const numericAxes = {
	x: { scale: { type: 'linear' } },
	y: { scale: { type: 'linear' } }
} as const;

describe('Chart native rolling statistics', () => {
	const data = [
		{ x: 'Q1', y: 1, group: 'First' },
		{ x: 'Q1', y: 10, group: 'Second' },
		{ x: 'missing', y: null, group: 'First' },
		{ x: 'Q2', y: 7, group: 'First' },
		{ x: 'Q2', y: 20, group: 'Second' },
		{ x: 'Q3', y: 4, group: 'First' },
		{ x: 'Q3', y: 60, group: 'Second' },
		{ x: 'Q4', y: 10, group: 'First' },
		{ x: 'Q4', y: 40, group: 'Second' }
	];

	test.each([
		['mean', [4, 7, 30, 40]],
		['median', [4, 7, 20, 40]]
	] as const)('keeps grouped, full trailing windows for %s', (statistic, expected) => {
		const materialized = channels(
			{
				data,
				x: { scale: { type: 'point' } },
				y: numericAxes.y,
				marks: [
					{
						type: 'series',
						x: 'x',
						y: 'y',
						series: 'group',
						analysis: [{ id: 'rolling', type: 'rolling', statistic, window: 3 }]
					}
				]
			},
			'rolling'
		);
		expect(materialized.x.values).toEqual(['Q3', 'Q4', 'Q3', 'Q4']);
		expect(materialized.y.values).toEqual(expected);
		expect(materialized.color.values).toEqual(['First', 'First', 'Second', 'Second']);
	});

	test('retains authored order and plot scope rather than sorting x', () => {
		const materialized = channels(
			{
				data: [
					{ x: 3, y: 2, group: 'A' },
					{ x: 1, y: 4, group: 'B' },
					{ x: 2, y: 8, group: 'A' }
				],
				...numericAxes,
				marks: [
					{
						type: 'series',
						x: 'x',
						y: 'y',
						series: 'group',
						analysis: [
							{ id: 'rolling', type: 'rolling', statistic: 'mean', window: 2, scope: 'plot' }
						]
					}
				]
			},
			'rolling'
		);
		expect(materialized.x.values).toEqual([1, 2]);
		expect(materialized.y.values).toEqual([3, 6]);
	});

	test('rejects a fractional window before calling the native transform', () => {
		expect(() =>
			definition({
				data: [{ x: 1, y: 2 }],
				...numericAxes,
				marks: [
					{
						type: 'series',
						x: 'x',
						y: 'y',
						analysis: [{ type: 'rolling', statistic: 'mean', window: 2.5 }]
					}
				]
			})
		).toThrow('[Chart] marks[0].analysis[0].window must be an integer greater than or equal to 2.');
	});
});

describe('Chart native histogram bins', () => {
	test.each(['vertical', 'horizontal'] as const)(
		'keeps exact boundaries, empty bins, typed groups, and the inclusive maximum (%s)',
		(direction) => {
			const values = [0, 1, 1, 2, 4];
			const data = [
				...values.map((value) => ({ group: 1 as string | number, value })),
				{ group: '1', value: 0.5 },
				{ group: '1', value: -1 },
				{ group: '1', value: 5 }
			];
			const chart = scene({
				data,
				x: { scale: { type: 'linear', domain: direction === 'vertical' ? [0, 4] : [0, 5] } },
				y: { scale: { type: 'linear', domain: direction === 'vertical' ? [0, 5] : [0, 4] } },
				marks: [
					{
						id: 'frequency',
						type: 'distribution',
						variant: { type: 'histogram', bins: 4 },
						group: 'group',
						value: 'value',
						direction
					}
				]
			});
			const bins = chart.points.filter((point) => point.markId === 'frequency:histogram');
			expect(bins).toHaveLength(8);
			expect(bins.map((point) => point.group)).toEqual([1, 1, 1, 1, '1', '1', '1', '1']);
			const starts = bins.map((point) =>
				direction === 'vertical' ? point.x1Value : point.y1Value
			);
			const ends = bins.map((point) => (direction === 'vertical' ? point.x2Value : point.y2Value));
			const counts = bins.map((point) =>
				direction === 'vertical' ? point.y2Value : point.x2Value
			);
			expect(starts).toEqual([0, 1, 2, 3, 0, 1, 2, 3]);
			expect(ends).toEqual([1, 2, 3, 4, 1, 2, 3, 4]);
			expect(counts).toEqual([1, 2, 1, 1, 1, 0, 0, 0]);
			expect(new Set(bins.map((point) => point.key)).size).toBe(8);
		}
	);

	test('keeps the requested bin count for fractional domains', () => {
		const chart = scene({
			data: [0.1, 0.2, 0.3, 0.4].map((value) => ({ group: 'A', value })),
			x: { scale: { type: 'linear', domain: [0.1, 0.4] } },
			y: numericAxes.y,
			marks: [
				{
					id: 'frequency',
					type: 'distribution',
					variant: { type: 'histogram', bins: 3 },
					group: 'group',
					value: 'value'
				}
			]
		});
		const bins = chart.points.filter((point) => point.markId === 'frequency:histogram');
		expect(bins).toHaveLength(3);
		expect(bins.reduce((total, point) => total + Number(point.y2Value), 0)).toBe(4);
		expect(bins[0].x1Value).toBe(0.1);
		expect(bins[2].x2Value).toBe(0.4);
	});
});

describe('Chart native regression', () => {
	const data = [2, 4, 5, 4, 5].map((y, index) => ({ x: index + 1, y }));
	function regression(analysis: ChartRegressionAnalysis): Configuration<(typeof data)[number]> {
		return {
			data,
			...numericAxes,
			marks: [{ type: 'scatter', x: 'x', y: 'y', analysis: [analysis] }]
		};
	}

	test('uses Student-t fitted-mean confidence bounds with residual degrees of freedom', () => {
		const configuration = regression({
			id: 'fit',
			type: 'regression',
			samples: 5,
			interval: { type: 'confidence', level: 0.95 }
		});
		const fit = channels(configuration, 'fit');
		const band = channels(configuration, 'fit:interval');
		expect(fit.x.values).toEqual([1, 2, 3, 4, 5]);
		fit.y.values.forEach((value, index) => expect(value).toBeCloseTo(2.8 + index * 0.6, 10));
		const studentT3 = 3.182446305284263;
		const halfWidth = studentT3 * Math.sqrt(0.8 / 5);
		expect(band.y.values[2]).toBeCloseTo(4 + halfWidth, 8);
		expect(band.y.values[7]).toBeCloseTo(4 - halfWidth, 8);
		expect(scene(configuration).points.every((point) => !point.markId.startsWith('fit'))).toBe(
			true
		);
	});

	test('keeps wider prediction intervals with the native Student-t critical value', () => {
		const band = channels(
			regression({
				id: 'fit',
				type: 'regression',
				samples: 5,
				interval: { type: 'prediction', level: 0.95 }
			}),
			'fit:interval'
		);
		const halfWidth = 3.182446305284263 * Math.sqrt(0.8 * (1 + 1 / 5));
		expect(band.y.values[2]).toBeCloseTo(4 + halfWidth, 8);
		expect(band.y.values[7]).toBeCloseTo(4 - halfWidth, 8);
	});

	test('preserves independent fits and sampled Date coordinates', () => {
		const dates = [0, 1, 2].map((day) => new Date(Date.UTC(2026, 0, day + 1)));
		const grouped = dates.flatMap((x, index) => [
			{ x, y: index + 1, group: 'A' },
			{ x, y: (index + 1) * 10, group: 'B' }
		]);
		const fit = channels(
			{
				data: grouped,
				x: { scale: { type: 'utc' } },
				y: numericAxes.y,
				marks: [
					{
						type: 'scatter',
						x: 'x',
						y: 'y',
						series: 'group',
						analysis: [{ id: 'fit', type: 'regression', samples: 3 }]
					}
				]
			},
			'fit'
		);
		expect(fit.x.values).toEqual([...dates, ...dates]);
		expect(fit.y.values).toEqual([1, 2, 3, 10, 20, 30]);
		expect(fit.color.values).toEqual(['A', 'A', 'A', 'B', 'B', 'B']);
	});

	test('keeps zero-width prediction bands for an exact fit', () => {
		const band = channels(
			{
				data: [
					{ x: 1, y: 2 },
					{ x: 2, y: 4 },
					{ x: 3, y: 6 }
				],
				...numericAxes,
				marks: [
					{
						type: 'scatter',
						x: 'x',
						y: 'y',
						analysis: [
							{ id: 'fit', type: 'regression', samples: 3, interval: { type: 'prediction' } }
						]
					}
				]
			},
			'fit:interval'
		);
		expect(band.y.values).toEqual([2, 4, 6, 2, 4, 6]);
	});

	test.each([
		[[{ x: 1, y: 2 }], undefined, 'requires at least two observations per scope.'],
		[
			[
				{ x: 1, y: 2 },
				{ x: 1, y: 3 }
			],
			undefined,
			'requires at least two distinct x values.'
		],
		[
			[
				{ x: 1, y: 2 },
				{ x: 2, y: 3 }
			],
			{ type: 'confidence' as const },
			'.interval requires at least three observations per scope.'
		],
		[
			[
				{ x: 1, y: Number.POSITIVE_INFINITY },
				{ x: 2, y: 3 }
			],
			undefined,
			'.y requires finite numbers.'
		]
	] as const)(
		'preserves explicit Chart errors for invalid observations %#',
		(observations, interval, message) => {
			expect(() =>
				definition({
					data: observations,
					...numericAxes,
					marks: [{ type: 'scatter', x: 'x', y: 'y', analysis: [{ type: 'regression', interval }] }]
				})
			).toThrow(message);
		}
	);
});

describe('Chart native stacked-bar normalization', () => {
	test.each(['vertical', 'horizontal'] as const)(
		'normalizes each category without changing raw values (%s)',
		(direction) => {
			const data = [
				{ category: 'Q1', group: 'A', value: 30 },
				{ category: 'Q1', group: 'B', value: 70 },
				{ category: 'Q2', group: 'A', value: 60 },
				{ category: 'Q2', group: 'B', value: 20 },
				{ category: 'Q3', group: 'A', value: 0 },
				{ category: 'Q3', group: 'B', value: 0 }
			];
			const configuration: Configuration<(typeof data)[number]> =
				direction === 'vertical'
					? {
							data,
							x: { scale: { type: 'band' } },
							y: numericAxes.y,
							marks: [
								{
									type: 'bar',
									id: 'share',
									variant: 'stack',
									offset: 'normalize',
									x: 'category',
									y: 'value',
									series: 'group'
								}
							]
						}
					: {
							data,
							x: numericAxes.x,
							y: { scale: { type: 'band' } },
							marks: [
								{
									type: 'bar',
									id: 'share',
									variant: 'stack',
									offset: 'normalize',
									direction,
									x: 'value',
									y: 'category',
									series: 'group'
								}
							]
						};
			const chart = scene(configuration);
			const bars = chart.points.filter((point) => point.markId === 'share');
			expect(bars).toHaveLength(6);
			const starts = bars.map((point) =>
				direction === 'vertical' ? point.y1Value : point.x1Value
			);
			const ends = bars.map((point) => (direction === 'vertical' ? point.y2Value : point.x2Value));
			expect(starts).toEqual([0, 0.3, 0, 0.75, 0, 0]);
			expect(ends).toEqual([0.3, 1, 0.75, 1, 0, 0]);
			expect(bars.map((point) => point.datum.value)).toEqual([30, 70, 60, 20, 0, 0]);
		}
	);
});
