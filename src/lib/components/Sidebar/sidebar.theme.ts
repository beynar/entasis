import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const sidebarSizeVariables = {
	small:
		'[--sidebar-icon-size:0.875rem] [--sidebar-media-size:1.75rem] [--sidebar-compact-media-size:1rem]',
	normal:
		'[--sidebar-icon-size:1rem] [--sidebar-media-size:2rem] [--sidebar-compact-media-size:1.25rem]',
	large:
		'[--sidebar-icon-size:1.25rem] [--sidebar-media-size:2.25rem] [--sidebar-compact-media-size:1.5rem]'
};

const sidebarDensityVariables = {
	small: '[--sidebar-group-padding:0.375rem] [--sidebar-section-padding:0.375rem]',
	normal: '[--sidebar-group-padding:0.5rem] [--sidebar-section-padding:0.5rem]',
	large: '[--sidebar-group-padding:0.75rem] [--sidebar-section-padding:0.75rem]'
};

const defaultRoot = cva({
	base: 'group/sidebar-wrapper flex w-full bg-surface-canvas text-neutral',
	variants: {
		variant: {
			admin: '',
			floating: '',
			inset: '',
			split: ''
		}
	},
	defaultVariants: {
		variant: 'admin'
	}
});

const defaultPanel = cva({
	base: 'flex h-full flex-col text-neutral group-data-[collapsible=icon]:overflow-hidden',
	variants: {
		variant: {
			admin:
				'border-neutral-muted bg-surface-canvas [--sidebar-icon-button-width:calc(var(--sidebar-width-icon)-0.5rem)] data-[side=left]:border-r data-[side=right]:border-l',
			floating:
				'rounded-lg border border-neutral-muted bg-surface shadow-sm [--sidebar-icon-button-width:var(--sidebar-width-icon)]',
			inset:
				'border-0 bg-surface-canvas shadow-none [--sidebar-icon-button-width:calc(var(--sidebar-width-icon)-0.5rem)]',
			split:
				'rounded-lg border border-neutral-muted bg-surface shadow-sm [--sidebar-icon-button-width:var(--sidebar-width-icon)]'
		},
		placement: {
			panel: 'w-[var(--sidebar-width)]',
			static: 'w-[var(--sidebar-width)]',
			positioned: 'w-full'
		},
		size: sidebarSizeVariables,
		density: sidebarDensityVariables
	},
	compoundVariants: [
		{ variant: ['floating', 'split'], placement: 'static', class: 'm-md' },
		{
			variant: 'inset',
			placement: 'static',
			class: 'my-md h-[calc(100%_-_1rem)]'
		}
	],
	defaultVariants: {
		variant: 'admin',
		placement: 'positioned',
		size: 'normal',
		density: 'normal'
	}
});

