import { GanttChartError } from './ganttChart.error.js';
import { moveGanttDependentTasks } from './ganttChart.dependencies.js';
import type {
	GanttHistoryDirection,
	GanttModelCommit,
	GanttModelSnapshot
} from './ganttChart.history.svelte.js';
import type { GanttPasteRecords } from './ganttChart.clipboard.js';
import {
	cloneGanttAssignment,
	cloneGanttDependency,
	cloneGanttSelection,
	cloneGanttTask,
	isSameGanttSelection
} from './ganttChart.records.js';
import { getGanttValueSignature } from './ganttChart.signature.js';
import { getGanttTaskSubtreeIds } from './ganttChart.subtree.js';
import { resolveGanttRowDrop, type GanttRowDropTarget } from './ganttChart.rowDrop.js';
import { resolveGanttSchedule, type ResolvedGanttSchedule } from './ganttChart.schedule.js';
import type { GanttChartState, GanttModelBoundary } from './ganttChart.state.svelte.js';
import type {
	GanttAssignment,
	GanttAssignmentMutationKind,
	GanttAssignmentProposal,
	GanttDependency,
	GanttDependencyMutationKind,
	GanttDependencyProposal,
	GanttMutationSource,
	GanttSelection,
	GanttTask,
	GanttTaskMutationKind,
	GanttTaskProposal
} from './ganttChart.types.js';

type Schedule<TTaskFields extends object, TDependencyFields extends object> = Pick<
	ResolvedGanttSchedule<TTaskFields, TDependencyFields, object, object>,
	'model' | 'autoScheduledTaskIds' | 'analysis'
>;

type MutationBoundary<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> = GanttModelBoundary<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> &
	Readonly<{
		modelBoundary: GanttModelBoundary<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
		timeZone: string;
		projectCalendarId: string | undefined;
		selection: GanttSelection;
	}>;

export class GanttChartMutations<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> {
	constructor(
		private readonly chart: GanttChartState<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>,
		private readonly onCommit?: (
			commit: GanttModelCommit<TTaskFields, TDependencyFields, TAssignmentFields>
		) => (() => void) | undefined
	) {}

	addTask(task: GanttTask<TTaskFields>, source: GanttMutationSource): boolean {
		this.assertMutationEnabled();
		const nextTask = cloneGanttTask(task);
		return this.commitTaskMutation({
			kind: 'add',
			source,
			previousTask: null,
			task: nextTask,
			candidateTasks: [...this.chart.tasks, nextTask]
		});
	}

	updateTask(task: GanttTask<TTaskFields>, source: GanttMutationSource): boolean {
		return this.updateTaskWithKind(task, 'update', source);
	}

	updateTaskWithKind(
		task: GanttTask<TTaskFields>,
		kind: Exclude<GanttTaskMutationKind, 'add' | 'remove' | 'paste'>,
		source: GanttMutationSource,
		expectedTasks: readonly GanttTask<TTaskFields>[] = this.chart.tasks
	): boolean {
		this.assertMutationEnabled();
		this.assertExpectedTasks(expectedTasks);
		const previousTask = this.requireTask(task.id);
		this.assertTaskWritable(previousTask);
		const nextTask = cloneGanttTask(task);
		return this.commitTaskMutation({
			kind,
			source,
			previousTask,
			task: nextTask,
			candidateTasks: replaceById(expectedTasks, nextTask),
			expectedTasks
		});
	}

	removeTask(taskId: string, source: GanttMutationSource): boolean {
		this.assertMutationEnabled();
		const previousTask = this.requireTask(taskId);
		this.assertTaskWritable(previousTask);
		const removedTaskIds = getGanttTaskSubtreeIds(taskId, this.chart.tasks);
		return this.commitModelMutation({
			source,
			tasks: this.chart.tasks.filter((task) => !removedTaskIds.has(task.id)),
			dependencies: this.chart.dependencies.filter(
				(dependency) =>
					!removedTaskIds.has(dependency.fromTaskId) && !removedTaskIds.has(dependency.toTaskId)
			),
			assignments: this.chart.assignments.filter(
				(assignment) => !removedTaskIds.has(assignment.taskId)
			),
			selection: this.chart.selection,
			title: previousTask.title,
			preferredTaskKind: 'remove',
			preferredDependencyKind: 'remove',
			preferredAssignmentKind: 'remove'
		});
	}

	reorderTask(
		target: GanttRowDropTarget,
		source: Extract<GanttMutationSource, 'pointer' | 'keyboard'> = 'pointer'
	): boolean {
		this.assertMutationEnabled();
		const previousTask = this.requireTask(target.taskId);
		this.requireTask(target.targetTaskId);
		this.assertTaskWritable(previousTask);
		const model = this.chart.schedule.model;
		const proposal = resolveGanttRowDrop(target, this.chart.schedule.resolvedTasksById);
		if (!proposal) return false;
		const task = cloneTaskWithParent(previousTask, proposal.parentId ?? undefined);
		const orderedTasks = model.taskHierarchy.nodes.map((node) => this.requireTask(node.id));
		const movedTaskIds = getGanttTaskSubtreeIds(target.taskId, orderedTasks);
		const movedTasks = orderedTasks
			.filter((candidate) => movedTaskIds.has(candidate.id))
			.map((candidate) => (candidate.id === task.id ? task : candidate));
		const remainingTasks = orderedTasks.filter((candidate) => !movedTaskIds.has(candidate.id));
		const targetIndex = remainingTasks.findIndex(
			(candidate) => candidate.id === target.targetTaskId
		);
		let insertIndex = targetIndex;
		if (proposal.parentId === target.targetTaskId) {
			insertIndex += 1;
		} else if (target.position === 'after') {
			const targetSubtreeIds = getGanttTaskSubtreeIds(target.targetTaskId, remainingTasks);
			insertIndex += 1;
			while (
				insertIndex < remainingTasks.length &&
				targetSubtreeIds.has(remainingTasks[insertIndex].id)
			) {
				insertIndex += 1;
			}
		}
		const candidateTasks = [...remainingTasks];
		candidateTasks.splice(insertIndex, 0, ...movedTasks);
		return this.commitTaskMutation({
			kind: 'reorder',
			source,
			previousTask,
			task,
			candidateTasks
		});
	}

