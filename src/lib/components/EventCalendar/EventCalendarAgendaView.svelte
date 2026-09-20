<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import { untrack } from 'svelte';
	import { createEventCalendarAgendaGroups } from './eventCalendar.agenda.js';
	import type { EventCalendarAgendaEntry } from './eventCalendar.agenda.js';
	import {
		getEventCalendarItemColor,
		isEventCalendarSemanticColor
	} from './eventCalendar.color.js';
	import { getCachedDateTimeFormatter, startOfZonedDay } from './eventCalendar.date.js';
	import type {
		EventCalendarAgendaDetailsPayload,
		EventCalendarItemPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type {
		EventCalendarDateOnly,
		EventCalendarOccurrence,
		EventCalendarSegment
	} from './eventCalendar.types.js';

	let {
		calendar
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const messages = $derived(calendar.messages);
	const density = $derived(calendar.density);
	const disabled = $derived(calendar.disabled);
	const scrollMode = $derived(calendar.scrollMode);
	const classes = $derived(calendar.classes);
	const profile = $derived(calendar.dateProfile);
	const groups = $derived(createEventCalendarAgendaGroups(profile.visibleDays, calendar.itemIndex));
	const agendaFormatters = $derived({
		time: getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			hour: 'numeric',
			minute: '2-digit'
		}),
		accessibleDateTime: getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		}),
		zonedTime: getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		})
	});
	const selectedItemKey = $derived(
		calendar.selection.kind === 'item' ? calendar.selection.itemKey : null
	);
	const dayLabelFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
	const weekdayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, { weekday: 'long' })
	);
	const dateFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);
	$effect(() => {
		const days = groups.map((group) => group.day);
		untrack(() => a11y.configureAgenda({ days }));
	});

	function registerAgendaDay(day: EventCalendarDateOnly) {
		return (node: HTMLElement) => untrack(() => a11y.registerDay(day, node));
	}

	function handleItemActivate(
		occurrence: EventCalendarOccurrence<TItemFields>,
		event: MouseEvent
	): void {
		calendar.interaction.resetSinglePointerSlot();
		calendar.eventHandlers.onItemClick?.({ occurrence, event });
		if (!event.defaultPrevented)
			calendar.select({ kind: 'item', itemKey: occurrence.key, slot: null });
	}

	function preventDisabledDisclosure(event: Event): void {
		if (
			!disabled ||
			(event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key))
		)
			return;
		event.preventDefault();
	}

	function getTimeZoneName(formatter: Intl.DateTimeFormat, instant: Date): string {
		return (
			formatter.formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? ''
		);
	}

	function getAgendaTimeLabel(
		occurrence: EventCalendarOccurrence<TItemFields>,
		segment: EventCalendarSegment<TItemFields>
	): string {
		if (occurrence.allDay) return messages.eventCalendarAllDay;
		const startZone = getTimeZoneName(agendaFormatters.zonedTime, segment.start);
		const endZone = getTimeZoneName(agendaFormatters.zonedTime, segment.end);
		return startZone === endZone
			? `${agendaFormatters.time.format(segment.start)} – ${agendaFormatters.time.format(segment.end)}`
			: `${agendaFormatters.zonedTime.format(segment.start)} – ${agendaFormatters.zonedTime.format(segment.end)}`;
	}

	function getAgendaAccessibleLabel(occurrence: EventCalendarOccurrence<TItemFields>): string {
		const formatter = occurrence.allDay ? dateFormatter : agendaFormatters.accessibleDateTime;
		const inclusiveEnd = occurrence.allDay
			? new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1))
			: occurrence.end;
		const rangeLabel =
			occurrence.start.getTime() === inclusiveEnd.getTime()
				? formatter.format(occurrence.start)
				: occurrence.allDay
					? formatter.formatRange(occurrence.start, inclusiveEnd)
					: `${formatter.format(occurrence.start)} – ${formatter.format(inclusiveEnd)}`;
		return `${occurrence.item.title}, ${rangeLabel}`;
	}
</script>

