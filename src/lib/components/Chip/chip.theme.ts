import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultChip = cva({
	base: 'group/chip box-border w-fit max-w-fit min-w-min inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-medium transition-all',
	variants: {
		isLink: {
			true: 'cursor-pointer',
			false: null
		},
		isEmpty: {
			true: 'max-w-none min-w-0 !p-0',
			false: null
		},
		size: {
			small: 'h-5 px-md gap-xs text-xs',
			normal: 'h-6 px-md gap-sm text-xs',
			large: 'h-7 px-lg gap-sm text-sm'
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
			solid: 'text-color-contrast bg-color',
			outline: 'bg-color/0 text-color-readable border-color',
			soft: 'bg-color-muted text-color-muted-readable'
		},
		position: {
			topRight: 'absolute z-10 top-0 right-0 translate-x-1/2 -translate-y-1/2',
			topLeft: 'absolute z-10 top-0 left-0 -translate-x-1/2 -translate-y-1/2',
			bottomRight: 'absolute z-10 right-0 bottom-0 translate-x-1/2 translate-y-1/2',
			bottomLeft: 'absolute z-10 bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
		}
	},
	defaultVariants: {
		color: 'primary',
		variant: 'solid',
		size: 'normal',
		isEmpty: false
	},
	compoundVariants: [
		{
			size: 'small',
			isEmpty: true,
			class: 'w-5'
		},
		{
			size: 'normal',
			isEmpty: true,
			class: 'w-6'
		},
		{
			size: 'large',
			isEmpty: true,
			class: 'w-7'
		}
	]
});

const defaultChipPrefix = cva({
	base: 'inline-flex items-center [&>svg]:size-3.5',
	variants: {
		size: {
			normal: '[&>svg]:size-3.5',
			large: '[&>svg]:size-4',
			small: '[&>svg]:size-3'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultChipSuffix = cva({
	base: 'inline-flex items-center [&>svg]:size-3.5',
	variants: {
		size: {
			normal: '[&>svg]:size-3.5',
			large: '[&>svg]:size-4',
			small: '[&>svg]:size-3'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const chipTheme = {
	root: defaultChip,
	prefix: defaultChipPrefix,
	suffix: defaultChipSuffix
};

export type ChipTheme = typeof chipTheme;
export type ChipThemeProps = InferComponentTheme<ChipTheme>;
export const setChipTheme = setComponentTheme<ChipTheme>('chip');
export const useChipTheme = useComponentTheme<ChipTheme>('chip', chipTheme);
