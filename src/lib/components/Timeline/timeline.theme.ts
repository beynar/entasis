import {
	cva,
	setComponentTheme,
	type InferComponentTheme,
	useComponentTheme
} from '$lib/utils/cva/index.js';

const colorVariants = {
	primary: '',
	secondary: '',
	danger: '',
	success: '',
	warning: '',
	info: '',
	neutral: ''
} as const;

const defaultRoot = cva({
	base: 'relative min-w-0 list-none p-0 text-neutral outline-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-primary/50',
	variants: {
		orientation: {
			vertical: 'grid w-full overflow-visible',
			horizontal:
				'grid w-full max-w-full auto-cols-[minmax(var(--timeline-item-min-width),1fr)] grid-flow-col grid-rows-[auto_var(--timeline-marker-size)_auto] overflow-x-auto overflow-y-hidden overscroll-x-contain p-xs scrollbar-none'
		},
		size: {
			small: '[--timeline-marker-size:0.875rem] [--timeline-title-center-offset:0.171875rem]',
			normal: '[--timeline-marker-size:1.125rem] [--timeline-title-center-offset:0.140625rem]',
			large: '[--timeline-marker-size:1.375rem] [--timeline-title-center-offset:0.109375rem]'
		},
		density: {
			small:
				'[--timeline-space:0.75rem] [--timeline-item-gap:1rem] [--timeline-item-min-width:12rem]',
			normal:
				'[--timeline-space:1rem] [--timeline-item-gap:1.5rem] [--timeline-item-min-width:16rem]',
			large:
				'[--timeline-space:1.5rem] [--timeline-item-gap:2rem] [--timeline-item-min-width:20rem]'
		},
		scrollFade: {
			none: '',
			x: 'scroll-fade-x'
		}
	},
	defaultVariants: {
		orientation: 'vertical',
		size: 'normal',
		density: 'normal',
		scrollFade: 'none'
	}
});

