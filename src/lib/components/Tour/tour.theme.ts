import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// The viewport-sized layer that holds the backdrop. It lets every press through except where the
// backdrop path paints, so the spotlight hole is a real hole: the target under it is pressed as
// usual, with no z-index lifted.
const defaultTourRoot = cva({
	base: 'pointer-events-none fixed inset-0'
});

const defaultTourSvg = cva({
	base: 'absolute inset-0 size-full overflow-visible'
});

// The dimmed page around the hole: the same scrim as a modal Dialog's.
const defaultTourBackdrop = cva({
	base: 'pointer-events-auto fill-black/40 dark:fill-black/60'
});

// Covers the hole when `interactiveTarget` is off: invisible, but it takes the press.
const defaultTourBlocker = cva({
	base: 'pointer-events-auto fill-transparent'
});

// The Stepper inside the Popover panel that carries the steps' content: it slides from one step
// to the next and tweens its height. Its panels are laid out in an absolute track, so it sets the
// popup's width itself.
const defaultTourStage = cva({
	base: '',
	variants: {
		size: {
			small: 'w-60',
			normal: 'w-72',
			large: 'w-80'
		}
	},
	defaultVariants: { size: 'normal' }
});

// A step's content, one per Stepper panel.
const defaultTourPanel = cva({
	base: 'flex flex-col outline-none',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		}
	},
	defaultVariants: { size: 'normal' }
});

const defaultTourHeader = cva({
	base: 'flex items-start justify-between gap-sm'
});

const defaultTourTitle = cva({
	base: 'font-medium text-neutral',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: { size: 'normal' }
});

const defaultTourDescription = cva({
	base: 'text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: { size: 'normal' }
});

const defaultTourFooter = cva({
	base: 'flex items-center justify-between gap-sm'
});

const defaultTourProgress = cva({
	base: 'text-xs text-neutral/70 tabular-nums'
});

const defaultTourDots = cva({
	base: 'flex items-center gap-xs'
});

const defaultTourDot = cva({
	base: 'size-1.5 rounded-full bg-neutral/20 transition-colors duration-fast data-[active]:bg-neutral'
});

const defaultTourActions = cva({
	base: 'ms-auto flex items-center gap-xs'
});

// The backdrop fades in and out; the spotlight glides from one target to the next over the
// `moderate` step with the `standard` curve (something that moves, not a surface arriving), and
// the popup glides along with it while its Stepper slides to the next step's content on that timing.
// Reduced motion zeroes all of it.
export const defaultTourMotion = motion({
	base: {
		in: { opacity: 0 },
		out: { opacity: 0 },
		duration: 'normal'
	},
	variants: {
		part: {
			backdrop: {},
			spotlight: { duration: 'moderate', easing: 'standard' }
		}
	},
	defaultVariants: { part: 'backdrop' }
});

export const tourTheme = {
	motion: defaultTourMotion,
	root: defaultTourRoot,
	svg: defaultTourSvg,
	backdrop: defaultTourBackdrop,
	blocker: defaultTourBlocker,
	stage: defaultTourStage,
	panel: defaultTourPanel,
	header: defaultTourHeader,
	title: defaultTourTitle,
	description: defaultTourDescription,
	footer: defaultTourFooter,
	progress: defaultTourProgress,
	dots: defaultTourDots,
	dot: defaultTourDot,
	actions: defaultTourActions
};

export type TourTheme = typeof tourTheme;
export type TourThemeProps = InferComponentTheme<TourTheme>;
export const setTourTheme = setComponentTheme<TourTheme>('tour');
export const useTourTheme = useComponentTheme<TourTheme>('tour', tourTheme);
export const useTourMotion = () => useComponentMotion('tour', defaultTourMotion);
