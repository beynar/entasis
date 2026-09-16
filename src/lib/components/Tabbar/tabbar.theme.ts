import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultTabbar = cva({
	// relative: the shared active indicator is positioned against the root.
	// w-fit: the bar (and its baseline) hugs the tabs — fit-content still clamps
	// to the parent, so overflow scrolling keeps working. fullWidth opts into w-full.
	base: 'relative flex w-fit max-w-full',
	variants: {
		orientation: {
			// Scroll (no visible scrollbar) when the tabs overflow their track.
			horizontal: 'flex-row overflow-x-auto scrollbar-none',
			vertical: 'flex-col overflow-y-auto scrollbar-none'
		},
		scrollFade: {
			none: '',
			x: 'scroll-fade-x',
			y: 'scroll-fade-y'
		},
		alignment: {
			start: 'justify-start',
			center: 'justify-center',
			end: 'justify-end'
		},
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		},
		variant: {
			underline: '',
			pill: 'rounded-full bg-neutral-muted/60 p-xs'
		},
		fullWidth: {
			true: 'w-full',
			false: ''
		}
	},
	compoundVariants: [
		// Muted baseline under the tab row, drawn as an INSET shadow line (not a
		// border): it lives inside the padding box, so the active underline overlaps
		// it exactly — a border sits outside the box and shows a subpixel seam at
		// fractional zoom (and the scroll container would clip any overlap).
		{
			variant: 'underline',
			orientation: 'horizontal',
			class: 'shadow-[inset_0_-1px_0_0_var(--color-neutral-muted)]'
		},
		{
			variant: 'underline',
			orientation: 'vertical',
			class: 'shadow-[inset_-1px_0_0_0_var(--color-neutral-muted)]'
		},
		// A vertical pill track shouldn't be a stadium — soften to a large radius.
		{ variant: 'pill', orientation: 'vertical', class: 'rounded-lg' }
	],
	defaultVariants: {
		orientation: 'horizontal',
		alignment: 'start',
		size: 'normal',
		variant: 'underline',
		scrollFade: 'none'
	}
});

const defaultTab = cva({
	// focus-visible only matches keyboard-driven focus (arrows/Tab), so pointer
	// clicks never show the ring. ring-inset: the scroll container's overflow-y
	// (forced to auto by overflow-x) would otherwise clip an outset ring.
	// whitespace-nowrap + default flex min-width:auto make tabs overflow (and
	// scroll) rather than compress when they don't fit. transition-colors (NOT
	// transition-all) eases only the label colour as the indicator slides — scoped
	// to colour so it never lags a layout/transform change.
	base: 'rounded-sm relative cursor-pointer inline-flex items-center justify-center outline-none whitespace-nowrap text-neutral/70 transition-colors duration-normal focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'px-md py-xs text-xs gap-xs',
			normal: 'px-lg py-xs text-sm gap-md',
			large: 'px-xl py-xs text-sm gap-md'
		},
		color: {
			primary: '',
			secondary: '',
			neutral: '',
			danger: '',
			success: '',
			warning: '',
			info: ''
		},
		active: {
			true: '',
			false: ''
		},
		focused: {
			// No background change on focus — it clashes with the sliding indicator
			// (especially the pill). Keyboard focus is still signalled by the text
			// lifting to full contrast.
			true: 'text-neutral',
			false: ''
		},
		disabled: {
			true: 'opacity-50 cursor-not-allowed pointer-events-none',
			false: ''
		},
		orientation: {
			horizontal: '',
			vertical: 'w-full'
		},
		position: {
			top: '',
			bottom: '',
			left: '',
			right: ''
		},
		variant: {
			underline: '',
			pill: 'rounded-full'
		},
		fullWidth: {
			true: 'w-full',
			false: ''
		}
	},
	defaultVariants: {
		color: 'neutral',
		size: 'normal',
		active: false,
		focused: false,
		disabled: false,
		orientation: 'horizontal',
		position: 'top',
		variant: 'underline'
	},
	compoundVariants: [
		// The moving indicator (see the `indicator` part) carries the underline/pill
		// visuals. Active-tab text: the underline leaves it on the page surface (full
		// contrast foreground); the pill sits on a `selected`-filled surface, so its text
		// flips to that role's contrast tone.
		{ active: true, variant: 'underline', class: 'text-neutral' },
		{ active: true, variant: 'pill', class: 'text-selected-contrast' }
	]
});

// The single shared active indicator. It is measured onto the active tab by the
// component (inline transform/width/height) and slides there; `data-ready`
// enables the transition only after the first placement so mount doesn't animate
// from the origin.
const defaultTabIndicator = cva({
	base: 'pointer-events-none absolute left-0 top-0 will-change-transform data-[ready=true]:transition-[transform,width,height] data-[ready=true]:duration-slow data-[ready=true]:ease-standard',
	variants: {
		variant: {
			underline: 'rounded-full bg-selected',
			// Colored raised pill (driven by data-color on the indicator). color
			// 'neutral' gives the neutral segmented-control look.
			pill: 'rounded-full bg-selected lift-1'
		}
	},
	defaultVariants: {
		variant: 'underline'
	}
});

// The static (CSS-only) indicator, rendered INSIDE the active tab for SSR and the
// pre-hydration window. It is positioned purely by layout (no JS measurement), so
// it renders at the correct place on the server. Once hydrated, the component
// swaps it for the measured `indicator` above at the identical spot.
const defaultTabStaticIndicator = cva({
	base: 'pointer-events-none absolute bg-selected',
	variants: {
		variant: {
			underline: 'rounded-full',
			pill: 'inset-0 -z-10 rounded-full lift-1'
		},
		// Only consulted for the underline variant (pill covers the whole tab).
		position: {
			top: '',
			bottom: '',
			left: '',
			right: ''
		}
	},
	compoundVariants: [
		{ variant: 'underline', position: 'top', class: 'inset-x-0 bottom-0 h-0.5' },
		{ variant: 'underline', position: 'bottom', class: 'inset-x-0 top-0 h-0.5' },
		{ variant: 'underline', position: 'left', class: 'inset-y-0 right-0 w-0.5' },
		{ variant: 'underline', position: 'right', class: 'inset-y-0 left-0 w-0.5' }
	],
	defaultVariants: {
		variant: 'underline',
		position: 'top'
	}
});

const defaultTabPrefix = cva({
	base: '',
	variants: {
		size: {
			small: '[&>svg]:size-icon-sm',
			normal: '[&>svg]:size-icon-md',
			large: '[&>svg]:size-icon-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultTabSuffix = cva({
	base: '',
	variants: {
		size: {
			small: '[&>svg]:size-icon-sm',
			normal: '[&>svg]:size-icon-md',
			large: '[&>svg]:size-icon-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const tabbarTheme = {
	root: defaultTabbar,
	tab: defaultTab,
	indicator: defaultTabIndicator,
	staticIndicator: defaultTabStaticIndicator,
	prefix: defaultTabPrefix,
	suffix: defaultTabSuffix
};

export type TabbarTheme = typeof tabbarTheme;
export type TabbarThemeProps = InferComponentTheme<TabbarTheme>;
export const setTabbarTheme = setComponentTheme<TabbarTheme>('tabbar');
export const useTabbarTheme = useComponentTheme<TabbarTheme>('tabbar', tabbarTheme);
