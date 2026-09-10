import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultForm = cva({
	base: `grid gap-y-xl gap-x-md grid-cols-2 [&>*:not(.col-span-1)]:col-span-2`,
	variants: {
		variant: {
			plain: '',
			sectioned: '',
			card: ''
		},
		layout: {
			vertical: '',
			horizontal: 'grid-cols-1 [&>*]:!col-span-1'
		},
		density: {
			small: `gap-lg`,
			normal: `gap-xl`,
			large: `gap-layout-md`
		}
	},
	defaultVariants: {
		variant: 'plain',
		layout: 'vertical',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'card', density: 'small', class: 'px-lg' },
		{ variant: 'card', density: 'normal', class: 'px-xl' },
		{ variant: 'card', density: 'large', class: 'px-layout-md' }
	]
});

const defaultFormHeader = cva({
	base: 'flex flex-col',
	variants: {
		variant: {
			plain: 'px-0',
			sectioned: 'px-0',
			card: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		variant: 'plain',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'card', density: 'small', class: '-mx-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl' },
		{ variant: 'card', density: 'large', class: '-mx-layout-md' }
	]
});

const defaultFormTitle = cva({
	base: '',
	variants: {
		variant: {
			plain: 'text-neutral',
			sectioned: 'text-neutral',
			card: ''
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		variant: 'plain',
		size: 'normal'
	}
});

const defaultFormDescription = cva({
	base: '',
	variants: {
		variant: {
			plain: 'text-neutral/60',
			sectioned: 'text-neutral/60',
			card: ''
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		variant: 'plain',
		size: 'normal'
	}
});

const defaultFormGroup = cva({
	base: 'm-0 min-w-0 border-0 bg-transparent p-0',
	variants: {
		density: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultFormGroupLabel = cva({
	base: 'text-neutral',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultFormGroupDescription = cva({
	base: 'mt-xs text-neutral/60',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultFormGroupFields = cva({
	base: 'grid grid-cols-1',
	variants: {
		layout: {
			vertical: '',
			horizontal: ''
		},
		columns: {
			1: 'md:grid-cols-1',
			2: 'md:grid-cols-2',
			3: 'md:grid-cols-3',
			4: 'md:grid-cols-4'
		},
		density: {
			small: 'mt-md gap-xs',
			normal: 'mt-lg gap-md',
			large: 'mt-xl gap-lg'
		}
	},
	defaultVariants: {
		layout: 'vertical',
		columns: 2,
		density: 'normal'
	}
});

const defaultFormItem = cva({
	base: 'border-t border-neutral-muted',
	variants: {
		variant: {
			sectioned: '',
			card: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		variant: 'sectioned',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'sectioned', density: 'small', class: 'pt-lg' },
		{ variant: 'sectioned', density: 'normal', class: 'pt-xl' },
		{ variant: 'sectioned', density: 'large', class: 'pt-layout-md' },
		{ variant: 'card', density: 'small', class: '-mx-lg px-lg pt-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl px-xl pt-xl' },
		{ variant: 'card', density: 'large', class: '-mx-layout-md px-layout-md pt-layout-md' }
	]
});

const defaultFormActions = cva({
	base: 'flex w-full flex-wrap',
	variants: {
		alignment: {
			start: 'justify-start',
			end: 'justify-end'
		},
		density: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	},
	defaultVariants: {
		alignment: 'end'
	}
});

const defaultFormAction = cva({
	base: 'min-w-0'
});

const defaultFormCustom = cva({
	base: 'min-w-0'
});

const defaultFormFooter = cva({
	base: 'grid',
	variants: {
		variant: {
			plain: 'px-0',
			sectioned: 'px-0',
			card: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		variant: 'plain',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'card', density: 'small', class: '-mx-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl' },
		{ variant: 'card', density: 'large', class: '-mx-layout-md' }
	]
});

export const formTheme = {
	root: defaultForm,
	formHeader: defaultFormHeader,
	formTitle: defaultFormTitle,
	formDescription: defaultFormDescription,
	formGroup: defaultFormGroup,
	formGroupLabel: defaultFormGroupLabel,
	formGroupDescription: defaultFormGroupDescription,
	formGroupFields: defaultFormGroupFields,
	formItem: defaultFormItem,
	formAction: defaultFormAction,
	formActions: defaultFormActions,
	formCustom: defaultFormCustom,
	formFooter: defaultFormFooter
};

export type FormTheme = typeof formTheme;
export type FormThemeProps = InferComponentTheme<FormTheme>;
export const setFormTheme = setComponentTheme<FormTheme>('form');
export const useFormTheme = useComponentTheme<FormTheme>('form', formTheme);
