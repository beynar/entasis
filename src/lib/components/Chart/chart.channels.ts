import type {
	ChannelAccessor,
	ChartColorScale,
	ChartTheme,
	ResolvedColorScale,
	VisualChannel
} from '@tanstack/charts';
import type {
	ChartChannel,
	ChartColor,
	ChartKey,
	ChartPalette,
	ChartRequiredChannel,
	ChartValue,
	ChartVisual
} from './chart.props.js';

export type CompilableChartChannel<TRow, TValue> =
	string | ((row: TRow, index: number, rows: readonly TRow[]) => TValue | null | undefined);

type CompilableRequiredChartChannel<TRow, TValue> =
	string | ((row: TRow, index: number, rows: readonly TRow[]) => TValue);

export type CompiledChartChannel<TRow, TValue> = ChannelAccessor<TRow, TValue | null | undefined>;

const CHART_COLOR_TOKENS = new Set([
	'primary',
	'secondary',
	'danger',
	'success',
	'warning',
	'info',
	'neutral',
	'surface',
	'surface-recessed',
	'surface-canvas',
	'surface-raised',
	'surface-floating'
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

export function isKeyedPalette(
	palette: ChartPalette | undefined
): palette is Readonly<Record<string, ChartColor>> {
	return palette !== undefined && !Array.isArray(palette);
}

/**
 * Every color a palette can paint, in the order series discovery consumes them. A keyed
 * palette still needs an ordered list for the theme and for the area gradient definitions,
 * so its own colors come first and the default palette backs the unkeyed series.
 */
export function compilePaletteColors(palette: ChartPalette | undefined): readonly string[] {
	if (palette === undefined) return DEFAULT_CHART_PALETTE;
	if (Array.isArray(palette)) return palette.map(compileColor);
	const keyed = Object.values(palette as Record<string, ChartColor>).map(compileColor);
	return [...new Set([...keyed, ...DEFAULT_CHART_PALETTE])];
}

export function compileChartTheme(palette: ChartPalette | undefined): ChartTheme {
	return {
		foreground: 'var(--color-neutral)',
		muted: 'var(--color-neutral)',
		grid: 'var(--color-neutral)',
		background: 'var(--color-surface)',
		// A keyed palette resolves per series through its own color scale; the theme palette
		// stays the ordered fallback used by series the record does not name.
		palette: isKeyedPalette(palette) ? DEFAULT_CHART_PALETTE : compilePaletteColors(palette)
	};
}

/**
 * Categorical color scale for a record palette. It reproduces the native ordinal
 * resolution (domain in series-discovery order) but assigns a named color by key first
 * and only then draws the next unused default color, so a series without an entry keeps
 * the ordered fallback.
 */
export function compileKeyedPaletteScale(
	palette: Readonly<Record<string, ChartColor>>
): ChartColorScale {
	return {
		id: 'svelai-chart-keyed-palette',
		resolve: ({ values, domain: configuredDomain, range: configuredRange, theme }) => {
			const fallback = configuredRange?.length ? configuredRange : theme.palette;
			const domain = uniqueChartKeys(configuredDomain ?? values);
			const colorByKey = new Map<string, string>();
			let fallbackIndex = 0;
			const range = domain.map((key) => {
				const named = Reflect.get(palette, String(key)) as ChartColor | undefined;
				const color =
					named === undefined
						? (fallback[fallbackIndex++ % Math.max(fallback.length, 1)] ?? 'currentColor')
						: compileColor(named);
				colorByKey.set(chartKeyIdentity(key), color);
				return color;
			});
			const resolved: ResolvedColorScale = {
				type: 'ordinal',
				kind: 'categorical',
				domain,
				range,
				map: (value) => {
					if (value === null || value === undefined) return range[0] ?? 'currentColor';
					const known = colorByKey.get(chartKeyIdentity(value));
					if (known !== undefined) return known;
					const color = fallback[fallbackIndex++ % Math.max(fallback.length, 1)] ?? 'currentColor';
					colorByKey.set(chartKeyIdentity(value), color);
					return color;
				}
			};
			return resolved;
		}
	};
}

function uniqueChartKeys(values: readonly unknown[]): readonly ChartKey[] {
	const unique = new Map<string, ChartKey>();
	for (const value of values) {
		if (typeof value !== 'string' && typeof value !== 'number') continue;
		const identity = chartKeyIdentity(value);
		if (!unique.has(identity)) unique.set(identity, value);
	}
	return [...unique.values()];
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
	return CHART_COLOR_TOKENS.has(color) ? `var(--color-${color})` : color;
}

export function chartKeyIdentity(value: ChartKey): string {
	return `${typeof value}:${String(value)}`;
}
