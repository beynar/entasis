<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { tick, untrack } from 'svelte';
	import EventCalendarResourceHeader from './EventCalendarResourceHeader.svelte';
	import EventCalendarTimeGridAllDay from './EventCalendarTimeGridAllDay.svelte';
	import EventCalendarTimeGridDayColumn from './EventCalendarTimeGridDayColumn.svelte';
	import {
		type EventCalendarAllDayDropTarget,
		type EventCalendarTimedDropTarget
	} from './eventCalendar.targets.js';
	import {
		addCivilDays,
		assertValidInstant,
		getCachedDateTimeFormatter,
		getZonedDay,
		resolveZonedMinutesOnDay,
		startOfZonedDay
	} from './eventCalendar.date.js';
	import { EventCalendarError } from './eventCalendar.error.js';
	import type {
		EventCalendarAllDayPayload,
		EventCalendarDayHeaderPayload,
		EventCalendarNowIndicatorPayload,
		EventCalendarTimeGutterPayload
	} from './eventCalendar.props.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import {
		createEventCalendarTimeGridAllDayPreview,
		createEventCalendarTimeGridLabels,
		createEventCalendarTimeGridSurface,
		createEventCalendarTimeTargets,
		EVENT_CALENDAR_MINUTE_MS,
		getEventCalendarElapsedMinutes,
		type EventCalendarTimeGridDayGeometry
	} from './eventCalendar.timeGrid.js';
	import type { EventCalendarSegment } from './eventCalendar.types.js';

	let {
		view,
		calendar
	}: {
		view: 'week' | 'day' | 'days' | 'resource';
		calendar: EventCalendarState<TItemFields, TResourceFields>;
	} = $props();

	let rootElement = $state<HTMLDivElement | null>(null);
	let stickyHeader = $state<HTMLDivElement | null>(null);
	let scrollViewport = $state<HTMLDivElement | null>(null);
	let timeBody = $state<HTMLDivElement | null>(null);
	let initialScrollVersion = 0;
	const a11y = $derived(calendar.a11y);
	const messages = $derived(calendar.messages);
	const direction = $derived(calendar.direction);
	const density = $derived(calendar.density);
	const classes = $derived(calendar.classes);
	const disabled = $derived(calendar.disabled);
	const offDays = $derived(calendar.offDays);
	const scrollMode = $derived(calendar.scrollMode);
	const nowIndicator = $derived(calendar.renderers.nowIndicator !== false);
	const dayHeader = $derived(calendar.renderers.dayHeader);
	const timeGutter = $derived(calendar.renderers.timeGutter);
	const resourceModel = $derived(view === 'resource' ? calendar.resourceModel : undefined);
	const onItemClick = $derived(calendar.eventHandlers.onItemClick);
	const onSlotClick = $derived(calendar.eventHandlers.onSlotClick);
	const profile = $derived(calendar.dateProfile);
	const surface = $derived(
		createEventCalendarTimeGridSurface(profile, calendar.itemIndex, {
			view,
			timeZone: calendar.timeZone,
			dayStartMinutes: calendar.dayStartHour * 60,
			dayEndMinutes: calendar.dayEndHour * 60,
			interval: calendar.interval,
			slotDuration: calendar.slotDuration,
			snapDuration: calendar.snapDuration,
			businessHours: calendar.businessHours,
			offDays,
			weekendDays: calendar.weekendDays,
			...(resourceModel === undefined ? {} : { resourceModel })
		})
	);
	const visibleDays = $derived(surface.visibleDays);
	const offDaysByDay = $derived(surface.offDaysByDay);
	const todayDay = $derived(
		calendar.todayInstant ? getZonedDay(calendar.todayInstant, calendar.timeZone) : null
	);
	const dayStartMinutes = $derived(calendar.dayStartHour * 60);
	const dayEndMinutes = $derived(calendar.dayEndHour * 60);
	const selectionKey = $derived(
		calendar.selection.kind === 'item' ? calendar.selection.itemKey : null
	);
	const dayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		})
	);
	const longDayFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			weekday: 'long',
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
	const accessibleTimeFormatter = $derived(
		getCachedDateTimeFormatter(calendar.locale, calendar.timeZone, {
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		})
	);
	const columns = $derived(surface.columns);
	const dayGeometries = $derived(surface.dayGeometries);
	const maximumMinuteCount = $derived(surface.maximumMinuteCount);
	const timeLabels = $derived(
		createEventCalendarTimeGridLabels(
			dayGeometries,
			timeFormatter,
			accessibleTimeFormatter,
			calendar.timeZone
		)
	);
	const gutterLabels = $derived(timeLabels.gutterLabels);
	const localTimeLabelsByKey = $derived(timeLabels.localLabelsByColumn);
	const allDaySegments = $derived(surface.allDaySegments);
	const allDayBackgroundSegments = $derived(surface.allDayBackgroundSegmentsByColumn);
	const allDayInsertion = $derived(
		view === 'resource' ? null : calendar.interaction.getAllDayInsertion()
	);
	const allDayPreview = $derived(
		createEventCalendarTimeGridAllDayPreview(surface, view, allDayInsertion)
	);
	const allDayLayout = $derived(allDayPreview.layout);
	const allDayHeight = $derived(
		`calc(${Math.max(1, allDayLayout.laneCount)} * var(--event-calendar-item-min-height) + 0.5rem)`
	);
	const gridTemplateColumns = $derived(
		`var(--event-calendar-time-gutter-width) repeat(${columns.length}, minmax(var(--event-calendar-${view === 'resource' ? 'resource' : 'day'}-min-width), 1fr))`
	);
	const gridMinimumWidth = $derived(
		`calc(var(--event-calendar-time-gutter-width) + ${columns.length} * var(--event-calendar-${view === 'resource' ? 'resource' : 'day'}-min-width))`
	);
	const timeTargets = $derived(
		createEventCalendarTimeTargets(surface, view, allDayLayout, calendar.slotDuration, disabled)
	);
	const allDayPayload = $derived<EventCalendarAllDayPayload<TItemFields>>({
		visibleDays,
		segments: allDaySegments,
		defaultContent: defaultAllDay
	});
	const nowPayload = $derived<EventCalendarNowIndicatorPayload | null>(
		nowIndicator && calendar.nowInstant
			? { now: calendar.nowInstant, defaultContent: defaultNowIndicator }
			: null
	);
	const currentViewLabel = $derived.by(() => {
		if (view === 'week') return messages.eventCalendarWeekView;
		if (view === 'day') return messages.eventCalendarDayView;
		if (view === 'days') return messages.eventCalendarDaysView;
		return messages.eventCalendarResourceView;
	});
	const columnLabels = $derived(
		new Map(
			dayGeometries.map((geometry) => {
				const dayLabel = longDayFormatter.format(startOfZonedDay(geometry.day, calendar.timeZone));
				if (view !== 'resource' || !resourceModel) return [geometry.key, dayLabel] as const;
				const resourceLabel =
					resourceModel.resolveLeaf(geometry.resourceId)?.title ??
					messages.eventCalendarUnassignedResource;
				return [geometry.key, `${resourceLabel}, ${dayLabel}`] as const;
			})
		)
	);

	$effect(() => {
		a11y.configureTimeGrid({
			targets: timeTargets,
			direction,
			onPage: (pageDirection) => {
				const previousDate = calendar.date.getTime();
				if (pageDirection < 0) calendar.previous();
				else calendar.next();
				return previousDate !== calendar.date.getTime();
			}
		});
	});

	$effect(() => {
		if (scrollMode !== 'contained') return;
		const viewport = scrollViewport;
		if (!viewport) return;
		return calendar.interaction.autoScroll('contained')(viewport);
	});

	$effect(() => {
		if (!calendar.isMounted) return;
		void profile.currentRange.start.getTime();
		void profile.currentRange.end.getTime();
		void scrollMode;
		const scrollHour = calendar.scrollToHour;
		const version = ++initialScrollVersion;
		void tick().then(() => {
			if (version !== initialScrollVersion) return;
			scrollToTime(scrollHour * 60);
		});
		return () => {
			initialScrollVersion += 1;
		};
	});

	export function scrollToTime(dateOrMinutes: Date | number): boolean {
		if (!rootElement || !timeBody) return false;
		let geometry: EventCalendarTimeGridDayGeometry<TItemFields> | undefined;
		let instant: Date;
		if (dateOrMinutes instanceof Date) {
			assertValidInstant(dateOrMinutes, 'dateOrMinutes');
			geometry = dayGeometries.find(
				(candidate) => candidate.day === getZonedDay(dateOrMinutes, calendar.timeZone)
			);
			instant = new Date(dateOrMinutes);
		} else {
			if (!Number.isInteger(dateOrMinutes) || dateOrMinutes < 0 || dateOrMinutes >= 24 * 60) {
				throw new EventCalendarError(
					'invalid-prop',
					'scrollToTime minute values must be whole minutes inside [0, 1440).',
					{ dateOrMinutes }
				);
			}
			geometry = dayGeometries[0];
			if (!geometry) return false;
			instant = resolveZonedMinutesOnDay(geometry.day, dateOrMinutes, calendar.timeZone);
		}
		if (!geometry || instant < geometry.windowStart || instant >= geometry.windowEnd) return false;

		const measuredSlot = rootElement.querySelector<HTMLElement>(
			'[data-event-calendar-part="time-slot"]'
		);
		const measuredStart = measuredSlot?.dataset.slotStart;
		const measuredEnd = measuredSlot?.dataset.slotEnd;
		const measuredMinutes =
			measuredStart && measuredEnd
				? (Date.parse(measuredEnd) - Date.parse(measuredStart)) / EVENT_CALENDAR_MINUTE_MS
				: 0;
		const slotHeight = measuredSlot
			? (measuredSlot.getBoundingClientRect().height * calendar.interval) / measuredMinutes
			: Number.NaN;
		if (!Number.isFinite(slotHeight) || slotHeight <= 0) return false;
		const stickyTop = stickyHeader ? Number.parseFloat(getComputedStyle(stickyHeader).top) : 0;
		const stickyObstruction =
			(stickyHeader?.offsetHeight ?? 0) + (Number.isFinite(stickyTop) ? stickyTop : 0);
		const targetOffset =
			timeBody.offsetTop +
			(getEventCalendarElapsedMinutes(geometry.windowStart, instant) / calendar.interval) *
				slotHeight -
			stickyObstruction;
		if (scrollMode === 'contained') {
			if (!scrollViewport) return false;
			const maximumScroll = scrollViewport.scrollHeight - scrollViewport.clientHeight;
			if (maximumScroll <= 0) return false;
			const scrollTop = Math.min(maximumScroll, Math.max(0, targetOffset));
			scrollViewport.scrollTo({ top: scrollTop, behavior: 'auto' });
			return Math.abs(scrollViewport.scrollTop - scrollTop) < 1;
		}
		const bodyTop = timeBody.getBoundingClientRect().top + window.scrollY;
		const documentScroller = document.scrollingElement;
		if (!documentScroller) return false;
		const maximumScroll = documentScroller.scrollHeight - documentScroller.clientHeight;
		if (maximumScroll <= 0) return false;
		const targetTop = bodyTop + targetOffset - timeBody.offsetTop;
		const scrollTop = Math.min(maximumScroll, Math.max(0, targetTop));
		window.scrollTo({ top: scrollTop, behavior: 'auto' });
		return Math.abs(documentScroller.scrollTop - scrollTop) < 1;
	}

	function registerTimeTarget(targetKey: string) {
		return (node: HTMLElement) => untrack(() => a11y.registerTimeTarget(targetKey, node));
	}

	function handleTargetKeydown(event: KeyboardEvent, targetKey: string, activate = false): void {
		if (a11y.handleTimeTargetKeydown(event, targetKey)) return;
		if (!activate || (event.key !== 'Enter' && event.key !== ' ')) return;
		event.preventDefault();
		(event.currentTarget as HTMLElement).click();
	}

	function handleAllDayClick(target: EventCalendarAllDayDropTarget, event: MouseEvent): void {
		if (a11y.activateMutationTarget(target)) return;
		if (calendar.interaction.shouldSuppressSlotClick()) return;
		if (disabled) return;
		(event.currentTarget as HTMLElement).focus();
		const slot = {
			view,
			allDay: true as const,
			start: target.day,
			end: addCivilDays(target.day, 1),
			...(target.resourceId === undefined ? {} : { resourceId: target.resourceId })
		};
		onSlotClick?.({ slot, event });
		if (event.defaultPrevented) {
			calendar.interaction.resetSinglePointerSlot();
			return;
		}
		if (calendar.interaction.selectSinglePointerSlot(slot)) return;
		calendar.select({ kind: 'slot', itemKey: null, slot });
	}

	function handleTimedSlotClick(target: EventCalendarTimedDropTarget, event: MouseEvent): void {
		if (a11y.activateMutationTarget(target)) return;
		if (calendar.interaction.shouldSuppressSlotClick()) return;
		if (disabled) return;
		(event.currentTarget as HTMLElement).focus();
		const selectionSlot = {
			view,
			allDay: false as const,
			start: new Date(target.start),
			end: new Date(target.end),
			...(target.resourceId === undefined ? {} : { resourceId: target.resourceId })
		};
		onSlotClick?.({
			slot: {
				...selectionSlot,
				start: new Date(selectionSlot.start),
				end: new Date(selectionSlot.end)
			},
			event
		});
		if (event.defaultPrevented) {
			calendar.interaction.resetSinglePointerSlot();
			return;
		}
		if (calendar.interaction.selectSinglePointerSlot(selectionSlot)) return;
		calendar.select({ kind: 'slot', itemKey: null, slot: selectionSlot });
	}

	function handleItemActivate(segment: EventCalendarSegment<TItemFields>, event: MouseEvent): void {
		calendar.interaction.resetSinglePointerSlot();
		onItemClick?.({ occurrence: segment.occurrence, event });
		if (event.defaultPrevented) return;
		calendar.select({ kind: 'item', itemKey: segment.occurrence.key, slot: null });
	}
