import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';
import { motion, useComponentMotion } from '$lib/utils/motion/index.js';

const defaultRoot = cva({
	base: 'inline-flex min-w-0 items-center align-middle',
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

// `--spinner-size` is INTERNAL — Spinner's own property, set here so the inline indicator
// tracks the text size. Consumers change `size`, not the property.
const defaultSpinner = cva({
	base: 'inline-flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: '[&_[data-slot=spinner-indicator]]:[--spinner-size:0.75rem]',
			normal: '[&_[data-slot=spinner-indicator]]:[--spinner-size:1rem]',
			large: '[&_[data-slot=spinner-indicator]]:[--spinner-size:1.25rem]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultViewport = cva({
	base: 'relative isolate grid min-w-0 overflow-hidden',
	variants: {
		size: {
			small: 'h-4 text-xs leading-4',
			normal: 'h-5 text-sm leading-5',
			large: 'h-6 text-base leading-6'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultSizer = cva({
	base: 'invisible col-start-1 row-start-1 grid pointer-events-none select-none'
});

const defaultSizerItem = cva({
	base: 'col-start-1 row-start-1 whitespace-nowrap'
});

const defaultMessage = cva({
	base: 'col-start-1 row-start-1 whitespace-nowrap will-change-[transform,opacity,clip-path]',
	variants: {
		shimmer: {
			true: 'shimmer',
			false: null
		}
	},
	defaultVariants: {
		shimmer: false
	}
});

// Text swaps are slower than a normal enter/exit so the eye can follow the word: the
// vertical slide runs on `slow`, the longer wipe on `slower`. Only `duration` /
// `easing` are read — the geometry lives in `spinnerText.transition.ts`.
export const defaultSpinnerTextMotion = motion({
	base: {
		in: {},
		out: {},
		duration: 'slow',
		easing: 'standard'
	},
	variants: {
		mode: {
			vertical: {},
			reveal: { duration: 'slower' }
		}
	},
	defaultVariants: {
		mode: 'vertical'
	}
});

export const spinnerTextTheme = {
	motion: defaultSpinnerTextMotion,
	root: defaultRoot,
	spinner: defaultSpinner,
	viewport: defaultViewport,
	sizer: defaultSizer,
	sizerItem: defaultSizerItem,
	message: defaultMessage
};

export type SpinnerTextTheme = typeof spinnerTextTheme;
export type SpinnerTextThemeProps = InferComponentTheme<SpinnerTextTheme>;
export const setSpinnerTextTheme = setComponentTheme<SpinnerTextTheme>('spinnerText');
export const useSpinnerTextTheme = useComponentTheme<SpinnerTextTheme>(
	'spinnerText',
	spinnerTextTheme
);
export const useSpinnerTextMotion = () =>
	useComponentMotion('spinnerText', defaultSpinnerTextMotion);
