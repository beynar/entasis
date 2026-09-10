import {
	cva,
	setComponentTheme,
	type InferComponentTheme,
	useComponentTheme
} from '$lib/utils/cva/index.js';

type DensityClasses = Record<'small' | 'normal' | 'large', string>;

const densityVariants: DensityClasses = {
	small: '',
	normal: '',
	large: ''
};

const eventCalendarVariants = {
	density: densityVariants,
	color: {
		primary: '',
		secondary: '',
		danger: '',
		success: '',
		warning: '',
		info: '',
		neutral: ''
	},
	view: {
		month: '',
		week: '',
		day: '',
		days: '',
		agenda: '',
		resource: ''
	},
	selected: { true: 'ring-2 ring-color/60', false: '' },
	dragging: { true: 'cursor-grabbing opacity-70', false: '' },
	invalid: { true: 'cursor-not-allowed', false: '' },
	disabled: { true: '', false: '' },
	recurring: { true: 'border-dashed', false: '' },
	today: { true: 'bg-color-muted/30', false: '' },
	outside: { true: 'text-neutral/70', false: '' },
	offDay: { true: 'bg-surface-recessed/70', false: '' },
	display: { auto: '', background: 'pointer-events-none opacity-40' },
	isStart: { true: '', false: 'rounded-s-none' },
	isEnd: { true: '', false: 'rounded-e-none' },
	continuesBefore: { true: 'border-s-2 border-s-[var(--event-calendar-item-color)]', false: '' },
	continuesAfter: { true: 'border-e-2 border-e-[var(--event-calendar-item-color)]', false: '' }
} as const;

const defaultVariants = {
	density: 'normal',
	color: 'primary',
	view: 'month',
	selected: false,
	dragging: false,
	invalid: false,
	disabled: false,
	recurring: false,
	today: false,
	outside: false,
	offDay: false,
	display: 'auto',
	isStart: true,
	isEnd: true,
	continuesBefore: false,
	continuesAfter: false
} as const;

function createEventCalendarPart(base: string, density: DensityClasses = densityVariants) {
	return cva({
		base,
		variants: { ...eventCalendarVariants, density },
		defaultVariants
	});
}

const root = createEventCalendarPart(
	'relative isolate flex min-w-0 flex-col rounded-md border border-neutral-muted/80 bg-surface text-neutral motion-reduce:scroll-auto motion-reduce:[&_*]:!transition-none motion-reduce:[&_*]:!animate-none data-[interaction-kind]:[&_[data-event-calendar-part=resize-handle]]:!opacity-0 [container-type:inline-size] [--event-calendar-slot-height:3rem] [--event-calendar-time-gutter-width:4rem] [--event-calendar-day-min-width:8rem] [--event-calendar-month-day-min-width:4.5rem] [--event-calendar-resource-min-width:10rem] [--event-calendar-item-min-height:1.5rem] [--event-calendar-sticky-offset:0px] [--event-calendar-item-color:var(--color)]',
	{
		small:
			'[--event-calendar-slot-height:2.5rem] [--event-calendar-time-gutter-width:3.5rem] [--event-calendar-item-min-height:1.5rem]',
		normal: '',
		large:
			'[--event-calendar-slot-height:3.5rem] [--event-calendar-time-gutter-width:4.5rem] [--event-calendar-item-min-height:1.75rem]'
	}
);
const header = createEventCalendarPart(
	'flex min-w-0 flex-wrap items-center border-b border-neutral-muted bg-surface-raised @max-[32rem]:items-start',
	{
		small: 'gap-sm p-md',
		normal: 'gap-md p-lg',
		large: 'gap-lg p-xl'
	}
);
const navigation = createEventCalendarPart('flex shrink-0 items-center', {
	small: 'gap-xs',
	normal: 'gap-sm',
	large: 'gap-md'
});
const title = createEventCalendarPart(
	'min-w-0 flex-1 truncate font-semibold @max-[32rem]:order-3 @max-[32rem]:w-full @max-[32rem]:basis-full',
	{
		small: 'text-sm',
		normal: 'text-base',
		large: 'text-lg'
	}
);
const viewSwitcher = createEventCalendarPart('ms-auto shrink-0');
const actions = createEventCalendarPart('flex shrink-0 items-center', {
	small: 'gap-xs',
	normal: 'gap-md',
	large: 'gap-lg'
});
const content = createEventCalendarPart('relative min-h-0 flex-1');
const viewport = createEventCalendarPart('relative h-full min-h-0 w-full');
const loading = createEventCalendarPart(
	'absolute inset-0 z-50 grid place-items-center bg-surface/75 backdrop-blur-[1px]'
);
const empty = createEventCalendarPart('text-center text-neutral/70', {
	small: 'p-md text-xs',
	normal: 'p-lg text-sm',
	large: 'p-xl text-base'
});

const month = createEventCalendarPart('relative flex h-full min-w-0 flex-col overflow-x-auto');
const monthHeader = createEventCalendarPart(
	'grid shrink-0 border-b border-neutral-muted/70 bg-surface/95'
);
const dayHeader = createEventCalendarPart(
	'min-w-0 truncate px-xs py-sm text-center font-medium text-neutral/60',
	{
		small: 'text-[0.6875rem]',
		normal: 'text-xs',
		large: 'py-md text-sm'
	}
);
const monthGrid = createEventCalendarPart(
	'grid min-h-0 min-w-0 flex-1 auto-rows-[minmax(6rem,1fr)]'
);
const weekRow = createEventCalendarPart('relative grid min-h-24 min-w-0');
const weekNumber = createEventCalendarPart('grid place-items-center text-center text-neutral/70', {
	small: 'text-[0.625rem]',
	normal: 'text-xs',
	large: 'text-sm'
});
const monthCell = createEventCalendarPart(
	'relative min-w-0 cursor-default overflow-visible border-e border-b border-neutral-muted/70 outline-none'
);
const dayNumber = createEventCalendarPart(
	'm-xs inline-flex min-h-6 min-w-6 items-center justify-center rounded-full text-xs font-medium text-neutral/65 tabular-nums'
);
const barLayer = createEventCalendarPart('pointer-events-none absolute inset-0 min-w-0');

