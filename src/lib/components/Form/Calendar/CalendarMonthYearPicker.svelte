<script lang="ts">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import type { Attachment } from 'svelte/attachments';
	import { untrack } from 'svelte';
	import { on } from 'svelte/events';
	import ScrollArea from '../../ScrollArea/ScrollArea.svelte';
	import { useNavigation } from '$lib/utils/useNavigation.svelte.js';
	import type { CalendarThemeProps } from './calendar.theme.js';
	import { useCalendarInputTheme } from './calendar.theme.js';
	import { createCalendarDate, normalizeCalendarDate } from './useCalendar.svelte.js';

	type CalendarMonthYearPickerProps = {
		id: string;
		currentMonth: number;
		currentYear: number;
		locale?: string;
		minDate?: Date;
		maxDate?: Date;
		disabled?: boolean;
		theme?: CalendarThemeProps;
		onSelect: (year: number, month: number) => void;
		onEscape: () => void;
	};

	let {
		id,
		currentMonth,
		currentYear,
		locale,
		minDate,
		maxDate,
		disabled = false,
		theme,
		onSelect,
		onEscape
	}: CalendarMonthYearPickerProps = $props();

	const componentId = untrack(() => id);
	const initialYear = untrack(() => currentYear);
	const yearWindowRadius = 100;
	const yearWindowSpan = yearWindowRadius * 2;
	const classes = $derived(useCalendarInputTheme(theme));
	const t = $derived(useI18n());
	const months = $derived(
		Array.from({ length: 12 }, (_, month) =>
			createCalendarDate(2024, month, 1).toLocaleDateString(locale, { month: 'long' })
		)
	);
	const yearWindow = $derived.by(() => {
		const allowedFirstYear = Math.min(
			minDate?.getFullYear() ?? initialYear - yearWindowRadius,
			currentYear
		);
		const allowedLastYear = Math.max(
			maxDate?.getFullYear() ?? initialYear + yearWindowRadius,
			currentYear
		);
		let firstYear = Math.max(allowedFirstYear, currentYear - yearWindowRadius);
		let lastYear = Math.min(allowedLastYear, firstYear + yearWindowSpan);

		if (lastYear - firstYear < yearWindowSpan) {
			firstYear = Math.max(allowedFirstYear, lastYear - yearWindowSpan);
			lastYear = Math.min(allowedLastYear, firstYear + yearWindowSpan);
		}

		return { firstYear, lastYear };
	});
	const firstYear = $derived(yearWindow.firstYear);
	const lastYear = $derived(yearWindow.lastYear);
	const years = $derived(
		Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index)
	);

	function isMonthDisabled(year: number, month: number) {
		if (disabled) return true;
		const monthStart = createCalendarDate(year, month, 1);
		const monthEnd = createCalendarDate(year, month + 1, 0);
		if (minDate && monthEnd < normalizeCalendarDate(minDate)) return true;
		if (maxDate && monthStart > normalizeCalendarDate(maxDate)) return true;
		return false;
	}

	function isYearDisabled(year: number) {
		return months.every((_, month) => isMonthDisabled(year, month));
	}

	function getClosestAvailableMonth(year: number, preferredMonth: number) {
		let closestMonth: number | null = null;
		for (let month = 0; month < 12; month += 1) {
			if (isMonthDisabled(year, month)) continue;
			if (
				closestMonth === null ||
				Math.abs(month - preferredMonth) < Math.abs(closestMonth - preferredMonth)
			) {
				closestMonth = month;
			}
		}
		return closestMonth;
	}

	function getDefaultMonthIndex() {
		return getClosestAvailableMonth(currentYear, currentMonth);
	}

	function getDefaultYearIndex() {
		let closestIndex: number | null = null;
		for (let index = 0; index < years.length; index += 1) {
			if (isYearDisabled(years[index])) continue;
			if (
				closestIndex === null ||
				Math.abs(years[index] - currentYear) < Math.abs(years[closestIndex] - currentYear)
			) {
				closestIndex = index;
			}
		}
		return closestIndex;
	}

	const monthNavigation = useNavigation({
		id: `${componentId}-month-navigation`,
		orientation: 'vertical',
		loop: false,
		enableHoverFocus: false,
		enabled: () => !disabled,
		defaultFocusedIndex: getDefaultMonthIndex
	});
	const yearNavigation = useNavigation({
		id: `${componentId}-year-navigation`,
		orientation: 'vertical',
		loop: false,
		enableHoverFocus: false,
		enabled: () => !disabled,
		defaultFocusedIndex: getDefaultYearIndex
	});

	const centerSelectedOption: Attachment<HTMLElement> = (node) => {
		const frame = requestAnimationFrame(() => {
			const viewport = node.closest<HTMLElement>('[data-scroll-area-viewport]');
			if (!viewport) return;
			const previousOption =
				node.previousElementSibling instanceof HTMLElement ? node.previousElementSibling : null;
			const optionGap = previousOption
				? node.offsetTop - previousOption.offsetTop - previousOption.offsetHeight
				: 0;
			const optionStride = node.offsetHeight + optionGap;
			const visibleOptions = Math.max(1, Math.floor(viewport.clientHeight / optionStride));
			const optionsBeforeSelection = Math.floor((visibleOptions - 1) / 2);
			viewport.scrollTop = Math.max(0, node.offsetTop - optionsBeforeSelection * optionStride);
		});

		return () => cancelAnimationFrame(frame);
	};
	const focusSelectedMonth: Attachment<HTMLElement> = () => {
		const frame = requestAnimationFrame(() => {
			const selectedIndex = getDefaultMonthIndex();
			if (selectedIndex !== null) monthNavigation.focusItem(selectedIndex);
		});

		return () => cancelAnimationFrame(frame);
	};

	function selectMonth(month: number) {
		if (isMonthDisabled(currentYear, month)) return;
		onSelect(currentYear, month);
	}

	function selectYear(year: number) {
		const month = getClosestAvailableMonth(year, currentMonth);
		if (month === null) return;
		onSelect(year, month);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			onEscape();
			return;
		}

		const activeElement = document.activeElement;
		if (!(activeElement instanceof HTMLElement)) return;
		const isRtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		const nextColumnKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
		const previousColumnKey = isRtl ? 'ArrowRight' : 'ArrowLeft';
		if (activeElement.dataset.pickerColumn === 'month' && event.key === nextColumnKey) {
			event.preventDefault();
			const selectedIndex = getDefaultYearIndex();
			if (selectedIndex !== null) yearNavigation.focusItem(selectedIndex);
		}
		if (activeElement.dataset.pickerColumn === 'year' && event.key === previousColumnKey) {
			event.preventDefault();
			const selectedIndex = getDefaultMonthIndex();
			if (selectedIndex !== null) monthNavigation.focusItem(selectedIndex);
		}
	}

	const escapeToDays: Attachment<HTMLElement> = (node) => on(node, 'keydown', handleKeydown);
