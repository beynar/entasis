import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Density, Sizes } from '$lib/types/theme.js';
import type { HTMLButtonAttributes } from 'svelte/elements';
import type { StatThemeProps } from './stat.theme.js';

export type StatVariant = 'solid' | 'outline' | 'soft' | 'ghost';
export type StatIndicatorVariant = 'default' | 'icon' | 'badge';
export type StatTrendDirection = 'up' | 'down' | 'neutral';
/** A region the `order` prop can place — and, by omission, hide. */
export type StatPart = 'label' | 'value' | 'indicator' | 'separator' | 'trend' | 'description';

/** Order used when `order` is not supplied; the separator is opt-in. */
export const statDefaultOrder = [
	'label',
	'value',
	'indicator',
	'trend',
	'description'
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
			 * @default ['label', 'value', 'indicator', 'trend', 'description']
			 */
			order?: readonly StatPart[];
			/** Tone applied to the `trend` text and to the direction arrow the component appends. */
			trendDirection?: StatTrendDirection;
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
		| 'children'
		| 'label'
		| 'value'
		| 'unit'
		| 'indicator'
		| 'action'
		| 'trendIcon'
		| 'trend'
		| 'description'
	>
>;
