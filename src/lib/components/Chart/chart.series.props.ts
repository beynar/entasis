import type { ChartDataMarkProps } from './chart.annotation.props.js';
import type { ChartBarAnalysis, ChartSeriesAnalysis } from './chart.analysis.props.js';
import type {
	ChartChannel,
	ChartColor,
	ChartCurve,
	ChartKey,
	ChartRequiredChannel,
	ChartValue,
	ChartValueFields,
	ChartVisual
} from './chart.core.js';

export type ChartSeriesChannels<TRow> = {
	series?: ChartChannel<TRow, ChartKey>;
	colorBy?: ChartChannel<TRow, ChartKey>;
};

export type ChartFillStyle<TRow> = {
	fill?: ChartVisual<TRow, ChartColor>;
	fillOpacity?: number;
};

export type ChartStrokeStyle<TRow> = {
	stroke?: ChartVisual<TRow, ChartColor>;
	strokeOpacity?: number;
	strokeWidth?: number;
	strokeDasharray?: string;
};

export type ChartBasicStrokeStyle<TRow> = Omit<ChartStrokeStyle<TRow>, 'strokeDasharray'>;

export type ChartPointShape = 'circle' | 'hexagon';

export type ChartPointOptions<TRow> = ChartFillStyle<TRow> &
	ChartBasicStrokeStyle<TRow> & {
		shape?: ChartPointShape;
		radius?: number | ChartChannel<TRow, number>;
		opacity?: number;
	};

export type ChartLineOptions<TRow> = ChartStrokeStyle<TRow> & { curve?: ChartCurve };

export type ChartSeriesInterval<TRow> = ChartFillStyle<TRow> & {
	lower: ChartChannel<TRow, number>;
	upper: ChartChannel<TRow, number>;
};

export type ChartStackLayout = {
	type: 'stack';
	order?: 'input' | 'ascending' | 'descending' | readonly ChartKey[];
	offset?: 'diverging' | 'normalize' | 'center' | 'wiggle';
	reverse?: boolean;
};

type ChartGroupedChannels<TRow> =
	| {
			series: ChartRequiredChannel<TRow, ChartKey>;
			colorBy?: ChartChannel<TRow, ChartKey>;
	  }
	| {
			series?: never;
			colorBy: ChartRequiredChannel<TRow, ChartKey>;
	  };

type ChartVerticalSeries<TRow> = {
	direction?: 'vertical';
	x: ChartChannel<TRow, ChartValue>;
	y: ChartChannel<TRow, number>;
} & ChartSeriesSurface<TRow>;

type ChartHorizontalSeries<TRow> = {
	direction: 'horizontal';
	x: ChartChannel<TRow, number>;
	y: ChartChannel<TRow, ChartValue>;
	area: true;
	interval?: never;
	baseline?: number | ChartChannel<TRow, number>;
	layout?: ChartStackLayout;
};

/** Wide area stack: one stacked series per listed numeric field, keyed by the field name. */
type ChartWideVerticalSeries<TRow> = {
	direction?: 'vertical';
	x: ChartChannel<TRow, ChartValue>;
	y: ChartValueFields<TRow>;
	area: true;
	layout: ChartStackLayout;
	series?: never;
	colorBy?: never;
	interval?: never;
	baseline?: never;
};

type ChartWideHorizontalSeries<TRow> = {
	direction: 'horizontal';
	x: ChartValueFields<TRow>;
	y: ChartChannel<TRow, ChartValue>;
	area: true;
	layout: ChartStackLayout;
	series?: never;
	colorBy?: never;
	interval?: never;
	baseline?: never;
};

type ChartSeriesSurface<TRow> =
	| {
			area?: false;
			interval?: ChartSeriesInterval<TRow>;
			baseline?: never;
			layout?: never;
	  }
	| {
			area: true;
			interval?: never;
			baseline?: number | ChartChannel<TRow, number>;
			layout?: ChartStackLayout;
	  };

export type ChartSeriesMark<TRow> = ChartDataMarkProps<TRow> &
	ChartFillStyle<TRow> &
	ChartStrokeStyle<TRow> &
	(
		| ((ChartVerticalSeries<TRow> | ChartHorizontalSeries<TRow>) & ChartSeriesChannels<TRow>)
		| ChartWideVerticalSeries<TRow>
		| ChartWideHorizontalSeries<TRow>
	) & {
		type: 'series';
		line?: boolean | ChartLineOptions<TRow>;
		points?: boolean | ChartPointOptions<TRow>;
		curve?: ChartCurve;
		analysis?: readonly [ChartSeriesAnalysis, ...ChartSeriesAnalysis[]];
	};

type ChartBarCoordinates<TRow> =
	| {
			direction?: 'vertical';
			x: ChartChannel<TRow, ChartValue>;
			y: ChartChannel<TRow, number>;
	  }
	| {
			direction: 'horizontal';
			y: ChartChannel<TRow, ChartValue>;
			x: ChartChannel<TRow, number>;
	  };

/** Wide stack: one stacked series per listed numeric field, keyed by the field name. */
type ChartWideBarCoordinates<TRow> =
	| {
			direction?: 'vertical';
			x: ChartChannel<TRow, ChartValue>;
			y: ChartValueFields<TRow>;
			series?: never;
			colorBy?: never;
	  }
	| {
			direction: 'horizontal';
			y: ChartChannel<TRow, ChartValue>;
			x: ChartValueFields<TRow>;
			series?: never;
			colorBy?: never;
	  };

type ChartBarBase<TRow> = ChartDataMarkProps<TRow> &
	ChartFillStyle<TRow> & {
		type: 'bar';
		inset?: number;
		radius?: number;
		analysis?: readonly [ChartBarAnalysis, ...ChartBarAnalysis[]];
	};

type ChartSimpleBar<TRow> = ChartBarCoordinates<TRow> &
	ChartSeriesChannels<TRow> & {
		variant?: undefined;
		baseline?: number | ChartChannel<TRow, number>;
		padding?: never;
		order?: never;
		offset?: never;
		reverse?: never;
		gap?: never;
	};

type ChartGroupedBar<TRow> = ChartBarCoordinates<TRow> &
	ChartGroupedChannels<TRow> & {
		variant: 'group';
		baseline?: never;
		padding?: number;
		order?: never;
		offset?: never;
		reverse?: never;
		gap?: never;
	};

type ChartStackedBar<TRow> = (
	(ChartBarCoordinates<TRow> & ChartGroupedChannels<TRow>) | ChartWideBarCoordinates<TRow>
) & {
	variant: 'stack';
	baseline?: never;
	padding?: never;
	order?: 'input' | 'ascending' | 'descending' | readonly ChartKey[];
	offset?: 'diverging' | 'normalize' | 'center' | 'wiggle';
	reverse?: boolean;
	/** Pixels of surface left between consecutive segments of one stack. */
	gap?: number;
};

export type ChartBarMark<TRow> = ChartBarBase<TRow> &
	(ChartSimpleBar<TRow> | ChartGroupedBar<TRow> | ChartStackedBar<TRow>);
