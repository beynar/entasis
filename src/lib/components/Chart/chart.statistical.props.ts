import type { ChartDataMarkProps } from './chart.annotation.props.js';
import type { ChartDistributionReferenceAnalysis } from './chart.analysis.props.js';
import type { ChartChannel, ChartColor, ChartKey, ChartRequiredChannel } from './chart.core.js';

export type ChartDistributionInterval =
	| { type: 'confidence'; level?: 0.9 | 0.95 | 0.99 }
	| { type: 'standard-error'; multiplier?: number }
	| { type: 'standard-deviation'; multiplier?: number };

export type ChartDistributionVariant =
	| 'violin'
	| 'box'
	| 'error-bar'
	| 'histogram'
	| 'density'
	| 'ecdf'
	| { type: 'violin'; bins?: number; showMedian?: boolean }
	| { type: 'box'; whiskers?: 'tukey' | 'min-max'; showOutliers?: boolean }
	| { type: 'error-bar'; interval?: ChartDistributionInterval }
	| { type: 'histogram'; bins?: number }
	| { type: 'density'; bandwidth?: number; samples?: number }
	| { type: 'ecdf' };

export type ChartDistributionMark<TRow> = ChartDataMarkProps<TRow> & {
	type: 'distribution';
	variant: ChartDistributionVariant;
	group: ChartRequiredChannel<TRow, ChartKey>;
	value: ChartChannel<TRow, number>;
	direction?: 'vertical' | 'horizontal';
	color?: ChartColor;
	analysis?: readonly [ChartDistributionReferenceAnalysis, ...ChartDistributionReferenceAnalysis[]];
};

export type ChartProportionVariant =
	| 'pie'
	| 'donut'
	| 'waffle'
	| { type: 'pie'; padAngle?: number; cornerRadius?: number }
	| { type: 'donut'; innerRadius?: number; padAngle?: number; cornerRadius?: number }
	| { type: 'waffle'; cells?: number; columns?: number; gap?: number; radius?: number };

export type ChartProportionMark<TRow> = ChartDataMarkProps<TRow> & {
	type: 'proportion';
	variant: ChartProportionVariant;
	category: ChartRequiredChannel<TRow, ChartKey>;
	value: ChartChannel<TRow, number>;
};
