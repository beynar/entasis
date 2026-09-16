import type { Placement } from '@floating-ui/dom';
import type { Messages } from '$lib/i18n/en.js';
import type { PopoverProps } from '$lib/components/Popover/popover.props.js';
import type { InferComponentTheme } from '$lib/utils/cva/index.js';
import type { InputProps } from '../Field/field.js';
import type { fieldTheme } from '../Field/field.theme.js';
import type { CalendarThemeProps } from '../Calendar/calendar.theme.js';
import type { DateSelectorThemeProps } from './dateSelector.theme.js';

export type DateSelectorMode = 'date' | 'range' | 'multiple';

export type DateSelectorValue<Mode extends DateSelectorMode> = Mode extends 'date'
	? Date | null
	: Mode extends 'range'
		? [Date | null, Date | null] | null
		: Date[];

export type DateSelectorPreset<Mode extends DateSelectorMode = DateSelectorMode> = {
	/** Text shown in the preset list. */
	label: string;
	/** Selection applied when the preset is activated. */
	value: DateSelectorValue<Mode>;
};

export type DateSelectorProps<Mode extends DateSelectorMode = 'date'> = {
	/** Selection model used by the calendar. */
	mode?: Mode;
	/** Current selected date, range, or date list. */
	value?: DateSelectorValue<Mode>;
	/** Initial selection when `value` is omitted. */
	defaultValue?: DateSelectorValue<Mode>;
	/** Controls the selector popover. */
	open?: boolean;
	/** Initial popover state when open is omitted. */
	defaultOpen?: boolean;
	/** Called once when the selector opens or closes through interaction. */
	onOpenChange?: (open: boolean) => void;
	/** Closes the popover after a complete selection. Defaults to false. */
	closeOnSelect?: boolean;
	/** Optional shortcuts rendered beside the calendar. */
	presets?: readonly DateSelectorPreset<Mode>[];
	/** Popover trigger snippet, trigger button props, or false to render no trigger. */
	trigger?: PopoverProps['trigger'];
	/** Preferred popover placement. */
	position?: Placement;
	/** Gap between the trigger and selector panel. */
	offset?: number;
	/** Renders the popover as a bottom sheet below 768px. */
	mobileSheet?: boolean;
	/** Shows one month or two months side by side. */
	view?: 'single' | 'double';
	/** When true, weeks begin on Monday. */
	weekStartsOnMonday?: boolean;
	/** Weekday label length. */
	weekdayLength?: 'narrow' | 'short';
	/** Locale used by month, weekday, and accessible date labels. */
	locale?: string;
	/** Earliest selectable date. */
	minDate?: Date;
	/** Latest selectable date. */
	maxDate?: Date;
	/** Individual dates or inclusive date ranges that cannot be selected. */
	disabledDates?: (Date | [Date, Date])[];
	/** Disables calendar and default-trigger interaction. */
	disabled?: boolean;
	/** Accessible label for the calendar. */
	calendarLabel?: string;
	/** Stable id for the selector popover. */
	id?: string;
	/** Additional class applied to the popover panel. */
	class?: string;
	/** Called whenever the selected value changes. */
	onValueChange?: (value: DateSelectorValue<Mode>) => void;
	/** Per-instance DateSelector theme overrides. */
	theme?: DateSelectorThemeProps;
	/** Per-instance Calendar theme overrides. */
	calendarTheme?: CalendarThemeProps;
	/** Per-instance i18n overrides merged over the global catalog. */
	i18n?: Partial<Messages>;
};

/** Selection modes representable as form field values ('multiple' has no field type). */
export type DateSelectorInputMode = 'date' | 'range';

type DateSelectorFieldType<Mode extends DateSelectorInputMode> = Mode extends 'date'
	? 'date'
	: 'calendar-range';

/**
 * The DateSelector popover wrapped in field chrome (label, description, errors,
 * form registration) — the raw popover stays available as `DateSelector`.
 */
export type DateSelectorInputProps<Mode extends DateSelectorInputMode = 'date'> = Omit<
	DateSelectorProps<Mode>,
	'value' | 'defaultValue' | 'onValueChange' | 'disabled' | 'class' | 'theme'
> &
	Omit<InputProps<DateSelectorFieldType<Mode>>, 'theme'> & {
		/** Theme overrides for the selector popover and its field wrapper. */
		theme?: {
			/** Theme overrides for the selector popover parts. */
			selector?: DateSelectorThemeProps;
			/** Theme overrides for the surrounding field. */
			field?: InferComponentTheme<typeof fieldTheme>;
		};
	};
