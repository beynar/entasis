<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Popover from '$lib/components/Popover/Popover.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import EventCalendarItem from './EventCalendarItem.svelte';
	import type {
		EventCalendarOverflowContentPayload,
		EventCalendarOverflowPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarDateOnly, EventCalendarSegment } from './eventCalendar.types.js';

	let {
		calendar,
		day,
		dayLabel,
		hiddenSegments,
		selectionKey,
		onItemActivate,
		onItemDoubleClick
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		day: EventCalendarDateOnly;
		dayLabel: string;
		hiddenSegments: readonly EventCalendarSegment<TItemFields>[];
		selectionKey: string | null;
		onItemActivate: (segment: EventCalendarSegment<TItemFields>, event: MouseEvent) => void;
		onItemDoubleClick: (segment: EventCalendarSegment<TItemFields>, event: MouseEvent) => void;
	} = $props();

	const messages = $derived(calendar.messages);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const overflow = $derived(calendar.renderers.overflow);
	const overflowContent = $derived(calendar.renderers.overflowContent);
	const onMoreClick = $derived(calendar.eventHandlers.onMoreClick);
	let triggerElement = $state<HTMLButtonElement | null>(null);
	const hiddenOccurrences = $derived(hiddenSegments.map((segment) => segment.occurrence));
	const overflowPayload = $derived<EventCalendarOverflowPayload<TItemFields>>({
		day,
		hiddenOccurrences,
		count: hiddenOccurrences.length,
		defaultContent
	});
</script>

<Popover
	position="bottom-start"
	lockScroll={false}
	openOnClick={false}
	class={classes.overflowPopover({ density, view: 'month' })}
	onAfterClose={() => triggerElement?.focus()}
>
	{#snippet trigger(popoverState)}
		<button
			type="button"
			bind:this={triggerElement}
			aria-label={`${messages.eventCalendarMore(hiddenOccurrences.length)}, ${dayLabel}`}
			aria-haspopup="dialog"
			aria-expanded={popoverState.isOpen}
			{disabled}
			data-event-calendar-part="overflow"
			class={classes.overflow({ density, view: 'month', disabled })}
			onpointerdown={(event) => event.stopPropagation()}
			onclick={(event) => {
				event.stopPropagation();
				if (onMoreClick?.({ day, occurrences: hiddenOccurrences, event }) === false) return;
				popoverState.toggle();
			}}
			{@attach popoverState.reference}
		>
			<Slot render={overflow ?? defaultContent} payload={overflowPayload} />
		</button>
	{/snippet}

	{#snippet children(popoverState)}
		{@const contentPayload = {
			day,
			hiddenOccurrences,
			close: () => popoverState.close(),
			defaultContent: defaultPopoverContent
		} satisfies EventCalendarOverflowContentPayload<TItemFields>}
		<Slot render={overflowContent ?? contentPayload.defaultContent} payload={contentPayload} />
	{/snippet}
</Popover>

{#snippet defaultContent()}
	{messages.eventCalendarMore(hiddenOccurrences.length)}
{/snippet}

{#snippet defaultPopoverContent()}
	<div data-event-calendar-overflow-content class="grid gap-1" aria-label={dayLabel}>
		<div class="mb-1 font-medium">{dayLabel}</div>
		{#each hiddenSegments as segment (segment.occurrence.key)}
			<EventCalendarItem
				{calendar}
				{segment}
				view="month"
				isDragging={calendar.interaction.isDragging(segment.occurrence.key)}
				allowResize={false}
				isSelected={selectionKey === segment.occurrence.key}
				onActivate={(event) => onItemActivate(segment, event)}
				onDoubleClick={(event) => onItemDoubleClick(segment, event)}
			/>
		{/each}
	</div>
{/snippet}