const timeGrid = createEventCalendarPart('relative min-h-full min-w-0');
const timeHeader = createEventCalendarPart('grid bg-surface-raised');
const timeGutter = createEventCalendarPart(
	'relative w-[var(--event-calendar-time-gutter-width)] shrink-0 border-e border-neutral-muted bg-surface'
);
const timeLabel = createEventCalendarPart(
	'block whitespace-nowrap pe-md text-end text-xs text-neutral/75 tabular-nums'
);
const allDayRow = createEventCalendarPart('relative grid border-b border-neutral-muted bg-surface');
const allDayCell = createEventCalendarPart(
	'relative min-w-0 border-e border-neutral-muted outline-none'
);
const dayColumn = createEventCalendarPart(
	'relative min-w-[var(--event-calendar-day-min-width)] border-e border-neutral-muted'
);
const timeSlot = createEventCalendarPart(
	'h-[var(--event-calendar-slot-height)] w-full bg-transparent outline-none'
);
const nowIndicator = createEventCalendarPart('pointer-events-none absolute z-30 h-px bg-danger');

const item = createEventCalendarPart(
	'group/item relative min-h-[var(--event-calendar-item-min-height)] min-w-0'
);
const itemControl = createEventCalendarPart(
	'state-layer block h-full min-h-6 w-full min-w-0 rounded-sm border border-[color-mix(in_oklab,var(--event-calendar-item-color)_24%,transparent)] bg-[color-mix(in_oklab,var(--event-calendar-item-color)_10%,var(--color-surface))] px-sm py-0 text-start text-neutral/90 outline-none focus-visible:ring-2 focus-visible:ring-color/50'
);
const itemContent = createEventCalendarPart(
	'flex h-full min-w-0 items-center gap-xs overflow-hidden'
);
const itemTitle = createEventCalendarPart('min-w-0 truncate text-xs font-medium leading-4');
const itemTime = createEventCalendarPart(
	'ms-auto shrink-0 truncate text-[0.6875rem] leading-4 text-neutral/55 tabular-nums'
);
const overflow = createEventCalendarPart(
	'state-layer min-h-6 w-full truncate rounded-sm px-xs text-start text-xs font-medium text-neutral outline-none focus-visible:ring-2 focus-visible:ring-color/60'
);
const overflowPopover = createEventCalendarPart('min-w-56 max-w-80 p-md');
const dragPreview = createEventCalendarPart(
	'pointer-events-none z-50 -translate-x-1/2 translate-y-3 rounded-sm border border-neutral-muted bg-surface-floating px-md py-xs text-xs text-neutral/85 shadow-md opacity-90'
);
const dropIndicator = createEventCalendarPart(
	'pointer-events-none z-40 rounded-sm border border-dashed border-[color-mix(in_oklab,var(--event-calendar-item-color)_55%,transparent)] bg-[color-mix(in_oklab,var(--event-calendar-item-color)_8%,transparent)]'
);
const slotSelection = createEventCalendarPart(
	'pointer-events-none z-20 rounded-sm border border-dashed border-[color-mix(in_oklab,var(--color)_55%,transparent)] bg-[color-mix(in_oklab,var(--color)_8%,transparent)]'
);
const resizeHandle = createEventCalendarPart(
	'absolute z-30 touch-none text-neutral/45 opacity-0 outline-none transition-opacity duration-100 group-hover/item:opacity-100 focus-visible:ring-2 focus-visible:ring-color'
);
const agenda = createEventCalendarPart('relative min-w-0 bg-surface');
const agendaDay = createEventCalendarPart('border-b border-neutral-muted/70 last:border-b-0');
const agendaItem = createEventCalendarPart('min-w-0 bg-surface');
const agendaDetails = createEventCalendarPart('min-w-0 text-neutral/70');
const resourceHeader = createEventCalendarPart(
	'min-w-[var(--event-calendar-resource-min-width)] truncate font-medium'
);

export const eventCalendarTheme = {
	root,
	header,
	navigation,
	title,
	viewSwitcher,
	actions,
	content,
	viewport,
	loading,
	empty,
	month,
	monthHeader,
	dayHeader,
	monthGrid,
	weekRow,
	weekNumber,
	monthCell,
	dayNumber,
	barLayer,
	timeGrid,
	timeHeader,
	timeGutter,
	timeLabel,
	allDayRow,
	allDayCell,
	dayColumn,
	timeSlot,
	nowIndicator,
	item,
	itemControl,
	itemContent,
	itemTitle,
	itemTime,
	overflow,
	overflowPopover,
	dragPreview,
	dropIndicator,
	slotSelection,
	resizeHandle,
	agenda,
	agendaDay,
	agendaItem,
	agendaDetails,
	resourceHeader
};

export type EventCalendarTheme = typeof eventCalendarTheme;
export type EventCalendarThemeProps = InferComponentTheme<EventCalendarTheme>;
export const setEventCalendarTheme = setComponentTheme<EventCalendarTheme>('eventCalendar');
export const useEventCalendarTheme = useComponentTheme<EventCalendarTheme>(
	'eventCalendar',
	eventCalendarTheme
);
export type EventCalendarClasses = ReturnType<typeof useEventCalendarTheme>;
