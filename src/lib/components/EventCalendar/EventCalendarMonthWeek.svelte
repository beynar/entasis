<script lang="ts" module>
	import type { EventCalendarSegment as ModuleSegment } from './eventCalendar.types.js';

	function getPlacementSegment<TItemFields extends object>(
		segments: readonly ModuleSegment<TItemFields>[]
	): ModuleSegment<TItemFields> {
		const first = segments[0];
		const last = segments[segments.length - 1];
		if (first === last) return first;
		return { ...first, end: last.end, isEnd: last.isEnd, continuesAfter: last.continuesAfter };
	}

	function getMonthBarWidth(startIndex: number, endIndex: number): string {
		const span = endIndex - startIndex;
		return `calc(${span} * (100% + 1px) - 1px)`;
	}
</script>

<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { untrack } from 'svelte';
	import EventCalendarItem from './EventCalendarItem.svelte';
	import EventCalendarMonthOverflow from './EventCalendarMonthOverflow.svelte';
	import {
		getEventCalendarItemColor,
		isEventCalendarSemanticColor
	} from './eventCalendar.color.js';
	import {
		addCivilDays,
		getCachedDateTimeFormatter,
		isEventCalendarOffDay,
		getWeekNumber,
		startOfZonedDay
	} from './eventCalendar.date.js';
	import { eventCalendarMonthDayTarget } from './eventCalendar.targets.js';
	import type {
		EventCalendarMonthSurface,
		EventCalendarMonthWeekLayout
	} from './eventCalendar.month.js';
	import type { EventCalendarMonthCellPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarDateOnly, EventCalendarSegment } from './eventCalendar.types.js';

	let {
		calendar,
		surface,
		week,
		gridTemplateColumns,
		todayDay
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		surface: EventCalendarMonthSurface;
		week: EventCalendarMonthWeekLayout<TItemFields>;
		gridTemplateColumns: string;
		todayDay: EventCalendarDateOnly | null;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const selectionKey = $derived(
		calendar.selection.kind === 'item' ? calendar.selection.itemKey : null
	);
	const fullDayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
	const dayNumberFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { day: 'numeric' })
	);

	function getHiddenSegments(
		day: EventCalendarDateOnly,
		gridDayIndex: number
	): readonly EventCalendarSegment<TItemFields>[] {
		return week.layout.placements
			.filter(
				({ lane, occurrence, startIndex, endIndex }) =>
					(lane >= week.visibleLaneCount ||
						calendar.interaction.isDraggingFromOverflow(occurrence.key)) &&
					startIndex + week.leadingEmptyCells <= gridDayIndex &&
					endIndex + week.leadingEmptyCells > gridDayIndex
			)
			.flatMap(({ segments }) => segments.filter((segment) => segment.day === day));
	}

	function handleItemActivate(segment: EventCalendarSegment<TItemFields>, event: MouseEvent): void {
		calendar.interaction.resetSinglePointerSlot();
		calendar.eventHandlers.onItemClick?.({ occurrence: segment.occurrence, event });
		if (event.defaultPrevented) return;
		calendar.select({ kind: 'item', itemKey: segment.occurrence.key, slot: null });
	}

	function handleItemDoubleClick(
		segment: EventCalendarSegment<TItemFields>,
		event: MouseEvent
	): void {
		calendar.eventHandlers.onItemDoubleClick?.({ occurrence: segment.occurrence, event });
	}

	function handleDayClick(day: EventCalendarDateOnly, event: MouseEvent): void {
		if (a11y.activateMutationTarget(eventCalendarMonthDayTarget(day))) return;
		if (calendar.interaction.shouldSuppressSlotClick()) return;
		if (!surface.enabledDays.has(day)) return;
		(event.currentTarget as HTMLElement).focus();
		const slot = {
			view: 'month' as const,
			allDay: true as const,
			start: day,
			end: addCivilDays(day, 1)
		};
		calendar.eventHandlers.onSlotClick?.({ slot, event });
		if (event.defaultPrevented) return calendar.interaction.resetSinglePointerSlot();
		if (calendar.interaction.selectSinglePointerSlot(slot)) return;
		calendar.select({ kind: 'slot', itemKey: null, slot });
	}
</script>

