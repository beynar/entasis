import {
	cva,
	setComponentTheme,
	type InferComponentTheme,
	useComponentTheme
} from '$lib/utils/cva/index.js';

// A Field lays itself out against its OWN width, not the viewport: the `left` (horizontal)
// label layout turns the root into an inline-size container and every breakpoint below is a
// container query, so a narrow Field on a wide screen still stacks its label above the control.
// `@lg:` = 32rem of field width — the label track is `minmax(8rem, 0.4fr)`, so at 32rem the
// control still gets ~19rem, the narrowest width at which a text input, a select or a date
// control reads as a real control rather than a squeezed box. Below that the two-column grid
// collapses: every part spans both tracks (`col-start-1 col-end-3`) and stacks in source order.
// `top` never queries anything, so it never pays for containment.
const defaultField = cva({
	base: 'grid min-w-0',
	variants: {
		density: {
			compact: 'gap-xs [&>legend]:mb-xs',
			normal: 'gap-md [&>legend]:mb-md',
			comfortable: 'gap-lg [&>legend]:mb-lg'
		},
		labelPosition: {
			top: 'grid-cols-1',
			left: '@container grid-cols-[minmax(8rem,0.4fr)_minmax(0,1fr)] gap-x-layout-md'
		},
		hasError: {
			true: 'text-danger-readable',
			false: ''
		}
	},
	defaultVariants: {
		density: 'normal',
		labelPosition: 'top'
	}
});

const defaultFieldHeader = cva({
	base: 'relative flex items-center gap-md',
	variants: {
		labelPosition: {
			top: '',
			left: 'col-start-1 col-end-3 @lg:col-end-2 @lg:row-start-1 @lg:self-start @lg:pt-md'
		},
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		},
		required: {
			false: ''
		},
		hasError: {
			true: 'text-danger-readable',
			false: ''
		}
	}
});

const defaultFieldLabel = cva({
	base: 'text-neutral text-sm',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		hasError: {
			true: 'text-danger-readable',
			false: ''
		},
		required: {
			true: 'relative before:content-["*"] before:text-danger-readable before:text-sm before:font-bold before:absolute before:-right-2 before:top-0',
			false: ''
		}
	}
});

const defaultFieldActions = cva({
	base: 'flex items-start gap-md',
	variants: {
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	}
});

const defaultFieldErrorsContainer = cva({
	base: 'grid gap-xs',
	variants: {
		labelPosition: {
			top: '',
			left: 'col-start-1 col-end-3 @lg:col-start-2'
		},
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultFieldError = cva({
	base: 'text-danger-readable text-xs leading-3',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultFieldInputContainer = cva({
	base: 'flex w-full flex-1 items-center justify-between gap-md',
	variants: {
		labelPosition: {
			top: '',
			left: 'col-start-1 col-end-3 @lg:col-start-2 @lg:row-start-1 @lg:self-center'
		},
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		},
		hasError: {
			true: '!ring-danger rounded-md !ring-2 ring-offset-2',
			false: ''
		}
	}
});

const defaultFieldPrefix = cva({
	base: 'flex items-center gap-md',
	variants: {
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	}
});

const defaultFieldSuffix = cva({
	base: 'flex items-center gap-md',
	variants: {
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	}
});

const defaultFieldActionButton = cva({
	base: 'h-auto min-h-0 w-auto self-stretch rounded-none border-0 bg-clip-border !px-0 active:translate-y-0',
	variants: {
		size: {
			small: '[&_svg:not([class*=size-])]:size-icon-sm',
			normal: '[&_svg:not([class*=size-])]:size-icon-md',
			large: '[&_svg:not([class*=size-])]:size-icon-lg'
		},
		edge: {
			start: '-ml-lg mr-xs',
			end: 'ml-xs -mr-lg',
			none: 'mx-0'
		},
		active: {
			true: 'text-primary-readable',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		edge: 'end',
		active: false
	}
});

const defaultFieldFooter = cva({
	base: 'flex items-start justify-between gap-md',
	variants: {
		labelPosition: {
			top: '',
			left: 'col-start-1 col-end-3 @lg:col-start-2'
		},
		density: {
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
		}
	}
});

const defaultFieldDescription = cva({
	base: 'text-neutral/70 text-xs leading-3 flex-1',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultFieldHelper = cva({
	base: 'text-neutral/70 text-xs leading-3',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

export const fieldTheme = {
	root: defaultField,
	header: defaultFieldHeader,
	label: defaultFieldLabel,
	actions: defaultFieldActions,
	errorsContainer: defaultFieldErrorsContainer,
	error: defaultFieldError,
	inputContainer: defaultFieldInputContainer,
	prefix: defaultFieldPrefix,
	suffix: defaultFieldSuffix,
	actionButton: defaultFieldActionButton,
	footer: defaultFieldFooter,
	description: defaultFieldDescription,
	helper: defaultFieldHelper
};

export type FieldTheme = typeof fieldTheme;
export type FieldThemeProps = InferComponentTheme<FieldTheme>;

export const setFieldTheme = setComponentTheme<FieldTheme>('field');
export const useFieldTheme = useComponentTheme<FieldTheme>('field', fieldTheme);
