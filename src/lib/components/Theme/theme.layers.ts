// z-index policy for floating layers. Every layer gets `base + openOrder * step`, and
// `openOrder` is a single global sequence, so whatever opened last sits on top regardless
// of kind or DOM order. Toasts and floating windows start above the overlay band.
export const LAYER_Z_BASE = {
	dialog: 50,
	popover: 50,
	menu: 50,
	tooltip: 50,
	lightbox: 50,
	toast: 900,
	'floating-window': 1000
} as const;
export const LAYER_Z_STEP = 10;

export const FLOATING_WINDOW_LAYER_Z_INDEX = 40;
export const DIALOG_Z_BASE = LAYER_Z_BASE.dialog;
export const DIALOG_Z_STEP = LAYER_Z_STEP;
