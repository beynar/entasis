<script lang="ts">
	import ComponentCard from '../../ComponentCard.svelte';
	import {
		createComponentControls,
		type ComponentControlValues
	} from '../../componentControls.svelte.js';
	import DocPage from '../../DocPage.svelte';
	import ChartBarsDemo from './ChartBarsDemo.svelte';
	import ChartClientOnlyDemo from './ChartClientOnlyDemo.svelte';
	import ChartLayeredDemo from './ChartLayeredDemo.svelte';
	import ChartPolarDemo from './ChartPolarDemo.svelte';
	import ChartUsageDemo from './ChartUsageDemo.svelte';
	import ChartWideStackDemo from './ChartWideStackDemo.svelte';
	import {
		barAnalysisItems,
		barVariantItems,
		chartUsageItems,
		distributionAnalysisItems,
		distributionVariantItems,
		matrixVariantItems,
		polarVariantItems,
		proportionVariantItems,
		relationVariantItems,
		scatterAnalysisItems,
		scatterVariantItems,
		scatterSizeScaleItems,
		seriesAnalysisItems
	} from './chartUsageCatalog.js';
	import {
		barsCode,
		clientOnlyCode,
		layeredCode,
		polarCode,
		usageCode,
		wideStackCode
	} from './codeSnippets.js';

	function hasPathLayers(value: ComponentControlValues): boolean {
		if (value.chartType === 'series') return true;
		return (
			value.chartType === 'polar' &&
			(value.polarVariant === 'radar' || value.polarVariant === 'circular')
		);
	}

	function hasBrushZoom(value: ComponentControlValues): boolean {
		return (
			value.chartType === 'series' ||
			value.chartType === 'bar' ||
			value.chartType === 'scatter' ||
			value.chartType === 'distribution' ||
			(value.chartType === 'matrix' && value.matrixVariant === 'grid')
		);
	}

	function hasInteractiveLegend(value: ComponentControlValues): boolean {
		return (
			value.chartType === 'series' ||
			value.chartType === 'bar' ||
			(value.chartType === 'scatter' && value.scatterVariant === 'points') ||
			(value.chartType === 'distribution' &&
				['histogram', 'density', 'ecdf'].includes(String(value.distributionVariant)))
		);
	}

	const usageControls = createComponentControls([
		{
			name: 'chartType',
			type: 'segmented',
			label: 'Type',
			value: 'series',
			options: chartUsageItems,
			class: 'overflow-x-auto'
		},
		{
			name: 'barVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'group',
			options: barVariantItems,
			visible: (value) => value.chartType === 'bar'
		},
		{
			name: 'normalize',
			type: 'switch',
			label: 'Normalize',
			value: false,
			visible: (value) => value.chartType === 'bar' && value.barVariant === 'stack'
		},
		{
			name: 'scatterVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'points',
			options: scatterVariantItems,
			visible: (value) => value.chartType === 'scatter'
		},
		{
			name: 'distributionVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'violin',
			options: distributionVariantItems,
			class: 'overflow-x-auto',
			visible: (value) => value.chartType === 'distribution'
		},
		{
			name: 'seriesAnalysis',
			type: 'segmented',
			label: 'Analysis',
			value: 'none',
			options: seriesAnalysisItems,
			class: 'overflow-x-auto',
			visible: (value) => value.chartType === 'series' || value.chartType === 'facet'
		},
		{
			name: 'barAnalysis',
			type: 'segmented',
			label: 'Analysis',
			value: 'none',
			options: barAnalysisItems,
			visible: (value) => value.chartType === 'bar' && value.barVariant === 'group'
		},
		{
			name: 'scatterAnalysis',
			type: 'segmented',
			label: 'Analysis',
			value: 'none',
			options: scatterAnalysisItems,
			class: 'overflow-x-auto',
			visible: (value) => value.chartType === 'scatter'
		},
		{
			name: 'distributionAnalysis',
			type: 'segmented',
			label: 'Analysis',
			value: 'none',
			options: distributionAnalysisItems,
			class: 'overflow-x-auto',
			visible: (value) => value.chartType === 'distribution'
		},
		{
			name: 'scatterSizeScale',
			type: 'segmented',
			label: 'Size scale',
			value: 'sqrt',
			options: scatterSizeScaleItems,
			visible: (value) => value.chartType === 'scatter' && value.scatterVariant === 'points'
		},
		{
			name: 'matrixVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'calendar',
			options: matrixVariantItems,
			visible: (value) => value.chartType === 'matrix'
		},
		{
			name: 'proportionVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'pie',
			options: proportionVariantItems,
			visible: (value) => value.chartType === 'proportion'
		},
		{
			name: 'polarVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'radar',
			options: polarVariantItems,
			visible: (value) => value.chartType === 'polar'
		},
		{
			name: 'relationVariant',
			type: 'segmented',
			label: 'Variant',
			value: 'tree',
			options: relationVariantItems,
			visible: (value) => value.chartType === 'relation'
		},
		{ name: 'line', type: 'switch', label: 'Line', value: true, visible: hasPathLayers },
		{ name: 'area', type: 'switch', label: 'Area', value: false, visible: hasPathLayers },
		{
			name: 'interval',
			type: 'switch',
			label: 'Interval',
			value: true,
			visible: (value) => value.chartType === 'series'
		},
		{ name: 'points', type: 'switch', label: 'Points', value: true, visible: hasPathLayers },
		{
			name: 'guides',
			type: 'switch',
			label: 'Guides',
			value: true,
			visible: (value) => value.chartType === 'polar'
		},
		{
			name: 'labels',
			type: 'switch',
			label: 'Labels',
			value: true,
			visible: (value) => value.chartType === 'relation' || value.chartType === 'facet'
		},
		{
			name: 'brushZoom',
			type: 'switch',
			label: 'Brush zoom',
			value: true,
			visible: hasBrushZoom
		},
		{ name: 'tooltip', type: 'switch', label: 'Tooltip', value: true },
		{
			name: 'legend',
			type: 'switch',
			label: 'Legend',
			value: true,
			visible: (value) => value.chartType !== 'facet'
		},
		{
			name: 'interactiveLegend',
			type: 'switch',
			label: 'Interactive legend',
			value: true,
			visible: (value) => Boolean(value.legend) && hasInteractiveLegend(value)
		},
		{
			name: 'legendPlacement',
			type: 'segmented',
			label: 'Legend placement',
			value: 'bottom',
			options: [
				{ value: 'top', label: 'Top' },
				{ value: 'bottom', label: 'Bottom' }
			],
			visible: (value) => Boolean(value.legend) && value.chartType !== 'facet'
		},
		{
			name: 'legendAlign',
			type: 'segmented',
			label: 'Legend alignment',
			value: 'left',
			options: [
				{ value: 'left', label: 'Left' },
				{ value: 'center', label: 'Center' },
				{ value: 'right', label: 'Right' }
			],
			visible: (value) => Boolean(value.legend) && value.chartType !== 'facet'
		},
		{
			name: 'legendOrientation',
			type: 'segmented',
			label: 'Legend direction',
			value: 'horizontal',
			options: [
				{ value: 'horizontal', label: 'Horizontal' },
				{ value: 'vertical', label: 'Vertical' }
			],
			visible: (value) =>
				Boolean(value.legend) &&
				value.chartType !== 'facet' &&
				value.chartType !== 'matrix' &&
				!(value.chartType === 'scatter' && value.scatterVariant === 'hexbin')
		}
	]);
	let previousArea = usageControls.value.area;

	$effect(() => {
		const area = usageControls.value.area;
		const interval = usageControls.value.interval;
		const didActivateArea = area && !previousArea;
		previousArea = area;
		if (!area || !interval) return;
		usageControls.setValue(didActivateArea ? 'interval' : 'area', false);
	});

	$effect(() => {
		if (!hasPathLayers(usageControls.value)) return;
		if (usageControls.value.line || usageControls.value.area || usageControls.value.points) return;
		usageControls.setValue('line', true);
	});
