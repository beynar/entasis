import type { InputProps } from '../Field/field.js';
import type { TimeInputThemeProps } from './timeInput.theme.js';
import type { MaskitoTimeParams } from '@maskito/kit';

export type TimeInputProps = InputProps<'time'> & {
	/** Placeholder text shown in the masked input; defaults to the `format` string. */
	placeholder?: string;
	/** Unit for the numeric value: minutes, seconds, or milliseconds since midnight. */
	as?: 'minuteSinceMidnight' | 'secondSinceMidnight' | 'millisecondSinceMidnight';
	/** Maskito time format mode (e.g. `HH:MM`, `HH:MM:SS`) controlling display and parsing. */
	format?: MaskitoTimeParams['mode'];
	/** Upper bounds for each time segment passed to the Maskito time mask. */
	maxValues?: MaskitoTimeParams['timeSegmentMaxValues'];
	/** Lower bounds for each time segment passed to the Maskito time mask. */
	minValues?: MaskitoTimeParams['timeSegmentMinValues'];
	/** Theme overrides for the time input and its field container. */
	theme?: TimeInputThemeProps & InputProps<'time'>['theme'];
};
