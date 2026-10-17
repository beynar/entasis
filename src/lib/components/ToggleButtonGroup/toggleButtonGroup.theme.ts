import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultToggleButtonGroup = cva({
	base: 'flex',
	variants: {
		orientation: {
			horizontal: 'flex-row items-center',
			vertical: 'flex-col items-stretch'
		},
		joined: {
			// Joined segments overlap by a pixel: a pressed segment sits above its neighbours so its
			// border is not cut by theirs, and a focused one above that.
			true: '[&>[data-checked=true]]:z-1 [&>*:focus-visible]:z-10 [&>*]:active:translate-y-0',
			false: 'gap-xs'
		}
	},
	compoundVariants: [
		{
			joined: true,
			orientation: 'horizontal',
			class:
				'first-child:rounded-r-none last-child:rounded-l-none not-first-not-last-child:rounded-none not-first-child:-ml-px'
		},
		{
			joined: true,
			orientation: 'vertical',
			class:
				'first-child:rounded-b-none last-child:rounded-t-none not-first-not-last-child:rounded-none not-first-child:-mt-px'
		}
	],
	defaultVariants: {
		orientation: 'horizontal',
		joined: false
	}
});

export const toggleButtonGroupTheme = {
	root: defaultToggleButtonGroup
};

export type ToggleButtonGroupTheme = typeof toggleButtonGroupTheme;
export type ToggleButtonGroupThemeProps = InferComponentTheme<ToggleButtonGroupTheme>;
export const setToggleButtonGroupTheme =
	setComponentTheme<ToggleButtonGroupTheme>('toggle-button-group');
export const useToggleButtonGroupTheme = useComponentTheme<ToggleButtonGroupTheme>(
	'toggleButtonGroup',
	toggleButtonGroupTheme
);