	indentTask(
		taskId: string,
		previousTaskId: string,
		source: GanttMutationSource = 'keyboard'
	): boolean {
		this.assertMutationEnabled();
		const previousTask = this.requireTask(taskId);
		const parentTask = this.requireTask(previousTaskId);
		this.assertTaskWritable(previousTask);
		if (
			(previousTask.parentId ?? null) !== (parentTask.parentId ?? null) ||
			parentTask.type !== 'summary'
		) {
			return false;
		}
		const task = cloneTaskWithParent(previousTask, parentTask.id);
		return this.commitTaskMutation({
			kind: 'indent',
			source,
			previousTask,
			task,
			candidateTasks: replaceById(this.chart.tasks, task)
		});
	}

	outdentTask(taskId: string, source: GanttMutationSource = 'keyboard'): boolean {
		this.assertMutationEnabled();
		const previousTask = this.requireTask(taskId);
		this.assertTaskWritable(previousTask);
		if (!previousTask.parentId) return false;
		const parentTask = this.requireTask(previousTask.parentId);
		const task = cloneTaskWithParent(previousTask, parentTask.parentId);
		return this.commitTaskMutation({
			kind: 'outdent',
			source,
			previousTask,
			task,
			candidateTasks: replaceById(this.chart.tasks, task)
		});
	}

	addDependency(
		dependency: GanttDependency<TDependencyFields>,
		source: GanttMutationSource,
		select = false
	): boolean {
		this.assertMutationEnabled();
		const nextDependency = cloneGanttDependency(dependency);
		return this.commitDependencyMutation({
			kind: 'add',
			source,
			previousDependency: null,
			dependency: nextDependency,
			candidateDependencies: [...this.chart.dependencies, nextDependency],
			select
		});
	}

	updateDependency(
		dependency: GanttDependency<TDependencyFields>,
		source: GanttMutationSource
	): boolean {
		this.assertMutationEnabled();
		const previousDependency = this.requireDependency(dependency.id);
		this.assertDependencyWritable(previousDependency);
		const nextDependency = cloneGanttDependency(dependency);
		return this.commitDependencyMutation({
			kind: 'update',
			source,
			previousDependency,
			dependency: nextDependency,
			candidateDependencies: replaceById(this.chart.dependencies, nextDependency)
		});
	}

	removeDependency(dependencyId: string, source: GanttMutationSource): boolean {
		this.assertMutationEnabled();
		const previousDependency = this.requireDependency(dependencyId);
		this.assertDependencyWritable(previousDependency);
		return this.commitDependencyMutation({
			kind: 'remove',
			source,
			previousDependency,
			dependency: null,
			candidateDependencies: this.chart.dependencies.filter(
				(dependency) => dependency.id !== dependencyId
			)
		});
	}

	addAssignment(
		assignment: GanttAssignment<TAssignmentFields>,
		source: GanttMutationSource
	): boolean {
		this.assertMutationEnabled();
		const nextAssignment = cloneGanttAssignment(assignment);
		return this.commitAssignmentMutation({
			kind: 'add',
			source,
			previousAssignment: null,
			assignment: nextAssignment,
			candidateAssignments: [...this.chart.assignments, nextAssignment]
		});
	}

	updateAssignment(
		assignment: GanttAssignment<TAssignmentFields>,
		source: GanttMutationSource
	): boolean {
		this.assertMutationEnabled();
		const previousAssignment = this.requireAssignment(assignment.id);
		const nextAssignment = cloneGanttAssignment(assignment);
		return this.commitAssignmentMutation({
			kind: 'update',
			source,
			previousAssignment,
			assignment: nextAssignment,
			candidateAssignments: replaceById(this.chart.assignments, nextAssignment)
		});
	}

	removeAssignment(assignmentId: string, source: GanttMutationSource): boolean {
		this.assertMutationEnabled();
		const previousAssignment = this.requireAssignment(assignmentId);
		return this.commitAssignmentMutation({
			kind: 'remove',
			source,
			previousAssignment,
			assignment: null,
			candidateAssignments: this.chart.assignments.filter(
				(assignment) => assignment.id !== assignmentId
			)
		});
	}

	pasteSubtree(
		records: GanttPasteRecords<TTaskFields, TDependencyFields, TAssignmentFields>
	): boolean {
		this.assertMutationEnabled();
		const rootTask = records.tasks.find((task) => task.id === records.rootTaskId);
		if (!rootTask) {
			throw new GanttChartError('clipboard-invalid', 'The pasted subtree lost its root task.');
		}
		return this.commitModelMutation({
			source: 'clipboard',
			tasks: [...this.chart.tasks, ...records.tasks],
			dependencies: [...this.chart.dependencies, ...records.dependencies],
			assignments: [...this.chart.assignments, ...records.assignments],
			selection: {
				kind: 'task',
				taskId: records.rootTaskId,
				dependencyId: null,
				cell: null
			},
			title: rootTask.title,
			preferredTaskKind: 'paste',
			preferredDependencyKind: records.dependencies.length > 0 ? 'add' : undefined,
			preferredAssignmentKind: records.assignments.length > 0 ? 'add' : undefined
		});
	}

	restoreSnapshot(
		target: GanttModelSnapshot<TTaskFields, TDependencyFields, TAssignmentFields>,
		commit: GanttModelCommit<TTaskFields, TDependencyFields, TAssignmentFields>,
		direction: GanttHistoryDirection
	): boolean {
		this.assertMutationEnabled();
		return this.commitModelMutation({
			source: 'history',
			tasks: [...target.tasks],
			dependencies: [...target.dependencies],
			assignments: [...target.assignments],
			selection: target.selection,
			title: commit.title,
			preferredTaskKind: direction === 'redo' && commit.taskKind === 'paste' ? 'paste' : undefined,
			preferredDependencyKind: commit.dependencyKind,
			preferredAssignmentKind: commit.assignmentKind,
			historyDirection: direction
		});
	}