{#snippet placeholderCell()}
	<div
		role="gridcell"
		aria-disabled="true"
		data-event-calendar-part="month-cell"
		data-domain-placeholder
		class={classes.monthCell({ density, view: 'month', disabled: true, outside: true })}
	></div>
{/snippet}

<div
	role="row"
	data-event-calendar-part="week-row"
	class={classes.weekRow({ density, view: 'month', disabled: calendar.disabled })}
	style:grid-template-columns={gridTemplateColumns}
>
	{#if calendar.showWeekNumbers}
		{@const weekNumber = getWeekNumber(week.days[0], calendar.weekStartsOn)}
		<div
			role="rowheader"
			aria-label={calendar.messages.eventCalendarWeekNumber(weekNumber)}
			data-event-calendar-part="week-number"
			class={classes.weekNumber({ density, view: 'month' })}
		>
			{weekNumber}
		</div>
	{/if}

	{#each Array.from({ length: week.leadingEmptyCells }, (_, index) => index) as placeholderIndex (placeholderIndex)}
		{@render placeholderCell()}
	{/each}

	{#each week.days as day, dayIndex (day)}
		{@const gridDayIndex = dayIndex + week.leadingEmptyCells}
		{@const isRenderedDay = surface.visibleDaySet.has(day)}
		{@const isOutside = day < surface.currentStartDay || day >= surface.currentEndDay}
		{@const isToday = todayDay === day}
		{@const isOff = isEventCalendarOffDay(day, calendar.offDays, calendar.weekendDays)}
		{@const isDisabled = !surface.enabledDays.has(day)}
		{@const segments = isRenderedDay ? (calendar.itemIndex.segmentsByDay.get(day)?.all ?? []) : []}
		{@const hiddenSegments = isRenderedDay ? getHiddenSegments(day, gridDayIndex) : []}
		{@const dayLabel = fullDayFormatter.format(startOfZonedDay(day, calendar.timeZone))}
		{@const cellPayload = {
			day,
			segments,
			isToday,
			isOutside,
			isOffDay: isOff,
			isDisabled,
			overflowCount: hiddenSegments.length,
			defaultContent: defaultMonthCell
		} satisfies EventCalendarMonthCellPayload<TItemFields>}
		{@const dropTarget = eventCalendarMonthDayTarget(day)}
		<div
			role="gridcell"
			aria-label={isRenderedDay ? dayLabel : undefined}
			aria-disabled={isDisabled}
			aria-selected={calendar.selection.kind === 'slot' &&
				calendar.selection.slot.allDay &&
				calendar.selection.slot.start === day}
			tabindex={isRenderedDay ? a11y.getDayTabIndex(day) : -1}
			data-event-calendar-part="month-cell"
			data-day={day}
			data-outside={isOutside || undefined}
			data-today={isToday || undefined}
			data-off-day={isOff || undefined}
			data-disabled={isDisabled || undefined}
			data-event-calendar-drop-target={isRenderedDay ? 'month-day' : undefined}
			data-drop-view={isRenderedDay ? 'month' : undefined}
			data-drop-all-day={isRenderedDay ? 'true' : undefined}
			data-drop-disabled={isDisabled || undefined}
			data-calendar-instance-id={calendar.interaction.instanceId}
			data-event-calendar-target-key={dropTarget.key}
			class={classes.monthCell({
				density,
				view: 'month',
				disabled: isDisabled,
				today: isToday,
				outside: isOutside,
				offDay: isOff,
				invalid: calendar.interaction.isInvalidTarget(dropTarget.key)
			})}
			onfocus={() => isRenderedDay && a11y.handleDayFocus(day)}
			onclick={(event) => isRenderedDay && handleDayClick(day, event)}
			onkeydown={(event) => {
				if (!isRenderedDay) return;
				if (a11y.handleDayKeydown(event, day)) return;
				if (event.key !== 'Enter' && event.key !== ' ') return;
				event.preventDefault();
				(event.currentTarget as HTMLElement).click();
			}}
			{@attach isRenderedDay
				? (node: HTMLElement) => untrack(() => a11y.registerDay(day, node))
				: null}
			{@attach isRenderedDay && !isDisabled ? calendar.interaction.dropTarget(dropTarget) : null}
		>
			{#if isRenderedDay}
				{#if calendar.interaction.isSlotDraftTarget(dropTarget)}
					<div
						aria-hidden="true"
						data-event-calendar-part="slot-selection"
						class={classes.slotSelection({
							density,
							view: 'month',
							invalid: calendar.interaction.isValid === false,
							class: 'absolute inset-0'
						})}
					></div>
				{/if}
				<Slot render={calendar.renderers.monthCell ?? defaultMonthCell} payload={cellPayload} />

				{#each segments.filter((segment) => segment.occurrence.item.display === 'background') as segment (segment.key)}
					<div
						aria-hidden="true"
						data-event-calendar-background
						data-occurrence-key={segment.occurrence.key}
						class="pointer-events-none absolute inset-x-0 top-7 bottom-0 bg-[var(--event-calendar-item-color)] opacity-20"
						style:--event-calendar-item-color={getEventCalendarItemColor(segment.occurrence)}
					></div>
				{/each}

				{#if calendar.interaction.isValid === true && week.insertion && week.insertion.startIndex + week.leadingEmptyCells === gridDayIndex && week.insertion.lane < week.visibleLaneCount}
					{@const proposal = calendar.interaction.proposal}
					{#if proposal}
						{@const indicatorColor = isEventCalendarSemanticColor(proposal.item.color)
							? proposal.item.color
							: 'neutral'}
						{@const indicatorItemColor =
							proposal.item.color && !isEventCalendarSemanticColor(proposal.item.color)
								? proposal.item.color
								: 'var(--color)'}
						<div
							aria-hidden="true"
							class="inset-inline-start-0 duration-fast pointer-events-none absolute z-20 h-[var(--event-calendar-item-min-height)] px-1 transition-[top] motion-reduce:transition-none"
							style:top={`calc(1.75rem + ${week.insertion.lane} * var(--event-calendar-item-min-height))`}
							style:width={getMonthBarWidth(week.insertion.startIndex, week.insertion.endIndex)}
						>
							<div
								data-event-calendar-part="drop-indicator"
								data-color={indicatorColor}
								class={classes.dropIndicator({
									density,
									color: indicatorColor,
									view: 'month',
									class: 'h-full w-full'
								})}
								style:--event-calendar-item-color={indicatorItemColor}
							></div>
						</div>
					{/if}
				{/if}

				{#each week.layout.placements.filter((placement) => placement.startIndex + week.leadingEmptyCells === gridDayIndex && placement.lane < week.visibleLaneCount) as placement (placement.key)}
					{@const segment = getPlacementSegment(placement.segments)}
					<div
						class="inset-inline-start-0 duration-fast pointer-events-auto absolute z-10 h-[var(--event-calendar-item-min-height)] px-1 transition-[top,opacity] motion-reduce:transition-none"
						class:pointer-events-none={calendar.interaction.isDragging(placement.occurrence.key)}
						class:opacity-0={calendar.interaction.isDragging(placement.occurrence.key)}
						style:top={`calc(1.75rem + ${placement.lane} * var(--event-calendar-item-min-height))`}
						style:width={getMonthBarWidth(placement.startIndex, placement.endIndex)}
					>
						<EventCalendarItem
							{calendar}
							{segment}
							view="month"
							isDragging={calendar.interaction.isDragging(segment.occurrence.key)}
							allowResize={segment.occurrence.allDay}
							isSelected={selectionKey === placement.occurrence.key}
							class="h-full min-h-0"
							onActivate={(event) => handleItemActivate(segment, event)}
							onDoubleClick={(event) => handleItemDoubleClick(segment, event)}
						/>
					</div>
				{/each}

				{#if hiddenSegments.length > 0}
					<div class="absolute inset-x-1 bottom-1 z-20">
						<EventCalendarMonthOverflow
							{calendar}
							{day}
							{dayLabel}
							{hiddenSegments}
							{selectionKey}
							onItemActivate={handleItemActivate}
							onItemDoubleClick={handleItemDoubleClick}
						/>
					</div>
				{/if}
			{/if}
		</div>

		{#snippet defaultMonthCell()}
			<span
				data-event-calendar-part="day-number"
				class={classes.dayNumber({ density, view: 'month', today: isToday })}
			>
				{dayNumberFormatter.format(startOfZonedDay(day, calendar.timeZone))}
			</span>
		{/snippet}
	{/each}

	{#each Array.from({ length: week.trailingEmptyCells }, (_, index) => index) as placeholderIndex (placeholderIndex)}
		{@render placeholderCell()}
	{/each}
</div>
