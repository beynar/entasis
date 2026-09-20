import type {
	ChartBarAnalysis,
	ChartDistributionReferenceAnalysis,
	ChartDistributionVariant,
	ChartMatrixVariant,
	ChartPolarVariant,
	ChartProportionVariant,
	ChartRelationVariant,
	ChartScatterAnalysis,
	ChartScatterSizeScaleShortcut,
	ChartSeriesAnalysis,
	ChartProps,
	ChartWeightedRelationLink
} from 'entasis/chart';
import type {
	BarAnalysisUsage,
	DistributionAnalysisUsage,
	MetricChartUsageType,
	ScatterAnalysisUsage,
	SeriesAnalysisUsage
} from './chartUsageCatalog.js';

type ChartUsageExample<TRow extends object> = {
	data: readonly TRow[];
	props: Pick<
		ChartProps<TRow>,
		'marks' | 'x' | 'y' | 'guides' | 'clip' | 'frame' | 'margin' | 'palette' | 'tooltip'
	>;
};

type MetricRow = {
	quarter: string;
	product: string;
	value: number;
	intervalLow: number;
	intervalHigh: number;
};

const metricRows: readonly MetricRow[] = [
	{ quarter: 'Q1', product: 'Platform', value: 42 },
	{ quarter: 'Q2', product: 'Platform', value: 51 },
	{ quarter: 'Q3', product: 'Platform', value: 58 },
	{ quarter: 'Q4', product: 'Platform', value: 67 },
	{ quarter: 'Q1', product: 'Services', value: 29 },
	{ quarter: 'Q2', product: 'Services', value: 34 },
	{ quarter: 'Q3', product: 'Services', value: 41 },
	{ quarter: 'Q4', product: 'Services', value: 48 },
	{ quarter: 'Q1', product: 'Partners', value: 18 },
	{ quarter: 'Q2', product: 'Partners', value: 27 },
	{ quarter: 'Q3', product: 'Partners', value: 33 },
	{ quarter: 'Q4', product: 'Partners', value: 39 }
].map((row) => ({
	...row,
	intervalLow: row.value - 5,
	intervalHigh: row.value + 5
}));

const metricCartesianPosition = {
	x: {
		scale: { type: 'point', padding: 0.5 },
		axis: { label: 'Quarter' }
	},
	y: {
		scale: { type: 'linear', domain: [0, 80] },
		axis: { label: 'Revenue (€k)' },
		grid: true
	}
} as const;

type MetricChartUsageOptions = {
	line: boolean;
	area: boolean;
	interval: boolean;
	points: boolean;
	barVariant: 'group' | 'stack';
	normalize: boolean;
	labels: boolean;
	tooltip: boolean;
	seriesAnalysis: SeriesAnalysisUsage;
	barAnalysis: BarAnalysisUsage;
};

export function metricChartUsageExample(
	type: MetricChartUsageType,
	options: MetricChartUsageOptions
): ChartUsageExample<MetricRow> {
	if (type === 'series') return seriesChartUsageExample(options);
	if (type === 'bar') {
		return barChartUsageExample(
			options.barVariant,
			options.normalize,
			options.barAnalysis,
			options.tooltip
		);
	}
	const analysis = resolveSeriesAnalysis(options.seriesAnalysis);
	return {
		data: metricRows,
		props: {
			...metricCartesianPosition,
			marks: [
				{
					type: 'facet',
					by: 'product',
					columns: 3,
					axes: 'cell',
					label: options.labels,
					marks: [
						{
							type: 'series',
							x: 'quarter',
							y: 'value',
							stroke: 'primary',
							strokeWidth: 2,
							points: true,
							analysis
						}
					]
				}
			],
			tooltip: options.tooltip
		}
	};
}

type ScatterRow = {
	x: number;
	y: number;
	weight: number;
	cluster: string;
};

const scatterCenters = [
	{ x: 28, y: 34, cluster: 'Alpha' },
	{ x: 66, y: 62, cluster: 'Beta' },
	{ x: 48, y: 76, cluster: 'Gamma' }
] as const;

