import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInputContainer = cva({
	base: 'flex min-h-32 w-full cursor-pointer flex-col items-center justify-center border border-neutral-muted bg-surface-raised px-lg py-md text-neutral ring-0 transition-[color,background-color,border-color,box-shadow] rounded-md outline-none focus-within:ring-2 focus-within:ring-focus/50',
	variants: {
		size: {
			small: 'min-h-24',
			normal: 'min-h-32',
			large: 'min-h-40'
		},
		state: {
			idle: '',
			potential: 'border-neutral/50',
			valid: 'border-success bg-success/5',
			invalid: 'border-danger bg-danger/5'
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

const defaultPlaceholder = cva({
	base: 'flex flex-col items-center justify-center gap-md text-neutral/70',
	variants: {
		size: {
			small: 'text-xs gap-xs',
			normal: 'text-sm gap-md',
			large: 'text-base gap-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultFileList = cva({
	base: 'w-full flex flex-col gap-md mt-md',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultFile = cva({
	base: 'flex items-center gap-lg p-md bg-surface-canvas',
	variants: {
		size: {
			small: 'p-xs text-xs gap-md',
			normal: 'p-md text-sm gap-lg',
			large: 'p-lg text-base gap-xl'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const fileInputTheme = {
	inputContainer: defaultInputContainer,
	placeholder: defaultPlaceholder,
	fileList: defaultFileList,
	file: defaultFile
};

export type FileInputTheme = typeof fileInputTheme;
export type FileInputThemeProps = InferComponentTheme<FileInputTheme>;
export const setFileInputTheme = setComponentTheme<FileInputTheme>('fileInput');
export const useFileInputTheme = useComponentTheme('fileInput', fileInputTheme);
