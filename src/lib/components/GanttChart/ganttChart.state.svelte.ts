/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging, svelte/prefer-svelte-reactivity -- Descriptor binding follows the established Svelai state-class pattern; Dates, Sets, and ranges are immutable schedule snapshots. */
import { assertScheduleInstant, assertScheduleRange } from '$lib/scheduling/scheduleRange.js';
import type { Messages } from '$lib/i18n/en.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import { bind } from '$lib/utils/state.svelte.js';
import { useDefaultColor } from '../Theme/theme.state.svelte.js';
import { untrack } from 'svelte';
import { applyGanttColumnEdit } from './ganttChart.columns.js';
import { GanttChartA11y } from './ganttChart.a11y.svelte.js';
import { calculateGanttWorkload } from './ganttChart.workload.js';
import { GanttChartClipboard } from './ganttChart.clipboard.js';
import { GanttChartError } from './ganttChart.error.js';
import { GanttChartHistory } from './ganttChart.history.svelte.js';
import { GanttChartInteractions } from './ganttChart.interactions.svelte.js';
import { GanttChartMutations } from './ganttChart.mutations.js';
import { isSameGanttSelection } from './ganttChart.records.js';
import type {
	GanttEventHandlers,
	GanttDisplayOptions,
	GanttInteractionOptions,
	GanttLayoutOptions,
	GanttMutationPolicy,
	GanttRenderers,
	GanttScaleOption,
	GanttScheduleOptions,
	GanttSnapshot,
	GanttTimelineOptions
} from './ganttChart.props.js';
import { resolveGanttScaleSnapDuration } from './ganttChart.scale.js';
import type { GanttRowDropTarget } from './ganttChart.rowDrop.js';
import { createGanttColumnContext } from './ganttChart.rows.js';
import { resolveGanttSchedule, type ResolvedGanttSchedule } from './ganttChart.schedule.js';
import type { GanttChartClasses } from './ganttChart.theme.js';
import type {
	GanttAssignment,
	GanttCalendar,
	GanttChartApi,
	GanttColumnDefinition,
	GanttDependency,
	GanttDuration,
	GanttInteractionBlockedInfo,
	GanttHoliday,
	GanttMutationSource,
	GanttRange,
	GanttResolvedTaskNode,
	GanttResource,
	GanttScaleDefinition,
	GanttScheduleAnalysis,
	GanttScrollMode,
	GanttSelection,
	GanttTask,
	GanttTouchActivation,
	GanttWorkloadBucket,
	GanttZoomLevel
} from './ganttChart.types.js';

export const EMPTY_GANTT_SELECTION: GanttSelection = Object.freeze({
	kind: null,
	taskId: null,
	dependencyId: null,
	cell: null
});

export const DEFAULT_GANTT_ZOOM_LEVELS: readonly GanttZoomLevel[] = Object.freeze([
	'hour',
	'day',
	'week',
	'month',
	'quarter',
	'year'
]);

const BUILT_IN_ZOOM_LEVELS = new Set(DEFAULT_GANTT_ZOOM_LEVELS);
const EMPTY_RANGE_ANCHOR = new Date(0);
const DEFAULT_RANGE_SPAN_MS = 14 * 24 * 60 * 60 * 1000;
const DEFAULT_GANTT_TOUCH_ACTIVATION: GanttTouchActivation = Object.freeze({
	distancePx: 4,
	touchDelayMs: 300,
	touchTolerancePx: 8
});
const DEFAULT_GANTT_ROW_HEIGHT = { compact: 28, normal: 32, comfortable: 36 } as const;
const DEFAULT_GANTT_DISPLAY: GanttDisplayOptions = Object.freeze({
	criticalPath: false,
	baselines: true,
	deadlines: true,
	constraints: true,
	nonWorkingTime: true,
	workload: false
});
const EMPTY_GANTT_RESOURCES: readonly never[] = Object.freeze([]);
const EMPTY_GANTT_CALENDARS: readonly never[] = Object.freeze([]);
const EMPTY_GANTT_HOLIDAYS: readonly GanttHoliday[] = Object.freeze([]);

