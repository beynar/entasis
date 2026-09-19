import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// Vega look: a quiet surface (subtle ring + lift-1 instead of a heavy raised
// shadow), medium-weight title, muted description. `size` scales typography
// only; `density` owns paddings and gaps ('comfortable' matches vega's default
// 6-scale, 'normal' its sm 4-scale).
//
// Nesting needs no declaration here: the `rounded-lg py-*` root publishes its radius and vertical
// gap to the header/content/footer wrappers, and each wrapper's own `px-*` publishes the
// horizontal one to what it holds, so anything flush inside a part computes the right corner from
// `rounded-<step>-concentric`. Nothing the Card ships reads it — a Card-shaped child, a Stat
// inside one, is `rounded-lg` like the Card itself and so reads as equal rather than concentric
// (12/12 at the default radius preset, 30/30 at `round`). That is deliberate: it floats in the
// padding instead of sitting flush against it.
const defaultCard = cva({
	base: 'group/card text-neutral flex flex-col rounded-lg tabular-nums transition-[color,background-color,box-shadow,translate,opacity]',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			compact: 'py-lg gap-lg',
			normal: 'py-xl gap-xl',
			comfortable: 'py-layout-md gap-layout-md'
		},
		// The color itself flows through the data-color attribute (bg-color /
		// ring-color / text-color-contrast resolve against it); the axis stays for
		// per-color theme overrides.
		color: {
			primary: '',
			secondary: '',
			neutral: '',
			danger: '',
			success: '',
			warning: '',
			info: ''
		},
		// Text color follows the SURFACE: contrast tone on a solid color fill,
		// plain foreground on transparent/tinted surfaces (contrast text there is
		// unreadable — it's meant for a color-filled background).
		variant: {
			solid: 'bg-color text-color-contrast ring-1 ring-neutral-muted',
			outline: 'bg-transparent text-color-readable ring-1 ring-color',
			soft: 'bg-color-muted text-color-muted-readable',
			// No ! on bg-transparent: it would also defeat the clickable hover bg.
			ghost: 'bg-transparent text-neutral'
		},
		// Internal: set when the card has an onclick or href — interactive cards
		// get cursor, hover, press and keyboard-focus treatment.
		clickable: {
			true: 'state-layer cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-focus/50 active:translate-y-px',
			false: ''
		},
		disabled: {
			true: 'opacity-50 cursor-not-allowed *:pointer-events-none',
			false: null
		},
		// Elevation step of a solid card; only solid casts a shadow (compound variants below).
		elevation: {
			1: '',
			2: '',
			3: '',
			4: '',
			5: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		color: 'neutral',
		variant: 'solid',
		clickable: false,
		disabled: false,
		elevation: 1
	},
	compoundVariants: [
		// Solid cards lift by their elevation step; a clickable one rises one step on hover. The
		// shared state layer owns transient fill feedback for every clickable surface.
		{ variant: 'solid', elevation: 1, class: 'lift-1' },
		{ variant: 'solid', elevation: 2, class: 'lift-2' },
		{ variant: 'solid', elevation: 3, class: 'lift-3' },
		{ variant: 'solid', elevation: 4, class: 'lift-4' },
		{ variant: 'solid', elevation: 5, class: 'lift-5' },
		{ clickable: true, variant: 'solid', elevation: 1, class: 'hover:lift-2' },
		{ clickable: true, variant: 'solid', elevation: 2, class: 'hover:lift-3' },
		{ clickable: true, variant: 'solid', elevation: 3, class: 'hover:lift-4' },
		{ clickable: true, variant: 'solid', elevation: 4, class: 'hover:lift-5' },
		// Neutral card: an elevated surface distinct from the page background
		// (bg-surface would blend in, especially in dark mode).
		{
			color: 'neutral',
			variant: 'solid',
			class: 'bg-surface-raised text-neutral'
		},
		{
			color: 'neutral',
			variant: 'outline',
			class: 'ring-neutral-muted text-neutral'
		}
	]
});

const defaultCardHeader = cva({
	base: 'grid auto-rows-min items-start',
	variants: {
		density: {
			compact: 'px-lg gap-micro',
			normal: 'px-xl gap-xs',
			comfortable: 'px-layout-md gap-sm'
		},
		hasAction: {
			true: 'grid-cols-[1fr_auto]',
			false: ''
		},
		hasBorder: {
			true: 'border-b border-neutral-muted',
			false: ''
		},
		variant: {
			solid: '',
			outline: '',
			soft: '',
			ghost: ''
		}
	},
	defaultVariants: {
		density: 'normal',
		hasAction: false,
		hasBorder: false
	},
	compoundVariants: [
		{ hasBorder: true, density: 'compact', class: 'pb-lg' },
		{ hasBorder: true, density: 'normal', class: 'pb-xl' },
		{ hasBorder: true, density: 'comfortable', class: 'pb-layout-md' }
	]
});

const defaultCardTitle = cva({
	base: 'font-medium leading-normal',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		variant: {
			solid: 'text-color-contrast group-data-[color=neutral]/card:text-neutral',
			outline: 'text-color-readable group-data-[color=neutral]/card:text-neutral',
			soft: 'text-color-muted-readable',
			ghost: 'text-color-readable group-data-[color=neutral]/card:text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCardDescription = cva({
	base: 'text-neutral/70 leading-normal',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		variant: {
			solid: 'text-color-contrast group-data-[color=neutral]/card:text-neutral/70',
			outline: '',
			soft: 'text-color-muted-readable',
			ghost: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCardAction = cva({
	base: 'col-start-2 row-span-2 row-start-1 self-start justify-self-end'
});

const defaultCardContent = cva({
	base: '',
	variants: {
		density: {
			compact: 'px-lg',
			normal: 'px-xl',
			comfortable: 'px-layout-md'
		},
		hasBorderTop: {
			true: '',
			false: ''
		},
		hasBorderBottom: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		density: 'normal'
	},
	compoundVariants: []
});

const defaultCardFooter = cva({
	base: 'flex flex-wrap items-center',
	variants: {
		density: {
			compact: 'px-lg gap-md',
			normal: 'px-xl gap-md',
			comfortable: 'px-layout-md gap-lg'
		},
		hasBorder: {
			true: 'border-t border-neutral-muted',
			false: ''
		}
	},
	defaultVariants: {
		density: 'normal',
		hasBorder: false
	},
	compoundVariants: [
		{ hasBorder: true, density: 'compact', class: 'pt-lg' },
		{ hasBorder: true, density: 'normal', class: 'pt-xl' },
		{ hasBorder: true, density: 'comfortable', class: 'pt-layout-md' }
	]
});

export const cardTheme = {
	root: defaultCard,
	header: defaultCardHeader,
	title: defaultCardTitle,
	description: defaultCardDescription,
	action: defaultCardAction,
	content: defaultCardContent,
	footer: defaultCardFooter
};

export type CardTheme = typeof cardTheme;
export type CardThemeProps = InferComponentTheme<CardTheme>;
export const setCardTheme = setComponentTheme<CardTheme>('card');
export const useCardTheme = useComponentTheme<CardTheme>('card', cardTheme);
