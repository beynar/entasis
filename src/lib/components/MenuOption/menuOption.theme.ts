import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// `size` scales typography/icons only; `density` owns paddings, gaps and
// min-heights ('small' matches the old small spacing, 'large' the old
// large spacing — defaults render exactly as before the split).
// A row is always flush against the padding box of whatever hosts it — a popover panel, a Command
// palette, a Select listbox — so it keeps the `md` control step but never more than the host's
// corner allows: `rounded-md-concentric` = `min(md, radius-parent - padding)`, computed from what
// that host publishes to it (`min(8px, 12 - 8)` = 4px inside a `rounded-lg p-md` panel). Outside
// any rounded container the parent radius is infinite, so the row is exactly `md` and reads as the
// control it is.
const defaultMenuOption = cva({
	base: 'state-layer rounded-md-concentric cursor-pointer items-center inline-flex relative w-full text-left outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		density: {
			compact: 'px-sm py-xs gap-sm min-h-6',
			normal: 'px-md py-sm gap-md min-h-row-sm',
			comfortable: 'px-lg py-md gap-md min-h-row-md'
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
		// Persistent highlight — e.g. a submenu trigger while its submenu is open. Unlike
		// `highlighted` (transient, owned by the state layer) this is a selection, so it paints the
		// `selected` STATE ROLE. `bg-selected-muted` falls back to the row's own `--color` (set from
		// `data-color`), so an info option still highlights info until a Theme pins `selectedColor`.
		active: {
			true: 'bg-selected-muted text-selected-muted-readable',
			false: ''
		}
	},
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
			large: 'text-sm'
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
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-xs'
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
			small: 'size-3.5 [&_svg]:size-icon-sm',
			normal: 'size-4 [&_svg]:size-icon-md',
			large: 'size-5 [&_svg]:size-icon-lg'
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
			small: '[&_svg]:size-icon-xs',
			normal: '[&_svg]:size-icon-md',
			large: '[&_svg]:size-icon-lg'
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
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
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
