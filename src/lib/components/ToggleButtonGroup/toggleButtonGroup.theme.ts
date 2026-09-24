import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultToggleButtonGroup = cva({
	base: 'flex items-center',
	variants: {
		joined: {
			true: 'first-child:rounded-r-none last-child:rounded-l-none not-first-not-last-child:rounded-none not-first-child:-ml-px [&>*:focus-visible]:z-10 [&>*]:active:translate-y-0',
			false: 'gap-xs'
		}
	},
	defaultVariants: {
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
