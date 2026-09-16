import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { selectedSoft } from '$lib/components/Theme/theme.recipes.js';

const defaultChip = cva({
	base: 'group/chip box-border w-fit max-w-fit min-w-min inline-flex items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-clip-padding font-medium transition-colors',
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
			normal: 'h-6 px-md gap-sm text-sm',
			large: 'h-control-sm px-lg gap-sm text-sm'
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
		// Driven by the `selected` prop, which also stamps `data-selected`. It paints the one
		// shared soft selected recipe on top of whatever `variant` drew, so a chip list —
		// TagGroup, a filter row — marks its chosen entries without re-deriving a fill.
		selected: {
			true: selectedSoft,
			false: null
		},
		position: {
			'top-right': 'absolute z-10 top-0 right-0 translate-x-1/2 -translate-y-1/2',
			'top-left': 'absolute z-10 top-0 left-0 -translate-x-1/2 -translate-y-1/2',
			'bottom-right': 'absolute z-10 right-0 bottom-0 translate-x-1/2 translate-y-1/2',
			'bottom-left': 'absolute z-10 bottom-0 left-0 -translate-x-1/2 translate-y-1/2'
		}
	},
	defaultVariants: {
		color: 'neutral',
		variant: 'outline',
		size: 'normal',
		isEmpty: false,
		selected: false
	},
	compoundVariants: [
		// Mirrors button.theme.ts: the neutral outline is chrome next to inputs and selects, which
		// all draw a `neutral-muted` hairline; a full-strength neutral border made it the odd one out.
		{ color: 'neutral', variant: 'outline', class: 'border-neutral-muted' },
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
	base: 'inline-flex items-center [&>svg]:size-icon-sm',
	variants: {
		size: {
			normal: '[&>svg]:size-icon-sm',
			large: '[&>svg]:size-icon-md',
			small: '[&>svg]:size-icon-xs'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultChipSuffix = cva({
	base: 'inline-flex items-center [&>svg]:size-icon-sm',
	variants: {
		size: {
			normal: '[&>svg]:size-icon-sm',
			large: '[&>svg]:size-icon-md',
			small: '[&>svg]:size-icon-xs'
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
