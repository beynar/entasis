import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
	getCalendarRuntime,
	getTaskCalendar,
	type GanttCalendarRuntime
} from './ganttChart.calendar.js';
import {
	GanttDependencyInteraction,
	type GanttDependencyInteractionStatus,
	type GanttTimelineInteractionContext
} from './ganttChart.dependencyInteraction.svelte.js';
import { GanttChartError } from './ganttChart.error.js';
import {
	acceptGanttInteraction,
	pendingGanttInteraction,
	rejectGanttInteraction,
	type GanttInteractionResolution
} from './ganttChart.interactionResolution.js';
import type { GanttChartMutations } from './ganttChart.mutations.js';
import type {
	GanttRowInteractionOwner,
	GanttRowReorderStatus
} from './ganttChart.rowReorder.svelte.js';
import {
	getGanttScaleInstantAtPixel,
	getGanttScalePixel,
	type GanttTimeScale
} from './ganttChart.scale.js';
import type { GanttChartState } from './ganttChart.state.svelte.js';
import {
	deriveGanttProgressChange,
	deriveGanttRangeKeyboardProposal,
	deriveGanttRangeProposal,
	deriveGanttTaskKeyboardChange,
	deriveGanttTaskPointerChange,
	validateGanttRangeProposal,
	validateGanttTaskChange,
	type GanttDerivedTaskChange,
	type GanttTaskPointerOperation
} from './ganttChart.taskInteraction.js';
import type {
	GanttDependency,
	GanttInteractionBlockedInfo,
	GanttMutationSource,
	GanttRangeProposal,
	GanttTask,
	GanttTaskProposal
} from './ganttChart.types.js';

/* eslint-disable svelte/prefer-svelte-reactivity -- attachment registries must not invalidate component rendering */

const POINTER_EDGE_SIZE = 48;
const POINTER_MAX_SCROLL = 18;
const TASK_ACTIVATION_SUPPRESSION_MS = 700;

type PointerCoordinates = Readonly<{ clientX: number; clientY: number }>;
type TaskGestureOperation = GanttTaskPointerOperation | 'progress';
type ScheduledTask<TTaskFields extends object> = GanttTask<TTaskFields> & {
	start: Date;
	end: Date;
};

type TaskGesture<TTaskFields extends object> = {
	type: 'task';
	inputMode: 'pointer' | 'keyboard';
	initialOperation: TaskGestureOperation;
	operation: TaskGestureOperation;
	task: ScheduledTask<TTaskFields>;
	calendar: GanttCalendarRuntime;
	scale: GanttTimeScale;
	boundary: object & Readonly<{ tasks: GanttTask<TTaskFields>[] }>;
	originInstant: Date;
	rowTop: number;
	pointer: PointerCoordinates;
	pointerCanvasX: number;
	resolution: GanttInteractionResolution<GanttUpdateTaskProposal<TTaskFields>>;
	workingDurationMinutes: number;
	keyboardStepCount: number;
	pointerCapture: Readonly<{ node: HTMLElement; pointerId: number }> | null;
};

type RangeGesture = {
	type: 'range';
	inputMode: 'pointer' | 'keyboard';
	calendar: GanttCalendarRuntime;
	scale: GanttTimeScale;
	boundary: object;
	originInstant: Date;
	rowTop: number;
	pointer: PointerCoordinates;
	pointerCanvasX: number;
	resolution: GanttInteractionResolution<GanttRangeProposal>;
	workingDurationMinutes: number;
	keyboardStepCount: number;
	keyboardTaskId: string | null;
	parentId?: string;
	pointerCapture: Readonly<{ node: HTMLElement; pointerId: number }> | null;
};

type Gesture<TTaskFields extends object> = TaskGesture<TTaskFields> | RangeGesture;

export type GanttTimelineInteractionStatus<TTaskFields extends object> =
	| Readonly<{
			kind: 'task';
			inputMode: 'pointer' | 'keyboard';
			operation: GanttTaskPointerOperation | 'progress';
			taskId: string;
			resolution: GanttInteractionResolution<GanttTaskProposal<TTaskFields>>;
			rowTop: number;
			pointerCanvasX: number;
			workingDurationMinutes: number;
	  }>
	| Readonly<{
			kind: 'range';
			inputMode: 'pointer' | 'keyboard';
			keyboardTaskId: string | null;
			resolution: GanttInteractionResolution<GanttRangeProposal>;
			rowTop: number;
			pointerCanvasX: number;
			workingDurationMinutes: number;
	  }>;

export type GanttActiveInteraction<TTaskFields extends object> =
	| GanttTimelineInteractionStatus<TTaskFields>
	| Readonly<{ kind: 'dependency' } & GanttDependencyInteractionStatus>
	| GanttRowReorderStatus;

export class GanttChartInteractions<
	TTaskFields extends object,
	TDependencyFields extends object,
	TResourceFields extends object,
	TAssignmentFields extends object
