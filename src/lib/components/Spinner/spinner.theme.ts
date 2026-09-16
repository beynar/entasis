import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultSpinner = cva({
	base: 'inline-flex w-fit shrink-0 items-center justify-center align-middle',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-sm',
			large: 'gap-md'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable',
			neutral: 'text-neutral'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral'
	}
});

// `--spinner-size` is INTERNAL: the indicator publishes its resolved diameter for `.ui-spinner`
// and the dot/bar variants. It follows the `size` prop, which is the public way to change it.
const defaultSpinnerIndicator = cva({
	base: 'relative box-border shrink-0',
	variants: {
		size: {
			small: '[--spinner-size:1rem]',
			normal: '[--spinner-size:1.25rem]',
			large: '[--spinner-size:1.5rem]'
		},
		variant: {
			default: 'ui-spinner',
			grid: 'grid grid-cols-3 place-items-center',
			pulse: 'flex items-center justify-center gap-[calc(var(--spinner-size)*0.1)]',
			puff: 'block',
			lines: 'block',
			circles: 'block'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'default'
	}
});

const defaultSpinnerLabel = cva({
	base: 'text-neutral/70',
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

export const spinnerTheme = {
	root: defaultSpinner,
	indicator: defaultSpinnerIndicator,
	label: defaultSpinnerLabel
};

export type SpinnerTheme = typeof spinnerTheme;
export type SpinnerThemeProps = InferComponentTheme<SpinnerTheme>;
export const setSpinnerTheme = setComponentTheme<SpinnerTheme>('spinner');
export const useSpinnerTheme = useComponentTheme<SpinnerTheme>('spinner', spinnerTheme);
