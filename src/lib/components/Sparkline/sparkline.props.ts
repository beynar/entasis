import type { MotionDurationToken, MotionEasingToken } from '$lib/tailwind/scales.js';
import type { Easing } from '$lib/transitions/easingFunctions.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { SparklineMarker, SparklineVariant } from './sparkline.geometry.js';

/**
 * How the series appears: `draw` reveals it from the left, `grow` raises it from the bottom of
 * the box (bars from zero), `fade` fades it in, `none` shows it at once.
 */
export type SparklineAnimation = 'draw' | 'grow' | 'fade' | 'none';
import type { SparklineThemeProps } from './sparkline.theme.js';

/** What the `tooltipContent` snippet receives for the value under the pointer. */
export type SparklinePoint = {
	/** The value. */
	value: number;
	/** Its place in `data`. */
	index: number;
	/** Its label from `labels`, when there is one. */
	label?: string;
	/** The value formatted with `format` and `locale`. */
	text: string;
};

export type SparklineProps = WithAttachments<
	Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children' | 'color'> & {
		/**
		 * The values, in order. A change is animated from the series shown before when it keeps
		 * the same number of values.
		 * @readonly-value Sparkline draws the supplied series and never edits it.
		 */
		data: readonly number[];
		/** A label for each value, such as its date: shown in the tooltip before the value. */
		labels?: readonly string[];
		/**
		 * How the values are drawn: a `line`, a line over a shaded `area`, a `bar` for each value
		 * standing on zero, or a `dot` for each value.
		 * @default 'line'
		 */
		variant?: SparklineVariant;
		/**
		 * The size of the box and the weight of the strokes. A width or height class on the root
		 * stretches the box; strokes and dots keep their weight.
		 * @default 'normal'
		 */
		size?: Sizes;
		/** Semantic color of the series. Defaults to the color of the text round it. */
		color?: Colors;
		/**
		 * Draws the line as a curve through the values.
		 * @default false
		 */
		curved?: boolean;
		/** The width of the line, in pixels. Defaults to 1.5, 2 or 2.5 with the size. */
		strokeWidth?: number;
		/** The value at the bottom of the scale. Defaults to the lowest value, and to 0 for bars. */
		min?: number;
		/** The value at the top of the scale. Defaults to the highest value, and to 0 for bars. */
		max?: number;
		/**
		 * Points to mark with a dot: the lowest (`min`, in the danger color), the highest (`max`, in
		 * the success color), the `first` and the `last`.
		 */
		markers?: readonly SparklineMarker[];
		/**
		 * Shows an arrow on the last value for the way the series goes, from its first value to its
		 * last: over or under the value, clear of the line, taking no room of its own.
		 * @default false
		 */
		showTrend?: boolean;
		/**
		 * Shows the value under the pointer, and a dot on it. `true` fills the tooltip with the
		 * color of the series; a semantic color fills it with that color instead.
		 * @default false
		 */
		tooltip?: boolean | Colors;
		/** Draws the tooltip's content from the point under the pointer, instead of its label and value. */
		tooltipContent?: Snippet<[SparklinePoint]>;
		/** `Intl.NumberFormat` options for the values in the tooltip and in the accessible name. */
		format?: Intl.NumberFormatOptions;
		/** Locale of the values. Defaults to the I18n locale. */
		locale?: Intl.LocalesArgument;
		/**
		 * The share of each bar's slot left empty between bars, from 0 to 0.9.
		 * @default 0.2
		 */
		barGap?: number;
		/**
		 * Animates the series when it appears, and moves it to its new values when they change.
		 * `false` turns both off. Nothing moves under reduced motion.
		 * @default true
		 */
		animated?: boolean;
		/**
		 * How the series appears: `draw` from the left, `grow` from the bottom (bars from zero),
		 * `fade` in, or `none`. A change of values still moves the series.
		 * @default 'draw'
		 */
		animation?: SparklineAnimation;
		/**
		 * How long the series takes to appear, and to move to new values: a Theme duration token
		 * (`instant`, `fast`, `normal`, `moderate`, `slow`, `slower`) or milliseconds. Defaults to
		 * `slower` to appear and `slow` to move.
		 */
		duration?: MotionDurationToken | number;
		/**
		 * The easing of both: a Theme easing role (`standard`, `enter`, `exit`, `emphasized`) or an
		 * easing name (`linear`, `cubicOut`, `backOut`, `elasticOut`…).
		 * @default 'enter'
		 */
		easing?: MotionEasingToken | Easing;
		/**
		 * What the series shows, such as "Revenue, last 30 days". It starts the accessible name;
		 * a summary of the values (how many, first, last, lowest, highest, trend) follows.
		 */
		label?: string;
		/** Bindable reference to the root element. */
		ref?: HTMLElement | null;
		/** Additional classes for the root element. */
		class?: string;
		/** Theme overrides for the sparkline parts. */
		theme?: SparklineThemeProps;
	}
>;