	private commitModelMutation(input: {
		source: GanttMutationSource;
		tasks: readonly GanttTask<TTaskFields>[];
		dependencies: readonly GanttDependency<TDependencyFields>[];
		assignments: readonly GanttAssignment<TAssignmentFields>[];
		selection: GanttSelection;
		title: string;
		preferredTaskKind?: GanttTaskMutationKind;
		preferredDependencyKind?: GanttDependencyMutationKind;
		preferredAssignmentKind?: GanttAssignmentMutationKind;
		historyDirection?: GanttHistoryDirection;
	}): boolean {
		const boundary = this.getBoundary();
		let candidateTasks = input.tasks.map(cloneGanttTask);
		let candidateDependencies = input.dependencies.map(cloneGanttDependency);
		let candidateAssignments = input.assignments.map(cloneGanttAssignment);
		const shouldAutoSchedule = input.source !== 'history' && this.chart.autoSchedule;

		const taskPolicy = this.applyTaskPolicies({
			before: boundary.tasks,
			after: candidateTasks,
			dependencies: candidateDependencies,
			assignments: candidateAssignments,
			source: input.source,
			preferredKind: input.preferredTaskKind,
			autoSchedule: shouldAutoSchedule,
			boundary
		});
		if (!taskPolicy) return false;
		candidateTasks = taskPolicy.tasks;

		const dependencyPolicy = this.applyDependencyPolicies({
			before: boundary.dependencies,
			after: candidateDependencies,
			tasks: candidateTasks,
			assignments: candidateAssignments,
			schedule: taskPolicy.schedule,
			source: input.source,
			autoSchedule: shouldAutoSchedule,
			boundary
		});
		if (!dependencyPolicy) return false;
		candidateDependencies = dependencyPolicy.dependencies;
		candidateTasks = dependencyPolicy.schedule.model.tasks.map(cloneGanttTask);

		const assignmentPolicy = this.applyAssignmentPolicies({
			before: boundary.assignments,
			after: candidateAssignments,
			tasks: candidateTasks,
			dependencies: candidateDependencies,
			schedule: dependencyPolicy.schedule,
			source: input.source,
			autoSchedule: shouldAutoSchedule,
			boundary
		});
		if (!assignmentPolicy) return false;
		candidateAssignments = assignmentPolicy.assignments;
		const schedule = assignmentPolicy.schedule;
		candidateTasks = schedule.model.tasks.map(cloneGanttTask);

		this.assertBoundary(boundary);
		const taskIds = getChangedRecordIds(boundary.tasks, candidateTasks);
		const dependencyIds = getChangedRecordIds(boundary.dependencies, candidateDependencies);
		const assignmentIds = getChangedRecordIds(boundary.assignments, candidateAssignments);
		const previousSelection = boundary.selection;
		const nextSelection = normalizeModelSelection(
			input.selection,
			candidateTasks,
			candidateDependencies
		);
		const committedTasks = candidateTasks.map(cloneGanttTask);
		const committedDependencies = candidateDependencies.map(cloneGanttDependency);
		const committedAssignments = candidateAssignments.map(cloneGanttAssignment);
		this.chart.tasks = committedTasks;
		this.chart.dependencies = committedDependencies;
		this.chart.assignments = committedAssignments;
		this.chart.selection = nextSelection;
		let wasReverted = false;
		const committedRevert: { run?: () => void } = {};
		const revert = createGuardedRevert(
			() =>
				this.chart.tasks === committedTasks &&
				this.chart.dependencies === committedDependencies &&
				this.chart.assignments === committedAssignments,
			() => {
				wasReverted = true;
				this.chart.tasks = boundary.tasks;
				this.chart.dependencies = boundary.dependencies;
				this.chart.assignments = boundary.assignments;
				this.chart.selection = previousSelection;
				this.chart.eventHandlers?.onSelectionChange?.(previousSelection);
			},
			() => committedRevert.run?.()
		);
		if (!isSameGanttSelection(previousSelection, nextSelection)) {
			this.chart.eventHandlers?.onSelectionChange?.(nextSelection);
		}
		const taskChangeKind = getAggregateTaskKind(
			boundary.tasks,
			candidateTasks,
			input.preferredTaskKind
		);
		if (taskIds.length > 0 && taskChangeKind) {
			this.chart.mutationPolicy?.task?.onTasksChange?.({
				kind: taskChangeKind,
				source: input.source,
				previousTasks: boundary.tasks,
				tasks: committedTasks,
				affectedTaskIds: uniqueIds([...taskIds, ...schedule.autoScheduledTaskIds]),
				violations: schedule.analysis.violations,
				revert
			});
		}
		if (wasReverted) return false;
		const dependencyChangeKind = getAggregateRecordKind(
			boundary.dependencies,
			candidateDependencies,
			input.preferredDependencyKind
		);
		if (dependencyIds.length > 0 && dependencyChangeKind) {
			this.chart.mutationPolicy?.dependency?.onDependenciesChange?.({
				kind: dependencyChangeKind,
				source: input.source,
				previousDependencies: boundary.dependencies,
				dependencies: committedDependencies,
				affectedDependencyIds: dependencyIds,
				revert
			});
		}
		if (wasReverted) return false;
		const assignmentChangeKind = getAggregateRecordKind(
			boundary.assignments,
			candidateAssignments,
			input.preferredAssignmentKind
		);
		if (assignmentIds.length > 0 && assignmentChangeKind) {
			this.chart.mutationPolicy?.assignment?.onAssignmentsChange?.({
				kind: assignmentChangeKind,
				source: input.source,
				previousAssignments: boundary.assignments,
				assignments: committedAssignments,
				affectedAssignmentIds: assignmentIds,
				revert
			});
		}
		if (wasReverted) return false;
		if (taskIds.length > 0 || dependencyIds.length > 0) {
			this.chart.eventHandlers?.onScheduleViolations?.({
				violations: schedule.analysis.violations,
				source: dependencyIds.length > 0 ? 'dependency-change' : 'task-change'
			});
		}
		committedRevert.run = this.notifyCommit({
			before: boundary,
			after: this.getSnapshot(),
			source: input.source,
			title: input.title,
			...(taskChangeKind ? { taskKind: taskChangeKind } : {}),
			...(dependencyChangeKind ? { dependencyKind: dependencyChangeKind } : {}),
			...(assignmentChangeKind ? { assignmentKind: assignmentChangeKind } : {}),
			...(input.historyDirection ? { historyDirection: input.historyDirection } : {})
		});
		return true;
	}

