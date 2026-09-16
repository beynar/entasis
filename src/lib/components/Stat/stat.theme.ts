import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// `size` scales typography, icons, and the radius tied to that scale; `density`
// owns paddings and gaps ('small' matches the old small spacing, 'large'
// the old large spacing).
const defaultStatRoot = cva({
	base: 'raised-sm grid grid-cols-[minmax(0,1fr)_auto] border tabular-nums transition-colors',
	variants: {
		size: {
			small: 'rounded-md',
			normal: 'rounded-lg',
			large: 'rounded-lg'
		},
		density: {
			compact: 'gap-x-lg gap-y-xs p-lg',
			normal: 'gap-x-xl gap-y-xs p-xl',
			comfortable: 'gap-x-layout-sm gap-y-sm p-layout-sm'
		},
		color: {
			primary: 'border-primary',
			secondary: 'border-secondary',
			neutral: 'border-neutral',
			danger: 'border-danger',
			success: 'border-success',
			warning: 'border-warning',
			info: 'border-info'
		},
		variant: {
			solid: 'border-color bg-color text-color-contrast',
			outline: 'border-color bg-transparent text-color-readable',
			soft: 'border-color/20 bg-color-muted text-color-muted-readable',
			ghost: 'border-transparent bg-transparent text-color-readable shadow-none'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		color: 'neutral',
		variant: 'solid'
	},
	compoundVariants: [
		{
			color: 'neutral',
			variant: 'solid',
			class: 'border-neutral-muted bg-surface text-neutral'
		},
		{
			color: 'neutral',
			variant: 'outline',
			class: 'border-neutral-muted text-neutral'
		},
		{
			color: 'neutral',
			variant: 'soft',
			class: 'border-neutral-muted/70 bg-neutral-muted/45 text-neutral-muted-readable'
		},
		{ color: 'neutral', variant: 'ghost', class: 'text-neutral' }
	]
});

// Column placement is owned by one part instead of being baked into each region, so `order`
// can move a region through the flow without rewriting its own theme. The first two regions
// sit beside the aside (column 1); everything after clears it and spans the full width.
const defaultStatRegion = cva({
	base: 'col-start-1',
	variants: {
		span: {
			narrow: 'col-end-2',
			wide: 'col-end-3'
		}
	},
	defaultVariants: {
		span: 'wide'
	}
});

const defaultStatLabel = cva({
	base: 'min-w-0 font-medium leading-tight text-current/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		// Solid and soft surfaces start from an on-colour text that is already near the AA floor,
		// so the label cannot afford an opacity fade there.
		variant: {
			solid: 'text-current',
			soft: 'text-current',
			outline: '',
			ghost: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultStatValue = cva({
	base: 'gap-xs flex min-w-0 items-baseline font-semibold leading-none tracking-tight text-current',
	variants: {
		size: {
			small: 'text-xl',
			normal: 'text-2xl',
			large: 'text-3xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The unit rides the value baseline one type step down, so `147 task` reads as a number with a
// suffix instead of two equal-weight words.
const defaultStatUnit = cva({
	base: 'min-w-0 font-medium leading-none tracking-normal text-current/70',
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

// Action and indicator share column 2: the action button on top, the decorative indicator under
// it, both pinned to the first rows so they stay level with the label/value block.
const defaultStatAside = cva({
	base: 'gap-sm col-start-2 row-start-1 flex flex-col items-end self-start justify-self-end',
	variants: {
		rows: {
			single: 'row-span-1',
			pair: 'row-span-2'
		}
	},
	defaultVariants: {
		rows: 'pair'
	}
});

const defaultStatAction = cva({
	base: 'state-layer inline-flex shrink-0 items-center justify-center border border-transparent bg-transparent text-current/70 transition-colors focus-visible:ring-2 focus-visible:ring-focus/50 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		size: {
			small: 'size-7 rounded-md [&_svg]:size-icon-sm',
			normal: 'size-8 rounded-md [&_svg]:size-icon-md',
			large: 'size-10 rounded-xl [&_svg]:size-icon-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultStatIndicator = cva({
	base: 'inline-flex shrink-0 items-center justify-center text-current/70 [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		size: {
			small: '[&_svg]:size-icon-md',
			normal: '[&_svg]:size-icon-lg',
			large: '[&_svg]:size-icon-xl'
		},
		variant: {
			default: '',
			icon: 'border border-current/15 bg-current/5',
			badge: 'border border-current/15 bg-current/5 font-medium'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral/70',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'default',
		color: 'neutral'
	},
	compoundVariants: [
		{ variant: 'icon', size: 'small', class: 'size-7 rounded-md [&_svg]:size-icon-sm' },
		{ variant: 'icon', size: 'normal', class: 'size-8 rounded-md [&_svg]:size-icon-md' },
		{ variant: 'icon', size: 'large', class: 'size-10 rounded-xl [&_svg]:size-icon-lg' },
		{
			variant: 'badge',
			size: 'small',
			class: 'h-5 min-w-5 rounded-sm px-sm text-xs [&_svg]:size-icon-xs'
		},
		{
			variant: 'badge',
			size: 'normal',
			class: 'h-6 min-w-6 rounded-sm px-md text-xs [&_svg]:size-icon-sm'
		},
		{
			variant: 'badge',
			size: 'large',
			class: 'h-control-sm min-w-7 rounded-md px-md text-sm [&_svg]:size-icon-md'
		}
	]
});

// The trend row itself stays neutral: only `trendText` (the text plus the direction arrow the
// component appends) carries the up/down colour, so a leading `trendIcon` reads as plain ink.
const defaultStatTrend = cva({
	base: 'gap-xs flex min-w-0 items-center font-medium leading-none [&_svg]:pointer-events-none [&_svg]:shrink-0',
	variants: {
		size: {
			small: 'text-xs [&_svg]:size-icon-xs',
			normal: 'text-xs [&_svg]:size-icon-xs',
			large: 'text-sm [&_svg]:size-icon-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultStatTrendIcon = cva({
	base: 'inline-flex shrink-0 items-center text-current/70'
});

const defaultStatTrendText = cva({
	base: 'gap-xs inline-flex min-w-0 items-center',
	variants: {
		trend: {
			up: 'text-success-readable',
			down: 'text-danger-readable',
			neutral: 'text-current/70'
		}
	},
	defaultVariants: {
		trend: 'neutral'
	}
});

const defaultStatDescription = cva({
	base: 'min-w-0 text-current/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		variant: {
			solid: 'text-current',
			soft: 'text-current',
			outline: '',
			ghost: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultStatSeparator = cva({
	base: '',
	variants: {
		density: {
			compact: 'my-xs',
			normal: 'my-md',
			comfortable: 'my-lg'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

export const statTheme = {
	root: defaultStatRoot,
	region: defaultStatRegion,
	label: defaultStatLabel,
	value: defaultStatValue,
	unit: defaultStatUnit,
	aside: defaultStatAside,
	action: defaultStatAction,
	indicator: defaultStatIndicator,
	trend: defaultStatTrend,
	trendIcon: defaultStatTrendIcon,
	trendText: defaultStatTrendText,
	description: defaultStatDescription,
	separator: defaultStatSeparator
};

export type StatTheme = typeof statTheme;
export type StatThemeProps = InferComponentTheme<StatTheme>;
export const setStatTheme = setComponentTheme<StatTheme>('stat');
export const useStatTheme = useComponentTheme<StatTheme>('stat', statTheme);
