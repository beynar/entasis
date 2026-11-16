import { untrack } from 'svelte';
import { on } from 'svelte/events';
import { SvelteMap, SvelteSet } from 'svelte/reactivity';
import {
	addPeriods,
	getPeriodEnd,
	getPeriodStart,
	getYearPageStart,
	isPeriodDisabled,
	isSamePeriod,
	PERIOD_GRID_COLUMNS,
	PERIOD_PAGE_SIZE,
	type CalendarGranularity
} from './calendar.periods.js';

export type { CalendarGranularity } from './calendar.periods.js';

export type CalendarType = 'calendar' | 'calendar-range' | 'calendar-multiple';
export type CalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type CalendarValue<T extends CalendarType> = T extends 'calendar'
	? Date | null
	: T extends 'calendar-range'
		? [Date | null, Date | null] | null
		: Date[];

export type CalendarValueChangeHandler<T extends CalendarType> = (value: CalendarValue<T>) => void;

export interface Event {
	start: Date;
	end: Date;
	title?: string;
	description?: string;
}

export interface Cell<E extends Event = Event> {
	isStartOfRange: boolean;
	isEndOfRange: boolean;
	visible: boolean;
	isInNextMonth: boolean;
	isInRange: boolean;
	isInPreviousMonth: boolean;
	selected: boolean;
	inMonth: boolean;
	day: number;
	date: Date;
	isToday: boolean;
	events: E[];
	corner: string | null;
	attributes: Record<string, string | number | boolean | undefined>;
	disabled: boolean;
}

export interface Row<E extends Event = Event> {
	cells: Cell<E>[];
	events: E[];
}

/** One month or one year of a month or year grid. */
export interface PeriodCell {
	/** First day of the period. */
	date: Date;
	selected: boolean;
	disabled: boolean;
	isInRange: boolean;
	isStartOfRange: boolean;
	isEndOfRange: boolean;
	/** The period holds today. */
	isCurrent: boolean;
	/** A year shown beside its decade on a year page. */
	outside: boolean;
	attributes: Record<string, string | number | boolean | undefined>;
}

export interface CalendarStateOptions<E extends Event, T extends CalendarType> {
	events?: E[];
	minDate?: Date | null;
	maxDate?: Date | null;
	type?: T;
	/** Period one selection covers. Defaults to `'day'`. */
	granularity?: CalendarGranularity;
	weekStartsOnMonday?: boolean;
	weekStartsOn?: CalendarWeekday;
	today?: Date;
	view?: 'single' | 'double';
	disabledDates?: (Date | [Date, Date])[];
	disabled?: boolean;
	/** Browsing stays possible; selecting a date is refused. */
	readOnly?: boolean;
	locale?: string;
	onValueChange?: CalendarValueChangeHandler<T>;
	value?: CalendarValue<T>;
}

export const createCalendarDate = (year: number, month: number, day: number) => {
	// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Calendar dates are host-local-noon value snapshots; setFullYear preserves years 0-99.
	const date = new Date(0);
	date.setFullYear(year, month, day);
	date.setHours(12, 0, 0, 0);
	return date;
};

