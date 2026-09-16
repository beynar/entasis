import type { WithAttachments } from '$lib/types/props.js';
import type { Slot } from '$lib/components/Slot/slot.js';
import type { Colors } from '$lib/types/theme.js';
import type { SkeletonThemeProps } from './skeleton.theme.js';

export type SkeletonProps = WithAttachments<{
	/**
	 * The class name of the skeleton. First element that the component outputs in the DOM.
	 */
	class?: string;
	/**
	 * Color variant of the skeleton
	 */
	color?: Colors;
	/**
	 * Optional content to display inside the skeleton
	 */
	children?: Slot;
	/**
	 * Custom theme overrides
	 */
	theme?: SkeletonThemeProps;
}>;
