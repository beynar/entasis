import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

// The Form lays itself out against its OWN width, not the viewport: the root is an inline-size
// container and every breakpoint inside the form (group columns, the action row) is a container
// query, so a form in a 400px drawer stacks even on a 27" screen.
const defaultForm = cva({
	base: `@container grid gap-y-xl gap-x-md grid-cols-2 [&>*:not(.col-span-1)]:col-span-2`,
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
			compact: `gap-lg`,
			normal: `gap-xl`,
			comfortable: `gap-layout-md`
		}
	},
	defaultVariants: {
		variant: 'plain',
		layout: 'vertical',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'card', density: 'compact', class: 'px-lg' },
		{ variant: 'card', density: 'normal', class: 'px-xl' },
		{ variant: 'card', density: 'comfortable', class: 'px-layout-md' }
	]
});

const defaultFormHeader = cva({
	base: 'flex flex-col',
	variants: {
		variant: {
			plain: '',
			sectioned: 'border-b border-neutral-muted',
			card: ''
		},
		density: {
			compact: 'gap-micro',
			normal: 'gap-xs',
			comfortable: 'gap-sm'
		}
	},
	defaultVariants: {
		variant: 'plain',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'sectioned', density: 'compact', class: 'pb-lg' },
		{ variant: 'sectioned', density: 'normal', class: 'pb-xl' },
		{ variant: 'sectioned', density: 'comfortable', class: 'pb-layout-md' },
		{ variant: 'card', density: 'compact', class: '-mx-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl' },
		{ variant: 'card', density: 'comfortable', class: '-mx-layout-md' }
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
			plain: 'text-neutral/70',
			sectioned: 'text-neutral/70',
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
			compact: '',
			normal: '',
			comfortable: ''
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
	base: 'mt-xs text-neutral/70',
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
		// Column counts are container queries against the Form root: a field column needs roughly
		// 20rem to hold a labelled control, so 2 columns wait for `@2xl` (42rem), 3 for `@4xl`
		// (56rem) and 4 for `@6xl` (72rem), stepping through 2 columns on the way up.
		columns: {
			1: 'grid-cols-1',
			2: '@2xl:grid-cols-2',
			3: '@2xl:grid-cols-2 @4xl:grid-cols-3',
			4: '@2xl:grid-cols-2 @6xl:grid-cols-4'
		},
		density: {
			compact: 'mt-md gap-xs',
			normal: 'mt-lg gap-md',
			comfortable: 'mt-xl gap-lg'
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
			compact: '',
			normal: '',
			comfortable: ''
		}
	},
	defaultVariants: {
		variant: 'sectioned',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'sectioned', density: 'compact', class: 'pt-lg' },
		{ variant: 'sectioned', density: 'normal', class: 'pt-xl' },
		{ variant: 'sectioned', density: 'comfortable', class: 'pt-layout-md' },
		{ variant: 'card', density: 'compact', class: '-mx-lg px-lg pt-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl px-xl pt-xl' },
		{ variant: 'card', density: 'comfortable', class: '-mx-layout-md px-layout-md pt-layout-md' }
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
			compact: 'gap-xs',
			normal: 'gap-md',
			comfortable: 'gap-lg'
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
			plain: '',
			sectioned: 'border-t border-neutral-muted',
			card: ''
		},
		density: {
			compact: '',
			normal: '',
			comfortable: ''
		}
	},
	defaultVariants: {
		variant: 'plain',
		density: 'normal'
	},
	compoundVariants: [
		{ variant: 'sectioned', density: 'compact', class: 'pt-lg' },
		{ variant: 'sectioned', density: 'normal', class: 'pt-xl' },
		{ variant: 'sectioned', density: 'comfortable', class: 'pt-layout-md' },
		{ variant: 'card', density: 'compact', class: '-mx-lg' },
		{ variant: 'card', density: 'normal', class: '-mx-xl' },
		{ variant: 'card', density: 'comfortable', class: '-mx-layout-md' }
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
