<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import { repeatIcon } from '$lib/components/Icons/repeat.js';
	import HoverCard from '$lib/components/HoverCard/HoverCard.svelte';
	import type { HoverCardPayload } from '$lib/components/HoverCard/index.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { untrack, type Snippet } from 'svelte';
	import { isEventCalendarSemanticColor } from './eventCalendar.color.js';
	import { getCachedDateTimeFormatter } from './eventCalendar.date.js';
	import type {
		EventCalendarItemPayload,
		EventCalendarItemTooltipPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import type { EventCalendarSegment, EventCalendarView } from './eventCalendar.types.js';

	let {
		calendar,
		segment,
		view,
		isSelected,
		isDragging = false,
		allowResize = true,
		projectionResourceId,
		class: className,
		compactContent = false,
		tabindex,
		registerControl,
		onControlFocus,
		onControlKeydown,
		resizeStart,
		resizeEnd,
		onActivate,
		onDoubleClick
	}: {
		calendar: EventCalendarState<TItemFields, TResourceFields>;
		segment: EventCalendarSegment<TItemFields>;
		view: EventCalendarView;
		isSelected: boolean;
		isDragging?: boolean;
		allowResize?: boolean;
		projectionResourceId?: string;
		class?: string;
		compactContent?: boolean;
		tabindex?: 0 | -1;
		registerControl?: (node: HTMLElement) => () => void;
		onControlFocus?: () => void;
		onControlKeydown?: (event: KeyboardEvent) => void;
		resizeStart?: Snippet;
		resizeEnd?: Snippet;
		onActivate: (event: MouseEvent) => void;
		onDoubleClick?: (event: MouseEvent) => void;
	} = $props();

	const locale = $derived(calendar.locale);
	const timeZone = $derived(calendar.timeZone);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const a11y = $derived(calendar.a11y);
	const interaction = $derived(calendar.interaction);
	const disabled = $derived(calendar.disabled);
	const showItemTooltip = $derived(calendar.renderers.itemTooltip !== false);
	const item = $derived(calendar.renderers.item);
	const itemTooltip = $derived(calendar.renderers.itemTooltip || undefined);
	const occurrence = $derived(segment.occurrence);
	const semanticColor = $derived(
		isEventCalendarSemanticColor(occurrence.item.color) ? occurrence.item.color : 'neutral'
	);
	const itemColor = $derived(
		occurrence.item.color && !isEventCalendarSemanticColor(occurrence.item.color)
			? occurrence.item.color
			: 'var(--color)'
	);
	const hoverCardColor = $derived(
		occurrence.item.color && !isEventCalendarSemanticColor(occurrence.item.color)
			? occurrence.item.color
			: `var(--color-${semanticColor})`
	);
	const timeFormatter = $derived(
		getCachedDateTimeFormatter(locale, timeZone, { hour: 'numeric', minute: '2-digit' })
	);
	const dateTimeFormatter = $derived(
		getCachedDateTimeFormatter(locale, timeZone, {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})
	);
	const dateFormatter = $derived(
		getCachedDateTimeFormatter(locale, timeZone, { month: 'short', day: 'numeric' })
	);
	const timeLabel = $derived(timeFormatter.format(segment.start));
	const isTimedGridItem = $derived(!occurrence.allDay && view !== 'month' && view !== 'agenda');
	const timeRangeLabel = $derived(timeFormatter.formatRange(segment.start, segment.end));
	const dateRangeLabel = $derived.by(() => {
		const formatter = occurrence.allDay ? dateFormatter : dateTimeFormatter;
		const inclusiveEnd = occurrence.allDay
			? new Date(Math.max(occurrence.start.getTime(), occurrence.end.getTime() - 1))
			: occurrence.end;
		return occurrence.start.getTime() === inclusiveEnd.getTime()
			? formatter.format(occurrence.start)
			: formatter.formatRange(occurrence.start, inclusiveEnd);
	});
	const defaultAccessibleLabel = $derived(
		`${occurrence.item.title}, ${dateRangeLabel}${occurrence.isRecurring ? ', recurring' : ''}`
	);
	const itemPayload = $derived<EventCalendarItemPayload<TItemFields>>({
		occurrence,
		segment,
		view,
		isSelected,
		isDragging,
		defaultContent,
		markerContent,
		titleContent,
		timeContent
	});
	const tooltipPayload = $derived<EventCalendarItemTooltipPayload<TItemFields>>({
		occurrence,
		segment,
		view,
		defaultAccessibleLabel,
		defaultContent: defaultTooltip
	});
	let isHoverCardOpen = $state(false);
	const isInteractionActive = $derived(Boolean(interaction?.gesture));
	const isMoveAllowed = $derived(
		!(view === 'month' && (occurrence.isRecurring || occurrence.item.recurringItemId !== undefined))
	);
	const canMove = $derived(isMoveAllowed && Boolean(interaction?.canMove(occurrence)) && !disabled);
	const isResizeAllowed = $derived(allowResize && !(view === 'day' && occurrence.allDay));
	const canResize = $derived(
		isResizeAllowed && Boolean(interaction?.canResize(occurrence)) && !disabled
	);
	const isHorizontalResize = $derived(view === 'month' || occurrence.allDay);
	const hasKeyboardActions = $derived(
		Boolean(
			interaction &&
			(['move', 'resize-start', 'resize-end'] as const).some(
				(operation) =>
					(operation === 'move' ? isMoveAllowed : isResizeAllowed) &&
					interaction.canBeginAssistedItem(occurrence, operation, 'keyboard')
			)
		)
	);

	$effect(() => {
		if (isInteractionActive) isHoverCardOpen = false;
	});

	function getItemDescribedBy(hoverCard?: HoverCardPayload): string | undefined {
		const ids = [
			hasKeyboardActions ? `${a11y.liveRegionId}-instructions` : undefined,
			hoverCard?.isOpen ? hoverCard.id : undefined
		].filter((id): id is string => Boolean(id));
		return ids.length > 0 ? ids.join(' ') : undefined;
	}

	function registerItemControl(node: HTMLElement): () => void {
		return untrack(() => {
			const unregisterOccurrence = a11y.registerOccurrenceControl(occurrence.key, node);
			const unregisterTarget = registerControl?.(node);
			return () => {
				unregisterOccurrence();
				unregisterTarget?.();
			};
		});
	}
</script>

<div
	data-event-calendar-part="item"
	data-occurrence-key={occurrence.key}
	data-segment-key={segment.key}
	data-display="auto"
	data-selected={isSelected || undefined}
	data-dragging={isDragging || undefined}
	data-recurring={occurrence.isRecurring || undefined}
	data-event-calendar-compact-content={compactContent || undefined}
	data-start={segment.isStart || undefined}
	data-end={segment.isEnd || undefined}
	data-continues-before={segment.continuesBefore || undefined}
	data-continues-after={segment.continuesAfter || undefined}
	data-color={semanticColor}
	style:--event-calendar-item-color={itemColor}
	class={classes.item({
		density,
		color: semanticColor,
		view,
		dragging: isDragging,
		disabled,
		display: 'auto',
		isStart: segment.isStart,
		isEnd: segment.isEnd,
		continuesBefore: segment.continuesBefore,
		continuesAfter: segment.continuesAfter,
		class: className
	})}
	{@attach canMove && interaction
		? interaction.draggableItem(segment, 'move', view, projectionResourceId)
		: null}
>
	{#if canResize && interaction && segment.isStart}
		<div
			aria-hidden="true"
			data-event-calendar-part="resize-handle"
			data-edge="start"
			class={classes.resizeHandle({
				class: isHorizontalResize
					? 'inset-y-0 start-0 grid w-1.5 cursor-ew-resize place-items-center'
					: 'inset-x-0 top-0 grid h-1.5 -translate-y-1/2 cursor-ns-resize place-items-center'
			})}
			{@attach interaction.draggableItem(segment, 'resize-start', view, projectionResourceId)}
		>
			{#if resizeStart}
				<Slot render={resizeStart} />
			{:else}
				<span
					class={isHorizontalResize
						? 'pointer-events-none h-3 w-0.5 rounded-full bg-current'
						: 'pointer-events-none h-0.5 w-3 rounded-full bg-current'}
				></span>
			{/if}
		</div>
	{/if}
	{#if showItemTooltip}
		<HoverCard
			bind:open={isHoverCardOpen}
			position="top"
			offset={8}
			delay={250}
			closeDelay={100}
			openOnFocus
			size="small"
			density="compact"
			transition={{ out: { duration: 0 } }}
			disabled={disabled || isInteractionActive}
			trigger={hoverCardTrigger}
			children={resolvedTooltip}
			triggerClass="block h-full w-full"
		/>
	{:else}
		{@render itemControl()}
	{/if}
	{#if canResize && interaction && segment.isEnd}
		<div
			aria-hidden="true"
			data-event-calendar-part="resize-handle"
			data-edge="end"
			class={classes.resizeHandle({
				class: isHorizontalResize
					? 'inset-y-0 end-0 grid w-1.5 cursor-ew-resize place-items-center'
					: 'inset-x-0 bottom-0 grid h-1.5 translate-y-1/2 cursor-ns-resize place-items-center'
			})}
			{@attach interaction.draggableItem(segment, 'resize-end', view, projectionResourceId)}
		>
			{#if resizeEnd}
				<Slot render={resizeEnd} />
			{:else}
				<span
					class={isHorizontalResize
						? 'pointer-events-none h-3 w-0.5 rounded-full bg-current'
						: 'pointer-events-none h-0.5 w-3 rounded-full bg-current'}
				></span>
			{/if}
		</div>
	{/if}
</div>

{#snippet hoverCardTrigger(hoverCard: HoverCardPayload)}
	{@render itemControl(hoverCard)}
{/snippet}

{#snippet itemControl(hoverCard?: HoverCardPayload)}
	<button
		type="button"
		aria-label={defaultAccessibleLabel}
		aria-describedby={getItemDescribedBy(hoverCard)}
		aria-haspopup={hoverCard ? 'dialog' : undefined}
		aria-expanded={hoverCard?.isOpen}
		aria-controls={hoverCard?.id}
		aria-pressed={isSelected}
		{disabled}
		{tabindex}
		data-event-calendar-timed-control={isTimedGridItem || undefined}
		class={classes.itemControl({
			density,
			color: semanticColor,
			view,
			selected: isSelected,
			dragging: isDragging,
			disabled,
			recurring: occurrence.isRecurring
		})}
		onclick={(event) => {
			event.stopPropagation();
			if (interaction?.activateAssistedPoint(event.clientX, event.clientY)) return;
			if (interaction?.shouldSuppressClick(occurrence.key)) return;
			onActivate(event);
		}}
		ondblclick={(event) => {
			event.stopPropagation();
			onDoubleClick?.(event);
		}}
		onfocus={() => {
			a11y.handleOccurrenceFocus(occurrence.key, segment.day);
			onControlFocus?.();
		}}
		onkeydown={(event) => {
			if (
				a11y.handleItemKeydown(
					event,
					occurrence,
					isResizeAllowed,
					projectionResourceId,
					isMoveAllowed
				)
			)
				return;
			onControlKeydown?.(event);
		}}
		{@attach registerItemControl}
	>
		<Slot render={item ?? defaultContent} payload={itemPayload} />
	</button>
{/snippet}

{#snippet defaultContent()}
	<span
		class={classes.itemContent({
			density,
			color: semanticColor,
			view,
			class: isTimedGridItem ? 'flex-col items-start justify-start gap-0.5' : undefined
		})}
	>
		{@render markerContent()}
		{@render titleContent()}
		{@render timeContent()}
	</span>
{/snippet}

{#snippet markerContent()}
	{#if occurrence.isRecurring}
		{@render recurrenceIcon(isTimedGridItem ? 'absolute end-1 top-1' : 'shrink-0')}
	{:else if view === 'month'}
		<span
			aria-hidden="true"
			class="size-1.5 shrink-0 rounded-full bg-[var(--event-calendar-item-color)]"
		></span>
	{/if}
{/snippet}

{#snippet titleContent()}
	<span
		class={classes.itemTitle({
			density,
			color: semanticColor,
			view,
			class: isTimedGridItem && occurrence.isRecurring ? 'pe-4' : undefined
		})}
	>
		{occurrence.item.title}
	</span>
{/snippet}

{#snippet timeContent()}
	{#if isTimedGridItem}
		<span
			data-event-calendar-timed-time
			class={classes.itemTime({
				density,
				color: semanticColor,
				view,
				class: 'ms-0'
			})}>{timeRangeLabel}</span
		>
	{:else if view === 'month' && !occurrence.allDay && segment.isStart}
		<span class={classes.itemTime({ density, color: semanticColor, view })}>{timeLabel}</span>
	{/if}
{/snippet}

{#snippet recurrenceIcon(className: string)}
	<span
		aria-hidden="true"
		data-event-calendar-part="recurrence-icon"
		class={['size-3 text-[var(--event-calendar-item-color)]', className]}
	>
		<Slot render={repeatIcon} payload={{ size: '100%' }} />
	</span>
{/snippet}

{#snippet defaultTooltip()}
	<div class="grid gap-1 text-start">
		<strong class="text-xs leading-4" style:color={hoverCardColor}>{occurrence.item.title}</strong>
		{#if occurrence.item.description}
			<p class="text-neutral/75 text-xs leading-4 whitespace-pre-wrap">
				{occurrence.item.description}
			</p>
		{/if}
		<p class="text-neutral/55 text-[0.6875rem] leading-3 tabular-nums">{dateRangeLabel}</p>
	</div>
{/snippet}

{#snippet resolvedTooltip()}
	<Slot render={itemTooltip ?? tooltipPayload.defaultContent} payload={tooltipPayload} />
{/snippet}

<style>
	[data-event-calendar-compact-content] {
		container: event-calendar-timed-item / size;
	}

	[data-event-calendar-timed-control] {
		padding: 0.375rem 0.5rem;
	}

	@container event-calendar-timed-item (max-height: 43px) {
		[data-event-calendar-timed-control] {
			padding: 0 0.375rem;
		}

		[data-event-calendar-timed-time] {
			display: none;
		}
	}
</style>
