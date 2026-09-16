import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultInputContainer = cva({
	base: 'w-full rounded-sm text-neutral transition-[color,opacity] flex items-center gap-lg',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		disabled: false
	}
});

const defaultRoot = cva({
	base: 'grid w-full gap-md',
	variants: {
		orientation: {
			horizontal: '',
			vertical: 'w-auto justify-items-center'
		},
		size: {
			small: 'gap-sm',
			normal: 'gap-md',
			large: 'gap-md'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal'
	}
});

const defaultControl = cva({
	base: 'flex w-full gap-lg',
	variants: {
		orientation: {
			horizontal: 'items-center',
			vertical: 'w-auto flex-col items-center'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		variant: {
			default: '',
			thick: '',
			contained: 'relative gap-0'
		},
		marks: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		marks: false
	},
	compoundVariants: [
		{ orientation: 'horizontal', marks: true, class: 'h-auto items-start' },
		{ variant: 'default', orientation: 'horizontal', size: 'small', marks: false, class: 'h-3.5' },
		{ variant: 'default', orientation: 'horizontal', size: 'normal', marks: false, class: 'h-4' },
		{ variant: 'default', orientation: 'horizontal', size: 'large', marks: false, class: 'h-5' },
		{ variant: 'thick', orientation: 'horizontal', size: 'small', marks: false, class: 'h-4' },
		{ variant: 'thick', orientation: 'horizontal', size: 'normal', marks: false, class: 'h-5' },
		{ variant: 'thick', orientation: 'horizontal', size: 'large', marks: false, class: 'h-6' },
		{
			variant: 'contained',
			orientation: 'horizontal',
			size: 'small',
			marks: false,
			class: 'h-8'
		},
		{
			variant: 'contained',
			orientation: 'horizontal',
			size: 'normal',
			marks: false,
			class: 'h-10'
		},
		{
			variant: 'contained',
			orientation: 'horizontal',
			size: 'large',
			marks: false,
			class: 'h-12'
		}
	]
});

const defaultTrack = cva({
	base: 'relative touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-focus/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
	variants: {
		orientation: {
			horizontal: 'w-full min-w-40',
			vertical: 'h-56'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		color: {
			primary: 'text-primary',
			secondary: 'text-secondary',
			danger: 'text-danger',
			success: 'text-success',
			warning: 'text-warning',
			info: 'text-info',
			neutral: 'text-neutral'
		},
		disabled: {
			true: 'cursor-not-allowed opacity-50',
			false: 'cursor-pointer'
		},
		variant: {
			default: '',
			thick: '',
			contained: 'border-neutral-muted bg-surface-raised rounded-md border'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		color: 'neutral',
		disabled: false,
		variant: 'default'
	},
	compoundVariants: [
		{ orientation: 'horizontal', variant: 'default', class: 'h-2' },
		{ orientation: 'vertical', variant: 'default', class: 'w-2' },
		{ orientation: 'horizontal', variant: 'thick', size: 'small', class: 'h-4' },
		{ orientation: 'horizontal', variant: 'thick', size: 'normal', class: 'h-5' },
		{ orientation: 'horizontal', variant: 'thick', size: 'large', class: 'h-6' },
		{ orientation: 'vertical', variant: 'thick', size: 'small', class: 'w-4' },
		{ orientation: 'vertical', variant: 'thick', size: 'normal', class: 'w-5' },
		{ orientation: 'vertical', variant: 'thick', size: 'large', class: 'w-6' },
		{ orientation: 'horizontal', variant: 'contained', size: 'small', class: 'h-8' },
		{ orientation: 'horizontal', variant: 'contained', size: 'normal', class: 'h-10' },
		{ orientation: 'horizontal', variant: 'contained', size: 'large', class: 'h-12' },
		{ orientation: 'vertical', variant: 'contained', size: 'small', class: 'w-8' },
		{ orientation: 'vertical', variant: 'contained', size: 'normal', class: 'w-10' },
		{ orientation: 'vertical', variant: 'contained', size: 'large', class: 'w-12' }
	]
});

const defaultTrackBackground = cva({
	base: 'bg-neutral/15 absolute rounded-full',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		},
		variant: {
			default: '',
			thick: 'inset-0',
			contained: 'bg-surface-raised inset-0 rounded-[inherit]'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		variant: 'default'
	},
	compoundVariants: [
		{
			orientation: 'horizontal',
			variant: 'default',
			class: 'inset-x-0 top-1/2 h-1.5 -translate-y-1/2'
		},
		{
			orientation: 'vertical',
			variant: 'default',
			class: 'inset-y-0 left-1/2 w-1.5 -translate-x-1/2'
		}
	]
});

const defaultRange = cva({
	base: 'absolute rounded-full bg-current',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		dragRange: {
			true: 'cursor-grab active:cursor-grabbing',
			false: ''
		},
		variant: {
			default: '',
			thick: '',
			contained: 'z-10 rounded-[inherit] bg-current/10'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		dragRange: false,
		variant: 'default'
	},
	compoundVariants: [
		{
			orientation: 'horizontal',
			variant: 'default',
			class: 'top-1/2 h-1.5 -translate-y-1/2'
		},
		{
			orientation: 'vertical',
			variant: 'default',
			class: 'left-1/2 w-1.5 -translate-x-1/2'
		},
		{
			orientation: 'horizontal',
			variant: 'thick',
			class: 'inset-y-0'
		},
		{
			orientation: 'vertical',
			variant: 'thick',
			class: 'inset-x-0'
		},
		{
			orientation: 'horizontal',
			variant: 'contained',
			class: 'inset-y-0'
		},
		{
			orientation: 'vertical',
			variant: 'contained',
			class: 'inset-x-0'
		}
	]
});

const defaultThumb = cva({
	base: 'group absolute z-20 flex size-11 touch-none appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 outline-none',
	variants: {
		orientation: {
			horizontal: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
			vertical: 'left-1/2 -translate-x-1/2 translate-y-1/2'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		disabled: {
			true: 'cursor-not-allowed',
			false: 'cursor-grab active:cursor-grabbing'
		},
		color: {
			primary: '',
			secondary: '',
			danger: '',
			success: '',
			warning: '',
			info: '',
			neutral: ''
		},
		variant: {
			default: '',
			thick: '',
			contained:
				'peer-hover/thumb:[&>[data-slider-thumb-visual]]:scale-100 peer-hover/thumb:[&>[data-slider-thumb-visual]]:bg-neutral/80'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		disabled: false,
		color: 'neutral',
		variant: 'default'
	}
});

const defaultThumbHitbox = cva({
	base: 'absolute z-30 block touch-none rounded-full bg-transparent',
	variants: {
		orientation: {
			horizontal: 'top-1/2 -translate-x-1/2 -translate-y-1/2',
			vertical: 'left-1/2 -translate-x-1/2 translate-y-1/2'
		},
		size: {
			small: 'size-12',
			normal: 'size-14',
			large: 'size-16'
		},
		disabled: {
			true: 'pointer-events-none cursor-not-allowed',
			false: 'cursor-grab active:cursor-grabbing'
		},
		variant: {
			default: 'hidden',
			thick: '',
			contained: 'peer/thumb'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		disabled: false,
		variant: 'default'
	}
});

const defaultThumbVisual = cva({
	base: 'pointer-events-none rounded-full border-2 border-surface bg-current lift-1 ring-offset-surface transition-[box-shadow,transform] group-focus-visible:ring-2 group-focus-visible:ring-focus/50 group-focus-visible:ring-offset-2',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		},
		size: {
			small: 'size-3.5',
			normal: 'size-4',
			large: 'size-5'
		},
		color: {
			primary: '',
			secondary: '',
			danger: '',
			success: '',
			warning: '',
			info: '',
			neutral: ''
		},
		variant: {
			default: '',
			thick: '',
			contained: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		color: 'neutral',
		variant: 'default'
	},
	compoundVariants: [
		{ variant: 'thick', class: 'border-0 shadow-none' },
		{ variant: 'thick', color: 'primary', class: 'bg-primary-contrast' },
		{ variant: 'thick', color: 'secondary', class: 'bg-secondary-contrast' },
		{ variant: 'thick', color: 'danger', class: 'bg-danger-contrast' },
		{ variant: 'thick', color: 'success', class: 'bg-success-contrast' },
		{ variant: 'thick', color: 'warning', class: 'bg-warning-contrast' },
		{ variant: 'thick', color: 'info', class: 'bg-info-contrast' },
		{ variant: 'thick', color: 'neutral', class: 'bg-neutral-contrast' },
		{ orientation: 'horizontal', variant: 'thick', size: 'small', class: 'h-3 w-5' },
		{ orientation: 'horizontal', variant: 'thick', size: 'normal', class: 'h-4 w-7' },
		{ orientation: 'horizontal', variant: 'thick', size: 'large', class: 'h-5 w-9' },
		{ orientation: 'vertical', variant: 'thick', size: 'small', class: 'h-5 w-3' },
		{ orientation: 'vertical', variant: 'thick', size: 'normal', class: 'h-7 w-4' },
		{ orientation: 'vertical', variant: 'thick', size: 'large', class: 'h-9 w-5' },
		{
			variant: 'contained',
			class:
				'bg-neutral/45 scale-75 border-0 shadow-none transition-[background-color,transform] duration-normal ease-standard group-focus-visible:scale-100 group-focus-visible:bg-neutral/80'
		},
		{ orientation: 'horizontal', variant: 'contained', size: 'small', class: 'h-5 w-1' },
		{ orientation: 'horizontal', variant: 'contained', size: 'normal', class: 'h-7 w-1.5' },
		{ orientation: 'horizontal', variant: 'contained', size: 'large', class: 'h-8 w-2' },
		{ orientation: 'vertical', variant: 'contained', size: 'small', class: 'h-1 w-5' },
		{ orientation: 'vertical', variant: 'contained', size: 'normal', class: 'h-1.5 w-7' },
		{ orientation: 'vertical', variant: 'contained', size: 'large', class: 'h-2 w-8' }
	]
});

const defaultValueLabels = cva({
	base: 'flex shrink-0 gap-xs',
	variants: {
		orientation: {
			horizontal: 'flex-wrap items-center',
			vertical: 'items-center'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		},
		variant: {
			default: '',
			thick: '',
			contained: ''
		},
		marks: {
			true: '',
			false: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		variant: 'default',
		marks: false
	},
	compoundVariants: [
		{ orientation: 'horizontal', marks: true, variant: 'default', class: 'mt-xs -translate-y-1/2' },
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'small',
			class: 'pointer-events-none absolute top-0 right-3 z-30 h-8 flex-nowrap'
		},
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'normal',
			class: 'pointer-events-none absolute top-0 right-4 z-30 h-10 flex-nowrap'
		},
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'large',
			class: 'pointer-events-none absolute top-0 right-5 z-30 h-12 flex-nowrap'
		},
		{
			orientation: 'horizontal',
			marks: true,
			variant: 'thick',
			size: 'small',
			class: 'mt-md -translate-y-1/2'
		},
		{
			orientation: 'horizontal',
			marks: true,
			variant: 'thick',
			size: 'normal',
			class: 'mt-md -translate-y-1/2'
		},
		{
			orientation: 'horizontal',
			marks: true,
			variant: 'thick',
			size: 'large',
			class: 'mt-lg -translate-y-1/2'
		}
	]
});

const defaultValueLabel = cva({
	base: 'border-neutral-muted bg-surface text-neutral inline-flex shrink-0 items-center justify-center rounded-full border font-medium leading-none tabular-nums',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		},
		size: {
			small: 'min-w-8 px-md py-xs text-xs',
			normal: 'min-w-10 px-md py-xs text-xs',
			large: 'min-w-12 px-lg py-sm text-sm'
		},
		variant: {
			default: '',
			thick: '',
			contained: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal',
		variant: 'default'
	},
	compoundVariants: [
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'small',
			class: 'min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-xs'
		},
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'normal',
			class: 'min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-sm'
		},
		{
			orientation: 'horizontal',
			variant: 'contained',
			size: 'large',
			class: 'min-w-0 rounded-none border-0 bg-transparent px-0 py-0 text-base'
		}
	]
});

