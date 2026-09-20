<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import Empty from '$lib/components/Empty/Empty.svelte';
	import Spinner from '$lib/components/Spinner/Spinner.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { onMount } from 'svelte';
	import EventCalendarAgendaView from './EventCalendarAgendaView.svelte';
	import EventCalendarMonthView from './EventCalendarMonthView.svelte';
	import EventCalendarTimeGrid from './EventCalendarTimeGrid.svelte';
	import type {
		EventCalendarEmptyPayload,
		EventCalendarLoadingPayload,
		EventCalendarViewPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';

	let {
		calendar
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	let timeGrid = $state<{ scrollToTime(dateOrMinutes: Date | number): boolean } | null>(null);
	const navigation = {
		scrollToTime(dateOrMinutes: Date | number): boolean {
			return timeGrid?.scrollToTime(dateOrMinutes) ?? false;
		}
	};
	const view = $derived(calendar.view);
	const profile = $derived(calendar.dateProfile);

	onMount(() => calendar.connectContentNavigation(navigation));

	const viewPayload = $derived<EventCalendarViewPayload>({
		view,
		visibleRange: profile.renderRange,
		visibleDays: profile.visibleDays
	});
	const hasProvableEmptyRange = $derived.by(() => {
		if (view !== 'agenda') return calendar.itemIndex.occurrences.length === 0;
		return !profile.visibleDays.some(
			(day) => (calendar.itemIndex.segmentsByDay.get(day)?.foreground.length ?? 0) > 0
		);
	});
	const emptyPayload = $derived<EventCalendarEmptyPayload>({
		...viewPayload,
		mode: view === 'agenda' ? 'agenda-replacement' : 'grid-status',
		defaultContent: defaultEmpty
	});
	const loadingPayload = $derived<EventCalendarLoadingPayload>({
		...viewPayload,
		defaultContent: defaultLoading
	});
</script>

<div
	data-event-calendar-part="content"
	data-view={view}
	data-loading={calendar.loading || undefined}
	data-empty={hasProvableEmptyRange || undefined}
	aria-busy={calendar.loading}
	class={calendar.classes.content({
		density: calendar.density,
		view,
		disabled: calendar.disabled,
		class: calendar.scrollMode === 'page' ? 'overflow-visible' : 'overflow-hidden'
	})}
>
	{#if view === 'agenda' && hasProvableEmptyRange}
		<Empty>{@render emptyState(emptyPayload)}</Empty>
	{:else}
		<div
			data-event-calendar-part="viewport"
			data-view={view}
			inert={calendar.loading ? true : undefined}
			class={calendar.classes.viewport({
				density: calendar.density,
				view,
				disabled: calendar.disabled
			})}
		>
			{#if view === 'month'}
				<EventCalendarMonthView {calendar} />
			{:else if view === 'week' || view === 'day' || view === 'days'}
				<EventCalendarTimeGrid bind:this={timeGrid} {view} {calendar} />
			{:else if view === 'agenda'}
				<EventCalendarAgendaView {calendar} />
			{:else if view === 'resource'}
				<EventCalendarTimeGrid bind:this={timeGrid} view="resource" {calendar} />
			{/if}
		</div>
		{#if hasProvableEmptyRange}
			{@render emptyState(emptyPayload)}
		{/if}
	{/if}

	{#if calendar.loading}
		<div
			data-event-calendar-part="loading"
			class={calendar.classes.loading({ density: calendar.density, view })}
		>
			<Slot
				render={calendar.renderers.loadingContent ?? loadingPayload.defaultContent}
				payload={loadingPayload}
			/>
		</div>
	{/if}
</div>

{#snippet emptyState(payload: EventCalendarEmptyPayload)}
	<div
		role="status"
		aria-live="polite"
		aria-atomic="true"
		data-event-calendar-part="empty"
		data-empty-mode={payload.mode}
		inert={calendar.loading ? true : undefined}
		class={calendar.classes.empty({ density: calendar.density, view, disabled: calendar.disabled })}
	>
		<Slot render={calendar.renderers.empty ?? payload.defaultContent} {payload} />
	</div>
{/snippet}

{#snippet defaultEmpty()}
	{calendar.messages.eventCalendarEmpty}
{/snippet}

{#snippet defaultLoading()}
	<Spinner
		label={calendar.messages.eventCalendarLoading}
		text={calendar.messages.eventCalendarLoading}
		theme={{ label: { base: 'text-neutral/75' } }}
	/>
{/snippet}
