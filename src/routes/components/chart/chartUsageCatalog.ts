export const chartUsageTypes = [
	'series',
	'bar',
	'scatter',
	'distribution',
	'matrix',
	'facet',
	'polar',
	'proportion',
	'relation'
] as const;

export type ChartUsageType = (typeof chartUsageTypes)[number];
export type MetricChartUsageType = 'series' | 'bar' | 'facet';

type ChartUsageMetadata = {
	label: string;
	description: string;
	ariaLabel: string;
};

export const chartUsageMetadata = {
	series: {
		label: 'Series',
		description:
			'A series switches between area and interval while composing line and point layers.',
		ariaLabel: 'Quarterly revenue series chart'
	},
	bar: {
		label: 'Bar',
		description: 'One bar mark switches between grouped and stacked layouts.',
		ariaLabel: 'Quarterly revenue bar chart'
	},
	scatter: {
		label: 'Scatter',
		description:
			'The same numeric observations switch between points and responsive hexagonal bins with native x-axis brush zoom.',
		ariaLabel: 'Quarterly revenue bubble chart'
	},
	distribution: {
		label: 'Distribution',
		description:
			'Grouped raw samples switch between summaries, frequency, density, and cumulative rank.',
		ariaLabel: 'Response time distribution chart'
	},
	matrix: {
		label: 'Matrix',
		description:
			'A matrix uses explicit grid channels or derives a contribution calendar from dates.',
		ariaLabel: 'Contribution calendar heatmap'
	},
	facet: {
		label: 'Facet',
		description: 'A facet mark repeats the same nested series over data subsets.',
		ariaLabel: 'Quarterly revenue faceted chart'
	},
	polar: {
		label: 'Polar',
		description:
			'Polar variants share angle and radius channels, with boolean path layers where relevant.',
		ariaLabel: 'Quarterly revenue polar chart'
	},
	proportion: {
		label: 'Proportion',
		description: 'The same category values switch between pie, donut, and waffle layouts.',
		ariaLabel: 'Revenue share proportion chart'
	},
	relation: {
		label: 'Relation',
		description: 'The same node rows switch between tree, force-network, and Sankey layouts.',
		ariaLabel: 'Business relation chart'
	}
} satisfies Record<ChartUsageType, ChartUsageMetadata>;

export const chartUsageItems = chartUsageTypes.map((type) => ({
	value: type,
	label: chartUsageMetadata[type].label
}));

export const barVariantItems = [
	{ value: 'group', label: 'Group' },
	{ value: 'stack', label: 'Stack' }
] as const;

export const scatterSizeScaleItems = [
	{ value: 'linear', label: 'Linear' },
	{ value: 'sqrt', label: 'Sqrt' },
	{ value: 'log', label: 'Log' },
	{ value: 'exp', label: 'Exp (log⁻¹)' }
] as const;

export const scatterVariantItems = [
	{ value: 'points', label: 'Points' },
	{ value: 'hexbin', label: 'Hexbin' }
] as const;

export const seriesAnalysisItems = [
	{ value: 'none', label: 'None' },
	{ value: 'median', label: 'Median' },
	{ value: 'rolling-mean', label: 'Rolling mean' },
	{ value: 'rolling-median', label: 'Rolling median' }
] as const;

export const barAnalysisItems = [
	{ value: 'none', label: 'None' },
	{ value: 'mean', label: 'Mean' },
	{ value: 'median', label: 'Median' }
] as const;

export const scatterAnalysisItems = [
	{ value: 'none', label: 'None' },
	{ value: 'regression', label: 'Regression' },
	{ value: 'confidence', label: 'Confidence' },
	{ value: 'prediction', label: 'Prediction' },
	{ value: 'median', label: 'Median' }
] as const;

export const distributionAnalysisItems = [
	{ value: 'none', label: 'None' },
	{ value: 'mean', label: 'Mean' },
	{ value: 'median', label: 'Median' },
	{ value: 'p90', label: 'P90' },
	{ value: 'deviation', label: '±1 SD' }
] as const;

export type SeriesAnalysisUsage = (typeof seriesAnalysisItems)[number]['value'];
export type BarAnalysisUsage = (typeof barAnalysisItems)[number]['value'];
export type ScatterAnalysisUsage = (typeof scatterAnalysisItems)[number]['value'];
export type DistributionAnalysisUsage = (typeof distributionAnalysisItems)[number]['value'];

export const distributionVariantItems = [
	{ value: 'violin', label: 'Violin' },
	{ value: 'box', label: 'Box' },
	{ value: 'error-bar', label: 'Error bar' },
	{ value: 'histogram', label: 'Histogram' },
	{ value: 'density', label: 'Density' },
	{ value: 'ecdf', label: 'ECDF' }
] as const;

export const matrixVariantItems = [
	{ value: 'grid', label: 'Grid' },
	{ value: 'calendar', label: 'Calendar' }
] as const;

export const proportionVariantItems = [
	{ value: 'pie', label: 'Pie' },
	{ value: 'donut', label: 'Donut' },
	{ value: 'waffle', label: 'Waffle' }
] as const;

export const polarVariantItems = [
	{ value: 'radar', label: 'Radar' },
	{ value: 'circular', label: 'Circular' },
	{ value: 'radial-bar', label: 'Radial bar' },
	{ value: 'rose', label: 'Rose' }
] as const;

export const relationVariantItems = [
	{ value: 'tree', label: 'Tree' },
	{ value: 'network', label: 'Network' },
	{ value: 'sankey', label: 'Sankey' }
] as const;

export function isMetricChartUsageType(type: ChartUsageType): type is MetricChartUsageType {
	switch (type) {
		case 'series':
		case 'bar':
		case 'facet':
			return true;
		default:
			return false;
	}
}
