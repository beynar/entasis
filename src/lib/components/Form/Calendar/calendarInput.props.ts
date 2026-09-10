import type { InputProps } from '../Field/field.js';
import type { fieldTheme } from '../Field/field.theme.js';
import type { InferComponentTheme } from '$lib/utils/cva/index.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { ButtonProps } from '$lib/components/Button/index.js';
import type { Snippet } from 'svelte';
import type { Event, CalendarType, CalendarValue, CalendarWeekday } from './useCalendar.svelte.js';
import type { calendarTheme } from './calendar.theme.js';
import type { ChipProps } from '$lib/components/Chip/chip.props.js';

// Re-export types and values from useCalendar
export type {
	Event,
	Cell,
	CalendarType,
	CalendarValue,
	CalendarWeekday
} from './useCalendar.svelte.js';
export { CalendarState } from './useCalendar.svelte.js';

export type CalendarPrimitiveProps<
	E extends Event,
	T extends CalendarType
> = BaseCalendarProps<E> & {
	/** Selection model used by the calendar. */
	type: T;
	/** Current selection for the chosen calendar type. */
	value?: CalendarValue<T>;
	/** Initial selection when `value` is omitted. */
	defaultValue?: CalendarValue<T>;
	/** Called whenever the calendar selection changes. */
	onValueChange?: (value: CalendarValue<T>) => void;
};

export type BaseCalendarProps<E extends Event> = WithSlot<
	{
		/** Events associated with calendar dates. */
		events?: E[];
		/** Legacy Monday/Sunday toggle, used when `weekStartsOn` is not provided. */
		weekStartsOnMonday?: boolean;
		/** Explicit first weekday. When provided, this takes precedence over `weekStartsOnMonday`. */
		weekStartsOn?: CalendarWeekday;
		/** Date marked as today. Defaults to the host-local current day. */
		today?: Date;
		/** Locale used for month, weekday, and accessible day labels. */
		locale?: string;
		/** Accessible label applied to the calendar group. Visible month grids use their month and year. */
		ariaLabel?: string;
		/** Disables navigation, focus, and date selection. */
		disabled?: boolean;
		/** Earliest date that can be selected. */
		minDate?: Date;
		/** Latest date that can be selected. */
		maxDate?: Date;
		/** Prefers two months side by side, falling back to one below 576px container width. */
		view?: 'single' | 'double';
		/** Additional CSS classes for the calendar container. */
		class?: string;
		/** Length format for weekday header labels. */
		weekdayLength?: 'narrow' | 'short';
		/** Individual dates or inclusive ranges that cannot be selected. */
		disabledDates?: (Date | [Date, Date])[];
		/** Theme overrides for the calendar component. */
		theme?: InferComponentTheme<typeof calendarTheme>;
		/** Custom snippet renderer for each day cell. */
		cell?: Snippet<[import('./useCalendar.svelte.js').Cell]>;
		/** Chip props applied to mark the current day. */
		todayBadge?: Pick<ChipProps, 'size' | 'color' | 'class'>;
		/** Button props for month navigation, shared or split per direction. */
		buttons?:
			| {
					/** Props for the previous-month button. */
					prev: ButtonProps;
					/** Props for the next-month button. */
					next: ButtonProps;
			  }
			| ButtonProps;
		/** Called after the visible month changes through pointer, keyboard, or controlled-value navigation. */
		onViewChange?: (params: {
			/** Year of the first visible month. */
			startYear: number;
			/** Month index (0–11) of the first visible month. */
			startMonth: number;
			/** Year of the last visible month. */
			endYear: number;
			/** Month index (0–11) of the last visible month. */
			endMonth: number;
		}) => void;
	},
	'header'
>;

export type CalendarInputProps<T extends 'calendar' | 'calendar-range'> = CalendarPrimitiveProps<
	Event,
	T
> &
	Omit<InputProps<T>, 'children' | 'type' | 'theme'> & {
		/** Theme overrides for the calendar and its field wrapper. */
		theme?: {
			/** Theme overrides for the calendar grid. */
			calendar: InferComponentTheme<typeof calendarTheme>;
			/** Theme overrides for the surrounding field. */
			field: InferComponentTheme<typeof fieldTheme>;
		};
	};
