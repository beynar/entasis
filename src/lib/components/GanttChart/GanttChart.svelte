<script
	lang="ts"
	generics="TTaskFields extends object = Record<never, never>, TDependencyFields extends object = Record<never, never>, TResourceFields extends object = Record<never, never>, TAssignmentFields extends object = Record<never, never>"
>
	import { useI18n, useI18nDirection } from '$lib/i18n/context.svelte.js';
	import { createBindableValue } from '$lib/utils/state.svelte.js';
	import { onMount } from 'svelte';
	import GanttChartHeader from './GanttChartHeader.svelte';
	import GanttChartShell from './GanttChartShell.svelte';
	import type { GanttChartProps } from './ganttChart.props.js';
	import { EMPTY_GANTT_SELECTION, GanttChartState } from './ganttChart.state.svelte.js';
	import { useGanttChartTheme } from './ganttChart.theme.js';
	import type {
		GanttAssignment,
		GanttDependency,
		GanttSelection,
		GanttTask,
		GanttZoomLevel
	} from './ganttChart.types.js';

	const defaultResources: never[] = [];
	const defaultCalendars: never[] = [];
	const rootId = $props.id();

	let {
		tasks = $bindable<GanttTask<TTaskFields>[]>([]),
		dependencies = $bindable<GanttDependency<TDependencyFields>[]>([]),
		resources = defaultResources,
		assignments = $bindable<GanttAssignment<TAssignmentFields>[]>([]),
		calendars = defaultCalendars,
		expandedTaskIds = $bindable<string[]>(
			tasks.flatMap((task) => (task.type === 'summary' ? [task.id] : []))
		),
		selection = $bindable<GanttSelection>(),
		defaultSelection = EMPTY_GANTT_SELECTION,
		zoom = $bindable<GanttZoomLevel>('week'),
		timeZone,
		i18n,
		size = 'normal',
		density = 'normal',
		class: className,
		ref = $bindable<HTMLElement | null>(null),
		theme,
		loading = false,
		disabled = false,
		gridWidth = $bindable(352),
		schedule,
		timeline,
		layout,
		interactions,
		mutations,
		events,
		render,
		onkeydown: consumerKeydown,
		...rootAttributes
	}: GanttChartProps<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> = $props();

	const messages = $derived(useI18n(i18n));
	const classes = $derived(useGanttChartTheme(theme));
	const contextualDirection = $derived(useI18nDirection());
	const directionAttributes = $derived(contextualDirection ? { dir: contextualDirection } : {});
	let ambientDirection = $state<'ltr' | 'rtl' | null>(null);
	const resolvedDirection = $derived(contextualDirection ?? ambientDirection ?? 'ltr');
	const rootAriaLabel = $derived(
		typeof rootAttributes['aria-label'] === 'string'
			? rootAttributes['aria-label']
			: messages.ganttChartLabel
	);

	const selectionState = createBindableValue(
		() => selection,
		(next) => {
			selection = next;
		},
		() => defaultSelection
	);

	const chart = new GanttChartState<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>({
		get tasks() {
			return tasks;
		},
		set tasks(value) {
			tasks = value;
		},
		get dependencies() {
			return dependencies;
		},
		set dependencies(value) {
			dependencies = value;
		},
		get resourceDefinitions() {
			return resources;
		},
		get assignments() {
			return assignments;
		},
		set assignments(value) {
			assignments = value;
		},
		get calendarDefinitions() {
			return calendars;
		},
		get expandedTaskIds() {
			return expandedTaskIds;
		},
		set expandedTaskIds(value) {
			expandedTaskIds = value;
		},
		get selection() {
			return selectionState.value;
		},
		set selection(value) {
			selectionState.value = value;
		},
		get zoom() {
			return zoom;
		},
		set zoom(value) {
			zoom = value;
		},
		get gridWidth() {
			return gridWidth;
		},
		set gridWidth(value) {
			gridWidth = value;
		},
		get timeZone() {
			return timeZone;
		},
		get direction() {
			return resolvedDirection;
		},
		get messages() {
			return messages;
		},
		get size() {
			return size;
		},
		get density() {
			return density;
		},
		get classes() {
			return classes;
		},
		rootId,
		get loading() {
			return loading;
		},
		get disabled() {
			return disabled;
		},
		get scheduleOptions() {
			return schedule;
		},
		get timelineOptions() {
			return timeline;
		},
		get layoutOptions() {
			return layout;
		},
		get interactionOptions() {
			return interactions;
		},
		get mutationPolicy() {
			return mutations;
		},
		get eventHandlers() {
			return events;
		},
		get renderers() {
			return render;
		}
	});

	function handleRootKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }
	): void {
		if (typeof consumerKeydown === 'function') consumerKeydown(event);
		if (event.key !== 'Escape' && !event.defaultPrevented) chart.a11y.handleRootKeydown(event);
	}

	export const fitProject = chart.fitProject.bind(chart);
	export const zoomIn = chart.zoomIn.bind(chart);
	export const zoomOut = chart.zoomOut.bind(chart);
	export const setZoom = chart.setZoom.bind(chart);
	export const scrollToDate = chart.scrollToDate.bind(chart);
	export const scrollToTask = chart.scrollToTask.bind(chart);
	export const getVisibleRange = chart.getVisibleRange.bind(chart);
	export const getTask = chart.getTask.bind(chart);
	export const getResolvedTask = chart.getResolvedTask.bind(chart);
	export const getVisibleTasks = chart.getVisibleTasks.bind(chart);
	export const getDependency = chart.getDependency.bind(chart);
	export const getAssignment = chart.getAssignment.bind(chart);
	export const getResources = chart.getResources.bind(chart);
	export const getScheduleAnalysis = chart.getScheduleAnalysis.bind(chart);
	export const getWorkload = chart.getWorkload.bind(chart);
	export const expandTask = chart.expandTask.bind(chart);
	export const collapseTask = chart.collapseTask.bind(chart);
	export const toggleTask = chart.toggleTask.bind(chart);
	export const expandAll = chart.expandAll.bind(chart);
	export const collapseAll = chart.collapseAll.bind(chart);
	export const select = chart.select.bind(chart);
	export const clearSelection = chart.clearSelection.bind(chart);
	export const addTask = chart.addTask.bind(chart);
	export const updateTask = chart.updateTask.bind(chart);
	export const removeTask = chart.removeTask.bind(chart);
	export const addDependency = chart.addDependency.bind(chart);
	export const updateDependency = chart.updateDependency.bind(chart);
	export const removeDependency = chart.removeDependency.bind(chart);
	export const addAssignment = chart.addAssignment.bind(chart);
	export const updateAssignment = chart.updateAssignment.bind(chart);
	export const removeAssignment = chart.removeAssignment.bind(chart);
	export const copySelection = chart.copySelection.bind(chart);
	export const paste = chart.paste.bind(chart);
	export const undo = chart.undo.bind(chart);
	export const redo = chart.redo.bind(chart);
	export const canUndo = chart.canUndo.bind(chart);
	export const canRedo = chart.canRedo.bind(chart);
	export const cancelInteraction = chart.cancelInteraction.bind(chart);

	onMount(() => {
		if (!ref) throw new Error('GanttChart root did not mount.');
		const disconnectA11y = chart.a11y.connectRoot(ref);
		const rootElement = ref;
		const updateAmbientDirection = () => {
			ambientDirection = getComputedStyle(rootElement).direction === 'rtl' ? 'rtl' : 'ltr';
		};
		updateAmbientDirection();
		const observer = new MutationObserver(updateAmbientDirection);
		for (
			let ancestor: HTMLElement | null = rootElement;
			ancestor;
			ancestor = ancestor.parentElement
		) {
			observer.observe(ancestor, {
				attributes: true,
				attributeFilter: ['class', 'dir', 'style']
			});
		}
		return () => {
			disconnectA11y();
			observer.disconnect();
		};
	});
