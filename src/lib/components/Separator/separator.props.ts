import type { Colors } from '$lib/types/theme.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { SeparatorThemeProps } from './separator.theme.js';

export type SeparatorProps = WithAttachments<
	WithSlot<
		{
			/**
			 * The class name of the separator. First element that the component outputs in the DOM.
			 */
			class?: string;
			/**
			 * Whether the separator is decorative (no semantic meaning).
			 * @default false
			 */
			decorative?: boolean;
			/**
			 * The orientation of the separator.
			 * @default 'horizontal'
			 */
			orientation?: 'horizontal' | 'vertical';
			/**
			 * Alignment of the label along the separator. `start`/`end` push the
			 * label to one side (with the line filling the remaining space).
			 * @default 'center'
			 */
			align?: 'start' | 'center' | 'end';
			/**
			 * Whether to draw the divider line(s). When false, only the label is
			 * shown (still positioned according to `align`).
			 * @default true
			 */
			line?: boolean;
			/**
			 * How the line is drawn. `solid` is an even line; `gradient` fades it out toward its
			 * ends: both ends of a plain separator, and away from the label when there is one.
			 * @default 'solid'
			 */
			variant?: 'solid' | 'gradient';
			/**
			 * The color of the separator.
			 * @default 'neutral'
			 */
			color?: Colors;
			/**
			 * The thickness of the separator in pixels.
			 * @default 1
			 */
			thickness?: number;
			/**
			 * Custom theme overrides.
			 */
			theme?: SeparatorThemeProps;
		},
		'children',
		undefined
	>
>;
