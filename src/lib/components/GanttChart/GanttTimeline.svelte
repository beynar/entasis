<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import { onMount, tick, untrack } from 'svelte';
	import GanttTimeHeader from './GanttTimeHeader.svelte';
	import GanttTimelineRows from './GanttTimelineRows.svelte';
	import GanttWorkloadPanel from './GanttWorkloadPanel.svelte';
	import { getCalendarRuntime } from './ganttChart.calendar.js';
	import { GanttChartError } from './ganttChart.error.js';
	import { resolveGanttTimeShades } from './ganttChart.layout.js';
	import type { GanttResolvedResourceView } from './ganttChart.resourceView.js';
	import type { GanttRowModel, GanttVirtualRow } from './ganttChart.rows.js';
	import {
		createGanttTimeScale,
		getGanttScaleInstantAtPixel,
		getGanttScalePixel,
		getGanttScrollLeft,
		getGanttVisibleRange
	} from './ganttChart.scale.js';
	import type { GanttChartState, GanttTimelineNavigation } from './ganttChart.state.svelte.js';
	import type { GanttRange, GanttZoomLevel } from './ganttChart.types.js';

	let {
		chart,
		rowModel,
		renderedRows,
		totalHeight,
		resourceView
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		rowModel: GanttRowModel<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		renderedRows: readonly GanttVirtualRow[];
		totalHeight: number;
		resourceView: GanttResolvedResourceView<TResourceFields>;
	} = $props();

	let horizontalViewport = $state<HTMLDivElement | null>(null);
	let viewportWidth = $state(0);
	let scrollLeft = $state(0);
	let now = $state<Date | null>(null);
	let pendingAnchor = $state<Readonly<{ date: Date; offset: number }> | null>(null);
	let lastScaleKey = $state('');
	let lastViewportWidth = $state(0);
	let lastPublishedRange = $state<GanttRange | null>(null);
	let visibleRangeFrame: number | null = null;
	let pinchZoomIdleTimer: ReturnType<typeof setTimeout> | null = null;
	let isPinchZoomLocked = false;
	const PINCH_ZOOM_IDLE_MS = 180;
	const FIT_PROJECT_EDGE_INSET = 16;
	const fallbackViewportWidth = 960;
	const effectiveViewportWidth = $derived(viewportWidth || fallbackViewportWidth);
	const fitProjectWidth = $derived(
		Math.max(1, effectiveViewportWidth - FIT_PROJECT_EDGE_INSET * 2)
	);
	const projectRange = $derived(chart.schedule.analysis.projectRange);
	const emptyCanvasRange = untrack(() => chart.visibleRange);
	let projectCanvasRange = $state<GanttRange | null>(
		untrack(() => (projectRange ? cloneRange(projectRange) : null))
	);
	let fittedProjectRange = $state<GanttRange | null>(null);
	const canvasSourceRange = $derived(chart.validRange ?? projectCanvasRange ?? emptyCanvasRange);
	const scale = $derived(
		createGanttTimeScale({
			range: canvasSourceRange,
			zoom: chart.zoom,
			timeZone: chart.timeZone,
			locale: chart.messages.locale,
			direction: chart.direction,
			scales: chart.scales,
			minimumWidth: fittedProjectRange ? fitProjectWidth : effectiveViewportWidth,
			pad: chart.validRange === undefined,
			fitRange: fittedProjectRange ?? undefined
		})
	);
	const visiblePixels = $derived({
		start: Math.max(0, scrollLeft),
		end: Math.min(scale.totalWidth, scrollLeft + effectiveViewportWidth)
	});
	const visibleRange = $derived(
		getGanttVisibleRange(scale, visiblePixels.start, effectiveViewportWidth)
	);
	const projectCalendar = $derived(getCalendarRuntime(chart.schedule.model.projectCalendar));
	const shades = $derived(
		resolveGanttTimeShades({
			scale,
			visibleRange,
			projectCalendar,
			holidays: chart.holidays,
			showWeekends: chart.timelineOptions?.weekends ?? true,
			showNonWorkingTime: chart.display.nonWorkingTime
		})
	);
	const scaleKey = $derived(
		`${chart.zoom}:${scale.canvasRange.start.getTime()}:${scale.canvasRange.end.getTime()}:${scale.totalWidth}:${chart.direction}`
	);
	const workloadPanelHeight = $derived(
		chart.display.workload && resourceView.resources.length > 0 ? resourceView.workloadHeight : 0
	);
	const activeInteraction = $derived(chart.interaction.active);
	const isInteractionInvalid = $derived(
		activeInteraction?.kind !== 'row' && activeInteraction?.resolution.state === 'rejected'
	);

	const navigation: GanttTimelineNavigation = {
		fitProject: fitProjectInViewport,
		prepareZoom,
		scrollToDate
	};

	$effect(() => {
		if (chart.validRange || !projectRange) return;
		if (!projectCanvasRange) {
			projectCanvasRange = cloneRange(projectRange);
			return;
		}
		const currentRange = untrack(() => projectCanvasRange);
		if (!currentRange) return;
		const nextStart = Math.min(currentRange.start.getTime(), projectRange.start.getTime());
		const nextEnd = Math.max(currentRange.end.getTime(), projectRange.end.getTime());
		if (nextStart === currentRange.start.getTime() && nextEnd === currentRange.end.getTime()) {
			return;
		}
		projectCanvasRange = { start: new Date(nextStart), end: new Date(nextEnd) };
	});

	$effect(() => {
		const key = scaleKey;
		if (!horizontalViewport || key === lastScaleKey) return;
		const anchorRange = untrack(() => lastPublishedRange ?? chart.visibleRange);
		const anchor = pendingAnchor ?? {
			date: new Date((anchorRange.start.getTime() + anchorRange.end.getTime()) / 2),
			offset: effectiveViewportWidth / 2
		};
		lastScaleKey = key;
		pendingAnchor = null;
		void tick().then(() => applyScrollAnchor(anchor));
	});

	$effect(() => {
		chart.interaction.reconcileScale(scale);
	});

	$effect(() => {
		const width = viewportWidth;
		if (width <= 0) return;
		const previousWidth = untrack(() => lastViewportWidth);
		lastViewportWidth = width;
		if (previousWidth <= 0) {
			queueVisibleRangePublish();
			return;
		}
		const anchorRange = untrack(() => lastPublishedRange ?? chart.visibleRange);
		const anchor = {
			date: new Date((anchorRange.start.getTime() + anchorRange.end.getTime()) / 2),
			offset: width / 2
		};
		void tick().then(() => applyScrollAnchor(anchor));
	});

	onMount(() => {
		now = new Date();
		lastScaleKey = scaleKey;
		const viewport = horizontalViewport;
		if (!viewport) {
			throw new GanttChartError(
				'invalid-operation',
				'GanttChart timeline mounted without its horizontal viewport.'
			);
		}
		const disconnectNavigation = chart.connectTimelineNavigation(navigation);
		const disconnectInteractions = chart.interaction.connectTimeline({
			get scale() {
				return scale;
			},
			viewport,
			get rowHeight() {
				return chart.rowHeight;
			}
		});
		const initialAnchor = projectRange?.start ?? chart.visibleRange.start;
		void tick().then(() => {
			scrollToDate(initialAnchor, { align: 'start' });
		});
		return () => {
			disconnectNavigation();
			disconnectInteractions();
			if (visibleRangeFrame !== null) cancelAnimationFrame(visibleRangeFrame);
			resetPinchZoomGesture();
		};
	});

	function handleScroll(): void {
		if (!horizontalViewport) return;
		scrollLeft = horizontalViewport.scrollLeft;
		queueVisibleRangePublish();
	}

	function handleWheel(event: WheelEvent): void {
		if (!horizontalViewport || chart.disabled) return;
		if (activeInteraction) return;
		if (event.ctrlKey || event.metaKey) {
			event.preventDefault();
			if (event.deltaY === 0) return;
			holdPinchZoomGesture();
			if (isPinchZoomLocked) return;
			isPinchZoomLocked = true;
			const bounds = horizontalViewport.getBoundingClientRect();
			const offset = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
			const anchor = getGanttScaleInstantAtPixel(scale, scrollLeft + offset);
			pendingAnchor = { date: anchor, offset };
			if (event.deltaY < 0) chart.zoomIn(anchor);
			else if (event.deltaY > 0) chart.zoomOut(anchor);
			return;
		}
		if (!event.shiftKey || event.deltaX !== 0 || event.deltaY === 0) return;
		event.preventDefault();
		horizontalViewport.scrollLeft += event.deltaY;
	}

	function holdPinchZoomGesture(): void {
		if (pinchZoomIdleTimer !== null) clearTimeout(pinchZoomIdleTimer);
		pinchZoomIdleTimer = setTimeout(resetPinchZoomGesture, PINCH_ZOOM_IDLE_MS);
	}

	function resetPinchZoomGesture(): void {
		if (pinchZoomIdleTimer !== null) clearTimeout(pinchZoomIdleTimer);
		pinchZoomIdleTimer = null;
		isPinchZoomLocked = false;
	}

	function queueVisibleRangePublish(): void {
		if (visibleRangeFrame !== null) return;
		visibleRangeFrame = requestAnimationFrame(() => {
			visibleRangeFrame = null;
			const range = getGanttVisibleRange(scale, scrollLeft, effectiveViewportWidth);
			lastPublishedRange = range;
			chart.setVisibleRange(range);
		});
	}

	function scrollToDate(date: Date, options?: { align?: 'start' | 'center' | 'end' }): boolean {
		if (!horizontalViewport) return false;
		const nextScrollLeft = getGanttScrollLeft(scale, date, effectiveViewportWidth, options?.align);
		horizontalViewport.scrollLeft = nextScrollLeft;
		scrollLeft = nextScrollLeft;
		queueVisibleRangePublish();
		return true;
	}

	function prepareZoom(anchorDate: Date): void {
		fittedProjectRange = null;
		if (pendingAnchor?.date.getTime() === anchorDate.getTime()) return;
		pendingAnchor = { date: new Date(anchorDate), offset: effectiveViewportWidth / 2 };
	}

	function fitProjectInViewport(): boolean {
		if (!projectRange) return false;
		const center = new Date((projectRange.start.getTime() + projectRange.end.getTime()) / 2);
		const zoom = resolveFitZoom(projectRange);
		const isZoomChange = zoom !== chart.zoom;
		pendingAnchor = { date: center, offset: effectiveViewportWidth / 2 };
		if (!chart.validRange) {
			projectCanvasRange = cloneRange(projectRange);
		}
		if (isZoomChange) chart.setZoom(zoom, center);
		fittedProjectRange = cloneRange(projectRange);
		if (!isZoomChange) void tick().then(() => applyScrollAnchor(pendingAnchor));
		return true;
	}

	function resolveFitZoom(range: GanttRange): GanttZoomLevel {
		const duration = range.end.getTime() - range.start.getTime();
		for (const zoom of chart.enabledZoomLevels) {
			const candidate = createGanttTimeScale({
				range,
				zoom,
				timeZone: chart.timeZone,
				locale: chart.messages.locale,
				direction: chart.direction,
				scales: chart.scales,
				minimumWidth: 0,
				pad: false
			});
			if (duration * candidate.pixelsPerMillisecond <= fitProjectWidth) return zoom;
		}
		return chart.enabledZoomLevels.at(-1) ?? chart.zoom;
	}

	function applyScrollAnchor(anchor: Readonly<{ date: Date; offset: number }> | null): void {
		if (!anchor || !horizontalViewport) return;
		const pixel = getGanttScalePixel(scale, anchor.date);
		const nextScrollLeft = Math.max(
			0,
			Math.min(scale.totalWidth - effectiveViewportWidth, pixel - anchor.offset)
		);
		horizontalViewport.scrollLeft = nextScrollLeft;
		scrollLeft = nextScrollLeft;
		queueVisibleRangePublish();
	}

	function cloneRange(range: GanttRange): GanttRange {
		return { start: new Date(range.start), end: new Date(range.end) };
	}