> {
	readonly #chart: GanttChartState<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	readonly #mutations: GanttChartMutations<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	readonly dependency: GanttDependencyInteraction<
		TTaskFields,
		TDependencyFields,
		TResourceFields,
		TAssignmentFields
	>;
	#gesture = $state.raw<Gesture<TTaskFields> | null>(null);
	#timeline: GanttTimelineInteractionContext | null = null;
	#pointerAutoScrollFrame: number | null = null;
	#suppressedTaskClickId: string | null = null;
	#taskClickSuppressionCleanup: (() => void) | null = null;
	#taskRowTops = new Map<string, number>();
	#taskDragAttachments = new Map<string, Attachment<HTMLElement>>();
	#rowInteraction = $state.raw<GanttRowInteractionOwner | null>(null);

	constructor(
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>,
		mutations: GanttChartMutations<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>
	) {
		this.#chart = chart;
		this.#mutations = mutations;
		this.dependency = new GanttDependencyInteraction(this);
	}

	get chart(): GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields> {
		return this.#chart;
	}

	canBeginDependency(): boolean {
		return this.#gesture === null && this.#rowInteraction?.status == null;
	}

	commitDependencyCreation(
		dependency: GanttDependency<TDependencyFields>,
		source: Extract<GanttMutationSource, 'pointer' | 'keyboard'>
	): boolean {
		return this.#mutations.addDependency(dependency, source);
	}

	cancelDependencyTransport(): void {
		this.cancel(true);
		this.#chart.a11y.scheduleDismissFocus();
	}

	readonly active: GanttActiveInteraction<TTaskFields> | null = $derived.by(() => {
		const gesture = this.#gesture;
		if (gesture?.type === 'range') {
			return {
				kind: 'range',
				inputMode: gesture.inputMode,
				keyboardTaskId: gesture.keyboardTaskId,
				resolution: gesture.resolution,
				rowTop: gesture.rowTop,
				pointerCanvasX: gesture.pointerCanvasX,
				workingDurationMinutes: gesture.workingDurationMinutes
			};
		}
		if (gesture?.type === 'task') {
			return {
				kind: 'task',
				inputMode: gesture.inputMode,
				operation: gesture.operation,
				taskId: gesture.task.id,
				resolution: gesture.resolution,
				rowTop: gesture.rowTop,
				pointerCanvasX: gesture.pointerCanvasX,
				workingDurationMinutes: gesture.workingDurationMinutes
			};
		}
		const dependency = this.dependency.status;
		if (dependency) return { kind: 'dependency', ...dependency };
		return this.#rowInteraction?.status ?? null;
	});

	connectRowInteraction(owner: GanttRowInteractionOwner): () => void {
		this.#rowInteraction = owner;
		return () => {
			if (this.#rowInteraction === owner) this.#rowInteraction = null;
		};
	}

	shouldSuppressTaskActivation(taskId: string): boolean {
		return this.#suppressedTaskClickId === taskId;
	}

	connectTimeline(context: GanttTimelineInteractionContext): () => void {
		this.#timeline = context;
		const dependencyCleanup = this.dependency.connectTimeline(context);
		const handleKeyDown = (event: KeyboardEvent) => {
			const active = this.active;
			if (event.key !== 'Escape' || !active) return;
			if (
				(active.kind === 'row' || active.kind === 'dependency') &&
				active.transport === 'native'
			) {
				return;
			}
			event.preventDefault();
			this.cancel(true);
			this.#chart.a11y.scheduleDismissFocus();
		};
		window.addEventListener('keydown', handleKeyDown, true);
		return () => {
			dependencyCleanup();
			window.removeEventListener('keydown', handleKeyDown, true);
			if (this.#timeline === context) {
				this.cancel();
				this.clearTaskClickSuppression();
				this.#timeline = null;
			}
		};
	}

	beginKeyboardTask(taskId: string, operation: TaskGestureOperation): boolean {
		const timeline = this.#timeline;
		const task = this.getTaskForGesture(taskId, operation);
		if (!timeline || !task) return false;
		const calendar = getTaskCalendar(this.#chart.schedule.model, task);
		const originInstant = operation === 'resize-end' ? task.end : task.start;
		const pointerCanvasX = getGanttScalePixel(timeline.scale, originInstant);
		this.#gesture = {
			type: 'task',
			inputMode: 'keyboard',
			initialOperation: operation,
			operation,
			task,
			calendar,
			scale: timeline.scale,
			boundary: this.#chart.modelBoundary,
			originInstant,
			rowTop: this.#taskRowTops.get(taskId) ?? 0,
			pointer: { clientX: 0, clientY: 0 },
			pointerCanvasX,
			resolution: pendingGanttInteraction,
			workingDurationMinutes: 0,
			keyboardStepCount: 0,
			pointerCapture: null
		};
		return true;
	}

	adjustKeyboard(stepDelta: -1 | 1): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.inputMode !== 'keyboard') return false;
		return gesture.type === 'task'
			? this.adjustKeyboardTask(stepDelta)
			: this.adjustKeyboardRange(stepDelta);
	}

	commitKeyboard(): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.inputMode !== 'keyboard') return false;
		return gesture.type === 'task' ? this.commitTaskGesture() : this.commitRangeGesture();
	}

	private adjustKeyboardTask(stepDelta: -1 | 1): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.type !== 'task' || gesture.inputMode !== 'keyboard') return false;
		if (gesture.boundary !== this.#chart.modelBoundary) {
			this.reconcileControlledState();
			return false;
		}
		const keyboardStepCount = gesture.keyboardStepCount + stepDelta;
		try {
			const change = deriveGanttTaskKeyboardChange({
				task: gesture.task,
				operation: gesture.initialOperation,
				stepCount: keyboardStepCount,
				calendar: gesture.calendar,
				snapDuration: this.#chart.snapDuration
			});
			validateGanttTaskChange(change.task, this.#chart.validRange);
			const proposal: GanttUpdateTaskProposal<TTaskFields> = {
				kind: change.kind,
				source: 'keyboard',
				previousTask: gesture.task,
				task: change.task,
				propagatedTasks: []
			};
			const isValid = this.#chart.mutationPolicy?.task?.validate?.(proposal) !== false;
			this.#gesture = {
				...gesture,
				operation: change.kind,
				pointerCanvasX: getKeyboardTaskPointerX(change.task, change.kind, gesture.scale),
				resolution: isValid
					? acceptGanttInteraction(proposal)
					: rejectGanttInteraction(
							'custom-policy',
							'The consumer task policy rejected this proposal.',
							proposal
						),
				workingDurationMinutes: change.workingDurationMinutes,
				keyboardStepCount
			};
			return isValid;
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			this.#gesture = {
				...gesture,
				resolution: rejectGanttInteraction<GanttUpdateTaskProposal<TTaskFields>>(
					getBlockedReason(error),
					error.message
				),
				keyboardStepCount
			};
			return false;
		}
	}

	beginKeyboardRange(
		anchor: Date,
		rowTop: number,
		keyboardTaskId: string,
		parentId?: string
	): boolean {
		const timeline = this.#timeline;
		if (!timeline || !this.canBeginRangeGesture()) return false;
		this.#gesture = {
			type: 'range',
			inputMode: 'keyboard',
			calendar: getCalendarRuntime(this.#chart.schedule.model.projectCalendar),
			scale: timeline.scale,
			boundary: this.#chart.modelBoundary,
			originInstant: new Date(anchor),
			rowTop,
			pointer: { clientX: 0, clientY: 0 },
			pointerCanvasX: getGanttScalePixel(timeline.scale, anchor),
			resolution: pendingGanttInteraction,
			workingDurationMinutes: 0,
			keyboardStepCount: 0,
			keyboardTaskId,
			parentId,
			pointerCapture: null
		};
		this.adjustKeyboardRange(1);
		return true;
	}

	private adjustKeyboardRange(stepDelta: -1 | 1): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.type !== 'range' || gesture.inputMode !== 'keyboard') return false;
		const keyboardStepCount = gesture.keyboardStepCount + stepDelta;
		const resolvedStepCount = keyboardStepCount === 0 ? stepDelta : keyboardStepCount;
		try {
			const change = deriveGanttRangeKeyboardProposal({
				originInstant: gesture.originInstant,
				stepCount: resolvedStepCount,
				calendar: gesture.calendar,
				snapDuration: this.#chart.snapDuration,
				...(gesture.parentId ? { parentId: gesture.parentId } : {})
			});
			validateGanttRangeProposal(change.proposal, this.#chart.validRange);
			const isValid = this.#chart.mutationPolicy?.range?.validate?.(change.proposal) !== false;
			this.#gesture = {
				...gesture,
				pointerCanvasX: getGanttScalePixel(
					gesture.scale,
					resolvedStepCount > 0 ? change.proposal.end : change.proposal.start
				),
				resolution: isValid
					? acceptGanttInteraction(change.proposal)
					: rejectGanttInteraction(
							'custom-policy',
							'The consumer range policy rejected this proposal.',
							change.proposal
						),
				workingDurationMinutes: change.workingDurationMinutes,
				keyboardStepCount: resolvedStepCount
			};
			return isValid;
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			this.#gesture = {
				...gesture,
				resolution: rejectGanttInteraction<GanttRangeProposal>(
					getBlockedReason(error),
					error.message
				),
				keyboardStepCount: resolvedStepCount
			};
			return false;
		}
	}

	taskDrag(
		taskId: string,
		operation: TaskGestureOperation,
		rowTop: number
	): Attachment<HTMLElement> {
		this.#taskRowTops.set(taskId, rowTop);
		const key = `${taskId}:${operation}`;
		const current = this.#taskDragAttachments.get(key);
		if (current) return current;
		const pointerDrag = createPointerDrag({
			canStart: (event) =>
				(event.pointerType !== 'touch' || this.#chart.interactions.touch) &&
				(operation !== 'move' || isTaskBodyPointerTarget(event.target)),
			disabled: () => this.getTaskForGesture(taskId, operation) === null,
			activation: () => this.#chart.touchActivation,
			frameCoalesced: true,
			stopPropagation: true,
			onStart: (payload) => {
				const didBegin = this.beginTaskPointerGesture(
					taskId,
					operation,
					this.#taskRowTops.get(taskId) ?? rowTop,
					payload
				);
				if (didBegin) this.startPointerAutoScroll();
				return didBegin;
			},
			onMove: (payload) => this.updatePointerDrag(payload),
			onEnd: (payload) => this.finishPointerGesture(payload),
			onCancel: () => this.cancel(true)
		});
		const attachment: Attachment<HTMLElement> = (element) =>
			untrack(() => {
				const cleanup = pointerDrag(element);
				return () => {
					cleanup?.();
					if (this.#taskDragAttachments.get(key) === attachment) {
						this.#taskDragAttachments.delete(key);
					}
					if (operation === 'move') this.#taskRowTops.delete(taskId);
				};
			});
		this.#taskDragAttachments.set(key, attachment);
		return attachment;
	}

	rangeDrag(): Attachment<HTMLElement> {
		return createPointerDrag({
			disabled: () => !this.canBeginRangeGesture(),
			canStart: (event) => event.pointerType !== 'touch' || this.#chart.interactions.touch,
			activation: () => this.#chart.touchActivation,
			frameCoalesced: true,
			stopPropagation: true,
			onStart: (payload) => this.beginRangeGesture(payload),
			onMove: (payload) => this.updatePointerDrag(payload),
			onEnd: (payload) => this.finishPointerGesture(payload),
			onCancel: () => this.cancel(true)
		});
	}

	reconcileControlledState(): void {
		this.dependency.reconcileControlledState();
		const gesture = this.#gesture;
		if (!gesture || gesture.boundary === this.#chart.modelBoundary) return;
		this.cancel();
		this.reportBlocked({
			reason: 'stale',
			source: gesture.inputMode,
			...(gesture.type === 'task' ? { taskId: gesture.task.id } : {}),
			message: 'The controlled Gantt collections changed during the interaction.'
		});
	}

	reconcileScale(scale: GanttTimeScale): void {
		this.dependency.reconcileScale(scale);
		const gesture = this.#gesture;
		if (!gesture || isSameInteractionScale(gesture.scale, scale)) return;
		this.cancel();
		this.reportBlocked({
			reason: 'stale',
			source: gesture.inputMode,
			...(gesture.type === 'task' ? { taskId: gesture.task.id } : {}),
			message: 'The timeline scale changed during the interaction.'
		});
	}

	cancel(announce = false): boolean {
		const active = this.active;
		const didCancelDependency = this.dependency.cancel();
		const didCancelRow = this.#rowInteraction?.cancel() ?? false;
		const gesture = this.#gesture;
		const pointerCapture = gesture?.pointerCapture;
		const hasPointerCapture = Boolean(
			pointerCapture?.node.hasPointerCapture(pointerCapture.pointerId)
		);
		if (gesture?.type === 'task' && gesture.inputMode === 'pointer' && pointerCapture) {
			this.armTaskClickSuppression(gesture.task.id, pointerCapture.pointerId, hasPointerCapture);
		}
		this.#gesture = null;
		this.stopPointerAutoScroll();
		if (hasPointerCapture && pointerCapture) {
			pointerCapture.node.releasePointerCapture(pointerCapture.pointerId);
		}
		const didCancel = gesture !== null || didCancelDependency || didCancelRow;
		if (didCancel && announce && active) this.#chart.a11y.announceInteractionCancelled(active);
		return didCancel;
	}

	private beginTaskPointerGesture(
		taskId: string,
		operation: TaskGestureOperation,
		rowTop: number,
		payload: PointerDragPayload
	): boolean {
		const timeline = this.#timeline;
		const task = this.getTaskForGesture(taskId, operation);
		if (!timeline || !task) return false;
		const pointer = { clientX: payload.x, clientY: payload.y };
		const originPointer = { clientX: payload.startX, clientY: payload.startY };
		this.#gesture = {
			type: 'task',
			inputMode: 'pointer',
			initialOperation: operation,
			operation,
			task,
			calendar: getTaskCalendar(this.#chart.schedule.model, task),
			scale: timeline.scale,
			boundary: this.#chart.modelBoundary,
			originInstant: this.getPointerInstant(originPointer, timeline.scale, timeline.viewport),
			rowTop,
			pointer,
			pointerCanvasX: this.getPointerCanvasX(pointer, timeline.viewport),
			resolution: pendingGanttInteraction,
			workingDurationMinutes: 0,
			keyboardStepCount: 0,
			pointerCapture: { node: payload.node, pointerId: payload.pointerId }
		};
		this.updatePointerGesture(pointer);
		return true;
	}

	private beginRangeGesture(payload: PointerDragPayload): boolean {
		const timeline = this.#timeline;
		const startTarget = payload.startTarget;
		if (
			!timeline ||
			!this.canBeginRangeGesture() ||
			(startTarget instanceof Element &&
				startTarget.closest(
					'[data-gantt-chart-part="task"], [data-gantt-chart-part="summary-task"], [data-gantt-chart-part="milestone"], [data-gantt-chart-part="connector-control"], [data-gantt-chart-part="resize-handle"], [data-gantt-chart-part="progress-handle"], [data-gantt-chart-part="dependency-handle"]'
				))
		) {
			return false;
		}
		const pointer = toPointerCoordinates(payload);
		const originPointer = { clientX: payload.startX, clientY: payload.startY };
		const canvasBounds = payload.node.getBoundingClientRect();
		const rowTop =
			Math.max(0, Math.floor((originPointer.clientY - canvasBounds.top) / timeline.rowHeight)) *
			timeline.rowHeight;
		this.#gesture = {
			type: 'range',
			inputMode: 'pointer',
			calendar: getCalendarRuntime(this.#chart.schedule.model.projectCalendar),
			scale: timeline.scale,
			boundary: this.#chart.modelBoundary,
			originInstant: this.getPointerInstant(originPointer, timeline.scale, timeline.viewport),
			rowTop,
			pointer,
			pointerCanvasX: this.getPointerCanvasX(pointer, timeline.viewport),
			resolution: pendingGanttInteraction,
			workingDurationMinutes: 0,
			keyboardStepCount: 0,
			keyboardTaskId: null,
			pointerCapture: { node: payload.node, pointerId: payload.pointerId }
		};
		this.updatePointerGesture(pointer);
		this.startPointerAutoScroll();
		return true;
	}

	private finishPointerGesture(payload: PointerDragPayload): void {
		this.updatePointerGesture(toPointerCoordinates(payload));
		if (this.#gesture?.type === 'range') this.commitRangeGesture();
		else this.commitTaskGesture();
	}

	private updatePointerDrag(payload: PointerDragPayload): void {
		this.updatePointerGesture(toPointerCoordinates(payload));
		if (this.#gesture) this.startPointerAutoScroll();
	}

	private updatePointerGesture(pointer: PointerCoordinates): void {
		const gesture = this.#gesture;
		const timeline = this.#timeline;
		if (!gesture || !timeline) return;
		if (gesture.boundary !== this.#chart.modelBoundary) {
			this.reconcileControlledState();
			return;
		}
		if (!isSameInteractionScale(gesture.scale, timeline.scale)) {
			this.reconcileScale(timeline.scale);
			return;
		}
		const bounds = timeline.viewport.getBoundingClientRect();
		const isInside =
			pointer.clientX >= bounds.left &&
			pointer.clientX <= bounds.right &&
			pointer.clientY >= bounds.top &&
			pointer.clientY <= bounds.bottom;
		const pointerCanvasX = this.getPointerCanvasX(pointer, timeline.viewport);
		if (!isInside) {
			if (gesture.type === 'range') {
				this.#gesture = {
					...gesture,
					pointer,
					pointerCanvasX,
					resolution: rejectGanttInteraction(
						'invalid-target',
						'The pointer is outside the timeline viewport.',
						gesture.resolution.state === 'pending' ? null : gesture.resolution.proposal
					)
				};
			} else {
				this.#gesture = {
					...gesture,
					pointer,
					pointerCanvasX,
					resolution: rejectGanttInteraction(
						'invalid-target',
						'The pointer is outside the timeline viewport.',
						gesture.resolution.state === 'pending' ? null : gesture.resolution.proposal
					)
				};
			}
			return;
		}
		const pointerInstant = this.getPointerInstant(pointer, gesture.scale, timeline.viewport);
		if (gesture.type === 'range') {
			this.updateRangeProposal(gesture, pointer, pointerCanvasX, pointerInstant);
			return;
		}
		this.updateTaskProposal(gesture, pointer, pointerCanvasX, pointerInstant);
	}

	private updateTaskProposal(
		gesture: TaskGesture<TTaskFields>,
		pointer: PointerCoordinates,
		pointerCanvasX: number,
		pointerInstant: Date
	): void {
		let change: GanttDerivedTaskChange<TTaskFields>;
		try {
			change =
				gesture.initialOperation === 'progress'
					? deriveGanttProgressChange({
							task: gesture.task,
							progressDelta: this.getProgressPointerDelta(gesture, pointerCanvasX),
							calendar: gesture.calendar
						})
					: deriveGanttTaskPointerChange({
							task: gesture.task,
							operation: gesture.initialOperation,
							originInstant: gesture.originInstant,
							pointerInstant,
							calendar: gesture.calendar,
							snapDuration: this.#chart.snapDuration
						});
			validateGanttTaskChange(change.task, this.#chart.validRange);
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			this.#gesture = {
				...gesture,
				pointer,
				pointerCanvasX,
				resolution: rejectGanttInteraction<GanttUpdateTaskProposal<TTaskFields>>(
					getBlockedReason(error),
					error.message
				),
				workingDurationMinutes: 0
			};
			return;
		}
		const proposal: GanttUpdateTaskProposal<TTaskFields> = {
			kind: change.kind,
			source: gesture.inputMode,
			previousTask: gesture.task,
			task: change.task,
			propagatedTasks: []
		};
		const invalidReason =
			this.#chart.mutationPolicy?.task?.validate?.(proposal) === false ? 'custom-policy' : null;
		this.#gesture = {
			...gesture,
			operation: change.kind,
			pointer,
			pointerCanvasX,
			resolution:
				invalidReason === null
					? acceptGanttInteraction(proposal)
					: rejectGanttInteraction(
							invalidReason,
							'The consumer task policy rejected this proposal.',
							proposal
						),
			workingDurationMinutes: change.workingDurationMinutes
		};
	}

	private getProgressPointerDelta(
		gesture: TaskGesture<TTaskFields>,
		pointerCanvasX: number
	): number {
		const { task, scale } = gesture;
		const initialProgress = Math.max(0, Math.min(1, task.progress ?? 0));
		const startCanvasX = getGanttScalePixel(scale, task.start);
		const endCanvasX = getGanttScalePixel(scale, task.end);
		const originCanvasX = getGanttScalePixel(scale, gesture.originInstant);
		const chronologicalDirection = scale.direction === 'rtl' ? -1 : 1;
		const pointerDelta = (pointerCanvasX - originCanvasX) * chronologicalDirection;
		if (pointerDelta === 0) return 0;
		// Idle edge handles are inset to preserve resize access. Scale each drag direction against
		// its remaining endpoint distance so progress starts without a jump and reaches 0/100 at the edge.
		if (pointerDelta < 0) {
			const spanToStart = Math.max(0, (originCanvasX - startCanvasX) * chronologicalDirection);
			if (spanToStart === 0) return -initialProgress;
			return -initialProgress * Math.min(1, -pointerDelta / spanToStart);
		}
		const spanToEnd = Math.max(0, (endCanvasX - originCanvasX) * chronologicalDirection);
		if (spanToEnd === 0) return 1 - initialProgress;
		return (1 - initialProgress) * Math.min(1, pointerDelta / spanToEnd);
	}

	private updateRangeProposal(
		gesture: RangeGesture,
		pointer: PointerCoordinates,
		pointerCanvasX: number,
		pointerInstant: Date
	): void {
		let change: ReturnType<typeof deriveGanttRangeProposal>;
		try {
			change = deriveGanttRangeProposal({
				originInstant: gesture.originInstant,
				pointerInstant,
				calendar: gesture.calendar,
				snapDuration: this.#chart.snapDuration,
				source: gesture.inputMode,
				...(gesture.parentId ? { parentId: gesture.parentId } : {})
			});
			validateGanttRangeProposal(change.proposal, this.#chart.validRange);
		} catch (error) {
			if (!(error instanceof GanttChartError)) throw error;
			this.#gesture = {
				...gesture,
				pointer,
				pointerCanvasX,
				resolution: rejectGanttInteraction<GanttRangeProposal>(
					getBlockedReason(error),
					error.message
				),
				workingDurationMinutes: 0
			};
			return;
		}
		const invalidReason =
			this.#chart.mutationPolicy?.range?.validate?.(change.proposal) === false
				? 'custom-policy'
				: null;
		this.#gesture = {
			...gesture,
			pointer,
			pointerCanvasX,
			resolution:
				invalidReason === null
					? acceptGanttInteraction(change.proposal)
					: rejectGanttInteraction(
							invalidReason,
							'The consumer range policy rejected this proposal.',
							change.proposal
						),
			workingDurationMinutes: change.workingDurationMinutes
		};
	}

	private commitTaskGesture(): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.type !== 'task') return false;
		if (gesture.resolution.state !== 'accepted') {
			const blocked = this.getGestureBlockedInfo(gesture);
			this.cancel();
			this.reportBlocked(blocked);
			return false;
		}
		const proposal = gesture.resolution.proposal;
		if (isNoopTaskProposal(proposal)) {
			this.cancel();
			return true;
		}
		let didCommit = false;
		try {
			const accepted = this.#mutations.updateTaskWithKind(
				proposal.task,
				proposal.kind,
				gesture.inputMode,
				gesture.boundary.tasks
			);
			if (!accepted) {
				this.reportBlocked({
					reason: 'custom-policy',
					source: gesture.inputMode,
					taskId: gesture.task.id,
					message: 'The consumer task policy rejected this proposal.'
				});
			} else didCommit = true;
		} catch (error) {
			if (!(error instanceof GanttChartError) || error.code !== 'stale-transaction') throw error;
			this.reportBlocked({
				reason: 'stale',
				source: gesture.inputMode,
				taskId: gesture.task.id,
				message: error.message
			});
		} finally {
			this.cancel();
		}
		return didCommit;
	}

	private commitRangeGesture(): boolean {
		const gesture = this.#gesture;
		if (!gesture || gesture.type !== 'range') return false;
		if (gesture.resolution.state !== 'accepted') {
			const blocked = this.getGestureBlockedInfo(gesture);
			this.cancel();
			this.reportBlocked(blocked);
			return false;
		}
		try {
			if (this.#chart.mutationPolicy?.range?.validate?.(gesture.resolution.proposal) === false) {
				this.reportBlocked({
					reason: 'custom-policy',
					source: gesture.inputMode,
					message: 'The consumer range policy rejected this proposal.'
				});
				return false;
			}
			this.#chart.eventHandlers?.onEmptyRangeSelect?.(gesture.resolution.proposal);
			return true;
		} finally {
			this.cancel();
		}
	}

	private getTaskForGesture(
		taskId: string,
		operation: TaskGestureOperation
	): ScheduledTask<TTaskFields> | null {
		if (this.#chart.disabled || this.#chart.loading || this.active) return null;
		const task = this.#chart.schedule.model.tasksById.get(taskId);
		if (!task || task.readOnly || !task.start || !task.end) return null;
		if (operation === 'progress') {
			return task.type !== 'milestone' &&
				task.progressEditable !== false &&
				this.#chart.interactions.resizeProgress
				? task
				: null;
		}
		if (operation === 'move') {
			return this.#chart.interactions.moveTask && task.draggable !== false ? task : null;
		}
		if (task.type === 'milestone' || task.resizable === false) return null;
		return (
			operation === 'resize-start'
				? this.#chart.interactions.resizeStart
				: this.#chart.interactions.resizeEnd
		)
			? task
			: null;
	}

	private canBeginRangeGesture(): boolean {
		return (
			!this.#chart.disabled &&
			!this.#chart.loading &&
			!this.active &&
			this.#chart.interactions.createRange
		);
	}

	private getPointerInstant(
		pointer: PointerCoordinates,
		scale: GanttTimeScale,
		viewport: HTMLElement
	): Date {
		return getGanttScaleInstantAtPixel(scale, this.getPointerCanvasX(pointer, viewport));
	}

	private getPointerCanvasX(pointer: PointerCoordinates, viewport: HTMLElement): number {
		const bounds = viewport.getBoundingClientRect();
		return Math.max(
			0,
			Math.min(viewport.scrollWidth, pointer.clientX - bounds.left + viewport.scrollLeft)
		);
	}

	private startPointerAutoScroll(): void {
		if (this.#pointerAutoScrollFrame !== null) return;
		const step = () => {
			this.#pointerAutoScrollFrame = null;
			const gesture = this.#gesture;
			const timeline = this.#timeline;
			if (!gesture || !timeline) {
				return;
			}
			const bounds = timeline.viewport.getBoundingClientRect();
			const startDistance = gesture.pointer.clientX - bounds.left;
			const endDistance = bounds.right - gesture.pointer.clientX;
			const delta =
				startDistance < POINTER_EDGE_SIZE
					? -getPointerScrollDelta(startDistance)
					: endDistance < POINTER_EDGE_SIZE
						? getPointerScrollDelta(endDistance)
						: 0;
			if (delta === 0) return;
			const previous = timeline.viewport.scrollLeft;
			timeline.viewport.scrollLeft += delta;
			if (timeline.viewport.scrollLeft === previous) return;
			this.updatePointerGesture(gesture.pointer);
			if (this.#gesture && this.#timeline === timeline) {
				this.#pointerAutoScrollFrame = requestAnimationFrame(step);
			}
		};
		this.#pointerAutoScrollFrame = requestAnimationFrame(step);
	}

	private stopPointerAutoScroll(): void {
		if (this.#pointerAutoScrollFrame !== null) cancelAnimationFrame(this.#pointerAutoScrollFrame);
		this.#pointerAutoScrollFrame = null;
	}

	private armTaskClickSuppression(
		taskId: string,
		pointerId: number,
		waitForPointerUp: boolean
	): void {
		this.clearTaskClickSuppression();
		this.#suppressedTaskClickId = taskId;
		const scheduleClear = () => {
			this.#taskClickSuppressionCleanup?.();
			const timer = setTimeout(() => {
				this.clearTaskClickSuppression();
			}, TASK_ACTIVATION_SUPPRESSION_MS);
			this.#taskClickSuppressionCleanup = () => clearTimeout(timer);
		};
		if (!waitForPointerUp) {
			scheduleClear();
			return;
		}
		const handlePointerFinish = (event: PointerEvent) => {
			if (event.pointerId === pointerId) scheduleClear();
		};
		window.addEventListener('pointerup', handlePointerFinish, true);
		window.addEventListener('pointercancel', handlePointerFinish, true);
		this.#taskClickSuppressionCleanup = () => {
			window.removeEventListener('pointerup', handlePointerFinish, true);
			window.removeEventListener('pointercancel', handlePointerFinish, true);
		};
	}

	private clearTaskClickSuppression(): void {
		this.#taskClickSuppressionCleanup?.();
		this.#taskClickSuppressionCleanup = null;
		this.#suppressedTaskClickId = null;
	}

	private getGestureBlockedInfo(gesture: Gesture<TTaskFields>): GanttInteractionBlockedInfo {
		const resolution = gesture.resolution;
		let pendingMessage = 'The task has no valid pointer proposal.';
		if (gesture.type === 'range') {
			pendingMessage =
				gesture.inputMode === 'keyboard'
					? 'Use an arrow key to create a keyboard range proposal.'
					: 'The range has no valid proposal.';
		} else if (gesture.inputMode === 'keyboard') {
			pendingMessage = 'Use an arrow key to create a keyboard task proposal.';
		} else if (gesture.operation === 'progress') {
			pendingMessage = 'The task has no valid progress proposal.';
		}
		return {
			reason: resolution.state === 'rejected' ? resolution.reason : 'invalid-target',
			source: gesture.inputMode,
			...(gesture.type === 'task' ? { taskId: gesture.task.id } : {}),
			message: resolution.state === 'rejected' ? resolution.message : pendingMessage
		};
	}

	private reportBlocked(info: GanttInteractionBlockedInfo): void {
		this.#chart.eventHandlers?.onInteractionBlocked?.(info);
	}
}

function toPointerCoordinates(payload: PointerDragPayload): PointerCoordinates {
	return { clientX: payload.x, clientY: payload.y };
}

function getBlockedReason(error: GanttChartError): GanttInteractionBlockedInfo['reason'] {
	if (error.code === 'invalid-range') return 'valid-range';
	if (error.code === 'read-only') return 'read-only';
	if (error.code === 'invalid-constraint') return 'constraint';
	if (
		error.code === 'missing-calendar' ||
		error.code === 'invalid-calendar' ||
		error.code === 'schedule-conflict'
	) {
		return 'calendar';
	}
	return 'invalid-target';
}

type GanttUpdateTaskProposal<TTaskFields extends object> = GanttTaskProposal<TTaskFields> &
	Readonly<{
		kind: GanttDerivedTaskChange<TTaskFields>['kind'];
		previousTask: GanttTask<TTaskFields>;
		task: GanttTask<TTaskFields>;
	}>;

function isNoopTaskProposal<TTaskFields extends object>(
	proposal: GanttUpdateTaskProposal<TTaskFields>
): boolean {
	const previous = proposal.previousTask;
	const task = proposal.task;
	if (proposal.kind === 'progress') return previous.progress === task.progress;
	if (!previous.start || !previous.end || !task.start || !task.end) return false;
	return (
		previous.start.getTime() === task.start.getTime() &&
		previous.end.getTime() === task.end.getTime() &&
		segmentsEqual(previous.segments, task.segments)
	);
}

function segmentsEqual(
	left: readonly { start: Date; end: Date }[] | undefined,
	right: readonly { start: Date; end: Date }[] | undefined
): boolean {
	if (left === right) return true;
	if (!left || !right || left.length !== right.length) return false;
	return left.every(
		(segment, index) =>
			segment.start.getTime() === right[index].start.getTime() &&
			segment.end.getTime() === right[index].end.getTime()
	);
}

function getKeyboardTaskPointerX<TTaskFields extends object>(
	task: GanttTask<TTaskFields>,
	kind: GanttDerivedTaskChange<TTaskFields>['kind'],
	scale: GanttTimeScale
): number {
	if (!task.start || !task.end) return 0;
	if (kind === 'progress') {
		const progressInstant = new Date(
			task.start.getTime() + (task.end.getTime() - task.start.getTime()) * (task.progress ?? 0)
		);
		return getGanttScalePixel(scale, progressInstant);
	}
	return getGanttScalePixel(scale, kind === 'resize-start' ? task.start : task.end);
}

function getPointerScrollDelta(distance: number): number {
	const ratio = Math.max(0, Math.min(1, (POINTER_EDGE_SIZE - distance) / POINTER_EDGE_SIZE));
	return Math.max(1, Math.round(POINTER_MAX_SCROLL * ratio));
}

function isSameInteractionScale(left: GanttTimeScale, right: GanttTimeScale): boolean {
	return (
		left.zoom === right.zoom &&
		left.timeZone === right.timeZone &&
		left.direction === right.direction &&
		left.definition.id === right.definition.id &&
		left.definition.unit === right.definition.unit &&
		left.definition.step === right.definition.step &&
		left.definition.minColumnWidth === right.definition.minColumnWidth &&
		left.canvasRange.start.getTime() === right.canvasRange.start.getTime() &&
		left.canvasRange.end.getTime() === right.canvasRange.end.getTime() &&
		left.pixelsPerMillisecond === right.pixelsPerMillisecond &&
		left.totalWidth === right.totalWidth
	);
}

function isTaskBodyPointerTarget(target: EventTarget | null): boolean {
	if (!(target instanceof Element)) return false;
	return !target.closest(
		'[data-gantt-chart-part="resize-handle"], [data-gantt-chart-part="progress-handle"], [data-gantt-chart-part="dependency-handle"]'
	);
}
