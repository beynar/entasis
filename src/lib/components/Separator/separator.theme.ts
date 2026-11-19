import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultSeparator = cva({
	base: 'relative flex items-center text-neutral/70 text-xs',
	variants: {
		orientation: {
			horizontal: 'w-full my-md',
			vertical: 'h-full mx-md flex-col'
		},
		align: {
			start: '',
			center: '',
			end: ''
		},
		line: {
			true: '',
			false: ''
		},
		variant: {
			solid: '',
			gradient: ''
		},
		color: {
			primary: 'before:border-primary after:border-primary',
			secondary: 'before:border-secondary after:border-secondary',
			neutral: 'before:border-neutral-muted after:border-neutral-muted',
			danger: 'before:border-danger after:border-danger',
			success: 'before:border-success after:border-success',
			warning: 'before:border-warning after:border-warning',
			info: 'before:border-info after:border-info'
		}
	},
	compoundVariants: [
		// Line rendering per orientation
		{
			orientation: 'horizontal',
			line: true,
			class:
				'before:border-t before:[border-top-width:var(--separator-border-width,1px)] after:border-t after:[border-top-width:var(--separator-border-width,1px)]'
		},
		{
			orientation: 'vertical',
			line: true,
			class:
				'before:border-l before:[border-width:var(--separator-border-width,1px)] after:border-l after:[border-width:var(--separator-border-width,1px)]'
		},
		// Alignment (horizontal): which side grows to fill, plus the gap around the label
		{
			orientation: 'horizontal',
			align: 'center',
			class: 'before:flex-1 after:flex-1 [&:has(*)]:before:mr-md [&:has(*)]:after:ml-md'
		},
		{ orientation: 'horizontal', align: 'start', class: 'after:flex-1 [&:has(*)]:after:ml-md' },
		{ orientation: 'horizontal', align: 'end', class: 'before:flex-1 [&:has(*)]:before:mr-md' },
		// Alignment (vertical)
		{
			orientation: 'vertical',
			align: 'center',
			class: 'before:flex-1 after:flex-1 [&:has(*)]:before:mb-md [&:has(*)]:after:mt-md'
		},
		{ orientation: 'vertical', align: 'start', class: 'after:flex-1 [&:has(*)]:after:mt-md' },
		{ orientation: 'vertical', align: 'end', class: 'before:flex-1 [&:has(*)]:before:mb-md' },
		// Gradient: the line is masked, so it keeps its colour and thickness and fades out toward
		// its outer ends. `--separator-fade` is INTERNAL: the direction the line runs in, which
		// follows the reading direction.
		{
			orientation: 'horizontal',
			variant: 'gradient',
			class: '[--separator-fade:to_right] rtl:[--separator-fade:to_left]'
		},
		{ orientation: 'vertical', variant: 'gradient', class: '[--separator-fade:to_bottom]' },
		// Two halves that meet in the middle, or at the label: each fades away from it.
		{
			variant: 'gradient',
			align: 'center',
			class:
				'before:[mask-image:linear-gradient(var(--separator-fade),transparent,black)] after:[mask-image:linear-gradient(var(--separator-fade),black,transparent)]'
		},
		// One piece: it fades at both ends, or away from the label when there is one.
		{
			variant: 'gradient',
			align: 'start',
			class:
				'after:[mask-image:linear-gradient(var(--separator-fade),transparent,black,transparent)] [&:has(*)]:after:[mask-image:linear-gradient(var(--separator-fade),black,transparent)]'
		},
		{
			variant: 'gradient',
			align: 'end',
			class:
				'before:[mask-image:linear-gradient(var(--separator-fade),transparent,black,transparent)] [&:has(*)]:before:[mask-image:linear-gradient(var(--separator-fade),transparent,black)]'
		}
	],
	defaultVariants: {
		orientation: 'horizontal',
		align: 'center',
		line: true,
		variant: 'solid',
		color: 'neutral'
	}
});

const defaultSeparatorLabel = cva({
	base: 'whitespace-nowrap text-xs leading-tight flex-shrink-0',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

export const separatorTheme = {
	root: defaultSeparator,
	label: defaultSeparatorLabel
};

export type SeparatorTheme = typeof separatorTheme;
export type SeparatorThemeProps = InferComponentTheme<SeparatorTheme>;
export const setSeparatorTheme = setComponentTheme<SeparatorTheme>('separator');
export const useSeparatorTheme = useComponentTheme<SeparatorTheme>('separator', separatorTheme);
