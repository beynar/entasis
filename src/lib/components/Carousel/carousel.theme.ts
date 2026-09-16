import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The carousel lays itself out against its own width, not the viewport's: the root is the named
// container the slides-per-view rules in Carousel.svelte query (`@container carousel (width >=
// 36rem / 42rem / 56rem / 72rem)` for sm/md/lg/xl), and the same thresholds drive `breakpoint` in
// carousel.state.svelte.ts. `w-full min-w-0` is load-bearing: inline-size containment strips the
// root of intrinsic width, so a root left to shrink-to-fit inside a flex or grid parent would
// measure zero.
// The root does not clip: the slider is a scroll container and clips itself, and it bleeds on
// both axes (negative margin paid back by padding, so slides stay aligned with the host) by at
// least `--space-sm` and as far as the elevation scale's largest shadow (`--elevation-bleed-*`),
// so slides' rings and shadows are never cropped at its edge. The bleed lives in
// Carousel.svelte's style block next to the scroll padding.
// The root is a vertical stack — slider, then footer — laid out as a GRID rather than a column
// flex: the slider's bleed rule sets `flex: 1 1 0%` so its negative inline margins can grow its
// border box, and in a column flex container that basis would be read on the BLOCK axis and
// collapse the track to zero height. In a single-column grid the declaration is inert, the track
// still stretches to the column and its negative inline margins still bleed past it.
// No row gap: the slider already carries `margin-block: --space-xl` (net of the bleed it hides in
// that margin), which is the footer's clearance from the slides' shadow room.
const defaultContainer = cva({
	base: 'relative grid w-full min-w-0 grid-cols-[minmax(0,1fr)] @container/carousel'
});

// Chrome row under the slider: pagination fills the leading side, the prev/next pair sits at the
// trailing end — `justify-between` only spaces the two halves apart, the pair's own `ms-auto` (see
// `defaultNavigation`) is what keeps it trailing when the pagination half is dropped. Nothing here
// overlays the slides.
const defaultFooter = cva({
	base: 'flex w-full min-w-0 items-center justify-between gap-md'
});

// Recessed track + role-coloured fill. `progress` is a bar, not a control, so it takes no state
// layer and no focus ring — the fill's width is the whole readout.
const defaultProgress = cva({
	base: 'relative min-w-0 flex-1 overflow-hidden rounded-full bg-surface-recessed',
	variants: {
		size: {
			small: 'h-0.5',
			normal: 'h-1',
			large: 'h-1.5'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultProgressFill = cva({
	base: 'h-full rounded-full transition-[width] duration-fast ease-standard',
	variants: {
		color: {
			primary: 'bg-primary',
			secondary: 'bg-secondary',
			neutral: 'bg-neutral',
			danger: 'bg-danger',
			success: 'bg-success',
			warning: 'bg-warning',
			info: 'bg-info'
		}
	},
	defaultVariants: {
		color: 'neutral'
	}
});

// The prev/next pair. `shrink-0` keeps the arrows at their control size while the pagination
// takes whatever width is left. `ms-auto` is what actually pins the pair to the trailing end:
// with `pagination={false}` the navigation is the footer's only flex child, and the footer's
// `justify-between` would then park it at the LEADING edge. The auto inline-start margin eats the
// free space instead, so the arrows stay trailing whatever the leading slot holds, and it is inert
// when a `flex-1` pagination part is present because there is no free space left to absorb.
const defaultNavigation = cva({
	base: 'flex shrink-0 items-center gap-xs ms-auto'
});

const defaultSlider = cva({
	base: 'display-grid relative whitespace-nowrap overflow-x-auto overflow-y-clip scroll-behavior-smooth overscroll-behavior-x-contain inline-size-full max-inline-size-full box-border scrollbar-width-none'
});

const defaultSlide = cva({
	base: 'inline-block whitespace-normal align-top'
});

// A ghost icon button in the footer row: no fill of its own, the state layer paints the hover
// and press tint, and the box is square because the control height and the hit-area minimum are
// the same step of the geometry scale.
const defaultNavigationButton = cva({
	base: 'state-layer rounded-sm cursor-pointer inline-flex items-center justify-center transition-[color,background-color,box-shadow,opacity] duration-fast ease-standard outline-none border-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'h-control-sm min-size-hit-sm',
			normal: 'h-control-md min-size-hit-md',
			large: 'h-control-lg min-size-hit-lg'
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
		disabled: {
			true: 'opacity-50 cursor-not-allowed pointer-events-none',
			false: null
		}
	},
	defaultVariants: {
		color: 'neutral',
		size: 'normal'
	}
});

// The other pagination style. It sits in the same footer slot the progress line does, so it
// keeps the line's `flex-1` and drops the old absolute positioning and its `position` variant.
const defaultDots = cva({
	base: 'flex min-w-0 flex-1 items-center',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultDot = cva({
	base: 'rounded-full transition-[background-color,box-shadow] cursor-pointer border-none outline-none',
	variants: {
		size: {
			small: 'h-1.5 w-1.5',
			normal: 'h-2 w-2',
			large: 'h-2.5 w-2.5'
		},
		color: {
			primary: 'bg-primary',
			secondary: 'bg-secondary',
			neutral: 'bg-neutral',
			danger: 'bg-danger',
			success: 'bg-success',
			warning: 'bg-warning',
			info: 'bg-info'
		},
		active: {
			true: 'ring-1 ring-color ring-offset-1',
			false: null
		}
	},
	defaultVariants: {
		color: 'neutral',
		size: 'normal',
		active: false
	}
});

export const carouselTheme = {
	root: defaultContainer,
	slider: defaultSlider,
	slide: defaultSlide,
	footer: defaultFooter,
	progress: defaultProgress,
	progressFill: defaultProgressFill,
	navigation: defaultNavigation,
	navigationButton: defaultNavigationButton,
	dots: defaultDots,
	dot: defaultDot
};

export type CarouselTheme = typeof carouselTheme;
export type CarouselThemeProps = InferComponentTheme<CarouselTheme>;
export const setCarouselTheme = setComponentTheme<CarouselTheme>('carousel');
export const useCarouselTheme = useComponentTheme<CarouselTheme>('carousel', carouselTheme);
