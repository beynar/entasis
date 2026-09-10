import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// Vega look: a quiet surface (subtle ring + shadow-xs instead of a heavy raised
// shadow), medium-weight title, muted description. `size` scales typography
// only; `density` owns paddings and gaps ('large' matches vega's default
// 6-scale, 'normal' its sm 4-scale).
const defaultCard = cva({
	base: 'group/card text-neutral flex flex-col rounded-lg tabular-nums transition-all',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		density: {
			small: 'py-lg gap-lg',
			normal: 'py-xl gap-xl',
			large: 'py-layout-md gap-layout-md'
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
			solid: 'bg-color text-color-contrast ring-1 ring-neutral/10 shadow-xs',
			outline: 'bg-transparent text-color-readable ring-1 ring-color',
			soft: 'bg-color-muted text-color-muted-readable',
			// No ! on bg-transparent: it would also defeat the clickable hover bg.
			ghost: 'bg-transparent text-neutral'
		},
		// Internal: set when the card has an onclick or href — interactive cards
		// get cursor, hover, press and keyboard-focus treatment.
		clickable: {
			true: 'state-layer cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-px',
			false: ''
		},
		disabled: {
			true: 'opacity-55 cursor-not-allowed *:pointer-events-none',
			false: null
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		color: 'neutral',
		variant: 'solid',
		clickable: false,
		disabled: false
	},
	compoundVariants: [
		// Solid cards also lift through border/shadow; the shared state layer owns
		// transient fill feedback for every clickable surface.
		{ clickable: true, variant: 'solid', class: 'hover:ring-neutral/25 hover:shadow-sm' },
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
			class: 'ring-neutral/15 text-neutral'
		}
	]
});

const defaultCardHeader = cva({
	base: 'grid auto-rows-min items-start',
	variants: {
		density: {
			small: 'px-lg gap-micro',
			normal: 'px-xl gap-xs',
			large: 'px-layout-md gap-sm'
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
		{ hasBorder: true, density: 'small', class: 'pb-lg' },
		{ hasBorder: true, density: 'normal', class: 'pb-xl' },
		{ hasBorder: true, density: 'large', class: 'pb-layout-md' }
	]
});

const defaultCardTitle = cva({
	base: 'font-medium leading-normal',
	variants: {
		size: {
			small: 'text-sm',
			normal: 'text-base',
			large: 'text-lg'
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
	base: 'text-neutral/60 leading-normal',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		variant: {
			solid: 'text-color-contrast/70 group-data-[color=neutral]/card:text-neutral/60',
			outline: '',
			soft: '',
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
			small: 'px-lg',
			normal: 'px-xl',
			large: 'px-layout-md'
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
			small: 'px-lg gap-md',
			normal: 'px-xl gap-md',
			large: 'px-layout-md gap-lg'
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
		{ hasBorder: true, density: 'small', class: 'pt-lg' },
		{ hasBorder: true, density: 'normal', class: 'pt-xl' },
		{ hasBorder: true, density: 'large', class: 'pt-layout-md' }
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
