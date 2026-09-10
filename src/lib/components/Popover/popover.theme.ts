import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The portaled positioning wrapper (fixed, placed by floating-ui). Resets <dialog> defaults so
// it's an invisible box hugging the panel; the panel inside carries the visuals + transition.
const defaultPopoverContainer = cva({
	base: 'fixed z-[+50] m-0 border-none bg-transparent p-0 outline-none',
	variants: {
		mode: {
			floating: 'top-0 left-0 h-fit w-fit',
			mobileSheet:
				'inset-0 flex h-dvh w-dvw max-w-none items-end justify-center overflow-hidden bg-neutral/40 backdrop-blur-xs'
		}
	},
	defaultVariants: {
		mode: 'floating'
	}
});

// The visible, animated panel.
const defaultPopover = cva({
	base: 'ring-neutral/10 bg-surface-floating text-neutral isolate h-fit w-fit rounded-md text-sm shadow-md ring-1',
	variants: {
		size: {
			small: 'max-w-3xs w-full p-xs',
			normal: 'max-w-xs w-full p-md',
			large: 'max-w-sm w-full p-xl'
		},
		mode: {
			floating: '',
			mobileSheet:
				'max-h-[85dvh] w-full max-w-none overflow-auto rounded-b-none rounded-t-lg pb-[calc(env(safe-area-inset-bottom)+1rem)]'
		}
	},
	defaultVariants: {
		mode: 'floating'
	}
});

export const popoverTheme = {
	root: defaultPopoverContainer,
	popover: defaultPopover
};

export type PopoverTheme = typeof popoverTheme;
export type PopoverThemeProps = InferComponentTheme<PopoverTheme>;
export const setPopoverTheme = setComponentTheme<PopoverTheme>('popover');
export const usePopoverTheme = useComponentTheme<PopoverTheme>('popover', popoverTheme);
