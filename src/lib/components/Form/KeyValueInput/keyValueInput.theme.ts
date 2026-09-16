import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInputContainer = cva({
	base: 'flex flex-col w-full',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultRow = cva({
	base: 'grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultInput = cva({
	base: 'min-w-0 flex-1 appearance-none border border-neutral-muted bg-surface-raised px-lg text-neutral outline-none ring-0 transition-[color,background-color,border-color,box-shadow] rounded-md autofill:text-neutral focus-within:ring-2 focus-within:ring-focus/50',
	variants: {
		size: {
			small: 'h-control-sm text-xs placeholder:text-xs',
			normal: 'h-control-md text-sm placeholder:text-sm',
			large: 'h-control-lg text-sm placeholder:text-sm'
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

const defaultRemoveButton = cva({
	base: 'state-layer flex shrink-0 items-center justify-center bg-transparent text-neutral/70 outline-none transition-[color,background-color,box-shadow] rounded-md hover:text-danger-readable focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'h-control-sm w-[var(--control-height-sm)]',
			normal: 'h-control-md w-[var(--control-height-md)]',
			large: 'h-control-lg w-[var(--control-height-lg)]'
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

const defaultAddButton = cva({
	base: 'state-layer flex w-full items-center justify-center gap-sm border border-dashed border-neutral-muted bg-transparent px-lg text-neutral/70 outline-none transition-[color,background-color,border-color,box-shadow] rounded-md hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		size: {
			small: 'py-sm text-xs',
			normal: 'py-md text-sm',
			large: 'py-md text-base'
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

export const keyValueInputTheme = {
	inputContainer: defaultInputContainer,
	row: defaultRow,
	input: defaultInput,
	removeButton: defaultRemoveButton,
	addButton: defaultAddButton
};

export type KeyValueInputTheme = typeof keyValueInputTheme;
export type KeyValueInputThemeProps = InferComponentTheme<KeyValueInputTheme>;
export const setKeyValueInputTheme = setComponentTheme<KeyValueInputTheme>('keyValueInput');
export const useKeyValueInputTheme = useComponentTheme('keyValueInput', keyValueInputTheme);
