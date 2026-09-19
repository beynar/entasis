<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import EventCalendarItem from './EventCalendarItem.svelte';
	import { getEventCalendarItemColor } from './eventCalendar.color.js';
	import { startOfZonedDay } from './eventCalendar.date.js';
	import type {
		EventCalendarNowIndicatorPayload,
		EventCalendarTimeGutterPayload
	} from './eventCalendar.props.js';

	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import { type EventCalendarTimedDropTarget } from './eventCalendar.targets.js';
	import {
		getEventCalendarElapsedMinutes,
		type EventCalendarTimeGridDayGeometry,
		type EventCalendarTimeSlot
	} from './eventCalendar.timeGrid.js';
	import type { EventCalendarSegment } from './eventCalendar.types.js';

	type EventCalendarTimeGutterLabel = Omit<EventCalendarTimeGutterPayload, 'defaultContent'>;

	let {
		view,
		calendar,
		geometry,
		columnLabel,
		isOffDay,
		selectionKey,
		longDayFormatter,
		accessibleTimeFormatter,
		localTimeLabels,
		nowPayload,
		registerTimeTarget,
		handleTargetKeydown,
		handleTimedSlotClick,
		handleItemActivate
	}: {
		view: 'week' | 'day' | 'days' | 'resource';
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		geometry: EventCalendarTimeGridDayGeometry<TItemFields>;
		columnLabel: string;
		isOffDay: boolean;
		selectionKey: string | null;
		longDayFormatter: Intl.DateTimeFormat;
		accessibleTimeFormatter: Intl.DateTimeFormat;
		localTimeLabels?: readonly EventCalendarTimeGutterLabel[];
		nowPayload: EventCalendarNowIndicatorPayload | null;
		registerTimeTarget: (targetKey: string) => (node: HTMLElement) => () => void;
		handleTargetKeydown: (event: KeyboardEvent, targetKey: string, activate?: boolean) => void;
		handleTimedSlotClick: (target: EventCalendarTimedDropTarget, event: MouseEvent) => void;
		handleItemActivate: (segment: EventCalendarSegment<TItemFields>, event: MouseEvent) => void;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const timeGutter = $derived(calendar.renderers.timeGutter);
	const nowIndicatorContent = $derived(calendar.renderers.nowIndicator || undefined);
	const onItemDoubleClick = $derived(calendar.eventHandlers.onItemDoubleClick);

	function isTimedSlotSelected(slot: EventCalendarTimeSlot): boolean {
		return (
			calendar.selection.kind === 'slot' &&
			!calendar.selection.slot.allDay &&
			calendar.selection.slot.start.getTime() === slot.start.getTime() &&
			calendar.selection.slot.resourceId === geometry.resourceId
		);
	}

	function getTimedPlacementStyle(
		placement: EventCalendarTimeGridDayGeometry<TItemFields>['timedPlacements'][number]
	): string {
		const top =
			getEventCalendarElapsedMinutes(geometry.windowStart, placement.visualStart) /
			calendar.interval;
		const clippedVisualEnd = new Date(
			Math.min(placement.visualEnd.getTime(), geometry.windowEnd.getTime())
		);
		const height = Math.max(
			0.125,
			getEventCalendarElapsedMinutes(placement.visualStart, clippedVisualEnd) / calendar.interval
		);
		const inset = placement.column / placement.columnCount;
		const width = placement.span / placement.columnCount;
		return `top:calc(${top} * var(--event-calendar-slot-height));height:calc(${height} * var(--event-calendar-slot-height));inset-inline-start:${inset * 100}%;width:${width * 100}%`;
	}
	const columnDropTarget = $derived(geometry.timedColumnTarget);
	const timedSelection = $derived.by(() => {
		const slot = calendar.interaction.slot;
		if (
			!slot ||
			calendar.interaction.isValid !== true ||
			slot.allDay ||
			slot.resourceId !== geometry.resourceId
		)
			return null;

		const start = new Date(Math.max(slot.start.getTime(), geometry.windowStart.getTime()));
		const end = new Date(Math.min(slot.end.getTime(), geometry.windowEnd.getTime()));
		if (end <= start) return null;

		return {
			start,
			end,
			top: getEventCalendarElapsedMinutes(geometry.windowStart, start) / calendar.interval,
			height: Math.max(0.125, getEventCalendarElapsedMinutes(start, end) / calendar.interval)
		};
	});
</script>

<div
	role="group"
	aria-label={columnLabel}
	data-event-calendar-part="day-column"
	data-day={geometry.day}
	data-resource-id={geometry.resourceId}
	data-minute-count={geometry.minuteCount}
	data-off-day={isOffDay || undefined}
	class={classes.dayColumn({ density, view, offDay: isOffDay, disabled })}
	style:min-width={view === 'resource' ? 'var(--event-calendar-resource-min-width)' : undefined}
	style:height={`calc(${geometry.minuteCount / calendar.interval} * var(--event-calendar-slot-height))`}
	data-calendar-instance-id={calendar.interaction.instanceId}
	data-event-calendar-target-key={columnDropTarget.key}
	{@attach disabled ? null : calendar.interaction.dropTarget(columnDropTarget)}
>
	{#each localTimeLabels ?? [] as localTimeLabel (localTimeLabel.instant.getTime())}
		{@const timeGutterPayload = {
			...localTimeLabel,
			defaultContent: defaultLocalTimeGutter
		} satisfies EventCalendarTimeGutterPayload}
		<time
			datetime={localTimeLabel.instant.toISOString()}
			data-event-calendar-part="time-label"
			data-event-calendar-local-time-label
			class={classes.timeLabel({
				density,
				view,
				class:
					'inset-inline-start-0 bg-surface/90 pointer-events-none absolute z-[2] w-[var(--event-calendar-time-gutter-width)]'
			})}
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, localTimeLabel.instant) / calendar.interval} * var(--event-calendar-slot-height))`}
			style:height="var(--event-calendar-slot-height)"
		>
			<Slot render={timeGutter ?? timeGutterPayload.defaultContent} payload={timeGutterPayload} />
		</time>

		{#snippet defaultLocalTimeGutter()}
			{localTimeLabel.defaultLabel}
		{/snippet}
	{/each}

	{#each geometry.businessWindows as businessWindow (businessWindow.key)}
		<div
			aria-hidden="true"
			data-event-calendar-business-hours
			data-start={businessWindow.start.toISOString()}
			data-end={businessWindow.end.toISOString()}
			class="bg-color-muted/25 pointer-events-none absolute inset-x-0"
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, businessWindow.start) / calendar.interval} * var(--event-calendar-slot-height))`}
			style:height={`calc(${getEventCalendarElapsedMinutes(businessWindow.start, businessWindow.end) / calendar.interval} * var(--event-calendar-slot-height))`}
		></div>
	{/each}

	{#each geometry.backgroundSegments as segment (segment.key)}
		<div
			aria-hidden="true"
			data-event-calendar-background
			data-occurrence-key={segment.occurrence.key}
			class="pointer-events-none absolute inset-x-0 opacity-20"
			style:background={getEventCalendarItemColor(segment.occurrence)}
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, segment.start) / calendar.interval} * var(--event-calendar-slot-height))`}
			style:height={`calc(${Math.max(0.125, getEventCalendarElapsedMinutes(segment.start, segment.end) / calendar.interval)} * var(--event-calendar-slot-height))`}
		></div>
	{/each}

	{#each geometry.slots as slot (slot.key)}
		{@const isSelected = isTimedSlotSelected(slot)}
		{@const dropTarget = slot.dropTarget}
		<button
			type="button"
			tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(slot.key)}
			aria-label={`${longDayFormatter.format(startOfZonedDay(geometry.day, calendar.timeZone))}, ${accessibleTimeFormatter.format(slot.start)}`}
			aria-pressed={isSelected}
			{disabled}
			data-event-calendar-part="time-slot"
			data-slot-start={slot.start.toISOString()}
			data-slot-end={slot.end.toISOString()}
			data-resource-id={geometry.resourceId}
			data-event-calendar-drop-target="time-slot"
			data-drop-view={view}
			data-drop-all-day="false"
			data-drop-disabled={disabled || undefined}
			data-calendar-instance-id={calendar.interaction.instanceId}
			data-event-calendar-target-key={dropTarget.key}
			class={classes.timeSlot({
				density,
				view,
				disabled,
				invalid: calendar.interaction.isInvalidTarget(dropTarget.key)
			})}
			style:position="absolute"
			style:inset-inline="0"
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, slot.start) / calendar.interval} * var(--event-calendar-slot-height))`}
			style:height={`calc(${getEventCalendarElapsedMinutes(slot.start, slot.end) / calendar.interval} * var(--event-calendar-slot-height))`}
			onfocus={() => a11y.handleTimeTargetFocus(slot.key)}
			onclick={(event) => handleTimedSlotClick(dropTarget, event)}
			onkeydown={(event) => handleTargetKeydown(event, slot.key, true)}
			{@attach disabled ? null : registerTimeTarget(slot.key)}
			{@attach disabled ? null : calendar.interaction.slotDrag(dropTarget)}
		></button>
	{/each}

	{#if timedSelection}
		<div
			aria-hidden="true"
			data-event-calendar-part="slot-selection"
			data-slot-start={timedSelection.start.toISOString()}
			data-slot-end={timedSelection.end.toISOString()}
			class={classes.slotSelection({ density, view, disabled, class: 'absolute' })}
			style:inset-inline="2px"
			style:top={`calc(${timedSelection.top} * var(--event-calendar-slot-height))`}
			style:height={`calc(${timedSelection.height} * var(--event-calendar-slot-height))`}
		></div>
	{/if}

	{#each geometry.intervalInstants as instant (instant.getTime())}
		<div
			aria-hidden="true"
			data-event-calendar-time-line
			data-line-instant={instant.toISOString()}
			class="border-neutral-muted/60 pointer-events-none absolute inset-x-0 z-[1] border-t"
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, instant) / calendar.interval} * var(--event-calendar-slot-height))`}
		></div>
	{/each}

	{#each geometry.timedPlacements as placement (placement.key)}
		{@const segment = placement.segment}
		{@const targetKey = `time-item:${segment.key}`}
		<div class="absolute z-10 min-w-0 px-px" style={getTimedPlacementStyle(placement)}>
			<EventCalendarItem
				{calendar}
				{segment}
				{view}
				projectionResourceId={geometry.resourceId}
				isDragging={calendar.interaction.isDragging(segment.occurrence.key)}
				isSelected={selectionKey === segment.occurrence.key}
				class="h-full min-h-0"
				compactContent
				tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(targetKey)}
				registerControl={disabled ? undefined : registerTimeTarget(targetKey)}
				onControlFocus={() => a11y.handleTimeTargetFocus(targetKey)}
				onControlKeydown={(event) => handleTargetKeydown(event, targetKey)}
				onActivate={(event) => handleItemActivate(segment, event)}
				onDoubleClick={(event) => onItemDoubleClick?.({ occurrence: segment.occurrence, event })}
			/>
		</div>
	{/each}

	{#if nowPayload && nowPayload.now >= geometry.windowStart && nowPayload.now < geometry.windowEnd}
		<div
			role="img"
			aria-label={accessibleTimeFormatter.format(nowPayload.now)}
			data-event-calendar-part="now-indicator"
			class={classes.nowIndicator({ density, view })}
			style:inset-inline="0"
			style:top={`calc(${getEventCalendarElapsedMinutes(geometry.windowStart, nowPayload.now) / calendar.interval} * var(--event-calendar-slot-height))`}
		>
			<Slot render={nowIndicatorContent ?? defaultNowIndicator} payload={nowPayload} />
		</div>
	{/if}
</div>

{#snippet defaultNowIndicator()}
	<span class="sr-only">{nowPayload ? accessibleTimeFormatter.format(nowPayload.now) : ''}</span>
{/snippet}
