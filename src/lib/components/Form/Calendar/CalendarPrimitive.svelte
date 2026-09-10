<script lang="ts" module>
	import { setComponentTheme, useComponentTheme } from '$lib/utils/cva/index.js';
	import { calendarTheme } from '$lib/components/Form/Calendar/calendar.theme.js';
	export const setCalendarTheme = setComponentTheme<typeof calendarTheme>('calendar');
	export const useCalendarTheme = useComponentTheme('calendar', calendarTheme);
</script>

<script lang="ts" generics="T extends CalendarType, CalendarEvent extends Event">
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { transitionSize } from '$lib/attachments/transitionSize.js';
	import { useResizeObserver } from '$lib/utils/useResizeObserver.svelte.js';
	import { cubicOut } from 'svelte/easing';
	import type { CalendarPrimitiveProps, CalendarType } from './calendarInput.props.js';
	import type { Event } from './useCalendar.svelte.js';
	import { CalendarState, getCalendarDateKey } from './useCalendar.svelte.js';
	import Button from '../../Button/Button.svelte';
	import Slot from '../../Slot/Slot.svelte';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import Chip from '$lib/components/Chip/Chip.svelte';
	import CalendarMonthYearPicker from './CalendarMonthYearPicker.svelte';

	let {
		type,
		events,
		defaultValue = (type === 'calendar-multiple' ? [] : null) as CalendarPrimitiveProps<
			CalendarEvent,
			T
		>['value'],
		value = $bindable(),
		disabledDates = [],
		view = 'single',
		weekStartsOnMonday = true,
		weekStartsOn,
		today,
		weekdayLength = 'narrow',
		locale,
		ariaLabel = 'Calendar',
		disabled = false,
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

	const doubleViewMinWidth = 576;
	const resolvedView = $derived(
		view === 'double' && containerWidth >= doubleViewMinWidth ? 'double' : 'single'
	);
	const containerResizeObserver = useResizeObserver({
		isActive: () => true,
		callback: (entry) => {
			const nextWidth = entry.target.getBoundingClientRect().width;
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
	const reducedMotion =
		typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	const monthSlide = (
		_node: Element,
		{ direction, outgoing = false }: { direction: number; outgoing?: boolean }
	) => ({
		duration: direction === 0 || reducedMotion ? 0 : 200,
		easing: cubicOut,
		css: (_t: number, u: number) =>
			`${outgoing ? 'position:absolute;top:0;inset-inline-start:0;width:100%;' : ''}transform: translateX(${direction * u * 100}%)`
	});
	const viewZoom = (_node: Element, { outgoing = false }: { outgoing?: boolean } = {}) => ({
		duration: reducedMotion ? 0 : 180,
		easing: cubicOut,
		css: (t: number, u: number) =>
			`${outgoing ? 'position:absolute;top:0;inset-inline-start:0;width:100%;' : ''}opacity:${t};transform:scale(${0.985 + t * 0.015});filter:blur(${u * 3}px);transform-origin:center`
	});

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
	aria-label={ariaLabel}
	aria-disabled={disabled}
	{@attach containerResizeObserver.reference}
	{@attach calendar.calendar}
>
	<Slot render={header} class={classes.header({ picker: activeView === 'picker' })}>
		{#if activeView === 'days'}
			<Button
				squared
				size="small"
				variant="ghost"
				class="rotate-180"
				label="Previous month"
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
		<Button
			type="button"
			bind:ref={viewTriggerElement}
			size="normal"
			variant="ghost"
			color="neutral"
			class={classes.viewTrigger()}
			{disabled}
			label={`${activeView === 'picker' ? 'Show days for' : 'Choose month and year, currently'} ${calendar.displayedMonthLabel}`}
			aria-expanded={activeView === 'picker'}
			aria-controls={pickerId}
			onclick={toggleActiveView}
		>
			<span aria-live="polite">{calendar.displayedMonthLabel}</span>
		</Button>
		{#if activeView === 'days'}
			<Button
				squared
				size="small"
				variant="ghost"
				label="Next month"
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
				{#if activeView === 'days'}
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
		class={classes.grid()}
		aria-label={month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
	>
		<div role="row" class="contents">
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
			<div role="row" class="contents">
				{#each row.cells as cell, columnIndex (getCalendarDateKey(cell.date))}
					{#if cell.visible}
						<button
							type="button"
							role="gridcell"
							aria-colindex={columnIndex + 1}
							{...cell.attributes}
							aria-label={cell.date.toLocaleDateString(locale, {
								weekday: 'long',
								day: 'numeric',
								month: 'long',
								year: 'numeric'
							})}
							class={classes.day({
								selected: cell.selected,
								disabled: cell.disabled,
								inMonth: cell.inMonth,
								inRange: cell.isInRange,
								today: cell.isToday,
								startOfRange: cell.isStartOfRange,
								endOfRange: cell.isEndOfRange,
								isPast: cell.isInPreviousMonth
							})}
						>
							{#if cell.isToday}
								<Chip
									size="small"
									color="danger"
									position="topRight"
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
