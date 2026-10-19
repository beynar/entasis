import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import type { ButtonThemeProps } from '../Button/button.theme.js';
import type { MenuOptionThemeProps } from '../MenuOption/menuOption.theme.js';
import type { SeparatorThemeProps } from '../Separator/separator.theme.js';

// Spacing between rows follows `density` ('normal' keeps the previous default
// gap-0.5, so defaults render exactly as before the gap→density move).
const defaultMenu = cva({
	base: 'flex flex-col w-full',
	variants: {
		density: {
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// The `role="menu"` element itself: only rows, so a header or footer never sits inside it.
const defaultMenuList = cva({
	base: 'flex flex-col w-full outline-none',
	variants: {
		density: {
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// A `role="group"`: its rows follow the menu's own rhythm.
const defaultMenuGroup = cva({
	base: 'flex flex-col w-full',
	variants: {
		density: {
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultMenuGroupLabel = cva({
	base: 'text-xs font-medium text-neutral/70 select-none',
	variants: {
		density: {
			compact: 'px-sm pt-xs',
			normal: 'px-md pt-sm pb-micro',
			comfortable: 'px-lg pt-md pb-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

// The search field of a filterable menu: a row-height strip with a leading icon, a divider below.
// A translucent divider: `border-neutral-muted` is the very tone of a dark floating surface (a
// menu in a popover, the PhoneInput country picker), where it disappeared.
const defaultMenuSearch = cva({
	base: 'flex w-full items-center border-b border-neutral/15',
	variants: {
		size: {
			small: 'h-control-sm gap-sm px-sm',
			normal: 'h-control-md gap-md px-md',
			large: 'h-control-lg gap-md px-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuSearchIcon = cva({
	base: 'shrink-0 opacity-50',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-4.5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuSearchInput = cva({
	base: 'placeholder:text-neutral/70 w-full min-w-0 flex-1 bg-transparent outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuEmpty = cva({
	base: 'text-sm text-neutral/70 text-center select-none',
	variants: {
		density: {
			compact: 'px-sm py-xs',
			normal: 'px-md py-md',
			comfortable: 'px-lg py-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultMenuHeader = cva({
	base: ''
});

const defaultMenuFooter = cva({
	base: ''
});

export const menuTheme = {
	root: defaultMenu,
	list: defaultMenuList,
	group: defaultMenuGroup,
	groupLabel: defaultMenuGroupLabel,
	search: defaultMenuSearch,
	searchIcon: defaultMenuSearchIcon,
	searchInput: defaultMenuSearchInput,
	empty: defaultMenuEmpty,
	header: defaultMenuHeader,
	footer: defaultMenuFooter
};

export type MenuTheme = typeof menuTheme;

export type MenuThemeProps = InferComponentTheme<MenuTheme> & {
	button?: ButtonThemeProps;
	option?: MenuOptionThemeProps;
	separator?: SeparatorThemeProps;
	submenu?: MenuOptionThemeProps;
};

export const setMenuTheme = setComponentTheme<MenuTheme>('menu');
export const useMenuTheme = useComponentTheme<MenuTheme>('menu', menuTheme);
