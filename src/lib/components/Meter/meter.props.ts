import type { Snippet } from 'svelte';
import type { Colors, Sizes } from '../../types/theme.js';
import type { WithSlot } from '../Slot/slot.js';
import type { MeterThemeProps } from './meter.theme.js';

export type MeterStep<T = unknown> = {
	/**
	 * Label shown for this segment in the legend when `showLegend` is enabled. In a stacked meter
	 * it is also the accessible name of the segment's `meter`; an unlabelled segment is announced
	 * as "Segment 1 of 3" from the i18n catalog.
	 */
	label?: string;
	/**
	 * Theme color applied to the segment bar and legend swatch.
	 */
	color?: Colors;
	/**
	 * Icon snippet rendered beside the label in the legend.
	 */
	icon?: Snippet<[]>;
	/**
	 * Vertical placement of the value indicator relative to the track.
	 */
	position?: 'top' | 'bottom';
	/**
	 * Numeric value represented by this meter segment.
	 */
	value: number;
	/**
	 * Arbitrary metadata attached to this meter segment.
	 */
	data?: T;
};

export type MeterProps<T = unknown> = WithSlot<
	WithSlot<
		{
			/**
			 * Additional CSS classes for the root meter container.
			 */
			class?: string;
			/**
			 * Controls the indicator label: raw value, percentage, or hidden when undefined.
			 */
			showIndicatorAs?: 'value' | 'percentage';
			/**
			 * A plain number, one meter segment, or a stacked set of segments to render
			 * on the track. A number renders a single segment coloured by `color` whose
			 * legend label defaults to the number itself.
			 *
			 * One segment makes the root a `role="meter"` named by `label`; several segments make
			 * it a `role="group"` named by `label` with one `meter` per segment. Each meter reports
			 * `aria-valuemin`, `aria-valuemax`, the value clamped to the scale as `aria-valuenow`,
			 * and the indicator text as `aria-valuetext`.
			 *
			 * @readonly-value Meter draws a measurement it never edits.
			 */
			value: number | MeterStep<T> | MeterStep<T>[];
			/**
			 * Theme color of the meter, used for a numeric `value` and as the fallback
			 * for segments that declare no color of their own.
			 */
			color?: Colors;
			/**
			 * When true, renders a legend listing each segment's label and percentage.
			 */
			showLegend?: boolean;
			/**
			 * Spring animation stiffness passed to the value and width springs.
			 */
			stiffness?: number;
			/**
			 * Soft-landing factor applied when spring targets update.
			 */
			soft?: number;
			/**
			 * Spring animation damping passed to the value and width springs.
			 */
			damping?: number;
			/**
			 * Convergence threshold for spring-animated values.
			 */
			precision?: number;
			/**
			 * Minimum value of the meter scale, reported as `aria-valuemin`. A segment fills
			 * `(value - min) / (max - min)` of the track.
			 * @default 0
			 */
			min?: number;
			/**
			 * Maximum value of the meter scale, reported as `aria-valuemax`. Values are clamped into
			 * `[min, max]`, so a segment never draws past the track and `aria-valuenow` stays in range.
			 * @default 100
			 */
			max?: number;
			/**
			 * `Intl.NumberFormat` options for the value text when `showIndicatorAs` is `'value'`
			 * (`{ style: 'unit', unit: 'megabyte' }`). The clamped value is formatted in the active
			 * I18n locale. The percentage text is always the share of the scale.
			 */
			format?: Intl.NumberFormatOptions;
			/**
			 * Overrides the `aria-valuetext` of a meter, which otherwise mirrors the indicator text.
			 * Receives the clamped value, its formatted text and the scale bounds.
			 */
			getAriaValueText?: (payload: {
				value: number;
				formattedValue: string;
				min: number;
				max: number;
			}) => string;
			/**
			 * Locale used to format the value and percentage text. Defaults to the I18n locale.
			 */
			locale?: Intl.LocalesArgument;
			/**
			 * Visual size variant of the meter track, labels, and legend.
			 */
			size?: Sizes;
			/**
			 * Custom theme overrides for meter sub-elements.
			 */
			theme?: MeterThemeProps;
		},
		'label' | 'description' | 'helper' | 'header'
	>,
	'indicator'
>;
