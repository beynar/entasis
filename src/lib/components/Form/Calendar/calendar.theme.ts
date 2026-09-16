import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
import { selectedSoft } from '$lib/components/Theme/theme.recipes.js';

const defaultContainer = cva({
	base: 'flex w-full flex-col gap-lg rounded-lg border border-neutral-muted bg-surface-raised p-md'
});

const defaultHeader = cva({
	base: 'flex min-h-row-sm items-center gap-md px-xs font-semibold text-neutral',
	variants: {
		picker: {
			true: 'justify-center',
			false: 'justify-between'
		}
	},
	defaultVariants: {
		picker: false
	}
});

const defaultViewTrigger = cva({
	base: 'min-w-0 max-w-full px-md font-semibold'
});

const defaultViewport = cva({
	base: 'relative grid overflow-hidden'
});

const defaultViewPanel = cva({
	base: 'col-start-1 row-start-1 min-w-0 w-full'
});

const defaultMonths = cva({
	base: 'col-start-1 row-start-1 grid min-w-0 gap-lg',
	variants: {
		view: {
			single: 'grid-cols-1',
			double: 'grid-cols-2'
		}
	},
	defaultVariants: {
		view: 'single'
	}
});

const defaultGrid = cva({
	base: 'grid min-w-0 grid-cols-7 gap-micro'
});

const defaultPicker = cva({
	base: 'grid min-h-0 grid-cols-2 gap-md'
});

const defaultPickerColumn = cva({
	base: 'grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-xs'
});

const defaultPickerLabel = cva({
	base: 'px-md text-center text-xs font-medium text-neutral/70'
});

const defaultPickerScrollArea = cva({
	base: 'flex h-48 min-h-0 flex-col'
});

const defaultPickerOptions = cva({
	base: 'flex min-w-0 flex-col gap-micro p-micro'
});

const defaultPickerOption = cva({
	base: 'state-layer w-full cursor-pointer rounded-sm px-md py-sm text-center text-sm text-neutral outline-none transition-colors focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-not-allowed disabled:opacity-50',
	variants: {
		selected: {
			true: `${selectedSoft} font-semibold`,
			false: null
		},
		disabled: {
			true: 'pointer-events-none',
			false: null
		}
	}
});

const defaultWeekday = cva({
	base: 'text-center text-xs font-medium text-neutral/70 uppercase py-md'
});

const defaultDay = cva({
	base: 'state-layer relative flex aspect-square max-h-10 w-full cursor-pointer items-center justify-center rounded-sm text-sm ring-inset outline-none transition-colors hover:z-[1] hover:ring-2 hover:ring-primary focus-visible:z-[2] focus-visible:ring-2 focus-visible:ring-focus/50 disabled:cursor-not-allowed disabled:opacity-50',
	variants: {
		selected: {
			true: `${selectedSoft} font-semibold`
		},
		inMonth: {
			true: 'text-neutral',
			false: 'text-neutral/70'
		},
		inRange: {
			true: selectedSoft
		},
		today: {
			true: ''
		},
		disabled: {
			true: 'opacity-50 cursor-not-allowed'
		},
		startOfRange: {
			true: `relative rounded-r-none after:content-["|"] after:text-primary-muted-readable after:text-sm after:font-semibold after:absolute after:left-0 after:top-1/2 after:-translate-y-1/2`
		},
		endOfRange: {
			true: `relative rounded-l-none after:content-["|"] after:text-primary-muted-readable after:text-sm after:font-semibold after:absolute after:right-0 after:top-1/2 after:-translate-y-1/2`
		},
		isPast: {
			true: ''
		}
	},
	compoundVariants: [
		{
			inRange: true,
			startOfRange: false,
			endOfRange: false,
			class: 'scale-x-105 rounded-none'
		}
	]
});

export const calendarTheme = {
	root: defaultContainer,
	header: defaultHeader,
	viewTrigger: defaultViewTrigger,
	viewport: defaultViewport,
	viewPanel: defaultViewPanel,
	months: defaultMonths,
	grid: defaultGrid,
	picker: defaultPicker,
	pickerColumn: defaultPickerColumn,
	pickerLabel: defaultPickerLabel,
	pickerScrollArea: defaultPickerScrollArea,
	pickerOptions: defaultPickerOptions,
	pickerOption: defaultPickerOption,
	weekday: defaultWeekday,
	day: defaultDay
};

export type CalendarTheme = typeof calendarTheme;
export type CalendarThemeProps = InferComponentTheme<CalendarTheme>;
export const setCalendarInputTheme = setComponentTheme<CalendarTheme>('calendar');
export const useCalendarInputTheme = useComponentTheme<CalendarTheme>('calendar', calendarTheme);