	private applyTaskPolicies(input: {
		before: readonly GanttTask<TTaskFields>[];
		after: readonly GanttTask<TTaskFields>[];
		dependencies: readonly GanttDependency<TDependencyFields>[];
		assignments: readonly GanttAssignment<TAssignmentFields>[];
		source: GanttMutationSource;
		preferredKind?: GanttTaskMutationKind;
		autoSchedule: boolean;
		boundary: MutationBoundary<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	}): Readonly<{
		tasks: GanttTask<TTaskFields>[];
		schedule: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
	}> | null {
		let tasks = input.after.map(cloneGanttTask);
		let schedule = this.resolveSchedule(
			tasks,
			input.dependencies,
			input.assignments,
			input.autoSchedule
		);
		tasks = schedule.model.tasks.map(cloneGanttTask);
		for (const taskId of getChangedRecordIds(input.before, tasks)) {
			const previousTask = input.before.find((task) => task.id === taskId) ?? null;
			let task = tasks.find((candidate) => candidate.id === taskId) ?? null;
			if (previousTask && input.source !== 'history') this.assertTaskWritable(previousTask);
			const kind = resolveTaskProposalKind(previousTask, task, input.preferredKind);
			let proposal = this.createTaskProposal(
				{ kind, source: input.source, previousTask, task },
				schedule
			);
			if (this.chart.mutationPolicy?.task?.validate?.(proposal) === false) return null;
			this.assertBoundary(input.boundary);
			const decision = this.chart.mutationPolicy?.task?.resolve?.(proposal);
			this.assertBoundary(input.boundary);
			if (decision === false) return null;
			if (!decision || typeof decision !== 'object') continue;
			if (!task || decision.id !== task.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Task adjustments must preserve an existing proposed task id.'
				);
			}
			task = cloneGanttTask(decision);
			tasks = replaceById(tasks, task);
			schedule = this.resolveModelAdjustment(
				tasks,
				input.dependencies,
				input.assignments,
				input.autoSchedule
			);
			tasks = schedule.model.tasks.map(cloneGanttTask);
			const scheduledTask = tasks.find((candidate) => candidate.id === taskId) ?? task;
			proposal = this.createTaskProposal(
				{ kind, source: input.source, previousTask, task: scheduledTask },
				schedule
			);
			if (this.chart.mutationPolicy?.task?.validate?.(proposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onTaskUpdate returned an adjustment rejected by canUpdateTask.',
					{ taskId }
				);
			}
			this.assertBoundary(input.boundary);
		}
		return { tasks, schedule };
	}

	private applyDependencyPolicies(input: {
		before: readonly GanttDependency<TDependencyFields>[];
		after: readonly GanttDependency<TDependencyFields>[];
		tasks: readonly GanttTask<TTaskFields>[];
		assignments: readonly GanttAssignment<TAssignmentFields>[];
		schedule: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
		source: GanttMutationSource;
		autoSchedule: boolean;
		boundary: MutationBoundary<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	}): Readonly<{
		dependencies: GanttDependency<TDependencyFields>[];
		schedule: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
	}> | null {
		let dependencies = input.after.map(cloneGanttDependency);
		let schedule = input.schedule;
		let tasks = schedule.model.tasks.map(cloneGanttTask);
		for (const dependencyId of getChangedRecordIds(input.before, dependencies)) {
			const previousDependency =
				input.before.find((dependency) => dependency.id === dependencyId) ?? null;
			let dependency = dependencies.find((candidate) => candidate.id === dependencyId) ?? null;
			if (previousDependency && input.source !== 'history') {
				this.assertDependencyWritable(previousDependency);
			}
			const kind = resolveRecordProposalKind(previousDependency, dependency);
			let proposal = createDependencyProposal({
				kind,
				source: input.source,
				previousDependency,
				dependency
			});
			if (this.chart.mutationPolicy?.dependency?.validate?.(proposal) === false) return null;
			this.assertBoundary(input.boundary);
			const decision = this.chart.mutationPolicy?.dependency?.resolve?.(proposal);
			this.assertBoundary(input.boundary);
			if (decision === false) return null;
			if (!decision || typeof decision !== 'object') continue;
			if (!dependency || decision.id !== dependency.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Dependency adjustments must preserve an existing proposed dependency id.'
				);
			}
			dependency = cloneGanttDependency(decision);
			dependencies = replaceById(dependencies, dependency);
			schedule = this.resolveModelAdjustment(
				tasks,
				dependencies,
				input.assignments,
				input.autoSchedule
			);
			tasks = schedule.model.tasks.map(cloneGanttTask);
			proposal = createDependencyProposal({
				kind,
				source: input.source,
				previousDependency,
				dependency
			});
			if (this.chart.mutationPolicy?.dependency?.validate?.(proposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onDependencyUpdate returned an adjustment rejected by canUpdateDependency.',
					{ dependencyId }
				);
			}
			this.assertBoundary(input.boundary);
		}
		return { dependencies, schedule };
	}

	private applyAssignmentPolicies(input: {
		before: readonly GanttAssignment<TAssignmentFields>[];
		after: readonly GanttAssignment<TAssignmentFields>[];
		tasks: readonly GanttTask<TTaskFields>[];
		dependencies: readonly GanttDependency<TDependencyFields>[];
		schedule: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
		source: GanttMutationSource;
		autoSchedule: boolean;
		boundary: MutationBoundary<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
	}): Readonly<{
		assignments: GanttAssignment<TAssignmentFields>[];
		schedule: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
	}> | null {
		let assignments = input.after.map(cloneGanttAssignment);
		let schedule = input.schedule;
		for (const assignmentId of getChangedRecordIds(input.before, assignments)) {
			const previousAssignment =
				input.before.find((assignment) => assignment.id === assignmentId) ?? null;
			let assignment = assignments.find((candidate) => candidate.id === assignmentId) ?? null;
			const kind = resolveRecordProposalKind(previousAssignment, assignment);
			let proposal = createAssignmentProposal({
				kind,
				source: input.source,
				previousAssignment,
				assignment
			});
			if (input.source !== 'history') this.assertAssignmentMutationWritable(proposal);
			if (this.chart.mutationPolicy?.assignment?.validate?.(proposal) === false) return null;
			this.assertBoundary(input.boundary);
			const decision = this.chart.mutationPolicy?.assignment?.resolve?.(proposal);
			this.assertBoundary(input.boundary);
			if (decision === false) return null;
			if (!decision || typeof decision !== 'object') continue;
			if (!assignment || decision.id !== assignment.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Assignment adjustments must preserve an existing proposed assignment id.'
				);
			}
			assignment = cloneGanttAssignment(decision);
			assignments = replaceById(assignments, assignment);
			schedule = this.resolveModelAdjustment(
				input.tasks,
				input.dependencies,
				assignments,
				input.autoSchedule
			);
			proposal = createAssignmentProposal({
				kind,
				source: input.source,
				previousAssignment,
				assignment
			});
			if (input.source !== 'history') this.assertAssignmentMutationWritable(proposal);
			if (this.chart.mutationPolicy?.assignment?.validate?.(proposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onAssignmentUpdate returned an adjustment rejected by canUpdateAssignment.',
					{ assignmentId }
				);
			}
			this.assertBoundary(input.boundary);
		}
		return { assignments, schedule };
	}

	private commitTaskMutation(input: {
		kind: GanttTaskMutationKind;
		source: GanttMutationSource;
		previousTask: GanttTask<TTaskFields> | null;
		task: GanttTask<TTaskFields> | null;
		candidateTasks: GanttTask<TTaskFields>[];
		expectedTasks?: readonly GanttTask<TTaskFields>[];
	}): boolean {
		const boundary = this.getBoundary();
		if (input.expectedTasks) this.assertExpectedTasks(input.expectedTasks);
		let candidateTasks = input.candidateTasks;
		let schedule = this.resolveTaskMutationSchedule(input, candidateTasks, boundary.dependencies);
		const proposal = this.createTaskProposal(input, schedule);
		if (this.chart.mutationPolicy?.task?.validate?.(proposal) === false) return false;
		this.assertBoundary(boundary);
		const decision = this.chart.mutationPolicy?.task?.resolve?.(proposal);
		this.assertBoundary(boundary);
		if (decision === false) return false;
		if (decision && typeof decision === 'object') {
			if (!input.task || decision.id !== input.task.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Task adjustments must preserve the proposed task id.'
				);
			}
			const adjustedTask = cloneGanttTask(decision);
			candidateTasks = replaceById(candidateTasks, adjustedTask);
			schedule = this.resolveAdjustedTaskMutationSchedule(
				{ ...input, task: adjustedTask },
				candidateTasks,
				boundary.dependencies
			);
			const adjustedProposal = this.createTaskProposal({ ...input, task: adjustedTask }, schedule);
			if (this.chart.mutationPolicy?.task?.validate?.(adjustedProposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onTaskUpdate returned an adjustment rejected by canUpdateTask.',
					{ taskId: adjustedTask.id }
				);
			}
			this.assertBoundary(boundary);
		}
		this.assertBoundary(boundary);
		const publishedTasks = [...schedule.model.tasks];
		const previousTasks = boundary.tasks;
		this.chart.tasks = publishedTasks;
		const committedTasks = this.chart.tasks;
		let onCommittedRevert: (() => void) | undefined;
		const revert = createGuardedRevert(
			() => this.chart.tasks === committedTasks,
			() => {
				this.chart.tasks = previousTasks;
			},
			() => onCommittedRevert?.()
		);
		const affectedTaskIds = uniqueIds([
			...(input.task ? [input.task.id] : []),
			...(input.previousTask ? [input.previousTask.id] : []),
			...schedule.autoScheduledTaskIds
		]);
		this.chart.mutationPolicy?.task?.onTasksChange?.({
			kind: input.kind,
			source: input.source,
			previousTasks,
			tasks: committedTasks,
			affectedTaskIds,
			violations: schedule.analysis.violations,
			revert
		});
		this.chart.eventHandlers?.onScheduleViolations?.({
			violations: schedule.analysis.violations,
			source: 'task-change'
		});
		if (this.chart.tasks === committedTasks) {
			onCommittedRevert = this.notifyCommit({
				before: boundary,
				after: this.getSnapshot(),
				source: input.source,
				title: input.task?.title ?? input.previousTask?.title ?? 'task',
				taskKind: input.kind
			});
		}
		return true;
	}

	private commitDependencyMutation(input: {
		kind: GanttDependencyMutationKind;
		source: GanttMutationSource;
		previousDependency: GanttDependency<TDependencyFields> | null;
		dependency: GanttDependency<TDependencyFields> | null;
		candidateDependencies: GanttDependency<TDependencyFields>[];
		select?: boolean;
	}): boolean {
		const boundary = this.getBoundary();
		let candidateDependencies = input.candidateDependencies;
		let proposal = createDependencyProposal(input);
		if (this.chart.mutationPolicy?.dependency?.validate?.(proposal) === false) return false;
		this.assertBoundary(boundary);
		const decision = this.chart.mutationPolicy?.dependency?.resolve?.(proposal);
		this.assertBoundary(boundary);
		if (decision === false) return false;
		if (decision && typeof decision === 'object') {
			if (!input.dependency || decision.id !== input.dependency.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Dependency adjustments must preserve the proposed dependency id.'
				);
			}
			const adjustedDependency = cloneGanttDependency(decision);
			candidateDependencies = replaceById(candidateDependencies, adjustedDependency);
			proposal = createDependencyProposal({ ...input, dependency: adjustedDependency });
			if (this.chart.mutationPolicy?.dependency?.validate?.(proposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onDependencyUpdate returned an adjustment rejected by canUpdateDependency.',
					{ dependencyId: adjustedDependency.id }
				);
			}
			this.assertBoundary(boundary);
		}
		const schedule = this.resolveAdjustedSchedule(boundary.tasks, candidateDependencies);
		this.assertBoundary(boundary);
		const previousTasks = boundary.tasks;
		const previousDependencies = boundary.dependencies;
		const previousSelection = boundary.selection;
		const publishedTasks = [...schedule.model.tasks];
		const publishedDependencies = [...candidateDependencies];
		this.chart.tasks = publishedTasks;
		this.chart.dependencies = publishedDependencies;
		const committedSelection =
			input.select && proposal.dependency
				? {
						kind: 'dependency' as const,
						taskId: null,
						dependencyId: proposal.dependency.id,
						cell: null
					}
				: null;
		if (committedSelection) this.chart.selection = committedSelection;
		const committedTasks = this.chart.tasks;
		const committedDependencies = this.chart.dependencies;
		let onCommittedRevert: (() => void) | undefined;
		const revert = createGuardedRevert(
			() =>
				this.chart.tasks === committedTasks && this.chart.dependencies === committedDependencies,
			() => {
				this.chart.tasks = previousTasks;
				this.chart.dependencies = previousDependencies;
				if (
					committedSelection &&
					this.chart.selection.kind === 'dependency' &&
					this.chart.selection.dependencyId === committedSelection.dependencyId
				) {
					this.chart.selection = previousSelection;
					this.chart.eventHandlers?.onSelectionChange?.(previousSelection);
				}
			},
			() => onCommittedRevert?.()
		);
		if (committedSelection) this.chart.eventHandlers?.onSelectionChange?.(committedSelection);
		if (schedule.autoScheduledTaskIds.length > 0) {
			this.chart.mutationPolicy?.task?.onTasksChange?.({
				kind: 'schedule',
				source: input.source,
				previousTasks,
				tasks: committedTasks,
				affectedTaskIds: schedule.autoScheduledTaskIds,
				violations: schedule.analysis.violations,
				revert
			});
		}
		this.chart.mutationPolicy?.dependency?.onDependenciesChange?.({
			kind: input.kind,
			source: input.source,
			previousDependencies,
			dependencies: committedDependencies,
			affectedDependencyIds: uniqueIds([
				...(proposal.dependency ? [proposal.dependency.id] : []),
				...(proposal.previousDependency ? [proposal.previousDependency.id] : [])
			]),
			revert
		});
		this.chart.eventHandlers?.onScheduleViolations?.({
			violations: schedule.analysis.violations,
			source: 'dependency-change'
		});
		if (this.chart.tasks === committedTasks && this.chart.dependencies === committedDependencies) {
			onCommittedRevert = this.notifyCommit({
				before: boundary,
				after: this.getSnapshot(),
				source: input.source,
				title: proposal.dependency?.id ?? proposal.previousDependency?.id ?? 'dependency',
				taskKind: schedule.autoScheduledTaskIds.length > 0 ? 'schedule' : undefined,
				dependencyKind: input.kind
			});
		}
		return true;
	}

	private commitAssignmentMutation(input: {
		kind: GanttAssignmentMutationKind;
		source: GanttMutationSource;
		previousAssignment: GanttAssignment<TAssignmentFields> | null;
		assignment: GanttAssignment<TAssignmentFields> | null;
		candidateAssignments: GanttAssignment<TAssignmentFields>[];
	}): boolean {
		const boundary = this.getBoundary();
		let candidateAssignments = input.candidateAssignments;
		let proposal = createAssignmentProposal(input);
		this.resolveSchedule(boundary.tasks, boundary.dependencies, candidateAssignments);
		this.assertAssignmentMutationWritable(proposal);
		if (this.chart.mutationPolicy?.assignment?.validate?.(proposal) === false) return false;
		this.assertBoundary(boundary);
		const decision = this.chart.mutationPolicy?.assignment?.resolve?.(proposal);
		this.assertBoundary(boundary);
		if (decision === false) return false;
		if (decision && typeof decision === 'object') {
			if (!input.assignment || decision.id !== input.assignment.id) {
				throw new GanttChartError(
					'invalid-adjustment',
					'Assignment adjustments must preserve the proposed assignment id.'
				);
			}
			const adjustedAssignment = cloneGanttAssignment(decision);
			candidateAssignments = replaceById(candidateAssignments, adjustedAssignment);
			proposal = createAssignmentProposal({ ...input, assignment: adjustedAssignment });
			this.resolveSchedule(boundary.tasks, boundary.dependencies, candidateAssignments);
			this.assertAssignmentMutationWritable(proposal);
			if (this.chart.mutationPolicy?.assignment?.validate?.(proposal) === false) {
				throw new GanttChartError(
					'invalid-adjustment',
					'onAssignmentUpdate returned an adjustment rejected by canUpdateAssignment.',
					{ assignmentId: adjustedAssignment.id }
				);
			}
			this.assertBoundary(boundary);
		}
		this.assertBoundary(boundary);
		const previousAssignments = boundary.assignments;
		this.chart.assignments = [...candidateAssignments];
		const committedAssignments = this.chart.assignments;
		let onCommittedRevert: (() => void) | undefined;
		const revert = createGuardedRevert(
			() => this.chart.assignments === committedAssignments,
			() => {
				this.chart.assignments = previousAssignments;
			},
			() => onCommittedRevert?.()
		);
		this.chart.mutationPolicy?.assignment?.onAssignmentsChange?.({
			kind: input.kind,
			source: input.source,
			previousAssignments,
			assignments: committedAssignments,
			affectedAssignmentIds: uniqueIds([
				...(proposal.assignment ? [proposal.assignment.id] : []),
				...(proposal.previousAssignment ? [proposal.previousAssignment.id] : [])
			]),
			revert
		});
		if (this.chart.assignments === committedAssignments) {
			onCommittedRevert = this.notifyCommit({
				before: boundary,
				after: this.getSnapshot(),
				source: input.source,
				title: proposal.assignment?.id ?? proposal.previousAssignment?.id ?? 'assignment',
				assignmentKind: input.kind
			});
		}
		return true;
	}

	private createTaskProposal(
		input: {
			kind: GanttTaskMutationKind;
			source: GanttMutationSource;
			previousTask: GanttTask<TTaskFields> | null;
			task: GanttTask<TTaskFields> | null;
		},
		schedule: Schedule<TTaskFields, TDependencyFields>
	): GanttTaskProposal<TTaskFields> {
		const propagatedTasks = schedule.autoScheduledTaskIds
			.map((taskId) => schedule.model.tasksById.get(taskId))
			.filter((task): task is GanttTask<TTaskFields> => !!task);
		if (input.kind === 'add' || input.kind === 'paste') {
			if (!input.task) throw new Error('Add task proposal lost its task.');
			return {
				kind: input.kind,
				source: input.source,
				previousTask: null,
				task: input.task,
				propagatedTasks
			};
		}
		if (input.kind === 'remove') {
			if (!input.previousTask) throw new Error('Remove task proposal lost its previous task.');
			return {
				kind: 'remove',
				source: input.source,
				previousTask: input.previousTask,
				task: null,
				propagatedTasks
			};
		}
		if (!input.previousTask || !input.task) {
			throw new Error('Update task proposal lost a task endpoint.');
		}
		return {
			kind: input.kind,
			source: input.source,
			previousTask: input.previousTask,
			task: input.task,
			propagatedTasks
		};
	}

	private resolveSchedule(
		tasks: readonly GanttTask<TTaskFields>[],
		dependencies: readonly GanttDependency<TDependencyFields>[],
		assignments: readonly GanttAssignment<TAssignmentFields>[] = this.chart.assignments,
		autoSchedule = this.chart.autoSchedule,
		schedulingViolations: ResolvedGanttSchedule<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>['analysis']['violations'] = []
	): ResolvedGanttSchedule<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		return resolveGanttSchedule({
			tasks,
			dependencies,
			resources: this.chart.resources,
			assignments,
			calendars: this.chart.calendars,
			projectCalendarId: this.chart.projectCalendarId,
			timeZone: this.chart.timeZone,
			expandedTaskIds: this.chart.expandedTaskIds.filter((taskId) =>
				tasks.some((task) => task.id === taskId && task.type === 'summary')
			),
			autoSchedule,
			schedulingViolations
		});
	}

	private resolveTaskMutationSchedule(
		input: Readonly<{
			kind: GanttTaskMutationKind;
			previousTask: GanttTask<TTaskFields> | null;
			task: GanttTask<TTaskFields> | null;
		}>,
		tasks: readonly GanttTask<TTaskFields>[],
		dependencies: readonly GanttDependency<TDependencyFields>[]
	): ResolvedGanttSchedule<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		if (this.chart.autoSchedule) return this.resolveSchedule(tasks, dependencies, undefined, true);
		if (
			!this.chart.moveDependencies ||
			input.kind !== 'move' ||
			!input.previousTask?.start ||
			!input.task?.start
		) {
			return this.resolveSchedule(tasks, dependencies, undefined, false);
		}
		const schedule = this.resolveSchedule(tasks, dependencies, undefined, false);
		const moved = moveGanttDependentTasks(
			schedule.model,
			input.task.id,
			input.task.start.getTime() - input.previousTask.start.getTime()
		);
		const resolved = this.resolveSchedule(
			moved.tasks,
			dependencies,
			undefined,
			false,
			moved.violations
		);
		return { ...resolved, autoScheduledTaskIds: moved.changedTaskIds };
	}

	private resolveAdjustedTaskMutationSchedule(
		input: Readonly<{
			kind: GanttTaskMutationKind;
			previousTask: GanttTask<TTaskFields> | null;
			task: GanttTask<TTaskFields> | null;
		}>,
		tasks: readonly GanttTask<TTaskFields>[],
		dependencies: readonly GanttDependency<TDependencyFields>[]
	): ResolvedGanttSchedule<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		try {
			return this.resolveTaskMutationSchedule(input, tasks, dependencies);
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			throw new GanttChartError(
				'invalid-adjustment',
				'Consumer adjustment produced an invalid Gantt model.',
				{ causeCode: error.code, cause: error.message }
			);
		}
	}

	private resolveAdjustedSchedule(
		tasks: readonly GanttTask<TTaskFields>[],
		dependencies: readonly GanttDependency<TDependencyFields>[],
		autoSchedule = this.chart.autoSchedule
	): ResolvedGanttSchedule<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		try {
			return this.resolveSchedule(tasks, dependencies, undefined, autoSchedule);
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			throw new GanttChartError(
				'invalid-adjustment',
				'Consumer adjustment produced an invalid Gantt model.',
				{ causeCode: error.code, cause: error.message }
			);
		}
	}

	private resolveModelAdjustment(
		tasks: readonly GanttTask<TTaskFields>[],
		dependencies: readonly GanttDependency<TDependencyFields>[],
		assignments: readonly GanttAssignment<TAssignmentFields>[],
		autoSchedule: boolean
	): ResolvedGanttSchedule<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		try {
			return this.resolveSchedule(tasks, dependencies, assignments, autoSchedule);
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			throw new GanttChartError(
				'invalid-adjustment',
				'Consumer adjustment produced an invalid Gantt model.',
				{ causeCode: error.code, cause: error.message }
			);
		}
	}

	private assertMutationEnabled(): void {
		if (this.chart.disabled) throw new GanttChartError('disabled', 'GanttChart is disabled.');
		if (this.chart.loading) {
			throw new GanttChartError('invalid-operation', 'GanttChart is loading.');
		}
	}

	private getBoundary(): MutationBoundary<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	> {
		return {
			...this.chart.modelBoundary,
			modelBoundary: this.chart.modelBoundary,
			timeZone: this.chart.timeZone,
			projectCalendarId: this.chart.projectCalendarId,
			selection: this.chart.selection
		};
	}

	private assertBoundary(
		boundary: MutationBoundary<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>
	): void {
		if (
			boundary.modelBoundary === this.chart.modelBoundary &&
			boundary.timeZone === this.chart.timeZone &&
			boundary.projectCalendarId === this.chart.projectCalendarId
		) {
			return;
		}
		throw new GanttChartError(
			'stale-transaction',
			'The controlled Gantt model changed while validating the mutation.'
		);
	}

	private assertExpectedTasks(expectedTasks: readonly GanttTask<TTaskFields>[]): void {
		if (expectedTasks === this.chart.tasks) return;
		throw new GanttChartError(
			'stale-transaction',
			'The controlled task collection changed during the interaction.'
		);
	}

	private requireTask(taskId: string): GanttTask<TTaskFields> {
		const task = this.chart.schedule.model.tasksById.get(taskId);
		if (task) return task;
		throw new GanttChartError('invalid-operation', `Unknown task ${taskId}.`, { taskId });
	}

	private requireDependency(dependencyId: string): GanttDependency<TDependencyFields> {
		const dependency = this.chart.schedule.model.dependenciesById.get(dependencyId);
		if (dependency) return dependency;
		throw new GanttChartError('invalid-operation', `Unknown dependency ${dependencyId}.`, {
			dependencyId
		});
	}

	private requireAssignment(assignmentId: string): GanttAssignment<TAssignmentFields> {
		const assignment = this.chart.schedule.model.assignmentsById.get(assignmentId);
		if (assignment) return assignment;
		throw new GanttChartError('invalid-operation', `Unknown assignment ${assignmentId}.`, {
			assignmentId
		});
	}

	private assertTaskWritable(task: GanttTask<TTaskFields>): void {
		if (!task.readOnly) return;
		throw new GanttChartError('read-only', `Task ${task.id} is read-only.`, { taskId: task.id });
	}

	private assertDependencyWritable(dependency: GanttDependency<TDependencyFields>): void {
		if (!dependency.readOnly) return;
		throw new GanttChartError('read-only', `Dependency ${dependency.id} is read-only.`, {
			dependencyId: dependency.id
		});
	}

	private assertAssignmentMutationWritable(
		proposal: GanttAssignmentProposal<TAssignmentFields>
	): void {
		const assignments = [proposal.previousAssignment, proposal.assignment].filter(
			(assignment): assignment is GanttAssignment<TAssignmentFields> => assignment !== null
		);
		const model = this.chart.schedule.model;
		for (const assignment of assignments) {
			const resource = model.resourcesById.get(assignment.resourceId);
			if (resource?.readOnly) {
				throw new GanttChartError('read-only', `Resource ${resource.id} is read-only.`, {
					assignmentId: assignment.id,
					resourceId: resource.id
				});
			}
			const task = model.tasksById.get(assignment.taskId);
			if (!task?.readOnly) continue;
			throw new GanttChartError('read-only', `Task ${task.id} is read-only.`, {
				assignmentId: assignment.id,
				taskId: task.id
			});
		}
	}

	private getSnapshot(): GanttModelSnapshot<TTaskFields, TDependencyFields, TAssignmentFields> {
		return {
			tasks: this.chart.tasks,
			dependencies: this.chart.dependencies,
			assignments: this.chart.assignments,
			selection: cloneGanttSelection(this.chart.selection)
		};
	}

	private notifyCommit(
		commit: GanttModelCommit<TTaskFields, TDependencyFields, TAssignmentFields>
	): (() => void) | undefined {
		return this.onCommit?.(commit);
	}
}

