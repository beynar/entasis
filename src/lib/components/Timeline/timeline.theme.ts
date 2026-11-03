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

// Selectable items: the item's selection button lies under its parts, which let the pointer through
// to it. Interactive content inside a custom renderer (a link, a button, a field) stays clickable.
const pointerPassThrough =
	'pointer-events-none [&_:is(a,button,input,select,textarea,summary)]:pointer-events-auto';

// The `--timeline-*` properties are INTERNAL: the root publishes marker size, spacing and the
// title/surface offsets so the connector, marker and content parts line up on one midline.
// `orientation` and `size` drive them; they are not a consumer hook.
const defaultRoot = cva({
	base: 'relative min-w-0 list-none p-0 text-neutral outline-none [container-type:inline-size] focus-visible:ring-2 focus-visible:ring-focus/50',
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
			compact:
				'[--timeline-space:0.75rem] [--timeline-item-gap:1rem] [--timeline-item-min-width:12rem]',
			normal:
				'[--timeline-space:1rem] [--timeline-item-gap:1.5rem] [--timeline-item-min-width:16rem]',
			comfortable:
				'[--timeline-space:1.5rem] [--timeline-item-gap:2rem] [--timeline-item-min-width:20rem]'
		},
		scrollFade: {
			none: '',
			x: 'scroll-fade-x'
		},
		selectable: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		// A selectable ghost surface reaches `sm` before its marker; the inline padding keeps the first
		// one inside the scroll box.
		{ orientation: 'horizontal', selectable: true, class: 'px-sm' }
	],
	defaultVariants: {
		orientation: 'vertical',
		size: 'normal',
		density: 'normal',
		scrollFade: 'none',
		selectable: false
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
			compact: '',
			normal: '',
			comfortable: ''
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
			density: 'compact',
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
			density: 'comfortable',
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
	base: 'z-10 min-w-0 self-start text-neutral/70 tabular-nums',
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
			compact: '',
			normal: '',
			comfortable: ''
		},
		selectable: {
			true: pointerPassThrough,
			false: ''
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
			density: 'compact',
			class: '@max-[40rem]:min-h-[calc(var(--timeline-marker-size)+0.375rem)] @max-[40rem]:pb-sm'
		},
		{
			orientation: 'vertical',
			density: 'normal',
			class: '@max-[40rem]:min-h-[calc(var(--timeline-marker-size)+0.5rem)] @max-[40rem]:pb-md'
		},
		{
			orientation: 'vertical',
			density: 'comfortable',
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
		density: 'normal',
		selectable: false
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
			compact: '',
			normal: '',
			comfortable: ''
		},
		hasDate: {
			true: '',
			false: ''
		},
		isLast: {
			true: '',
			false: ''
		},
		selectable: {
			true: 'pointer-events-none',
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
		isLast: false,
		selectable: false
	}
});

// The selection button of a selectable item: an invisible, empty `<button>` stretched under the
// whole item, so a click anywhere on the item lands on it. The item content paints its states.
const defaultItemButton = cva({
	base: 'peer/timeline-item-button absolute inset-0 z-0 cursor-pointer appearance-none bg-transparent outline-none disabled:cursor-default'
});

// `progress` is the step the connector leaves: solid after a done step, faint after the
// current and upcoming ones, so the band reads as finished up to the current step.
const defaultConnector = cva({
	base: 'pointer-events-none absolute z-0 bg-color/35',
	variants: {
		orientation: {
			vertical: 'left-1/2 top-[calc(var(--timeline-marker-size)/2)] h-full w-px -translate-x-1/2',
			horizontal: 'start-[calc(var(--timeline-marker-size)/2)] top-1/2 h-px w-full -translate-y-1/2'
		},
		color: colorVariants,
		progress: {
			none: '',
			done: 'bg-color',
			current: 'bg-color/20',
			upcoming: 'bg-color/20'
		}
	},
	compoundVariants: [
		{ orientation: 'vertical', progress: ['done', 'current', 'upcoming'], class: 'w-0.5' },
		{ orientation: 'horizontal', progress: ['done', 'current', 'upcoming'], class: 'h-0.5' }
	],
	defaultVariants: {
		orientation: 'vertical',
		color: 'neutral',
		progress: 'none'
	}
});

