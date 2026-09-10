import { describe, expect, expectTypeOf, it } from 'vitest';
import type { ChartMark, ChartProps, ChartSeriesMark, ChartTooltipField } from './chart.props.js';

type ChartConfiguration<TRow extends object> = Pick<
	ChartProps<TRow>,
	'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip'
>;

type Revenue = {
	month: Date;
	actual: number;
	forecast: number | null;
	series: string;
	metadata: { source: string };
};

const definition = {
	x: { scale: { type: 'utc' }, axis: { label: 'Month' } },
	y: { scale: { type: 'linear' }, grid: true },
	marks: [
		{
			type: 'series',
			area: true,
			x: 'month',
			y: 'forecast',
			series: 'series',
			fill: 'primary'
		},
		{ type: 'series', x: 'month', y: 'actual', stroke: 'primary', points: true }
	],
	tooltip: {
		groupBy: 'x',
		fields: [
			{
				field: 'actual',
				format: (value, row) => `${row.series}: ${value.toFixed(2)}`
			}
		]
	}
} satisfies ChartConfiguration<Revenue>;

const invalidTooltipField = {
	// @ts-expect-error Object fields are not valid tooltip scalar fields.
	field: 'metadata'
} satisfies ChartTooltipField<Revenue>;

const invalidNullableKey = {
	type: 'series',
	x: 'month',
	y: 'actual',
	// @ts-expect-error Stable keys cannot use a nullable channel.
	key: 'forecast'
} satisfies ChartSeriesMark<Revenue>;

const invalidCategoricalNice = {
	x: {
		// @ts-expect-error Band and point scales cannot be nicened.
		scale: { type: 'band' },
		nice: true
	},
	y: { scale: { type: 'linear' } },
	marks: [{ type: 'series', x: 'series', y: 'actual' }]
} satisfies ChartConfiguration<Revenue>;

const invalidGroupedBar = {
	x: { scale: { type: 'band' } },
	y: { scale: { type: 'linear' } },
	marks: [
		// @ts-expect-error Grouped bars require a non-null series or color channel.
		{
			type: 'bar',
			variant: 'group',
			x: 'series',
			y: 'actual'
		}
	]
} satisfies ChartConfiguration<Revenue>;

const compactPolar = {
	marks: [
		{
			type: 'polar',
			variant: 'radar',
			angle: 'series',
			radius: 'actual',
			domain: [0, 100]
		}
	]
} satisfies ChartConfiguration<Revenue>;

void invalidTooltipField;
void invalidNullableKey;
void invalidCategoricalNice;
void invalidGroupedBar;
void compactPolar;

describe('Chart public type contract', () => {
	it('accepts Svelai-native layered definitions', () => {
		expect(definition.marks.map((mark) => mark.type)).toEqual(['series', 'series']);
	});

	it('keeps scalar tooltip formatters field-aware', () => {
		expectTypeOf<ChartTooltipField<Revenue>>().not.toEqualTypeOf<{
			field: 'metadata';
		}>();
	});

	it('contains every public mark discriminant', () => {
		type Discriminant = ChartMark<Revenue>['type'];
		expectTypeOf<Discriminant>().toEqualTypeOf<
			| 'series'
			| 'scatter'
			| 'bar'
			| 'distribution'
			| 'proportion'
			| 'polar'
			| 'relation'
			| 'matrix'
			| 'facet'
		>();
	});
});
