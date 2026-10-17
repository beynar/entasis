import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';
import { selectedSoft } from '$lib/components/Theme/theme.recipes.js';

// The nav landmark is the positioning context of the panel area: the viewport is absolutely
// placed against it, in the document flow, never portaled.
const defaultNavigationMenu = cva({
	base: 'relative w-fit max-w-full',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultNavigationMenuList = cva({
	base: 'm-0 flex list-none flex-wrap items-center p-0',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultNavigationMenuItem = cva({
	base: 'relative flex items-center'
});

// Extra classes for the Button a panel trigger renders. An open panel's trigger wears the shared
// soft selected recipe, like the open trigger of a MenuBar.
const defaultNavigationMenuTrigger = cva({
	base: 'gap-xs',
	variants: {
		open: {
			true: selectedSoft,
			false: ''
		}
	},
	defaultVariants: {
		open: false
	}
});

// A plain top-level link renders the same Button; `active` marks the current page.
const defaultNavigationMenuLink = cva({
	base: '',
	variants: {
		active: {
			true: selectedSoft,
			false: ''
		}
	},
	defaultVariants: {
		active: false
	}
});

const defaultNavigationMenuCaret = cva({
	base: 'inline-flex shrink-0 items-center transition-transform duration-fast ease-standard',
	variants: {
		open: {
			true: 'rotate-180',
			false: ''
		}
	},
	defaultVariants: {
		open: false
	}
});

// The positioning wrapper under the trigger row. Its top padding is the visual gap to the
// triggers, kept inside the wrapper so the pointer never crosses dead space on its way in. The
// placement variables are written by the component: `translate` aligns the panel to the active
// trigger's inline edge and keeps it inside the layout viewport.
const defaultNavigationMenuViewport = cva({
	base: 'absolute left-0 w-max max-w-[calc(100vw-1rem)] pt-xs',
	variants: {
		switching: {
			true: 'transition-[translate] duration-normal ease-standard',
			false: ''
		}
	},
	defaultVariants: {
		switching: false
	}
});

// The visible, animated surface. It animates its own width and height as the active panel
// changes, so it hugs whichever panel it shows.
const defaultNavigationMenuPopup = cva({
	base: 'raised-3 bg-surface-floating text-neutral isolate max-w-full origin-top rounded-lg text-sm',
	variants: {
		density: {
			compact: 'p-sm',
			normal: 'p-md',
			comfortable: 'p-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultNavigationMenuPanel = cva({
	base: 'flex flex-col',
	variants: {
		density: {
			compact: 'gap-xs',
			normal: 'gap-sm',
			comfortable: 'gap-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultNavigationMenuContentList = cva({
	base: 'm-0 grid list-none p-0',
	variants: {
		density: {
			compact: 'gap-0',
			normal: 'gap-micro',
			comfortable: 'gap-xs'
		},
		nested: {
			true: 'ps-md',
			false: 'min-w-64'
		}
	},
	defaultVariants: {
		density: 'normal',
		nested: false
	}
});

// A link row inside a panel: flush against the popup's padding box, so it takes the concentric
// radius like a menu option.
const defaultNavigationMenuContentLink = cva({
	base: 'state-layer rounded-md-concentric relative flex w-full cursor-pointer items-start text-start no-underline outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		density: {
			compact: 'px-sm py-xs gap-sm',
			normal: 'px-md py-sm gap-md',
			comfortable: 'px-lg py-md gap-md'
		},
		active: {
			true: selectedSoft,
			false: ''
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		active: false,
		disabled: false
	}
});

const defaultNavigationMenuContentPrefix = cva({
	base: 'inline-flex shrink-0 items-center [&>svg]:size-icon-md'
});

const defaultNavigationMenuContentText = cva({
	base: 'flex min-w-0 flex-col gap-micro'
});

const defaultNavigationMenuContentTitle = cva({
	base: 'font-medium leading-snug'
});

const defaultNavigationMenuContentDescription = cva({
	base: 'text-neutral/70 text-xs leading-snug'
});

// The inline disclosure of a nested level: a row that looks like a link and expands its own
// list underneath.
const defaultNavigationMenuNestedTrigger = cva({
	base: 'state-layer rounded-md-concentric relative flex w-full cursor-pointer items-center justify-between text-start outline-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		density: {
			compact: 'px-sm py-xs gap-sm',
			normal: 'px-md py-sm gap-md',
			comfortable: 'px-lg py-md gap-md'
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		disabled: false
	}
});

// The popup lifts in from its trigger and settles back out. `duration` and `easing` stay tokens,
// so `<Theme motion>` and the reduced-motion preference reach it. A panel that replaces another
// slides in from the side of the new trigger with the same duration and easing.
export const defaultNavigationMenuMotion = motion({
	base: {
		in: { x: 0, y: -4, scale: 0.98, opacity: 0 },
		out: { x: 0, y: -4, scale: 0.98, opacity: 0 },
		duration: 'fast',
		easing: 'enter'
	}
});

export const navigationMenuTheme = {
	motion: defaultNavigationMenuMotion,
	root: defaultNavigationMenu,
	list: defaultNavigationMenuList,
	item: defaultNavigationMenuItem,
	trigger: defaultNavigationMenuTrigger,
	link: defaultNavigationMenuLink,
	caret: defaultNavigationMenuCaret,
	viewport: defaultNavigationMenuViewport,
	popup: defaultNavigationMenuPopup,
	panel: defaultNavigationMenuPanel,
	contentList: defaultNavigationMenuContentList,
	contentLink: defaultNavigationMenuContentLink,
	contentPrefix: defaultNavigationMenuContentPrefix,
	contentText: defaultNavigationMenuContentText,
	contentTitle: defaultNavigationMenuContentTitle,
	contentDescription: defaultNavigationMenuContentDescription,
	nestedTrigger: defaultNavigationMenuNestedTrigger
};

export type NavigationMenuTheme = typeof navigationMenuTheme;
export type NavigationMenuThemeProps = InferComponentTheme<NavigationMenuTheme>;
export const setNavigationMenuTheme = setComponentTheme<NavigationMenuTheme>('navigation-menu');
export const useNavigationMenuTheme = useComponentTheme<NavigationMenuTheme>(
	'navigation-menu',
	navigationMenuTheme
);
export const useNavigationMenuMotion = () =>
	useComponentMotion('navigation-menu', defaultNavigationMenuMotion);
