<script
	lang="ts"
	generics="TItemFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { tick, untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import EventCalendarResourceHeader from './EventCalendarResourceHeader.svelte';
	import EventCalendarTimeGridAllDay from './EventCalendarTimeGridAllDay.svelte';
	import EventCalendarTimeGridDayColumn from './EventCalendarTimeGridDayColumn.svelte';
	import type { EventCalendarTimeTarget } from './eventCalendar.a11y.svelte.js';
	import { createEventCalendarAllDayPreviewLayout } from './eventCalendar.allDayInsertion.js';
	import {
		addCivilDays,
		assertValidInstant,
		getCachedDateTimeFormatter,
		getZonedDay,
		getZonedParts,
		isEventCalendarOffDay,
		resolveZonedMinutesOnDay,
		startOfZonedDay
	} from './eventCalendar.date.js';
	import { packEventCalendarLanes } from './eventCalendar.layout.js';
	import { EventCalendarError } from './eventCalendar.error.js';
	import type {
		EventCalendarAllDayPayload,
		EventCalendarDayHeaderPayload,
		EventCalendarNowIndicatorPayload,
		EventCalendarTimeGutterPayload
	} from './eventCalendar.props.js';
	import { filterEventCalendarBucketByResource } from './eventCalendar.resources.js';
	import type { EventCalendarState } from './eventCalendar.state.svelte.js';
	import {
		createEventCalendarTimeGridDayGeometry,
		EVENT_CALENDAR_MINUTE_MS,
		getEventCalendarElapsedMinutes,
		type EventCalendarTimeGridDayGeometry,
		type EventCalendarTimeSlot
	} from './eventCalendar.timeGrid.js';
	import type { EventCalendarDateOnly, EventCalendarSegment } from './eventCalendar.types.js';

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
	const itemIndex = $derived(calendar.itemIndex);
	const visibleDays = $derived(profile.visibleDays);
	const offDaysByDay = $derived(
		new Map(
			visibleDays.map((day) => [day, isEventCalendarOffDay(day, offDays, calendar.weekendDays)])
		)
	);
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
	type TimeGridColumn = {
		key: string;
		day: EventCalendarDateOnly;
		column: number;
		resourceId?: string;
	};
	const columns = $derived.by((): TimeGridColumn[] => {
		if (view !== 'resource') {
			return visibleDays.map((day, column) => ({
				key: day,
				day,
				column
			}));
		}
		const day = visibleDays[0];
		if (!day || !resourceModel) {
			throw new EventCalendarError(
				'invalid-resource',
				'Resource view requires one visible day and a normalized resource model.'
			);
		}
		return resourceModel.columns.map((resourceColumn, column) => ({
			key: resourceColumn.key,
			day,
			column,
			...(resourceColumn.resourceId === undefined ? {} : { resourceId: resourceColumn.resourceId })
		}));
	});
	const columnBuckets = $derived.by(() =>
		columns.map((column) => ({
			column,
			bucket:
				view === 'resource' && resourceModel
					? filterEventCalendarBucketByResource(
							itemIndex.segmentsByDay.get(column.day),
							resourceModel,
							column.resourceId
						)
					: itemIndex.segmentsByDay.get(column.day)
		}))
	);

	const dayGeometries = $derived.by(() =>
		columnBuckets.map(({ column, bucket }): EventCalendarTimeGridDayGeometry<TItemFields> =>
			createEventCalendarTimeGridDayGeometry({
				columnKey: column.key,
				day: column.day,
				column: column.column,
				...(column.resourceId === undefined ? {} : { resourceId: column.resourceId }),
				timeZone: calendar.timeZone,
				dayStartMinutes,
				dayEndMinutes,
				interval: calendar.interval,
				slotDuration: calendar.slotDuration,
				snapDuration: calendar.snapDuration,
				businessHours: calendar.businessHours,
				bucket
			})
		)
	);
	const maximumMinuteCount = $derived(
		Math.max(...dayGeometries.map((geometry) => geometry.minuteCount), 0)
	);
	const timeLabelProfiles = $derived.by(() =>
		dayGeometries.map((geometry) => {
			const wallLabels = geometry.intervalInstants.map((instant) => timeFormatter.format(instant));
			const counts = new SvelteMap<string, number>();
			for (const label of wallLabels) counts.set(label, (counts.get(label) ?? 0) + 1);
			return {
				geometry,
				signature: `${geometry.minuteCount}:${geometry.intervalInstants
					.map((instant) => {
						const parts = getZonedParts(instant, calendar.timeZone);
						return `${parts.hour}:${parts.minute}`;
					})
					.join(',')}`,
				labels: geometry.intervalInstants.map((instant, index) => ({
					instant,
					defaultLabel:
						counts.get(wallLabels[index]) === 1
							? wallLabels[index]
							: accessibleTimeFormatter.format(instant)
				}))
			};
		})
	);
	const gutterProfile = $derived.by(() => {
		const profileCounts = new SvelteMap<string, number>();
		for (const profile of timeLabelProfiles) {
			profileCounts.set(profile.signature, (profileCounts.get(profile.signature) ?? 0) + 1);
		}
		return timeLabelProfiles.reduce<(typeof timeLabelProfiles)[number] | undefined>(
			(selected, profile) =>
				!selected ||
				(profileCounts.get(profile.signature) ?? 0) > (profileCounts.get(selected.signature) ?? 0)
					? profile
					: selected,
			undefined
		);
	});
	const localTimeLabelsByKey = $derived.by(() => {
		const labelsByKey = new SvelteMap<string, (typeof timeLabelProfiles)[number]['labels']>();
		for (const profile of timeLabelProfiles) {
			if (profile.signature === gutterProfile?.signature) continue;
			labelsByKey.set(profile.geometry.key, profile.labels);
		}
		return labelsByKey;
	});
	const allDaySegments = $derived(
		columnBuckets.flatMap(({ bucket }) =>
			(bucket?.allDay ?? []).filter((segment) => segment.occurrence.item.display !== 'background')
		)
	);
	const allDayBackgroundSegments = $derived(
		new Map(
			columnBuckets.map(({ column, bucket }) => [
				column.key,
				(bucket?.allDay ?? []).filter((segment) => segment.occurrence.item.display === 'background')
			])
		)
	);
	const allDayInsertion = $derived(
		view === 'resource' ? null : calendar.interaction.getAllDayInsertion()
	);
	const allDayPreview = $derived.by(() => {
		if (view !== 'resource') {
			return createEventCalendarAllDayPreviewLayout(allDaySegments, visibleDays, allDayInsertion);
		}
		const placements = columnBuckets.flatMap(({ column, bucket }) => {
			const segments = (bucket?.allDay ?? []).filter(
				(segment) => segment.occurrence.item.display !== 'background'
			);
			return packEventCalendarLanes(segments, [column.day]).placements.map((placement) => ({
				...placement,
				startIndex: column.column,
				endIndex: column.column + 1
			}));
		});
		return {
			layout: {
				placements,
				laneCount: placements.reduce((count, placement) => Math.max(count, placement.lane + 1), 0),
				layoutIdentity: {}
			},
			insertion: null,
			draggingOccurrenceKey: null
		};
	});
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
	const timeTargets = $derived.by(() => {
		if (disabled) return [];
		const targets: EventCalendarTimeTarget[] = [];
		for (const geometry of dayGeometries) {
			let verticalOrder = 0;
			const pushTarget = (target: Omit<EventCalendarTimeTarget, 'verticalOrder'>): void => {
				targets.push({ ...target, verticalOrder });
				verticalOrder += 1;
			};
			pushTarget({
				key: `day-header:${geometry.key}`,
				day: geometry.day,
				column: geometry.column,
				row: 0,
				kind: 'day-header'
			});
			pushTarget({
				key: `all-day:${geometry.key}`,
				day: geometry.day,
				column: geometry.column,
				row: 1,
				kind: 'all-day',
				dropTarget: {
					key: `${view}:all-day:${view === 'resource' ? `resource:${geometry.resourceId ?? 'unassigned'}` : geometry.day}`,
					view,
					allDay: true,
					day: geometry.day,
					...(geometry.resourceId === undefined ? {} : { resourceId: geometry.resourceId })
				}
			});
			for (const placement of allDayLayout.placements
				.filter((candidate) => candidate.startIndex === geometry.column)
				.sort((left, right) => left.lane - right.lane || left.key.localeCompare(right.key))) {
				pushTarget({
					key: `all-day-item:${placement.key}`,
					day: geometry.day,
					column: geometry.column,
					row: 1,
					kind: 'item',
					itemKey: placement.occurrence.key
				});
			}
			const timedTargets: Omit<EventCalendarTimeTarget, 'verticalOrder'>[] = [
				...geometry.slots.map((slot) => ({
					key: slot.key,
					day: geometry.day,
					column: geometry.column,
					row: slot.row,
					kind: 'time-slot' as const,
					dropTarget: {
						key: `${view}:timed:${slot.key}`,
						view,
						allDay: false as const,
						start: slot.start,
						end: slot.end,
						...(geometry.resourceId === undefined ? {} : { resourceId: geometry.resourceId })
					}
				})),
				...geometry.timedPlacements.map((placement) => ({
					key: `time-item:${placement.segment.key}`,
					day: geometry.day,
					column: geometry.column,
					row:
						2 +
						getEventCalendarElapsedMinutes(geometry.windowStart, placement.visualStart) /
							calendar.slotDuration,
					kind: 'item' as const,
					itemKey: placement.segment.occurrence.key
				}))
			].sort((left, right) => {
				if (left.row !== right.row) return left.row - right.row;
				if (left.kind !== right.kind) return left.kind === 'time-slot' ? -1 : 1;
				return left.key.localeCompare(right.key);
			});
			for (const target of timedTargets) {
				pushTarget(target);
			}
		}
		return targets;
	});
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

	function handleAllDayClick(
		day: EventCalendarDateOnly,
		event: MouseEvent,
		resourceId?: string
	): void {
		if (
			a11y.activateMutationTarget({
				key: `${view}:all-day:${view === 'resource' ? `resource:${resourceId ?? 'unassigned'}` : day}`,
				view,
				allDay: true,
				day,
				...(resourceId === undefined ? {} : { resourceId })
			})
		)
			return;
		if (calendar.interaction.shouldSuppressSlotClick()) return;
		if (disabled) return;
		(event.currentTarget as HTMLElement).focus();
		const slot = {
			view,
			allDay: true as const,
			start: day,
			end: addCivilDays(day, 1),
			...(resourceId === undefined ? {} : { resourceId })
		};
		onSlotClick?.({ slot, event });
		if (event.defaultPrevented) {
			calendar.interaction.resetSinglePointerSlot();
			return;
		}
		if (calendar.interaction.selectSinglePointerSlot(slot)) return;
		calendar.select({ kind: 'slot', itemKey: null, slot });
	}

	function handleTimedSlotClick(
		slot: EventCalendarTimeSlot,
		event: MouseEvent,
		resourceId?: string
	): void {
		if (
			a11y.activateMutationTarget({
				key: `${view}:timed:${slot.key}`,
				view,
				allDay: false,
				start: slot.start,
				end: slot.end,
				...(resourceId === undefined ? {} : { resourceId })
			})
		)
			return;
		if (calendar.interaction.shouldSuppressSlotClick()) return;
		if (disabled) return;
		(event.currentTarget as HTMLElement).focus();
		const selectionSlot = {
			view,
			allDay: false as const,
			start: slot.start,
			end: slot.end,
			...(resourceId === undefined ? {} : { resourceId })
		};
		onSlotClick?.({ slot: selectionSlot, event });
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
							onclick={(event) => handleAllDayClick(geometry.day, event)}
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
				{#each gutterProfile?.labels ?? [] as gutterLabel (gutterLabel.instant.getTime())}
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
