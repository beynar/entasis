import type { FSOParams, FSOProps } from '$lib/transitions/transition.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import type { ToastPosition } from './toast.state.svelte.js';

const defaultToast = cva({
	// Only the stack-reflow properties transition: a bare `duration-500` would fall
	// back to `transition-property: all` and animate colors/borders on theme flips
	// or hover too. (Toast.svelte listens for the `translate` transitionend.)
	base: 'cursor-default absolute pointer-events-auto bg-surface-floating border border-neutral-muted text-neutral shadow-lg transition-[translate,scale,opacity] duration-500 flex items-start justify-between',
	variants: {
		richColors: {
			// Soft tinted surface with a colored border (Sonner-style), not a heavy fill.
			// `muted-readable` is the accent pushed to a legible lightness ON the muted
			// tint — dark text in light mode, light text in dark mode — so danger etc.
			// stay readable in both. Plain `text-color` is too dark on the dark muted bg.
			true: 'bg-color-muted text-color-muted-readable border-color/20',
			false: ''
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
		size: {
			small: 'gap-md rounded-sm px-md py-md min-w-[220px] max-w-[300px]',
			normal: 'gap-md rounded-md px-lg py-md min-w-[260px] max-w-[340px]',
			large: 'gap-lg rounded-lg px-xl py-lg min-w-[300px] max-w-[400px]'
		},
		// Full screen-width bar flush to the top/bottom edge (overrides width & rounding).
		banner: {
			true: 'w-full min-w-0 max-w-none rounded-none border-x-0 items-center shadow-xl',
			false: ''
		}
	},
	compoundVariants: [],
	defaultVariants: { size: 'normal', banner: false }
});

const defaultToastPrefix = cva({
	base: 'aspect-square flex items-center justify-center text-color-readable',
	variants: {
		size: {
			small: 'size-4 [&_svg]:size-4',
			normal: 'size-5 [&_svg]:size-5',
			large: 'size-6 [&_svg]:size-6'
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
		richColors: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [],
	defaultVariants: { size: 'normal' }
});

// Inline, top-aligned close button (sits in the header row next to the title, not
// floating outside the toast). Subtle by default, tinting on hover.
const defaultToastCloseIcon = cva({
	base: 'state-layer shrink-0 -mr-xs -mt-micro flex items-center justify-center rounded-sm leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-color/40',
	variants: {
		size: {
			small: 'size-4 [&_svg]:size-3',
			normal: 'size-5 [&_svg]:size-3.5',
			large: 'size-6 [&_svg]:size-4'
		},
		richColors: {
			true: 'text-color-muted-readable/70 hover:text-color-muted-readable',
			false: 'text-neutral/60 hover:text-neutral'
		},
		color: {
			primary: '',
			secondary: '',
			neutral: '',
			danger: '',
			success: '',
			warning: '',
			info: ''
		}
	},
	compoundVariants: [],
	defaultVariants: { size: 'normal' }
});

// Trailing container for the toast's `actions` buttons.
const defaultToastActions = cva({
	base: 'flex shrink-0 items-center gap-xs'
});

// Duration progress bar, pinned to the toast's bottom edge. `overflow-hidden` +
// `rounded-b-md` clip the inner bar to the toast's corner radius (the root itself
// can't be clipped — the close icon sits outside it).
const defaultToastProgress = cva({
	base: 'pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-md bg-color/15'
});

const defaultToastSuffix = cva({
	base: 'max-h-10',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
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
		richColors: {
			true: '',
			false: ''
		}
	},
	defaultVariants: { size: 'normal' }
});

const defaultToastContent = cva({
	base: 'grid flex-1',
	variants: {
		size: {
			small: 'gap-0',
			normal: 'gap-micro',
			large: 'gap-xs'
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
		richColors: {
			true: '',
			false: ''
		}
	},
	defaultVariants: { size: 'normal' }
});

const defaultToastTitle = cva({
	base: 'font-semibold leading-tight',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
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
		// Non-rich: the semantic accent on the neutral surface. Rich: the legible
		// on-muted variant so it stays readable in dark mode.
		richColors: {
			true: 'text-color-muted-readable',
			false: 'text-color-readable'
		}
	},
	compoundVariants: [],
	defaultVariants: { size: 'normal' }
});
const defaultToastDescription = cva({
	base: 'leading-snug opacity-90',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
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
		richColors: {
			true: '',
			false: ''
		}
	},
	defaultVariants: { size: 'normal' }
});

// The fixed fullscreen <dialog> hosting every toast. Resets the UA dialog styles
// (margins, border, padding, sizing) and lets pointer events fall through — the
// toasts themselves re-enable pointer-events.
const defaultToaster = cva({
	base: 'pointer-events-none fixed inset-0 z-[9999] m-0 h-full w-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-0'
});

export const toastTheme = {
	toaster: defaultToaster,
	root: defaultToast,
	prefix: defaultToastPrefix,
	actions: defaultToastActions,
	progress: defaultToastProgress,
	suffix: defaultToastSuffix,
	content: defaultToastContent,
	closeIcon: defaultToastCloseIcon,
	title: defaultToastTitle,
	description: defaultToastDescription
};
export type ToastTheme = typeof toastTheme;
export type ToastThemeProps = InferComponentTheme<ToastTheme>;
export const setToastTheme = setComponentTheme<ToastTheme>('toast');
export const useToastTheme = useComponentTheme<ToastTheme>('toast', toastTheme);

export const defaultToastAnimation: Record<
	ToastPosition,
	{
		in?: FSOParams;
		out?: FSOParams;
	}
> = {
	'top-left': {
		in: {
			y: -100,
			x: -100,
			opacity: 0
		},
		out: {
			y: -100,
			x: -100,
			opacity: 0
		}
	},
	'top-right': {
		in: {
			y: -100,
			x: 100,
			opacity: 0
		},
		out: {
			y: -100,
			x: 100,
			opacity: 0
		}
	},
	'top-center': {
		in: {
			y: -100,
			opacity: 0
		},
		out: {
			y: -100,
			opacity: 0
		}
	},
	'bottom-left': {
		in: {
			y: 100,
			x: -100,
			opacity: 0
		},
		out: {
			y: 100,
			x: -100,
			opacity: 0
		}
	},
	'bottom-right': {
		in: {
			y: 100,
			x: 100,
			opacity: 0
		},
		out: {
			y: 100,
			x: 100,
			opacity: 0
		}
	},
	'bottom-center': {
		in: {
			y: 100,
			opacity: 0
		},
		out: {
			y: 100,
			opacity: 0
		}
	},
	'banner-top': {
		in: {
			y: '-100%',
			opacity: 0
		},
		out: {
			y: '-100%',
			opacity: 0
		}
	},
	'banner-bottom': {
		in: {
			y: '100%',
			opacity: 0
		},
		out: {
			y: '100%',
			opacity: 0
		}
	}
};
