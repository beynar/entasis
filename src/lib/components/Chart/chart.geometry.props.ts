import type { ChartDataMarkProps } from './chart.annotation.props.js';
import type { ChartChannel, ChartColor, ChartKey, ChartValue } from './chart.core.js';

export type ChartMatrixColorScale = {
	type: 'quantize';
	domain?: readonly [minimum: number, maximum: number];
	range?: readonly [ChartColor, ChartColor, ...ChartColor[]];
};

type ChartMatrixBase<TRow> = ChartDataMarkProps<TRow> & {
	type: 'matrix';
	fillOpacity?: number;
	stroke?: ChartColor;
	strokeWidth?: number;
	inset?: number;
	radius?: number;
};

type ChartGridMatrixMark<TRow> = ChartMatrixBase<TRow> & {
	variant?: 'grid';
	x: ChartChannel<TRow, ChartValue>;
	y: ChartChannel<TRow, ChartValue>;
} & (
		| {
				value?: never;
				color?: never;
				colorScale?: never;
				colorBy?: ChartChannel<TRow, ChartKey>;
				fill?: ChartColor;
		  }
		| {
				value: ChartChannel<TRow, number>;
				color?: ChartColor;
				colorScale?: ChartMatrixColorScale;
				colorBy?: never;
				fill?: never;
		  }
	);

type ChartCalendarMatrixMark<TRow> = ChartMatrixBase<TRow> & {
	variant: 'calendar';
	date: ChartChannel<TRow, Date>;
	value: ChartChannel<TRow, number>;
	color?: ChartColor;
	colorScale?: ChartMatrixColorScale;
};

export type ChartMatrixVariant = 'grid' | 'calendar';
export type ChartMatrixMark<TRow> = ChartGridMatrixMark<TRow> | ChartCalendarMatrixMark<TRow>;

export type ChartFrameDefinition = {
	fill?: ChartColor;
	fillOpacity?: number;
	stroke?: ChartColor;
	strokeOpacity?: number;
	strokeWidth?: number;
	inset?: number;
	radius?: number;
};
