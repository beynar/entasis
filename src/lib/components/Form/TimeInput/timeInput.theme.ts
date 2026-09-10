import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInput = cva({
	base: 'outline-none flex-1 w-full min-w-0 h-full bg-transparent resize-none placeholder:text-neutral/60 autofill:text-neutral appearance-none text-sm leading-normal',
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
		size: 'normal'
	}
});

const defaultPopover = cva({
	base: 'w-48 max-w-[calc(100vw-2rem)]'
});

const defaultPicker = cva({
	base: 'grid w-full grid-cols-2 gap-md'
});

const defaultPickerColumn = cva({
	base: 'min-w-0'
});

const defaultPickerLabel = cva({
	base: 'text-neutral/60 px-sm pb-xs font-medium',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultPickerScrollArea = cva({
	base: 'flex max-h-44 flex-col'
});

const defaultPickerOption = cva({
	base: 'state-layer w-full rounded-md font-mono text-center tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/50',
	variants: {
		size: {
			small: 'px-sm py-xs text-xs',
			normal: 'px-md py-xs text-sm',
			large: 'px-md py-sm text-sm'
		},
		selected: {
			true: 'bg-primary text-primary-contrast',
			false: 'text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal',
		selected: false
	}
});

export const timeInputTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer,
	popover: defaultPopover,
	picker: defaultPicker,
	pickerColumn: defaultPickerColumn,
	pickerLabel: defaultPickerLabel,
	pickerScrollArea: defaultPickerScrollArea,
	pickerOption: defaultPickerOption
};

export type TimeInputTheme = typeof timeInputTheme;
export type TimeInputThemeProps = InferComponentTheme<TimeInputTheme>;
export const setTimeInputTheme = setComponentTheme<TimeInputTheme>('timeInput');
export const useTimeInputTheme = useComponentTheme('timeInput', timeInputTheme);
