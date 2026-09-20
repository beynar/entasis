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
	import type { EventCalendarAllDayDropTarget } from './eventCalendar.targets.js';
	import type { EventCalendarLaneLayout } from './eventCalendar.layout.js';
	import type { EventCalendarAllDayPayload } from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';

	import {
		getEventCalendarTimeGridItemTargetKey,
		type EventCalendarTimeGridDayGeometry
	} from './eventCalendar.timeGrid.js';
	import type { EventCalendarSegment } from './eventCalendar.types.js';

	let {
		view,
		calendar,
		dayGeometries,
		allDayLayout,
		insertion,
		draggingOccurrenceKey,
		allDayHeight,
		gridTemplateColumns,
		allDayPayload,
		longDayFormatter,
		selectionKey,
		registerTimeTarget,
		handleTargetKeydown,
		handleAllDayClick,
		handleItemActivate
	}: {
		view: 'week' | 'day' | 'days' | 'resource';
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		dayGeometries: readonly EventCalendarTimeGridDayGeometry<TItemFields>[];
		allDayLayout: EventCalendarLaneLayout<TItemFields>;
		insertion: EventCalendarAllDayRowInsertion | null;
		draggingOccurrenceKey: string | null;
		allDayHeight: string;
		gridTemplateColumns: string;
		allDayPayload: EventCalendarAllDayPayload<TItemFields>;
		longDayFormatter: Intl.DateTimeFormat;
		selectionKey: string | null;
		registerTimeTarget: (targetKey: string) => (node: HTMLElement) => () => void;
		handleTargetKeydown: (event: KeyboardEvent, targetKey: string, activate?: boolean) => void;
		handleAllDayClick: (target: EventCalendarAllDayDropTarget, event: MouseEvent) => void;
		handleItemActivate: (segment: EventCalendarSegment<TItemFields>, event: MouseEvent) => void;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
</script>

<div
	data-event-calendar-part="all-day-row"
	class={classes.allDayRow({ density, view, disabled })}
	style:grid-template-columns={gridTemplateColumns}
>
	<div data-event-calendar-part="time-gutter" class={classes.timeGutter({ density, view })}>
		<Slot
			render={calendar.renderers.allDay ?? allDayPayload.defaultContent}
			payload={allDayPayload}
		/>
	</div>
	{#each dayGeometries as geometry (geometry.key)}
		{@const targetKey = `all-day:${geometry.key}`}
		{@const isSelected =
			calendar.selection.kind === 'slot' &&
			calendar.selection.slot.allDay &&
			calendar.selection.slot.start === geometry.day &&
			calendar.selection.slot.resourceId === geometry.resourceId}
		{@const dropTarget = geometry.allDayDropTarget}
		<div
			role="group"
			aria-label={geometry.columnLabel ?? geometry.day}
			data-event-calendar-part="all-day-cell"
			data-day={geometry.day}
			data-resource-id={geometry.resourceId}
			data-off-day={geometry.offDay || undefined}
			class={classes.allDayCell({
				density,
				view,
				offDay: geometry.offDay,
				disabled,
				invalid: calendar.interaction.isInvalidTarget(dropTarget.key)
			})}
			style:height={allDayHeight}
			style:min-width={view === 'resource' ? 'var(--event-calendar-resource-min-width)' : undefined}
			data-calendar-instance-id={calendar.interaction.instanceId}
			data-event-calendar-target-key={dropTarget.key}
			{@attach disabled ? null : calendar.interaction.dropTarget(dropTarget)}
		>
			<button
				type="button"
				tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(targetKey)}
				aria-label={`${calendar.messages.eventCalendarAllDay}, ${longDayFormatter.format(startOfZonedDay(geometry.day, calendar.timeZone))}`}
				aria-pressed={isSelected}
				{disabled}
				data-event-calendar-all-day-hit-area
				data-event-calendar-drop-target="all-day"
				data-drop-view={view}
				data-drop-all-day="true"
				data-drop-disabled={disabled || undefined}
				class="absolute inset-0 z-0 bg-transparent outline-none"
				onfocus={() => a11y.handleTimeTargetFocus(targetKey)}
				onclick={(event) => handleAllDayClick(dropTarget, event)}
				onkeydown={(event) => handleTargetKeydown(event, targetKey, true)}
				{@attach disabled ? null : registerTimeTarget(targetKey)}
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
			{#each geometry.allDayBackgroundSegments as segment (segment.key)}
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
						style:width={`calc(${insertion.endIndex - insertion.startIndex} * 100%)`}
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
				{@const itemTargetKey = getEventCalendarTimeGridItemTargetKey(
					'all-day',
					geometry.key,
					placement.key
				)}
				<div
					class="duration-fast pointer-events-auto absolute z-10 px-0.5 transition-[top,opacity] motion-reduce:transition-none"
					data-event-calendar-navigation-key={itemTargetKey}
					class:pointer-events-none={placement.occurrence.key === draggingOccurrenceKey}
					class:opacity-0={placement.occurrence.key === draggingOccurrenceKey}
					style:top={`calc(${placement.lane} * var(--event-calendar-item-min-height))`}
					style:inset-inline-start="0"
					style:width={`calc(${placement.endIndex - placement.startIndex} * 100%)`}
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
							calendar.eventHandlers.onItemDoubleClick?.({ occurrence: segment.occurrence, event })}
					/>
				</div>
			{/each}
		</div>
	{/each}
</div>
