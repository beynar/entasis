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

	function getAllDayBarWidth(startIndex: number, endIndex: number): string {
		return `calc(${endIndex - startIndex} * 100%)`;
	}
</script>

<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import EventCalendarItem from './EventCalendarItem.svelte';
	import {
		getEventCalendarItemColor,
		isEventCalendarSemanticColor
	} from './eventCalendar.color.js';
	import { startOfZonedDay } from './eventCalendar.date.js';
	import type { EventCalendarAllDayRowInsertion } from './eventCalendar.allDayInsertion.js';
	import type { EventCalendarLaneLayout } from './eventCalendar.layout.js';
	import { serializeEventCalendarTarget } from './eventCalendar.interactions.svelte.js';
	import type { EventCalendarAllDayPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarTimeGridDayGeometry } from './eventCalendar.timeGrid.js';
	import type { EventCalendarDateOnly, EventCalendarSegment } from './eventCalendar.types.js';

	let {
		view,
		calendar,
		dayGeometries,
		allDayBackgroundSegments,
		allDayLayout,
		insertion,
		draggingOccurrenceKey,
		allDayHeight,
		gridTemplateColumns,
		allDayPayload,
		offDaysByDay,
		longDayFormatter,
		columnLabels,
		selectionKey,
		registerTimeTarget,
		handleTargetKeydown,
		handleAllDayClick,
		handleItemActivate
	}: {
		view: 'week' | 'day' | 'days' | 'resource';
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		dayGeometries: readonly EventCalendarTimeGridDayGeometry<TItemFields>[];
		allDayBackgroundSegments: ReadonlyMap<string, readonly EventCalendarSegment<TItemFields>[]>;
		allDayLayout: EventCalendarLaneLayout<TItemFields>;
		insertion: EventCalendarAllDayRowInsertion | null;
		draggingOccurrenceKey: string | null;
		allDayHeight: string;
		gridTemplateColumns: string;
		allDayPayload: EventCalendarAllDayPayload<TItemFields>;
		offDaysByDay: ReadonlyMap<EventCalendarDateOnly, boolean>;
		longDayFormatter: Intl.DateTimeFormat;
		columnLabels: ReadonlyMap<string, string>;
		selectionKey: string | null;
		registerTimeTarget: (targetKey: string) => (node: HTMLElement) => () => void;
		handleTargetKeydown: (event: KeyboardEvent, targetKey: string, activate?: boolean) => void;
		handleAllDayClick: (day: EventCalendarDateOnly, event: MouseEvent, resourceId?: string) => void;
		handleItemActivate: (segment: EventCalendarSegment<TItemFields>, event: MouseEvent) => void;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const messages = $derived(calendar.messages);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const allDay = $derived(calendar.renderers.allDay);
	const onItemDoubleClick = $derived(calendar.eventHandlers.onItemDoubleClick);
</script>

<div
	data-event-calendar-part="all-day-row"
	class={classes.allDayRow({ density, view, disabled })}
	style:grid-template-columns={gridTemplateColumns}
>
	<div data-event-calendar-part="time-gutter" class={classes.timeGutter({ density, view })}>
		<Slot render={allDay ?? allDayPayload.defaultContent} payload={allDayPayload} />
	</div>
	{#each dayGeometries as geometry (geometry.key)}
		{@const isOff = offDaysByDay.get(geometry.day) ?? false}
		{@const targetKey = `all-day:${geometry.key}`}
		{@const isSelected =
			calendar.selection.kind === 'slot' &&
			calendar.selection.slot.allDay &&
			calendar.selection.slot.start === geometry.day &&
			calendar.selection.slot.resourceId === geometry.resourceId}
		{@const dropTarget = {
			key: `${view}:all-day:${geometry.key}`,
			view,
			allDay: true as const,
			day: geometry.day,
			resourceId: geometry.resourceId
		}}
		<div
			role="group"
			aria-label={columnLabels.get(geometry.key)}
			data-event-calendar-part="all-day-cell"
			data-day={geometry.day}
			data-resource-id={geometry.resourceId}
			data-off-day={isOff || undefined}
			class={classes.allDayCell({
				density,
				view,
				offDay: isOff,
				disabled,
				invalid: calendar.interaction.isInvalidTarget(dropTarget.key)
			})}
			style:height={allDayHeight}
			style:min-width={view === 'resource' ? 'var(--event-calendar-resource-min-width)' : undefined}
			data-event-calendar-target={serializeEventCalendarTarget(dropTarget)}
			data-calendar-instance-id={calendar.interaction.instanceId}
			data-event-calendar-target-key={dropTarget.key}
			{@attach disabled ? null : calendar.interaction.dropTarget(dropTarget)}
		>
			<button
				type="button"
				tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(targetKey)}
				aria-label={`${messages.eventCalendarAllDay}, ${longDayFormatter.format(startOfZonedDay(geometry.day, calendar.timeZone))}`}
				aria-pressed={isSelected}
				{disabled}
				data-event-calendar-all-day-hit-area
				data-event-calendar-drop-target="all-day"
				data-drop-view={view}
				data-drop-all-day="true"
				data-drop-disabled={disabled || undefined}
				class="absolute inset-0 z-0 bg-transparent outline-none"
				onfocus={() => a11y.handleTimeTargetFocus(targetKey)}
				onclick={(event) => handleAllDayClick(geometry.day, event, geometry.resourceId)}
				onkeydown={(event) => handleTargetKeydown(event, targetKey, true)}
				{@attach disabled ? null : registerTimeTarget(targetKey)}
				{@attach disabled ? null : calendar.interaction.slotDrag(dropTarget)}
			>
				{#if calendar.interaction.isSlotDraftTarget(dropTarget)}
					<span
						aria-hidden="true"
						data-event-calendar-part="slot-selection"
						class={classes.slotSelection({
							density,
							view,
							invalid: calendar.interaction.isValid === false,
							class: 'absolute inset-0'
						})}
					></span>
				{/if}
			</button>
			{#each allDayBackgroundSegments.get(geometry.key) ?? [] as segment (segment.key)}
				<div
					aria-hidden="true"
					data-event-calendar-background
					data-occurrence-key={segment.occurrence.key}
					class="pointer-events-none absolute inset-0 opacity-20"
					style:background={getEventCalendarItemColor(segment.occurrence)}
				></div>
			{/each}
			{#if calendar.interaction.isValid === true && insertion?.startIndex === geometry.column}
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
						class="inset-inline-start-0 duration-fast pointer-events-none absolute z-20 h-[var(--event-calendar-item-min-height)] px-0.5 transition-[top] motion-reduce:transition-none"
						style:top={`calc(${insertion.lane} * var(--event-calendar-item-min-height))`}
						style:width={getAllDayBarWidth(insertion.startIndex, insertion.endIndex)}
					>
						<div
							data-event-calendar-part="drop-indicator"
							data-color={indicatorColor}
							class={classes.dropIndicator({
								density,
								color: indicatorColor,
								view,
								class: 'h-full w-full'
							})}
							style:--event-calendar-item-color={indicatorItemColor}
						></div>
					</div>
				{/if}
			{/if}
			{#each allDayLayout.placements.filter((placement) => placement.startIndex === geometry.column) as placement (placement.key)}
				{@const segment = getPlacementSegment(placement.segments)}
				{@const itemTargetKey = `all-day-item:${placement.key}`}
				<div
					class="duration-fast pointer-events-auto absolute z-10 px-0.5 transition-[top,opacity] motion-reduce:transition-none"
					class:pointer-events-none={placement.occurrence.key === draggingOccurrenceKey}
					class:opacity-0={placement.occurrence.key === draggingOccurrenceKey}
					style:top={`calc(${placement.lane} * var(--event-calendar-item-min-height))`}
					style:inset-inline-start="0"
					style:width={getAllDayBarWidth(placement.startIndex, placement.endIndex)}
				>
					<EventCalendarItem
						{calendar}
						{segment}
						{view}
						projectionResourceId={geometry.resourceId}
						isDragging={calendar.interaction.isDragging(segment.occurrence.key)}
						isSelected={selectionKey === placement.occurrence.key}
						tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(itemTargetKey)}
						registerControl={disabled ? undefined : registerTimeTarget(itemTargetKey)}
						onControlFocus={() => a11y.handleTimeTargetFocus(itemTargetKey)}
						onControlKeydown={(event) => handleTargetKeydown(event, itemTargetKey)}
						onActivate={(event) => handleItemActivate(segment, event)}
						onDoubleClick={(event) =>
							onItemDoubleClick?.({ occurrence: segment.occurrence, event })}
					/>
				</div>
			{/each}
		</div>
	{/each}
</div>