</script>

<div
	{...rootAttributes}
	{...directionAttributes}
	bind:this={ref}
	role="region"
	aria-label={rootAriaLabel}
	aria-describedby={chart.a11y.instructionsId}
	onclickcapture={(event) => chart.a11y.handleRootClick(event)}
	onkeydowncapture={(event) => {
		if (event.key === 'Escape') chart.a11y.scheduleDismissFocus();
	}}
	onkeydown={handleRootKeydown}
	data-gantt-chart-part="root"
	data-size={chart.size}
	data-density={chart.density}
	data-color={chart.color}
	data-direction={chart.direction}
	data-zoom={chart.zoom}
	data-loading={chart.loading || undefined}
	data-disabled={chart.disabled || undefined}
	class={chart.classes.root({
		...chart.themeVariants,
		class: [chart.scrollMode === 'page' ? 'overflow-visible' : 'overflow-hidden', className]
	})}
>
	{#if chart.renderers?.header !== false}
		<GanttChartHeader {chart} />
	{/if}
	<GanttChartShell {chart} />
	<div
		id={chart.a11y.liveRegionId}
		data-gantt-chart-part="live-region"
		class={chart.classes.liveRegion(chart.themeVariants)}
		aria-live="polite"
		aria-atomic="true"
	>
		{chart.a11y.announcement}
	</div>
	<div id={chart.a11y.instructionsId} class="sr-only">
		{chart.messages.ganttChartKeyboardInstructions}
	</div>
</div>
