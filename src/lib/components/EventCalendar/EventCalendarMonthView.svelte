<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { useResizeObserver } from '$lib/utils/useResizeObserver.svelte.js';
	import EventCalendarMonthWeek from './EventCalendarMonthWeek.svelte';
	import {
		getCachedDateTimeFormatter,
		getZonedDay,
		startOfZonedDay
	} from './eventCalendar.date.js';
	import {
		createEventCalendarMonthSurface,
		createEventCalendarMonthWeekLayout,
		getEventCalendarMonthAutoLaneSlots
	} from './eventCalendar.month.js';
	import type { EventCalendarDayHeaderPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';

	let {
		calendar
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	let monthHeight = $state(0);
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
	const surface = $derived(createEventCalendarMonthSurface(profile, calendar));
	const todayDay = $derived(
		calendar.todayInstant ? getZonedDay(calendar.todayInstant, calendar.timeZone) : null
	);
	const renderDays = $derived(surface.renderDays);
	const columnCount = $derived(surface.columnCount);
	const weekdayHeaderDays = $derived(surface.weekdayHeaderDays);
	const weekRows = $derived(surface.weeks);
	const weekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'short' })
	);
	const longWeekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'long' })
	);
	const narrowWeekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'narrow' })
	);
	const autoLaneSlots = $derived(
		getEventCalendarMonthAutoLaneSlots(monthHeight, weekRows.length, density)
	);
	const allDayInsertion = $derived(calendar.interaction.getAllDayInsertion());
	const weekLayouts = $derived(
		weekRows.map((week) =>
			createEventCalendarMonthWeekLayout(
				week,
				calendar.itemIndex,
				allDayInsertion,
				maxItemsPerCell,
				autoLaneSlots
			)
		)
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
		calendar.a11y.configureMonth({
			days: renderDays,
			enabledDays: surface.enabledDays,
			columnCount,
			leadingEmptyCells: weekRows[0]?.leadingEmptyCells ?? 0,
			direction: calendar.direction,
			onPage: (pageDirection) => {
				const previousDate = calendar.date.getTime();
				if (pageDirection < 0) calendar.previous();
				else calendar.next();
				return calendar.date.getTime() !== previousDate;
			}
		});
	});
</script>

<div
	role="grid"
	aria-readonly="true"
	aria-rowcount={weekRows.length + 1}
	aria-colcount={columnCount + (showWeekNumbers ? 1 : 0)}
	aria-label={`${calendar.messages.eventCalendarMonthView}: ${profile.title}`}
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
		{#each weekLayouts as weekLayout (`${weekLayout.days[0]}:${weekLayout.days.at(-1)}`)}
			<EventCalendarMonthWeek
				{calendar}
				{surface}
				week={weekLayout}
				{gridTemplateColumns}
				{todayDay}
			/>
		{/each}
	</div>
</div>
