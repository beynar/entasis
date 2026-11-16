import type { InputProps } from '../Field/field.js';
import type { DateInputThemeProps } from './dateInput.theme.js';
import type { DateInputType } from '../Field/field.js';
import type { DateSelectorPreset } from '../DateSelector/dateSelector.props.js';
import type { CalendarGranularity } from '../Calendar/calendar.periods.js';

export type { DateFormat, DateOnlyFormat, DateTimeFormat } from './dateInput.format.js';
import type { DateFormat } from './dateInput.format.js';

export type DateInputProps = InputProps<'date' | 'datetime'> & {
	/** Logical date input type and validation schema used by FieldState. */
	type?: DateInputType;
	/**
	 * Period the value stands for: `'day'` (default), `'week'`, `'month'` or `'year'`. The value is
	 * that period's first day at midnight (in `timeZone`), and the calendar popup picks with the
	 * same granularity. The default mask follows it: a month is typed `mm/yyyy` (`yyyy/mm` in
	 * year-first locales), a year `yyyy`, and a week as any of its days (`dd/mm/yyyy`), shown on
	 * blur as the week's first day with its ISO week number beside it. Any typed date is moved to
	 * the start of its period. A granularity other than `'day'` edits no hour.
	 */
	granularity?: CalendarGranularity;
	/** When true (default), weeks begin on Monday; otherwise on Sunday. */
	weekStartsOnMonday?: boolean;
	/** Hint text shown in the empty date input; defaults to the format prop. */
	placeholder?: string;
	/**
	 * Mask controlling input masking and value parsing (e.g. `dd/mm/yyyy`). A format ending in
	 * ` HH:MM` also edits the hour and minutes. Defaults to `dd/mm/yyyy`, or `dd/mm/yyyy HH:MM`
	 * when `type` is `datetime`. Editing only the day of a `datetime` keeps its hour.
	 */
	format?: DateFormat;
	/**
	 * IANA time zone the day and hour are shown and typed in (e.g. `Europe/Paris`), whatever the
	 * browser's zone. The value stays the same instant. Defaults to the browser's zone.
	 */
	timeZone?: string;
	/** Locale identifier for date formatting. */
	locale?: string;
	/** Separator character between date segments. */
	separator?: string;
	/** Optional date shortcuts shown beside the calendar. */
	presets?: readonly DateSelectorPreset<'date'>[];
	/** Individual dates or inclusive ranges that cannot be selected from the calendar. */
	disabledDates?: (Date | [Date, Date])[];
	/** Earliest date selectable from the calendar. */
	minDate?: Date;
	/** Latest date selectable from the calendar. */
	maxDate?: Date;
	/** Shows one or two months in the selector popover. */
	calendarView?: 'single' | 'double';
	/** Renders the selector popover as a bottom sheet below 768px. */
	mobileSheet?: boolean;
	/** Closes the calendar popover after selecting a date. Defaults to false. */
	closeOnSelect?: boolean;
	/** Fires only when a date is picked from the calendar or its presets. */
	onSelect?: (value: Date | null) => void;
	/** Theme overrides for the date input element and its field container. */
	theme?: DateInputThemeProps & InputProps<'date' | 'datetime'>['theme'];
};
