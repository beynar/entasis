<script lang="ts">
	import {
		Chart,
		type ChartLegend,
		type ChartMatrixVariant,
		type ChartPolarVariant,
		type ChartRelationVariant,
		type ChartScatterSizeScaleShortcut
	} from 'svelai/chart';
	import {
		chartUsageMetadata,
		isMetricChartUsageType,
		type BarAnalysisUsage,
		type DistributionAnalysisUsage,
		type ScatterAnalysisUsage,
		type SeriesAnalysisUsage,
		type ChartUsageType
	} from './chartUsageCatalog.js';
	import {
		distributionChartUsageExample,
		matrixChartUsageExample,
		metricChartUsageExample,
		polarChartUsageExample,
		proportionChartUsageExample,
		relationChartUsageExample,
		scatterChartUsageExample
	} from './chartUsageExamples.js';

	let {
		chartType,
		barVariant,
		normalize,
		scatterVariant,
		scatterSizeScale,
		distributionVariant,
		matrixVariant,
		proportionVariant,
		polarVariant,
		relationVariant,
		seriesAnalysis,
		barAnalysis,
		scatterAnalysis,
		distributionAnalysis,
		line,
		area,
		interval,
		points,
		guides,
		labels,
		brushZoom,
		tooltip,
		legend,
		interactiveLegend,
		legendPlacement,
		legendAlign,
		legendOrientation
	}: {
		chartType: ChartUsageType;
		barVariant: 'group' | 'stack';
		normalize: boolean;
		scatterVariant: 'points' | 'hexbin';
		scatterSizeScale: ChartScatterSizeScaleShortcut;
		distributionVariant: 'violin' | 'box' | 'error-bar' | 'histogram' | 'density' | 'ecdf';
		matrixVariant: ChartMatrixVariant;
		proportionVariant: 'pie' | 'donut' | 'waffle';
		polarVariant: ChartPolarVariant;
		relationVariant: ChartRelationVariant;
		seriesAnalysis: SeriesAnalysisUsage;
		barAnalysis: BarAnalysisUsage;
		scatterAnalysis: ScatterAnalysisUsage;
		distributionAnalysis: DistributionAnalysisUsage;
		line: boolean;
		area: boolean;
		interval: boolean;
		points: boolean;
		guides: boolean;
		labels: boolean;
		brushZoom: boolean;
		tooltip: boolean;
		legend: boolean;
		interactiveLegend: boolean;
		legendPlacement: 'top' | 'bottom';
		legendAlign: 'left' | 'center' | 'right';
		legendOrientation: 'horizontal' | 'vertical';
	} = $props();

	const activeMetadata = $derived(chartUsageMetadata[chartType]);
	const metricOptions = $derived({
		line,
		area,
		interval,
		points,
		barVariant,
		normalize,
		labels,
		tooltip,
		seriesAnalysis,
		barAnalysis
	});
	const polarOptions = $derived({ line, area, points, guides, tooltip });
	const initialDimensions = { width: 960, height: 480 } as const;
	const legendOptions: ChartLegend = $derived.by(() => {
		if (!legend || chartType === 'facet') return false;
		let label: string | undefined;
		if (chartType === 'matrix') label = 'Contributions';
		else if (chartType === 'scatter' && scatterVariant === 'hexbin') label = 'Observations';
		return {
			interactive: interactiveLegend,
			placement: legendPlacement,
			align: legendAlign,
			orientation: legendOrientation,
			label
		};
	});
</script>

<div class="grid min-w-0 w-full gap-4">
	<p class="text-neutral/60 mx-auto max-w-3xl text-center text-sm leading-6">
		{activeMetadata.description}
	</p>

	<div class="min-w-0">
		{#if isMetricChartUsageType(chartType)}
			{@const example = metricChartUsageExample(chartType, metricOptions)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				viewport={chartType === 'series' || chartType === 'bar' ? brushZoom : false}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'scatter'}
			{@const example = scatterChartUsageExample(
				scatterVariant,
				scatterSizeScale,
				scatterAnalysis,
				tooltip
			)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				viewport={brushZoom}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'matrix'}
			{@const example = matrixChartUsageExample(matrixVariant, tooltip)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				viewport={matrixVariant === 'grid' && brushZoom}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'distribution'}
			{@const example = distributionChartUsageExample(
				distributionVariant,
				distributionAnalysis,
				tooltip
			)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				viewport={brushZoom}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'proportion'}
			{@const example = proportionChartUsageExample(proportionVariant, tooltip)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'polar'}
			{@const example = polarChartUsageExample(polarVariant, polarOptions)}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{:else if chartType === 'relation'}
			{@const example = relationChartUsageExample(relationVariant, { labels, tooltip })}
			<Chart
				data={example.data}
				{...example.props}
				legend={legendOptions}
				ariaLabel={activeMetadata.ariaLabel}
				{initialDimensions}
				class="w-full"
			/>
		{/if}
	</div>
</div>