function createDependencyProposal<TDependencyFields extends object>(input: {
	kind: GanttDependencyMutationKind;
	source: GanttMutationSource;
	previousDependency: GanttDependency<TDependencyFields> | null;
	dependency: GanttDependency<TDependencyFields> | null;
}): GanttDependencyProposal<TDependencyFields> {
	return {
		kind: input.kind,
		source: input.source,
		previousDependency: input.previousDependency,
		dependency: input.dependency
	};
}

function createAssignmentProposal<TAssignmentFields extends object>(input: {
	kind: GanttAssignmentMutationKind;
	source: GanttMutationSource;
	previousAssignment: GanttAssignment<TAssignmentFields> | null;
	assignment: GanttAssignment<TAssignmentFields> | null;
}): GanttAssignmentProposal<TAssignmentFields> {
	return {
		kind: input.kind,
		source: input.source,
		previousAssignment: input.previousAssignment,
		assignment: input.assignment
	};
}

function getChangedRecordIds<T extends { id: string }>(
	before: readonly T[],
	after: readonly T[]
): string[] {
	const beforeById = new Map(before.map((record) => [record.id, record]));
	const afterById = new Map(after.map((record) => [record.id, record]));
	const ids = [...after.map((record) => record.id)];
	for (const record of before) {
		if (!afterById.has(record.id)) ids.push(record.id);
	}
	return ids.filter((id) => {
		const previous = beforeById.get(id);
		const next = afterById.get(id);
		if (!previous || !next) return true;
		return getGanttValueSignature(previous) !== getGanttValueSignature(next);
	});
}

