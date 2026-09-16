import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultContainer = cva({
	base: 'inline-flex items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-focus/50 transition-[box-shadow,opacity]',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultStar = cva({
	base: 'relative inline-flex shrink-0 items-center justify-center',
	variants: {
		size: {
			small: 'size-5',
			normal: 'size-6',
			large: 'size-7'
		},
		interactive: {
			true: 'cursor-pointer',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		interactive: false
	}
});

const defaultStarBase = cva({
	base: 'absolute inset-0 text-neutral/45'
});

const defaultStarFill = cva({
	base: 'absolute inset-y-0 overflow-hidden',
	variants: {
		color: {
			primary: 'text-primary-readable',
			secondary: 'text-secondary-readable',
			neutral: 'text-neutral',
			danger: 'text-danger-readable',
			success: 'text-success-readable',
			warning: 'text-warning-readable',
			info: 'text-info-readable'
		}
	},
	defaultVariants: {
		color: 'warning'
	}
});

export const ratingTheme = {
	container: defaultContainer,
	star: defaultStar,
	starBase: defaultStarBase,
	starFill: defaultStarFill
};

export type RatingTheme = typeof ratingTheme;
export type RatingThemeProps = InferComponentTheme<RatingTheme>;
export const setRatingTheme = setComponentTheme<RatingTheme>('rating');
export const useRatingTheme = useComponentTheme('rating', ratingTheme);
