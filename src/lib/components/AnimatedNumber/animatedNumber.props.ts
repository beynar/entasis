import type { WithAttachments } from '$lib/types/props.js';
import type { HTMLAttributes } from 'svelte/elements';
import type { AnimatedNumberTrend, AnimatedNumberValue } from './animatedNumber.parts.js';
import type { AnimatedNumberVariant } from './animatedNumber.state.svelte.js';
import type { AnimatedNumberThemeProps } from './animatedNumber.theme.js';

export type AnimatedNumberProps = WithAttachments<
	Omit<HTMLAttributes<HTMLSpanElement>, 'class' | 'children' | 'prefix' | 'dir'> & {
		/**
		 * The number shown. A change is animated from the number shown before.
		 * @readonly-value AnimatedNumber draws the supplied number and never edits it.
		 */
		value: AnimatedNumberValue;
		/**
		 * How a digit changes. `flow` turns it like a wheel, through the digits in between. `blur`
		 * slides the new digit in and the old one out, both through a blur, and leaves the digits
		 * that did not change still.
		 * @default 'flow'
		 */
		variant?: AnimatedNumberVariant;
		/** `Intl.NumberFormat` options: currency, percent, compact notation, fraction digits. */
		format?: Intl.NumberFormatOptions;
		/** Locale of the number. Defaults to the I18n locale. */
		locale?: Intl.LocalesArgument;
		/** Text written before the number. It is animated as the number's own symbols are. */
		prefix?: string;
		/** Text written after the number. */
		suffix?: string;
		/**
		 * The way digits travel. `auto` follows the number: upwards when it grows, downwards when
		 * it shrinks. `up` and `down` hold one way, for a clock or a countdown. `nearest` lets each
		 * digit take its own shortest way.
		 * @default 'auto'
		 */
		trend?: AnimatedNumberTrend;
		/**
		 * With `variant="flow"`: the change reads as passing through every number in between, so
		 * each digit under the highest one that changed makes at least one whole turn.
		 * @default false
		 */
		continuous?: boolean;
		/**
		 * How long a change takes, in milliseconds. Defaults to 900 for `flow` and 450 for `blur`.
		 */
		duration?: number;
		/**
		 * With `variant="blur"`: the blur a changing digit passes through, in pixels. `0` slides it
		 * with no blur. Defaults to 0.45 of the font size.
		 */
		blur?: number;
		/**
		 * Whether changes are animated. They never are under reduced motion.
		 * @default true
		 */
		animated?: boolean;
		/** Bindable reference to the root element. */
		ref?: HTMLElement | null;
		/** Additional classes for the root element. */
		class?: string;
		/** Theme overrides for the root, the four runs of the number, its digits and its symbols. */
		theme?: AnimatedNumberThemeProps;
	}
>;
