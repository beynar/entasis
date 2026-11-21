import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// The sparkline is drawn in `currentColor`: without a `color` it takes the color of the text
// round it, so it reads in the ink of a Stat, a table cell or a button.
const defaultSparklineRoot = cva({
	base: 'relative inline-flex shrink-0 items-center align-middle',
	variants: {
		size: {
			small: 'h-6 w-16',
			normal: 'h-8 w-24',
			large: 'h-12 w-32'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The box the series is drawn in. It is inset by half the widest mark, so a stroke or a dot on
// the edge of the scale stays inside the root.
const defaultSparklinePlot = cva({
	base: 'relative min-w-0 flex-1 self-stretch'
});

const defaultSparklineSvg = cva({
	base: 'absolute block overflow-visible'
});

// The area's fill is a gradient of the series color, set on the element: a fill class would
// replace it.
const defaultSparklineArea = cva({ base: '' });

const defaultSparklineLine = cva({ base: 'fill-none stroke-current' });

// Under the pointer, the other bars step back.
const defaultSparklineBar = cva({
	base: 'fill-current transition-opacity duration-fast data-dimmed:opacity-40'
});

const defaultSparklineDot = cva({ base: 'fill-none stroke-current' });

const defaultSparklineMarker = cva({
	base: 'fill-none stroke-current',
	variants: {
		marker: {
			min: 'text-danger-readable',
			max: 'text-success-readable',
			first: '',
			last: ''
		}
	}
});

// The value under the pointer: a hairline across the scale and a dot on the value.
const defaultSparklineCursor = cva({ base: 'fill-none stroke-current opacity-30' });

const defaultSparklineCursorDot = cva({ base: 'fill-none stroke-current' });

// The tooltip takes the color of the series: \`inherit\` fills it with the series' own ink (the
// color of the text round the sparkline) and writes on it in the surface color; a semantic color
// fills it with that color. Its text sits in \`tooltipText\`, so the fill can read the inherited
// ink while the text sets its own.
const defaultSparklineTooltip = cva({
	base: 'pointer-events-none absolute bottom-full z-10 mb-xs inline-flex items-center whitespace-nowrap rounded-full font-medium tabular-nums',
	variants: {
		size: {
			small: 'h-5 px-md text-xs',
			normal: 'h-6 px-md text-xs',
			large: 'h-control-sm px-lg text-sm'
		},
		color: {
			inherit: 'bg-current',
			primary: 'bg-primary',
			secondary: 'bg-secondary',
			neutral: 'bg-neutral',
			danger: 'bg-danger',
			success: 'bg-success',
			warning: 'bg-warning',
			info: 'bg-info'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'inherit'
	}
});

const defaultSparklineTooltipText = cva({
	base: 'inline-flex items-center gap-xs',
	variants: {
		color: {
			inherit: 'text-surface',
			primary: 'text-primary-contrast',
			secondary: 'text-secondary-contrast',
			neutral: 'text-neutral-contrast',
			danger: 'text-danger-contrast',
			success: 'text-success-contrast',
			warning: 'text-warning-contrast',
			info: 'text-info-contrast'
		}
	},
	defaultVariants: {
		color: 'inherit'
	}
});

const defaultSparklineTooltipLabel = cva({ base: 'opacity-70' });

const defaultSparklineTrend = cva({
	base: 'pointer-events-none absolute inline-flex items-center [&_svg]:shrink-0',
	variants: {
		size: {
			small: '[&_svg]:size-icon-xs',
			normal: '[&_svg]:size-icon-sm',
			large: '[&_svg]:size-icon-md'
		},
		trend: {
			up: 'text-success-readable',
			down: 'text-danger-readable',
			neutral: 'text-current/70'
		}
	},
	defaultVariants: {
		size: 'normal',
		trend: 'neutral'
	}
});

export const sparklineTheme = {
	root: defaultSparklineRoot,
	plot: defaultSparklinePlot,
	svg: defaultSparklineSvg,
	area: defaultSparklineArea,
	line: defaultSparklineLine,
	bar: defaultSparklineBar,
	dot: defaultSparklineDot,
	marker: defaultSparklineMarker,
	cursor: defaultSparklineCursor,
	cursorDot: defaultSparklineCursorDot,
	tooltip: defaultSparklineTooltip,
	tooltipText: defaultSparklineTooltipText,
	tooltipLabel: defaultSparklineTooltipLabel,
	trend: defaultSparklineTrend
};

export type SparklineTheme = typeof sparklineTheme;
export type SparklineThemeProps = InferComponentTheme<SparklineTheme>;
export const setSparklineTheme = setComponentTheme<SparklineTheme>('sparkline');
export const useSparklineTheme = useComponentTheme<SparklineTheme>('sparkline', sparklineTheme);
