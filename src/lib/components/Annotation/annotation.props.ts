import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Colors } from '$lib/types/theme.js';
import type { AnnotationThemeProps } from './annotation.theme.js';

/**
 * Where the note sits round its target; the arrow runs from the note to the target. `start` and
 * `end` follow the reading direction, and draw the arrow on a slant.
 */
export type AnnotationPlacement =
	'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'right';

/** A colour role, or a hue that keeps turning. */
export type AnnotationColor = Colors | 'rainbow';

export type AnnotationProps = WithAttachments<
	WithSlot<
		{
			/**
			 * Where the note sits round its target.
			 * @default 'bottom'
			 */
			placement?: AnnotationPlacement;
			/**
			 * The colour of the marker, the arrow and the note: a role, or `rainbow`, whose hue
			 * keeps turning (it holds still under reduced motion). Defaults to the Theme's default
			 * colour.
			 */
			color?: AnnotationColor;
			/**
			 * Tints the target, as a marker pen would. Turn it off for a target that has its own
			 * fill, such as a button or a chip.
			 * @default true
			 */
			highlight?: boolean;
			/**
			 * Draws the annotation when it comes into view: the marker sweeps over the target,
			 * the note is written, then the arrow is traced from the note to the target. Until
			 * then only the target shows. It plays once, and not at all under reduced motion.
			 * @default false
			 */
			draw?: boolean;
			/**
			 * With `draw`: how far above the bottom of the screen the target must be before it
			 * is drawn, in pixels or as a share of the screen's height (`'25%'`). A negative
			 * distance draws it that far before it comes into view. Without it, the annotation
			 * is drawn once half of its target shows.
			 */
			drawOffset?: number | `${number}%`;
			/**
			 * Hides the note from assistive technology. Only for a note that repeats what the
			 * page already says.
			 * @default false
			 */
			decorative?: boolean;
			/**
			 * The element of the root: a `span` inside a line of text, a `div` round a block.
			 * @default 'span'
			 */
			as?: 'span' | 'div';
			/** Bindable reference to the root element. */
			ref?: HTMLElement | null;
			/** Additional classes for the root element. */
			class?: string;
			/** Theme overrides for the root, the arrow and the label. */
			theme?: AnnotationThemeProps;
		},
		/** `children` is the target; `note` is written beside it, and left out for a marker alone. */
		'children' | 'note'
	>
>;
