import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultToast = cva({
	// Only the stack-reflow properties transition: a bare `duration-slower` would fall
	// back to `transition-property: all` and animate colors/borders on theme flips
	// or hover too. (Toast.svelte listens for the `translate` transitionend.)
	base: 'cursor-default absolute pointer-events-auto bg-surface-floating border border-neutral-muted text-neutral lift-1 transition-[translate,scale,opacity] duration-slower flex items-start justify-between',
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
			small: 'gap-md rounded-md px-md py-md min-w-[220px] max-w-[300px]',
			normal: 'gap-md rounded-lg px-lg py-md min-w-[260px] max-w-[340px]',
			large: 'gap-lg rounded-lg px-xl py-lg min-w-[300px] max-w-[400px]'
		},
		// Full screen-width bar flush to the top/bottom edge (overrides width & rounding).
		banner: {
			true: 'w-full min-w-0 max-w-none rounded-none border-x-0 items-center lift-5',
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
			small: 'size-4 [&_svg]:size-icon-md',
			normal: 'size-5 [&_svg]:size-icon-lg',
			large: 'size-6 [&_svg]:size-icon-xl'
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
	base: 'state-layer shrink-0 -mr-xs -mt-micro flex items-center justify-center rounded-sm leading-none transition-colors outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'size-4 [&_svg]:size-icon-xs',
			normal: 'size-5 [&_svg]:size-icon-sm',
			large: 'size-6 [&_svg]:size-icon-md'
		},
		richColors: {
			true: 'text-color-muted-readable/70 hover:text-color-muted-readable',
			false: 'text-neutral/70 hover:text-neutral'
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
// `rounded-b-lg` clip the inner bar to the toast's corner radius (the root itself
// can't be clipped — the close icon sits outside it).
const defaultToastProgress = cva({
	base: 'pointer-events-none absolute inset-x-0 bottom-0 h-1 overflow-hidden rounded-b-lg bg-neutral/15'
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
			false: 'text-neutral'
		}
	},
	compoundVariants: [],
	defaultVariants: { size: 'normal' }
});
const defaultToastDescription = cva({
	base: 'leading-snug text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
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
			true: 'text-current/70',
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

// Motion preset, keyed by the toast's resolved `position`: every toast flies in from
// the screen edge it is pinned to and leaves the same way. Banners slide by their own
// height (`%`) instead of a fixed distance. `duration` / `easing` stay tokens so a
// `<Theme motion>` retune and a reduced-motion preference reach every toast.
export const defaultToastMotion = motion({
	base: {
		in: { x: 0, y: 0, opacity: 0 },
		out: { x: 0, y: 0, opacity: 0 }
	},
	variants: {
		position: {
			'top-left': { in: { y: -100, x: -100 }, out: { y: -100, x: -100 } },
			'top-right': { in: { y: -100, x: 100 }, out: { y: -100, x: 100 } },
			'top-center': { in: { y: -100 }, out: { y: -100 } },
			'bottom-left': { in: { y: 100, x: -100 }, out: { y: 100, x: -100 } },
			'bottom-right': { in: { y: 100, x: 100 }, out: { y: 100, x: 100 } },
			'bottom-center': { in: { y: 100 }, out: { y: 100 } },
			'banner-top': { in: { y: '-100%' }, out: { y: '-100%' } },
			'banner-bottom': { in: { y: '100%' }, out: { y: '100%' } }
		}
	},
	defaultVariants: {
		position: 'bottom-right'
	}
});

export const toastTheme = {
	motion: defaultToastMotion,
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

type ToastThemeSlot = Record<string, unknown>;

const appendClasses = (under: unknown, over: unknown) => {
	const parts = [under, over].filter(
		(value): value is string => typeof value === 'string' && !!value
	);
	return parts.length ? parts.join(' ') : undefined;
};

/**
 * Layers a per-toast `theme` over the Toaster's, slot by slot and then variant by
 * variant. `base` strings are concatenated with the toast's last, so tailwind-merge
 * lets the per-toast classes win; every other key is replaced outright.
 */
export const mergeToastTheme = (
	under: ToastThemeProps | undefined,
	over: ToastThemeProps | undefined
): ToastThemeProps | undefined => {
	if (!under) return over;
	if (!over) return under;
	const merged: Record<string, unknown> = { ...under };
	for (const [slot, overSlot] of Object.entries(over as Record<string, unknown>)) {
		const underSlot = (under as Record<string, unknown>)[slot];
		if (
			slot === 'override' ||
			!overSlot ||
			typeof overSlot !== 'object' ||
			!underSlot ||
			typeof underSlot !== 'object'
		) {
			merged[slot] = overSlot;
			continue;
		}
		const slotResult: ToastThemeSlot = { ...(underSlot as ToastThemeSlot) };
		for (const [key, overValue] of Object.entries(overSlot as ToastThemeSlot)) {
			const underValue = (underSlot as ToastThemeSlot)[key];
			if (key === 'base') slotResult[key] = appendClasses(underValue, overValue);
			else if (
				overValue &&
				typeof overValue === 'object' &&
				underValue &&
				typeof underValue === 'object'
			)
				slotResult[key] = { ...(underValue as ToastThemeSlot), ...(overValue as ToastThemeSlot) };
			else slotResult[key] = overValue;
		}
		merged[slot] = slotResult;
	}
	return merged as ToastThemeProps;
};
export const setToastTheme = setComponentTheme<ToastTheme>('toast');
export const useToastTheme = useComponentTheme<ToastTheme>('toast', toastTheme);
export const useToastMotion = () => useComponentMotion('toast', defaultToastMotion);
