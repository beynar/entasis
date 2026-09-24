import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// Active rows paint one of three recipes, chosen by the Sidebar's `activeVariant` and read off
// the row's own `data-active-variant` attribute (never a descendant selector): `soft` is the
// shared `selectedSoft` recipe in `src/lib/components/Theme/theme.recipes.ts`
// (`bg-selected-muted text-selected-muted-readable`), `solid` its `selectedSolid` counterpart
// (`bg-selected text-selected-contrast`), and `outline` a bordered surface card on the tinted well.
// The classes are spelled out with the `data-active:` prefix rather than imported, because a
// Tailwind variant prefix only applies to the first class of a string and so cannot be composed
// from a runtime constant.

// The three active recipes, stacked behind `data-active-variant` so only the row's own attribute
// decides which one paints. Shared by the menu rows and the submenu/tree rows.
const activeVariants = {
	soft: 'data-[active-variant=soft]:data-active:bg-selected-muted data-[active-variant=soft]:data-active:text-selected-muted-readable',
	solid:
		'data-[active-variant=solid]:data-active:bg-selected data-[active-variant=solid]:data-active:text-selected-contrast',
	outline:
		'data-[active-variant=outline]:data-active:bg-surface data-[active-variant=outline]:data-active:border data-[active-variant=outline]:data-active:border-neutral-muted data-[active-variant=outline]:data-active:text-neutral'
};

// The `--sidebar-*` properties are INTERNAL: one `size` step publishes the icon, media and
// compact-media dimensions the rows read back, so every part scales together. A consumer
// changes `size`, never one of these properties.
// Icon and leading-media sizes. `size` sets them by default; `iconSize`, declared after it on the
// panel parts, publishes the same variables and wins when a consumer sets it on its own.
const sidebarSizeVariables = {
	// The same tokens the rest of the kit sizes icons and media by, so a `spacing` retune still
	// reaches the sidebar; `iconSize` simply republishes them one step up or down.
	small:
		'[--sidebar-icon-size:var(--icon-size-sm)] [--sidebar-media-size:calc(var(--spacing)*7)] [--sidebar-compact-media-size:calc(var(--spacing)*4)]',
	normal:
		'[--sidebar-icon-size:var(--icon-size-md)] [--sidebar-media-size:calc(var(--spacing)*8)] [--sidebar-compact-media-size:calc(var(--spacing)*5)]',
	large:
		'[--sidebar-icon-size:var(--icon-size-lg)] [--sidebar-media-size:calc(var(--spacing)*9)] [--sidebar-compact-media-size:calc(var(--spacing)*6)]'
};

const sidebarDensityVariables = {
	// The same spacing tokens the group's `p-sm/md/lg` resolve to, so anything positioned from
	// these variables (the group action) stays on the label's midline at every `--spacing`.
	compact: '[--sidebar-group-padding:var(--space-sm)] [--sidebar-section-padding:var(--space-sm)]',
	normal: '[--sidebar-group-padding:var(--space-md)] [--sidebar-section-padding:var(--space-md)]',
	comfortable:
		'[--sidebar-group-padding:var(--space-lg)] [--sidebar-section-padding:var(--space-lg)]'
};

