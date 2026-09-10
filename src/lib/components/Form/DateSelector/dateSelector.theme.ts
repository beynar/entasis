import { cva, type InferComponentTheme } from '$lib/utils/cva/index.js';
import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';

const defaultPopover = cva({
	base: 'w-auto max-w-[calc(100vw-2rem)] overflow-hidden p-0'
});

const defaultRoot = cva({
	base: 'grid max-w-full items-stretch',
	variants: {
		withPresets: {
			true: 'sm:grid-cols-[9rem_minmax(0,1fr)]',
			false: 'grid-cols-1'
		},
		view: {
			single: '',
			double: ''
		}
	},
	compoundVariants: [
		{ withPresets: false, view: 'single', class: 'w-[18rem]' },
		{ withPresets: true, view: 'single', class: 'w-[28rem]' },
		{ withPresets: false, view: 'double', class: 'w-[36rem]' },
		{ withPresets: true, view: 'double', class: 'w-[46rem]' }
	],
	defaultVariants: {
		withPresets: false,
		view: 'single'
	}
});

const defaultPresets = cva({
	base: 'border-neutral-muted flex flex-wrap content-start gap-xs border-b p-md sm:flex-col sm:border-r sm:border-b-0'
});

const defaultPreset = cva({
	base: 'justify-start text-left'
});

const defaultCalendar = cva({
	base: 'min-w-0 rounded-none border-0 bg-transparent'
});

export const dateSelectorTheme = {
	popover: defaultPopover,
	root: defaultRoot,
	presets: defaultPresets,
	preset: defaultPreset,
	calendar: defaultCalendar
};

export type DateSelectorTheme = typeof dateSelectorTheme;
export type DateSelectorThemeProps = InferComponentTheme<DateSelectorTheme>;
export const setDateSelectorTheme = setComponentTheme<DateSelectorTheme>('dateSelector');
export const useDateSelectorTheme = useComponentTheme<DateSelectorTheme>(
	'dateSelector',
	dateSelectorTheme
);
