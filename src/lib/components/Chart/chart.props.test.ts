import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
	ChartBarMark,
	ChartMark,
	ChartPalette,
	ChartProps,
	ChartSeriesMark,
	ChartTooltipField
} from './chart.props.js';

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

type Status = {
	month: string;
	completed: number;
	inProgress: number;
	pending: number;
	owner: string;
};

const wideStack = {
	type: 'bar',
	variant: 'stack',
	x: 'month',
	y: ['completed', 'inProgress', 'pending'],
	gap: 4
} satisfies ChartBarMark<Status>;

const invalidWideField = {
	type: 'bar',
	variant: 'stack',
	x: 'month',
	// @ts-expect-error Wide value fields must be numeric.
	y: ['completed', 'owner']
} satisfies ChartBarMark<Status>;

const invalidWideSimpleBar = {
	type: 'bar',
	x: 'month',
	// @ts-expect-error Only a stacked bar melts wide value fields.
	y: ['completed', 'pending']
} satisfies ChartBarMark<Status>;

const invalidWideSeriesChannel = {
	type: 'bar',
	variant: 'stack',
	x: 'month',
	// @ts-expect-error Wide fields own the series key, so `series` leaves the wide mark.
	y: ['completed', 'pending'],
	series: 'owner'
} satisfies ChartBarMark<Status>;

const keyedPalette = {
	completed: 'success',
	inProgress: 'primary',
	pending: 'surface-raised'
} satisfies ChartPalette;

const pinnedTooltip = {
	defaultValue: 'February',
	onValueChange: (value) => {
		expectTypeOf(value).toEqualTypeOf<string | number | null>();
	}
} satisfies ChartProps<Status>['tooltip'];

const sizedChart = {
	data: [] as readonly Status[],
	marks: [wideStack],
	label: 'Task status',
	height: 320,
	palette: keyedPalette,
	legend: { format: (key) => String(key) }
} satisfies ChartProps<Status>;

const invalidSizedChart = {
	data: [] as readonly Status[],
	marks: [wideStack],
	label: 'Task status',
	// @ts-expect-error initialDimensions is no longer a sizing input.
	initialDimensions: { width: 800, height: 400 }
} satisfies ChartProps<Status>;

void wideStack;
void invalidWideField;
void invalidWideSimpleBar;
void invalidWideSeriesChannel;
void keyedPalette;
void pinnedTooltip;
void sizedChart;
void invalidSizedChart;
void invalidTooltipField;
void invalidNullableKey;
void invalidCategoricalNice;
void invalidGroupedBar;
void compactPolar;

describe('Chart public type contract', () => {
	it('accepts Entasis-native layered definitions', () => {
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
