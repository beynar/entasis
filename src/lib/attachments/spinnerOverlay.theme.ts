import { cva, setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultSpinnerOverlay = cva({
	base: 'absolute overflow-hidden flex gap-sm flex-col items-center justify-center backdrop-blur-[10px] z-10 w-full h-full rounded-[inherit] inset-0 bg-surface/85'
});

const defaultSpinnerOverlaySpinner = cva({
	base: 'order-2',
	variants: {
		size: {
			small: 'w-4 h-4',
			normal: 'w-5 h-5',
			large: 'w-6 h-6'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral-readable',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral'
	}
});

const defaultSpinnerOverlayText = cva({
	base: 'order-1 rounded-md bg-surface px-sm py-xs text-sm',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral-readable',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral'
	}
});

export const spinnerOverlayTheme = {
	overlay: defaultSpinnerOverlay,
	spinner: defaultSpinnerOverlaySpinner,
	text: defaultSpinnerOverlayText
};

export const setSpinnerOverlayTheme =
	setComponentTheme<typeof spinnerOverlayTheme>('spinnerOverlay');
export const useSpinnerOverlayTheme = useComponentTheme('spinnerOverlay', spinnerOverlayTheme);
