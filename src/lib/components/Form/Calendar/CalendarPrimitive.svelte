<script lang="ts" module>
	import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
	import { calendarTheme } from '$lib/components/Form/Calendar/calendar.theme.js';
	export const setCalendarTheme = setComponentTheme<typeof calendarTheme>('calendar');
	export const useCalendarTheme = useComponentTheme('calendar', calendarTheme);
</script>

<script lang="ts" generics="T extends CalendarType, CalendarEvent extends Event">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { transitionSize } from '$lib/attachments/transitionSize.js';
	import { prefersReducedMotion } from '$lib/utils/motion.svelte.js';
	import { useResizeObserver } from '$lib/utils/useResizeObserver.svelte.js';
	import { cubicOut } from 'svelte/easing';
	import { on } from 'svelte/events';
	import type { CalendarPrimitiveProps, CalendarType } from './calendarInput.props.js';
	import type { Event } from './useCalendar.svelte.js';
	import { CalendarState, getCalendarDateKey } from './useCalendar.svelte.js';
	import { getWeekNumber, PERIOD_GRID_COLUMNS } from './calendar.periods.js';
	import Button from '../../Button/Button.svelte';
	import Slot from '../../Slot/Slot.svelte';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import CalendarMonthYearPicker from './CalendarMonthYearPicker.svelte';
	import { useI18n, useI18nLocale } from '$lib/i18n/context.svelte.js';

	let {
		type,
		events,
		defaultValue = (type === 'calendar-multiple' ? [] : null) as CalendarPrimitiveProps<
			CalendarEvent,
			T
		>['value'],
		value = $bindable(),
		granularity = 'day',
		disabledDates = [],
		view = 'single',
		weekStartsOnMonday = true,
		weekStartsOn,
		today,
		weekdayLength = 'narrow',
		locale: localeProp,
		label,
		disabled = false,
		readOnly = false,
		class: className,
		cell: renderCell,
		buttons,
		minDate,
		maxDate,
		header,
		todayBadge = {
			size: 'small',
			color: 'danger',
			class: ''
		},
		onValueChange,
		onViewChange,
		theme
	}: CalendarPrimitiveProps<CalendarEvent, T> = $props();
	const valueState = createBindableValue(
		() => value,
		(nextValue) => {
			value = nextValue;
		},
		() => defaultValue
	);

	let rootElement = $state<HTMLElement | null>(null);
	let viewTriggerElement = $state<HTMLElement | null>(null);
	let containerWidth = $state(0);
	let navigationDirection = $state(0);
	let lastSelectionKey = $state<string | null>(null);
	let activeView = $state<'days' | 'picker'>('days');
	const id = $props.id();
	const pickerId = `${id}-month-year-picker`;
	const t = $derived(useI18n());
	const locale = $derived(localeProp ?? useI18nLocale());
	const resolvedLabel = $derived(label ?? t.calendar);

	const doubleViewMinWidth = 576;
	const resolvedView = $derived(
		view === 'double' && containerWidth >= doubleViewMinWidth ? 'double' : 'single'
	);
	const containerResizeObserver = useResizeObserver({
		isActive: () => true,
		callback: (entry) => {
			// The layout width, not the rendered one: a popover scaling in reports a narrower
			// `getBoundingClientRect()`, which kept a double view single until its intro ended.
			const nextWidth = (entry.target as HTMLElement).offsetWidth;
			const wasDoubleView = containerWidth >= doubleViewMinWidth;
			const isDoubleView = nextWidth >= doubleViewMinWidth;
			const crossesViewBoundary = view === 'double' && wasDoubleView !== isDoubleView;
			const activeElement = document.activeElement;
			const shouldRestoreFocus =
				crossesViewBoundary &&
				activeElement instanceof HTMLElement &&
				activeElement.hasAttribute('data-date') &&
				(rootElement?.contains(activeElement) ?? false);

			containerWidth = nextWidth;
			if (!shouldRestoreFocus) return;

			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					rootElement?.querySelector<HTMLButtonElement>('[data-date][tabindex="0"]')?.focus();
				});
			});
		}
	});

	// Measured as soon as the calendar mounts, before the first paint, so a double view opens with
	// both months instead of starting single and redrawing when the observer first reports.
	const measureOnMount = (node: HTMLElement) => {
		containerWidth = node.offsetWidth;
	};

	const calendar = new CalendarState<CalendarEvent, T>({
		get events() {
			return events ?? [];
		},
		get disabledDates() {
			return disabledDates;
		},
		get minDate() {
			return minDate;
		},
		get maxDate() {
			return maxDate;
		},
		get view() {
			return resolvedView;
		},
		get granularity() {
			return granularity;
		},
		get weekStartsOnMonday() {
			return weekStartsOnMonday;
		},
		get weekStartsOn() {
			return weekStartsOn;
		},
		get today() {
			return today;
		},
		get type() {
			return (type ?? 'calendar') as T;
		},
		get disabled() {
			return disabled;
		},
		get readOnly() {
			return readOnly;
		},
		get locale() {
			return locale;
		},
		get onValueChange() {
			return onValueChange;
		},
		get value() {
			return valueState.value;
		},
		set value(nextValue) {
			valueState.value = nextValue;
		}
	});
	let previousMonthIndex = calendar.currentYear * 12 + calendar.currentMonth;
	let previousResolvedView: 'single' | 'double' = 'single';

	const classes = $derived(useCalendarTheme(theme));
	const buttonProps = $derived(
		buttons
			? 'prev' in buttons
				? buttons
				: { prev: buttons, next: buttons }
			: { prev: {}, next: {} }
	);
	const isRtl = $derived(rootElement ? getComputedStyle(rootElement).direction === 'rtl' : false);
	const enterDirection = $derived(navigationDirection * (isRtl ? -1 : 1));

	const monthSlide = (
		_node: Element,
		{ direction, outgoing = false }: { direction: number; outgoing?: boolean }
	) => ({
		duration: direction === 0 || prefersReducedMotion() ? 0 : 200,
		easing: cubicOut,
		css: (_t: number, u: number) =>
			`${outgoing ? 'position:absolute;top:0;inset-inline-start:0;width:100%;' : ''}transform: translateX(${direction * u * 100}%)`
	});
	const viewZoom = (_node: Element, { outgoing = false }: { outgoing?: boolean } = {}) => ({
		duration: prefersReducedMotion() ? 0 : 180,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`${outgoing ? 'position:absolute;top:0;inset-inline-start:0;width:100%;' : ''}opacity:${t};transform:scale(${0.985 + t * 0.015});filter:blur(${u * 3}px);transform-origin:center`
	});

	const isWeekGranularity = $derived(granularity === 'week');
	// The week row under the pointer, keyed by its first day, highlighted as one target.
	let hoveredWeekKey = $state<string | null>(null);
	const weekKeyOf = (date: Date) => getCalendarDateKey(calendar.periodStartOf(date));

	const trackWeekHover = (node: HTMLElement) => {
		const removeOver = on(node, 'pointerover', handleWeekPointerOver);
		const removeLeave = on(node, 'pointerleave', () => (hoveredWeekKey = null));
		return () => {
			removeOver();
			removeLeave();
		};
	};

	function handleWeekPointerOver(event: PointerEvent) {
		if (!isWeekGranularity || event.pointerType === 'touch') return;
		const cell = (event.target as Element | null)?.closest<HTMLElement>('[data-date]');
		const dateKey = cell?.dataset.date;
		if (!dateKey || cell.hasAttribute('disabled')) {
			hoveredWeekKey = null;
			return;
		}
		const [year, month, day] = dateKey.split('-').map(Number);
		hoveredWeekKey = weekKeyOf(new Date(year, month - 1, day, 12));
	}

	const yearFormat = (date: Date) => date.toLocaleDateString(locale, { year: 'numeric' });
	const periodPageLabel = $derived.by(() => {
		if (granularity !== 'year') return yearFormat(calendar.date);
		// The decade itself; the year shown on each side is a neighbour.
		const first = new Date(calendar.yearPageStart + 1, 0, 1, 12);
		const last = new Date(calendar.yearPageStart + 10, 0, 1, 12);
		try {
			return new Intl.DateTimeFormat(locale, { year: 'numeric' }).formatRange(first, last);
		} catch {
			return `${yearFormat(first)} – ${yearFormat(last)}`;
		}
	});
	const periodRows = $derived.by(() => {
		const rows: (typeof calendar.periodCells)[] = [];
		for (let index = 0; index < calendar.periodCells.length; index += PERIOD_GRID_COLUMNS) {
			rows.push(calendar.periodCells.slice(index, index + PERIOD_GRID_COLUMNS));
		}
		return rows;
	});
	const periodPageButtonLabels = $derived(
		granularity === 'year'
			? { prev: t.calendarPreviousDecade, next: t.calendarNextDecade }
			: { prev: t.calendarPreviousYear, next: t.calendarNextYear }
	);

	function handlePageChange(direction: -1 | 1) {
		if (disabled) return;
		calendar.goToPeriodPage(direction);
	}

	function getViewChangeParams() {
		return {
			startYear: calendar.currentYear,
			startMonth: calendar.currentMonth,
			endYear:
				resolvedView === 'double' ? calendar.nextMonthDate.getFullYear() : calendar.currentYear,
			endMonth:
				resolvedView === 'double' ? calendar.nextMonthDate.getMonth() : calendar.currentMonth
		};
	}

	function handleMonthChange(direction: -1 | 1) {
		if (disabled) return;
		if (!calendar.canGoToMonth(calendar.currentYear, calendar.currentMonth + direction)) return;
		if (direction < 0) calendar.goPrevMonth();
		else calendar.goNextMonth();
	}

	function toggleActiveView() {
		if (disabled) return;
		navigationDirection = 0;
		activeView = activeView === 'days' ? 'picker' : 'days';
	}

	function closePicker() {
		navigationDirection = 0;
		activeView = 'days';
		requestAnimationFrame(() => viewTriggerElement?.focus());
	}

	function selectDisplayedMonth(year: number, month: number) {
		calendar.goToMonth(year, month);
	}

	$effect.pre(() => {
		const currentMonthIndex = calendar.currentYear * 12 + calendar.currentMonth;
		const nextView = resolvedView;
		const didMonthChange = currentMonthIndex !== previousMonthIndex;
		const didViewChange = nextView !== previousResolvedView;
		if (!didMonthChange && !didViewChange) return;

		navigationDirection = didMonthChange ? (currentMonthIndex > previousMonthIndex ? 1 : -1) : 0;
		previousMonthIndex = currentMonthIndex;
		previousResolvedView = nextView;

		if (didMonthChange) onViewChange?.(getViewChangeParams());
	});

	$effect(() => {
		const selectedDate = calendar.firstSelectedDate;
		const selectionKey = selectedDate ? getCalendarDateKey(selectedDate) : null;
		if (!selectedDate) {
			lastSelectionKey = null;
			return;
		}
		if (selectionKey === lastSelectionKey) return;

		lastSelectionKey = selectionKey;
		calendar.goToDate(selectedDate);
	});
