import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultSkeleton = cva({
	base: 'animate-pulse rounded-sm',
	variants: {
		color: {
			primary: 'bg-primary-light/10',
			secondary: 'bg-secondary-light/10',
			danger: 'bg-danger-light/10',
			success: 'bg-success-light/10',
			warning: 'bg-warning-light/10',
			info: 'bg-info-light/10',
			neutral: 'bg-neutral/10'
		}
	},
	defaultVariants: {
		color: 'neutral'
	}
});

export const skeletonTheme = {
	root: defaultSkeleton
};

export type SkeletonTheme = typeof skeletonTheme;
export type SkeletonThemeProps = InferComponentTheme<SkeletonTheme>;
export const setSkeletonTheme = setComponentTheme<SkeletonTheme>('skeleton');
export const useSkeletonTheme = useComponentTheme<SkeletonTheme>('skeleton', skeletonTheme);
