import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// The default box. `height` / `aspectRatio` override it through the root style, and a
// consumer height class replaces it through the class merge.
const defaultChartRoot = cva({
	base: 'relative flex h-80 w-full min-w-0 flex-col text-neutral'
});

// The plot box: it takes what the legend row leaves, and it is what the viewport reset
// control is anchored to (the engine host fills it absolutely, the button sits on top of it,
// so neither can land on the legend row). `min-h-0` lets it shrink inside the column instead
// of pushing the legend out of the box.
const defaultChartPlot = cva({
	base: 'relative min-h-0 w-full min-w-0 flex-1 [&_.ts-chart]:overflow-visible'
});

// The categorical legend row. `placement` orders it against the plot, `align` and
// `orientation` replace what the engine's legend layout used to do for native controls.
// `align` is the cross axis of a vertical legend and the main axis of a horizontal one, so
// the two only resolve together.
const defaultChartLegend = cva({
	base: 'flex shrink-0 flex-wrap gap-xs',
	variants: {
		placement: {
			top: 'order-first pb-sm',
			bottom: 'order-last pt-sm'
		},
		align: {
			left: '',
			center: '',
			right: ''
		},
		orientation: {
			horizontal: 'flex-row items-center',
			vertical: 'flex-col'
		}
	},
	defaultVariants: {
		placement: 'bottom',
		align: 'left',
		orientation: 'horizontal'
	},
	compoundVariants: [
		{ orientation: 'horizontal', align: 'left', class: 'justify-start' },
		{ orientation: 'horizontal', align: 'center', class: 'justify-center' },
		{ orientation: 'horizontal', align: 'right', class: 'justify-end' },
		{ orientation: 'vertical', align: 'left', class: 'items-start' },
		{ orientation: 'vertical', align: 'center', class: 'items-center' },
		{ orientation: 'vertical', align: 'right', class: 'items-end' }
	]
});

// One read-only entry of a static legend: the same swatch and label a toggle button carries.
const defaultChartLegendItem = cva({
	base: 'inline-flex shrink-0 items-center gap-sm px-md text-xs font-medium whitespace-nowrap text-neutral/70'
});

// The series colour chip. Its paint is the resolved series colour, so the theme owns the
// shape only.
const defaultChartLegendSwatch = cva({
	base: 'inline-block size-2.5 shrink-0 rounded-xs'
});

const defaultChartTooltip = cva({
	base: 'z-50 !max-w-80 !rounded-lg !border-neutral-muted !bg-surface-floating !px-lg !py-md !font-sans !text-xs !leading-tight !font-medium !text-neutral !lift-5'
});

// The viewport zoom settle. The chart engine animates it itself, so only the resolved
// `duration` / `easing` are read; reduced motion collapses the duration to 0 and the
// engine snaps instead.
export const defaultChartMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slow',
		easing: 'enter'
	}
});

export const chartTheme = {
	motion: defaultChartMotion,
	root: defaultChartRoot,
	plot: defaultChartPlot,
	legend: defaultChartLegend,
	legendItem: defaultChartLegendItem,
	legendSwatch: defaultChartLegendSwatch,
	tooltip: defaultChartTooltip
};

export type ChartTheme = typeof chartTheme;
export type ChartThemeProps = InferComponentTheme<ChartTheme>;
export const setChartTheme = setComponentTheme<ChartTheme>('chart');
export const useChartTheme = useComponentTheme<ChartTheme>('chart', chartTheme);
export const useChartMotion = () => useComponentMotion('chart', defaultChartMotion);
