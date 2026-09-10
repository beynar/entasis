import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density, Sizes } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { GanttChartThemeProps } from './ganttChart.theme.js';
import type {
	GanttAssignment,
	GanttAssignmentProposal,
	GanttAssignmentUpdateResult,
	GanttAssignmentsChange,
	GanttCalendar,
	GanttChartApi,
	GanttColumnDefinition,
	GanttConstraintViolation,
	GanttDependency,
	GanttDependencyCreationRequest,
	GanttDependencyGeometry,
	GanttDependencyProposal,
	GanttDependencyUpdateResult,
	GanttDependenciesChange,
	GanttDuration,
	GanttHoliday,
	GanttInteractionBlockedInfo,
	GanttPasteIdRequest,
	GanttRange,
	GanttRangeProposal,
	GanttResolvedDependency,
	GanttResolvedTaskNode,
	GanttResource,
	GanttScaleCell,
	GanttScaleDefinition,
	GanttScrollMode,
	GanttSelection,
	GanttTask,
	GanttTaskGeometry,
	GanttTaskProposal,
	GanttTasksChange,
	GanttTaskUpdateResult,
	GanttVisibleRangeInfo,
	GanttWorkloadBucket,
	GanttZoomLevel
} from './ganttChart.types.js';

export type { GanttChartThemeProps } from './ganttChart.theme.js';

export type GanttDisplayOptions = Readonly<{
	criticalPath: boolean;
	baselines: boolean;
	deadlines: boolean;
	constraints: boolean;
	nonWorkingTime: boolean;
	workload: boolean;
}>;

export type GanttResourceView = Readonly<{
	filterResourceIds?: readonly string[];
	groupByResource?: boolean;
	workloadHeight?: number;
}>;

export type GanttSchedulePropagation = 'manual' | 'move-successors' | 'auto';

export type GanttScheduleOptions = Readonly<{
	/** Calendar used when a task has no override. */
	calendarId?: string;
	/** Half-open navigation and mutation boundary. */
	validRange?: GanttRange;
	/** Successor propagation policy. Defaults to `manual`. */
	propagation?: GanttSchedulePropagation;
}>;

export type GanttScaleOption = GanttZoomLevel | GanttScaleDefinition;

export type GanttTimelineOptions = Readonly<{
	/** Ordered enabled built-in scale IDs and custom scale definitions. */
	scales?: readonly GanttScaleOption[];
	/** Shows the current-instant line. Defaults to `true`. */
	todayIndicator?: boolean;
	/** Highlights configured weekend weekdays. Defaults to `true`. */
	weekends?: boolean;
	/** Project holidays rendered independently of calendar exceptions. */
	holidays?: readonly GanttHoliday[];
	/** Fixed move, resize, and range granularity; otherwise follows the active scale. */
	snapDuration?: GanttDuration;
	/** Schedule diagnostics and project-element visibility. */
	display?: Partial<GanttDisplayOptions>;
	/** Resource filtering, grouping, and workload geometry. */
	resourceView?: GanttResourceView;
}>;

export type GanttGridOptions<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>,
	TAssignmentFields extends object = Record<never, never>
> = Readonly<{
	/** Ordered built-in and custom tree columns. */
	columns?: readonly GanttColumnDefinition<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>[];
}>;

export type GanttLayoutOptions<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>,
	TAssignmentFields extends object = Record<never, never>
> = Readonly<{
	/** Shared logical row height in pixels. Density supplies the default. */
	rowHeight?: number;
	/** Internal or page scrolling. Defaults to `contained`. */
	scrollMode?: GanttScrollMode;
	/** Tree-grid configuration; `false` renders the timeline only. */
	grid?:
		false | GanttGridOptions<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
}>;

export type GanttInteractionOptions<TDependencyFields extends object = Record<never, never>> =
	Readonly<{
		moveTask?: boolean;
		resizeStart?: boolean;
		resizeEnd?: boolean;
		resizeProgress?: boolean;
		reorderRows?: boolean;
		indent?: boolean;
		outdent?: boolean;
		createRange?: boolean;
		keyboard?: boolean;
		touch?: boolean;
		/** Dependency-creation capability; omitted or false hides its affordances. */
		dependencyCreation?:
			| false
			| Readonly<{
					create: (request: GanttDependencyCreationRequest) => GanttDependency<TDependencyFields>;
			  }>;
		/** Clipboard capability; `getId` is required for paste. */
		clipboard?: false | Readonly<{ getId?: (request: GanttPasteIdRequest) => string }>;
		/** Immutable undo/redo history; defaults to 50 entries. */
		history?: false | Readonly<{ limit?: number }>;
	}>;

