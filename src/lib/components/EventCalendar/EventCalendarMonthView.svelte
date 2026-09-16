<script lang="ts" module>
	import type {
		EventCalendarDateOnly as ModuleDateOnly,
		EventCalendarWeekday as ModuleWeekday
	} from './eventCalendar.types.js';
	import { getCivilWeekday as getModuleCivilWeekday } from './eventCalendar.date.js';

	const WEEKDAYS: readonly ModuleWeekday[] = [0, 1, 2, 3, 4, 5, 6];

	type MonthRow<T> = {
		days: readonly T[];
		leadingEmptyCells: number;
		trailingEmptyCells: number;
	};

	function buildMonthRows<T>(
		days: readonly T[],
		columnCount: number,
		leadingEmptyCells: number
	): readonly MonthRow<T>[] {
		const cells: Array<T | null> = [
			...Array.from<null>({ length: leadingEmptyCells }).fill(null),
			...days
		];
		while (cells.length % columnCount !== 0) cells.push(null);

		const rows: MonthRow<T>[] = [];
		for (let index = 0; index < cells.length; index += columnCount) {
			const cellsInRow = cells.slice(index, index + columnCount);
			const firstDayIndex = cellsInRow.findIndex((day) => day !== null);
			const lastDayIndex = cellsInRow.findLastIndex((day) => day !== null);
			rows.push({
				days: cellsInRow.filter((day): day is T => day !== null),
				leadingEmptyCells: firstDayIndex < 0 ? columnCount : firstDayIndex,
				trailingEmptyCells: lastDayIndex < 0 ? 0 : columnCount - lastDayIndex - 1
			});
		}
		return rows;
	}

	function orderWeekdayHeaderDays(
		days: readonly ModuleDateOnly[],
		weekStartsOn: ModuleWeekday,
		hiddenWeekdays: ReadonlySet<ModuleWeekday>
	): readonly ModuleDateOnly[] {
		const daysByWeekday = new Map(days.map((day) => [getModuleCivilWeekday(day), day]));
		const weekStartIndex = WEEKDAYS.indexOf(weekStartsOn);
		return Array.from(
			{ length: 7 },
			(_, offset) => WEEKDAYS[(weekStartIndex + offset) % WEEKDAYS.length]
		)
			.filter((weekday) => !hiddenWeekdays.has(weekday))
			.map((weekday) => daysByWeekday.get(weekday))
			.filter((day): day is ModuleDateOnly => day !== undefined);
	}

	function getAutoLaneSlots(
		monthHeight: number,
		weekCount: number,
		density: 'compact' | 'normal' | 'comfortable'
	): number {
		if (monthHeight <= 0 || weekCount <= 0) return 3;
		const headerHeight = density === 'compact' ? 24 : density === 'comfortable' ? 36 : 30;
		const itemHeight = density === 'compact' ? 20 : density === 'comfortable' ? 28 : 24;
		const dayChrome = density === 'compact' ? 30 : density === 'comfortable' ? 42 : 36;
		const rowHeight = (monthHeight - headerHeight) / weekCount;
		return Math.max(1, Math.floor((rowHeight - dayChrome) / itemHeight));
	}
</script>

