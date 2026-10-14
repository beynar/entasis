import type { Colors, Sizes } from '$lib/types/index.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { ProgressCircleThemeProps } from './progressCircle.theme.js';

export type ProgressCircleSize = Sizes;

type ProgressCircleBaseProps = {
	/** Bindable reference to the root progress circle element. */
	ref?: HTMLElement | null;
	/** CSS classes applied to the root element. */
	class?: string;
	/** Theme color token applied to the active arc. */
	color?: Colors;
	/** Semantic geometry scale. */
	size?: ProgressCircleSize;
	/** Explicit circle diameter in pixels, overriding the semantic size. */
	diameter?: number;
	/**
	 * Progress between `min` and `max`; it is clamped into that range. `null` is indeterminate:
	 * `aria-valuenow` is dropped, `data-indeterminate` is set and the arc spins. `data-complete`
	 * is set once the clamped value reaches `max`.
	 *
	 * @readonly-value ProgressCircle draws reported progress it never edits.
	 * @default 0
	 */
	value?: number | null;
	/**
	 * Value at which the arc is empty, reported as `aria-valuemin`.
	 * @default 0
	 */
	min?: number;
	/**
	 * Value at which the arc is full, reported as `aria-valuemax`.
	 * @default 100
	 */
	max?: number;
	/**
	 * `Intl.NumberFormat` options for the value text (`{ style: 'unit', unit: 'megabyte' }`),
	 * applied to the clamped value. Without it, the text is the percentage of the range.
	 */
	format?: Intl.NumberFormatOptions;
	/**
	 * Overrides `aria-valuetext`. Receives the clamped value (`null` while indeterminate), its
	 * formatted text and the range bounds.
	 */
	getAriaValueText?: (payload: {
		value: number | null;
		formattedValue: string;
		min: number;
		max: number;
	}) => string;
	/** Locale of the value text. Defaults to the I18n locale. */
	locale?: Intl.LocalesArgument;
	/** Accessible label used when the progress circle is not decorative. */
	label?: string;
	/** Removes progress semantics when the circle is purely decorative. */
	decorative?: boolean;
	/** Theme overrides for the root, svg, track, and indicator parts. */
	theme?: ProgressCircleThemeProps;
};

export type ProgressCircleProps = WithAttachments<ProgressCircleBaseProps>;
