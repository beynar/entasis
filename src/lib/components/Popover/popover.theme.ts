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
				'inset-0 flex h-dvh w-dvw max-w-none items-end justify-center overflow-hidden bg-black/40 backdrop-blur-xs dark:bg-black/60'
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
		},
		// The arrow is placed against the panel's box.
		arrow: {
			true: 'relative',
			false: ''
		}
	},
	defaultVariants: {
		mode: 'floating',
		arrow: false
	}
});

// The arrow is a rotated square the panel's colour, half of it poking out of the edge that faces
// the trigger. It sits behind the panel's content (`-z-10` inside the panel's own stacking
// context) but above the panel's own border, so the half inside the panel hides the border
// beneath it and the half outside carries the edge on its two outer sides: the corner that
// points at the trigger is the top-left one before the 45° turn when the panel is below it, the
// bottom-right one when above, and so on. Its position along the edge and its edge offset are
// written by the placement, with the side as `data-side`.
const defaultPopoverArrow = cva({
	base: [
		'bg-surface-floating pointer-events-none absolute -z-10 size-2.5 rotate-45 rounded-xs border border-transparent',
		'data-[side=bottom]:border-t-neutral-muted data-[side=bottom]:border-l-neutral-muted',
		'data-[side=top]:border-r-neutral-muted data-[side=top]:border-b-neutral-muted',
		'data-[side=right]:border-b-neutral-muted data-[side=right]:border-l-neutral-muted',
		'data-[side=left]:border-t-neutral-muted data-[side=left]:border-r-neutral-muted'
	].join(' ')
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
	popover: defaultPopover,
	arrow: defaultPopoverArrow
};

export type PopoverTheme = typeof popoverTheme;
export type PopoverThemeProps = InferComponentTheme<PopoverTheme>;
export const setPopoverTheme = setComponentTheme<PopoverTheme>('popover');
export const usePopoverTheme = useComponentTheme<PopoverTheme>('popover', popoverTheme);
export const usePopoverMotion = () => useComponentMotion('popover', defaultPopoverMotion);
