import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultChartRoot = cva({
	base: 'relative w-full min-w-0 text-neutral'
});

const defaultChartPlot = cva({
	base: 'relative size-full min-w-0 [&_.ts-chart]:overflow-visible [&_[data-chart-legend-key]]:!border-neutral-muted [&_[data-chart-legend-key]]:!bg-surface [&_[data-chart-legend-key]]:!text-neutral [&_[data-chart-legend-key]]:!font-sans [&_[data-chart-legend-key]]:!rounded-md [&_[data-chart-legend-key][aria-pressed=true]]:!bg-neutral-muted [&_[data-chart-legend-key]]:focus-visible:outline-primary'
});

const defaultChartTooltip = cva({
	base: 'z-50 !max-w-80 !rounded-md !border-neutral-muted !bg-surface-floating !px-lg !py-md !font-sans !text-xs !leading-tight !font-medium !text-neutral !shadow-xl'
});

export const chartTheme = {
	root: defaultChartRoot,
	plot: defaultChartPlot,
	tooltip: defaultChartTooltip
};

export type ChartTheme = typeof chartTheme;
export type ChartThemeProps = InferComponentTheme<ChartTheme>;
export const setChartTheme = setComponentTheme<ChartTheme>('chart');
export const useChartTheme = useComponentTheme<ChartTheme>('chart', chartTheme);
