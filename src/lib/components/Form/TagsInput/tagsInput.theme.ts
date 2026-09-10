import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInput = cva({
	base: 'outline-none flex-1 min-w-24 min-h-0 bg-transparent resize-none autofill:text-neutral appearance-none text-sm leading-normal',
	variants: {
		size: {
			small: 'text-xs placeholder:text-xs',
			normal: 'text-sm placeholder:text-sm',
			large: 'text-sm placeholder:text-sm'
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
	base: 'flex w-full flex-wrap items-center justify-start border border-neutral-muted bg-surface-raised px-lg text-neutral ring-0 transition-all rounded-md outline-none focus-within:ring-2 focus-within:ring-primary/50',
	variants: {
		size: {
			small: 'min-h-[var(--control-height-sm)] py-xs text-xs gap-xs',
			normal: 'min-h-[var(--control-height-md)] py-xs text-sm gap-sm',
			large: 'min-h-[var(--control-height-lg)] py-sm text-sm gap-sm'
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

const defaultTag = cva({
	base: 'inline-flex',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		size: 'normal'
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

export const tagsInputTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer,
	tag: defaultTag,
	loading: defaultLoading,
	error: defaultError,
	noOptions: defaultNoOptions
};

export type TagsInputTheme = typeof tagsInputTheme;
export type TagsInputThemeProps = InferComponentTheme<TagsInputTheme>;
export const setTagsInputTheme = setComponentTheme<TagsInputTheme>('tagsInput');
export const useTagsInputTheme = useComponentTheme('tagsInput', tagsInputTheme);
