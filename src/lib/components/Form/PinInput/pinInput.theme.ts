import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultInputContainer = cva({
	base: 'relative w-fit bg-transparent p-0 text-neutral',
	variants: {
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	}
});

const defaultRoot = cva({
	base: 'relative inline-flex items-center',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: 'cursor-text'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultInput = cva({
	base: 'absolute inset-0 z-10 size-full appearance-none border-0 bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent selection:text-transparent [font-size:16px] disabled:cursor-not-allowed',
	variants: {
		// An input method paints its composition underline or clause highlight whatever the text
		// color, so the input hides while composing and the cells show the text. It stays opaque
		// otherwise: iOS offers long-press paste only on a visible input.
		composing: {
			true: 'opacity-0',
			false: ''
		}
	},
	defaultVariants: {
		composing: false
	}
});

const defaultCell = cva({
	base: 'relative grid shrink-0 place-items-center overflow-hidden raised-1 bg-surface-raised font-mono font-medium tabular-nums text-neutral transition-[color,background-color,border-color,box-shadow]',
	variants: {
		size: {
			small: 'size-8 rounded-md text-xs',
			normal: 'size-10 rounded-md text-sm',
			large: 'size-12 rounded-md text-sm'
		},
		active: {
			true: '[--raised-border:1px_solid_var(--color-neutral)] ring-2 ring-selected/40',
			false: ''
		},
		disabled: {
			true: 'opacity-60',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		active: false,
		disabled: false
	}
});

const defaultSeparator = cva({
	base: 'h-0.5 shrink-0 rounded-full bg-neutral-muted',
	variants: {
		size: {
			small: 'w-1.5',
			normal: 'w-2',
			large: 'w-3'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCharacter = cva({
	base: 'select-none leading-none'
});

const defaultCaret = cva({
	base: 'absolute h-5 w-px animate-pulse rounded-full bg-primary'
});

export const pinInputTheme = {
	inputContainer: defaultInputContainer,
	root: defaultRoot,
	input: defaultInput,
	cell: defaultCell,
	separator: defaultSeparator,
	character: defaultCharacter,
	caret: defaultCaret
};

export type PinInputTheme = typeof pinInputTheme;
export type PinInputThemeProps = InferComponentTheme<PinInputTheme>;
export const setPinInputTheme = setComponentTheme<PinInputTheme>('pin-input');
export const usePinInputTheme = useComponentTheme('pin-input', pinInputTheme);