</script>

{#snippet timeGridContent()}
	<div
		bind:this={rootElement}
		role="group"
		aria-label={`${currentViewLabel}: ${profile.title}`}
		data-event-calendar-part="time-grid"
		data-view={view}
		data-time-zone={calendar.timeZone}
		data-day-start-minutes={dayStartMinutes}
		data-day-end-minutes={dayEndMinutes}
		data-interval={calendar.interval}
		data-slot-duration={calendar.slotDuration}
		data-snap-duration={calendar.snapDuration}
		class={classes.timeGrid({ density, view, disabled })}
		style:min-width={gridMinimumWidth}
	>
		<div
			bind:this={stickyHeader}
			class="bg-surface sticky top-[var(--event-calendar-sticky-offset)] z-20"
		>
			<div
				data-event-calendar-part="time-header"
				class={classes.timeHeader({ density, view, disabled })}
				style:grid-template-columns={gridTemplateColumns}
				style:grid-template-rows={view === 'resource' && resourceModel
					? `repeat(${resourceModel.structure.maxDepth + 1}, auto)`
					: undefined}
			>
				<div
					aria-hidden="true"
					class={classes.timeGutter()}
					style:grid-row={view === 'resource' && resourceModel
						? `1 / span ${resourceModel.structure.maxDepth + 1}`
						: undefined}
				></div>
				{#if view === 'resource' && resourceModel}
					<EventCalendarResourceHeader
						{calendar}
						{resourceModel}
						{dayGeometries}
						{longDayFormatter}
						{registerTimeTarget}
						{handleTargetKeydown}
						{handleAllDayClick}
					/>
				{:else}
					{#each dayGeometries as geometry (geometry.key)}
						{@const dayInstant = startOfZonedDay(geometry.day, calendar.timeZone)}
						{@const isOff = offDaysByDay.get(geometry.day) ?? false}
						{@const defaultLabel = dayFormatter.format(dayInstant)}
						{@const targetKey = `day-header:${geometry.key}`}
						{@const headerPayload = {
							day: geometry.day,
							view,
							isToday: geometry.day === todayDay,
							defaultLabel,
							defaultContent: defaultDayHeader
						} satisfies EventCalendarDayHeaderPayload}
						<button
							type="button"
							tabindex={disabled ? -1 : a11y.getTimeTargetTabIndex(targetKey)}
							aria-label={longDayFormatter.format(dayInstant)}
							{disabled}
							data-event-calendar-part="day-header"
							data-day={geometry.day}
							data-today={geometry.day === todayDay || undefined}
							data-off-day={isOff || undefined}
							class={classes.dayHeader({
								density,
								view,
								today: geometry.day === todayDay,
								offDay: isOff,
								disabled
							})}
							onfocus={() => a11y.handleTimeTargetFocus(targetKey)}
							onclick={(event) => handleAllDayClick(geometry.allDayDropTarget, event)}
							onkeydown={(event) => handleTargetKeydown(event, targetKey, true)}
							{@attach disabled ? null : registerTimeTarget(targetKey)}
						>
							<Slot render={dayHeader ?? defaultDayHeader} payload={headerPayload} />
						</button>

						{#snippet defaultDayHeader()}
							<span>{defaultLabel}</span>
						{/snippet}
					{/each}
				{/if}
			</div>

			<EventCalendarTimeGridAllDay
				{view}
				{calendar}
				{dayGeometries}
				{allDayBackgroundSegments}
				{allDayLayout}
				insertion={allDayPreview.insertion}
				draggingOccurrenceKey={allDayPreview.draggingOccurrenceKey}
				{allDayHeight}
				{gridTemplateColumns}
				{allDayPayload}
				{offDaysByDay}
				{longDayFormatter}
				{columnLabels}
				{selectionKey}
				{registerTimeTarget}
				{handleTargetKeydown}
				{handleAllDayClick}
				{handleItemActivate}
			/>
		</div>

		<div
			bind:this={timeBody}
			class="relative grid"
			style:grid-template-columns={gridTemplateColumns}
			style:height={`calc(${maximumMinuteCount / calendar.interval} * var(--event-calendar-slot-height))`}
		>
			<div data-event-calendar-part="time-gutter" class={classes.timeGutter({ density, view })}>
				{#each gutterLabels as gutterLabel (gutterLabel.instant.getTime())}
					{@const gutterPayload = {
						...gutterLabel,
						defaultContent: defaultTimeGutter
					} satisfies EventCalendarTimeGutterPayload}
					<time
						datetime={gutterLabel.instant.toISOString()}
						data-event-calendar-part="time-label"
						class={classes.timeLabel({ density, view })}
						style:height="var(--event-calendar-slot-height)"
					>
						<Slot render={timeGutter ?? gutterPayload.defaultContent} payload={gutterPayload} />
					</time>

					{#snippet defaultTimeGutter()}
						{gutterLabel.defaultLabel}
					{/snippet}
				{/each}
			</div>

			{#each dayGeometries as geometry (geometry.key)}
				<EventCalendarTimeGridDayColumn
					{view}
					{calendar}
					{geometry}
					columnLabel={columnLabels.get(geometry.key) ?? geometry.day}
					isOffDay={offDaysByDay.get(geometry.day) ?? false}
					{selectionKey}
					{longDayFormatter}
					{accessibleTimeFormatter}
					localTimeLabels={localTimeLabelsByKey.get(geometry.key)}
					{nowPayload}
					{registerTimeTarget}
					{handleTargetKeydown}
					{handleTimedSlotClick}
					{handleItemActivate}
				/>
			{/each}
		</div>
	</div>
{/snippet}

{#if scrollMode === 'contained'}
	<ScrollArea bind:viewportRef={scrollViewport} class="h-full min-h-0" label={profile.title}>
		{@render timeGridContent()}
	</ScrollArea>
{:else}
	<div bind:this={scrollViewport} class="overflow-x-auto overflow-y-visible">
		{@render timeGridContent()}
	</div>
{/if}

{#snippet defaultAllDay()}
	<span class="text-neutral/70 px-1 text-xs">{messages.eventCalendarAllDay}</span>
{/snippet}

{#snippet defaultNowIndicator()}
	<span class="sr-only">
		{calendar.nowInstant ? accessibleTimeFormatter.format(calendar.nowInstant) : ''}
	</span>
{/snippet}
