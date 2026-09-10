import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// `size` scales typography/icons only; `density` owns paddings, gaps and
// min-heights ('small' matches the old small spacing, 'large' the old
// large spacing — defaults render exactly as before the split).
const defaultMenuOption = cva({
	base: 'state-layer rounded-md cursor-pointer items-center inline-flex relative w-full text-left outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			small: 'px-sm py-xs gap-sm min-h-6',
			normal: 'px-md py-sm gap-md min-h-7',
			large: 'px-lg py-md gap-md min-h-9'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50 pointer-events-none',
			false: ''
		},
		// The prop reflects to data-highlighted; the shared state layer owns its fill.
		highlighted: {
			true: '',
			false: ''
		},
		// Persistent highlight in the item's own color — e.g. a submenu trigger while its submenu is
		// open. Unlike `highlighted`, it tracks the `color` variant via the compoundVariants below.
		active: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ active: true, color: 'primary', class: 'bg-primary-muted text-primary-muted-readable' },
		{
			active: true,
			color: 'secondary',
			class: 'bg-secondary-muted text-secondary-muted-readable'
		},
		{
			active: true,
			color: 'neutral',
			class: 'bg-neutral-muted text-neutral-muted-readable'
		},
		{ active: true, color: 'danger', class: 'bg-danger-muted text-danger-muted-readable' },
		{ active: true, color: 'success', class: 'bg-success-muted text-success-muted-readable' },
		{ active: true, color: 'warning', class: 'bg-warning-muted text-warning-muted-readable' },
		{ active: true, color: 'info', class: 'bg-info-muted text-info-muted-readable' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		color: 'primary',
		disabled: false,
		active: false
	}
});

const defaultMenuOptionTitle = cva({
	base: 'font-normal leading-none',
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

const defaultMenuOptionDescription = cva({
	base: 'text-neutral/70  leading-none',
	variants: {
		size: {
			small: 'text-[0.625rem]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuOptionPrefix = cva({
	// Size the icon via the svg selector (icons default to height:1lh, which overflows a fixed box)
	// and center it in a square that tracks the row's text size.
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'size-3.5 [&_svg]:size-3.5',
			normal: 'size-4 [&_svg]:size-4',
			large: 'size-5 [&_svg]:size-5'
		},
		align: {
			start: 'mb-auto',
			center: 'my-auto'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuOptionSuffix = cva({
	// Sizes any trailing icon via the svg selector rather than fixing the container, so the
	// suffix can also hold text (a Command shortcut hint) or a check indicator.
	base: 'ml-auto flex shrink-0 items-center',
	variants: {
		size: {
			small: '[&_svg]:size-3',
			normal: '[&_svg]:size-4',
			large: '[&_svg]:size-5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuOptionContent = cva({
	base: 'flex flex-col flex-1',
	variants: {
		// Spacing between title and description follows density, not size.
		density: {
			small: 'gap-0',
			normal: 'gap-micro',
			large: 'gap-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

export const menuOptionTheme = {
	root: defaultMenuOption,
	title: defaultMenuOptionTitle,
	description: defaultMenuOptionDescription,
	prefix: defaultMenuOptionPrefix,
	suffix: defaultMenuOptionSuffix,
	content: defaultMenuOptionContent
};

export type MenuOptionTheme = typeof menuOptionTheme;
export type MenuOptionThemeProps = InferComponentTheme<MenuOptionTheme>;
export const setMenuOptionTheme = setComponentTheme<MenuOptionTheme>('menuOption');
export const useMenuOptionTheme = useComponentTheme<MenuOptionTheme>('menuOption', menuOptionTheme);