export type GanttMutationPolicy<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>,
	TAssignmentFields extends object = Record<never, never>
> = Readonly<{
	task?: Readonly<{
		validate?: (proposal: GanttTaskProposal<TTaskFields>) => boolean;
		resolve?: (proposal: GanttTaskProposal<TTaskFields>) => GanttTaskUpdateResult<TTaskFields>;
		/** Called after the task collection commits with its guarded transaction. */
		onTasksChange?: (change: GanttTasksChange<TTaskFields>) => void;
	}>;
	dependency?: Readonly<{
		validate?: (proposal: GanttDependencyProposal<TDependencyFields>) => boolean;
		resolve?: (
			proposal: GanttDependencyProposal<TDependencyFields>
		) => GanttDependencyUpdateResult<TDependencyFields>;
		/** Called after the dependency collection commits with its guarded transaction. */
		onDependenciesChange?: (change: GanttDependenciesChange<TDependencyFields>) => void;
	}>;
	assignment?: Readonly<{
		validate?: (proposal: GanttAssignmentProposal<TAssignmentFields>) => boolean;
		resolve?: (
			proposal: GanttAssignmentProposal<TAssignmentFields>
		) => GanttAssignmentUpdateResult<TAssignmentFields>;
		/** Called after the assignment collection commits with its guarded transaction. */
		onAssignmentsChange?: (change: GanttAssignmentsChange<TAssignmentFields>) => void;
	}>;
	range?: Readonly<{
		validate?: (proposal: GanttRangeProposal) => boolean;
	}>;
}>;

export type GanttSnapshot<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	tasks: readonly GanttTask<TTaskFields>[];
	dependencies: readonly GanttDependency<TDependencyFields>[];
	resources: readonly GanttResource<TResourceFields>[];
	assignments: readonly GanttAssignment<TAssignmentFields>[];
	resolvedTasks: readonly GanttResolvedTaskNode<TTaskFields>[];
	expandedTaskIds: readonly string[];
	selection: GanttSelection;
	zoom: GanttZoomLevel;
	visibleRange: GanttRange;
	loading: boolean;
	disabled: boolean;
	api: GanttChartApi<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
}>;

export type GanttHeaderPayload<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<
	GanttSnapshot<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> & {
		zoomOut: Snippet;
		zoomIn: Snippet;
		fitProject: Snippet;
		today: Snippet;
		zoomControl: Snippet;
		actions: Snippet;
	}
>;

export type GanttGridHeaderPayload<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	columns: readonly GanttColumnDefinition<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>[];
	defaultContent: Snippet;
}>;

export type GanttColumnHeaderPayload<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	column: GanttColumnDefinition<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	defaultLabel: string;
	defaultContent: Snippet;
}>;

export type GanttTreeCellPayload<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	column: GanttColumnDefinition<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	value: unknown;
	isSelected: boolean;
	isFocused: boolean;
	isEditing: boolean;
	defaultContent: Snippet;
}>;

export type GanttTaskRowPayload<TTaskFields extends object> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	isSelected: boolean;
	isFocused: boolean;
	defaultContent: Snippet;
}>;

export type GanttTimeHeaderPayload = Readonly<{
	cell: GanttScaleCell;
	level: 'upper' | 'lower';
	defaultLabel: string;
	defaultContent: Snippet;
}>;

export type GanttTaskPayload<
	TTaskFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	geometry: GanttTaskGeometry;
	assignments: readonly GanttAssignment<TAssignmentFields>[];
	isSelected: boolean;
	isFocused: boolean;
	isDragging: boolean;
	isCritical: boolean;
	defaultContent: Snippet;
}>;

export type GanttTaskLabelPayload<TTaskFields extends object> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	geometry: GanttTaskGeometry;
	defaultLabel: string;
	defaultContent: Snippet;
}>;

export type GanttTaskTooltipPayload<
	TTaskFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	resources: readonly GanttResource<TResourceFields>[];
	assignments: readonly GanttAssignment<TAssignmentFields>[];
	defaultAccessibleLabel: string;
	defaultContent: Snippet;
}>;

export type GanttDependencyTooltipPayload<
	TTaskFields extends object,
	TDependencyFields extends object