export const normalizeCalendarDate = (date: Date) =>
	createCalendarDate(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameCalendarDay = (first: Date, second: Date) =>
	first.getFullYear() === second.getFullYear() &&
	first.getMonth() === second.getMonth() &&
	first.getDate() === second.getDate();

export const getCalendarDateKey = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
		date.getDate()
	).padStart(2, '0')}`;

const parseCalendarDateKey = (dateKey: string) => {
	const [year, month, day] = dateKey.split('-').map(Number);
	return createCalendarDate(year, month - 1, day);
};

const addDays = (date: Date, amount: number) =>
	createCalendarDate(date.getFullYear(), date.getMonth(), date.getDate() + amount);

const addMonths = (date: Date, amount: number) => {
	const targetMonth = date.getMonth() + amount;
	const lastDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();
	return createCalendarDate(date.getFullYear(), targetMonth, Math.min(date.getDate(), lastDay));
};

const addYears = (date: Date, amount: number) => {
	const year = date.getFullYear() + amount;
	const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
	return createCalendarDate(year, date.getMonth(), Math.min(date.getDate(), lastDay));
};

const getFirstValueDate = <T extends CalendarType>(type: T, value?: CalendarValue<T>) => {
	if (!value) return null;
	if (type === 'calendar') return value as Date;
	if (type === 'calendar-range') return (value as [Date | null, Date | null])[0] ?? null;
	return (value as Date[])[0] ?? null;
};

const getElementWithDate = (event: globalThis.Event) =>
	event
		.composedPath()
		.find(
			(target): target is HTMLElement =>
				target instanceof HTMLElement && target.hasAttribute('data-date')
		);

export class CalendarState<E extends Event = Event, T extends CalendarType = 'calendar'> {
	declare type: T | undefined;
	declare value: CalendarValue<T> | undefined;
	declare onValueChange: CalendarValueChangeHandler<T> | undefined;
	view: 'single' | 'double' = 'single';
	granularity: CalendarGranularity = 'day';
	events: E[] = [];
	minDate: Date | null = null;
	maxDate: Date | null = null;
	weekStartsOnMonday = true;
	weekStartsOn: CalendarWeekday | undefined = undefined;
	disabledDates: (Date | [Date, Date])[] = [];
	disabled = false;
	readOnly = false;
	locale: string | undefined;

	today = $state(createCalendarDate(1970, 0, 1));
	date = $state(createCalendarDate(1970, 0, 1));
	focusedDate = $state(createCalendarDate(1970, 0, 1));
	private fallbackToday: Date | null = null;

	resolvedWeekStartsOn = $derived(
		this.weekStartsOn ?? ((this.weekStartsOnMonday ? 1 : 0) satisfies CalendarWeekday)
	);

	currentMonth = $derived(this.date.getMonth());
	currentYear = $derived(this.date.getFullYear());
	nextMonthDate = $derived(createCalendarDate(this.currentYear, this.currentMonth + 1, 1));
	viewKey = $derived(`${this.currentYear}-${this.currentMonth}-${this.view}`);
	/** Whether one cell is a month or a year rather than a day. */
	isPeriodGrid = $derived(this.granularity === 'month' || this.granularity === 'year');
	/** First year shown on a year page. */
	yearPageStart = $derived(getYearPageStart(this.currentYear));
	/** Identity of the month or year page shown, for transitions. */
	pageKey = $derived(
		this.granularity === 'year' ? `years-${this.yearPageStart}` : `months-${this.currentYear}`
	);

	rangeStart = $derived.by(() => {
		if (this.type === 'calendar') return (this.value as Date | null | undefined) ?? null;
		if (this.type === 'calendar-range') {
			return (this.value as [Date | null, Date | null] | null | undefined)?.[0] ?? null;
		}
		return null;
	});

	rangeEnd = $derived.by(() => {
		if (this.type !== 'calendar-range') return null;
		return (this.value as [Date | null, Date | null] | null | undefined)?.[1] ?? null;
	});

	multipleValues = $derived.by(() =>
		this.type === 'calendar-multiple' ? ((this.value as Date[] | undefined) ?? []) : []
	);

	firstSelectedDate = $derived.by(() =>
		getFirstValueDate(this.type ?? ('calendar' as T), this.value)
	);
	rangeComplete = $derived(!!(this.rangeStart && this.rangeEnd));

	displayedMonthLabel = $derived.by(() => {
		const startLabel = this.date.toLocaleDateString(this.locale, {
			month: 'long',
			year: 'numeric'
		});
		if (this.view === 'single') return startLabel;

		const endLabel = this.nextMonthDate.toLocaleDateString(this.locale, {
			month: 'long',
			year: this.currentYear === this.nextMonthDate.getFullYear() ? undefined : 'numeric'
		});
		return `${startLabel} - ${endLabel}`;
	});

	eventsMap = $derived.by(() => {
		const eventsByDate = new SvelteMap<string, E[]>();
		for (const calendarEvent of this.events) {
			let date = normalizeCalendarDate(calendarEvent.start);
			const end = normalizeCalendarDate(calendarEvent.end);
			while (date <= end) {
				const dateKey = getCalendarDateKey(date);
				const events = eventsByDate.get(dateKey) ?? [];
				events.push(calendarEvent);
				eventsByDate.set(dateKey, events);
				date = addDays(date, 1);
			}
		}
		return eventsByDate;
	});

	disabledDateKeys = $derived.by(() => {
		const disabledDateKeys = new SvelteSet<string>();
		for (const disabledDate of this.disabledDates) {
			if (!Array.isArray(disabledDate)) {
				disabledDateKeys.add(getCalendarDateKey(disabledDate));
				continue;
			}

			let date = normalizeCalendarDate(disabledDate[0]);
			const end = normalizeCalendarDate(disabledDate[1]);
			while (date <= end) {
				disabledDateKeys.add(getCalendarDateKey(date));
				date = addDays(date, 1);
			}
		}
		return disabledDateKeys;
	});

	rows = $derived.by(() => this.getCalendarRows(this.date));
	nextMonthRows = $derived.by(() => this.getCalendarRows(this.nextMonthDate, true));
	periodCells = $derived.by(() => this.getPeriodCells());

	constructor(options: CalendarStateOptions<E, T>) {
		const descriptors = Object.getOwnPropertyDescriptors(options);
		delete descriptors.today;
		Object.defineProperties(this, descriptors);
		const initialToday = this.resolveToday(options.today);
		this.today = initialToday;
		this.date = initialToday;
		this.focusedDate = initialToday;
		const initialDate = getFirstValueDate(options.type ?? ('calendar' as T), options.value);
		if (initialDate) {
			this.date = createCalendarDate(initialDate.getFullYear(), initialDate.getMonth(), 1);
			this.focusedDate = normalizeCalendarDate(initialDate);
		}

		$effect.pre(() => {
			const nextToday = this.resolveToday(options.today);
			if (isSameCalendarDay(nextToday, this.today)) return;
			const shouldMoveFocus = isSameCalendarDay(this.focusedDate, this.today);
			this.today = nextToday;
			if (shouldMoveFocus) this.focusedDate = nextToday;
		});
	}

	private resolveToday(today: Date | undefined): Date {
		if (today) return normalizeCalendarDate(today);
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- This captures the legacy current-day fallback once and never mutates it.
		this.fallbackToday ??= normalizeCalendarDate(new Date());
		return this.fallbackToday;
	}

	private isInVisibleMonths(date: Date) {
		const firstMonth = this.currentYear * 12 + this.currentMonth;
		const targetMonth = date.getFullYear() * 12 + date.getMonth();
		return (
			targetMonth >= firstMonth && targetMonth <= firstMonth + (this.view === 'double' ? 1 : 0)
		);
	}

	private getTabStopDate() {
		if (this.isInVisibleMonths(this.focusedDate) && !this.isCellDisabled(this.focusedDate)) {
			return this.focusedDate;
		}
		if (
			this.firstSelectedDate &&
			this.isInVisibleMonths(this.firstSelectedDate) &&
			!this.isCellDisabled(this.firstSelectedDate)
		) {
			return this.firstSelectedDate;
		}
		if (this.isInVisibleMonths(this.today) && !this.isCellDisabled(this.today)) return this.today;

		let candidateDate = createCalendarDate(this.currentYear, this.currentMonth, 1);
		const endDate = createCalendarDate(
			this.currentYear,
			this.currentMonth + (this.view === 'double' ? 2 : 1),
			0
		);
		while (candidateDate <= endDate) {
			if (!this.isCellDisabled(candidateDate)) return candidateDate;
			candidateDate = addDays(candidateDate, 1);
		}

		return null;
	}

	/** Same day, or same week, month or year under a coarser granularity. */
	isSameUnit = (first: Date, second: Date) =>
		this.granularity === 'day'
			? isSameCalendarDay(first, second)
			: isSamePeriod(first, second, this.granularity, this.resolvedWeekStartsOn);

	/** First day of the period holding `date`. */
	periodStartOf = (date: Date) => getPeriodStart(date, this.granularity, this.resolvedWeekStartsOn);

	/** Last day of the period holding `date`. */
	periodEndOf = (date: Date) => getPeriodEnd(date, this.granularity, this.resolvedWeekStartsOn);

	private isDateSelected(date: Date) {
		if (this.type === 'calendar')
			return !!this.rangeStart && this.isSameUnit(date, this.rangeStart);
		if (this.type === 'calendar-range') {
			return (
				(!!this.rangeStart && this.isSameUnit(date, this.rangeStart)) ||
				(!!this.rangeEnd && this.isSameUnit(date, this.rangeEnd))
			);
		}
		return this.multipleValues.some((selectedDate) => this.isSameUnit(date, selectedDate));
	}

	private isDateInRange(date: Date) {
		if (!this.rangeStart || !this.rangeEnd) return false;
		if (this.granularity !== 'day') {
			// Strictly between the first and the last selected periods.
			const period = this.periodStartOf(date);
			return (
				period > this.periodStartOf(this.rangeStart) && period < this.periodStartOf(this.rangeEnd)
			);
		}
		const normalizedDate = normalizeCalendarDate(date);
		return (
			normalizedDate > normalizeCalendarDate(this.rangeStart) &&
			normalizedDate < normalizeCalendarDate(this.rangeEnd)
		);
	}

	/**
	 * Whether the cell holding `date` refuses selection: the day itself, or under a coarser
	 * granularity its whole period (a period with one available day stays selectable).
	 */
	isCellDisabled = (date: Date) => {
		if (this.granularity === 'day') return this.isDateDisabled(date);
		if (this.disabled) return true;
		return isPeriodDisabled(date, this.granularity, this.resolvedWeekStartsOn, {
			minDate: this.minDate,
			maxDate: this.maxDate,
			isDayDisabled: this.isDateDisabled
		});
	};

	isDateDisabled = (date: Date) => {
		if (this.disabled) return true;
		const normalizedDate = normalizeCalendarDate(date);
		if (this.minDate && normalizedDate < normalizeCalendarDate(this.minDate)) return true;
		if (this.maxDate && normalizedDate > normalizeCalendarDate(this.maxDate)) return true;
		return this.disabledDateKeys.has(getCalendarDateKey(normalizedDate));
	};

	getCalendarRows = (date: Date = this.date, isNextMonth = false): Row<E>[] => {
		const year = date.getFullYear();
		const month = date.getMonth();
		const daysInMonth = createCalendarDate(year, month + 1, 0).getDate();
		const daysInPreviousMonth = createCalendarDate(year, month, 0).getDate();
		const nativeFirstDay = createCalendarDate(year, month, 1).getDay();
		const firstDay = (nativeFirstDay - this.resolvedWeekStartsOn + 7) % 7;
		const weekCount = Math.ceil((firstDay + daysInMonth) / 7);
		const tabStopDate = this.getTabStopDate();
		const rows: Row<E>[] = [];

		for (let rowIndex = 0; rowIndex < weekCount; rowIndex += 1) {
			const row: Row<E> = { cells: [], events: [] };
			for (let columnIndex = 0; columnIndex < 7; columnIndex += 1) {
				const calendarIndex = rowIndex * 7 + columnIndex;
				const monthDay = calendarIndex - firstDay + 1;
				const isInPreviousMonth = monthDay < 1;
				const isInNextMonth = monthDay > daysInMonth;
				const cellDate = isInPreviousMonth
					? createCalendarDate(year, month - 1, daysInPreviousMonth + monthDay)
					: isInNextMonth
						? createCalendarDate(year, month + 1, monthDay - daysInMonth)
						: createCalendarDate(year, month, monthDay);
				const dateKey = getCalendarDateKey(cellDate);
				const selected = this.isDateSelected(cellDate);
				// Under a week granularity the range starts on its first week's first day and ends on
				// its last week's last day.
				const isStartOfRange =
					this.type === 'calendar-range' &&
					!!this.rangeStart &&
					isSameCalendarDay(cellDate, this.periodStartOf(this.rangeStart));
				const isEndOfRange =
					this.type === 'calendar-range' &&
					!!this.rangeEnd &&
					isSameCalendarDay(cellDate, this.periodEndOf(this.rangeEnd));
				const disabled = this.isCellDisabled(cellDate);
				// A day that cannot be picked alone inside a week that can.
				const unavailable = !disabled && this.isDateDisabled(cellDate);
				const events = this.eventsMap.get(dateKey) ?? [];
				const visible =
					this.view === 'single' || (isNextMonth ? !isInPreviousMonth : !isInNextMonth);

				row.events.push(...events);
				row.cells.push({
					isStartOfRange,
					isEndOfRange,
					visible,
					isInNextMonth,
					isInRange: this.isDateInRange(cellDate),
					isInPreviousMonth,
					selected,
					inMonth: !isInPreviousMonth && !isInNextMonth,
					day: cellDate.getDate(),
					date: cellDate,
					isToday: isSameCalendarDay(cellDate, this.today),
					events,
					corner: null,
					disabled,
					attributes: {
						'data-date': dateKey,
						'data-in-range': this.isDateInRange(cellDate) || undefined,
						'data-in-month': !isInPreviousMonth && !isInNextMonth,
						'data-disabled': disabled || undefined,
						'data-unavailable': unavailable || undefined,
						'data-is-today': isSameCalendarDay(cellDate, this.today) || undefined,
						'data-selected': selected || undefined,
						'data-start-of-range': isStartOfRange || undefined,
						'data-end-of-range': isEndOfRange || undefined,
						'data-is-past': cellDate < this.today || undefined,
						'aria-selected': selected,
						'aria-current': isSameCalendarDay(cellDate, this.today) ? 'date' : undefined,
						tabindex:
							!disabled && visible && !!tabStopDate && isSameCalendarDay(cellDate, tabStopDate)
								? 0
								: -1,
						disabled: disabled || undefined
					}
				});
			}
			rows.push(row);
		}

		return rows;
	};

	private commitValue(value: CalendarValue<T>) {
		if (this.readOnly) return;
		const currentValue = this.value;
		if (Object.is(value, currentValue)) return;
		if (
			value instanceof Date &&
			currentValue instanceof Date &&
			isSameCalendarDay(value, currentValue)
		) {
			return;
		}
		if (
			Array.isArray(value) &&
			Array.isArray(currentValue) &&
			value.length === currentValue.length &&
			value.every((date, index) => date?.getTime() === currentValue[index]?.getTime())
		)
			return;
		this.value = value;
		this.onValueChange?.(value);
	}

	selectDate = (date: Date) => {
		if (this.isCellDisabled(date)) return;
		const selectedDate = normalizeCalendarDate(date);
		this.focusedDate = selectedDate;
		if (this.granularity !== 'day') {
			this.selectPeriod(selectedDate);
			return;
		}

		if (this.type === 'calendar') {
			this.commitValue(selectedDate as CalendarValue<T>);
			return;
		}

		if (this.type === 'calendar-multiple') {
			const currentValues = this.multipleValues;
			const isSelected = currentValues.some((value) => isSameCalendarDay(value, selectedDate));
			const nextValues = isSelected
				? currentValues.filter((value) => !isSameCalendarDay(value, selectedDate))
				: [...currentValues, selectedDate].sort(
						(first, second) => first.getTime() - second.getTime()
					);
			this.commitValue(nextValues as CalendarValue<T>);
			return;
		}

		let nextRange: [Date | null, Date | null];
		if (!this.rangeStart || this.rangeEnd) {
			nextRange = [selectedDate, null];
		} else if (selectedDate < normalizeCalendarDate(this.rangeStart)) {
			nextRange = [selectedDate, this.rangeStart];
		} else {
			nextRange = [this.rangeStart, selectedDate];
		}
		this.commitValue(nextRange as CalendarValue<T>);
	};

	/**
	 * Selects the period holding `date`. A single or multiple value holds each period's first day;
	 * a range runs from its first period's first day to its last period's last day.
	 */
	private selectPeriod(date: Date) {
		const periodStart = this.periodStartOf(date);
		if (this.type === 'calendar') {
			this.commitValue(periodStart as CalendarValue<T>);
			return;
		}

		if (this.type === 'calendar-multiple') {
			const currentValues = this.multipleValues;
			const isSelected = currentValues.some((value) => this.isSameUnit(value, periodStart));
			const nextValues = isSelected
				? currentValues.filter((value) => !this.isSameUnit(value, periodStart))
				: [...currentValues, periodStart].sort(
						(first, second) => first.getTime() - second.getTime()
					);
			this.commitValue(nextValues as CalendarValue<T>);
			return;
		}

		let nextRange: [Date | null, Date | null];
		if (!this.rangeStart || this.rangeEnd) {
			nextRange = [periodStart, null];
		} else {
			const anchorStart = this.periodStartOf(this.rangeStart);
			nextRange =
				periodStart < anchorStart
					? [periodStart, this.periodEndOf(this.rangeStart)]
					: [anchorStart, this.periodEndOf(periodStart)];
		}
		this.commitValue(nextRange as CalendarValue<T>);
	}

	/** Whether `date`'s month or year cell is on the page shown. */
	private isOnPeriodPage(date: Date) {
		if (this.granularity === 'year') {
			const year = date.getFullYear();
			return year >= this.yearPageStart && year < this.yearPageStart + PERIOD_PAGE_SIZE;
		}
		return date.getFullYear() === this.currentYear;
	}

	/** The months of the year shown, or the twelve years of the page shown. */
	private getPeriodPageDates() {
		return Array.from({ length: PERIOD_PAGE_SIZE }, (_, index) =>
			this.granularity === 'year'
				? createCalendarDate(this.yearPageStart + index, 0, 1)
				: createCalendarDate(this.currentYear, index, 1)
		);
	}

	private getPeriodTabStop(dates: Date[]) {
		const isAvailable = (date: Date | null): date is Date =>
			!!date && this.isOnPeriodPage(date) && !this.isCellDisabled(date);
		if (isAvailable(this.focusedDate)) return this.periodStartOf(this.focusedDate);
		if (isAvailable(this.firstSelectedDate)) return this.periodStartOf(this.firstSelectedDate);
		if (isAvailable(this.today)) return this.periodStartOf(this.today);
		return dates.find((date) => !this.isCellDisabled(date)) ?? null;
	}

	getPeriodCells = (): PeriodCell[] => {
		if (!this.isPeriodGrid) return [];
		const dates = this.getPeriodPageDates();
		const tabStop = this.getPeriodTabStop(dates);
		const isRange = this.type === 'calendar-range';
		return dates.map((date) => {
			const selected = this.isDateSelected(date);
			const disabled = this.isCellDisabled(date);
			const isInRange = this.isDateInRange(date);
			const isStartOfRange = isRange && !!this.rangeStart && this.isSameUnit(date, this.rangeStart);
			const isEndOfRange = isRange && !!this.rangeEnd && this.isSameUnit(date, this.rangeEnd);
			const isCurrent = this.isSameUnit(date, this.today);
			const year = date.getFullYear();
			const outside =
				this.granularity === 'year' &&
				(year === this.yearPageStart || year === this.yearPageStart + PERIOD_PAGE_SIZE - 1);
			return {
				date,
				selected,
				disabled,
				isInRange,
				isStartOfRange,
				isEndOfRange,
				isCurrent,
				outside,
				attributes: {
					'data-date': getCalendarDateKey(date),
					'data-in-range': isInRange || undefined,
					'data-disabled': disabled || undefined,
					'data-selected': selected || undefined,
					'data-start-of-range': isStartOfRange || undefined,
					'data-end-of-range': isEndOfRange || undefined,
					'data-outside': outside || undefined,
					'data-is-today': isCurrent || undefined,
					'aria-selected': selected,
					'aria-current': isCurrent ? 'date' : undefined,
					tabindex: !disabled && !!tabStop && this.isSameUnit(date, tabStop) ? 0 : -1,
					disabled: disabled || undefined
				}
			};
		});
	};

	/** Whether the previous (-1) or next (1) month or year page holds a selectable period. */
	canGoToPeriodPage = (direction: -1 | 1) => {
		if (this.disabled) return false;
		const step = this.granularity === 'year' ? 10 : 1;
		const firstYear =
			(this.granularity === 'year' ? this.yearPageStart : this.currentYear) + direction * step;
		const lastYear = firstYear + (this.granularity === 'year' ? PERIOD_PAGE_SIZE - 1 : 0);
		if (this.minDate && lastYear < this.minDate.getFullYear()) return false;
		if (this.maxDate && firstYear > this.maxDate.getFullYear()) return false;
		return true;
	};

	/** Shows the previous (-1) or next (1) year of months, or decade of years. */
	goToPeriodPage = (direction: -1 | 1) => {
		if (!this.canGoToPeriodPage(direction)) return;
		const step = this.granularity === 'year' ? 10 : 1;
		this.date = createCalendarDate(this.currentYear + direction * step, this.currentMonth, 1);
	};

	goNextMonth = () => {
		this.goToMonth(this.currentYear, this.currentMonth + 1);
	};

	goPrevMonth = () => {
		this.goToMonth(this.currentYear, this.currentMonth - 1);
	};

	canGoToMonth = (year: number, month: number) => {
		const targetMonthIndex = year * 12 + month;
		if (this.minDate) {
			const minMonthIndex = this.minDate.getFullYear() * 12 + this.minDate.getMonth();
			if (targetMonthIndex < minMonthIndex) return false;
		}
		if (this.maxDate) {
			const maxMonthIndex = this.maxDate.getFullYear() * 12 + this.maxDate.getMonth();
			if (targetMonthIndex > maxMonthIndex) return false;
		}
		return true;
	};

	goToMonth = (year: number, month: number) => {
		if (!this.canGoToMonth(year, month)) return;
		this.date = createCalendarDate(year, month, 1);
	};

	goToToday = () => {
		this.date = createCalendarDate(this.today.getFullYear(), this.today.getMonth(), 1);
		this.focusedDate = this.today;
	};

	goToDate = (date: Date) => {
		const normalizedDate = normalizeCalendarDate(date);
		// A year beside its decade is already on the page shown: keep that page.
		if (this.isPeriodGrid && this.isOnPeriodPage(normalizedDate)) {
			this.focusedDate = normalizedDate;
			return;
		}
		this.date = createCalendarDate(normalizedDate.getFullYear(), normalizedDate.getMonth(), 1);
		this.focusedDate = normalizedDate;
	};

	cleanDate = normalizeCalendarDate;

	private getEnabledDate(targetDate: Date, direction: number) {
		let date = normalizeCalendarDate(targetDate);
		for (let attempts = 0; attempts < 3660; attempts += 1) {
			if (!this.isCellDisabled(date)) return date;
			date = addDays(date, direction);
			if (this.minDate && date < normalizeCalendarDate(this.minDate)) return null;
			if (this.maxDate && date > normalizeCalendarDate(this.maxDate)) return null;
		}
		return null;
	}

	/** The nearest selectable month or year from `target`, walking one period at a time. */
	private getEnabledPeriod(target: Date, direction: number) {
		let date = this.periodStartOf(target);
		const minYear = this.minDate?.getFullYear();
		const maxYear = this.maxDate?.getFullYear();
		for (let attempts = 0; attempts < 1200; attempts += 1) {
			if (!this.isCellDisabled(date)) return date;
			date = addPeriods(date, this.granularity, direction < 0 ? -1 : 1);
			if (minYear !== undefined && date.getFullYear() < minYear) return null;
			if (maxYear !== undefined && date.getFullYear() > maxYear) return null;
		}
		return null;
	}

	private moveFocusToPeriod(node: HTMLElement, target: Date, direction: number) {
		const enabled = this.getEnabledPeriod(target, direction);
		if (!enabled) return;
		this.focusedDate = enabled;
		if (!this.isOnPeriodPage(enabled)) {
			this.date = createCalendarDate(enabled.getFullYear(), enabled.getMonth(), 1);
		}
		requestAnimationFrame(() => {
			node
				.querySelector<HTMLButtonElement>(`[data-date="${getCalendarDateKey(enabled)}"]`)
				?.focus();
		});
	}

	/**
	 * Arrow keys move one period sideways and one grid row (three periods) up or down; Home and
	 * End reach the row's ends (with Ctrl or Meta, the page's ends); PageUp and PageDown change the
	 * year of a month grid or the decade of a year grid.
	 */
	private getPeriodKeyTarget(event: KeyboardEvent, current: Date, isRtl: boolean) {
		const isYear = this.granularity === 'year';
		const index = isYear ? current.getFullYear() - this.yearPageStart : current.getMonth();
		const pageStart = isYear
			? createCalendarDate(this.yearPageStart, 0, 1)
			: createCalendarDate(current.getFullYear(), 0, 1);
		const step = (amount: number) => addPeriods(current, this.granularity, amount);
		const fromPage = (cell: number) => addPeriods(pageStart, this.granularity, cell);
		const rowStart = index - (index % PERIOD_GRID_COLUMNS);
		switch (event.key) {
			case 'ArrowLeft':
				return { target: step(isRtl ? 1 : -1), direction: isRtl ? 1 : -1 };
			case 'ArrowRight':
				return { target: step(isRtl ? -1 : 1), direction: isRtl ? -1 : 1 };
			case 'ArrowUp':
				return { target: step(-PERIOD_GRID_COLUMNS), direction: -1 };
			case 'ArrowDown':
				return { target: step(PERIOD_GRID_COLUMNS), direction: 1 };
			case 'Home':
				return {
					target: fromPage(event.ctrlKey || event.metaKey ? 0 : rowStart),
					direction: 1
				};
			case 'End':
				return {
					target: fromPage(
						event.ctrlKey || event.metaKey
							? PERIOD_PAGE_SIZE - 1
							: rowStart + PERIOD_GRID_COLUMNS - 1
					),
					direction: -1
				};
			case 'PageUp':
				return { target: step(isYear ? -10 : -12), direction: -1 };
			case 'PageDown':
				return { target: step(isYear ? 10 : 12), direction: 1 };
		}
		return null;
	}

	private moveFocus(node: HTMLElement, targetDate: Date, direction: number) {
		const enabledDate = this.getEnabledDate(targetDate, direction);
		if (!enabledDate) return;

		this.focusedDate = enabledDate;
		if (!this.isInVisibleMonths(enabledDate)) {
			this.date = createCalendarDate(enabledDate.getFullYear(), enabledDate.getMonth(), 1);
		}

		requestAnimationFrame(() => {
			node
				.querySelector<HTMLButtonElement>(`[data-date="${getCalendarDateKey(enabledDate)}"]`)
				?.focus();
		});
	}

	calendar = (node: HTMLElement) =>
		untrack(() => {
			const handleClick = (event: MouseEvent) => {
				const cell = getElementWithDate(event);
				if (!cell || cell.hasAttribute('disabled')) return;
				this.selectDate(parseCalendarDateKey(cell.dataset.date!));
			};

			const handleFocus = (event: FocusEvent) => {
				const cell = getElementWithDate(event);
				if (!cell?.dataset.date) return;
				this.focusedDate = parseCalendarDateKey(cell.dataset.date);
			};

			const handleKeydown = (event: KeyboardEvent) => {
				const cell = getElementWithDate(event);
				if (!cell?.dataset.date) return;
				const currentDate = parseCalendarDateKey(cell.dataset.date);
				const isRtl = getComputedStyle(node).direction === 'rtl';
				if (this.isPeriodGrid) {
					const move = this.getPeriodKeyTarget(event, currentDate, isRtl);
					if (!move) return;
					event.preventDefault();
					this.moveFocusToPeriod(node, move.target, move.direction);
					return;
				}
				let targetDate: Date | null = null;
				let direction = 1;

				switch (event.key) {
					case 'ArrowLeft':
						direction = isRtl ? 1 : -1;
						targetDate = addDays(currentDate, direction);
						break;
					case 'ArrowRight':
						direction = isRtl ? -1 : 1;
						targetDate = addDays(currentDate, direction);
						break;
					case 'ArrowUp':
						direction = -1;
						targetDate = addDays(currentDate, -7);
						break;
					case 'ArrowDown':
						targetDate = addDays(currentDate, 7);
						break;
					case 'Home': {
						direction = -1;
						const weekStart = this.resolvedWeekStartsOn;
						const offset = (currentDate.getDay() - weekStart + 7) % 7;
						targetDate = addDays(currentDate, -offset);
						break;
					}
					case 'End': {
						const weekStart = this.resolvedWeekStartsOn;
						const offset = (currentDate.getDay() - weekStart + 7) % 7;
						targetDate = addDays(currentDate, 6 - offset);
						break;
					}
					case 'PageUp':
						direction = -1;
						targetDate = event.shiftKey ? addYears(currentDate, -1) : addMonths(currentDate, -1);
						break;
					case 'PageDown':
						targetDate = event.shiftKey ? addYears(currentDate, 1) : addMonths(currentDate, 1);
						break;
				}

				if (!targetDate) return;
				event.preventDefault();
				this.moveFocus(node, targetDate, direction);
			};

			const removeClick = on(node, 'click', handleClick);
			const removeFocus = on(node, 'focusin', handleFocus);
			const removeKeydown = on(node, 'keydown', handleKeydown);

			return () => {
				removeClick();
				removeFocus();
				removeKeydown();
			};
		});
}
