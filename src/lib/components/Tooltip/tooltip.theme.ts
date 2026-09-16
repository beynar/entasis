import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

export const defaultTooltip = cva({
	base: 'box-border w-fit max-w-fit min-w-min inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-medium',
	variants: {
		size: {
			small: 'h-5 px-md gap-xs text-xs',
			normal: 'h-6 px-md gap-sm text-xs',
			large: 'h-control-sm px-lg gap-sm text-sm'
		},
		color: {
			primary: 'bg-primary text-primary-contrast',
			secondary: 'bg-secondary text-secondary-contrast',
			neutral: 'bg-surface-floating text-neutral',
			success: 'bg-success text-success-contrast',
			warning: 'bg-warning text-warning-contrast',
			info: 'bg-info text-info-contrast',
			danger: 'bg-danger text-danger-contrast'
		},
		variant: {
			solid: 'bg-color text-color-contrast',
			outline: 'border-color bg-color/0 text-color-readable',
			soft: 'bg-color-muted text-color-muted-readable'
		}
	},
	defaultVariants: {
		color: 'neutral',
		variant: 'solid',
		size: 'normal'
	}
});

// A tooltip is a quick, small surface: it fades up over the shortest duration step
// rather than borrowing the Popover's panel scale. The resolved preset is handed to
// the underlying Popover as its `transition`, so it replaces the popover preset.
export const defaultTooltipMotion = motion({
	base: {
		in: { x: 0, y: 2, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 2, scale: 0.98, opacity: 0 },
		duration: 'fast'
	}
});

export const tooltipTheme = {
	motion: defaultTooltipMotion,
	root: defaultTooltip
};

export type TooltipTheme = typeof tooltipTheme;
export type TooltipThemeProps = InferComponentTheme<TooltipTheme>;
export const setTooltipTheme = setComponentTheme<TooltipTheme>('tooltip');
export const useTooltipTheme = useComponentTheme<TooltipTheme>('tooltip', tooltipTheme);
export const useTooltipMotion = () => useComponentMotion('tooltip', defaultTooltipMotion);
