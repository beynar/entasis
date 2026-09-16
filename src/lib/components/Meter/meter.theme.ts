import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';

const defaultMeter = cva({
	base: 'flex flex-col relative',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	}
});

const defaultMeterHeader = cva({
	base: 'flex w-full items-center justify-between relative',
	variants: {
		size: {
			small: 'gap-xs',
			normal: 'gap-md',
			large: 'gap-lg'
		}
	}
});

const defaultMeterContainer = cva({
	base: 'block relative',
	variants: {
		first: {
			true: 'rounded-l-full'
		},
		last: {
			true: 'rounded-r-full'
		}
	}
});

const defaultMeterLabel = cva({
	base: 'text-sm text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultMeterHelper = cva({
	base: 'text-sm text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultMeterDescription = cva({
	base: 'text-neutral/70 text-sm',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultMeterProgress = cva({
	base: 'appearance-none block w-full h-1 !border-none !bg-color overflow-hidden text-primary rounded-[inherit] ',
	variants: {
		size: {
			small: 'h-1',
			normal: 'h-2',
			large: 'h-3'
		}
	}
});

const defaultMeterTrack = cva({
	base: 'flex items-center justify-start bg-neutral-muted/50 rounded-full relative',
	variants: {
		size: {
			small: 'h-1',
			normal: 'h-2',
			large: 'h-3'
		},
		labelsPosition: {
			top: 'mt-xl',
			bottom: 'mb-xl',
			both: 'mt-xl mb-xl'
		}
	}
});

const defaultMeterIndicator = cva({
	base: 'absolute whitespace-nowrap w-fit rounded-sm text-color-readable mx-auto left-0 right-0 leading-none',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		},
		position: {
			top: 'bottom-full	',
			bottom: 'top-full'
		}
	},
	defaultVariants: {
		position: 'top'
	}
});

const defaultMeterLegend = cva({
	base: 'flex flex-col',
	variants: {
		size: {
			small: '',
			normal: '',
			large: ''
		}
	}
});

const defaultMeterLegendItem = cva({
	base: 'flex items-center gap-md [&_*]:text-color-readable',
	variants: {
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	}
});

const defaultMeterLegendIcon = cva({
	base: '[&>svg]:size-full',
	variants: {
		size: {
			small: 'w-3 h-3',
			normal: 'w-4 h-4',
			large: 'w-5 h-5'
		}
	}
});

const defaultMeterLegendLabel = cva({
	base: 'text-neutral/70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

const defaultMeterLegendPercentage = cva({
	base: 'text-neutral/70 font-medium',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		}
	}
});

export const meterTheme = {
	root: defaultMeter,
	header: defaultMeterHeader,
	container: defaultMeterContainer,
	label: defaultMeterLabel,
	helper: defaultMeterHelper,
	description: defaultMeterDescription,
	progress: defaultMeterProgress,
	track: defaultMeterTrack,
	indicator: defaultMeterIndicator,
	legend: defaultMeterLegend,
	legendItem: defaultMeterLegendItem,
	legendIcon: defaultMeterLegendIcon,
	legendLabel: defaultMeterLegendLabel,
	legendPercentage: defaultMeterLegendPercentage
};

export type MeterTheme = typeof meterTheme;
export type MeterThemeProps = InferComponentTheme<MeterTheme>;
export const setMeterTheme = setComponentTheme<MeterTheme>('meter');
export const useMeterTheme = useComponentTheme<MeterTheme>('meter', meterTheme);
