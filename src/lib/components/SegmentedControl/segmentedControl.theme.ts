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
		// The track is the padded rounded container: `p-xs` on the base, the radius here. Segments
		// and both indicators sit flush against that padding box, so they take
		// `rounded-md-concentric` rather than a hand-written `rounded-md` — same `md` step, but
		// capped at `min(8px, 8 - 4)` = 4px inside the track. A segment used to carry the track's
		// own radius outright, so its corner cut across the track's instead of nesting inside it.
		// A `pill` track is a stadium holding stadiums, which is already concentric at any size.
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
	base: "relative z-10 inline-flex cursor-pointer select-none items-center justify-center whitespace-nowrap font-medium text-neutral/70 outline-none transition-colors duration-normal focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/50 hover:text-neutral before:absolute before:inset-y-1 before:content-[''] first-of-type:before:-left-1 last:before:-right-1",
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
			normal: 'rounded-md-concentric',
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
			class: 'text-selected-contrast hover:text-selected-contrast'
		}
	]
});

const defaultIndicator = cva({
	base: 'pointer-events-none absolute top-0 left-0 lift-1 will-change-transform data-[ready=true]:transition-[transform,width,height] data-[ready=true]:duration-slow data-[ready=true]:ease-standard',
	variants: {
		variant: {
			normal: 'rounded-md-concentric',
			pill: 'rounded-full'
		},
		color: {
			primary: 'bg-selected',
			secondary: 'bg-selected',
			neutral: 'bg-selected',
			danger: 'bg-selected',
			success: 'bg-selected',
			warning: 'bg-selected',
			info: 'bg-selected'
		}
	},
	defaultVariants: {
		variant: 'normal',
		color: 'neutral'
	}
});

// Coextensive with the segment (`inset-0`), so it wears the segment's corner, whatever that
// computed to — it is not a box nested inside the segment's padding, so `rounded-md-concentric`
// here would cap against the segment's own `px-*` and square it off.
const defaultStaticIndicator = cva({
	base: 'pointer-events-none absolute inset-0 -z-10 lift-1 rounded-[inherit]',
	variants: {
		variant: {
			normal: '',
			pill: ''
		},
		color: {
			primary: 'bg-selected',
			secondary: 'bg-selected',
			neutral: 'bg-selected',
			danger: 'bg-selected',
			success: 'bg-selected',
			warning: 'bg-selected',
			info: 'bg-selected'
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
