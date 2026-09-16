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
	 * Progress value from 0 to 100.
	 *
	 * @readonly-value ProgressCircle draws reported progress it never edits.
	 */
	value?: number;
	/** Accessible label used when the progress circle is not decorative. */
	label?: string;
	/** Removes progress semantics when the circle is purely decorative. */
	decorative?: boolean;
	/** Theme overrides for the root, svg, track, and indicator parts. */
	theme?: ProgressCircleThemeProps;
};

export type ProgressCircleProps = WithAttachments<ProgressCircleBaseProps>;
