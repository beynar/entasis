import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';
import { selectedSolid } from '$lib/components/Theme/theme.recipes.js';

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

const defaultCountryTrigger = cva({
	base: '-ml-lg mr-md inline-flex h-auto shrink-0 self-stretch rounded-none border-0 bg-clip-border px-lg text-neutral focus-visible:ring-0 focus-visible:text-primary-readable active:translate-y-0 active:bg-transparent',
	variants: {
		size: {
			small: 'gap-xs text-xs',
			normal: 'gap-sm text-sm',
			large: 'gap-sm text-sm'
		},
		open: {
			true: 'text-primary-readable',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		open: false
	}
});

const defaultCountryFlag = cva({
	base: 'inline-flex shrink-0 items-center justify-center leading-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountryDialCode = cva({
	base: 'font-medium tabular-nums',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountryChevron = cva({
	base: 'text-neutral/70 size-3 shrink-0 transition-transform',
	variants: {
		open: {
			true: 'rotate-180 text-primary-readable',
			false: ''
		}
	},
	defaultVariants: {
		open: false
	}
});

const defaultPopover = cva({
	base: 'w-[22rem] max-w-[calc(100vw-2rem)] p-0'
});

const defaultCountryPicker = cva({
	base: 'flex max-h-[calc(100vh-8rem)] flex-col gap-md overflow-hidden p-md'
});

const defaultCountrySearch = cva({
	base: 'w-full'
});

const defaultCountrySearchInputContainer = cva({
	base: 'bg-surface-canvas',
	variants: {
		size: {
			small: 'py-xs',
			normal: 'py-xs',
			large: 'py-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountrySearchInput = cva({
	base: 'placeholder:text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountryList = cva({
	base: 'h-72 max-h-[calc(100vh-14rem)] min-h-0 overflow-hidden'
});

const defaultCountryListbox = cva({
	base: 'flex min-w-full flex-col gap-xs'
});

const defaultCountryOption = cva({
	base: 'w-full justify-start gap-md rounded-sm border-0 bg-clip-border px-md text-left font-normal shadow-none outline-none focus-visible:ring-0 active:translate-y-0',
	variants: {
		size: {
			small: 'min-h-row-sm py-xs text-xs',
			normal: 'min-h-row-sm py-xs text-sm',
			large: 'min-h-row-md py-sm text-sm'
		},
		highlighted: {
			true: '',
			false: ''
		},
		selected: {
			true: selectedSolid,
			false: 'text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal',
		highlighted: false,
		selected: false
	}
});

const defaultCountryName = cva({
	base: 'min-w-0 flex-1 truncate',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountryOptionDialCode = cva({
	base: 'text-neutral/70 ml-auto tabular-nums',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCountryCheck = cva({
	base: 'size-4 shrink-0'
});

const defaultCountryEmpty = cva({
	base: 'text-neutral/70 px-md py-layout-md text-center',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const phoneInputTheme = {
	input: defaultInput,
	inputContainer: defaultInputContainer,
	countryTrigger: defaultCountryTrigger,
	countryFlag: defaultCountryFlag,
	countryDialCode: defaultCountryDialCode,
	countryChevron: defaultCountryChevron,
	popover: defaultPopover,
	countryPicker: defaultCountryPicker,
	countrySearch: defaultCountrySearch,
	countrySearchInputContainer: defaultCountrySearchInputContainer,
	countrySearchInput: defaultCountrySearchInput,
	countryList: defaultCountryList,
	countryListbox: defaultCountryListbox,
	countryOption: defaultCountryOption,
	countryName: defaultCountryName,
	countryOptionDialCode: defaultCountryOptionDialCode,
	countryCheck: defaultCountryCheck,
	countryEmpty: defaultCountryEmpty
};

export type PhoneInputTheme = typeof phoneInputTheme;
export type PhoneInputThemeProps = InferComponentTheme<PhoneInputTheme>;
export const setPhoneInputTheme = setComponentTheme<PhoneInputTheme>('phoneInput');
export const usePhoneInputTheme = useComponentTheme('phoneInput', phoneInputTheme);
