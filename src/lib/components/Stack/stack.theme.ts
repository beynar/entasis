import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import {
	layoutGapClasses,
	layoutPaddingBlockClasses,
	layoutPaddingInlineClasses
} from '../Layout/layoutSpacing.js';

const defaultStack = cva({
	base: 'flex min-w-0',
	variants: {
		direction: {
			horizontal: 'flex-row',
			vertical: 'flex-col'
		},
		mainAlign: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end',
			between: 'justify-between',
			around: 'justify-around',
			evenly: 'justify-evenly'
		},
		crossAlign: {
			start: 'items-start',
			center: 'items-center',
			end: 'items-end',
			stretch: 'items-stretch'
		},
		gap: layoutGapClasses,
		paddingInline: layoutPaddingInlineClasses,
		paddingBlock: layoutPaddingBlockClasses,
		wrap: {
			nowrap: 'flex-nowrap',
			wrap: 'flex-wrap',
			'wrap-reverse': 'flex-wrap-reverse'
		},
		scrollable: {
			true: 'overflow-auto',
			false: null
		}
	},
	defaultVariants: {
		direction: 'vertical',
		mainAlign: 'start',
		crossAlign: 'stretch',
		gap: 'none',
		wrap: 'nowrap',
		scrollable: false
	}
});

export const stackTheme = {
	root: defaultStack
};

export type StackTheme = typeof stackTheme;
export type StackThemeProps = InferComponentTheme<StackTheme>;
export const setStackTheme = setComponentTheme<StackTheme>('stack');
export const useStackTheme = useComponentTheme<StackTheme>('stack', stackTheme);
