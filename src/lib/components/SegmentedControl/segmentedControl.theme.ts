import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultSegmentedControl = cva({
	base: 'relative isolate inline-flex w-fit max-w-full items-center overflow-visible bg-surface-recessed p-xs',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		},
		variant: {
			normal: 'rounded-md',
			pill: 'rounded-full'
		},
		disabled: {
			true: 'opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'normal',
		disabled: false
	}
});

const defaultSegment = cva({
	base: "relative z-10 inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium text-neutral/70 outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-color/45 hover:text-neutral before:absolute before:inset-y-1 before:content-[''] first-of-type:before:-left-1 last:before:-right-1",
	variants: {
		size: {
			small:
				'h-control-sm gap-xs px-md text-xs before:-right-px before:-left-px [&>svg]:size-icon-sm',
			normal:
				'h-control-md gap-md px-lg text-sm before:-right-0.5 before:-left-0.5 [&>svg]:size-icon-md',
			large:
				'h-control-lg gap-md px-xl text-sm before:-right-[3px] before:-left-[3px] [&>svg]:size-icon-lg'
		},
		variant: {
			normal: 'rounded-md',
			pill: 'rounded-full'
		},
		color: {
			primary: '',
			secondary: '',
			neutral: '',
			danger: '',
			success: '',
			warning: '',
			info: ''
		},
		selected: {
			true: '',
			false: ''
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'normal',
		color: 'neutral',
		selected: false,
		disabled: false
	},
	compoundVariants: [
		{
			selected: true,
			class: 'text-color-contrast hover:text-color-contrast'
		}
	]
});

const defaultIndicator = cva({
	base: 'pointer-events-none absolute top-0 left-0 shadow-sm will-change-transform data-[ready=true]:transition-[transform,width,height] data-[ready=true]:duration-300 data-[ready=true]:ease-[cubic-bezier(0.4,0,0.2,1)]',
	variants: {
		variant: {
			normal: 'rounded-md',
			pill: 'rounded-full'
		},
		color: {
			primary: 'bg-color',
			secondary: 'bg-color',
			neutral: 'bg-color',
			danger: 'bg-color',
			success: 'bg-color',
			warning: 'bg-color',
			info: 'bg-color'
		}
	},
	defaultVariants: {
		variant: 'normal',
		color: 'neutral'
	}
});

const defaultStaticIndicator = cva({
	base: 'pointer-events-none absolute inset-0 -z-10 shadow-sm',
	variants: {
		variant: {
			normal: 'rounded-md',
			pill: 'rounded-full'
		},
		color: {
			primary: 'bg-color',
			secondary: 'bg-color',
			neutral: 'bg-color',
			danger: 'bg-color',
			success: 'bg-color',
			warning: 'bg-color',
			info: 'bg-color'
		}
	},
	defaultVariants: {
		variant: 'normal',
		color: 'neutral'
	}
});

export const segmentedControlTheme = {
	root: defaultSegmentedControl,
	item: defaultSegment,
	indicator: defaultIndicator,
	staticIndicator: defaultStaticIndicator
};

export type SegmentedControlTheme = typeof segmentedControlTheme;
export type SegmentedControlThemeProps = InferComponentTheme<SegmentedControlTheme>;
export const setSegmentedControlTheme =
	setComponentTheme<SegmentedControlTheme>('segmentedControl');
export const useSegmentedControlTheme = useComponentTheme<SegmentedControlTheme>(
	'segmentedControl',
	segmentedControlTheme
);
