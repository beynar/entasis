import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The page keeps scrolling across the comparison on touch: only a swipe along the divider's axis
// is the comparison's.
const defaultRoot = cva({
	base: 'group/before-after relative isolate w-full overflow-hidden rounded-md select-none',
	variants: {
		orientation: {
			horizontal: 'touch-pan-y',
			vertical: 'touch-pan-x'
		},
		interactive: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ orientation: 'horizontal', interactive: true, class: 'cursor-ew-resize' },
		{ orientation: 'vertical', interactive: true, class: 'cursor-ns-resize' }
	],
	defaultVariants: {
		orientation: 'horizontal',
		interactive: true
	}
});

// The after side lies under the before one, which is cut at the divider. Without a ratio the
// after side stays in the flow and sizes the comparison.
const defaultSide = cva({
	base: '',
	variants: {
		fill: {
			true: 'absolute inset-0',
			false: 'relative'
		},
		gliding: {
			true: 'transition-[clip-path] duration-fast ease-standard',
			false: ''
		}
	},
	defaultVariants: {
		fill: true,
		gliding: false
	}
});

const defaultImage = cva({ base: 'block size-full object-cover' });

// Inside its side, so the divider covers and reveals it with the side. Each label keeps to its
// own side of the divider, and `position` places it along the divider: at its start, middle or end.
const defaultLabel = cva({
	base: 'pointer-events-none absolute z-10',
	variants: {
		side: {
			before: '',
			after: ''
		},
		orientation: {
			horizontal: '',
			vertical: ''
		},
		position: {
			start: '',
			center: '',
			end: ''
		}
	},
	compoundVariants: [
		{ orientation: 'horizontal', side: 'before', class: 'start-2' },
		{ orientation: 'horizontal', side: 'after', class: 'end-2' },
		{ orientation: 'horizontal', position: 'start', class: 'top-2' },
		{ orientation: 'horizontal', position: 'center', class: 'top-1/2 -translate-y-1/2' },
		{ orientation: 'horizontal', position: 'end', class: 'bottom-2' },
		{ orientation: 'vertical', side: 'before', class: 'top-2' },
		{ orientation: 'vertical', side: 'after', class: 'bottom-2' },
		{ orientation: 'vertical', position: 'start', class: 'start-2' },
		{
			orientation: 'vertical',
			position: 'center',
			class: 'start-1/2 -translate-x-1/2 rtl:translate-x-1/2'
		},
		{ orientation: 'vertical', position: 'end', class: 'end-2' }
	],
	defaultVariants: {
		side: 'before',
		orientation: 'horizontal',
		position: 'start'
	}
});

// As large as the comparison and moved by `translate`, so the divider travels on the compositor.
const defaultRail = cva({
	base: 'pointer-events-none absolute inset-0 z-20 flex items-center justify-center',
	variants: {
		orientation: {
			horizontal: '',
			vertical: 'flex-col'
		},
		gliding: {
			true: 'transition-[translate] duration-fast ease-standard',
			false: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		gliding: false
	}
});

// The divider's hit area: the whole line, 44px across.
const defaultHandle = cva({
	base: 'group/before-after-handle pointer-events-auto relative flex touch-none items-center justify-center outline-none',
	variants: {
		orientation: {
			horizontal: 'h-full shrink-0 basis-11',
			vertical: 'w-full shrink-0 basis-11'
		},
		interactive: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ orientation: 'horizontal', interactive: true, class: 'cursor-ew-resize' },
		{ orientation: 'vertical', interactive: true, class: 'cursor-ns-resize' }
	],
	defaultVariants: {
		orientation: 'horizontal',
		interactive: true
	}
});

