import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import {
	layoutColumnGapClasses,
	layoutGapClasses,
	layoutRowGapClasses
} from '../Layout/layoutSpacing.js';

const defaultGrid = cva({
	base: 'grid min-w-0',
	variants: {
		gap: layoutGapClasses,
		rowGap: layoutRowGapClasses,
		columnGap: layoutColumnGapClasses,
		align: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			stretch: 'items-stretch'
		},
		justify: {
			start: 'justify-items-start',
			center: 'justify-items-center',
			end: 'justify-items-end',
			stretch: 'justify-items-stretch'
		}
	},
	defaultVariants: {
		gap: 'none',
		align: 'stretch',
		justify: 'stretch'
	}
});

export const gridTheme = {
	root: defaultGrid
};

export type GridTheme = typeof gridTheme;
export type GridThemeProps = InferComponentTheme<GridTheme>;
export const setGridTheme = setComponentTheme<GridTheme>('grid');
export const useGridTheme = useComponentTheme<GridTheme>('grid', gridTheme);
