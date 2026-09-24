import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultNetworkIndicator = cva({
	base: 'ui-network-indicator fixed top-0 left-0 w-full z-[9999] origin-left rounded-lg',
	variants: {
		variant: {
			bar: '',
			trail: 'overflow-hidden bg-transparent shadow-none',
			'trail-bounce': 'overflow-hidden bg-transparent shadow-none'
		},
		color: {
			primary: 'bg-primary shadow-primary',
			secondary: 'bg-secondary shadow-secondary',
			neutral: 'bg-neutral shadow-neutral',
			danger: 'bg-danger shadow-danger',
			success: 'bg-success shadow-success',
			warning: 'bg-warning shadow-warning',
			info: 'bg-info shadow-info'
		}
	},
	compoundVariants: [
		{
			variant: ['trail', 'trail-bounce'],
			color: ['primary', 'secondary', 'neutral', 'danger', 'success', 'warning', 'info'],
			class: '!bg-transparent !shadow-none'
		}
	],
	defaultVariants: {
		variant: 'bar',
		color: 'neutral'
	}
});

const defaultNetworkIndicatorSegment = cva({
	base: 'absolute top-0 h-full rounded-full opacity-90 lift-1 will-change-transform',
	variants: {
		color: {
			primary: 'bg-primary shadow-primary',
			secondary: 'bg-secondary shadow-secondary',
			neutral: 'bg-neutral shadow-neutral',
			danger: 'bg-danger shadow-danger',
			success: 'bg-success shadow-success',
			warning: 'bg-warning shadow-warning',
			info: 'bg-info shadow-info'
		}
	},
	defaultVariants: {
		color: 'neutral'
	}
});

// Pacing for the indeterminate bar, keyed by `variant`: one growth step of the `bar`
// loop, or one pass of the `trail`. Only `duration` / `easing` are read (the bar is
// driven by the Web Animations API). Reduced motion resolves the duration to 0, which
// holds the indicator still instead of looping.
export const defaultNetworkIndicatorMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slow',
		easing: 'standard'
	},
	variants: {
		variant: {
			bar: {},
			// A trail pass is the slowest step on the scale, not a literal: a `<Theme motion>`
			// retune has to move it the way it moves the `bar` loop.
			trail: { duration: 'slower' },
			'trail-bounce': { duration: 'slower' }
		}
	},
	defaultVariants: {
		variant: 'bar'
	}
});

export const networkIndicatorTheme = {
	motion: defaultNetworkIndicatorMotion,
	root: defaultNetworkIndicator,
	segment: defaultNetworkIndicatorSegment
};

export type NetworkIndicatorTheme = typeof networkIndicatorTheme;
export type NetworkIndicatorThemeProps = InferComponentTheme<NetworkIndicatorTheme>;
export const setNetworkIndicatorTheme =
	setComponentTheme<NetworkIndicatorTheme>('network-indicator');
export const useNetworkIndicatorTheme = useComponentTheme<NetworkIndicatorTheme>(
	'networkIndicator',
	networkIndicatorTheme
);
export const useNetworkIndicatorMotion = () =>
	useComponentMotion('network-indicator', defaultNetworkIndicatorMotion);