const scatterRows: readonly ScatterRow[] = Array.from({ length: 360 }, (_value, index) => {
	const center = scatterCenters[index % scatterCenters.length];
	if (!center) throw new Error('Scatter demo could not resolve its deterministic cluster.');
	const sequence = Math.floor(index / scatterCenters.length) + 1;
	const angle = sequence * 2.399963229728653;
	const radius = 2.5 + (sequence % 24) * 0.52;
	return {
		x: center.x + Math.cos(angle) * radius,
		y: center.y + Math.sin(angle) * radius * 0.78,
		weight: 1 + (sequence % 18),
		cluster: center.cluster
	};
});

export function scatterChartUsageExample(
	variant: 'points' | 'hexbin',
	sizeScale: ChartScatterSizeScaleShortcut,
	analysisUsage: ScatterAnalysisUsage,
	tooltip: boolean
): ChartUsageExample<ScatterRow> {
	let analysis: readonly [ChartScatterAnalysis, ...ChartScatterAnalysis[]] | undefined;
	if (analysisUsage === 'regression') {
		analysis = [{ type: 'regression', scope: 'plot', color: 'secondary' }];
	}
	if (analysisUsage === 'confidence') {
		analysis = [
			{
				type: 'regression',
				scope: 'plot',
				color: 'secondary',
				interval: { type: 'confidence', level: 0.95 }
			}
		];
	}
	if (analysisUsage === 'prediction') {
		analysis = [
			{
				type: 'regression',
				scope: 'plot',
				color: 'secondary',
				interval: { type: 'prediction', level: 0.95 }
			}
		];
	}
	if (analysisUsage === 'median') {
		analysis =
			variant === 'hexbin'
				? [
						{
							type: 'reference',
							statistic: 'median',
							axis: 'y',
							scope: 'plot',
							color: 'secondary'
						}
					]
				: [{ type: 'reference', statistic: 'median', axis: 'y', scope: 'series' }];
	}
	return {
		data: scatterRows,
		props: {
			x: {
				scale: { type: 'linear', domain: [0, 100] },
				axis: { label: 'Signal A' },
				grid: true
			},
			y: {
				scale: { type: 'linear', domain: [0, 100] },
				axis: { label: 'Signal B' },
				grid: true
			},
			marks:
				variant === 'hexbin'
					? [
							{
								type: 'scatter',
								variant,
								x: 'x',
								y: 'y',
								radius: 13,
								color: 'primary',
								analysis
							}
						]
					: [
							{
								type: 'scatter',
								variant,
								x: 'x',
								y: 'y',
								colorBy: 'cluster',
								size: 'weight',
								sizeScale,
								fillOpacity: 0.58,
								analysis
							}
						],
			tooltip
		}
	};
}

type ContributionRow = {
	date: Date;
	week: string;
	weekday: string;
	contributions: number;
};

const contributionWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const contributionWeeks = Array.from(
	{ length: 16 },
	(_value, index) => `W${String(index + 1).padStart(2, '0')}`
);
const contributionRows: readonly ContributionRow[] = contributionWeeks.flatMap((week, weekIndex) =>
	contributionWeekdays.map((weekday, weekdayIndex) => ({
		date: new Date(Date.UTC(2026, 0, 5 + weekIndex * 7 + weekdayIndex)),
		week,
		weekday,
		contributions:
			(weekIndex + weekdayIndex) % 6 === 0 ? 0 : (weekIndex * 3 + weekdayIndex * 5 + 2) % 15
	}))
);
const contributionDateFormat = new Intl.DateTimeFormat('en', {
	month: 'short',
	day: 'numeric',
	year: 'numeric',
	timeZone: 'UTC'
});