export type GanttChartStateBindings<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = {
	tasks: GanttTask<TTaskFields>[];
	dependencies: GanttDependency<TDependencyFields>[];
	readonly resourceDefinitions: readonly GanttResource<TResourceFields>[];
	assignments: GanttAssignment<TAssignmentFields>[];
	readonly calendarDefinitions: readonly GanttCalendar[];
	expandedTaskIds: string[];
	selection: GanttSelection;
	zoom: GanttZoomLevel;
	gridWidth: number;
	readonly timeZone: string;
	readonly direction: 'ltr' | 'rtl';
	readonly messages: Messages;
	readonly size: Sizes;
	readonly density: Density;
	readonly classes: GanttChartClasses;
	readonly rootId: string;
	readonly loading: boolean;
	readonly disabled: boolean;
	readonly scheduleOptions: GanttScheduleOptions | undefined;
	readonly timelineOptions: GanttTimelineOptions | undefined;
	readonly layoutOptions:
		| GanttLayoutOptions<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>
		| undefined;
	readonly interactionOptions: GanttInteractionOptions<TDependencyFields> | undefined;
	readonly mutationPolicy:
		GanttMutationPolicy<TTaskFields, TDependencyFields, TAssignmentFields> | undefined;
	readonly eventHandlers: GanttEventHandlers<TTaskFields, TDependencyFields> | undefined;
	readonly renderers:
		GanttRenderers<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> | undefined;
};

export type GanttModelBoundary<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	tasks: GanttTask<TTaskFields>[];
	dependencies: GanttDependency<TDependencyFields>[];
	resources: readonly GanttResource<TResourceFields>[];
	assignments: GanttAssignment<TAssignmentFields>[];
	calendars: readonly GanttCalendar[];
}>;

export type GanttTimelineNavigation = Readonly<{
	fitProject: () => boolean;
	prepareZoom: (anchorDate: Date) => void;
	scrollToDate: (date: Date, options?: { align?: 'start' | 'center' | 'end' }) => boolean;
}>;

export type GanttRowNavigation = Readonly<{
	scrollToTask: (taskId: string, options?: { align?: 'start' | 'center' | 'end' }) => boolean;
}>;

export interface GanttChartState<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> extends GanttChartStateBindings<
	TTaskFields,
	TDependencyFields,
	TResourceFields,
	TAssignmentFields
> {}

