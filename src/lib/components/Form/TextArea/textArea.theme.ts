import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultTextArea = cva({
	base: 'outline-none flex-1 w-full min-w-0 bg-transparent text-sm resize-none placeholder:text-neutral/60 autofill:text-neutral appearance-none leading-normal',
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

const defaultTextAreaContainer = cva({
	base: 'flex w-full items-start border border-neutral-muted bg-surface-raised px-lg py-md text-neutral ring-0 transition-all rounded-md outline-none focus-within:ring-2 focus-within:ring-primary/50',
	variants: {
		size: {
			small: 'min-h-16 py-sm text-xs',
			normal: 'min-h-24 py-sm text-sm',
			large: 'min-h-32 py-md text-sm'
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

export const textAreaTheme = {
	input: defaultTextArea,
	inputContainer: defaultTextAreaContainer
};

export type TextAreaTheme = typeof textAreaTheme;
export type TextAreaThemeProps = InferComponentTheme<TextAreaTheme>;
export const setTextAreaTheme = setComponentTheme<TextAreaTheme>('textArea');
export const useTextAreaTheme = useComponentTheme('textArea', textAreaTheme);
