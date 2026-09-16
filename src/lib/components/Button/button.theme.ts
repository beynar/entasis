import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultButton = cva({
	base: 'group/button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap relative overflow-hidden cursor-pointer rounded-md border border-transparent bg-clip-padding font-medium text-sm outline-none transition-[color,background-color,border-color,box-shadow,translate] duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-focus/50 active:translate-y-px [&_svg:not([class*=size-])]:size-icon-md',
	variants: {
		size: {
			small: 'h-control-sm px-md gap-sm text-xs',
			normal: 'h-control-md px-lg gap-md text-sm',
			large: 'h-control-lg px-xl gap-md text-sm'
		},
		color: {
			primary: 'bg-primary text-primary-contrast',
			secondary: 'bg-secondary text-secondary-contrast',
			neutral: 'bg-neutral text-neutral-contrast',
			danger: 'bg-danger text-danger-contrast',
			success: 'bg-success text-success-contrast',
			warning: 'bg-warning text-warning-contrast',
			info: 'bg-info text-info-contrast'
		},
		variant: {
			solid: 'state-layer bg-color text-color-contrast',
			outline: 'state-layer bg-color/0 border border-color text-color-readable',
			soft: 'state-layer text-color-muted-readable bg-color-muted',
			ghost: 'state-layer text-color-readable bg-color/0',
			link: 'bg-transparent text-color-readable hover:underline'
		},
		loading: {
			true: 'cursor-default pointer-events-none',
			false: null
		},
		disabled: {
			true: 'opacity-50 cursor-not-allowed pointer-events-none',
			false: null
		},
		squared: {
			true: 'aspect-square !px-0',
			false: null
		},
		fullWidth: {
			true: 'w-full max-w-full'
		}
	},
	defaultVariants: {
		color: 'neutral',
		variant: 'solid',
		size: 'normal'
	},
	compoundVariants: [
		// The neutral outline is toolbar chrome next to inputs and selects, which all draw a
		// `neutral-muted` hairline; a full-strength neutral border made it the odd one out.
		{ color: 'neutral', variant: 'outline', class: 'border-neutral-muted' }
	]
});

const defaultButtonPrefix = cva({
	base: 'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none [&_svg:not([class*=size-])]:!size-full',
	variants: {
		size: {
			normal: 'size-icon-md',
			large: 'size-icon-lg',
			small: 'size-icon-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultButtonSuffix = cva({
	base: 'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none [&_svg:not([class*=size-])]:!size-full',
	variants: {
		size: {
			normal: 'size-icon-md',
			large: 'size-icon-lg',
			small: 'size-icon-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const buttonTheme = {
	root: defaultButton,
	prefix: defaultButtonPrefix,
	suffix: defaultButtonSuffix
};

export type ButtonTheme = typeof buttonTheme;
export type ButtonThemeProps = InferComponentTheme<ButtonTheme>;
export const setButtonTheme = setComponentTheme<ButtonTheme>('button');
export const useButtonTheme = useComponentTheme<ButtonTheme>('button', buttonTheme);