export function matrixChartUsageExample(
	variant: ChartMatrixVariant,
	tooltip: boolean
): ChartUsageExample<ContributionRow> {
	const matrixTooltip: ChartProps<ContributionRow>['tooltip'] = tooltip
		? {
				groupBy: false,
				fields: [
					{
						field: 'date',
						label: 'Date',
						format: (value: Date) => contributionDateFormat.format(value)
					},
					{ field: 'contributions', label: 'Contributions' }
				] as const
			}
		: false;
	if (variant === 'calendar') {
		return {
			data: contributionRows,
			props: {
				marks: [
					{
						type: 'matrix',
						variant,
						date: 'date',
						value: 'contributions',
						color: 'success',
						colorScale: { type: 'quantize', domain: [0, 14] },
						inset: 1.5,
						radius: 3
					}
				],
				tooltip: matrixTooltip
			}
		};
	}
	return {
		data: contributionRows,
		props: {
			x: {
				scale: { type: 'band', domain: contributionWeeks, padding: 0.08 },
				axis: { label: 'Week' }
			},
			y: {
				scale: { type: 'band', domain: contributionWeekdays, padding: 0.08 },
				axis: { label: 'Day' }
			},
			marks: [
				{
					type: 'matrix',
					variant,
					x: 'week',
					y: 'weekday',
					value: 'contributions',
					color: 'success',
					colorScale: { type: 'quantize', domain: [0, 14] },
					inset: 1.5,
					radius: 3
				}
			],
			tooltip: matrixTooltip
		}
	};
}

function seriesChartUsageExample(options: MetricChartUsageOptions): ChartUsageExample<MetricRow> {
	const interval = options.interval && !options.area;
	const analysis = resolveSeriesAnalysis(options.seriesAnalysis);
	const isStackedArea = options.area && analysis === undefined;
	const common = {
		type: 'series',
		x: 'quarter',
		y: 'value',
		series: 'product',
		colorBy: 'product',
		line: options.line,
		points: options.points,
		strokeWidth: 2.5
	} as const;
	return {
		data: metricRows,
		props: {
			x: metricCartesianPosition.x,
			y: isStackedArea
				? { ...metricCartesianPosition.y, scale: { type: 'linear', domain: [0, 180] } }
				: metricCartesianPosition.y,
			marks: options.area
				? [
						{
							...common,
							area: true,
							layout: isStackedArea ? { type: 'stack' } : undefined,
							analysis,
							fillOpacity: 0.7
						}
					]
				: [
						{
							...common,
							area: false,
							analysis,
							interval: interval
								? {
										lower: 'intervalLow',
										upper: 'intervalHigh',
										fillOpacity: 0.18
									}
								: undefined
						}
					],
			tooltip: options.tooltip
		}
	};
}

function barChartUsageExample(
	variant: 'group' | 'stack',
	normalize: boolean,
	analysisUsage: BarAnalysisUsage,
	tooltip: boolean
): ChartUsageExample<MetricRow> {
	const common = {
		type: 'bar',
		x: 'quarter',
		y: 'value',
		series: 'product',
		colorBy: 'product',
		radius: 3
	} as const;
	let y: ChartProps<MetricRow>['y'] = metricCartesianPosition.y;
	if (variant === 'stack') {
		y = { ...metricCartesianPosition.y, scale: { type: 'linear', domain: [0, 180] } };
	}
	if (variant === 'stack' && normalize) {
		y = {
			scale: { type: 'linear', domain: [0, 1] },
			axis: {
				label: 'Share',
				ticks: {
					format: (value: string | number | Date) =>
						typeof value === 'number' ? `${Math.round(value * 100)}%` : String(value)
				}
			},
			grid: true
		};
	}
	const stackOffset = normalize ? 'normalize' : undefined;
	let analysis: readonly [ChartBarAnalysis, ...ChartBarAnalysis[]] | undefined;
	if (variant === 'group' && analysisUsage === 'mean') {
		analysis = [{ type: 'reference', statistic: 'mean', scope: 'series' }];
	}
	if (variant === 'group' && analysisUsage === 'median') {
		analysis = [{ type: 'reference', statistic: 'median', scope: 'series' }];
	}
	const marks: ChartProps<MetricRow>['marks'] =
		variant === 'group'
			? [{ ...common, variant, padding: 0.12, analysis }]
			: [{ ...common, variant, offset: stackOffset }];
	return {
		data: metricRows,
		props: {
			x: {
				scale: { type: 'band', padding: 0.18 },
				axis: { label: 'Quarter' }
			},
			y,
			marks,
			tooltip
		}
	};
}

type PolarChartUsageOptions = {
	line: boolean;
	area: boolean;
	points: boolean;
	guides: boolean;
	tooltip: boolean;
};