</script>

<DocPage
	title="Chart"
	subtitle="Typed top-level props for cartesian, polar, relation, and faceted charts without exposing the rendering library."
	component="Chart"
	requires={`pnpm add @tanstack/charts d3-array d3-force d3-hierarchy d3-sankey d3-scale d3-shape
pnpm add -D @types/d3-shape`}
	features={[
		'One shared typed dataset with ordered, layered marks',
		'Summary and empirical distributions through one variant prop',
		'Point and responsive hexbin scatter variants',
		'Derived reference, regression, interval, and rolling analysis layers',
		'Explicit matrix grids and automatic contribution calendars',
		'Pie, donut, and waffle proportions through one variant prop',
		'Tree, network, and Sankey relations through one variant prop',
		'Direct scale, axis, mark, color, curve, and tooltip props',
		'One height or aspectRatio prop that sizes the plot and its SSR markup',
		'Responsive SVG rendering after mount',
		'Grouped pointer tooltip interaction'
	]}
>
	<section class="grid gap-3">
		<h2 class="text-neutral text-xl font-semibold">Direct props, no renderer imports</h2>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Import <code>Chart</code> and its local types from <code>entasis/chart</code>. Every mark reads
			from the same data array and renders in mark order. A semantic <code>series</code> mark
			composes a default line with optional points and either an area or interval layer. Bars use
			their own mark with grouped and stacked variants. A stacked bar uses
			<code>offset="normalize"</code>
			for percentage composition.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Size a chart with <code>height</code> (pixels) or <code>aspectRatio</code>; either one also
			sizes the server-rendered SVG, so there is nothing to keep in sync. Omit both to leave the
			height to the root class and get a stable empty server host that mounts the chart only in the
			browser.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Set <code>viewport</code> to enable TanStack's native x-axis brush. Drag across the plot to zoom,
			then drag again to narrow the window further. Numeric and date axes use continuous selection; category
			axes snap to values and also provide keyboard range handles. Hover tooltips stay active outside
			a drag. The chart animates to the selected window and provides a Reset zoom button. Use the object
			form to configure the transition. Native two-dimensional brushing is not yet available.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Add an <code>analysis</code> array to a series, scatter, bar, or distribution mark. Reference analysis
			derives a mean, median, quantile, or standard-deviation band. Scatter and numeric series can derive
			a linear regression with a confidence or prediction interval. Series can also derive a rolling mean
			or median. Regression intervals use Student-t with the fit's residual degrees of freedom, so small-sample
			intervals are wider. These layers use the same channels and do not add tooltip points.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Every color prop — <code>stroke</code>, <code>fill</code>, a point marker's
			<code>fill</code>, and each <code>palette</code> entry — takes a <code>ChartColor</code>. That
			is the seven semantic roles (<code>primary</code>, <code>secondary</code>,
			<code>danger</code>, <code>success</code>, <code>warning</code>, <code>info</code>,
			<code>neutral</code>) plus the surface elevation family (<code>surface</code>,
			<code>surface-recessed</code>, <code>surface-canvas</code>, <code>surface-raised</code>,
			<code>surface-floating</code>), each resolved to its <code>var(--color-…)</code> token so it
			follows the theme. Anything else passes through as a raw CSS color. The layered forecast below
			knocks its points out of the line with
			<code>{"points: { fill: 'surface' }"}</code> instead of hand-writing
			<code>var(--color-surface)</code>.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Enable <code>tooltip</code> to compare every series at the pointer category or date. The tooltip
			stays inside the chart surface without adding chart focus states.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Enable <code>legend</code> for a categorical color key or a numeric heatmap and hexbin color
			ramp. A categorical legend is the library's own control, not the engine's: the interactive one
			is a <code>ToggleButtonGroup</code> of small ghost toggles, one per series, each carrying a
			swatch of the resolved series color and the <code>format</code> label, pressed while the
			series is visible; the static one is the same swatch and label as plain items. Use
			<code>{'legend={{ interactive: true }}'}</code> for series, bars, scatter points, and
			empirical distributions. Pressing a legend toggle hides that series without changing the axes,
			colors, or stack totals. Other layouts use static legends; facets keep their own labels. Use
			<code>placement</code>
			for top/bottom, <code>align</code> for left/center/right, and
			<code>orientation</code> for horizontal/vertical entries; the legend takes its own row and the
			plot shrinks by it. Numeric color ramps stay horizontal inside the plot. The object form
			accepts <code>placement</code>, <code>label</code>, and controlled <code>value</code>
			with <code>onValueChange</code>, or an initial <code>defaultValue</code>. The row is themed
			through the <code>legend</code>, <code>legendItem</code>, and <code>legendSwatch</code> parts.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Use one <code>distribution</code> mark with <code>group</code> and <code>value</code>
			channels. Change
			<code>variant</code> between <code>violin</code>, <code>box</code>, <code>error-bar</code>,
			<code>histogram</code>, <code>density</code>, and <code>ecdf</code> without changing the raw samples.
			The empirical variants derive bins, kernel density, or cumulative rank internally.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			A <code>scatter</code> mark changes from <code>points</code> to <code>hexbin</code> for dense
			numeric observations. A <code>matrix</code> mark changes from an explicit <code>grid</code> to
			an automatic <code>calendar</code> that derives week and weekday positions from its date channel.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Use one <code>proportion</code> mark with <code>category</code> and <code>value</code>
			channels. Change <code>variant</code> between <code>pie</code>, <code>donut</code>, and
			<code>waffle</code> without precomputing angles or cells.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Use one <code>relation</code> mark for a complete topology. Keep node metadata in the shared
			data rows, then switch <code>variant</code> between <code>tree</code>,
			<code>network</code>, and <code>sankey</code>. Tree reads a parent channel; network and Sankey
			read outgoing relations from each node.
		</p>
		<p class="text-neutral/70 max-w-3xl text-sm leading-6">
			Put annotations on the data mark they explain. Their target uses the parent key or a
			predicate, so arrows, labels, rules, bands, and markers follow the final grouped, stacked,
			polar, or faceted position. Set a band annotation's cross-axis size with
			<code>thickness</code>.
		</p>
	</section>

	<ComponentCard
		controls={usageControls}
		title="Chart type catalog"
		description="Switch the public mark type, its variant, and its boolean composition props without changing the data contract."
		code={usageCode}
		class="min-h-0 items-stretch p-3 md:p-5"
	>
		<ChartUsageDemo
			chartType={usageControls.value.chartType}
			barVariant={usageControls.value.barVariant}
			normalize={usageControls.value.normalize}
			scatterVariant={usageControls.value.scatterVariant}
			scatterSizeScale={usageControls.value.scatterSizeScale}
			distributionVariant={usageControls.value.distributionVariant}
			matrixVariant={usageControls.value.matrixVariant}
			proportionVariant={usageControls.value.proportionVariant}
			polarVariant={usageControls.value.polarVariant}
			relationVariant={usageControls.value.relationVariant}
			seriesAnalysis={usageControls.value.seriesAnalysis}
			barAnalysis={usageControls.value.barAnalysis}
			scatterAnalysis={usageControls.value.scatterAnalysis}
			distributionAnalysis={usageControls.value.distributionAnalysis}
			line={usageControls.value.line}
			area={usageControls.value.area}
			interval={usageControls.value.interval}
			points={usageControls.value.points}
			guides={usageControls.value.guides}
			labels={usageControls.value.labels}
			brushZoom={usageControls.value.brushZoom}
			tooltip={usageControls.value.tooltip}
			legend={usageControls.value.legend}
			interactiveLegend={usageControls.value.interactiveLegend &&
				hasInteractiveLegend(usageControls.value)}
			legendPlacement={usageControls.value.legendPlacement}
			legendAlign={usageControls.value.legendAlign}
			legendOrientation={usageControls.value.legendOrientation}
		/>
	</ComponentCard>

	{#snippet examples()}
		<ComponentCard
			title="Layered revenue forecast"
			description="An SSR-ready forecast line with an explicit confidence interval, actual values, surface-filled points, and the default grouped tooltip."
			code={layeredCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<ChartLayeredDemo />
		</ComponentCard>

		<ComponentCard
			title="Grouped and stacked bars"
			description="The same quarterly rows render as grouped and stacked bars by changing only the marks prop."
			code={barsCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<ChartBarsDemo />
		</ComponentCard>

		<ComponentCard
			title="Wide stack, named colors, pinned tooltip"
			description="A stacked bar reads a list of numeric fields, the palette names a color per series key, legend.format supplies the display text, gap separates the segments, and tooltip.value keeps one month pinned."
			code={wideStackCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<ChartWideStackDemo />
		</ComponentCard>

		<ComponentCard
			title="Polar marks"
			description="A polar mark maps angle and radius channels without importing scale or mark factories."
			code={polarCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<ChartPolarDemo />
		</ComponentCard>

		<ComponentCard
			title="Client-only chart"
			description="Without height or aspectRatio, the server and first hydration render only the stable host. TanStack mounts the SVG after the component reaches the browser."
			code={clientOnlyCode}
			class="min-h-0 items-stretch p-3 md:p-5"
		>
			<ChartClientOnlyDemo />
		</ComponentCard>
	{/snippet}
</DocPage>
