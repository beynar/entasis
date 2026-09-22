import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

export const defaultDialog = cva({
	base: 'fixed inset-0',
	variants: {
		scroll: {
			inner: 'overflow-hidden',
			outer: 'overflow-y-auto'
		}
	},
	defaultVariants: {
		scroll: 'inner'
	}
});

export const defaultDialogAlign = cva({
	base: 'flex p-layout-md',
	variants: {
		type: {
			fullScreen: 'justify-center items-center',
			// Drawers stand off the screen edge by `--drawer-inset` (the `drawerInset` design token),
			// modals keep the fixed gutter.
			drawerRight: 'justify-end p-(--drawer-inset)',
			drawerLeft: 'justify-start p-(--drawer-inset)',
			drawerBottom: 'justify-center items-end p-(--drawer-inset)',
			drawerTop: 'justify-center items-start p-(--drawer-inset)',
			modal: 'justify-center items-center',
			alert: 'justify-center items-center'
		},
		// `inner` needs a definite height so the card's `max-h-full` actually caps;
		// `outer` grows past the viewport so the positioner scrolls.
		scroll: {
			inner: 'h-full',
			outer: 'min-h-full'
		}
	},
	defaultVariants: {
		scroll: 'inner'
	}
});

export const defaultDialogBackdrop = cva({
	base: 'fixed inset-0 bg-neutral/40 backdrop-blur-xs'
});

export const defaultDialogContent = cva({
	base: 'z-10 relative px-xl py-md raised-xl h-fit bg-surface-floating text-neutral rounded-xl flex flex-col z-50 will-change-transform transition-transform duration-normal ease-standard',
	variants: {
		size: {
			small: 'max-w-md w-full',
			normal: 'max-w-xl w-full',
			large: 'max-w-3xl w-full'
		},
		type: {
			fullScreen: 'h-full w-full max-w-full origin-center',
			// The side that meets the screen edge takes `--drawer-edge-radius` (see Dialog.svelte):
			// the panel's own radius while the drawer is inset, square once `drawerInset` is `none`.
			drawerRight: 'rounded-r-[var(--drawer-edge-radius)] h-full origin-right',
			drawerLeft: 'rounded-l-[var(--drawer-edge-radius)] h-full origin-left',
			drawerBottom: 'rounded-b-[var(--drawer-edge-radius)] max-w-full origin-bottom',
			drawerTop: 'rounded-t-[var(--drawer-edge-radius)] max-w-full origin-top',
			modal: 'origin-center',
			alert: 'origin-center'
		},
		// `inner`: the card itself is the scroll container (capped by `max-h-full`).
		// `outer`: the card grows freely and the positioner scrolls — so it must NOT
		// be a scroll container, or `overscroll-none` traps the wheel over the card.
		scroll: {
			inner: 'max-h-full overflow-auto overscroll-none',
			outer: ''
		}
	},
	defaultVariants: {
		scroll: 'inner'
	}
});

// Drag thumb for swipe-dismissable drawers: in-flow bar on the inner edge for
// vertical drawers, edge-anchored vertical bar for horizontal ones.
export const defaultDialogThumb = cva({
	// Absolute so the bar overlays the panel edge instead of taking flow space (the header
	// sits flush at the top). The ::before oversizes the hitbox around the 6px bar (~38px
	// touch target); pointer events on it target the thumb, so drags there count as handle drags.
	base: "absolute z-10 touch-none rounded-full bg-neutral-muted before:absolute before:-inset-4 before:content-['']",
	variants: {
		type: {
			fullScreen: 'hidden',
			drawerRight: 'left-1.5 top-1/2 -translate-y-1/2 h-12 w-1.5',
			drawerLeft: 'right-1.5 top-1/2 -translate-y-1/2 h-12 w-1.5',
			drawerBottom: 'left-1/2 -translate-x-1/2 top-1.5 h-1.5 w-12',
			drawerTop: 'left-1/2 -translate-x-1/2 bottom-1.5 h-1.5 w-12',
			modal: 'hidden',
			alert: 'hidden'
		}
	}
});

export const defaultDialogHeader = cva({
	base: 'grid gap-xs mb-md border-b border-neutral-muted py-md',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

export const defaultDialogFooter = cva({
	base: '',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

export const defaultDialogCloseButton = cva({
	base: 'state-layer ml-auto rounded-full absolute top-1 right-1 p-xs text-neutral',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

export const defaultDialogTitle = cva({
	base: 'text-lg font-semibold text-neutral',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

export const defaultDialogDescription = cva({
	base: 'text-sm text-neutral/70',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

// Motion preset, keyed by the resolved `type`: modal/fullScreen/alert scale in place,
// drawers fly in from their edge. `duration` / `easing` stay tokens so a `<Theme motion>`
// retune and a reduced-motion preference reach every dialog.
export const defaultDialogMotion = motion({
	base: {
		in: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 0, scale: 0.98, opacity: 0 }
	},
	variants: {
		type: {
			modal: {},
			fullScreen: {},
			drawerRight: { in: { x: '100%' }, out: { x: '100%' } },
			drawerLeft: { in: { x: '-100%' }, out: { x: '-100%' } },
			drawerBottom: { in: { y: '100%' }, out: { y: '100%' } },
			drawerTop: { in: { y: '-100%' }, out: { y: '-100%' } },
			alert: { in: { y: -100 }, out: { y: -100 } }
		}
	},
	defaultVariants: {
		type: 'modal'
	}
});

export const dialogTheme = {
	motion: defaultDialogMotion,
	root: defaultDialog,
	align: defaultDialogAlign,
	backdrop: defaultDialogBackdrop,
	content: defaultDialogContent,
	thumb: defaultDialogThumb,
	header: defaultDialogHeader,
	footer: defaultDialogFooter,
	closeButton: defaultDialogCloseButton,
	title: defaultDialogTitle,
	description: defaultDialogDescription
};

export type DialogTheme = typeof dialogTheme;
export type DialogThemeProps = InferComponentTheme<DialogTheme>;
export const setDialogTheme = setComponentTheme<DialogTheme>('dialog');
export const useDialogTheme = useComponentTheme<DialogTheme>('dialog', dialogTheme);
export const useDialogMotion = () => useComponentMotion('dialog', defaultDialogMotion);
