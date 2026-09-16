import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInput = cva({
	base: 'outline-none flex-1 w-full min-w-0 h-full bg-transparent resize-none placeholder:text-neutral/70 autofill:text-neutral appearance-none text-sm leading-normal',
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

export const passwordInputTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer
};

export type PasswordInputTheme = typeof passwordInputTheme;
export type PasswordInputThemeProps = InferComponentTheme<PasswordInputTheme>;
export const setPasswordInputTheme = setComponentTheme<PasswordInputTheme>('passwordInput');
export const usePasswordInputTheme = useComponentTheme('passwordInput', passwordInputTheme);
