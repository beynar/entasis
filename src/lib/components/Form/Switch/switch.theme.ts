import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultSwitchToggle = cva({
	base: 'relative inline-flex shrink-0 cursor-pointer items-center rounded-full border p-micro transition-colors duration-normal ease-standard outline-none focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-not-allowed disabled:opacity-50',
	variants: {
		checked: {
			true: 'bg-selected border-selected',
			false: 'bg-neutral-muted border-neutral-muted'
		},
		size: {
			small: 'h-5 w-9',
			normal: 'h-6 w-11',
			large: 'h-7 w-12'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		checked: false,
		disabled: false
	}
});

const defaultSwitchThumb = cva({
	base: 'pointer-events-none block rounded-full bg-surface-floating lift-1 ring-0 transition-transform duration-normal ease-standard',
	variants: {
		checked: {
			true: '',
			false: 'translate-x-0'
		},
		size: {
			small: 'size-4',
			normal: 'size-5',
			large: 'size-6'
		}
	},
	compoundVariants: [
		{
			size: 'small',
			checked: true,
			class: 'translate-x-4'
		},
		{
			size: 'normal',
			checked: true,
			class: 'translate-x-5'
		},
		{
			size: 'large',
			checked: true,
			class: 'translate-x-5'
		}
	],
	defaultVariants: {
		size: 'normal',
		checked: false
	}
});

const defaultSwitchContainer = cva({
	base: 'flex items-center justify-start select-none px-0',
	variants: {
		size: {
			small: 'gap-md',
			normal: 'gap-xl',
			large: 'gap-xl'
		},
		// The toggle carries the disabled dimming; the row stays opaque so it applies once.
		disabled: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const switchTheme = {
	toggle: defaultSwitchToggle,
	thumb: defaultSwitchThumb,
	inputContainer: defaultSwitchContainer
};

export type SwitchTheme = typeof switchTheme;
export type SwitchThemeProps = InferComponentTheme<SwitchTheme>;
export const setSwitchTheme = setComponentTheme<SwitchTheme>('switch');
export const useSwitchTheme = useComponentTheme('switch', switchTheme);
