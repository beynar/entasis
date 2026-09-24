import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultButtonGroup = cva({
	// Joined segments: collapse adjacent 1px borders with -ml-px, square inner corners,
	// and lift the focused or pressed segment so its ring and 1px press-translate
	// aren't clipped by neighbors.
	base: 'flex items-center first-child:rounded-r-none last-child:rounded-l-none not-first-not-last-child:rounded-none not-first-child:-ml-px [&>*:focus-visible]:z-10 [&>*:active]:z-10'
});

export const buttonGroupTheme = {
	root: defaultButtonGroup
};

export type ButtonGroupTheme = typeof buttonGroupTheme;
export type ButtonGroupThemeProps = InferComponentTheme<ButtonGroupTheme>;
export const setButtonGroupTheme = setComponentTheme<ButtonGroupTheme>('button-group');
export const useButtonGroupTheme = useComponentTheme<ButtonGroupTheme>(
	'buttonGroup',
	buttonGroupTheme
);
