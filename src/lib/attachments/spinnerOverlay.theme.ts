import { cva, setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultSpinnerOverlay = cva({
	base: 'absolute overflow-hidden flex gap-sm flex-col items-center justify-center backdrop-blur-[10px] z-10 w-full h-full rounded-[inherit] inset-0 bg-color/20 '
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
	base: 'text-sm order-1',
	variants: {
		size: {
			small: 'text-sm',
			normal: 'text-base',
			large: 'text-lg'
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
