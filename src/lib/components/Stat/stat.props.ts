import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { StatThemeProps } from './stat.theme.js';

export type StatVariant = 'solid' | 'outline' | 'soft' | 'ghost';
export type StatIndicatorVariant = 'default' | 'icon' | 'badge' | 'action';
export type StatTrendDirection = 'up' | 'down' | 'neutral';

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
			/** Tone applied to the `trend` slot. */
			trendDirection?: StatTrendDirection;
			/** Presentation variant for the `indicator` slot. */
			indicatorVariant?: StatIndicatorVariant;
			/** Semantic color token for the `indicator` slot. */
			indicatorColor?: Colors;
			/** Native click handler for an action indicator; renders the indicator as a button. */
			onclick?: (event: MouseEvent) => void;
			/** Accessible name for icon-only action indicators. */
			indicatorLabel?: HTMLButtonAttributes['aria-label'];
			/** Native button type used when the indicator is clickable. */
			indicatorType?: HTMLButtonAttributes['type'];
			/** Disabled state used when the indicator is clickable. */
			indicatorDisabled?: HTMLButtonAttributes['disabled'];
			/** Renders a separator between primary and supporting stat content. */
			showSeparator?: boolean;
		},
		'children' | 'label' | 'value' | 'indicator' | 'trend' | 'description'
	>
>;
