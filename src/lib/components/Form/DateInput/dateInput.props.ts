import type { InputProps } from '../Field/field.js';
import type { DateInputThemeProps } from './dateInput.theme.js';
import type { DateInputType } from '../Field/field.js';
import type { DateSelectorPreset } from '../DateSelector/dateSelector.props.js';

export type DateFormat =
	'dd/mm/yyyy' | 'mm/dd/yyyy' | 'mm/yy' | 'mm/yyyy' | 'yyyy' | 'yyyy/mm' | 'yyyy/mm/dd';

export type DateInputProps = InputProps<'date' | 'datetime'> & {
	/** Logical date input type and validation schema used by FieldState. */
	type?: DateInputType;
	/** Hint text shown in the empty date input; defaults to the format prop. */
	placeholder?: string;
	/** Date mask pattern controlling input masking and value parsing (e.g. dd/mm/yyyy). */
	format?: DateFormat;
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
