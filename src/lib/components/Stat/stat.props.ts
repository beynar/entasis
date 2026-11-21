import type { AnimatedNumberProps } from '$lib/components/AnimatedNumber/animatedNumber.props.js';
import type { Slot, WithSlot } from '$lib/components/Slot/slot.js';
import type { SparklineProps } from '$lib/components/Sparkline/sparkline.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { StatThemeProps } from './stat.theme.js';

export type StatVariant = 'solid' | 'outline' | 'soft' | 'ghost';
export type StatIndicatorVariant = 'default' | 'icon' | 'badge';
export type StatTrendDirection = 'up' | 'down' | 'neutral';
/** A region the `order` prop can place — and, by omission, hide. */
export type StatPart =
	'label' | 'value' | 'indicator' | 'separator' | 'trend' | 'description' | 'sparkline';

/**
 * What `animatedNumber` passes on to the AnimatedNumber that draws a numeric `value`: its
 * `variant`, `format`, `locale`, `prefix`, `suffix`, `trend`, `duration`, and so on.
 */
export type StatAnimatedNumber = Omit<AnimatedNumberProps, 'value' | 'ref'>;

/**
 * What `sparkline` passes on to the Sparkline drawn in the card, besides its `data`: its
 * `variant`, `color`, `tooltip`, `markers`, `curved`, `labels`, and so on.
 */
export type StatSparkline = Omit<SparklineProps, 'ref'>;

/** Order used when `order` is not supplied; the separator is opt-in. */
export const statDefaultOrder = [
	'label',
	'value',
	'indicator',
	'trend',
	'description',
	'sparkline'
] as const satisfies readonly StatPart[];

type StatBaseProps = {
	/** Bindable reference to the root stat element. */
	ref?: HTMLElement | null;
	/** Additional CSS classes for the root stat element. */
	class?: string;
	/** Theme color token applied to the stat surface. */
	color?: Colors;
	/** Visual treatment of the stat surface. */
	variant?: StatVariant;
	/** Size token controlling the typography and icon scale. */
	size?: Sizes;
	/**
	 * Spacing density controlling the surface padding and gaps between regions.
	 * 'small' for dense dashboards, 'large' for roomy detail surfaces.
	 */
	density?: Density;
	/** Theme overrides for stat parts. */
	theme?: StatThemeProps;
};

export type StatProps = WithAttachments<
	WithSlot<
		StatBaseProps & {
			/**
			 * Regions to render, in order. A region absent from the list is not rendered, so the
			 * separator appears only when 'separator' is listed. `indicator` always sits in column 2
			 * whatever its position in the list; the first two listed regions sit beside it and the
			 * rest span the full width.
			 * @default ['label', 'value', 'indicator', 'trend', 'description', 'sparkline']
			 */
			order?: readonly StatPart[];
			/**
			 * Primary metric. A number is drawn by an AnimatedNumber, so a change of value is
			 * animated; a string or a snippet is drawn as it is.
			 * @readonly-value Stat displays the supplied metric and never edits it.
			 */
			value?: number | Slot;
			/**
			 * How a numeric `value` is drawn. By default an AnimatedNumber animates each change; an
			 * object sets its props (`variant`, `format`, `locale`, `prefix`, `suffix`, `duration`…).
			 * `false` writes the number as plain text in the I18n locale, with no animation.
			 * @default true
			 */
			animatedNumber?: boolean | StatAnimatedNumber;
			/**
			 * Tone applied to the `trend` text and to the direction arrow the component appends.
			 * Defaults to the way the `sparkline` goes when there is one, and to 'neutral' otherwise.
			 */
			trendDirection?: StatTrendDirection;
			/**
			 * A sparkline across the card: the values, or an object of Sparkline props with its
			 * `data`. It takes the card's size and the color of its text unless given its own, and
			 * formats its values like `animatedNumber` does.
			 */
			sparkline?: readonly number[] | StatSparkline;
			/**
			 * Runs the sparkline past the card's padding, from one side of the card to the other,
			 * and down to its bottom edge when it is the last region.
			 * @default false
			 */
			sparklineBleed?: boolean;
			/** Presentation variant for the decorative `indicator` slot. */
			indicatorVariant?: StatIndicatorVariant;
			/** Semantic color token for the `indicator` slot. */
			indicatorColor?: Colors;
			/** Click handler for the `action` button in the top-right corner. */
			onAction?: (event: MouseEvent) => void;
			/** Accessible name for the `action` button. Required when the action renders an icon only. */
			actionLabel?: HTMLButtonAttributes['aria-label'];
			/** Disabled state for the `action` button. */
			actionDisabled?: HTMLButtonAttributes['disabled'];
		},
		'children' | 'label' | 'unit' | 'indicator' | 'action' | 'trendIcon' | 'trend' | 'description'
	>
>;
