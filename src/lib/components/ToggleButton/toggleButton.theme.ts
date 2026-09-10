import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultButton = cva({
	base: 'group/toggle relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center overflow-hidden whitespace-nowrap rounded-md border border-transparent bg-clip-padding text-sm font-medium outline-none transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-color/50 [&_svg:not([class*=size-])]:size-icon-md',
	variants: {
		checked: {
			true: '',
			false: null
		},
		disabled: {
			true: 'opacity-50 cursor-not-allowed pointer-events-none',
			false: null
		},
		color: {
			primary: '',
			secondary: '',
			neutral: '',
			danger: '',
			success: '',
			warning: '',
			info: ''
		},
		variant: {
			outline: 'state-layer bg-color/0 border border-color text-color-readable',
			ghost: 'state-layer border-transparent bg-transparent text-color-readable'
		},
		squared: {
			true: 'aspect-square !px-0',
			false: null
		},
		size: {
			small: 'h-control-sm min-size-hit-sm px-md gap-sm text-xs',
			normal: 'h-control-md min-size-hit-md px-lg gap-md text-sm',
			large: 'h-control-lg min-size-hit-lg px-xl gap-md text-sm'
		}
	},
	defaultVariants: {
		checked: false,
		size: 'normal',
		variant: 'ghost',
		color: 'neutral'
	},
	compoundVariants: [
		{
			variant: 'ghost',
			checked: true,
			class: 'bg-color-muted text-color-muted-readable'
		},
		{
			variant: 'outline',
			checked: true,
			class: 'bg-color-muted text-color-muted-readable border-color'
		}
	]
});

const defaultToggleButtonPrefix = cva({
	base: 'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none [&_svg:not([class*=size-])]:!size-full',
	variants: {
		size: {
			normal: 'size-icon-md',
			large: 'size-icon-lg',
			small: 'size-icon-sm'
		},
		checked: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultToggleButtonSuffix = cva({
	base: 'inline-flex shrink-0 items-center justify-center overflow-hidden leading-none [&_svg:not([class*=size-])]:!size-full',
	variants: {
		size: {
			normal: 'size-icon-md',
			large: 'size-icon-lg',
			small: 'size-icon-sm'
		},
		checked: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const toggleButtonTheme = {
	root: defaultButton,
	prefix: defaultToggleButtonPrefix,
	suffix: defaultToggleButtonSuffix
};

export type ToggleButtonTheme = typeof toggleButtonTheme;
export type ToggleButtonThemeProps = InferComponentTheme<ToggleButtonTheme>;
export const setToggleButtonTheme = setComponentTheme<ToggleButtonTheme>('toggleButton');
export const useToggleButtonTheme = useComponentTheme<ToggleButtonTheme>(
	'toggleButton',
	toggleButtonTheme
);
