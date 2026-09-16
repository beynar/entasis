<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import { untrack } from 'svelte';
	import EventCalendarAgendaItem from './EventCalendarAgendaItem.svelte';
	import { createEventCalendarAgendaGroups } from './eventCalendar.agenda.js';
	import { getCachedDateTimeFormatter, startOfZonedDay } from './eventCalendar.date.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarDateOnly, EventCalendarOccurrence } from './eventCalendar.types.js';

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
	const onItemClick = $derived(calendar.eventHandlers.onItemClick);
	const profile = $derived(calendar.dateProfile);
	const groups = $derived(createEventCalendarAgendaGroups(profile.visibleDays, calendar.itemIndex));
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
	const timeFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			hour: 'numeric',
			minute: '2-digit'
		})
	);
	const accessibleDateTimeFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		})
	);
	const zonedTimeFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		})
	);
	const accessibleDateFormatter = $derived(
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

	function handleItemActivate(
		occurrence: EventCalendarOccurrence<TItemFields>,
		event: MouseEvent
	): void {
		calendar.interaction.resetSinglePointerSlot();
		onItemClick?.({ occurrence, event });
		if (event.defaultPrevented) return;
		calendar.select({ kind: 'item', itemKey: occurrence.key, slot: null });
	}

	function preventDisabledDisclosure(event: Event): void {
		if (!disabled) return;
		if (event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return;
		event.preventDefault();
	}

	function registerAgendaDay(day: EventCalendarDateOnly) {
		return (node: HTMLElement) => untrack(() => a11y.registerDay(day, node));
	}
</script>

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
							<EventCalendarAgendaItem
								{calendar}
								{entry}
								{timeFormatter}
								{accessibleDateTimeFormatter}
								{zonedTimeFormatter}
								{accessibleDateFormatter}
								isSelected={selectedItemKey === entry.occurrence.key}
								onActivate={handleItemActivate}
							/>
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