const defaultItem = cva({
	base: 'relative isolate min-w-0 [--timeline-surface-offset:0rem]',
	variants: {
		orientation: {
			vertical: 'grid items-start',
			horizontal: 'grid min-w-[var(--timeline-item-min-width)] row-span-3 grid-rows-subgrid'
		},
		placement: {
			start: '',
			end: '',
			alternate: ''
		},
		side: {
			start: '',
			end: ''
		},
		variant: {
			ghost: '',
			card: '',
			outline: '',
			soft: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		isLast: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{
			orientation: 'vertical',
			placement: 'start',
			class: 'grid-cols-[minmax(0,1fr)_var(--timeline-marker-size)] gap-x-[var(--timeline-space)]'
		},
		{
			orientation: 'vertical',
			placement: 'end',
			class: 'grid-cols-[var(--timeline-marker-size)_minmax(0,1fr)] gap-x-[var(--timeline-space)]'
		},
		{
			orientation: 'vertical',
			placement: 'alternate',
			class:
				'grid-cols-[minmax(0,1fr)_var(--timeline-marker-size)_minmax(0,1fr)] gap-x-[var(--timeline-space)] @max-[40rem]:grid-cols-[var(--timeline-marker-size)_minmax(0,1fr)]'
		},
		{
			orientation: 'vertical',
			variant: ['card', 'outline', 'soft'],
			density: 'small',
			class: '[--timeline-surface-offset:0.375rem]'
		},
		{
			orientation: 'vertical',
			variant: ['card', 'outline', 'soft'],
			density: 'normal',
			class: '[--timeline-surface-offset:0.5rem]'
		},
		{
			orientation: 'vertical',
			variant: ['card', 'outline', 'soft'],
			density: 'large',
			class: '[--timeline-surface-offset:0.625rem]'
		},
		{
			orientation: 'vertical',
			placement: 'alternate',
			variant: ['card', 'outline', 'soft'],
			class: '@max-[40rem]:[--timeline-surface-offset:0rem]'
		},
		{
			orientation: 'vertical',
			isLast: false,
			class: 'pb-[var(--timeline-item-gap)]'
		}
	],
	defaultVariants: {
		orientation: 'vertical',
		placement: 'end',
		side: 'end',
		variant: 'ghost',
		density: 'normal',
		isLast: false
	}
});

const defaultOpposite = cva({
	base: 'z-10 min-w-0 self-start text-neutral/60 tabular-nums',
	variants: {
		orientation: {
			vertical:
				'grid min-h-[var(--timeline-marker-size)] translate-y-[var(--timeline-surface-offset)] items-center [&_[data-slot=timeline-date]]:leading-none',
			horizontal: 'col-start-1'
		},
		side: {
			start: '',
			end: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		}
	},
	compoundVariants: [
		{
			orientation: 'vertical',
			side: 'start',
			class: 'col-start-3 row-start-1 text-start @max-[40rem]:col-start-2 @max-[40rem]:text-start'
		},
		{
			orientation: 'vertical',
			side: 'end',
			class: 'col-start-1 row-start-1 text-end @max-[40rem]:col-start-2 @max-[40rem]:text-start'
		},
		{
			orientation: 'vertical',
			density: 'small',
			class: '@max-[40rem]:min-h-[calc(var(--timeline-marker-size)+0.375rem)] @max-[40rem]:pb-sm'
		},
		{
			orientation: 'vertical',
			density: 'normal',
			class: '@max-[40rem]:min-h-[calc(var(--timeline-marker-size)+0.5rem)] @max-[40rem]:pb-md'
		},
		{
			orientation: 'vertical',
			density: 'large',
			class: '@max-[40rem]:min-h-[calc(var(--timeline-marker-size)+0.75rem)] @max-[40rem]:pb-lg'
		},
		{
			orientation: 'horizontal',
			side: 'start',
			class: 'row-start-3 self-start mt-[var(--timeline-space)] me-[var(--timeline-space)]'
		},
		{
			orientation: 'horizontal',
			side: 'end',
			class: 'row-start-1 self-end mb-[var(--timeline-space)] me-[var(--timeline-space)]'
		}
	],
	defaultVariants: {
		orientation: 'vertical',
		side: 'end',
		density: 'normal'
	}
});

const defaultAxis = cva({
	base: 'relative z-10 flex shrink-0',
	variants: {
		orientation: {
			vertical:
				'row-start-1 h-full w-[var(--timeline-marker-size)] translate-y-[var(--timeline-surface-offset)] items-start justify-center',
			horizontal:
				'col-start-1 row-start-2 h-[var(--timeline-marker-size)] w-full items-center justify-start'
		},
		placement: {
			start: '',
			end: '',
			alternate: ''
		},
		variant: {
			ghost: '',
			card: '',
			outline: '',
			soft: ''
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		hasDate: {
			true: '',
			false: ''
		},
		isLast: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ orientation: 'vertical', placement: 'start', class: 'col-start-2' },
		{ orientation: 'vertical', placement: 'end', class: 'col-start-1' },
		{
			orientation: 'vertical',
			placement: 'alternate',
			class: 'col-start-2 @max-[40rem]:col-start-1 @max-[40rem]:row-span-2'
		},
		{
			orientation: 'vertical',
			variant: 'ghost',
			hasDate: false,
			class: 'top-[var(--timeline-title-center-offset)]'
		},
		{
			orientation: 'vertical',
			isLast: false,
			class: 'h-[calc(100%+var(--timeline-item-gap))]'
		}
	],
	defaultVariants: {
		orientation: 'vertical',
		placement: 'end',
		variant: 'ghost',
		density: 'normal',
		hasDate: true,
		isLast: false
	}
});

const defaultConnector = cva({
	base: 'pointer-events-none absolute z-0 bg-color/35',
	variants: {
		orientation: {
			vertical: 'left-1/2 top-[calc(var(--timeline-marker-size)/2)] h-full w-px -translate-x-1/2',
			horizontal: 'start-[calc(var(--timeline-marker-size)/2)] top-1/2 h-px w-full -translate-y-1/2'
		},
		color: colorVariants
	},
	defaultVariants: {
		orientation: 'vertical',
		color: 'neutral'
	}
});

const defaultMarker = cva({
	base: 'relative z-10 grid shrink-0 place-items-center rounded-full bg-surface text-color-readable ring-1 ring-color/45 shadow-[0_0_0_3px_var(--color-surface)] [&>svg]:size-[58%] [&_[data-slot=timeline-dot]]:block [&_[data-slot=timeline-dot]]:size-[38%] [&_[data-slot=timeline-dot]]:rounded-full [&_[data-slot=timeline-dot]]:bg-color',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-[1.125rem]',
			large: 'size-[1.375rem]'
		},
		color: colorVariants
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral'
	}
});

