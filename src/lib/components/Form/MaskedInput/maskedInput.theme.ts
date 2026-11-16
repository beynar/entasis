import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

// Digits keep one width, so a value does not shift as it is typed or as the placeholder fills.
const defaultInput = cva({
	base: 'outline-none flex-1 w-full min-w-0 h-full bg-transparent placeholder:text-neutral/70 autofill:text-neutral appearance-none text-sm leading-normal tabular-nums',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultInputContainer = cva({
	base: 'flex w-full items-center border border-neutral-muted bg-surface-raised px-lg text-neutral ring-0 transition-[color,background-color,border-color,box-shadow] rounded-md outline-none focus-within:ring-2 focus-within:ring-focus/50',
	variants: {
		size: {
			small: 'h-control-sm text-xs',
			normal: 'h-control-md text-sm',
			large: 'h-control-lg text-sm'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const maskedInputTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer
};

export type MaskedInputTheme = typeof maskedInputTheme;
export type MaskedInputThemeProps = InferComponentTheme<MaskedInputTheme>;
export const setMaskedInputTheme = setComponentTheme<MaskedInputTheme>('masked-input');
export const useMaskedInputTheme = useComponentTheme('masked-input', maskedInputTheme);