// The line is a border, so it can be dashed: its thickness follows `size`. Without a grip it is
// the line that shows the focus ring.
const defaultLine = cva({
	base: 'pointer-events-none absolute',
	variants: {
		orientation: {
			horizontal: 'inset-y-0 w-0',
			vertical: 'inset-x-0 h-0'
		},
		lineVariant: {
			solid: 'border-solid',
			dashed: 'border-dashed',
			none: 'hidden'
		},
		variant: {
			surface: 'border-surface',
			solid: 'border-color',
			glass: 'border-surface/60'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		bare: {
			true: 'group-has-[:focus-visible]/before-after-handle:ring-2 group-has-[:focus-visible]/before-after-handle:ring-focus/50',
			false: ''
		}
	},
	compoundVariants: [
		{ orientation: 'horizontal', size: 'small', class: 'border-s' },
		{ orientation: 'horizontal', size: 'normal', class: 'border-s-2' },
		{ orientation: 'horizontal', size: 'large', class: 'border-s-4' },
		{ orientation: 'vertical', size: 'small', class: 'border-t' },
		{ orientation: 'vertical', size: 'normal', class: 'border-t-2' },
		{ orientation: 'vertical', size: 'large', class: 'border-t-4' },
		// A faint outline keeps a light line readable over a light picture.
		{ lineVariant: 'solid', variant: 'surface', class: 'shadow-[0_0_0_1px_rgb(0_0_0/0.1)]' }
	],
	defaultVariants: {
		orientation: 'horizontal',
		lineVariant: 'solid',
		variant: 'surface',
		size: 'normal',
		bare: false
	}
});

// The handle on the line: a round `grip`, a `pill` along the line, or bare `arrows` either side of
// it. `variant` paints it like the line: the surface, the colour role, or frosted glass.
const defaultGrip = cva({
	base: 'relative grid place-items-center rounded-full ring-offset-surface transition-[scale,box-shadow] duration-fast ease-standard group-data-[dragging]/before-after:scale-(--motion-press-scale) group-has-[:focus-visible]/before-after-handle:ring-2 group-has-[:focus-visible]/before-after-handle:ring-focus/50 group-has-[:focus-visible]/before-after-handle:ring-offset-2',
	variants: {
		handleVariant: {
			grip: 'border lift-2',
			pill: 'border lift-2',
			arrows: 'grid-flow-col gap-sm [&_svg]:drop-shadow-[0_0_1px_rgb(0_0_0/0.5)]'
		},
		variant: {
			surface: '',
			solid: '',
			glass: ''
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		orientation: {
			horizontal: '',
			vertical: ''
		}
	},
	compoundVariants: [
		{
			handleVariant: ['grip', 'pill'],
			variant: 'surface',
			class: 'border-neutral-muted/80 bg-surface text-color-readable'
		},
		{
			handleVariant: ['grip', 'pill'],
			variant: 'solid',
			class: 'border-color bg-color text-color-contrast'
		},
		{
			handleVariant: ['grip', 'pill'],
			variant: 'glass',
			class: 'border-surface/50 bg-surface/40 text-neutral backdrop-blur-md'
		},
		{ handleVariant: 'arrows', variant: 'surface', class: 'text-surface' },
		{ handleVariant: 'arrows', variant: 'solid', class: 'text-color' },
		{ handleVariant: 'arrows', variant: 'glass', class: 'text-surface/80' },

		{ handleVariant: 'grip', size: 'small', class: 'size-7 [&_svg]:size-icon-xs' },
		{ handleVariant: 'grip', size: 'normal', class: 'size-8 [&_svg]:size-icon-sm' },
		{ handleVariant: 'grip', size: 'large', class: 'size-9 [&_svg]:size-icon-md' },
		{ handleVariant: 'pill', size: 'small', class: '[&_svg]:size-icon-xs' },
		{ handleVariant: 'pill', size: 'normal', class: '[&_svg]:size-icon-sm' },
		{ handleVariant: 'pill', size: 'large', class: '[&_svg]:size-icon-md' },
		{ handleVariant: 'pill', orientation: 'horizontal', class: 'px-micro py-sm' },
		{ handleVariant: 'pill', orientation: 'vertical', class: 'px-sm py-micro' },
		{ handleVariant: 'arrows', size: 'small', class: '[&_svg]:size-icon-xs' },
		{ handleVariant: 'arrows', size: 'normal', class: '[&_svg]:size-icon-sm' },
		{ handleVariant: 'arrows', size: 'large', class: '[&_svg]:size-icon-md' },

		// The carets are drawn one over the other, the dots as a column and the arrows side by
		// side: each is turned to follow the axis.
		{ handleVariant: 'grip', orientation: 'horizontal', class: '[&_svg]:rotate-90' },
		{ handleVariant: ['pill', 'arrows'], orientation: 'vertical', class: '[&_svg]:rotate-90' },
		{ handleVariant: 'arrows', orientation: 'vertical', class: 'grid-flow-row' }
	],
	defaultVariants: {
		handleVariant: 'grip',
		variant: 'surface',
		size: 'normal',
		orientation: 'horizontal'
	}
});

export const beforeAfterTheme = {
	root: defaultRoot,
	side: defaultSide,
	image: defaultImage,
	label: defaultLabel,
	rail: defaultRail,
	handle: defaultHandle,
	line: defaultLine,
	grip: defaultGrip
};

export type BeforeAfterTheme = typeof beforeAfterTheme;
export type BeforeAfterThemeProps = InferComponentTheme<BeforeAfterTheme>;
export const setBeforeAfterTheme = setComponentTheme<BeforeAfterTheme>('before-after');
export const useBeforeAfterTheme = useComponentTheme<BeforeAfterTheme>(
	'before-after',
	beforeAfterTheme
);
