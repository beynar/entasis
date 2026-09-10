import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInput = cva({
	base: 'outline-none flex-1 w-full min-w-0 h-full bg-transparent resize-none autofill:text-neutral appearance-none text-sm leading-normal',
	variants: {
		size: {
			small: 'text-xs placeholder:text-xs',
			normal: 'text-sm placeholder:text-sm',
			large: 'text-sm placeholder:text-sm'
		},
		hasValue: {
			true: 'placeholder:text-neutral',
			false: 'placeholder:text-neutral/60'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultInputContainer = cva({
	base: 'flex w-full items-center border border-neutral-muted bg-surface-raised px-lg text-neutral ring-0 transition-all rounded-md outline-none focus-within:ring-2 focus-within:ring-primary/50',
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
		size: 'normal',
		disabled: false
	}
});

const defaultLoading = cva({
	base: 'text-neutral/60 p-md text-sm',
	variants: {
		size: {
			small: 'text-xs p-sm',
			normal: 'text-sm p-sm',
			large: 'text-sm p-md'
		}
	}
});

const defaultError = cva({
	base: 'text-danger-readable p-md text-sm',
	variants: {
		size: {
			small: 'text-xs p-sm',
			normal: 'text-sm p-sm',
			large: 'text-sm p-md'
		}
	}
});

const defaultNoOptions = cva({
	base: 'text-neutral/60 p-md text-sm',
	variants: {
		size: {
			small: 'text-xs p-sm',
			normal: 'text-sm p-sm',
			large: 'text-sm p-md'
		}
	}
});

export const comboboxTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer,
	loading: defaultLoading,
	error: defaultError,
	noOptions: defaultNoOptions
};

export type ComboboxTheme = typeof comboboxTheme;
export type ComboboxThemeProps = InferComponentTheme<ComboboxTheme>;
export const setComboboxTheme = setComponentTheme<ComboboxTheme>('combobox');
export const useComboboxTheme = useComponentTheme('combobox', comboboxTheme);
