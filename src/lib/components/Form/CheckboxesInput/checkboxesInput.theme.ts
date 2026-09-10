import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultCheckboxesInput = cva({
	base: 'grid gap-lg ',
	variants: {
		mode: {
			card: '',
			normal: '',
			control: 'inline-flex'
		}
	}
});

const defaultCheckboxesInputItem = cva({
	base: 'relative grid w-full cursor-pointer items-start gap-xs rounded-md pl-layout-xl text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-color/50',
	variants: {
		mode: {
			card: 'raised bg-surface-raised py-md',
			normal: 'py-xs',
			control: '!inline-grid !min-h-0 !grid-cols-1 !place-items-center !gap-0 !p-0 !pl-0'
		},
		size: {
			small: 'min-h-8',
			normal: 'min-h-10',
			large: 'min-h-11'
		},
		checked: {
			true: '',
			false: ''
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	},
	compoundVariants: [
		{
			mode: 'card',
			checked: true,
			class: 'ring-2 ring-color bg-color-muted text-color-muted-readable'
		},
		{
			mode: 'control',
			size: 'small',
			class: '!size-4 !w-4'
		},
		{
			mode: 'control',
			size: 'normal',
			class: '!size-5 !w-5'
		},
		{
			mode: 'control',
			size: 'large',
			class: '!size-6 !w-6'
		}
	]
});

const defaultCheckboxesInputItemLabel = cva({
	base: 'flex items-center gap-xl flex-wrap',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultCheckboxesInputItemTrack = cva({
	base: 'origin-center content-[""] bg-surface-raised border border-neutral-muted rounded-sm absolute left-2',
	variants: {
		checked: {
			true: '',
			false: ''
		},
		size: {
			small: 'size-4',
			normal: 'size-5',
			large: 'size-6'
		},
		mode: {
			card: 'top-2',
			normal: 'top-1',
			control: '!static col-start-1 row-start-1'
		},
		disabled: {
			true: 'opacity-50',
			false: ''
		}
	}
});

const defaultCheckboxesInputItemThumb = cva({
	base: `origin-center radio bg-neutral rounded-sm flex items-center justify-center transition-all content-[""] absolute left-2 scale-[85%] opacity-0
	stroke-color-contrast [&>svg]:fill-color-contrast p-xs
	`,
	variants: {
		checked: {
			true: 'bg-color scale-[100%] opacity-100',
			false: ''
		},
		size: {
			small: 'size-4',
			normal: 'size-5',
			large: 'size-6'
		},
		mode: {
			card: 'top-2',
			normal: 'top-1',
			control: '!static col-start-1 row-start-1'
		},
		disabled: {
			true: 'opacity-50',
			false: ''
		}
	}
});

const defaultCheckboxesInputItemIcon = cva({
	base: ''
});

const defaultCheckboxesInputItemDescription = cva({
	base: 'text-xs text-neutral/60',
	variants: {
		mode: {
			card: '',
			normal: '',
			control: ''
		},
		checked: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{
			mode: 'card',
			checked: true,
			class: 'text-color-muted-readable/70'
		}
	]
});

const defaultCheckboxesInputContainer = cva({
	base: 'grid gap-lg grid-cols-1 items-start',
	variants: {
		mode: {
			card: '',
			normal: '',
			control: '!inline-flex !w-auto !flex-none'
		},
		disabled: {
			true: 'opacity-50',
			false: ''
		}
	}
});

export const checkboxesInputTheme = {
	root: defaultCheckboxesInput,
	checkboxesInputItem: defaultCheckboxesInputItem,
	checkboxesInputItemLabel: defaultCheckboxesInputItemLabel,
	checkboxesInputItemTrack: defaultCheckboxesInputItemTrack,
	checkboxesInputItemThumb: defaultCheckboxesInputItemThumb,
	checkboxesInputItemIcon: defaultCheckboxesInputItemIcon,
	checkboxesInputItemDescription: defaultCheckboxesInputItemDescription,
	checkboxesInputContainer: defaultCheckboxesInputContainer
};

export type CheckboxesInputTheme = typeof checkboxesInputTheme;
export type CheckboxesInputThemeProps = InferComponentTheme<CheckboxesInputTheme>;
export const setCheckboxesInputTheme = setComponentTheme<CheckboxesInputTheme>('checkboxes-input');
export const useCheckboxesInputTheme = useComponentTheme<CheckboxesInputTheme>(
	'checkboxes-input',
	checkboxesInputTheme
);
