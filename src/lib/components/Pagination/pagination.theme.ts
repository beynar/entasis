import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { selectedSolid } from '$lib/components/Theme/theme.recipes.js';

const defaultPagination = cva({
	base: 'flex w-fit max-w-full flex-wrap items-center gap-lg'
});

const defaultPaginationList = cva({
	base: 'flex flex-wrap items-center',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		},
		variant: {
			pages: null,
			count: 'gap-md',
			compact: 'gap-md',
			dots: 'gap-0',
			none: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'pages'
	}
});

const defaultPaginationItem = cva({
	base: 'flex shrink-0 items-center',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		display: {
			page: '',
			dot: 'justify-center'
		}
	},
	defaultVariants: {
		size: 'normal',
		display: 'page'
	},
	compoundVariants: [
		{ size: 'small', display: 'dot', class: 'size-5' },
		{ size: 'normal', display: 'dot', class: 'size-6' },
		{ size: 'large', display: 'dot', class: 'size-7' }
	]
});

const defaultPaginationControl = cva({
	base: 'inline-flex shrink-0 select-none items-center justify-center rounded-md border font-medium outline-none transition-[color,background-color,border-color,box-shadow,translate] duration-fast ease-standard focus-visible:ring-2 focus-visible:ring-focus/50 [&:active]:translate-y-px [&_svg:not([class*=size-])]:size-icon-md',
	variants: {
		size: {
			small: 'h-control-sm min-size-hit-sm px-md text-xs',
			normal: 'h-control-md min-size-hit-md px-lg text-sm',
			large: 'h-control-lg min-size-hit-lg px-xl text-sm'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral-readable',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		},
		controlVariant: {
			solid: 'state-layer border-transparent bg-color text-color-contrast',
			outline: 'state-layer bg-color/0 border-color text-color-readable',
			soft: 'state-layer border-transparent bg-color-muted text-color-muted-readable',
			ghost: 'state-layer border-transparent bg-transparent text-color-readable'
		},
		// The current page is the one selected surface that stays solid (`selectedSolid`): it is the
		// loudest thing in its group and carries no other affordance.
		active: {
			true: `border-selected ${selectedSolid} hover:text-selected-contrast`,
			false: null
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed opacity-50',
			false: 'cursor-pointer'
		},
		control: {
			page: '',
			icon: 'aspect-square px-0'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral',
		controlVariant: 'ghost',
		active: false,
		disabled: false,
		control: 'page'
	},
	compoundVariants: [
		// Mirrors button.theme.ts: the neutral outline is chrome next to inputs and selects, which
		// all draw a `neutral-muted` hairline; a full-strength neutral border made it the odd one out.
		{ color: 'neutral', controlVariant: 'outline', class: 'border-neutral-muted' }
	]
});

const defaultPaginationDot = cva({
	base: "relative inline-flex shrink-0 items-center justify-center rounded-full outline-none transition-colors before:block before:rounded-full before:content-[''] before:transition-colors focus-visible:ring-2 focus-visible:ring-focus/50",
	variants: {
		size: {
			small: 'size-3 before:size-1.5',
			normal: 'size-4 before:size-2',
			large: 'size-5 before:size-2.5'
		},
		color: {
			primary: null,
			secondary: null,
			neutral: null,
			danger: null,
			success: null,
			warning: null,
			info: null
		},
		active: {
			true: 'before:bg-selected',
			false: 'before:bg-neutral/30 hover:before:bg-color/50'
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed opacity-50',
			false: 'cursor-pointer'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral',
		active: false,
		disabled: false
	},
	compoundVariants: []
});

const defaultPaginationIcon = cva({
	base: 'flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'size-icon-sm',
			normal: 'size-icon-md',
			large: 'size-icon-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultPaginationEllipsis = cva({
	base: 'text-neutral/70 inline-flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'h-control-sm min-w-[var(--control-height-sm)]',
			normal: 'h-control-md min-w-[var(--control-height-md)]',
			large: 'h-control-lg min-w-[var(--control-height-lg)]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultPaginationSummary = cva({
	base: 'text-neutral/70 shrink-0 whitespace-nowrap font-medium',
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

export const paginationTheme = {
	root: defaultPagination,
	list: defaultPaginationList,
	item: defaultPaginationItem,
	control: defaultPaginationControl,
	dot: defaultPaginationDot,
	icon: defaultPaginationIcon,
	ellipsis: defaultPaginationEllipsis,
	summary: defaultPaginationSummary
};

export type PaginationTheme = typeof paginationTheme;
export type PaginationThemeProps = InferComponentTheme<PaginationTheme>;
export const setPaginationTheme = setComponentTheme<PaginationTheme>('pagination');
export const usePaginationTheme = useComponentTheme<PaginationTheme>('pagination', paginationTheme);