const defaultStackSection = cva({
	base: 'flex flex-col group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-[var(--sidebar-group-padding)] group-data-[collapsible=icon]:py-[calc((var(--sidebar-width-icon)-var(--sidebar-icon-button-width))/2)] group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-button]]:h-[var(--sidebar-icon-button-width)]',
	variants: {
		density: {
			small: 'gap-xs p-sm',
			normal: 'gap-md p-md',
			large: 'gap-lg p-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultNav = cva({
	base: 'scrollbar scrollbar-none flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden',
	variants: {
		density: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultGroup = cva({
	base: 'relative flex w-full min-w-0 flex-col',
	variants: {
		density: {
			small: 'p-sm',
			normal: 'p-md',
			large: 'p-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultGroupLabel = cva({
	base: 'text-neutral/65 flex shrink-0 items-center rounded-sm font-medium outline-none transition-[height,margin,padding,opacity] duration-200 ease-linear group-data-[collapsible=icon]:opacity-0 disabled:pointer-events-none [&>svg]:shrink-0',
	variants: {
		interactive: {
			true: 'state-layer hover:text-neutral focus-visible:ring-2 focus-visible:ring-primary/40',
			false: null
		},
		componentSize: {
			small: 'h-7 text-[0.6875rem] group-data-[collapsible=icon]:-mt-layout-md [&>svg]:size-3.5',
			normal: 'h-8 text-xs group-data-[collapsible=icon]:-mt-layout-lg [&>svg]:size-4',
			large: 'h-9 text-sm group-data-[collapsible=icon]:-mt-layout-lg [&>svg]:size-5'
		},
		density: {
			small: 'px-md',
			normal: 'px-lg',
			large: 'px-lg'
		}
	},
	defaultVariants: {
		interactive: false,
		componentSize: 'normal',
		density: 'normal'
	}
});

const defaultGroupAction = cva({
	base: 'state-layer text-neutral hover:text-neutral absolute flex aspect-square items-center justify-center rounded-sm p-0 outline-none transition group-data-[collapsible=icon]:hidden focus-visible:ring-2 focus-visible:ring-primary/40 [&>svg]:shrink-0',
	variants: {
		componentSize: {
			small: 'top-[calc(var(--sidebar-group-padding)+0.3125rem)] size-4.5 [&>svg]:size-3.5',
			normal: 'top-[calc(var(--sidebar-group-padding)+0.375rem)] size-5 [&>svg]:size-4',
			large: 'top-[calc(var(--sidebar-group-padding)+0.375rem)] size-6 [&>svg]:size-5'
		},
		density: {
			small: 'right-2.5',
			normal: 'right-3',
			large: 'right-4'
		},
		hasToggle: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ density: 'small', hasToggle: true, class: 'right-8' },
		{ density: 'normal', hasToggle: true, class: 'right-10' },
		{ density: 'large', hasToggle: true, class: 'right-12' }
	],
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal',
		hasToggle: false
	}
});

const defaultMenu = cva({
	base: 'flex w-full min-w-0 flex-col',
	variants: {
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

const defaultMenuButton = cva({
	base: 'state-layer peer/menu-button group/menu-button flex w-full items-center overflow-hidden rounded-sm text-left outline-none transition-[background,color,width,height,padding,margin,border-radius] duration-200 ease-linear hover:text-neutral focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-primary-muted data-active:text-primary-muted-readable data-active:font-medium group-has-data-[sidebar=menu-action]/menu-item:pr-layout-lg group-data-[collapsible=icon]:mx-[calc((var(--sidebar-width-icon)-var(--sidebar-icon-button-width))/2-var(--sidebar-group-padding))] group-data-[collapsible=icon]:w-[var(--sidebar-icon-button-width)] group-data-[collapsible=icon]:rounded-none group-data-[variant=admin]:group-data-[collapsible=icon]:rounded-sm group-data-[variant=inset]:group-data-[collapsible=icon]:rounded-sm group-data-[collapsible=icon]:![padding-inline:calc((var(--sidebar-icon-button-width)-var(--sidebar-icon-size))/2)] group-data-[collapsible=icon]:ring-inset [&_svg]:shrink-0',
	variants: {
		variant: {
			default: '',
			outline: 'border border-neutral-muted bg-surface'
		},
		componentSize: {
			small: 'text-xs leading-4 [&_svg]:size-3.5',
			normal: 'text-sm leading-5 [&_svg]:size-4',
			large: 'text-base leading-6 [&_svg]:size-5'
		},
		density: {
			small: 'gap-sm px-sm',
			normal: 'gap-md px-md',
			large: 'gap-md px-md'
		},
		size: {
			default: '',
			sm: 'text-xs',
			lg: ''
		}
	},
	compoundVariants: [
		{ componentSize: 'small', size: 'sm', class: 'h-7' },
		{ componentSize: 'small', size: 'default', class: 'h-8' },
		{ componentSize: 'small', size: 'lg', class: 'h-12' },
		{ componentSize: 'normal', size: 'sm', class: 'h-8' },
		{ componentSize: 'normal', size: 'default', class: 'h-9' },
		{ componentSize: 'normal', size: 'lg', class: 'h-14' },
		{ componentSize: 'large', size: 'sm', class: 'h-9' },
		{ componentSize: 'large', size: 'default', class: 'h-10' },
		{ componentSize: 'large', size: 'lg', class: 'h-16' }
	],
	defaultVariants: {
		variant: 'default',
		componentSize: 'normal',
		density: 'normal',
		size: 'default'
	}
});

const defaultMenuLabel = cva({
	base: 'min-w-0 flex-1 truncate whitespace-nowrap opacity-100 transition-[opacity,transform] duration-150 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0'
});

const defaultMenuSecondary = cva({
	base: 'truncate text-neutral/60',
	variants: {
		componentSize: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		componentSize: 'normal'
	}
});

const defaultMenuTrailing = cva({
	base: 'ml-auto shrink-0 opacity-100 transition-[opacity,transform] duration-150 ease-out group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0',
	variants: {
		componentSize: {
			small: '[&>svg]:size-3.5',
			normal: '[&>svg]:size-4',
			large: '[&>svg]:size-5'
		}
	},
	defaultVariants: {
		componentSize: 'normal'
	}
});

const defaultSubMenu = cva({
	base: 'border-neutral-muted flex min-w-0 translate-x-px flex-col border-l',
	variants: {
		density: {
			small: 'mx-md gap-micro px-md py-micro',
			normal: 'mx-lg gap-xs px-md py-micro',
			large: 'mx-xl gap-sm px-lg py-xs'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultTreeSubMenu = cva({
	base: 'border-neutral-muted ml-0 flex min-w-0 translate-x-px flex-col border-l',
	variants: {
		density: {
			small: 'ml-sm gap-micro py-micro pl-sm',
			normal: 'ml-md gap-xs py-micro pl-md',
			large: 'ml-md gap-sm py-xs pl-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultSubButton = cva({
	base: 'state-layer text-neutral/80 hover:text-neutral flex min-w-0 -translate-x-px items-center overflow-hidden rounded-sm outline-none transition-[background,color,height,padding] duration-200 ease-linear focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:bg-primary-muted data-active:text-primary-muted-readable [&>span:last-child]:truncate [&>svg]:shrink-0',
	variants: {
		componentSize: {
			small: 'h-6 text-xs leading-4 [&>svg]:size-3.5',
			normal: 'h-7 text-sm leading-5 [&>svg]:size-4',
			large: 'h-8 text-base leading-6 [&>svg]:size-5'
		},
		density: {
			small: 'gap-sm px-md',
			normal: 'gap-md px-lg',
			large: 'gap-md px-lg'
		},
		size: {
			sm: 'text-xs',
			md: ''
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal',
		size: 'md'
	}
});

const defaultMenuAction = cva({
	base: 'state-layer text-neutral hover:text-neutral peer-hover/menu-button:text-neutral absolute top-1/2 flex aspect-square -translate-y-1/2 items-center justify-center rounded-sm p-0 opacity-100 outline-none transition group-data-[collapsible=icon]:hidden focus-visible:ring-2 focus-visible:ring-primary/40 md:opacity-0 group-focus-within/menu-row:opacity-100 group-hover/menu-row:opacity-100 has-[[aria-expanded=true]]:opacity-100 [&>svg]:shrink-0',
	variants: {
		componentSize: {
			small: 'size-4.5 [&>svg]:size-3.5',
			normal: 'size-5 [&>svg]:size-4',
			large: 'size-6 [&>svg]:size-5'
		},
		density: {
			small: 'right-0.5',
			normal: 'right-1',
			large: 'right-1.5'
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal'
	}
});

const defaultActionTrigger = cva({
	base: 'flex size-full items-center justify-center rounded-sm bg-transparent outline-none [&>svg]:shrink-0',
	variants: {
		componentSize: {
			small: '[&>svg]:size-3.5',
			normal: '[&>svg]:size-4',
			large: '[&>svg]:size-5'
		}
	},
	defaultVariants: {
		componentSize: 'normal'
	}
});

const defaultBadge = cva({
	base: 'text-neutral/70 peer-hover/menu-button:text-neutral peer-data-active/menu-button:text-primary-muted-readable pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-sm px-xs font-medium tabular-nums select-none group-data-[collapsible=icon]:hidden',
	variants: {
		componentSize: {
			small: 'h-4 min-w-4 text-[0.6875rem]',
			normal: 'h-5 min-w-5 text-xs',
			large: 'h-6 min-w-6 text-sm'
		},
		density: {
			small: 'right-0.5',
			normal: 'right-1',
			large: 'right-1.5'
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal'
	}
});

const defaultSearchContainer = cva({
	base: 'relative w-full opacity-100 transition-[height,margin,opacity] duration-200 ease-linear',
	variants: {
		componentSize: {
			small: 'h-8',
			normal: 'h-9',
			large: 'h-10'
		},
		collapsed: {
			true: 'pointer-events-none h-0 !m-0 overflow-hidden opacity-0',
			false: 'overflow-visible'
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		collapsed: false
	}
});

const defaultSearch = cva({
	base: 'border-neutral-muted bg-surface-raised text-neutral placeholder:text-neutral/45 w-full rounded-sm border shadow-none outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20',
	variants: {
		componentSize: {
			small: 'h-8 text-xs',
			normal: 'h-9 text-sm',
			large: 'h-10 text-base'
		},
		density: {
			small: 'px-layout-md',
			normal: 'px-layout-lg',
			large: 'px-layout-lg'
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal'
	}
});

const defaultSearchIcon = cva({
	base: 'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center text-neutral/45 select-none [&_svg]:size-full',
	variants: {
		componentSize: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-5'
		},
		density: {
			small: 'left-1.5',
			normal: 'left-2',
			large: 'left-2.5'
		}
	},
	defaultVariants: {
		componentSize: 'normal',
		density: 'normal'
	}
});

const defaultSeparator = cva({
	base: 'bg-neutral-muted h-px w-auto shrink-0',
	variants: {
		density: {
			small: 'mx-sm',
			normal: 'mx-md',
			large: 'mx-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultRail = cva({
	base: 'absolute z-20 hidden w-4 outline-none transition-all ease-linear after:absolute after:start-1/2 after:-translate-x-1/2 after:transition-[height,width,background-color,opacity] after:duration-150 focus-visible:after:opacity-100 sm:flex',
	variants: {
		variant: {
			admin: 'inset-y-0',
			floating: 'inset-y-2',
			inset: 'inset-y-2',
			split: 'inset-y-2'
		},
		side: {
			left: 'right-0 cursor-w-resize',
			right: 'left-0 cursor-e-resize'
		},
		appearance: {
			line: 'after:inset-y-0 after:w-px after:bg-transparent hover:after:bg-neutral-muted',
			thumb:
				'cursor-pointer after:top-1/2 after:h-8 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-neutral/15 after:opacity-0 group-hover:after:opacity-100 hover:after:h-10 hover:after:bg-neutral/35'
		}
	},
	compoundVariants: [
		{ variant: ['admin', 'inset'], side: 'left', class: 'translate-x-1/2' },
		{ variant: ['admin', 'inset'], side: 'right', class: '-translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'left', class: 'right-2 translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'right', class: 'left-2 -translate-x-1/2' }
	],
	defaultVariants: {
		variant: 'admin',
		side: 'left',
		appearance: 'line'
	}
});

const defaultResizeHandle = cva({
	base: 'absolute inset-y-0 z-30 hidden w-2 cursor-col-resize touch-none outline-none transition-opacity md:block after:absolute after:left-1/2 after:-translate-x-1/2 after:transition-[height,width,background-color,opacity] after:duration-150 focus-visible:after:bg-primary focus-visible:after:opacity-100 data-[dragging=true]:after:bg-primary data-[dragging=true]:after:opacity-100',
	variants: {
		variant: {
			admin: '',
			floating: 'inset-y-2',
			inset: 'inset-y-2',
			split: 'inset-y-2'
		},
		side: {
			left: 'right-0 group-data-[edge-revealed=true]:translate-x-[calc(var(--sidebar-width)_+_50%)]',
			right:
				'left-0 group-data-[edge-revealed=true]:translate-x-[calc(0px_-_var(--sidebar-width)_-_50%)]'
		},
		appearance: {
			line: 'after:inset-y-2 after:w-px after:bg-transparent hover:after:bg-primary/45',
			thumb:
				'after:top-1/2 after:h-8 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-neutral/15 after:opacity-0 group-hover:after:opacity-100 hover:after:h-10 hover:after:bg-neutral/35'
		},
		dragging: {
			true: 'after:bg-primary',
			false: ''
		},
		disabled: {
			true: 'pointer-events-none opacity-0',
			false: ''
		},
		combined: {
			true: 'w-6',
			false: 'w-2'
		}
	},
	compoundVariants: [
		{ variant: ['admin', 'inset'], side: 'left', class: 'translate-x-1/2' },
		{ variant: ['admin', 'inset'], side: 'right', class: '-translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'left', class: 'right-2 translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'right', class: 'left-2 -translate-x-1/2' }
	],
	defaultVariants: {
		variant: 'admin',
		side: 'left',
		appearance: 'line',
		dragging: false,
		disabled: false,
		combined: false
	}
});

const defaultMain = cva({
	base: 'relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-transparent [--page-shell-edge-inset:0px] transition-[transform,translate,padding,border-radius] duration-200 ease-linear',
	variants: {
		variant: {
			admin: 'bg-surface',
			floating: 'bg-surface-canvas',
			inset: 'bg-surface-canvas md:py-md',
			split: 'bg-surface-canvas md:py-md md:rounded-lg'
		},
		side: {
			left: '',
			right: ''
		},
		displayState: {
			expanded: '',
			collapsed: '',
			hidden: ''
		},
		edgeRevealed: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{
			variant: ['inset', 'split'],
			displayState: ['expanded', 'collapsed'],
			class: 'md:[--page-shell-edge-inset:0.5rem]'
		},
		{
			variant: 'inset',
			side: 'left',
			class: 'md:rounded-l-lg'
		},
		{
			variant: 'inset',
			side: 'right',
			class: 'md:rounded-r-lg'
		},
		{
			variant: 'split',
			side: 'left',
			class: 'md:pr-md md:pl-0'
		},
		{
			variant: 'split',
			side: 'right',
			class: 'md:pr-0 md:pl-md'
		},
		{
			variant: ['inset', 'split'],
			displayState: 'hidden',
			class: 'md:p-0 md:rounded-none'
		}
	],
	defaultVariants: {
		variant: 'admin',
		side: 'left',
		displayState: 'expanded',
		edgeRevealed: false
	}
});

const defaultEdgeTrigger = cva({
	base: 'absolute inset-y-0 z-50 hidden w-3 bg-transparent outline-none transition-all md:block after:absolute after:inset-y-0 after:w-px after:bg-transparent hover:after:bg-primary/45 focus-visible:ring-2 focus-visible:ring-primary/40 data-[side=left]:left-0 data-[side=left]:cursor-e-resize data-[side=left]:after:left-0 data-[side=right]:right-0 data-[side=right]:cursor-w-resize data-[side=right]:after:right-0'
});

const defaultOverlay = cva({
	base: 'fixed inset-0 z-40 bg-neutral/35 md:hidden'
});

const defaultMobilePanel = cva({
	base: 'flex h-full min-h-0 w-[var(--sidebar-width-mobile)] flex-col bg-surface-floating text-neutral md:hidden',
	variants: {
		side: {
			left: '',
			right: ''
		},
		size: sidebarSizeVariables,
		density: sidebarDensityVariables
	},
	defaultVariants: {
		side: 'left',
		size: 'normal',
		density: 'normal'
	}
});

const defaultMedia = cva({
	base: 'bg-primary text-primary-contrast flex aspect-square shrink-0 items-center justify-center rounded-sm',
	variants: {
		size: {
			default: '',
			compact: 'text-xs'
		},
		componentSize: {
			small: '',
			normal: '',
			large: ''
		}
	},
	compoundVariants: [
		{ size: 'default', componentSize: 'small', class: 'size-7 [&_svg]:size-3.5' },
		{ size: 'default', componentSize: 'normal', class: 'size-8 [&_svg]:size-4' },
		{ size: 'default', componentSize: 'large', class: 'size-9 [&_svg]:size-5' },
		{ size: 'compact', componentSize: 'small', class: 'size-4 [&_svg]:size-2.5' },
		{ size: 'compact', componentSize: 'normal', class: 'size-5 [&_svg]:size-3' },
		{ size: 'compact', componentSize: 'large', class: 'size-6 [&_svg]:size-3.5' }
	],
	defaultVariants: {
		size: 'default',
		componentSize: 'normal'
	}
});

const defaultAvatar = cva({
	base: 'bg-neutral-muted text-neutral-muted-readable flex shrink-0 items-center justify-center overflow-hidden rounded-sm font-medium',
	variants: {
		componentSize: {
			small: 'size-7 text-[0.6875rem]',
			normal: 'size-8 text-xs',
			large: 'size-9 text-sm'
		}
	},
	defaultVariants: {
		componentSize: 'normal'
	}
});

export const sidebarTheme = {
	root: defaultRoot,
	panel: defaultPanel,
	header: defaultStackSection,
	nav: defaultNav,
	footer: defaultStackSection,
	group: defaultGroup,
	groupLabel: defaultGroupLabel,
	groupAction: defaultGroupAction,
	groupContent: cva({
		base: 'w-full',
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
	}),
	menu: defaultMenu,
	menuItem: cva({ base: 'group/menu-item relative' }),
	menuButton: defaultMenuButton,
	menuLabel: defaultMenuLabel,
	menuSecondary: defaultMenuSecondary,
	menuTrailing: defaultMenuTrailing,
	subMenu: defaultSubMenu,
	treeSubMenu: defaultTreeSubMenu,
	subButton: defaultSubButton,
	menuAction: defaultMenuAction,
	actionTrigger: defaultActionTrigger,
	badge: defaultBadge,
	searchContainer: defaultSearchContainer,
	search: defaultSearch,
	searchIcon: defaultSearchIcon,
	separator: defaultSeparator,
	rail: defaultRail,
	resizeHandle: defaultResizeHandle,
	edgeTrigger: defaultEdgeTrigger,
	overlay: defaultOverlay,
	mobilePanel: defaultMobilePanel,
	main: defaultMain,
	media: defaultMedia,
	avatar: defaultAvatar
};

export type SidebarTheme = typeof sidebarTheme;
export type SidebarThemeProps = InferComponentTheme<SidebarTheme>;
export const setSidebarTheme = setComponentTheme<SidebarTheme>('sidebar');
export const useSidebarTheme = useComponentTheme<SidebarTheme>('sidebar', sidebarTheme);