{#snippet agendaItem(entry: EventCalendarAgendaEntry<TItemFields>, isSelected: boolean)}
	{@const occurrence = entry.occurrence}
	{@const semanticColor = isEventCalendarSemanticColor(occurrence.item.color)
		? occurrence.item.color
		: 'neutral'}
	{@const itemColor = getEventCalendarItemColor(occurrence)}
	{@const timeLabel = getAgendaTimeLabel(occurrence, entry.segment)}
	{@const accessibleLabel = getAgendaAccessibleLabel(occurrence)}
	{@const itemPayload = {
		occurrence,
		segment: entry.segment,
		view: 'agenda',
		isSelected,
		isDragging: false,
		defaultContent,
		markerContent,
		titleContent,
		timeContent
	} satisfies EventCalendarItemPayload<TItemFields>}
	<li
		data-event-calendar-part="agenda-item"
		data-occurrence-key={occurrence.key}
		data-segment-key={entry.segment.key}
		data-selected={isSelected || undefined}
		data-color={semanticColor}
		style:--event-calendar-item-color={itemColor}
		class={classes.agendaItem({
			density,
			color: semanticColor,
			view: 'agenda',
			selected: isSelected,
			disabled
		})}
	>
		<div class="flex min-w-0 items-stretch">
			<button
				type="button"
				aria-label={accessibleLabel}
				aria-pressed={isSelected}
				{disabled}
				data-event-calendar-agenda-control
				class={classes.itemControl({
					density,
					color: semanticColor,
					view: 'agenda',
					selected: false,
					disabled,
					class:
						'min-h-11 flex-1 rounded-none border-0 bg-transparent py-0 ps-6 pe-4 [--state-hover-opacity:0.06] focus-visible:ring-inset'
				})}
				onclick={(event) => handleItemActivate(occurrence, event)}
				ondblclick={(event) => calendar.eventHandlers.onItemDoubleClick?.({ occurrence, event })}
				onfocus={() => a11y.handleOccurrenceFocus(occurrence.key, entry.segment.day)}
				{@attach (node: HTMLElement) =>
					untrack(() => a11y.registerOccurrenceControl(occurrence.key, node))}
			>
				<Slot render={calendar.renderers.item ?? defaultContent} payload={itemPayload} />
			</button>

			{#if calendar.renderers.agendaDetails}
				<details
					class="w-10 shrink-0 self-center open:w-[min(20rem,70%)]"
					data-event-calendar-agenda-disclosure
				>
					<summary
						aria-label={messages.eventCalendarDetails(occurrence.item.title)}
						aria-disabled={disabled}
						tabindex={disabled ? -1 : 0}
						class="state-layer text-neutral/55 focus-visible:ring-focus/50 grid size-9 cursor-pointer list-none place-items-center rounded outline-none marker:content-none focus-visible:ring-2 [&::-webkit-details-marker]:hidden"
						onclick={preventDisabledDisclosure}
						onkeydown={preventDisabledDisclosure}
					>
						<span aria-hidden="true">•••</span>
					</summary>
					<div
						data-event-calendar-part="agenda-details"
						class={classes.agendaDetails({
							density,
							color: semanticColor,
							view: 'agenda',
							disabled,
							class: 'border-neutral-muted mt-1 border-t px-2 py-2'
						})}
					>
						<Slot
							render={calendar.renderers.agendaDetails}
							payload={{ occurrence } satisfies EventCalendarAgendaDetailsPayload<TItemFields>}
						/>
					</div>
				</details>
			{/if}
		</div>
	</li>

	{#snippet defaultContent()}
		<span
			class="grid min-w-0 grid-cols-[8rem_0.5rem_minmax(0,1fr)] items-center gap-x-3 @max-[28rem]:grid-cols-[5.5rem_0.5rem_minmax(0,1fr)]"
		>
			{@render timeContent()}
			{@render markerContent()}
			{@render titleContent()}
		</span>
	{/snippet}

	{#snippet markerContent()}
		<span aria-hidden="true" class="size-2 rounded-full bg-[var(--event-calendar-item-color)]"
		></span>
	{/snippet}

	{#snippet titleContent()}
		<span class="text-neutral/90 min-w-0 truncate text-sm font-normal">
			{occurrence.item.title}
		</span>
	{/snippet}

	{#snippet timeContent()}
		<time
			datetime={entry.segment.start.toISOString()}
			class="text-neutral/70 truncate text-xs tabular-nums"
		>
			{timeLabel}
		</time>
	{/snippet}
{/snippet}

{#snippet agendaContent()}
	<div
		role="list"
		aria-label={`${messages.eventCalendarAgendaView}: ${profile.title}`}
		data-event-calendar-part="agenda"
		data-time-zone={calendar.timeZone}
		data-day-count={profile.visibleDays.length}
		class={classes.agenda({ density, view: 'agenda', disabled })}
	>
		{#each groups as group (group.day)}
			{@const dayStart = startOfZonedDay(group.day, calendar.timeZone)}
			{@const dayLabel = dayLabelFormatter.format(dayStart)}
			<div role="listitem">
				<details
					open
					data-event-calendar-part="agenda-day"
					data-day={group.day}
					data-count={group.entries.length}
					class={classes.agendaDay({ density, view: 'agenda', disabled })}
				>
					<summary
						aria-label={`${dayLabel}, ${messages.eventCalendarEventCount(group.entries.length)}`}
						aria-disabled={disabled}
						tabindex={disabled ? -1 : 0}
						data-event-calendar-agenda-date-gutter
						class="state-layer bg-surface-raised/45 focus-visible:ring-focus/50 sticky top-[var(--event-calendar-sticky-offset)] z-20 flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 px-4 py-2 text-xs outline-none [--state-hover-opacity:0] marker:content-none focus-visible:ring-2 focus-visible:ring-inset [&::-webkit-details-marker]:hidden"
						onclick={preventDisabledDisclosure}
						onkeydown={preventDisabledDisclosure}
						{@attach registerAgendaDay(group.day)}
					>
						<time datetime={group.day} class="contents" aria-hidden="true">
							<span class="text-neutral/90 min-w-0 truncate font-semibold">
								{weekdayFormatter.format(dayStart)}
							</span>
							<span class="text-neutral/55 shrink-0 tabular-nums">
								{dateFormatter.format(dayStart)}
							</span>
						</time>
					</summary>

					<ol>
						{#each group.entries as entry (`${group.day}:${entry.occurrence.key}`)}
							{@render agendaItem(entry, selectedItemKey === entry.occurrence.key)}
						{/each}
					</ol>
				</details>
			</div>
		{/each}
	</div>
{/snippet}

{#if scrollMode === 'contained'}
	<ScrollArea class="h-full min-h-0" label={profile.title}>
		{@render agendaContent()}
	</ScrollArea>
{:else}
	<div class="overflow-visible">
		{@render agendaContent()}
	</div>
{/if}
