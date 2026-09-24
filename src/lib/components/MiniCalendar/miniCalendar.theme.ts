import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { type InferComponentTheme, cva } from '$lib/utils/cva/index.js';

const defaultRoot = cva({
	base: 'inline-flex w-fit items-center rounded-lg border bg-surface',
	variants: {
		size: {
			small: 'gap-micro p-micro',
			normal: 'gap-xs p-xs',
			large: 'gap-sm p-sm'
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

const defaultNavButton = cva({
	base: 'state-layer inline-flex shrink-0 items-center justify-center rounded-md text-neutral/70 outline-none transition-colors hover:text-neutral focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none',
	variants: {
		size: {
			small: 'size-7',
			normal: 'size-9',
			large: 'size-11'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

// A single-cell grid so the outgoing and incoming tracks overlap during the slide; the
// padding/negative-margin pair keeps focus rings visible inside the overflow clip.
const defaultDays = cva({
	base: 'grid -m-0.5 overflow-hidden p-micro'
});

const defaultTrack = cva({
	base: 'col-start-1 row-start-1 flex items-center',
	variants: {
		size: {
			small: 'gap-micro',
			normal: 'gap-xs',
			large: 'gap-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultDay = cva({
	base: 'state-layer relative inline-flex shrink-0 flex-col items-center justify-center rounded-md leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/50 disabled:pointer-events-none',
	variants: {
		size: {
			small: 'min-w-11 gap-micro px-md py-xs',
			normal: 'min-w-14 gap-micro px-lg py-sm',
			large: 'min-w-16 gap-xs px-xl py-md'
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
		selected: {
			true: 'raised',
			false: 'text-neutral'
		},
		today: {
			true: '',
			false: ''
		},
		disabled: {
			true: '',
			false: 'cursor-pointer'
		}
	},
	compoundVariants: [
		// Selected day: elevated, filled with the accent color.
		{ selected: true, color: 'primary', class: 'bg-primary text-primary-contrast' },
		{ selected: true, color: 'secondary', class: 'bg-secondary text-secondary-contrast' },
		{ selected: true, color: 'danger', class: 'bg-danger text-danger-contrast' },
		{ selected: true, color: 'success', class: 'bg-success text-success-contrast' },
		{ selected: true, color: 'warning', class: 'bg-warning text-warning-contrast' },
		{ selected: true, color: 'info', class: 'bg-info text-info-contrast' },
		{ selected: true, color: 'neutral', class: 'bg-neutral text-neutral-contrast' },
		// Today (when not selected): a subtle accent tint.
		{
			selected: false,
			today: true,
			color: 'primary',
			class: 'bg-primary/10 text-primary-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'secondary',
			class: 'bg-secondary/10 text-secondary-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'danger',
			class: 'bg-danger/10 text-danger-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'success',
			class: 'bg-success/10 text-success-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'warning',
			class: 'bg-warning/10 text-warning-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'info',
			class: 'bg-info/10 text-info-muted-readable'
		},
		{
			selected: false,
			today: true,
			color: 'neutral',
			class: 'bg-neutral/10 text-neutral-muted-readable'
		}
	],
	defaultVariants: {
		size: 'normal',
		color: 'neutral',
		selected: false,
		today: false,
		disabled: false
	}
});

const defaultDayMonth = cva({
	base: 'font-medium uppercase tracking-wide opacity-70',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

const defaultDayNumber = cva({
	base: 'font-semibold tabular-nums',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-sm'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const miniCalendarTheme = {
	root: defaultRoot,
	navButton: defaultNavButton,
	days: defaultDays,
	track: defaultTrack,
	day: defaultDay,
	dayMonth: defaultDayMonth,
	dayNumber: defaultDayNumber
};

export type MiniCalendarTheme = typeof miniCalendarTheme;
export type MiniCalendarThemeProps = InferComponentTheme<MiniCalendarTheme>;
export const setMiniCalendarTheme = setComponentTheme<MiniCalendarTheme>('mini-calendar');
export const useMiniCalendarTheme = useComponentTheme('mini-calendar', miniCalendarTheme);
