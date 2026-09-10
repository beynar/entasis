import type { HTMLAttributes } from 'svelte/elements';
import type { Colors, Sizes } from '$lib/types/theme.js';
import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { WithSlot } from '$lib/components/Slot/slot.js';
import type { MiniCalendarThemeProps } from './miniCalendar.theme.js';

/** Payload passed to the custom `day` slot for each rendered day cell. */
export type MiniCalendarDayPayload = {
	/** The date this cell represents (normalized to noon). */
	date: Date;
	/** Whether this cell matches the selected `value` (compared by year/month/day). */
	selected: boolean;
	/** Whether this cell is today. */
	today: boolean;
	/** Short localized month label shown above the number (e.g. "Jul"). */
	monthLabel: string;
	/** Day-of-month number shown below the month label (e.g. 11). */
	dayNumber: number;
};

export type MiniCalendarProps = WithAttachments<
	WithSlot<
		HTMLAttributes<HTMLDivElement> & {
			/** The selected date; compared by year/month/day. Bindable. */
			value?: Date | null;
			/** Initial selected date when `value` is omitted. Later default changes are ignored. */
			defaultValue?: Date | null;
			/** The first visible day of the strip; navigation shifts it by `days`. Bindable; defaults to today. */
			startDate?: Date;
			/** Number of day cells shown at once. */
			days?: number;
			/** Size token controlling cell dimensions, gaps and typography. */
			size?: Sizes;
			/** Accent color of the selected day and today highlight. */
			color?: Colors;
			/** Disables navigation and day selection entirely. */
			disabled?: boolean;
			/** BCP-47 locale for the month labels and date aria-labels; defaults to the active i18n catalog's locale. */
			locale?: string;
			/** Per-instance i18n overrides merged over the global catalog. */
			i18n?: Partial<Messages>;
			/** Reading direction override; in `rtl` the strip order and chevrons mirror. */
			dir?: 'ltr' | 'rtl';
			/** The class name of the root pill container. First element the component outputs in the DOM. */
			class?: string;
			/** Bindable reference to the root container element. */
			ref?: HTMLElement | null;
			/** Called once when a day selection changes the value. Repeated and external selections are silent. */
			onValueChange?: (date: Date) => void;
			/** Called with the new start date when the chevrons shift the visible range. */
			onStartDateChange?: (startDate: Date) => void;
			/** Theme overrides for the root, navButton, days, day, dayMonth and dayNumber parts. */
			theme?: MiniCalendarThemeProps;
		},
		'day',
		MiniCalendarDayPayload
	>
>;
