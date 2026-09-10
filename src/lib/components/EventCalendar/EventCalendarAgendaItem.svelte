<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { untrack } from 'svelte';
	import type { EventCalendarAgendaEntry } from './eventCalendar.agenda.js';
	import {
		getEventCalendarItemColor,
		isEventCalendarSemanticColor
	} from './eventCalendar.color.js';
	import type {
		EventCalendarAgendaDetailsPayload,
		EventCalendarItemPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarOccurrence } from './eventCalendar.types.js';

	let {
		calendar,
		entry,
		timeFormatter,
		accessibleDateTimeFormatter,
		zonedTimeFormatter,
		accessibleDateFormatter,
		isSelected,
		onActivate
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		entry: EventCalendarAgendaEntry<TItemFields>;
		timeFormatter: Intl.DateTimeFormat;
		accessibleDateTimeFormatter: Intl.DateTimeFormat;
		zonedTimeFormatter: Intl.DateTimeFormat;
		accessibleDateFormatter: Intl.DateTimeFormat;
		isSelected: boolean;
		onActivate: (occurrence: EventCalendarOccurrence<TItemFields>, event: MouseEvent) => void;
	} = $props();

	const a11y = $derived(calendar.a11y);
	const messages = $derived(calendar.messages);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const item = $derived(calendar.renderers.item);
	const agendaDetails = $derived(calendar.renderers.agendaDetails);
	const onDoubleClick = $derived(calendar.eventHandlers.onItemDoubleClick);
	const occurrence = $derived(entry.occurrence);
	const semanticColor = $derived(
		isEventCalendarSemanticColor(occurrence.item.color) ? occurrence.item.color : 'neutral'
	);
	const itemColor = $derived(getEventCalendarItemColor(occurrence));
	const timeLabel = $derived.by(() => {
		if (occurrence.allDay) return messages.eventCalendarAllDay;
		const startZone = getTimeZoneName(zonedTimeFormatter, entry.segment.start);
		const endZone = getTimeZoneName(zonedTimeFormatter, entry.segment.end);
		if (startZone === endZone) {
			return `${timeFormatter.format(entry.segment.start)} – ${timeFormatter.format(entry.segment.end)}`;
		}
		return `${zonedTimeFormatter.format(entry.segment.start)} – ${zonedTimeFormatter.format(entry.segment.end)}`;
	});
	const accessibleLabel = $derived.by(() => {
		const formatter = occurrence.allDay ? accessibleDateFormatter : accessibleDateTimeFormatter;
		const inclusiveEnd = occurrence.allDay
			? new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1))
			: occurrence.end;
		let rangeLabel: string;
		if (occurrence.start.getTime() === inclusiveEnd.getTime()) {
			rangeLabel = formatter.format(occurrence.start);
		} else if (occurrence.allDay) {
			rangeLabel = formatter.formatRange(occurrence.start, inclusiveEnd);
		} else {
			rangeLabel = `${formatter.format(occurrence.start)} – ${formatter.format(inclusiveEnd)}`;
		}
		return `${occurrence.item.title}, ${rangeLabel}`;
	});
	const itemPayload = $derived<EventCalendarItemPayload<TItemFields>>({
		occurrence,
		segment: entry.segment,
		view: 'agenda',
		isSelected,
		isDragging: false,
		defaultContent,
		markerContent,
		titleContent,
		timeContent
	});

	function preventDisabledDisclosure(event: Event): void {
		if (!disabled) return;
		if (event.type === 'keydown' && !['Enter', ' '].includes((event as KeyboardEvent).key)) return;
		event.preventDefault();
	}

	function getTimeZoneName(formatter: Intl.DateTimeFormat, instant: Date): string {
		return (
			formatter.formatToParts(instant).find((part) => part.type === 'timeZoneName')?.value ?? ''
		);
	}

	function registerItemControl(node: HTMLElement): () => void {
		return untrack(() => a11y.registerOccurrenceControl(occurrence.key, node));
	}
</script>

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
					'min-h-11 flex-1 rounded-none border-0 bg-transparent pe-4 ps-6 py-0 [--state-hover-opacity:0.06] focus-visible:ring-inset'
			})}
			onclick={(event) => onActivate(occurrence, event)}
			ondblclick={(event) => onDoubleClick?.({ occurrence, event })}
			onfocus={() => a11y.handleOccurrenceFocus(occurrence.key, entry.segment.day)}
			{@attach registerItemControl}
		>
			<Slot render={item ?? defaultContent} payload={itemPayload} />
		</button>

		{#if agendaDetails}
			<details
				class="w-10 shrink-0 self-center open:w-[min(20rem,70%)]"
				data-event-calendar-agenda-disclosure
			>
				<summary
					aria-label={messages.eventCalendarDetails(occurrence.item.title)}
					aria-disabled={disabled}
					tabindex={disabled ? -1 : 0}
					class="state-layer grid size-9 cursor-pointer list-none place-items-center rounded outline-none marker:content-none text-neutral/55 focus-visible:ring-2 focus-visible:ring-color/60 [&::-webkit-details-marker]:hidden"
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
						class: 'mt-1 border-t border-neutral-muted px-2 py-2'
					})}
				>
					<Slot
						render={agendaDetails}
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
	<span aria-hidden="true" class="size-2 rounded-full bg-[var(--event-calendar-item-color)]"></span>
{/snippet}

{#snippet titleContent()}
	<span class="min-w-0 truncate text-sm font-normal text-neutral/90">
		{occurrence.item.title}
	</span>
{/snippet}

{#snippet timeContent()}
	<time
		datetime={entry.segment.start.toISOString()}
		class="truncate text-xs text-neutral/60 tabular-nums"
	>
		{timeLabel}
	</time>
{/snippet}