<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { useResizeObserver } from '$lib/utils/useResizeObserver.svelte.js';
	import EventCalendarMonthWeek from './EventCalendarMonthWeek.svelte';
	import {
		addCivilDays,
		generateVisibleDays,
		getCachedDateTimeFormatter,
		getCivilWeekday,
		getHiddenWeekdays,
		getZonedDay,
		rangesIntersect,
		startOfZonedDay
	} from './eventCalendar.date.js';
	import { createEventCalendarAllDayPreviewLayout } from './eventCalendar.allDayInsertion.js';
	import type { EventCalendarDayHeaderPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarDateOnly } from './eventCalendar.types.js';

	let {
		calendar
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	let monthHeight = $state(0);
	const a11y = $derived(calendar.a11y);
	const messages = $derived(calendar.messages);
	const direction = $derived(calendar.direction);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const showWeekNumbers = $derived(calendar.showWeekNumbers);
	const maxItemsPerCell = $derived(calendar.maxItemsPerCell);
	const dayHeader = $derived(calendar.renderers.dayHeader);
	const monthResizeObserver = useResizeObserver({
		isActive: () => maxItemsPerCell === 'auto',
		callback: (entry) => {
			const nextHeight = Math.round(entry.contentRect.height);
			if (monthHeight !== nextHeight) monthHeight = nextHeight;
		}
	});
	const profile = $derived(calendar.dateProfile);
	const itemIndex = $derived(calendar.itemIndex);
	const hiddenWeekdays = $derived(
		getHiddenWeekdays({
			showWeekends: calendar.showWeekends,
			weekendDays: calendar.weekendDays
		})
	);
	const renderDays = $derived(
		generateVisibleDays(
			getZonedDay(profile.renderRange.start, calendar.timeZone),
			getZonedDay(profile.renderRange.end, calendar.timeZone),
			hiddenWeekdays
		)
	);
	const columnCount = $derived(7 - hiddenWeekdays.size);
	const weekdayHeaderDays = $derived(
		orderWeekdayHeaderDays(renderDays, calendar.weekStartsOn, hiddenWeekdays)
	);
	const firstDayColumn = $derived.by(() => {
		const firstRenderDay = renderDays[0];
		if (!firstRenderDay) return 0;
		return weekdayHeaderDays.findIndex(
			(day) => getCivilWeekday(day) === getCivilWeekday(firstRenderDay)
		);
	});
	const weekRows = $derived(buildMonthRows(renderDays, columnCount, Math.max(0, firstDayColumn)));
	const visibleDaySet = $derived(new Set(profile.visibleDays));
	const currentStartDay = $derived(getZonedDay(profile.currentRange.start, calendar.timeZone));
	const currentEndDay = $derived(getZonedDay(profile.currentRange.end, calendar.timeZone));
	const todayDay = $derived(
		calendar.todayInstant ? getZonedDay(calendar.todayInstant, calendar.timeZone) : null
	);
	const enabledDays = $derived.by(() => {
		if (disabled) return new Set<EventCalendarDateOnly>();
		return new Set(
			renderDays.filter((day) => visibleDaySet.has(day) && !isDayOutsideActiveRange(day))
		);
	});
	const weekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'short' })
	);
	const longWeekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'long' })
	);
	const narrowWeekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'narrow' })
	);
	const autoLaneSlots = $derived(getAutoLaneSlots(monthHeight, weekRows.length, density));
	const allDayInsertion = $derived(calendar.interaction.getAllDayInsertion());
	const weekLayouts = $derived(
		weekRows.map((row) => {
			const { days } = row;
			const foregroundSegments = days.flatMap(
				(day) => itemIndex.segmentsByDay.get(day)?.foreground ?? []
			);
			const preview = createEventCalendarAllDayPreviewLayout(
				foregroundSegments,
				days,
				allDayInsertion
			);
			const layout = preview.layout;
			const baseVisibleLaneCount =
				maxItemsPerCell === 'auto'
					? layout.laneCount > autoLaneSlots
						? Math.max(0, autoLaneSlots - 1)
						: autoLaneSlots
					: maxItemsPerCell;
			const previewInsertion = preview.insertion;
			const insertionLaneRequirement = previewInsertion
				? Math.max(
						previewInsertion.lane,
						...preview.layout.placements
							.filter(
								(placement) =>
									placement.startIndex < previewInsertion.endIndex &&
									previewInsertion.startIndex < placement.endIndex
							)
							.map((placement) => placement.lane)
					) + 1
				: 0;
			const visibleLaneCount = Math.max(
				baseVisibleLaneCount,
				Math.min(baseVisibleLaneCount + 1, insertionLaneRequirement)
			);
			const shiftedLayout =
				row.leadingEmptyCells === 0
					? layout
					: {
							...layout,
							placements: layout.placements.map((placement) => ({
								...placement,
								startIndex: placement.startIndex + row.leadingEmptyCells,
								endIndex: placement.endIndex + row.leadingEmptyCells
							}))
						};
			const shiftedInsertion = preview.insertion
				? {
						...preview.insertion,
						startIndex: preview.insertion.startIndex + row.leadingEmptyCells,
						endIndex: preview.insertion.endIndex + row.leadingEmptyCells
					}
				: null;
			return {
				...row,
				layout: shiftedLayout,
				visibleLaneCount,
				insertion: shiftedInsertion,
				draggingOccurrenceKey: preview.draggingOccurrenceKey
			};
		})
	);
	const gridTemplateColumns = $derived(
		showWeekNumbers
			? `minmax(2.5rem, auto) repeat(${columnCount}, minmax(0, 1fr))`
			: `repeat(${columnCount}, minmax(0, 1fr))`
	);
	const gridMinimumWidth = $derived(
		`calc(${columnCount} * var(--event-calendar-month-day-min-width) + ${showWeekNumbers ? '2.5rem' : '0rem'})`
	);

	$effect(() => {
		a11y.configureMonth({
			days: renderDays,
			enabledDays,
			columnCount,
			leadingEmptyCells: Math.max(0, firstDayColumn),
			direction,
			onPage: (pageDirection) => {
				const previousDate = calendar.date.getTime();
				if (pageDirection < 0) calendar.previous();
				else calendar.next();
				return calendar.date.getTime() !== previousDate;
			}
		});
	});

	function isDayOutsideActiveRange(day: EventCalendarDateOnly): boolean {
		const dayRange = {
			start: startOfZonedDay(day, calendar.timeZone),
			end: startOfZonedDay(addCivilDays(day, 1), calendar.timeZone)
		};
		return !rangesIntersect(dayRange, profile.activeRange);
	}