</script>

<div
	bind:this={rootElement}
	role="group"
	class={classes.root({ class: className })}
	aria-label={resolvedLabel}
	aria-disabled={disabled}
	{@attach containerResizeObserver.reference}
	{@attach measureOnMount}
	{@attach calendar.calendar}
>
	<Slot render={header} class={classes.header({ picker: activeView === 'picker' })}>
		{#if calendar.isPeriodGrid}
			<Button
				tool={false}
				squared
				size="small"
				variant="ghost"
				class="rotate-180"
				label={periodPageButtonLabels.prev}
				{...buttonProps.prev}
				type="button"
				disabled={disabled || buttonProps.prev.disabled || !calendar.canGoToPeriodPage(-1)}
				onclick={() => handlePageChange(-1)}
			>
				{@render caretRightIcon()}
			</Button>
			<span class={classes.viewTrigger({ class: 'text-center' })} aria-live="polite">
				{periodPageLabel}
			</span>
			<Button
				tool={false}
				squared
				size="small"
				variant="ghost"
				label={periodPageButtonLabels.next}
				{...buttonProps.next}
				type="button"
				disabled={disabled || buttonProps.next.disabled || !calendar.canGoToPeriodPage(1)}
				onclick={() => handlePageChange(1)}
			>
				{@render caretRightIcon()}
			</Button>
		{:else if activeView === 'days'}
			<Button
				tool={false}
				squared
				size="small"
				variant="ghost"
				class="rotate-180"
				label={`${t.previous} ${t.month}`}
				{...buttonProps.prev}
				type="button"
				disabled={disabled ||
					buttonProps.prev.disabled ||
					!calendar.canGoToMonth(calendar.currentYear, calendar.currentMonth - 1)}
				onclick={() => handleMonthChange(-1)}
			>
				{@render caretRightIcon()}
			</Button>
		{/if}
		{#if !calendar.isPeriodGrid}
			<Button
				tool={false}
				type="button"
				bind:ref={viewTriggerElement}
				size="normal"
				variant="ghost"
				color="neutral"
				class={classes.viewTrigger()}
				{disabled}
				label={activeView === 'picker'
					? t.calendarShowDaysFor(calendar.displayedMonthLabel)
					: t.calendarChooseMonthAndYear(calendar.displayedMonthLabel)}
				expanded={activeView === 'picker'}
				controls={pickerId}
				onclick={toggleActiveView}
			>
				<span aria-live="polite">{calendar.displayedMonthLabel}</span>
			</Button>
		{/if}
		{#if !calendar.isPeriodGrid && activeView === 'days'}
			<Button
				tool={false}
				squared
				size="small"
				variant="ghost"
				label={`${t.next} ${t.month}`}
				{...buttonProps.next}
				type="button"
				disabled={disabled ||
					buttonProps.next.disabled ||
					!calendar.canGoToMonth(calendar.currentYear, calendar.currentMonth + 1)}
				onclick={() => handleMonthChange(1)}
			>
				{@render caretRightIcon()}
			</Button>
		{/if}
	</Slot>

	<div class={classes.viewport()} {@attach transitionSize({ axis: 'height' })}>
		{#key activeView}
			<div class={classes.viewPanel()} in:viewZoom out:viewZoom={{ outgoing: true }}>
				{#if calendar.isPeriodGrid}
					{#key calendar.pageKey}
						<div
							class={classes.months({ view: 'single' })}
							in:monthSlide={{ direction: enterDirection }}
							out:monthSlide={{ direction: -enterDirection, outgoing: true }}
						>
							{@render periodPart()}
						</div>
					{/key}
				{:else if activeView === 'days'}
					{#key calendar.viewKey}
						<div
							class={classes.months({ view: resolvedView })}
							in:monthSlide={{ direction: enterDirection }}
							out:monthSlide={{ direction: -enterDirection, outgoing: true }}
						>
							{@render calendarPart(calendar.rows, calendar.date)}
							{#if resolvedView === 'double'}
								{@render calendarPart(calendar.nextMonthRows, calendar.nextMonthDate)}
							{/if}
						</div>
					{/key}
				{:else}
					<CalendarMonthYearPicker
						id={pickerId}
						currentMonth={calendar.currentMonth}
						currentYear={calendar.currentYear}
						{locale}
						{minDate}
						{maxDate}
						{disabled}
						{theme}
						onSelect={selectDisplayedMonth}
						onEscape={closePicker}
					/>
				{/if}
			</div>
		{/key}
	</div>
</div>

{#snippet calendarPart(rows: typeof calendar.rows, month: Date)}
	<div
		role="grid"
		aria-readonly={readOnly || undefined}
		class={classes.grid({ weekNumbers: isWeekGranularity })}
		aria-label={month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
		{@attach trackWeekHover}
	>
		<div role="row" class="contents">
			{#if isWeekGranularity}
				<span role="columnheader" aria-label={t.calendarWeekNumber} class={classes.weekday()}>
					{t.calendarWeekColumn}
				</span>
			{/if}
			{#each [0, 1, 2, 3, 4, 5, 6] as dayIndex (dayIndex)}
				{@const weekDay = (calendar.resolvedWeekStartsOn + dayIndex) % 7}
				<span
					role="columnheader"
					aria-label={new Date(2024, 0, 7 + weekDay).toLocaleDateString(locale, {
						weekday: 'long'
					})}
					class={classes.weekday()}
				>
					{new Date(2024, 0, 7 + weekDay).toLocaleDateString(locale, {
						weekday: weekdayLength
					})}
				</span>
			{/each}
		</div>

		{#each rows as row (getCalendarDateKey(row.cells[0].date))}
			{@const rowWeek = isWeekGranularity
				? getWeekNumber(row.cells[0].date, calendar.resolvedWeekStartsOn)
				: null}
			{@const rowWeekLabel = rowWeek ? t.calendarWeekLabel(rowWeek.week, rowWeek.year) : ''}
			{@const rowHovered = isWeekGranularity && hoveredWeekKey === weekKeyOf(row.cells[0].date)}
			<div role="row" class="contents">
				{#if rowWeek}
					<span role="rowheader" aria-label={rowWeekLabel} class={classes.weekNumber()}>
						{rowWeek.week}
					</span>
				{/if}
				{#each row.cells as cell, columnIndex (getCalendarDateKey(cell.date))}
					{#if cell.visible}
						{@const dayLabel = cell.date.toLocaleDateString(locale, {
							weekday: 'long',
							day: 'numeric',
							month: 'long',
							year: 'numeric'
						})}
						{@const inBand = isWeekGranularity && (cell.selected || cell.isInRange)}
						<button
							type="button"
							role="gridcell"
							aria-colindex={columnIndex + (rowWeek ? 2 : 1)}
							{...cell.attributes}
							data-highlighted={rowHovered && !cell.disabled ? 'true' : undefined}
							aria-label={rowWeek ? `${dayLabel}, ${rowWeekLabel}` : dayLabel}
							class={classes.day({
								selected: cell.selected,
								disabled: cell.disabled,
								inMonth: cell.inMonth,
								inRange: cell.isInRange,
								today: cell.isToday,
								startOfRange: !isWeekGranularity && cell.isStartOfRange,
								endOfRange: !isWeekGranularity && cell.isEndOfRange,
								isPast: cell.isInPreviousMonth,
								band: inBand
									? columnIndex === 0
										? 'start'
										: columnIndex === 6
											? 'end'
											: 'middle'
									: undefined,
								unavailable: cell.attributes['data-unavailable'] === true
							})}
						>
							{#if cell.isToday}
								<Chip
									size="small"
									color="danger"
									position="top-right"
									{...todayBadge}
									class="top-1 right-1 aspect-square !size-2 min-h-2 min-w-2 {todayBadge.class}"
								/>
							{/if}
							{#if renderCell}
								{@render renderCell(cell)}
							{:else}
								{cell.day}
							{/if}
						</button>
					{:else}
						<span aria-hidden="true"></span>
					{/if}
				{/each}
			</div>
		{/each}
	</div>
{/snippet}

{#snippet periodPart()}
	<div
		role="grid"
		aria-readonly={readOnly || undefined}
		class={classes.periodGrid()}
		aria-label={periodPageLabel}
	>
		{#each periodRows as periodRow (getCalendarDateKey(periodRow[0].date))}
			<div role="row" class="contents">
				{#each periodRow as period, columnIndex (getCalendarDateKey(period.date))}
					<button
						type="button"
						role="gridcell"
						aria-colindex={columnIndex + 1}
						{...period.attributes}
						aria-label={granularity === 'year'
							? yearFormat(period.date)
							: period.date.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
						class={classes.period({
							selected: period.selected,
							disabled: period.disabled,
							inRange: period.isInRange,
							startOfRange: period.isStartOfRange && !!calendar.rangeEnd,
							endOfRange: period.isEndOfRange && !!calendar.rangeStart,
							outside: period.outside,
							current: period.isCurrent
						})}
					>
						{granularity === 'year'
							? yearFormat(period.date)
							: period.date.toLocaleDateString(locale, { month: 'short' })}
					</button>
				{/each}
			</div>
		{/each}
	</div>
{/snippet}