export function polarChartUsageExample(
	variant: ChartPolarVariant,
	options: PolarChartUsageOptions
): ChartUsageExample<MetricRow> {
	if (variant === 'radial-bar' || variant === 'rose') {
		return {
			data: metricRows.filter((row) => row.product === 'Platform'),
			props: {
				marks: [
					{
						type: 'polar',
						variant,
						angle: 'quarter',
						radius: 'value',
						colorBy: 'quarter',
						domain: [0, 80],
						guides: options.guides,
						innerRadius: variant === 'radial-bar' ? 0.14 : 0,
						fillOpacity: 0.82,
						cornerRadius: 3
					}
				],
				tooltip: options.tooltip
			}
		};
	}
	return {
		data: metricRows,
		props: {
			marks: [
				{
					type: 'polar',
					variant,
					angle: 'quarter',
					radius: 'value',
					series: 'product',
					colorBy: 'product',
					domain: [0, 80],
					guides: options.guides,
					area: options.area,
					line: options.line,
					points: options.points,
					fillOpacity: 0.12,
					strokeWidth: 2
				}
			],
			tooltip: options.tooltip
		}
	};
}

type DistributionRow = {
	region: string;
	responseTime: number;
};

const distributionGroups = [
	{ region: 'Europe', center: 121, spread: 16 },
	{ region: 'Americas', center: 145, spread: 22 },
	{ region: 'Asia Pacific', center: 108, spread: 14 }
] as const;

const distributionRows: readonly DistributionRow[] = distributionGroups.flatMap((group) =>
	Array.from({ length: 36 }, (_value, index) => ({
		region: group.region,
		responseTime: Math.round(
			group.center +
				Math.sin(index * 1.73) * group.spread * 0.62 +
				Math.cos(index * 0.47) * group.spread * 0.38
		)
	}))
);

export function distributionChartUsageExample(
	variant: ChartDistributionVariant,
	analysisUsage: DistributionAnalysisUsage,
	tooltip: boolean
): ChartUsageExample<DistributionRow> {
	let analysis:
		| readonly [ChartDistributionReferenceAnalysis, ...ChartDistributionReferenceAnalysis[]]
		| undefined;
	if (analysisUsage === 'mean') {
		analysis = [{ type: 'reference', statistic: 'mean', scope: 'plot', color: 'secondary' }];
	}
	if (analysisUsage === 'median') {
		analysis = [{ type: 'reference', statistic: 'median', scope: 'plot', color: 'secondary' }];
	}
	if (analysisUsage === 'p90') {
		analysis = [
			{ type: 'reference', statistic: 'quantile', quantile: 0.9, scope: 'plot', color: 'secondary' }
		];
	}
	if (analysisUsage === 'deviation') {
		analysis = [
			{
				type: 'reference',
				statistic: 'standard-deviation',
				scope: 'plot',
				color: 'secondary',
				fillOpacity: 0.1
			}
		];
	}
	const variantType = typeof variant === 'string' ? variant : variant.type;
	const isEmpirical =
		variantType === 'histogram' || variantType === 'density' || variantType === 'ecdf';
	if (isEmpirical) {
		const statisticLabel = variantType === 'histogram' ? 'Samples' : 'Density';
		let statisticAxis: ChartProps<DistributionRow>['y'] = {
			scale: { type: 'linear' },
			axis: { label: statisticLabel },
			grid: true
		};
		if (variantType === 'ecdf') {
			statisticAxis = {
				scale: { type: 'linear', domain: [0, 1] },
				axis: {
					label: 'Cumulative proportion',
					ticks: {
						format: (value: string | number | Date) =>
							typeof value === 'number' ? `${Math.round(value * 100)}%` : String(value)
					}
				},
				grid: true
			};
		}
		return {
			data: distributionRows,
			props: {
				x: {
					scale: { type: 'linear', domain: [80, 180] },
					axis: { label: 'Response time (ms)' }
				},
				y: statisticAxis,
				marks: [
					{ type: 'distribution', variant, group: 'region', value: 'responseTime', analysis }
				],
				tooltip
			}
		};
	}
	return {
		data: distributionRows,
		props: {
			x: {
				scale: { type: 'band', padding: 0.2 },
				axis: { label: 'Region' }
			},
			y: {
				scale: { type: 'linear', domain: [80, 180] },
				axis: { label: 'Response time (ms)' },
				grid: true
			},
			marks: [
				{
					type: 'distribution',
					variant,
					group: 'region',
					value: 'responseTime',
					analysis
				}
			],
			tooltip
		}
	};
}