function resolveTaskProposalKind<TTaskFields extends object>(
	previousTask: GanttTask<TTaskFields> | null,
	task: GanttTask<TTaskFields> | null,
	preferredKind: GanttTaskMutationKind | undefined
): GanttTaskMutationKind {
	if (!previousTask && task) return preferredKind === 'paste' ? 'paste' : 'add';
	if (previousTask && !task) return 'remove';
	return 'update';
}

function resolveRecordProposalKind<T extends { id: string }>(
	previousRecord: T | null,
	record: T | null
): 'add' | 'update' | 'remove' {
	if (!previousRecord && record) return 'add';
	if (previousRecord && !record) return 'remove';
	return 'update';
}

function getAggregateTaskKind<TTaskFields extends object>(
	before: readonly GanttTask<TTaskFields>[],
	after: readonly GanttTask<TTaskFields>[],
	preferredKind: GanttTaskMutationKind | undefined
): GanttTaskMutationKind | null {
	const changedIds = getChangedRecordIds(before, after);
	if (changedIds.length === 0) return null;
	const beforeIds = new Set(before.map((task) => task.id));
	const afterIds = new Set(after.map((task) => task.id));
	const isOnlyAdditions = changedIds.every((id) => !beforeIds.has(id) && afterIds.has(id));
	if (isOnlyAdditions) return preferredKind === 'paste' ? 'paste' : 'add';
	if (changedIds.every((id) => beforeIds.has(id) && !afterIds.has(id))) return 'remove';
	return 'update';
}