</script>

<div
	data-gantt-chart-part="timeline-pane"
	class={chart.classes.timelinePane(chart.themeVariants)}
	role="group"
	aria-label={chart.messages.ganttChartTimeline}
>
	<div
		class="sticky top-0 z-30 h-[var(--gantt-header-height)] overflow-x-clip bg-surface-raised/95 backdrop-blur"
		dir={chart.direction}
	>
		<div
			style:width={`${scale.totalWidth}px`}
			style:transform={`translate3d(${-scrollLeft}px, 0, 0)`}
		>
			<GanttTimeHeader {chart} {scale} {visiblePixels} {viewportWidth} />
		</div>
	</div>
	<div
		bind:clientWidth={viewportWidth}
		dir="ltr"
		data-gantt-chart-part="timeline-viewport"
		data-scrollbars="custom"
		data-compressed={scale.isCompressed || undefined}
		data-interaction-invalid={isInteractionInvalid || undefined}
		data-visible-start={visibleRange.start.toISOString()}
		data-visible-end={visibleRange.end.toISOString()}
		class={chart.classes.viewport({
			...chart.themeVariants,
			invalid: isInteractionInvalid,
			class: 'h-auto'
		})}
		style:height={`${totalHeight + workloadPanelHeight}px`}
		onwheel={handleWheel}
	>
		<ScrollArea
			bind:viewportRef={horizontalViewport}
			class="h-full min-w-0"
			ariaLabel={chart.messages.ganttChartTimeline}
			type="hover"
			onscroll={handleScroll}
		>
			<div
				class="relative overflow-x-clip"
				style:width={`${scale.totalWidth}px`}
				style:height={`${totalHeight + workloadPanelHeight}px`}
				dir={chart.direction}
			>
				<GanttTimelineRows
					{chart}
					{rowModel}
					{renderedRows}
					{scale}
					{visibleRange}
					{visiblePixels}
					{viewportWidth}
					{totalHeight}
					{shades}
					{projectRange}
					{now}
				/>
				{#if workloadPanelHeight > 0}
					<GanttWorkloadPanel
						{chart}
						{resourceView}
						{scale}
						{visiblePixels}
						{viewportWidth}
						height={workloadPanelHeight}
					/>
				{/if}
			</div>
		</ScrollArea>
	</div>
</div>