const defaultRoot = cva({
	base: 'group/sidebar-wrapper flex w-full bg-surface-canvas text-neutral',
	variants: {
		variant: {
			admin: '',
			floating: '',
			inset: '',
			split: '',
			framed: ''
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
				'rounded-lg bg-surface raised-1 [--sidebar-icon-button-width:var(--sidebar-width-icon)]',
			inset:
				'border-0 bg-surface-canvas shadow-none [--sidebar-icon-button-width:calc(var(--sidebar-width-icon)-0.5rem)]',
			split:
				'rounded-lg bg-surface raised-1 [--sidebar-icon-button-width:var(--sidebar-width-icon)]',
			// Admin geometry inside a raised card: the well is an inset of the card, not the canvas.
			framed:
				'border-neutral-muted bg-surface-recessed [--sidebar-icon-button-width:calc(var(--sidebar-width-icon)-0.5rem)] data-[side=left]:border-r data-[side=right]:border-l'
		},
		placement: {
			panel: 'w-[var(--sidebar-width)]',
			static: 'w-[var(--sidebar-width)]',
			positioned: 'w-full'
		},
		size: sidebarSizeVariables,
		iconSize: sidebarSizeVariables,
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
	base: 'flex flex-col group-data-[collapsible=icon]:gap-0 group-data-[collapsible=icon]:px-[var(--sidebar-group-padding)] group-data-[collapsible=icon]:py-[calc((var(--sidebar-width-icon)-var(--sidebar-icon-button-width))/2)] group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-button]]:h-[var(--sidebar-icon-button-width)] group-data-[collapsible=icon]:[&>[data-slot=sidebar-menu-button-row]>[data-slot=sidebar-menu-button]]:h-[var(--sidebar-icon-button-width)]',
	variants: {
		density: {
			compact: 'gap-xs p-sm',
			normal: 'gap-md p-md',
			comfortable: 'gap-lg p-lg'
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
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
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
			compact: 'p-sm',
			normal: 'p-md',
			comfortable: 'p-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultGroupLabel = cva({
	base: 'text-neutral/70 flex shrink-0 items-center rounded-sm font-medium outline-none transition-[height,margin,padding,opacity] duration-normal ease-linear group-data-[collapsible=icon]:opacity-0 disabled:pointer-events-none [&>svg]:shrink-0 [&>svg]:size-[var(--sidebar-icon-size)]',
	variants: {
		interactive: {
			true: 'state-layer hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50',
			false: null
		},
		size: {
			small: 'h-control-sm text-xs group-data-[collapsible=icon]:-mt-layout-md',
			normal: 'h-control-md text-sm group-data-[collapsible=icon]:-mt-layout-lg',
			large: 'h-control-lg text-sm group-data-[collapsible=icon]:-mt-layout-lg'
		},
		density: {
			compact: 'px-md',
			normal: 'px-lg',
			comfortable: 'px-lg'
		}
	},
	defaultVariants: {
		interactive: false,
		size: 'normal',
		density: 'normal'
	}
});

// The wrapper is placement only: a row of action slots pinned to the label's midline. Each
// trigger carries its own box (`actionSlot`), so a group can pin several affordances at once.
const defaultGroupAction = cva({
	base: 'absolute flex items-center gap-micro group-data-[collapsible=icon]:hidden',
	variants: {
		size: {
			// Centred on the label row's own height token, then pulled up by half its box, so the
			// action stays on the label's midline whatever the spacing or control scale is.
			small: 'top-[calc(var(--sidebar-group-padding)+var(--control-height-sm)/2)] -translate-y-1/2',
			normal:
				'top-[calc(var(--sidebar-group-padding)+var(--control-height-md)/2)] -translate-y-1/2',
			large: 'top-[calc(var(--sidebar-group-padding)+var(--control-height-lg)/2)] -translate-y-1/2'
		},
		density: {
			compact: 'right-2.5',
			normal: 'right-3',
			comfortable: 'right-4'
		},
		hasToggle: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ density: 'compact', hasToggle: true, class: 'right-8' },
		{ density: 'normal', hasToggle: true, class: 'right-10' },
		{ density: 'comfortable', hasToggle: true, class: 'right-12' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		hasToggle: false
	}
});

const defaultMenu = cva({
	base: 'flex w-full min-w-0 flex-col',
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

const defaultMenuButton = cva({
	base: 'state-layer peer/menu-button group/menu-button flex w-full items-center overflow-hidden rounded-sm text-left outline-none transition-[background,color,width,height,padding,margin,border-radius] duration-normal ease-linear hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-active:font-medium group-has-data-[sidebar=menu-action]/menu-item:pr-layout-lg group-data-[collapsible=icon]:mx-[calc((var(--sidebar-width-icon)-var(--sidebar-icon-button-width))/2-var(--sidebar-group-padding))] group-data-[collapsible=icon]:w-[var(--sidebar-icon-button-width)] group-data-[collapsible=icon]:rounded-none group-data-[variant=admin]:group-data-[collapsible=icon]:rounded-sm group-data-[variant=framed]:group-data-[collapsible=icon]:rounded-sm group-data-[variant=inset]:group-data-[collapsible=icon]:rounded-sm group-data-[collapsible=icon]:![padding-inline:calc((var(--sidebar-icon-button-width)-var(--sidebar-icon-size))/2)] group-data-[collapsible=icon]:ring-inset [&_svg]:shrink-0 [&_svg]:size-[var(--sidebar-icon-size)]',
	variants: {
		activeVariant: activeVariants,
		variant: {
			default: '',
			outline: 'border border-neutral-muted bg-surface'
		},
		size: {
			small: 'text-xs leading-4',
			normal: 'text-sm leading-5',
			large: 'text-base leading-6'
		},
		density: {
			compact: 'gap-sm px-sm',
			normal: 'gap-md px-md',
			comfortable: 'gap-md px-md'
		},
		// itemSize is the row's own scale (a menu entry's `size`); `size` is the Sidebar's.
		itemSize: {
			small: 'text-xs',
			normal: '',
			large: ''
		}
	},
	compoundVariants: [
		{ size: 'small', itemSize: 'small', class: 'h-control-sm' },
		{ size: 'small', itemSize: 'normal', class: 'h-control-md' },
		{ size: 'small', itemSize: 'large', class: 'h-row-lg' },
		{ size: 'normal', itemSize: 'small', class: 'h-control-md' },
		{ size: 'normal', itemSize: 'normal', class: 'h-control-lg' },
		{ size: 'normal', itemSize: 'large', class: 'h-14' },
		{ size: 'large', itemSize: 'small', class: 'h-control-lg' },
		{ size: 'large', itemSize: 'normal', class: 'h-row-md' },
		{ size: 'large', itemSize: 'large', class: 'h-16' }
	],
	defaultVariants: {
		activeVariant: 'soft',
		variant: 'default',
		size: 'normal',
		density: 'normal',
		itemSize: 'normal'
	}
});

const defaultMenuLabel = cva({
	base: 'min-w-0 flex-1 truncate whitespace-nowrap opacity-100 transition-[opacity,transform] duration-normal ease-standard group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0'
});

const defaultMenuSecondary = cva({
	base: 'truncate text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultMenuTrailing = cva({
	base: 'ml-auto shrink-0 opacity-100 transition-[opacity,transform] duration-normal ease-standard group-data-[collapsible=icon]:pointer-events-none group-data-[collapsible=icon]:translate-x-1 group-data-[collapsible=icon]:opacity-0 [&>svg]:size-[var(--sidebar-icon-size)]',
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

const defaultSubMenu = cva({
	base: 'border-neutral-muted flex min-w-0 translate-x-px flex-col border-l',
	variants: {
		density: {
			compact: 'mx-md gap-micro px-md py-micro',
			normal: 'mx-lg gap-xs px-md py-micro',
			comfortable: 'mx-xl gap-sm px-lg py-xs'
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
			compact: 'ml-sm gap-micro py-micro pl-sm',
			normal: 'ml-md gap-xs py-micro pl-md',
			comfortable: 'ml-md gap-sm py-xs pl-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultSubButton = cva({
	base: 'state-layer text-neutral/70 hover:text-neutral flex min-w-0 -translate-x-px items-center overflow-hidden rounded-sm outline-none transition-[background,color,height,padding] duration-normal ease-linear focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:shrink-0 [&>svg]:size-[var(--sidebar-icon-size)]',
	variants: {
		activeVariant: activeVariants,
		size: {
			small: 'h-6 text-xs leading-4',
			normal: 'h-control-sm text-sm leading-5',
			large: 'h-control-md text-base leading-6'
		},
		density: {
			compact: 'gap-sm px-md',
			normal: 'gap-md px-lg',
			comfortable: 'gap-md px-lg'
		},
		itemSize: {
			small: 'text-xs',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		activeVariant: 'soft',
		size: 'normal',
		density: 'normal',
		itemSize: 'normal'
	}
});

const defaultMenuAction = cva({
	base: 'state-layer text-neutral hover:text-neutral peer-hover/menu-button:text-neutral absolute top-1/2 flex aspect-square -translate-y-1/2 items-center justify-center rounded-sm p-0 opacity-100 outline-none transition group-data-[collapsible=icon]:hidden focus-visible:ring-2 focus-visible:ring-focus/50 md:opacity-0 group-focus-within/menu-row:opacity-100 group-hover/menu-row:opacity-100 has-[[aria-expanded=true]]:opacity-100 [&>svg]:shrink-0 [&>svg]:size-[var(--sidebar-icon-size)]',
	variants: {
		size: {
			small: 'size-4.5',
			normal: 'size-5',
			large: 'size-6'
		},
		density: {
			compact: 'right-0.5',
			normal: 'right-1',
			comfortable: 'right-1.5'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

// One icon-only ghost button box. `size` follows the descriptor, defaulting to the Sidebar size,
// so a group's `+` lands at row scale instead of at the group label's scale.
const defaultActionSlot = cva({
	base: 'state-layer text-neutral hover:text-neutral flex aspect-square shrink-0 items-center justify-center rounded-sm p-0 outline-none transition focus-visible:ring-2 focus-visible:ring-focus/50 [&>svg]:shrink-0 [&>svg]:size-[var(--sidebar-icon-size)]',
	variants: {
		size: {
			small: 'h-control-sm',
			normal: 'h-control-md',
			large: 'h-control-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The leading icon of a menu entry when it carries a role tint or a tile. The tint is the row's
// own `data-color`, so the colour comes from the role scale rather than from ad-hoc markup.
const defaultMenuIcon = cva({
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		variant: {
			bare: 'text-color',
			tile: 'bg-color-muted text-color-muted-readable rounded-sm'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	compoundVariants: [
		{ variant: 'tile', size: 'small', class: 'size-icon-lg [&_svg]:size-icon-xs' },
		{ variant: 'tile', size: 'normal', class: 'size-icon-xl [&_svg]:size-icon-sm' },
		{ variant: 'tile', size: 'large', class: 'size-icon-xl [&_svg]:size-icon-md' }
	],
	defaultVariants: {
		variant: 'bare',
		size: 'normal'
	}
});

// A large menu row that carries its own trailing action: the row and the action are siblings, so
// each stays separately clickable instead of nesting a button inside a button.
const defaultButtonRow = cva({
	base: 'flex w-full min-w-0 items-center gap-micro'
});

const defaultActionTrigger = cva({
	base: 'flex size-full items-center justify-center rounded-sm bg-transparent outline-none [&>svg]:shrink-0 [&>svg]:size-[var(--sidebar-icon-size)]',
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

const defaultBadge = cva({
	base: 'text-neutral/70 peer-hover/menu-button:text-neutral peer-data-active/menu-button:text-neutral pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center rounded-sm px-xs font-medium tabular-nums select-none group-data-[collapsible=icon]:hidden',
	variants: {
		size: {
			small: 'h-4 min-w-4 text-xs',
			normal: 'h-5 min-w-5 text-sm',
			large: 'h-6 min-w-6 text-sm'
		},
		density: {
			compact: 'right-0.5',
			normal: 'right-1',
			comfortable: 'right-1.5'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultSearchContainer = cva({
	base: 'relative w-full opacity-100 transition-[height,margin,opacity] duration-normal ease-linear',
	variants: {
		size: {
			small: 'h-control-md',
			normal: 'h-control-lg',
			large: 'h-row-md'
		},
		collapsed: {
			true: 'pointer-events-none h-0 !m-0 overflow-hidden opacity-0',
			false: 'overflow-visible'
		}
	},
	defaultVariants: {
		size: 'normal',
		collapsed: false
	}
});

const defaultSearch = cva({
	base: 'border-neutral-muted bg-surface-raised text-neutral placeholder:text-neutral/70 w-full rounded-sm border shadow-none outline-none focus:border-neutral focus:ring-2 focus:ring-focus/50',
	variants: {
		// The left padding clears the absolutely positioned magnifier (its `left` offset plus its
		// box plus a gap) so the placeholder never starts on top of the icon.
		size: {
			small: 'h-control-md pl-layout-md text-xs',
			normal: 'h-control-lg pl-layout-lg text-sm',
			large: 'h-row-md pl-layout-xl text-base'
		},
		density: {
			compact: 'pr-layout-md',
			normal: 'pr-layout-lg',
			comfortable: 'pr-layout-lg'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultSearchIcon = cva({
	base: 'pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center justify-center text-neutral/45 select-none [&_svg]:size-full',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-5'
		},
		density: {
			compact: 'left-1.5',
			normal: 'left-2',
			comfortable: 'left-2.5'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal'
	}
});

const defaultSeparator = cva({
	base: 'bg-neutral-muted h-px w-auto shrink-0',
	variants: {
		density: {
			compact: 'mx-sm',
			normal: 'mx-md',
			comfortable: 'mx-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultRail = cva({
	base: 'absolute z-20 hidden w-4 outline-none transition-[transform,translate] duration-normal ease-linear after:absolute after:start-1/2 after:-translate-x-1/2 after:transition-[height,width,background-color,opacity] after:duration-normal focus-visible:after:opacity-100 sm:flex',
	variants: {
		variant: {
			admin: 'inset-y-0',
			floating: 'inset-y-2',
			inset: 'inset-y-2',
			split: 'inset-y-2',
			framed: 'inset-y-0'
		},
		// A peek widens the panel without widening the reserved column, so the rail has to travel
		// the difference to stay on the panel's inner edge instead of being buried under it.
		side: {
			left: 'right-0 cursor-w-resize group-data-[peek=true]:z-40 group-data-[peek=true]:translate-x-[calc(var(--sidebar-width)_-_var(--sidebar-width-icon)_+_50%)]',
			right:
				'left-0 cursor-e-resize group-data-[peek=true]:z-40 group-data-[peek=true]:translate-x-[calc(var(--sidebar-width-icon)_-_var(--sidebar-width)_-_50%)]'
		},
		appearance: {
			line: 'after:inset-y-0 after:w-px after:bg-transparent hover:after:bg-neutral-muted',
			thumb:
				'cursor-pointer after:top-1/2 after:h-8 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-neutral/15 after:opacity-0 group-hover:after:opacity-100 hover:after:h-10 hover:after:bg-neutral/35'
		}
	},
	compoundVariants: [
		{ variant: ['admin', 'framed', 'inset'], side: 'left', class: 'translate-x-1/2' },
		{ variant: ['admin', 'framed', 'inset'], side: 'right', class: '-translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'left', class: 'right-2 translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'right', class: 'left-2 -translate-x-1/2' },
		// Floating and split reserve an extra 1rem gutter while collapsed, so their peek travel
		// is that much shorter.
		{
			variant: ['floating', 'split'],
			side: 'left',
			class:
				'group-data-[peek=true]:translate-x-[calc(var(--sidebar-width)_-_var(--sidebar-width-icon)_-_1rem_+_50%)]'
		},
		{
			variant: ['floating', 'split'],
			side: 'right',
			class:
				'group-data-[peek=true]:translate-x-[calc(var(--sidebar-width-icon)_+_1rem_-_var(--sidebar-width)_-_50%)]'
		}
	],
	defaultVariants: {
		variant: 'admin',
		side: 'left',
		appearance: 'line'
	}
});

const defaultResizeHandle = cva({
	base: 'absolute inset-y-0 z-30 hidden w-2 cursor-col-resize touch-none outline-none transition-opacity md:block after:absolute after:left-1/2 after:-translate-x-1/2 after:transition-[height,width,background-color,opacity] after:duration-normal focus-visible:after:bg-neutral focus-visible:after:opacity-100 data-[dragging=true]:after:bg-neutral data-[dragging=true]:after:opacity-100',
	variants: {
		variant: {
			admin: '',
			floating: 'inset-y-2',
			inset: 'inset-y-2',
			split: 'inset-y-2',
			framed: ''
		},
		side: {
			left: 'right-0 group-data-[edge-revealed=true]:translate-x-[calc(var(--sidebar-width)_+_50%)] group-data-[peek=true]:z-40 group-data-[peek=true]:translate-x-[calc(var(--sidebar-width)_-_var(--sidebar-width-icon)_+_50%)]',
			right:
				'left-0 group-data-[edge-revealed=true]:translate-x-[calc(0px_-_var(--sidebar-width)_-_50%)] group-data-[peek=true]:z-40 group-data-[peek=true]:translate-x-[calc(var(--sidebar-width-icon)_-_var(--sidebar-width)_-_50%)]'
		},
		appearance: {
			line: 'after:inset-y-2 after:w-px after:bg-transparent hover:after:bg-neutral/45',
			thumb:
				'after:top-1/2 after:h-8 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-neutral/15 after:opacity-0 group-hover:after:opacity-100 hover:after:h-10 hover:after:bg-neutral/35'
		},
		dragging: {
			true: 'after:bg-neutral',
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
		{ variant: ['admin', 'framed', 'inset'], side: 'left', class: 'translate-x-1/2' },
		{ variant: ['admin', 'framed', 'inset'], side: 'right', class: '-translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'left', class: 'right-2 translate-x-1/2' },
		{ variant: ['floating', 'split'], side: 'right', class: 'left-2 -translate-x-1/2' },
		{
			variant: ['floating', 'split'],
			side: 'left',
			class:
				'group-data-[peek=true]:translate-x-[calc(var(--sidebar-width)_-_var(--sidebar-width-icon)_-_1rem_+_50%)]'
		},
		{
			variant: ['floating', 'split'],
			side: 'right',
			class:
				'group-data-[peek=true]:translate-x-[calc(var(--sidebar-width-icon)_+_1rem_-_var(--sidebar-width)_-_50%)]'
		}
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

// `--page-shell-edge-inset` is INTERNAL: the main column publishes how far the page is inset from
// the shell edge so PageShell's own parts can match it. Variants drive it, consumers do not set it.
const defaultMain = cva({
	base: 'relative flex h-full min-h-0 min-w-0 flex-1 flex-col bg-transparent [--page-shell-edge-inset:0px] transition-[transform,translate,padding,border-radius] duration-normal ease-linear',
	variants: {
		variant: {
			admin: 'bg-surface',
			floating: 'bg-surface-canvas',
			inset: 'bg-surface-canvas md:py-md',
			split: 'bg-surface-canvas md:py-md md:rounded-lg',
			framed: 'bg-surface'
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
	base: 'absolute inset-y-0 z-50 hidden w-3 bg-transparent outline-none md:block after:absolute after:inset-y-0 after:w-px after:bg-transparent after:transition-[background-color] after:duration-normal after:ease-standard hover:after:bg-neutral/45 focus-visible:ring-2 focus-visible:ring-focus/50 data-[side=left]:left-0 data-[side=left]:cursor-e-resize data-[side=left]:after:left-0 data-[side=right]:right-0 data-[side=right]:cursor-w-resize data-[side=right]:after:right-0'
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
		iconSize: sidebarSizeVariables,
		density: sidebarDensityVariables
	},
	defaultVariants: {
		side: 'left',
		size: 'normal',
		density: 'normal'
	}
});

const defaultMedia = cva({
	base: 'bg-neutral text-neutral-contrast flex aspect-square shrink-0 items-center justify-center rounded-sm',
	variants: {
		itemSize: {
			normal: 'text-xs size-[var(--sidebar-compact-media-size)]',
			large: `size-[var(--sidebar-media-size)] [&_svg]:size-[var(--sidebar-icon-size)]`
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	compoundVariants: [
		{ itemSize: 'normal', size: 'small', class: '[&_svg]:size-icon-xs' },
		{ itemSize: 'normal', size: 'normal', class: '[&_svg]:size-icon-xs' },
		{ itemSize: 'normal', size: 'large', class: '[&_svg]:size-icon-sm' }
	],
	defaultVariants: {
		itemSize: 'large',
		size: 'normal'
	}
});

const defaultAvatar = cva({
	base: 'bg-neutral-muted text-neutral-muted-readable flex shrink-0 items-center justify-center overflow-hidden rounded-sm font-medium size-[var(--sidebar-media-size)]',
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

const defaultActivityBar = cva({
	base: 'flex shrink-0 text-neutral',
	variants: {
		orientation: {
			vertical: 'h-full w-[var(--sidebar-width-activity)] flex-col',
			horizontal: 'w-full flex-row items-center border-b border-neutral-muted bg-surface-canvas'
		},
		// Beside the panel the rail wears that variant's panel surface (see the compounds); the
		// mobile drawer's horizontal bar keeps one look whatever the variant.
		variant: {
			admin: '',
			floating: '',
			inset: '',
			split: '',
			framed: ''
		},
		placement: {
			positioned: '',
			static: ''
		},
		density: {
			compact: 'gap-xs p-xs',
			normal: 'gap-xs p-xs',
			comfortable: 'gap-sm p-sm'
		}
	},
	compoundVariants: [
		// A hairline column on the canvas, beside admin's canvas panel.
		{
			orientation: 'vertical',
			variant: 'admin',
			class:
				'bg-surface-canvas border-neutral-muted data-[side=left]:border-r data-[side=right]:border-l'
		},
		// In the card's recessed well with framed's panel, not on the canvas outside the card.
		{
			orientation: 'vertical',
			variant: 'framed',
			class:
				'bg-surface-recessed border-neutral-muted data-[side=left]:border-r data-[side=right]:border-l'
		},
		// Borderless on the canvas, like inset's panel.
		{ orientation: 'vertical', variant: 'inset', class: 'bg-surface-canvas' },
		// A card of its own, the same card as the panel.
		{
			orientation: 'vertical',
			variant: ['floating', 'split'],
			class: 'rounded-lg bg-surface raised-1'
		},
		// Without the desktop container's gutters (`collapsible="none"`), the margins the static
		// panel takes.
		{
			orientation: 'vertical',
			variant: ['floating', 'split'],
			placement: 'static',
			class: 'my-md data-[side=left]:ml-md data-[side=right]:mr-md'
		},
		{
			orientation: 'vertical',
			variant: 'inset',
			placement: 'static',
			class: 'my-md h-[calc(100%_-_1rem)]'
		}
	],
	defaultVariants: {
		orientation: 'vertical',
		variant: 'admin',
		placement: 'positioned',
		density: 'normal'
	}
});

const defaultActivityBarList = cva({
	base: 'scrollbar scrollbar-none m-0 flex min-h-0 min-w-0 flex-1 list-none items-center p-0 outline-none',
	variants: {
		orientation: {
			vertical: 'flex-col overflow-y-auto',
			horizontal: 'flex-row overflow-x-auto'
		},
		density: {
			compact: 'gap-xs',
			normal: 'gap-xs',
			comfortable: 'gap-sm'
		}
	},
	defaultVariants: {
		orientation: 'vertical',
		density: 'normal'
	}
});

const defaultActivityBarItem = cva({
	base: 'state-layer relative flex aspect-square shrink-0 items-center justify-center rounded-md outline-none transition-[background,color] duration-normal ease-linear focus-visible:ring-2 focus-visible:ring-focus/50 data-active:bg-selected-muted data-active:text-selected-muted-readable data-active:font-medium [&_svg]:shrink-0',
	variants: {
		size: {
			small: 'h-control-sm [&_svg]:size-icon-sm',
			normal: 'h-control-md [&_svg]:size-icon-md',
			large: 'h-control-lg [&_svg]:size-icon-lg'
		},
		density: {
			compact: 'gap-xs',
			normal: 'gap-xs',
			comfortable: 'gap-sm'
		},
		active: {
			true: null,
			false: 'text-neutral/70 hover:text-neutral'
		},
		disabled: {
			true: 'pointer-events-none opacity-50',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		active: false,
		disabled: false
	}
});

const defaultActivityBarBadge = cva({
	base: 'bg-color text-color-readable pointer-events-none absolute flex items-center justify-center rounded-full px-xs font-medium tabular-nums select-none',
	variants: {
		size: {
			small: 'top-0 end-0 h-3.5 min-w-3.5 text-xs',
			normal: 'top-0 end-0 h-4 min-w-4 text-xs',
			large: 'top-0 end-0 h-4.5 min-w-4.5 text-xs'
		},
		dot: {
			true: 'h-2 min-w-2 px-0',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		dot: false
	}
});

const defaultActivityBarHeader = cva({
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		orientation: {
			vertical: 'w-full',
			horizontal: 'h-full'
		},
		density: {
			compact: 'pb-xs',
			normal: 'pb-xs',
			comfortable: 'pb-sm'
		}
	},
	defaultVariants: {
		orientation: 'vertical',
		density: 'normal'
	}
});

const defaultActivityBarFooter = cva({
	base: 'mt-auto flex shrink-0 items-center justify-center',
	variants: {
		orientation: {
			vertical: 'w-full',
			horizontal: 'mt-0 ms-auto h-full'
		},
		density: {
			compact: 'pt-xs',
			normal: 'pt-xs',
			comfortable: 'pt-sm'
		}
	},
	defaultVariants: {
		orientation: 'vertical',
		density: 'normal'
	}
});

// Motion preset for the reversible height collapses inside the panel: collapsible groups,
// inline submenus, and tree branches all slide open on the y axis. `duration` / `easing`
// stay tokens, so a `<Theme motion>` retune and a reduced-motion preference reach them.
export const defaultSidebarMotion = motion({
	base: {
		in: { axis: 'y', x: 0, y: 0, scale: 1, opacity: 0.2 },
		out: { axis: 'y', x: 0, y: 0, scale: 1, opacity: 0.2 },
		duration: 'normal',
		easing: 'standard'
	}
});

export const sidebarTheme = {
	motion: defaultSidebarMotion,
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
	actionSlot: defaultActionSlot,
	actionTrigger: defaultActionTrigger,
	menuIcon: defaultMenuIcon,
	buttonRow: defaultButtonRow,
	badge: defaultBadge,
	searchContainer: defaultSearchContainer,
	search: defaultSearch,
	searchIcon: defaultSearchIcon,
	separator: defaultSeparator,
	rail: defaultRail,
	activityBar: defaultActivityBar,
	activityBarList: defaultActivityBarList,
	activityBarItem: defaultActivityBarItem,
	activityBarBadge: defaultActivityBarBadge,
	activityBarHeader: defaultActivityBarHeader,
	activityBarFooter: defaultActivityBarFooter,
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
export const useSidebarMotion = () => useComponentMotion('sidebar', defaultSidebarMotion);