> = Readonly<{
	dependency: GanttResolvedDependency<TTaskFields, TDependencyFields>;
	geometry: GanttDependencyGeometry;
	defaultAccessibleLabel: string;
	defaultContent: Snippet;
}>;

export type GanttProgressPayload<TTaskFields extends object> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	progress: number;
	expectedProgress: number | null;
	defaultContent: Snippet;
}>;

export type GanttBaselinePayload<TTaskFields extends object> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	range: GanttRange;
	geometry: GanttTaskGeometry;
	defaultContent: Snippet;
}>;

export type GanttDeadlinePayload<TTaskFields extends object> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	deadline: Date;
	left: number;
	defaultContent: Snippet;
}>;

export type GanttNonWorkingTimePayload = Readonly<{
	range: GanttRange;
	left: number;
	width: number;
	isWeekend: boolean;
	holiday: GanttHoliday | null;
	defaultContent: Snippet;
}>;

export type GanttResourceAssignmentsPayload<
	TTaskFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = Readonly<{
	node: GanttResolvedTaskNode<TTaskFields>;
	resources: readonly GanttResource<TResourceFields>[];
	assignments: readonly GanttAssignment<TAssignmentFields>[];
	isOverAllocated: boolean;
	defaultContent: Snippet;
}>;

export type GanttWorkloadCellPayload<TResourceFields extends object> = Readonly<{
	resource: GanttResource<TResourceFields>;
	bucket: GanttWorkloadBucket;
	defaultContent: Snippet;
}>;

export type GanttDragPreviewPayload<TTaskFields extends object> = Readonly<{
	proposal: GanttTaskProposal<TTaskFields> | GanttRangeProposal;
	geometry: GanttTaskGeometry | null;
	isValid: boolean;
	invalidReason: string | null;
	defaultContent: Snippet;
}>;

export type GanttEmptyPayload = Readonly<{
	visibleRange: GanttRange;
	zoom: GanttZoomLevel;
	defaultContent: Snippet;
}>;

export type GanttLoadingPayload = Readonly<{
	visibleRange: GanttRange;
	zoom: GanttZoomLevel;
	defaultContent: Snippet;
}>;

export type GanttRenderers<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>,
	TAssignmentFields extends object = Record<never, never>
> = Readonly<{
	/** Replaces the built-in header; `false` removes it. */
	header?:
		| Snippet<
				[GanttHeaderPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>]
		  >
		| false;
	actions?: Snippet<
		[GanttSnapshot<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>]
	>;
	gridHeader?: Snippet<
		[GanttGridHeaderPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>]
	>;
	columnHeader?: Snippet<
		[GanttColumnHeaderPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>]
	>;
	treeCell?: Snippet<
		[GanttTreeCellPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>]
	>;
	taskRow?: Snippet<[GanttTaskRowPayload<TTaskFields>]>;
	timeHeader?: Snippet<[GanttTimeHeaderPayload]>;
	task?: Snippet<[GanttTaskPayload<TTaskFields, TAssignmentFields>]>;
	taskLabel?: Snippet<[GanttTaskLabelPayload<TTaskFields>]>;
	taskTooltip?: Snippet<[GanttTaskTooltipPayload<TTaskFields, TResourceFields, TAssignmentFields>]>;
	dependencyTooltip?: Snippet<[GanttDependencyTooltipPayload<TTaskFields, TDependencyFields>]>;
	progress?: Snippet<[GanttProgressPayload<TTaskFields>]>;
	baseline?: Snippet<[GanttBaselinePayload<TTaskFields>]>;
	deadline?: Snippet<[GanttDeadlinePayload<TTaskFields>]>;
	nonWorkingTime?: Snippet<[GanttNonWorkingTimePayload]>;
	resourceAssignments?: Snippet<
		[GanttResourceAssignmentsPayload<TTaskFields, TResourceFields, TAssignmentFields>]
	>;
	workloadCell?: Snippet<[GanttWorkloadCellPayload<TResourceFields>]>;
	dragPreview?: Snippet<[GanttDragPreviewPayload<TTaskFields>]>;
	empty?: Snippet<[GanttEmptyPayload]>;
	loadingContent?: Snippet<[GanttLoadingPayload]>;
}>;

