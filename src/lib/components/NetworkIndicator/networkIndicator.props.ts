import type { Colors } from '$lib/types/theme.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { NetworkIndicatorThemeProps } from './networkIndicator.theme.js';
import type { Easing } from '$lib/transitions/easingFunctions.js';

export type NetworkIndicatorVariant = 'bar' | 'trail' | 'trail-bounce';

export type NetworkIndicatorProps = WithAttachments<{
	/**
	 * Bindable reference to the indicator element while it is visible.
	 */
	ref?: HTMLDivElement | null;
	/**
	 * The color scheme of the network indicator.
	 * @default 'neutral'
	 */
	color?: Colors;
	/**
	 * The height of the network indicator in pixels.
	 * @default 3
	 */
	height?: number;
	/**
	 * The animation delay/duration in milliseconds.
	 * @default 300
	 */
	delay?: number;
	/**
	 * Controlled loading state. Useful for explicit async work or deterministic previews.
	 * @default false
	 */
	loading?: boolean;
	/**
	 * Visual animation style.
	 * @default 'bar'
	 */
	variant?: NetworkIndicatorVariant;
	/**
	 * Pause between trail passes in milliseconds. Only applies to `variant="trail"`.
	 * @default 0
	 */
	trailGap?: number;
	/**
	 * Duration of one trail pass in milliseconds. Only applies to `variant="trail"`.
	 * Lower values make the trail move faster.
	 * @default 650
	 */
	trailDuration?: number;
	/**
	 * The easing function to use for animations.
	 * @default 'cubicInOut'
	 */
	easing?: Easing;
	/**
	 * Accessible label for the indeterminate progress indicator.
	 * @default 'Loading'
	 */
	label?: string;
	/**
	 * Additional CSS classes for the network indicator.
	 */
	class?: string;
	/**
	 * Custom theme overrides.
	 */
	theme?: NetworkIndicatorThemeProps;
}>;
