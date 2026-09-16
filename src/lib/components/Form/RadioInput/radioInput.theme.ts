import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultRadioInput = cva({
	base: '',
	variants: {
		mode: {
			card: '',
			normal: ''
		}
	}
});

const defaultRadioInputItem = cva({
	base: 'relative grid w-full cursor-pointer items-start gap-xs rounded-md text-left transition-[color,background-color,box-shadow,opacity] outline-none focus-visible:ring-2 focus-visible:ring-focus/50',
	variants: {
		mode: {
			card: 'raised bg-surface-raised py-md pl-layout-lg',
			normal: 'py-xs pl-layout-xl'
		},
		size: {
			small: 'min-h-row-sm',
			normal: 'min-h-row-md',
			large: 'min-h-row-lg'
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
			class: 'ring-2 ring-selected bg-selected-muted text-selected-muted-readable'
		}
	]
});

const defaultRadioInputItemLabel = cva({
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

const defaultRadioInputItemTrack = cva({
	base: 'origin-center content-[""] bg-surface-raised border border-neutral-muted rounded-full absolute left-2',
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
			card: 'top-3',
			normal: 'top-1'
		},
		disabled: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{
			mode: 'card',
			size: 'small',
			class: 'size-3.5'
		},
		{
			mode: 'card',
			size: 'normal',
			class: 'size-4'
		},
		{
			mode: 'card',
			size: 'large',
			class: 'size-5'
		}
	]
});

const defaultRadioInputItemThumb = cva({
	base: 'origin-center radio rounded-full transition-[background-color,opacity,scale] content-[""] absolute left-2 scale-[40%] opacity-0',
	variants: {
		checked: {
			true: 'bg-selected scale-[60%] opacity-100',
			false: ''
		},
		size: {
			small: 'size-4',
			normal: 'size-5',
			large: 'size-6'
		},
		mode: {
			card: 'top-3',
			normal: 'top-1'
		},
		disabled: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{
			mode: 'card',
			size: 'small',
			class: 'size-3.5'
		},
		{
			mode: 'card',
			size: 'normal',
			class: 'size-4'
		},
		{
			mode: 'card',
			size: 'large',
			class: 'size-5'
		}
	]
});

const defaultRadioInputItemIcon = cva({
	base: ''
});

const defaultRadioInputItemDescription = cva({
	base: 'text-xs text-neutral/70',
	variants: {
		mode: {
			card: '',
			normal: ''
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
			class: 'text-selected-muted-readable'
		}
	]
});

const defaultRadioInputContainer = cva({
	base: 'grid gap-lg grid-cols-1 items-start',
	variants: {
		mode: {
			card: '',
			normal: ''
		},
		disabled: {
			true: '',
			false: ''
		}
	}
});

export const radioInputTheme = {
	root: defaultRadioInput,
	radiosInputItem: defaultRadioInputItem,
	radiosInputItemLabel: defaultRadioInputItemLabel,
	radiosInputItemTrack: defaultRadioInputItemTrack,
	radiosInputItemThumb: defaultRadioInputItemThumb,
	radiosInputItemIcon: defaultRadioInputItemIcon,
	radiosInputItemDescription: defaultRadioInputItemDescription,
	radiosInputContainer: defaultRadioInputContainer
};

export type RadioInputTheme = typeof radioInputTheme;
export type RadioInputThemeProps = InferComponentTheme<RadioInputTheme>;
export const setRadioInputTheme = setComponentTheme<RadioInputTheme>('radio-input');
export const useRadioInputTheme = useComponentTheme<RadioInputTheme>(
	'radio-input',
	radioInputTheme
);