export type GanttEventHandlers<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>
> = Readonly<{
	onSelectionChange?: (selection: GanttSelection) => void;
	onExpansionChange?: (expandedTaskIds: string[]) => void;
	onZoomChange?: (zoom: GanttZoomLevel) => void;
	onVisibleRangeChange?: (info: GanttVisibleRangeInfo) => void;
	onTaskClick?: (payload: GanttTaskClickPayload<TTaskFields>) => void;
	onTaskDoubleClick?: (payload: GanttTaskClickPayload<TTaskFields>) => void;
	onDependencyClick?: (
		payload: GanttDependencyClickPayload<TTaskFields, TDependencyFields>
	) => void;
	onEmptyRangeSelect?: (proposal: GanttRangeProposal) => void;
	onInteractionBlocked?: (info: GanttInteractionBlockedInfo) => void;
	onScheduleViolations?: (payload: GanttScheduleViolationsPayload) => void;
}>;

/** Task and native pointer event reported by task click callbacks. */
export type GanttTaskClickPayload<TTaskFields extends object = Record<never, never>> = Readonly<{
	task: GanttResolvedTaskNode<TTaskFields>;
	event: MouseEvent;
}>;

/** Dependency and native pointer event reported by dependency click callbacks. */
export type GanttDependencyClickPayload<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>
> = Readonly<{
	dependency: GanttResolvedDependency<TTaskFields, TDependencyFields>;
	event: MouseEvent;
}>;

/** Constraint violations and the mutation boundary that reported them. */
export type GanttScheduleViolationsPayload = Readonly<{
	violations: readonly GanttConstraintViolation[];
	source: 'validation' | 'task-change' | 'dependency-change' | 'calendar-change';
}>;

type GanttOwnProps<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = {
	/** Bindable immutable task definitions. Defaults to `[]`. */
	tasks?: GanttTask<TTaskFields>[];
	/** Bindable immutable dependency definitions. Defaults to `[]`. */
	dependencies?: GanttDependency<TDependencyFields>[];
	/** Immutable resource definitions. Defaults to `[]`. */
	resources?: GanttResource<TResourceFields>[];
	/** Bindable immutable assignment definitions. Defaults to `[]`. */
	assignments?: GanttAssignment<TAssignmentFields>[];
	/** Immutable explicit-zone working calendars. Defaults to the built-in all-time project calendar. */
	calendars?: GanttCalendar[];
	/** Bindable ordered unique expanded summary IDs. Defaults to summary definitions with `expanded` omitted, initially expanded. */
	expandedTaskIds?: string[];
	/** Bindable task, dependency, tree-cell, or empty selection. */
	selection?: GanttSelection;
	/** Bindable active built-in or custom zoom level. Defaults to `week`. */
	zoom?: GanttZoomLevel;
	/** Required IANA display time zone or `UTC`. */
	timeZone: string;
	/** Per-instance Svelai message overrides. */
	i18n?: Partial<Messages>;
	/** Typography, controls, and task geometry scale. Defaults to `normal`. */
	size?: Sizes;
	/** Row, header, padding, gap, and indentation density. Defaults to `normal`. */
	density?: Density;
	/** Root classes; contained scrolling requires an explicit height. */
	class?: string;
	/** Bindable root element reference. */
	ref?: HTMLElement | null;
	/** Per-instance stable-part theme overrides. */
	theme?: GanttChartThemeProps;
	/** Blocks content mutation while preserving safe navigation. */
	loading?: boolean;
	/** Disables navigation, selection, and mutation. */
	disabled?: boolean;
	/** Bindable initial/current grid width in pixels. */
	gridWidth?: number;
	/** Project scheduling and successor propagation policy. */
	schedule?: GanttScheduleOptions;
	/** Time-axis scales, snapping, decoration, and resource analysis. */
	timeline?: GanttTimelineOptions;
	/** Split-shell and tree-grid layout. */
	layout?: GanttLayoutOptions<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	/** Fine-grained interaction capabilities and materialization hooks. */
	interactions?: GanttInteractionOptions<TDependencyFields>;
	/** Proposal validation, adjustment, and immutable change notifications. */
	mutations?: GanttMutationPolicy<TTaskFields, TDependencyFields, TAssignmentFields>;
	/** View and activation notifications. */
	events?: GanttEventHandlers<TTaskFields, TDependencyFields>;
	/** Semantic content customization inside component-owned behavior. */
	render?: GanttRenderers<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
};

export type GanttChartProps<
	TTaskFields extends object = Record<never, never>,
	TDependencyFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>,
	TAssignmentFields extends object = Record<never, never>
> = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color' | 'dir'> &
		GanttOwnProps<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>
>;