</script>

<div
	{id}
	role="group"
	aria-label={t.chooseMonthAndYear}
	class={classes.picker()}
	{@attach escapeToDays}
	{@attach focusSelectedMonth}
>
	<div class={classes.pickerColumn()}>
		<span id={`${id}-month-label`} class={classes.pickerLabel()}>{t.monthLabel}</span>
		<ScrollArea scrollOnEdges type="hover" class={classes.pickerScrollArea()}>
			<div
				role="listbox"
				aria-labelledby={`${id}-month-label`}
				tabindex="-1"
				class={classes.pickerOptions()}
				{@attach monthNavigation.containerReference}
			>
				{#each months as monthLabel, month (month)}
					{@const selected = month === currentMonth}
					{@const optionDisabled = isMonthDisabled(currentYear, month)}
					<button
						type="button"
						role="option"
						aria-selected={selected}
						disabled={optionDisabled}
						data-picker-column="month"
						class={classes.pickerOption({ selected, disabled: optionDisabled })}
						onclick={() => selectMonth(month)}
						{@attach monthNavigation.itemReference}
						{@attach selected ? centerSelectedOption : undefined}
					>
						{monthLabel}
					</button>
				{/each}
			</div>
		</ScrollArea>
	</div>

	<div class={classes.pickerColumn()}>
		<span id={`${id}-year-label`} class={classes.pickerLabel()}>{t.yearLabel}</span>
		<ScrollArea scrollOnEdges type="hover" class={classes.pickerScrollArea()}>
			<div
				role="listbox"
				aria-labelledby={`${id}-year-label`}
				tabindex="-1"
				class={classes.pickerOptions()}
				{@attach yearNavigation.containerReference}
			>
				{#each years as year (year)}
					{@const selected = year === currentYear}
					{@const optionDisabled = isYearDisabled(year)}
					<button
						type="button"
						role="option"
						aria-selected={selected}
						disabled={optionDisabled}
						data-picker-column="year"
						class={classes.pickerOption({ selected, disabled: optionDisabled })}
						onclick={() => selectYear(year)}
						{@attach yearNavigation.itemReference}
						{@attach selected ? centerSelectedOption : undefined}
					>
						{year}
					</button>
				{/each}
			</div>
		</ScrollArea>
	</div>
</div>