</script>

<div
	role="grid"
	aria-readonly="true"
	aria-rowcount={weekRows.length + 1}
	aria-colcount={columnCount + (showWeekNumbers ? 1 : 0)}
	aria-label={`${messages.eventCalendarMonthView}: ${profile.title}`}
	data-event-calendar-part="month"
	class={classes.month({ density, view: 'month', disabled })}
	{@attach maxItemsPerCell === 'auto' ? monthResizeObserver.reference : null}
>
	<div
		role="row"
		data-event-calendar-part="month-header"
		class={classes.monthHeader({ density, view: 'month', disabled })}
		style:grid-template-columns={gridTemplateColumns}
		style:min-width={gridMinimumWidth}
	>
		{#if showWeekNumbers}
			<div role="columnheader" aria-hidden="true" class={classes.weekNumber()}></div>
		{/if}
		{#each weekdayHeaderDays as day (day)}
			{@const dayInstant = startOfZonedDay(day, calendar.timeZone)}
			{@const defaultLabel = weekdayFormatter.format(dayInstant)}
			{@const headerPayload = {
				day,
				view: 'month',
				isToday: todayDay === day,
				defaultLabel,
				defaultContent: defaultDayHeader
			} satisfies EventCalendarDayHeaderPayload}
			<div
				role="columnheader"
				aria-label={longWeekdayFormatter.format(dayInstant)}
				data-event-calendar-part="day-header"
				class={classes.dayHeader({ density, view: 'month', today: todayDay === day })}
			>
				<Slot render={dayHeader ?? defaultDayHeader} payload={headerPayload} />
			</div>

			{#snippet defaultDayHeader()}
				<span class="hidden @[32rem]:inline">{defaultLabel}</span>
				<span class="@[32rem]:hidden">{narrowWeekdayFormatter.format(dayInstant)}</span>
			{/snippet}
		{/each}
	</div>

	<div
		role="rowgroup"
		data-event-calendar-part="month-grid"
		class={classes.monthGrid({ density, view: 'month', disabled })}
		style:min-width={gridMinimumWidth}
	>
		{#each weekLayouts as weekLayout, weekIndex (`${weekLayout.days[0]}:${weekLayout.days.at(-1)}`)}
			<EventCalendarMonthWeek
				{calendar}
				days={weekLayout.days}
				layout={weekLayout.layout}
				visibleLaneCount={weekLayout.visibleLaneCount}
				insertion={weekLayout.insertion}
				draggingOccurrenceKey={weekLayout.draggingOccurrenceKey}
				leadingEmptyCells={weekLayout.leadingEmptyCells}
				trailingEmptyCells={weekLayout.trailingEmptyCells}
				{weekIndex}
				{gridTemplateColumns}
				{visibleDaySet}
				{enabledDays}
				{currentStartDay}
				{currentEndDay}
				{todayDay}
			/>
		{/each}
	</div>
</div>