export class GanttChartState<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> implements GanttChartApi<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
	#visibleRange = $state<GanttRange | null>(null);
	#timelineNavigation: GanttTimelineNavigation | null = null;
	#rowNavigation: GanttRowNavigation | null = null;
	#mutations: GanttChartMutations<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	#clipboard: GanttChartClipboard<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	#history: GanttChartHistory<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	readonly interaction: GanttChartInteractions<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	readonly a11y: GanttChartA11y<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;

	constructor(
		options: GanttChartStateBindings<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>
	) {
		bind(this, options);
		this.#history = new GanttChartHistory(this, (target, commit, direction) =>
			this.#mutations.restoreSnapshot(target, commit, direction)
		);
		this.#clipboard = new GanttChartClipboard(this);
		this.#mutations = new GanttChartMutations(this, (commit) => {
			const forgetHistory = this.#history.record(commit);
			this.a11y.announceCommit(commit);
			return () => {
				forgetHistory?.();
				this.a11y.announceRevert(commit.title);
			};
		});
		this.interaction = new GanttChartInteractions(this, this.#mutations);
		this.a11y = new GanttChartA11y(this);
		$effect(() => {
			void this.tasks;
			void this.dependencies;
			void this.resources;
			void this.assignments;
			void this.calendars;
			untrack(() => this.interaction.reconcileControlledState());
		});
		$effect(() => {
			this.a11y.syncInteractionStatus(this.interaction.active);
		});
		$effect(() => {
			this.a11y.syncSelection(this.selection);
		});
	}

	readonly projectCalendarId = $derived(this.scheduleOptions?.calendarId);
	readonly validRange = $derived(this.scheduleOptions?.validRange);
	readonly autoSchedule = $derived(this.scheduleOptions?.propagation === 'auto');
	readonly moveDependencies = $derived(this.scheduleOptions?.propagation === 'move-successors');
	readonly scales: readonly GanttScaleDefinition[] = $derived(
		(this.timelineOptions?.scales ?? DEFAULT_GANTT_ZOOM_LEVELS).filter(
			(scale): scale is GanttScaleDefinition => typeof scale !== 'string'
		)
	);
	readonly snapDuration: GanttDuration = $derived(
		this.timelineOptions?.snapDuration ?? resolveGanttScaleSnapDuration(this.zoom, this.scales)
	);
	readonly touchActivation = DEFAULT_GANTT_TOUCH_ACTIVATION;
	readonly color = useDefaultColor();
	readonly themeVariants = $derived({
		size: this.size,
		density: this.density,
		color: this.color,
		disabled: this.disabled
	});
	readonly minGridWidth = 64;
	readonly maxGridWidth = $derived(Math.max(640, this.gridWidth));
	readonly overscan = 6;
	readonly rowHeight = $derived(
		this.layoutOptions?.rowHeight ?? DEFAULT_GANTT_ROW_HEIGHT[this.density]
	);
	readonly scrollMode: GanttScrollMode = $derived(this.layoutOptions?.scrollMode ?? 'contained');
	readonly resources: readonly GanttResource<TResourceFields>[] = $derived(
		this.resourceDefinitions.length === 0 ? EMPTY_GANTT_RESOURCES : this.resourceDefinitions
	);
	readonly calendars: readonly GanttCalendar[] = $derived(
		this.calendarDefinitions.length === 0 ? EMPTY_GANTT_CALENDARS : this.calendarDefinitions
	);
	readonly display: GanttDisplayOptions = $derived({
		...DEFAULT_GANTT_DISPLAY,
		...this.timelineOptions?.display
	});
	readonly holidays: readonly GanttHoliday[] = $derived(
		this.timelineOptions?.holidays ?? EMPTY_GANTT_HOLIDAYS
	);
	readonly interactions = $derived({
		moveTask: this.interactionOptions?.moveTask ?? true,
		resizeStart: this.interactionOptions?.resizeStart ?? true,
		resizeEnd: this.interactionOptions?.resizeEnd ?? true,
		resizeProgress: this.interactionOptions?.resizeProgress ?? true,
		reorderRows: this.interactionOptions?.reorderRows ?? true,
		indent: this.interactionOptions?.indent ?? true,
		outdent: this.interactionOptions?.outdent ?? true,
		createRange: this.interactionOptions?.createRange ?? true,
		keyboard: this.interactionOptions?.keyboard ?? true,
		touch: this.interactionOptions?.touch ?? true,
		clipboard: this.interactionOptions?.clipboard !== false,
		history: this.interactionOptions?.history !== false
	});
	readonly selectedRowTaskId = $derived(
		this.selection.kind === 'task' || this.selection.kind === 'cell' ? this.selection.taskId : null
	);
	readonly modelBoundary: GanttModelBoundary<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	> = $derived({
		tasks: this.tasks,
		dependencies: this.dependencies,
		resources: this.resources,
		assignments: this.assignments,
		calendars: this.calendars
	});

	readonly schedule: ResolvedGanttSchedule<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	> = $derived.by(() => {
		return resolveGanttSchedule({
			tasks: this.tasks,
			dependencies: this.dependencies,
			resources: this.resources,
			assignments: this.assignments,
			calendars: this.calendars,
			expandedTaskIds: this.expandedTaskIds,
			timeZone: this.timeZone,
			projectCalendarId: this.projectCalendarId,
			autoSchedule: false
		});
	});

	readonly snapshot: GanttSnapshot<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	> = $derived.by(() => {
		return {
			tasks: this.tasks,
			dependencies: this.dependencies,
			resources: this.resources,
			assignments: this.assignments,
			resolvedTasks: this.schedule.analysis.tasks,
			expandedTaskIds: this.expandedTaskIds,
			selection: this.selection,
			zoom: this.zoom,
			visibleRange: this.visibleRange,
			loading: this.loading,
			disabled: this.disabled,
			api: this
		};
	});

	get visibleRange(): GanttRange {
		if (this.#visibleRange) return cloneRange(this.#visibleRange);
		const validRange = this.validRange;
		if (validRange) {
			assertRange(validRange, 'validRange');
			return cloneRange(validRange);
		}
		const projectRange = this.schedule.analysis.projectRange;
		if (projectRange) return cloneRange(projectRange);
		return {
			start: new Date(EMPTY_RANGE_ANCHOR.getTime() - DEFAULT_RANGE_SPAN_MS / 2),
			end: new Date(EMPTY_RANGE_ANCHOR.getTime() + DEFAULT_RANGE_SPAN_MS / 2)
		};
	}

	readonly enabledZoomLevels: readonly GanttZoomLevel[] = $derived.by(() => {
		const zoomLevels = (this.timelineOptions?.scales ?? DEFAULT_GANTT_ZOOM_LEVELS).map(
			(scale: GanttScaleOption) => (typeof scale === 'string' ? scale : scale.id)
		);
		const customScaleIds = new Set(this.scales.map((scale) => scale.id));
		if (
			!Array.isArray(zoomLevels) ||
			zoomLevels.length === 0 ||
			new Set(zoomLevels).size !== zoomLevels.length
		) {
			throw new GanttChartError(
				'invalid-zoom-level',
				'zoomLevels must be a non-empty ordered unique array.'
			);
		}
		for (const zoom of zoomLevels) {
			if (typeof zoom !== 'string' || zoom.length === 0) {
				throw new GanttChartError('invalid-zoom-level', 'Every zoom level needs a non-empty id.');
			}
			if (!BUILT_IN_ZOOM_LEVELS.has(zoom) && !customScaleIds.has(zoom)) {
				throw new GanttChartError(
					'invalid-zoom-level',
					`Custom zoom level ${zoom} needs a matching scale definition.`,
					{ zoom }
				);
			}
		}
		if (!zoomLevels.includes(this.zoom)) {
			throw new GanttChartError(
				'invalid-zoom-level',
				`zoom must be present in zoomLevels: ${this.zoom}.`,
				{ zoom: this.zoom }
			);
		}
		return zoomLevels;
	});

	fitProject(): boolean {
		this.#assertNavigationEnabled();
		if (this.#timelineNavigation) return this.#timelineNavigation.fitProject();
		const projectRange = this.schedule.analysis.projectRange;
		if (!projectRange) return false;
		this.setVisibleRange(projectRange);
		return true;
	}

	zoomIn(anchorDate?: Date): boolean {
		if (anchorDate) assertInstant(anchorDate, 'anchorDate');
		return this.#stepZoom(-1, anchorDate);
	}

	zoomOut(anchorDate?: Date): boolean {
		if (anchorDate) assertInstant(anchorDate, 'anchorDate');
		return this.#stepZoom(1, anchorDate);
	}

	setZoom(zoom: GanttZoomLevel, anchorDate?: Date): void {
		this.#assertNavigationEnabled();
		if (anchorDate) assertInstant(anchorDate, 'anchorDate');
		if (!this.enabledZoomLevels.includes(zoom)) {
			throw new GanttChartError('invalid-zoom-level', `Zoom level ${zoom} is not enabled.`, {
				zoom
			});
		}
		if (zoom === this.zoom) return;
		const currentRange = this.visibleRange;
		this.#timelineNavigation?.prepareZoom(
			anchorDate ?? new Date((currentRange.start.getTime() + currentRange.end.getTime()) / 2)
		);
		this.zoom = zoom;
		this.eventHandlers?.onZoomChange?.(zoom);
	}

	scrollToDate(date: Date, options?: { align?: 'start' | 'center' | 'end' }): boolean {
		this.#assertNavigationEnabled();
		assertInstant(date, 'date');
		if (this.#timelineNavigation) return this.#timelineNavigation.scrollToDate(date, options);
		const range = this.visibleRange;
		const duration = range.end.getTime() - range.start.getTime();
		const align = options?.align ?? 'center';
		const start =
			align === 'start'
				? date.getTime()
				: align === 'end'
					? date.getTime() - duration
					: date.getTime() - duration / 2;
		this.setVisibleRange({ start: new Date(start), end: new Date(start + duration) });
		return true;
	}

	scrollToTask(taskId: string, options?: { align?: 'start' | 'center' | 'end' }): boolean {
		this.#assertNavigationEnabled();
		const task = this.getResolvedTask(taskId);
		if (!task) return false;
		const didScrollRow = this.#rowNavigation?.scrollToTask(taskId, options) ?? false;
		if (!task.resolvedStart || !task.resolvedEnd) return didScrollRow;
		const align = options?.align ?? 'center';
		const date =
			align === 'start'
				? task.resolvedStart
				: align === 'end'
					? task.resolvedEnd
					: new Date((task.resolvedStart.getTime() + task.resolvedEnd.getTime()) / 2);
		return this.scrollToDate(date, { align }) || didScrollRow;
	}

	getVisibleRange(): GanttRange {
		return this.visibleRange;
	}

	setVisibleRange(range: GanttRange): void {
		assertRange(range, 'visibleRange');
		const nextRange = this.#clipRange(range);
		const currentRange = this.visibleRange;
		if (
			currentRange.start.getTime() === nextRange.start.getTime() &&
			currentRange.end.getTime() === nextRange.end.getTime()
		) {
			return;
		}
		this.#visibleRange = cloneRange(nextRange);
		this.eventHandlers?.onVisibleRangeChange?.({
			range: cloneRange(nextRange),
			projectRange: cloneNullableRange(this.schedule.analysis.projectRange),
			zoom: this.zoom,
			timeZone: this.timeZone
		});
	}

	connectTimelineNavigation(navigation: GanttTimelineNavigation): () => void {
		this.#timelineNavigation = navigation;
		return () => {
			if (this.#timelineNavigation === navigation) this.#timelineNavigation = null;
		};
	}

	connectRowNavigation(navigation: GanttRowNavigation): () => void {
		this.#rowNavigation = navigation;
		return () => {
			if (this.#rowNavigation === navigation) this.#rowNavigation = null;
		};
	}

	getTask(taskId: string): GanttTask<TTaskFields> | null {
		return this.schedule.model.tasksById.get(taskId) ?? null;
	}

	getResolvedTask(taskId: string): GanttResolvedTaskNode<TTaskFields> | null {
		return this.schedule.resolvedTasksById.get(taskId) ?? null;
	}

	getVisibleTasks(): readonly GanttResolvedTaskNode<TTaskFields>[] {
		return this.schedule.visibleTasks;
	}

	getDependency(dependencyId: string): GanttDependency<TDependencyFields> | null {
		return this.schedule.model.dependenciesById.get(dependencyId) ?? null;
	}

	getAssignment(assignmentId: string): GanttAssignment<TAssignmentFields> | null {
		return this.schedule.model.assignmentsById.get(assignmentId) ?? null;
	}

	getResources(): readonly GanttResource<TResourceFields>[] {
		return this.resources;
	}

	getScheduleAnalysis(): GanttScheduleAnalysis<TTaskFields, TDependencyFields> {
		return this.schedule.analysis;
	}

	getWorkload(range?: GanttRange): readonly GanttWorkloadBucket[] {
		if (!range) return this.schedule.workload;
		assertRange(range, 'range');
		return calculateGanttWorkload(this.schedule.model, this.schedule.resolvedTasksById, range);
	}

	expandTask(taskId: string): void {
		this.#setTaskExpansion(taskId, true);
	}

	collapseTask(taskId: string): void {
		this.#setTaskExpansion(taskId, false);
	}

	toggleTask(taskId: string): void {
		this.#setTaskExpansion(taskId, !this.expandedTaskIds.includes(taskId));
	}

	expandAll(): void {
		this.#assertNavigationEnabled();
		this.#publishExpansion(
			this.schedule.analysis.tasks
				.filter((node) => node.type === 'summary')
				.map((node) => node.taskId)
		);
	}

	collapseAll(): void {
		this.#assertNavigationEnabled();
		this.#publishExpansion([]);
	}

	select(selection: GanttSelection): void {
		this.#assertNavigationEnabled();
		this.#validateSelection(selection);
		if (isSameGanttSelection(selection, this.selection)) return;
		this.selection = selection;
		this.eventHandlers?.onSelectionChange?.(selection);
	}

	clearSelection(): void {
		this.select(EMPTY_GANTT_SELECTION);
	}

	addTask(task: GanttTask<TTaskFields>): void {
		this.#requireAccepted(this.#mutations.addTask(task, 'api'), 'addTask');
	}

	updateTask(task: GanttTask<TTaskFields>): void {
		this.#requireAccepted(this.#mutations.updateTask(task, 'api'), 'updateTask');
	}

	removeTask(taskId: string): void {
		this.#requireAccepted(this.#mutations.removeTask(taskId, 'api'), 'removeTask');
	}

	removeTaskFromKeyboard(taskId: string): boolean {
		if (!this.interactions.keyboard) return false;
		const accepted = this.#mutations.removeTask(taskId, 'keyboard');
		if (accepted && this.selection.kind !== null) this.clearSelection();
		return accepted;
	}

	addDependency(dependency: GanttDependency<TDependencyFields>): void {
		this.#requireAccepted(this.#mutations.addDependency(dependency, 'api'), 'addDependency');
	}

	updateDependency(dependency: GanttDependency<TDependencyFields>): void {
		this.#requireAccepted(this.#mutations.updateDependency(dependency, 'api'), 'updateDependency');
	}

	removeDependency(dependencyId: string): void {
		this.#requireAccepted(
			this.#mutations.removeDependency(dependencyId, 'api'),
			'removeDependency'
		);
	}

	removeDependencyFromKeyboard(dependencyId: string): boolean {
		if (!this.interactions.keyboard) return false;
		const accepted = this.#mutations.removeDependency(dependencyId, 'keyboard');
		if (accepted && this.selection.kind === 'dependency') this.clearSelection();
		return accepted;
	}

	updateDependencyFromInline(dependency: GanttDependency<TDependencyFields>): boolean {
		return this.#mutations.updateDependency(dependency, 'inline-edit');
	}

	addAssignment(assignment: GanttAssignment<TAssignmentFields>): void {
		this.#requireAccepted(this.#mutations.addAssignment(assignment, 'api'), 'addAssignment');
	}

	updateAssignment(assignment: GanttAssignment<TAssignmentFields>): void {
		this.#requireAccepted(this.#mutations.updateAssignment(assignment, 'api'), 'updateAssignment');
	}

	removeAssignment(assignmentId: string): void {
		this.#requireAccepted(
			this.#mutations.removeAssignment(assignmentId, 'api'),
			'removeAssignment'
		);
	}

	updateTaskFromColumn(
		node: GanttResolvedTaskNode<TTaskFields>,
		column: GanttColumnDefinition<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>,
		value: unknown
	): boolean {
		const context = createGanttColumnContext(
			node,
			this.dependencies,
			this.resources,
			this.assignments
		);
		const task = applyGanttColumnEdit(column, context, value);
		return this.#mutations.updateTask(task, 'inline-edit');
	}

	reorderTask(
		target: GanttRowDropTarget,
		source: Extract<GanttMutationSource, 'pointer' | 'keyboard'> = 'pointer'
	): boolean {
		if (!this.interactions.reorderRows) return false;
		return this.#mutations.reorderTask(target, source);
	}

	indentTask(
		taskId: string,
		previousTaskId: string | null,
		source: GanttMutationSource = 'keyboard'
	): boolean {
		if (!this.interactions.indent || !previousTaskId) return false;
		return this.#mutations.indentTask(taskId, previousTaskId, source);
	}

	outdentTask(taskId: string, source: GanttMutationSource = 'keyboard'): boolean {
		if (!this.interactions.outdent) return false;
		return this.#mutations.outdentTask(taskId, source);
	}

	blockInteraction(info: GanttInteractionBlockedInfo): void {
		this.eventHandlers?.onInteractionBlocked?.(info);
	}

	copySelection(): boolean {
		const accepted = this.#clipboard.copySelection();
		const title = this.#clipboard.copiedRootTitle;
		if (accepted && title) {
			this.a11y.announce(
				this.messages.ganttChartCopiedTask(title, this.#clipboard.omittedDependencyCount)
			);
		}
		return accepted;
	}

	paste(): boolean {
		const records = this.#clipboard.preparePaste();
		const accepted = this.#mutations.pasteSubtree(records);
		if (accepted) this.#clipboard.markPasted(records.copyIndex);
		return accepted;
	}

	undo(): boolean {
		return this.#history.undo();
	}

	redo(): boolean {
		return this.#history.redo();
	}

	canUndo(): boolean {
		return this.#history.canUndo();
	}

	canRedo(): boolean {
		return this.#history.canRedo();
	}

	cancelInteraction(): void {
		if (!this.a11y.cancelKeyboardMode()) this.interaction.cancel(true);
	}

	#stepZoom(direction: -1 | 1, anchorDate?: Date): boolean {
		this.#assertNavigationEnabled();
		const zoomLevels = this.enabledZoomLevels;
		const index = zoomLevels.indexOf(this.zoom);
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= zoomLevels.length) return false;
		this.setZoom(zoomLevels[nextIndex], anchorDate);
		return true;
	}

	#setTaskExpansion(taskId: string, isExpanded: boolean): void {
		this.#assertNavigationEnabled();
		const task = this.getResolvedTask(taskId);
		if (!task || task.type !== 'summary') {
			throw new GanttChartError('invalid-operation', `Task ${taskId} is not a summary.`, {
				taskId
			});
		}
		const expandedTaskIds = this.expandedTaskIds;
		if (expandedTaskIds.includes(taskId) === isExpanded) return;
		this.#publishExpansion(
			isExpanded
				? [...expandedTaskIds, taskId]
				: expandedTaskIds.filter((expandedTaskId) => expandedTaskId !== taskId)
		);
	}

	#publishExpansion(expandedTaskIds: string[]): void {
		this.expandedTaskIds = expandedTaskIds;
		this.eventHandlers?.onExpansionChange?.(expandedTaskIds);
	}

	#validateSelection(selection: GanttSelection): void {
		if (!selection || typeof selection !== 'object') {
			throw new GanttChartError('invalid-selection', 'selection must be a GanttSelection.');
		}
		if (selection.kind === null) return;
		if (selection.kind === 'task' && this.getTask(selection.taskId)) return;
		if (selection.kind === 'dependency' && this.getDependency(selection.dependencyId)) return;
		if (
			selection.kind === 'cell' &&
			this.getTask(selection.taskId) &&
			selection.cell.taskId === selection.taskId &&
			selection.cell.columnId.length > 0
		) {
			return;
		}
		throw new GanttChartError('invalid-selection', 'selection references an unknown record.', {
			selection
		});
	}

	#clipRange(range: GanttRange): GanttRange {
		const validRange = this.validRange;
		if (!validRange) return cloneRange(range);
		assertRange(validRange, 'validRange');
		const duration = range.end.getTime() - range.start.getTime();
		const validDuration = validRange.end.getTime() - validRange.start.getTime();
		if (duration >= validDuration) return cloneRange(validRange);
		if (range.start.getTime() < validRange.start.getTime()) {
			return {
				start: new Date(validRange.start),
				end: new Date(validRange.start.getTime() + duration)
			};
		}
		if (range.end.getTime() > validRange.end.getTime()) {
			return {
				start: new Date(validRange.end.getTime() - duration),
				end: new Date(validRange.end)
			};
		}
		return cloneRange(range);
	}

	#assertNavigationEnabled(): void {
		if (!this.disabled) return;
		throw new GanttChartError('disabled', 'GanttChart is disabled.');
	}

	#requireAccepted(isAccepted: boolean, method: string): void {
		if (isAccepted) return;
		throw new GanttChartError('rejected', `${method} was rejected by the consumer policy.`, {
			method
		});
	}
}

function assertInstant(value: Date, name: string): void {
	try {
		assertScheduleInstant(value, name);
	} catch (error) {
		throw new GanttChartError('invalid-date', `${name} must be a valid Date instant.`, {
			name,
			cause: error instanceof Error ? error.message : String(error)
		});
	}
}

function assertRange(range: GanttRange, name: string): void {
	try {
		assertScheduleRange(range, name);
	} catch (error) {
		throw new GanttChartError('invalid-range', `${name} must be a valid half-open range.`, {
			name,
			cause: error instanceof Error ? error.message : String(error)
		});
	}
}

function cloneRange(range: GanttRange): GanttRange {
	return { start: new Date(range.start), end: new Date(range.end) };
}

function cloneNullableRange(range: GanttRange | null): GanttRange | null {
	return range ? cloneRange(range) : null;
}
