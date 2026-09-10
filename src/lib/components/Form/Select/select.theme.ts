import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInput = cva({
	base: "outline-none flex h-full w-full flex-1 cursor-pointer items-center justify-between gap-sm bg-transparent text-left leading-normal select-none before:absolute before:inset-0 before:content-['']",
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
	base: 'relative flex w-full items-center border border-neutral-muted bg-surface-raised px-lg text-neutral ring-0 transition-all rounded-md outline-none focus-within:ring-2 focus-within:ring-primary/50',
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

const defaultValue = cva({
	base: 'line-clamp-1 flex-1 text-left',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		},
		placeholder: {
			true: 'text-neutral/60',
			false: 'text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal',
		placeholder: false
	}
});

const defaultTriggerIcon = cva({
	base: 'text-neutral/60 pointer-events-none shrink-0',
	variants: {
		size: {
			small: 'size-icon-sm',
			normal: 'size-icon-md',
			large: 'size-icon-lg'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultContent = cva({
	base: 'flex flex-col',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultGroup = cva({
	base: 'flex scroll-my-1 flex-col p-xs',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultGroupLabel = cva({
	base: 'text-neutral/60',
	variants: {
		size: {
			small: 'px-sm py-xs text-[0.6875rem]',
			normal: 'px-sm py-xs text-xs',
			large: 'px-sm py-xs text-xs'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultSeparator = cva({
	// Flush: the separator sits directly in the scroll content with no padding to
	// bleed into, so a negative margin would overflow the viewport and trigger a spurious X bar.
	base: 'bg-neutral-muted my-xs h-px',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

export const selectTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer,
	value: defaultValue,
	triggerIcon: defaultTriggerIcon,
	content: defaultContent,
	group: defaultGroup,
	groupLabel: defaultGroupLabel,
	separator: defaultSeparator
};

export type SelectTheme = typeof selectTheme;
export type SelectThemeProps = InferComponentTheme<SelectTheme>;
export const setSelectTheme = setComponentTheme<SelectTheme>('select');
export const useSelectTheme = useComponentTheme('select', selectTheme);
