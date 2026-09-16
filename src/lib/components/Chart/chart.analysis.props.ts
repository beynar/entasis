import type { ChartColor } from './chart.core.js';

export type ChartAnalysisScope = 'plot' | 'series';

type ChartAnalysisLineStyle = {
	id?: string;
	scope?: ChartAnalysisScope;
	color?: ChartColor;
	strokeOpacity?: number;
	strokeWidth?: number;
	strokeDasharray?: string;
};

type ChartReferenceStatistic =
	| { statistic: 'mean' | 'median' }
	| { statistic: 'quantile'; quantile: number }
	| {
			statistic: 'standard-deviation';
			multiplier?: number;
			fillOpacity?: number;
	  };

type ChartReferenceAnalysisBase = ChartAnalysisLineStyle & {
	type: 'reference';
};

export type ChartReferenceAnalysis = ChartReferenceAnalysisBase &
	ChartReferenceStatistic & {
		axis?: 'x' | 'y';
	};

export type ChartDistributionReferenceAnalysis = ChartReferenceAnalysisBase &
	ChartReferenceStatistic;

export type ChartRegressionInterval = {
	type: 'confidence' | 'prediction';
	level?: 0.9 | 0.95 | 0.99;
	fillOpacity?: number;
};

export type ChartRegressionAnalysis = ChartAnalysisLineStyle & {
	type: 'regression';
	method?: 'linear';
	samples?: number;
	interval?: ChartRegressionInterval;
};

export type ChartRollingAnalysis = ChartAnalysisLineStyle & {
	type: 'rolling';
	statistic: 'mean' | 'median';
	window: number;
};

export type ChartSeriesAnalysis =
	ChartReferenceAnalysis | ChartRegressionAnalysis | ChartRollingAnalysis;

export type ChartScatterAnalysis = ChartReferenceAnalysis | ChartRegressionAnalysis;
export type ChartBarAnalysis = ChartReferenceAnalysis;
