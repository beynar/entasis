import type { Sizes, Colors, Density } from '$lib/types/theme.js';
import type { WithSlot, Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { CardThemeProps } from './card.theme.js';
import type { ButtonProps } from '../Button/button.props.js';

export type CardElevation = 1 | 2 | 3 | 4 | 5;
export type CardVariant = 'solid' | 'outline' | 'soft' | 'ghost';

/** @deprecated Use the shared `Density` type from entasis types instead. */
export type CardDensity = Density;

export type CardActionSlot = Slot | Omit<ButtonProps, 'as'>;

type CardBaseProps = {
	/**
	 * Bindable reference to the root card element.
	 */
	ref?: HTMLElement | null;
	/**
	 * The class name of the card. First element that the component outputs in the DOM.
	 */
	class?: string;
	/**
	 * When true, prevents interaction and applies disabled styles.
	 */
	disabled?: boolean;
	/**
	 * Theme color token applied to the card styling.
	 */
	color?: Colors;
	/**
	 * Visual style variant of the card.
	 */
	variant?: CardVariant;
	/**
	 * Elevation step a `solid` card lifts by, on the theme's elevation scale (`lift-1` … `lift-5`).
	 * Ignored by the other variants, which cast no shadow. @default 1
	 */
	elevation?: CardElevation;
	/**
	 * Size token controlling the typography scale (title, description, body).
	 */
	size?: Sizes;
	/**
	 * Spacing density controlling paddings and gaps between sections.
	 * 'large' matches the roomy vega default; 'normal' is the tighter
	 * everyday scale; 'small' for dense dashboards.
	 */
	density?: Density;
	/**
	 * When set, renders the card as an anchor link instead of a div.
	 */
	href?: string;
	/**
	 * Link target attribute when href is set.
	 */
	target?: string;
	/**
	 * Link rel attribute when href is set.
	 */
	rel?: string;
	/**
	 * Native click handler; sets role="button" when href is not set.
	 */
	onclick?: ((event: MouseEvent) => void) | null | undefined;
	/**
	 * Native pointer enter handler called when not disabled.
	 */
	onpointerenter?: ((event: PointerEvent) => void) | null | undefined;
	/**
	 * Native pointer leave handler called when not disabled.
	 */
	onpointerleave?: ((event: PointerEvent) => void) | null | undefined;
	/**
	 * Show subtle borders between sections (header/content, content/footer)
	 * Default: false (borders are hidden by default)
	 */
	showBorders?: boolean;
	/**
	 * Theme overrides for card parts such as header, content, and footer.
	 */
	theme?: CardThemeProps;
};

type CardSlotProps = WithSlot<
	CardBaseProps,
	'header' | 'title' | 'description' | 'content' | 'footer' | 'children'
>;

export type CardProps = WithAttachments<
	CardSlotProps & {
		/**
		 * Header action content as a slot, or ButtonProps rendered as a ghost button.
		 */
		action?: CardActionSlot;
	}
>;
