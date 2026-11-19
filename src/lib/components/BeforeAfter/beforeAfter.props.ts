import type { Snippet } from 'svelte';
import type { AspectRatioRatio } from '$lib/components/AspectRatio/aspectRatio.props.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { BeforeAfterThemeProps } from './beforeAfter.theme.js';

export type BeforeAfterOrientation = 'horizontal' | 'vertical';

/** How the divider is painted: the surface colour, the colour role, or frosted glass. */
export type BeforeAfterVariant = 'surface' | 'solid' | 'glass';

/** The handle on the line: a round grip, a pill along the line, bare arrows, or none. */
export type BeforeAfterHandleVariant = 'grip' | 'pill' | 'arrows' | 'none';

export type BeforeAfterLineVariant = 'solid' | 'dashed' | 'none';

export type BeforeAfterLabelVariant = 'solid' | 'soft' | 'outline';

/** Where the labels sit along the divider: at its start, its middle or its end. */
export type BeforeAfterLabelPosition = 'start' | 'center' | 'end';

/** An image given by its attributes, drawn to fill the comparison. */
export type BeforeAfterImage = {
	src: string;
	/** What the image shows. Both images stay readable by assistive technology. */
	alt: string;
	srcset?: string;
	sizes?: string;
	/** @default 'lazy' */
	loading?: 'lazy' | 'eager';
};

/** One side of the comparison: an image, or any content as a snippet. */
export type BeforeAfterContent = BeforeAfterImage | Snippet;

/** Names shown in the corner of each side, and read with the divider's value. */
export type BeforeAfterLabels = {
	before?: string;
	after?: string;
};

export type BeforeAfterHandlePayload = {
	/** The share of the before side shown, 0 to 100. */
	value: number;
	dragging: boolean;
	orientation: BeforeAfterOrientation;
};

export type BeforeAfterProps = WithAttachments<{
	/** The first side: at the inline start of the divider, on top when vertical. */
	before: BeforeAfterContent;
	/** The second side, under the first one. Without `ratio`, it gives the comparison its size. */
	after: BeforeAfterContent;
	/**
	 * The share of the before side shown, 0 to 100: the divider sits there, counted from the
	 * inline start (the top when vertical). Bindable.
	 */
	value?: number;
	/**
	 * The share shown at first when `value` is not set.
	 * @default 50
	 */
	defaultValue?: number;
	/** Called with each new share while the divider moves. */
	onValueChange?: (value: number) => void;
	/** Called with the settled share once a drag or a key press ends, if it changed. */
	onValueCommit?: (value: number) => void;
	/**
	 * The direction the divider moves in.
	 * @default 'horizontal'
	 */
	orientation?: BeforeAfterOrientation;
	/**
	 * A fixed width-to-height ratio for the comparison; both sides then fill it. Without one, the
	 * after side sizes it.
	 */
	ratio?: AspectRatioRatio;
	/**
	 * Names each side in its corner: `true` for "Before" and "After" in the active locale, or your
	 * own. A side's label is covered and revealed with its side.
	 * @default false
	 */
	labels?: boolean | BeforeAfterLabels;
	/**
	 * What an arrow key moves the divider by.
	 * @default 1
	 */
	step?: number;
	/**
	 * What PageUp, PageDown and Shift+Arrow move the divider by.
	 * @default 10
	 */
	largeStep?: number;
	/**
	 * How the divider is painted: `surface` in the surface colour, `solid` in the `color` role,
	 * `glass` frosted over the picture.
	 * @default 'surface'
	 */
	variant?: BeforeAfterVariant;
	/**
	 * The colour role of the divider: its fill when `solid`, its icon otherwise. Defaults to the
	 * Theme's default colour.
	 */
	color?: Colors;
	/**
	 * The handle on the line: a round `grip`, a `pill` along the line, bare `arrows` either side of
	 * it, or `none` for the line alone.
	 * @default 'grip'
	 */
	handleVariant?: BeforeAfterHandleVariant;
	/**
	 * The line itself: `solid`, `dashed`, or `none` to leave only the handle.
	 * @default 'solid'
	 */
	lineVariant?: BeforeAfterLineVariant;
	/**
	 * How the labels are painted, as Chips.
	 * @default 'solid'
	 */
	labelVariant?: BeforeAfterLabelVariant;
	/**
	 * Where the labels sit along the divider: its `start` (the top of a horizontal comparison, the
	 * inline start of a vertical one), its `center` or its `end`.
	 * @default 'start'
	 */
	labelPosition?: BeforeAfterLabelPosition;
	/**
	 * The size of the handle and the thickness of the line.
	 * @default 'normal'
	 */
	size?: Sizes;
	/** The divider cannot be moved or focused. */
	disabled?: boolean;
	/** The divider can be focused and is announced, but cannot be moved. */
	readOnly?: boolean;
	/** Accessible name of the divider. Defaults to "Before and after comparison" in the locale. */
	label?: string;
	/** Replaces the handle, whatever `handleVariant` is. The line and the hit area around it stay. */
	handle?: Snippet<[BeforeAfterHandlePayload]>;
	/** Id of the divider's range input. */
	id?: string;
	/** Bindable reference to the root element. */
	ref?: HTMLElement | null;
	/** Additional classes for the root element. */
	class?: string;
	/** Theme overrides for the root, the sides, the labels and the divider's parts. */
	theme?: BeforeAfterThemeProps;
}>;