const defaultContent = cva({
	base: 'relative z-10 min-w-0 text-start',
	variants: {
		orientation: {
			vertical: '',
			horizontal: 'col-start-1 min-w-0 me-[var(--timeline-space)]'
		},
		placement: {
			start: '',
			end: '',
			alternate: ''
		},
		side: {
			start: '',
			end: ''
		},
		variant: {
			ghost: 'bg-transparent text-neutral',
			card: 'rounded-lg bg-surface-raised text-neutral ring-1 ring-neutral/10 shadow-xs',
			outline: 'rounded-lg bg-transparent text-neutral ring-1 ring-color',
			soft: 'rounded-lg bg-color-muted text-color-muted-readable'
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		color: colorVariants
	},
	compoundVariants: [
		{ orientation: 'vertical', placement: 'start', class: 'col-start-1' },
		{ orientation: 'vertical', placement: 'end', class: 'col-start-2' },
		{
			orientation: 'vertical',
			placement: 'alternate',
			side: 'start',
			class: 'col-start-1 row-start-1 @max-[40rem]:col-start-2 @max-[40rem]:row-start-2'
		},
		{
			orientation: 'vertical',
			placement: 'alternate',
			side: 'end',
			class: 'col-start-3 row-start-1 @max-[40rem]:col-start-2 @max-[40rem]:row-start-2'
		},
		{
			orientation: 'horizontal',
			placement: 'start',
			class: 'row-start-1 self-end mb-[var(--timeline-space)]'
		},
		{
			orientation: 'horizontal',
			placement: 'end',
			class: 'row-start-3 self-start mt-[var(--timeline-space)]'
		},
		{
			orientation: 'horizontal',
			placement: 'alternate',
			side: 'start',
			class: 'row-start-1 self-end mb-[var(--timeline-space)]'
		},
		{
			orientation: 'horizontal',
			placement: 'alternate',
			side: 'end',
			class: 'row-start-3 self-start mt-[var(--timeline-space)]'
		},
		{ variant: ['card', 'outline', 'soft'], density: 'small', class: 'p-lg' },
		{ variant: ['card', 'outline', 'soft'], density: 'normal', class: 'p-xl' },
		{ variant: ['card', 'outline', 'soft'], density: 'large', class: 'p-layout-sm' }
	],
	defaultVariants: {
		orientation: 'vertical',
		placement: 'end',
		side: 'end',
		variant: 'ghost',
		density: 'normal',
		color: 'neutral'
	}
});

const defaultDate = cva({
	base: 'block leading-normal tabular-nums',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-[0.8125rem]',
			large: 'text-[0.9375rem]'
		},
		density: {
			small: '',
			normal: '',
			large: ''
		},
		placement: {
			start: 'text-neutral/60',
			end: 'text-neutral/60',
			alternate: 'text-neutral/60'
		},
		variant: {
			ghost: '',
			card: '',
			outline: '',
			soft: 'text-color-muted-readable/70'
		}
	},
	compoundVariants: [
		{ placement: ['start', 'end'], density: 'small', class: 'mb-xs' },
		{ placement: ['start', 'end'], density: 'normal', class: 'mb-sm' },
		{ placement: ['start', 'end'], density: 'large', class: 'mb-md' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		placement: 'end',
		variant: 'ghost'
	}
});

const defaultTitleRow = cva({
	base: 'flex min-w-0 items-start'
});

const defaultTitle = cva({
	base: 'min-w-0 font-medium leading-snug',
	variants: {
		size: {
			small: 'text-[0.8125rem]',
			normal: 'text-[0.9375rem]',
			large: 'text-[1.0625rem]'
		},
		variant: {
			ghost: 'text-neutral',
			card: 'text-neutral',
			outline: 'text-neutral',
			soft: 'text-color-muted-readable'
		}
	},
	defaultVariants: {
		size: 'normal',
		variant: 'ghost'
	}
});

const defaultDescription = cva({
	base: 'leading-relaxed',
	variants: {
		size: {
			small: 'text-[0.6875rem]',
			normal: 'text-[0.8125rem]',
			large: 'text-[0.9375rem]'
		},
		density: {
			small: 'mt-xs',
			normal: 'mt-sm',
			large: 'mt-md'
		},
		variant: {
			ghost: 'text-neutral/65',
			card: 'text-neutral/65',
			outline: 'text-neutral/65',
			soft: 'text-color-muted-readable/70'
		}
	},
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'ghost'
	}
});

const defaultLoading = cva({
	base: 'grid shrink-0 place-items-center',
	variants: {
		size: {
			small: '[&_[data-slot=spinner-indicator]]:[--spinner-size:0.875rem]',
			normal: '[&_[data-slot=spinner-indicator]]:[--spinner-size:1.125rem]',
			large: '[&_[data-slot=spinner-indicator]]:[--spinner-size:1.375rem]'
		}
	},
	defaultVariants: {
		size: 'normal'
	}
});

export const timelineTheme = {
	root: defaultRoot,
	item: defaultItem,
	opposite: defaultOpposite,
	axis: defaultAxis,
	connector: defaultConnector,
	marker: defaultMarker,
	content: defaultContent,
	date: defaultDate,
	titleRow: defaultTitleRow,
	title: defaultTitle,
	description: defaultDescription,
	loading: defaultLoading
};

export type TimelineTheme = typeof timelineTheme;
export type TimelineThemeProps = InferComponentTheme<TimelineTheme>;
export const setTimelineTheme = setComponentTheme<TimelineTheme>('timeline');
export const useTimelineTheme = useComponentTheme<TimelineTheme>('timeline', timelineTheme);
export type TimelineClasses = ReturnType<typeof useTimelineTheme>;