const defaultContainedLabel = cva({
	base: 'text-neutral/70 pointer-events-none absolute top-0 left-0 z-30 flex max-w-[55%] min-w-0 items-center truncate font-medium',
	variants: {
		size: {
			small: 'h-8 pl-lg text-xs',
			normal: 'h-10 pl-xl text-sm',
			large: 'h-12 pl-layout-sm text-base'
		},
		required: {
			true: "after:text-danger-readable after:ml-xs after:content-['*']",
			false: ''
		},
		hasError: {
			true: 'text-danger-readable',
			false: ''
		}
	},
	defaultVariants: {
		size: 'normal',
		required: false,
		hasError: false
	}
});

const defaultContainedTicks = cva({
	base: 'text-neutral pointer-events-none absolute inset-0 z-0',
	variants: {
		orientation: {
			horizontal: '',
			vertical: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

const defaultContainedTick = cva({
	base: 'bg-current/10 absolute rounded-full',
	variants: {
		orientation: {
			horizontal: 'top-1/2 w-px -translate-x-1/2 -translate-y-1/2',
			vertical: 'left-1/2 h-px -translate-x-1/2 translate-y-1/2'
		},
		size: {
			small: '',
			normal: '',
			large: ''
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal'
	},
	compoundVariants: [
		{ orientation: 'horizontal', size: 'small', class: 'h-2.5' },
		{ orientation: 'horizontal', size: 'normal', class: 'h-3' },
		{ orientation: 'horizontal', size: 'large', class: 'h-4' },
		{ orientation: 'vertical', size: 'small', class: 'w-2.5' },
		{ orientation: 'vertical', size: 'normal', class: 'w-3' },
		{ orientation: 'vertical', size: 'large', class: 'w-4' }
	]
});

const defaultMarks = cva({
	base: 'relative',
	variants: {
		orientation: {
			horizontal: 'mt-sm h-5 w-full',
			vertical: 'absolute inset-y-0 left-full ml-lg w-16'
		},
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		orientation: 'horizontal',
		size: 'normal'
	}
});

const defaultMark = cva({
	base: 'absolute flex text-center',
	variants: {
		orientation: {
			horizontal: 'top-0 -translate-x-1/2 flex-col items-center gap-xs',
			vertical: 'left-0 -translate-y-1/2 items-center gap-md'
		}
	},
	defaultVariants: {
		orientation: 'horizontal'
	}
});

const defaultMarkDot = cva({
	base: 'bg-neutral-muted size-1.5 shrink-0 rounded-full'
});

const defaultMarkLabel = cva({
	base: 'text-neutral/70 leading-none whitespace-nowrap tabular-nums'
});

export const sliderTheme = {
	inputContainer: defaultInputContainer,
	root: defaultRoot,
	control: defaultControl,
	track: defaultTrack,
	trackBackground: defaultTrackBackground,
	range: defaultRange,
	thumb: defaultThumb,
	thumbHitbox: defaultThumbHitbox,
	thumbVisual: defaultThumbVisual,
	valueLabels: defaultValueLabels,
	valueLabel: defaultValueLabel,
	containedLabel: defaultContainedLabel,
	containedTicks: defaultContainedTicks,
	containedTick: defaultContainedTick,
	marks: defaultMarks,
	mark: defaultMark,
	markDot: defaultMarkDot,
	markLabel: defaultMarkLabel
};

export type SliderTheme = typeof sliderTheme;
export type SliderThemeProps = InferComponentTheme<SliderTheme>;
export const setSliderTheme = setComponentTheme<SliderTheme>('slider');
export const useSliderTheme = useComponentTheme('slider', sliderTheme);
