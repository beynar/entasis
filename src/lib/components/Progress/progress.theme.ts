import {
	cva,
	setComponentTheme,
	useComponentTheme,
	type InferComponentTheme
} from '$lib/utils/cva/index.js';

const defaultProgressRoot = cva({
	base: 'relative flex w-full flex-col',
	variants: {
		density: {
			compact: 'gap-xs',
			normal: 'gap-sm',
			comfortable: 'gap-md'
		}
	},
	defaultVariants: {
		density: 'normal'
	}
});

const defaultProgressHeader = cva({
	base: 'flex w-full items-center justify-between gap-md'
});

const defaultProgressLabel = cva({
	base: 'min-w-0 text-neutral/70',
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

const defaultProgressValue = cva({
	base: 'ms-auto shrink-0 font-medium tabular-nums text-neutral/70',
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

const defaultProgressTrack = cva({
	base: 'relative block w-full overflow-hidden rounded-full bg-neutral/20',
	variants: {
		size: {
			small: 'h-1',
			normal: 'h-2',
			large: 'h-3'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultProgressIndicator = cva({
	base: 'block h-full rounded-full transition-[width] duration-slower ease-standard motion-reduce:transition-none [html[data-entasis-reduce-motion]_&]:transition-none',
	variants: {
		color: {
			primary: 'bg-primary',
			secondary: 'bg-secondary',
			danger: 'bg-danger',
			success: 'bg-success',
			warning: 'bg-warning',
			info: 'bg-info',
			neutral: 'bg-neutral'
		}
	},
	defaultVariants: {
		color: 'neutral'
	}
});

export const progressTheme = {
	root: defaultProgressRoot,
	header: defaultProgressHeader,
	label: defaultProgressLabel,
	value: defaultProgressValue,
	track: defaultProgressTrack,
	indicator: defaultProgressIndicator
};

export type ProgressTheme = typeof progressTheme;
export type ProgressThemeProps = InferComponentTheme<ProgressTheme>;
export const setProgressTheme = setComponentTheme<ProgressTheme>('progress');
export const useProgressTheme = useComponentTheme<ProgressTheme>('progress', progressTheme);
