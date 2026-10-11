/**
 * Value helpers for bounded displays (Meter, Progress, ProgressCircle, Slider, the Toast progress
 * bar): clamping, percentages, locale formatting and the ARIA value text, kept in one place so the
 * fill, the visible text and `aria-valuenow` always describe the same number.
 */
import { formatNumber } from './number.js';

/** Clamps `value` into `[min, max]`. `NaN` reads as `min`; a range with `max < min` collapses to `min`. */
export const clampRange = (value: number, min = 0, max = 100): number => {
	if (Number.isNaN(value)) return min;
	return Math.min(Math.max(value, min), Math.max(min, max));
};

/**
 * Where `value` sits between `min` and `max`, as a percentage clamped to 0–100. An empty range
 * (`max <= min`) reads 100 at or past `max` and 0 below it; `NaN` reads 0.
 */
export const toPercent = (value: number, min = 0, max = 100): number => {
	if (Number.isNaN(value)) return 0;
	if (max <= min) return value >= max ? 100 : 0;
	return Math.min(Math.max(((value - min) * 100) / (max - min), 0), 100);
};

/** `indeterminate` without a finite value, `complete` at `max`, `progressing` otherwise. */
export type RangeStatus = 'indeterminate' | 'progressing' | 'complete';

export type RangeValueOptions = {
	/** The raw value. `null`, `undefined` and non-finite values are indeterminate. */
	value: number | null | undefined;
	/** @default 0 */
	min?: number;
	/** @default 100 */
	max?: number;
	/**
	 * Formats the clamped value itself (`{ style: 'unit', unit: 'megabyte' }`). Without it, the
	 * text is the value's percentage of the range (`45 %` in French).
	 */
	format?: Intl.NumberFormatOptions;
	/** Locale of the text; components pass the active I18n locale. */
	locale?: Intl.LocalesArgument;
};

export type ResolvedRangeValue = {
	/** The value clamped into the range, or `null` when indeterminate. */
	value: number | null;
	/** The clamped value as a 0–100 percentage of the range, or `null` when indeterminate. */
	percent: number | null;
	/** The display text, or `''` when indeterminate. */
	formatted: string;
	status: RangeStatus;
};

/** Clamps, measures and formats a range value in one pass. */
export const resolveRangeValue = ({
	value,
	min = 0,
	max = 100,
	format,
	locale
}: RangeValueOptions): ResolvedRangeValue => {
	if (value == null || !Number.isFinite(value)) {
		return { value: null, percent: null, formatted: '', status: 'indeterminate' };
	}
	const clamped = clampRange(value, min, max);
	const percent = toPercent(clamped, min, max);
	return {
		value: clamped,
		percent,
		formatted: format
			? formatNumber(clamped, locale, format)
			: formatNumber(percent / 100, locale, { style: 'percent' }),
		status: clamped >= Math.max(min, max) ? 'complete' : 'progressing'
	};
};

/**
 * The display text of a range value: `format` applied to the clamped value, or the percentage of
 * the range in `locale` by default. `''` when indeterminate.
 */
export const formatRangeValue = (options: RangeValueOptions): string =>
	resolveRangeValue(options).formatted;

export type RangeAriaValueTextOptions = RangeValueOptions & {
	/** Custom text from the formatted value and the raw value; wins over the defaults. */
	getAriaValueText?: (formattedValue: string, value: number | null) => string;
	/** Text for an indeterminate value (from the I18n catalog); omitted when not given. */
	indeterminateText?: string;
};

const ariaValueText = (resolved: ResolvedRangeValue, options: RangeAriaValueTextOptions) => {
	if (options.getAriaValueText) {
		const raw = options.value == null || !Number.isFinite(options.value) ? null : options.value;
		return options.getAriaValueText(resolved.formatted, raw);
	}
	return resolved.status === 'indeterminate' ? options.indeterminateText : resolved.formatted;
};

/**
 * `aria-valuetext` for a range value: `getAriaValueText(formatted, raw)` when given, the formatted
 * text otherwise, and `indeterminateText` while indeterminate.
 */
export const rangeAriaValueText = (options: RangeAriaValueTextOptions): string | undefined =>
	ariaValueText(resolveRangeValue(options), options);

export type RangeAriaAttributes = {
	'aria-valuemin': number;
	'aria-valuemax': number;
	'aria-valuenow': number | undefined;
	'aria-valuetext': string | undefined;
};

/**
 * ARIA value attributes for a `meter`, `progressbar` or `slider`: the bounds, the clamped value
 * (omitted while indeterminate) and the value text.
 */
export const rangeAriaAttributes = (options: RangeAriaValueTextOptions): RangeAriaAttributes => {
	const { min = 0, max = 100 } = options;
	const resolved = resolveRangeValue(options);
	return {
		'aria-valuemin': min,
		'aria-valuemax': max,
		'aria-valuenow': resolved.value ?? undefined,
		'aria-valuetext': ariaValueText(resolved, options)
	};
};
