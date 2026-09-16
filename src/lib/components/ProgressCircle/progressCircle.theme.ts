import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

// `--progress-circle-size` is INTERNAL: the root publishes the resolved diameter for the svg
// and label parts. It follows the `size` prop, which is the public way to change it.
const defaultProgressCircleRoot = cva({
	base: 'inline-flex shrink-0 items-center justify-center align-middle [--progress-circle-size:1.75rem]',
	variants: {
		size: {
			small: '[--progress-circle-size:1.25rem]',
			normal: '[--progress-circle-size:1.75rem]',
			large: '[--progress-circle-size:2.5rem]'
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

const defaultProgressCircleSvg = cva({
	base: 'size-[var(--progress-circle-size)] shrink-0 overflow-visible'
});

const defaultProgressCircleTrack = cva({
	base: 'stroke-neutral/20'
});

const defaultProgressCircleIndicator = cva({
	base: 'origin-center -rotate-90 stroke-current transition-[stroke-dashoffset] duration-slower ease-standard motion-reduce:transition-none'
});

export const progressCircleTheme = {
	root: defaultProgressCircleRoot,
	svg: defaultProgressCircleSvg,
	track: defaultProgressCircleTrack,
	indicator: defaultProgressCircleIndicator
};

export type ProgressCircleTheme = typeof progressCircleTheme;
export type ProgressCircleThemeProps = InferComponentTheme<ProgressCircleTheme>;
export const setProgressCircleTheme = setComponentTheme<ProgressCircleTheme>('progress-circle');
export const useProgressCircleTheme = useComponentTheme<ProgressCircleTheme>(
	'progress-circle',
	progressCircleTheme
);