const defaultMarker = cva({
	base: 'relative z-10 grid shrink-0 place-items-center rounded-full bg-surface text-color-readable ring-1 ring-selected/45 shadow-[0_0_0_3px_var(--color-surface)] [&>svg]:size-[58%] [&_[data-slot=timeline-dot]]:block [&_[data-slot=timeline-dot]]:size-[38%] [&_[data-slot=timeline-dot]]:rounded-full [&_[data-slot=timeline-dot]]:bg-color',
	variants: {
		size: {
			small: 'size-3.5',
			normal: 'size-[1.125rem]',
			large: 'size-[1.375rem]'
		},
		color: colorVariants,
		// A done step is filled with its check, the current one ringed around its point, an
		// upcoming one a quiet ring around its step number. The number is a glyph drawn to the
		// marker, like the check, so it scales with the marker size rather than the type ramp.
		progress: {
			none: '',
			done: 'bg-color text-color-contrast ring-color',
			current: 'ring-2 ring-color',
			upcoming:
				'text-neutral/70 ring-neutral-muted font-medium leading-none tabular-nums text-[length:calc(var(--timeline-marker-size)*0.55)]'
		}
	},
	defaultVariants: {
		size: 'normal',
		color: 'neutral',
		progress: 'none'
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
			card: 'rounded-lg bg-surface-raised text-neutral raised-1',
			outline: 'rounded-lg bg-transparent text-neutral ring-1 ring-color',
			soft: 'rounded-lg bg-color-muted text-color-muted-readable'
		},
		density: {
			compact: '',
			normal: '',
			comfortable: ''
		},
		color: colorVariants,
		selectable: {
			true: pointerPassThrough,
			false: ''
		},
		// The item's selection button is enabled: its hover and press tint this surface through the
		// state layer, and its keyboard focus rings it.
		interactive: {
			true: 'state-layer peer-hover/timeline-item-button:before:opacity-[var(--state-hover-opacity)] peer-active/timeline-item-button:before:opacity-[var(--state-pressed-opacity)] peer-focus-visible/timeline-item-button:ring-2 peer-focus-visible/timeline-item-button:ring-focus/50',
			false: ''
		},
		// The shared soft selected recipe (`selectedSoft` in `Theme/theme.recipes.ts`).
		selected: {
			true: 'bg-selected-muted text-selected-muted-readable',
			false: ''
		}
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
		{ variant: ['card', 'outline', 'soft'], density: 'compact', class: 'p-lg' },
		{ variant: ['card', 'outline', 'soft'], density: 'normal', class: 'p-xl' },
		{ variant: ['card', 'outline', 'soft'], density: 'comfortable', class: 'p-layout-sm' },
		// A selectable ghost item gets a surface for its hover, selection and focus ring. It reaches
		// `sm` toward the axis and `xs` above and below, so the text stays where it was.
		{ variant: 'ghost', selectable: true, class: 'rounded-md px-sm py-xs' },
		{ orientation: 'vertical', variant: 'ghost', selectable: true, class: '-my-xs' },
		{
			orientation: 'vertical',
			placement: 'end',
			variant: 'ghost',
			selectable: true,
			class: '-ms-sm'
		},
		{
			orientation: 'vertical',
			placement: 'start',
			variant: 'ghost',
			selectable: true,
			class: '-me-sm'
		},
		{
			orientation: 'vertical',
			placement: 'alternate',
			side: 'end',
			variant: 'ghost',
			selectable: true,
			class: '-ms-sm'
		},
		{
			orientation: 'vertical',
			placement: 'alternate',
			side: 'start',
			variant: 'ghost',
			selectable: true,
			class: '-me-sm @max-[40rem]:me-0 @max-[40rem]:-ms-sm'
		},
		{ orientation: 'horizontal', variant: 'ghost', selectable: true, class: '-ms-sm' },
		// A selected surface also rings in the selected role, so it still reads as selected where the
		// selected fill matches the variant's own surface (a soft item in the selected role).
		{ variant: ['card', 'outline', 'soft'], selected: true, class: 'ring-2 ring-selected' }
	],
	defaultVariants: {
		orientation: 'vertical',
		placement: 'end',
		side: 'end',
		variant: 'ghost',
		density: 'normal',
		color: 'neutral',
		selectable: false,
		interactive: false,
		selected: false
	}
});

const defaultDate = cva({
	base: 'block leading-normal tabular-nums',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		density: {
			compact: '',
			normal: '',
			comfortable: ''
		},
		placement: {
			start: 'text-neutral/70',
			end: 'text-neutral/70',
			alternate: 'text-neutral/70'
		},
		variant: {
			ghost: '',
			card: '',
			outline: '',
			soft: 'text-color-muted-readable'
		},
		selected: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [
		{ placement: ['start', 'end'], density: 'compact', class: 'mb-xs' },
		{ placement: ['start', 'end'], density: 'normal', class: 'mb-sm' },
		{ placement: ['start', 'end'], density: 'comfortable', class: 'mb-md' },
		{ selected: true, class: 'text-selected-muted-readable/70' }
	],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		placement: 'end',
		variant: 'ghost',
		selected: false
	}
});

const defaultTitleRow = cva({
	base: 'flex min-w-0 items-start'
});

const defaultTitle = cva({
	base: 'min-w-0 font-medium leading-snug',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-sm',
			large: 'text-base'
		},
		variant: {
			ghost: 'text-neutral',
			card: 'text-neutral',
			outline: 'text-neutral',
			soft: 'text-color-muted-readable'
		},
		selected: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [{ selected: true, class: 'text-selected-muted-readable' }],
	defaultVariants: {
		size: 'normal',
		variant: 'ghost',
		selected: false
	}
});

const defaultDescription = cva({
	base: 'leading-relaxed',
	variants: {
		size: {
			small: 'text-xs',
			normal: 'text-xs',
			large: 'text-sm'
		},
		density: {
			compact: 'mt-xs',
			normal: 'mt-sm',
			comfortable: 'mt-md'
		},
		variant: {
			ghost: 'text-neutral/70',
			card: 'text-neutral/70',
			outline: 'text-neutral/70',
			soft: 'text-color-muted-readable'
		},
		selected: {
			true: '',
			false: ''
		}
	},
	compoundVariants: [{ selected: true, class: 'text-selected-muted-readable/70' }],
	defaultVariants: {
		size: 'normal',
		density: 'normal',
		variant: 'ghost',
		selected: false
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
	itemButton: defaultItemButton,
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
