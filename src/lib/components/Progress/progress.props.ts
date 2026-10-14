import type { Colors, Density, Sizes } from '$lib/types/index.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Slot, WithSlot } from '../Slot/slot.js';
import type { ProgressThemeProps } from './progress.theme.js';

/** What `valueLabel` receives to draw the value text itself. */
export type ProgressValueState = {
	/** The value clamped into `[min, max]`, or `null` while indeterminate. */
	value: number | null;
	/** The formatted value text, `''` while indeterminate. */
	formattedValue: string;
	/** The clamped value as a 0–100 share of the range, or `null` while indeterminate. */
	percent: number | null;
	status: 'indeterminate' | 'progressing' | 'complete';
};

export type ProgressSize = Sizes;

type ProgressBaseProps = {
	/** Bindable reference to the root progress element. */
	ref?: HTMLElement | null;
	/** CSS classes applied to the root element. */
	class?: string;
	/** Theme color token applied to the fill. Defaults to the Theme default color. */
	color?: Colors;
	/** Semantic geometry scale: track thickness and text size. */
	size?: ProgressSize;
	/** Whitespace between the header (label and value) and the track. */
	density?: Density;
	/**
	 * Progress between `min` and `max`; it is clamped into that range. `null` is indeterminate:
	 * `aria-valuenow` is dropped, `data-indeterminate` is set and the fill slides along the track.
	 * `data-complete` is set once the clamped value reaches `max`.
	 *
	 * @readonly-value Progress draws reported progress it never edits.
	 * @default 0
	 */
	value?: number | null;
	/**
	 * Value at which the track is empty, reported as `aria-valuemin`.
	 * @default 0
	 */
	min?: number;
	/**
	 * Value at which the track is full, reported as `aria-valuemax`.
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
	/**
	 * Shows the value text on the trailing side of the header. It is always announced; this only
	 * makes it visible.
	 * @default false
	 */
	showValue?: boolean;
	/** Theme overrides for the root, header, label, value, track, and indicator parts. */
	theme?: ProgressThemeProps;
};

export type ProgressProps = WithAttachments<
	WithSlot<
		ProgressBaseProps & {
			/**
			 * Visible label in the header. It names the progress bar; without one the bar is named
			 * from the i18n catalog ("Progress").
			 */
			label?: Slot;
		},
		'valueLabel',
		ProgressValueState
	>
>;
