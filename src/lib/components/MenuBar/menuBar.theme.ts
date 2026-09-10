import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultMenuBar = cva({
	base: 'bg-surface inline-flex w-fit max-w-full items-center overflow-x-auto rounded-md scrollbar-none',
	variants: {
		size: {
			small: 'gap-micro p-micro',
			normal: 'gap-micro p-xs',
			large: 'gap-xs p-xs'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuBarTrigger = cva({
	base: 'focus-visible:ring-inset',
	variants: {
		active: {
			true: 'bg-neutral-muted text-neutral-muted-readable',
			false: ''
		}
	},
	defaultVariants: {
		active: false
	}
});

export const menuBarTheme = {
	root: defaultMenuBar,
	trigger: defaultMenuBarTrigger
};

export type MenuBarTheme = typeof menuBarTheme;
export type MenuBarThemeProps = InferComponentTheme<MenuBarTheme>;
export const setMenuBarTheme = setComponentTheme<MenuBarTheme>('menuBar');
export const useMenuBarTheme = useComponentTheme<MenuBarTheme>('menuBar', menuBarTheme);