function getAggregateRecordKind<T extends { id: string }>(
	before: readonly T[],
	after: readonly T[],
	preferredKind: 'add' | 'update' | 'remove' | undefined
): 'add' | 'update' | 'remove' | null {
	const changedIds = getChangedRecordIds(before, after);
	if (changedIds.length === 0) return null;
	const beforeIds = new Set(before.map((record) => record.id));
	const afterIds = new Set(after.map((record) => record.id));
	if (changedIds.every((id) => !beforeIds.has(id) && afterIds.has(id))) {
		return preferredKind === 'add' ? preferredKind : 'add';
	}
	if (changedIds.every((id) => beforeIds.has(id) && !afterIds.has(id))) return 'remove';
	return 'update';
}

function normalizeModelSelection<TTaskFields extends object, TDependencyFields extends object>(
	selection: GanttSelection,
	tasks: readonly GanttTask<TTaskFields>[],
	dependencies: readonly GanttDependency<TDependencyFields>[]
): GanttSelection {
	if (selection.kind === 'task' && tasks.some((task) => task.id === selection.taskId)) {
		return cloneGanttSelection(selection);
	}
	if (
		selection.kind === 'dependency' &&
		dependencies.some((dependency) => dependency.id === selection.dependencyId)
	) {
		return cloneGanttSelection(selection);
	}
	if (
		selection.kind === 'cell' &&
		tasks.some((task) => task.id === selection.taskId) &&
		selection.cell.taskId === selection.taskId
	) {
		return cloneGanttSelection(selection);
	}
	return { kind: null, taskId: null, dependencyId: null, cell: null };
}

