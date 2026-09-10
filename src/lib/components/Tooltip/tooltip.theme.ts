import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

export const defaultTooltip = cva({
	base: 'box-border w-fit max-w-fit min-w-min inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-medium',
	variants: {
		size: {
			small: 'h-5 px-md gap-xs text-xs',
			normal: 'h-6 px-md gap-sm text-xs',
			large: 'h-7 px-lg gap-sm text-sm'
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

export const tooltipTheme = {
	root: defaultTooltip
};

export type TooltipTheme = typeof tooltipTheme;
export type TooltipThemeProps = InferComponentTheme<TooltipTheme>;
export const setTooltipTheme = setComponentTheme<TooltipTheme>('tooltip');
export const useTooltipTheme = useComponentTheme<TooltipTheme>('tooltip', tooltipTheme);
