import type { WithAttachments } from '$lib/types/props.js';
import type { ChartThemeProps } from './chart.theme.js';
import type {
	ChartColor,
	ChartKey,
	ChartMargin,
	ChartPositionDefinition,
	ChartValue
} from './chart.core.js';
import type { ChartFrameDefinition } from './chart.geometry.props.js';
import type { ChartMark } from './chart.mark.props.js';
import type { ChartViewport } from './chart.viewport.props.js';

export type * from './chart.annotation.props.js';
export type * from './chart.analysis.props.js';
export type * from './chart.core.js';
export type * from './chart.geometry.props.js';
export type * from './chart.mark.props.js';
export type * from './chart.polar.props.js';
export type * from './chart.relation.props.js';
export type * from './chart.scatter.props.js';
export type * from './chart.series.props.js';
export type * from './chart.statistical.props.js';
export type * from './chart.viewport.props.js';

type ChartScalarField<TRow> = {
	[TKey in Extract<keyof TRow, string>]-?: NonNullable<TRow[TKey]> extends ChartValue
		? TKey
		: never;
}[Extract<keyof TRow, string>];

export type ChartTooltipField<TRow> = {
	[TKey in ChartScalarField<TRow>]: {
		field: TKey;
		label?: string;
		format?: (value: TRow[TKey], row: TRow) => string;
	};
}[ChartScalarField<TRow>];

export type ChartTooltipPlacement =
	| 'auto'
	| 'top'
	| 'top-right'
	| 'right'
	| 'bottom-right'
	| 'bottom'
	| 'bottom-left'
	| 'left'
	| 'top-left';

export type ChartTooltipDefinition<TRow> = {
	fields?: readonly [ChartTooltipField<TRow>, ...ChartTooltipField<TRow>[]];
	groupBy?: 'x' | 'y' | false;
	placement?: ChartTooltipPlacement;
	offset?: number;
	/**
	 * Controlled pinned row. A pinned row shows its tooltip without hover, hover moves the
	 * tooltip normally, and pointer leave restores the pinned row. The row is identified by
	 * the mark's `key` channel when it has one and by its x value otherwise; `null` pins
	 * nothing.
	 */
	value?: ChartKey | null;
	/** Initially pinned row. Omit to start with no pinned row. */
	defaultValue?: ChartKey | null;
	/** Called after a click proposes a new pinned row, `null` when the row is unpinned. */
	onValueChange?: (value: ChartKey | null) => void;
};

export type ChartLegendDefinition = {
	/** Place the legend above or below the plot. Defaults to bottom. */
	placement?: 'top' | 'bottom';
	/** Align the legend within the plot width. Defaults to left. */
	align?: 'left' | 'center' | 'right';
	/** Arrange categorical legend entries. Defaults to horizontal; numeric ramps stay horizontal. */
	orientation?: 'horizontal' | 'vertical';
	/** Legend title, or accessible name for the series visibility controls. */
	label?: string;
	/** Display text for one series key, in the legend and in the tooltip series label. */
	format?: (key: ChartKey) => string;
	/** Let users hide and show categorical series. Numeric legends stay static. */
	interactive?: boolean;
	/** Controlled visible series keys. Omit to let Chart own visibility. */
	value?: readonly ChartKey[];
	/** Initial visible series keys. Defaults to all series. */
	defaultValue?: readonly ChartKey[];
	/** Called after the user proposes a new set of visible series. */
	onValueChange?: (value: readonly ChartKey[]) => void;
};

export type ChartLegend = boolean | ChartLegendDefinition;

/**
 * Series colors. The array form is consumed in series-discovery order; the record form
 * names a color per series key and falls back to the default palette for the rest.
 */
export type ChartPalette =
	readonly [ChartColor, ...ChartColor[]] | Readonly<Record<string, ChartColor>>;

export type ChartProps<TRow extends object> = WithAttachments<{
	/** Rows shared by the chart marks; accessors read from this collection. */
	data: readonly TRow[];
	/** One or more marks that define how rows are encoded and drawn. */
	marks: readonly [ChartMark<TRow>, ...ChartMark<TRow>[]];
	/** Horizontal position scale and axis configuration. */
	x?: ChartPositionDefinition;
	/** Vertical position scale and axis configuration. */
	y?: ChartPositionDefinition;
	/** Show the chart guide lines. */
	guides?: boolean;
	/** Clip mark geometry to the plot bounds. */
	clip?: boolean;
	/** Show or configure the plot frame. */
	frame?: boolean | ChartFrameDefinition;
	/** Outer plot margins in pixels, applied uniformly or per edge. */
	margin?: number | Partial<ChartMargin>;
	/** Series colors, ordered by series discovery or named per series key. */
	palette?: ChartPalette;
	/** Show a color legend or configure categorical series visibility. */
	legend?: ChartLegend;
	/** Enable tooltips or configure their fields, grouping, and placement. */
	tooltip?: boolean | ChartTooltipDefinition<TRow>;
	/** Interactive viewport, zoom bounds, and pan configuration. */
	viewport?: ChartViewport;
	/** Required accessible name for the chart. */
	label: string;
	/** Additional accessible description of the plotted data. */
	ariaDescription?: string;
	/** Plot height in pixels. Sizes the chart and its server-rendered SVG. */
	height?: number;
	/** Plot width-to-height ratio. Sizes the chart and its server-rendered SVG. */
	aspectRatio?: number;
	/** Bindable reference to the chart root element. */
	ref?: HTMLElement | null;
	/** Additional classes on the chart root. */
	class?: string;
	/** Overrides for the chart theme parts. */
	theme?: ChartThemeProps;
}>;