function createGuardedRevert(
	isCurrent: () => boolean,
	restore: () => void,
	onRevert?: () => void
): () => void {
	let isConsumed = false;
	return () => {
		if (isConsumed) {
			throw new GanttChartError('revert-used', 'This GanttChart revert was already used.');
		}
		if (!isCurrent()) {
			throw new GanttChartError(
				'stale-transaction',
				'This GanttChart transaction can no longer be reverted.'
			);
		}
		isConsumed = true;
		restore();
		onRevert?.();
	};
}

function replaceById<T extends { id: string }>(records: readonly T[], record: T): T[] {
	const index = records.findIndex((candidate) => candidate.id === record.id);
	if (index < 0) {
		throw new GanttChartError('invalid-operation', `Unknown record ${record.id}.`, {
			id: record.id
		});
	}
	const nextRecords = [...records];
	nextRecords[index] = record;
	return nextRecords;
}

function uniqueIds(ids: readonly string[]): readonly string[] {
	return [...new Set(ids)];
}

function cloneTaskWithParent<TTaskFields extends object>(
	task: GanttTask<TTaskFields>,
	parentId: string | undefined
): GanttTask<TTaskFields> {
	const clonedTask = cloneGanttTask(task);
	if (parentId) return { ...clonedTask, parentId };
	return { ...clonedTask, parentId: undefined };
}
