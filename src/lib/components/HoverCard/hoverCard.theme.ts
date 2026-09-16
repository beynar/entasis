import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultHoverCardTrigger = cva({
	base: 'inline-flex w-fit max-w-full outline-none',
	variants: {
		disabled: {
			true: 'pointer-events-none opacity-55',
			false: null
		}
	},
	defaultVariants: {
		disabled: false
	}
});

const defaultHoverCardPopover = cva({
	base: 'bg-transparent p-0 shadow-none ring-0'
});

const defaultHoverCardCard = cva({
	base: 'w-max',
	variants: {
		size: {
			small: 'max-w-[min(16rem,calc(100vw-2rem))]',
			normal: 'max-w-[min(18rem,calc(100vw-2rem))]',
			large: 'max-w-[min(24rem,calc(100vw-2rem))]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// The card lifts in and settles back: `enter` on the way in, `exit` on the way out
// is left to the tokens (one spec drives both sides). The resolved preset is handed
// to the underlying Popover as its `transition`, replacing the popover preset.
export const defaultHoverCardMotion = motion({
	base: {
		in: { x: 0, y: 4, scale: 0.98, opacity: 0 },
		out: { x: 0, y: 4, scale: 0.98, opacity: 0 },
		duration: 'fast',
		easing: 'enter'
	}
});

export const hoverCardTheme = {
	motion: defaultHoverCardMotion,
	trigger: defaultHoverCardTrigger,
	popover: defaultHoverCardPopover,
	card: defaultHoverCardCard
};

export type HoverCardTheme = typeof hoverCardTheme;
export type HoverCardThemeProps = InferComponentTheme<HoverCardTheme>;
export const setHoverCardTheme = setComponentTheme<HoverCardTheme>('hover-card');
export const useHoverCardTheme = useComponentTheme<HoverCardTheme>('hover-card', hoverCardTheme);
export const useHoverCardMotion = () => useComponentMotion('hover-card', defaultHoverCardMotion);
