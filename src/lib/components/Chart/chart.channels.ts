import type { ChannelAccessor, ChartTheme, VisualChannel } from '@tanstack/charts';
import type {
	ChartChannel,
	ChartColor,
	ChartKey,
	ChartRequiredChannel,
	ChartValue,
	ChartVisual
} from './chart.props.js';

export type CompilableChartChannel<TRow, TValue> =
	string | ((row: TRow, index: number, rows: readonly TRow[]) => TValue | null | undefined);

type CompilableRequiredChartChannel<TRow, TValue> =
	string | ((row: TRow, index: number, rows: readonly TRow[]) => TValue);

export type CompiledChartChannel<TRow, TValue> = ChannelAccessor<TRow, TValue | null | undefined>;

const SEMANTIC_COLORS = new Set([
	'primary',
	'secondary',
	'danger',
	'success',
	'warning',
	'info',
	'neutral'
]);

export const DEFAULT_CHART_PALETTE = [
	'var(--color-primary)',
	'var(--color-secondary)',
	'var(--color-success)',
	'var(--color-warning)',
	'var(--color-danger)',
	'var(--color-info)',
	'var(--color-neutral)'
] as const;

export function compileChartTheme(palette: readonly ChartColor[] | undefined): ChartTheme {
	return {
		foreground: 'var(--color-neutral)',
		muted: 'var(--color-neutral)',
		grid: 'var(--color-neutral)',
		background: 'var(--color-surface)',
		palette: palette?.map(compileColor) ?? DEFAULT_CHART_PALETTE
	};
}

export function compileMarkChannels<TRow extends object>(
	mark: {
		id?: string;
		key?: ChartRequiredChannel<TRow, ChartKey>;
		series?: ChartChannel<TRow, ChartKey> | ChartRequiredChannel<TRow, ChartKey>;
		colorBy?: ChartChannel<TRow, ChartKey> | ChartRequiredChannel<TRow, ChartKey>;
	},
	fallbackSeries?: ChartChannel<TRow, ChartKey>
) {
	return {
		id: mark.id,
		key: compileKeyChannel(mark.key),
		z: compileOptionalChannel(mark.series ?? mark.colorBy ?? fallbackSeries),
		color: compileOptionalChannel(mark.colorBy)
	};
}

export function compileChannel<TRow extends object, TValue>(
	channel: CompilableChartChannel<TRow, TValue>
): CompiledChartChannel<TRow, TValue> {
	if (typeof channel === 'function') {
		return (row, { index, data }) => channel(row, index, data);
	}
	// ChartField guarantees this property has the requested value type; Reflect cannot retain
	// that mapped-type relationship once the field is translated into a runtime accessor.
	return (row) => Reflect.get(row, channel) as TValue | null | undefined;
}

export function compileOptionalChannel<TRow extends object, TValue>(
	channel: CompilableChartChannel<TRow, TValue> | undefined
): CompiledChartChannel<TRow, TValue> | undefined {
	return channel === undefined ? undefined : compileChannel(channel);
}

function compileValueOrChannel<TRow extends object, TValue>(
	value: TValue | CompilableChartChannel<TRow, TValue> | undefined,
	isConstant: (candidate: TValue | CompilableChartChannel<TRow, TValue>) => candidate is TValue
): TValue | ReturnType<typeof compileChannel<TRow, TValue>> | undefined {
	if (value === undefined || isConstant(value)) return value;
	return compileChannel(value);
}

export function compileNumberOrChannel<TRow extends object>(
	value: number | ChartChannel<TRow, number> | undefined
): number | ReturnType<typeof compileChannel<TRow, number>> | undefined {
	if (value === undefined || typeof value === 'number') return value;
	return compileChannel<TRow, number>(value);
}

export function compileNumberOrValueChannel<TRow extends object>(
	value: number | ChartChannel<TRow, ChartValue>
): number | ReturnType<typeof compileChannel<TRow, ChartValue>> {
	return typeof value === 'number' ? value : compileChannel(value);
}

export function compileKeyChannel<TRow extends object>(
	channel: CompilableRequiredChartChannel<TRow, ChartKey>
): ChannelAccessor<TRow, ChartKey>;
export function compileKeyChannel<TRow extends object>(
	channel: CompilableRequiredChartChannel<TRow, ChartKey> | undefined
): ChannelAccessor<TRow, ChartKey> | undefined;
export function compileKeyChannel<TRow extends object>(
	channel: CompilableRequiredChartChannel<TRow, ChartKey> | undefined
): ChannelAccessor<TRow, ChartKey> | undefined {
	if (channel === undefined) return undefined;
	if (typeof channel === 'function') {
		return (row, { index, data }) => channel(row, index, data);
	}
	return (row) => Reflect.get(row, channel) as ChartKey;
}

export function compileColorVisual<TRow>(
	color: ChartVisual<TRow, ChartColor> | undefined
): VisualChannel<TRow, string> | undefined {
	if (typeof color !== 'function') return color === undefined ? undefined : compileColor(color);
	return (row, { index, data }) => compileColor(color(row, index, data));
}

export function compileOptionalColor(color: ChartColor | undefined): string | undefined {
	return color === undefined ? undefined : compileColor(color);
}

export function compileColor(color: ChartColor): string {
	return SEMANTIC_COLORS.has(color) ? `var(--color-${color})` : color;
}

export function chartKeyIdentity(value: ChartKey): string {
	return `${typeof value}:${String(value)}`;
}
