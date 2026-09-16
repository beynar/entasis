import type { Colors } from '$lib/types/theme.js';

export type ChartValue = number | string | Date;
export type ChartKey = string | number;

/** Opaque elevation grades, resolved to `var(--color-<name>)` like the semantic roles. */
export type ChartSurfaceColor =
	'surface' | 'surface-recessed' | 'surface-canvas' | 'surface-raised' | 'surface-floating';

export type ChartColor = Colors | ChartSurfaceColor | (string & {});

type ChartField<TRow, TValue> = {
	[TKey in Extract<keyof TRow, string>]-?: TRow[TKey] extends TValue | null | undefined
		? TKey
		: never;
}[Extract<keyof TRow, string>];

type ChartRequiredField<TRow, TValue> = {
	[TKey in Extract<keyof TRow, string>]-?: TRow[TKey] extends TValue ? TKey : never;
}[Extract<keyof TRow, string>];

export type ChartChannel<TRow, TValue> =
	| ChartField<TRow, TValue>
	| ((row: TRow, index: number, rows: readonly TRow[]) => TValue | null | undefined);

export type ChartRequiredChannel<TRow, TValue> =
	ChartRequiredField<TRow, TValue> | ((row: TRow, index: number, rows: readonly TRow[]) => TValue);

export type ChartVisual<TRow, TValue> =
	TValue | ((row: TRow, index: number, rows: readonly TRow[]) => TValue);

/**
 * Wide numeric columns melted into one series per column, the series key being the
 * field name. Accepted wherever a stacked mark reads its value channel.
 */
export type ChartValueFields<TRow> = readonly [
	ChartField<TRow, number>,
	...ChartField<TRow, number>[]
];

export type ChartMargin = { top: number; right: number; bottom: number; left: number };

type ChartContinuousScaleBase<TValue> = {
	domain?: readonly [TValue, TValue];
	clamp?: boolean;
};

export type ChartLinearScale = ChartContinuousScaleBase<number> & { type: 'linear' };
export type ChartSqrtScale = ChartContinuousScaleBase<number> & { type: 'sqrt' };
export type ChartPowerScale = ChartContinuousScaleBase<number> & {
	type: 'pow';
	exponent?: number;
};
export type ChartLogScale = ChartContinuousScaleBase<number> & { type: 'log'; base?: number };
export type ChartSymlogScale = ChartContinuousScaleBase<number> & {
	type: 'symlog';
	constant?: number;
};
export type ChartTimeScale = ChartContinuousScaleBase<Date> & { type: 'time' };
export type ChartUtcScale = ChartContinuousScaleBase<Date> & { type: 'utc' };
export type ChartBandScale = {
	type: 'band';
	domain?: readonly ChartValue[];
	padding?: number;
	paddingInner?: number;
	paddingOuter?: number;
	align?: number;
};
export type ChartPointScale = {
	type: 'point';
	domain?: readonly ChartValue[];
	padding?: number;
	align?: number;
};

export type ChartScaleDefinition =
	| ChartLinearScale
	| ChartSqrtScale
	| ChartPowerScale
	| ChartLogScale
	| ChartSymlogScale
	| ChartTimeScale
	| ChartUtcScale
	| ChartBandScale
	| ChartPointScale;

export type ChartNumericScaleDefinition =
	ChartLinearScale | ChartSqrtScale | ChartPowerScale | ChartLogScale | ChartSymlogScale;

export type ChartAxisTicks = {
	count?: number;
	spacing?: number;
	values?: readonly ChartValue[];
	size?: number;
	padding?: number;
	format?: (value: ChartValue) => string;
};

export type ChartAxisTickLabels = {
	rotate?: number;
	thin?: boolean | { minGap?: number; priority?: 'ends'; keep?: readonly ChartValue[] };
};

export type ChartAxisDefinition = {
	line?: boolean;
	ticks?: false | ChartAxisTicks;
	tickLabels?: false | ChartAxisTickLabels;
	label?: string | { text: string; offset?: number | 'auto' };
};

type ChartPositionBase = {
	reverse?: boolean;
	grid?: boolean;
	axis?: false | ChartAxisDefinition;
};

export type ChartPositionDefinition = ChartPositionBase &
	(
		| {
				scale: Exclude<ChartScaleDefinition, ChartBandScale | ChartPointScale>;
				nice?: boolean | number;
		  }
		| { scale: ChartBandScale | ChartPointScale; nice?: never }
	);

export type ChartCurve =
	| 'linear'
	| 'linear-closed'
	| 'step'
	| 'step-before'
	| 'step-after'
	| 'basis'
	| 'basis-closed'
	| 'cardinal'
	| 'cardinal-closed'
	| 'catmull-rom'
	| 'catmull-rom-closed'
	| 'monotone-x'
	| 'monotone-y'
	| 'natural';
