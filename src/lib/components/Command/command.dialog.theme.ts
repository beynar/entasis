import type { DialogThemeProps } from '../Dialog/dialog.theme.js';

export const commandDialogTheme = {
	// The palette drops in from just above its resting place instead of scaling like a
	// plain modal. It rides the Dialog's `motion` slot, so `duration` / `easing` stay
	// Theme tokens and a reduced-motion preference still collapses it.
	motion: {
		in: { y: -8, scale: 0.98, opacity: 0 },
		out: { y: -8, scale: 0.98, opacity: 0 },
		duration: 'fast'
	},
	align: { type: { modal: 'items-start pt-[15vh]' } },
	content: {
		base: 'rounded-lg !px-0 !py-0 overflow-hidden',
		type: { drawerBottom: 'h-[min(70dvh,23rem)] [&>div]:h-full' }
	},
	header: { base: 'sr-only' },
	closeButton: { base: 'hidden' }
} satisfies DialogThemeProps;
