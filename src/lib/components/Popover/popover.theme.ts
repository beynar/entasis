import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

// The positioning wrapper: portaled and fixed when floating (placed by floating-ui), left in
// normal flow when `inline`. Resets <dialog> defaults either way so it's an invisible box hugging
// the panel; the panel inside carries the visuals + transition.
const defaultPopoverContainer = cva({
	base: 'fixed m-0 border-none bg-transparent p-0 outline-none',
	variants: {
		mode: {
			floating: 'top-0 left-0 h-fit w-fit',
			// `inline` keeps the panel in normal flow where the component sits: no portal, no
			// fixed positioning, no floating-ui placement.
			inline: 'static h-fit w-fit',
			mobileSheet:
				'inset-0 flex h-dvh w-dvw max-w-none items-end justify-center overflow-hidden bg-neutral/40 backdrop-blur-xs'
		}
	},
	defaultVariants: {
		mode: 'floating'
	}
});

// The visible, animated panel. The radius lives on the base and the padding on `size`, and both
// publish to the panel's children, so everything a popover hosts that sits flush against the
// padding box — menu rows, select options, a Command palette's items — takes
// `rounded-<step>-concentric` and stays concentric with the panel at every size and every radius
// preset.
const defaultPopover = cva({
	base: 'raised-3 bg-surface-floating text-neutral isolate h-fit w-fit rounded-lg text-sm',
	variants: {
		size: {
			small: 'max-w-3xs w-full p-xs',
			normal: 'max-w-xs w-full p-md',
			large: 'max-w-sm w-full p-xl'
		},
		mode: {
			floating: '',
			// Same visuals as `floating` — only the positioning of the wrapper differs.
			inline: '',
			mobileSheet:
				'max-h-[85dvh] w-full max-w-none overflow-auto rounded-b-none rounded-t-xl pb-[calc(env(safe-area-inset-bottom)+1rem)]'
		}
	},
	defaultVariants: {
		mode: 'floating'
	}
});

// A floating panel scales in place; the mobile sheet slides up from the bottom edge.
// `duration` / `easing` stay tokens, so `<Theme motion>` and reduced motion reach both.
export const defaultPopoverMotion = motion({
	base: {
		in: { x: 0, y: 0, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 0, scale: 0.98, opacity: 0 }
	},
	variants: {
		mode: {
			floating: {},
			// Inline panels scale in place like floating ones.
			inline: {},
			mobileSheet: {
				in: { y: '100%', scale: 1, opacity: 1 },
				out: { y: '100%', scale: 1, opacity: 1 }
			}
		}
	},
	defaultVariants: {
		mode: 'floating'
	}
});

export const popoverTheme = {
	motion: defaultPopoverMotion,
	root: defaultPopoverContainer,
	popover: defaultPopover
};

export type PopoverTheme = typeof popoverTheme;
export type PopoverThemeProps = InferComponentTheme<PopoverTheme>;
export const setPopoverTheme = setComponentTheme<PopoverTheme>('popover');
export const usePopoverTheme = useComponentTheme<PopoverTheme>('popover', popoverTheme);
export const usePopoverMotion = () => useComponentMotion('popover', defaultPopoverMotion);