function resolveSeriesAnalysis(
	usage: SeriesAnalysisUsage
): readonly [ChartSeriesAnalysis, ...ChartSeriesAnalysis[]] | undefined {
	if (usage === 'median') {
		return [{ type: 'reference', statistic: 'median', scope: 'series' }];
	}
	if (usage === 'rolling-mean') {
		return [{ type: 'rolling', statistic: 'mean', window: 3, scope: 'series' }];
	}
	if (usage === 'rolling-median') {
		return [{ type: 'rolling', statistic: 'median', window: 3, scope: 'series' }];
	}
	return undefined;
}

type ProportionRow = {
	category: string;
	value: number;
};

const proportionRows: readonly ProportionRow[] = [
	{ category: 'Platform', value: 42 },
	{ category: 'Services', value: 29 },
	{ category: 'Partners', value: 18 },
	{ category: 'Other', value: 11 }
];

export function proportionChartUsageExample(
	variant: ChartProportionVariant,
	tooltip: boolean
): ChartUsageExample<ProportionRow> {
	return {
		data: proportionRows,
		props: {
			marks: [{ type: 'proportion', variant, category: 'category', value: 'value' }],
			tooltip
		}
	};
}

type RelationRow = {
	id: string;
	label: string;
	group: string;
	parent?: string;
	relations: readonly ChartWeightedRelationLink[];
};

const relationRows: readonly RelationRow[] = [
	{
		id: 'business',
		label: 'Business',
		group: 'Core',
		relations: [
			{ target: 'platform', value: 55 },
			{ target: 'services', value: 30 },
			{ target: 'partners', value: 15 }
		]
	},
	{
		id: 'platform',
		label: 'Platform',
		group: 'Product',
		parent: 'business',
		relations: [
			{ target: 'enterprise', value: 35 },
			{ target: 'self-serve', value: 20 }
		]
	},
	{
		id: 'services',
		label: 'Services',
		group: 'Services',
		parent: 'business',
		relations: [
			{ target: 'advisory', value: 18 },
			{ target: 'support', value: 12 }
		]
	},
	{
		id: 'partners',
		label: 'Partners',
		group: 'Ecosystem',
		parent: 'business',
		relations: [{ target: 'ecosystem', value: 15 }]
	},
	{
		id: 'enterprise',
		label: 'Enterprise',
		group: 'Product',
		parent: 'platform',
		relations: []
	},
	{
		id: 'self-serve',
		label: 'Self-serve',
		group: 'Product',
		parent: 'platform',
		relations: []
	},
	{
		id: 'advisory',
		label: 'Advisory',
		group: 'Services',
		parent: 'services',
		relations: []
	},
	{
		id: 'support',
		label: 'Support',
		group: 'Services',
		parent: 'services',
		relations: []
	},
	{
		id: 'ecosystem',
		label: 'Ecosystem',
		group: 'Ecosystem',
		parent: 'partners',
		relations: []
	}
];

export function relationChartUsageExample(
	variant: ChartRelationVariant,
	options: { labels: boolean; tooltip: boolean }
): ChartUsageExample<RelationRow> {
	const labels = options.labels ? ({ text: 'label' } as const) : false;
	if (variant === 'tree') {
		return {
			data: relationRows,
			props: {
				marks: [
					{
						type: 'relation',
						nodeId: 'id',
						colorBy: 'group',
						labels,
						variant,
						parent: 'parent',
						nodeRadius: 6
					}
				],
				tooltip: options.tooltip
			}
		};
	}
	if (variant === 'network') {
		return {
			data: relationRows,
			props: {
				marks: [
					{
						type: 'relation',
						nodeId: 'id',
						colorBy: 'group',
						labels,
						variant,
						relations: 'relations',
						nodeRadius: 7
					}
				],
				tooltip: options.tooltip
			}
		};
	}
	return {
		data: relationRows,
		props: {
			marks: [
				{
					type: 'relation',
					nodeId: 'id',
					colorBy: 'group',
					labels,
					variant,
					relations: 'relations',
					align: 'justify',
					nodeWidth: 18,
					nodeGap: 20,
					nodeRadius: 3
				}
			],
			tooltip: options.tooltip
		}
	};
}
