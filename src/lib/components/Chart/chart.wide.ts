import type { ChartKey, ChartRequiredChannel } from './chart.props.js';

/**
 * Wide data support. A stacked mark can read its value from a list of numeric fields
 * instead of a long-format `series` channel: the rows are melted here into one row per
 * field, the field name becoming the series key. A melted row keeps every original
 * property, so tooltip fields, colors, and visual channels declared against the source row
 * keep working unchanged.
 */

const WIDE_SERIES_CHANNEL = '__entasisSeries';
const WIDE_VALUE_CHANNEL = '__entasisValue';

export type ChartWideRow<TRow> = TRow & {
	readonly __entasisSeries: string;
	readonly __entasisValue: number | null;
};

export function isWideChannel(channel: unknown): channel is readonly string[] {
	return Array.isArray(channel);
}

/**
 * One row per source row per field, in field order, so the default `input` stack order and
 * the series-discovery order that assigns colors both follow the declared field list.
 */
export function meltWideRows<TRow extends object>(
	data: readonly TRow[],
	fields: readonly string[],
	path: string
): readonly ChartWideRow<TRow>[] {
	if (fields.length === 0) {
		throw new TypeError(`[Chart] ${path} must list at least one field.`);
	}
	const seen = new Set<string>();
	for (const field of fields) {
		if (seen.has(field)) {
			throw new TypeError(`[Chart] ${path} lists the field "${field}" twice.`);
		}
		seen.add(field);
	}
	const rows: ChartWideRow<TRow>[] = [];
	for (const row of data) {
		for (const field of fields) {
			const value = Reflect.get(row, field) as unknown;
			if (value !== null && value !== undefined && typeof value !== 'number') {
				throw new TypeError(`[Chart] ${path} field "${field}" must hold numeric values.`);
			}
			rows.push({
				...row,
				[WIDE_SERIES_CHANNEL]: field,
				[WIDE_VALUE_CHANNEL]: value ?? null
			} as ChartWideRow<TRow>);
		}
	}
	return rows;
}

/** Series key of a melted row: the field name it was melted from. */
export function wideSeries<TRow>(row: ChartWideRow<TRow>): string {
	return row.__entasisSeries;
}

/** Numeric value of a melted row, read from the field it was melted from. */
export function wideValue<TRow>(row: ChartWideRow<TRow>): number | null {
	return row.__entasisValue;
}

/**
 * Melted rows repeat the source row once per field, so a `key` channel that identifies the
 * source row is qualified with the field name to stay unique across the melted rows.
 */
export function wideKey<TRow extends object>(
	key: ChartRequiredChannel<TRow, ChartKey> | undefined
): ChartRequiredChannel<ChartWideRow<TRow>, ChartKey> | undefined {
	if (key === undefined) return undefined;
	if (typeof key !== 'function') {
		return (row) => `${String(Reflect.get(row, key))}•${row.__entasisSeries}`;
	}
	return (row, index, rows) => `${String(key(row, index, rows))}•${row.__entasisSeries}`;
}
