/* eslint-disable svelte/prefer-svelte-reactivity -- DOM registries and immutable gesture snapshots do not require reactive collections. */
import {
	disableNativeDragPreview,
	draggable,
	dropTargetForElements,
	monitorForElements,
	type ElementEventPayloadMap
} from '$lib/utils/pragmaticDragAndDrop.js';
import { untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import { createPointerDrag, type PointerDragPayload } from '$lib/utils/pointerDrag.js';
import {
	addCivilDays,
	assertRenderableDateOnly,
	civilDayDifference,
	getZonedDay,
	isSupportedDateDomainError,
	resolveZonedMinutesOnDay,
	snapInstant,
	startOfZonedDay
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	readEventCalendarExternalDragSource,
	type EventCalendarExternalDragSource
} from './eventCalendar.externalEvent.js';
import {
	acceptEventCalendarInteraction,
	pendingEventCalendarInteraction,
	rejectEventCalendarInteraction,
	type EventCalendarInteractionResolution
} from './eventCalendar.interactionResolution.js';
import {
	replaceEventCalendarPlacement,
	replaceEventCalendarSchedule
} from './eventCalendar.records.js';
import {
	replaceEventCalendarResourceAssignment,
	setEventCalendarResourceIds
} from './eventCalendar.resources.js';
import type {
	EventCalendarModelBoundary,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import type {
	EventCalendarDateOnly,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarMutationSource,
	EventCalendarOccurrence,
	EventCalendarProposedUpdate,
	EventCalendarScrollMode,
	EventCalendarSegment,
	EventCalendarSelection,
	EventCalendarSlot,
	EventCalendarView
} from './eventCalendar.types.js';

export type EventCalendarItemOperation = 'move' | 'resize-start' | 'resize-end';
type InvalidReason = EventCalendarInteractionBlockedInfo['reason'];

export type EventCalendarInteractionStatus<TItemFields extends object> =
	| {
			type: 'mode';
			source: 'keyboard' | 'single-pointer';
			operation: EventCalendarItemOperation;
			occurrence: EventCalendarOccurrence<TItemFields>;
	  }
	| {
			type: 'proposal';
			source: EventCalendarMutationSource;
			operation: EventCalendarItemOperation;
			occurrence: EventCalendarOccurrence<TItemFields>;
			proposal: EventCalendarProposedUpdate<TItemFields>;
	  }
	| {
			type: 'invalid';
			source: EventCalendarMutationSource | 'drag-create' | 'slot-click';
			reason: InvalidReason;
			proposal?: EventCalendarProposedUpdate<TItemFields>;
	  }
	| {
			type: 'commit' | 'revert';
			source: EventCalendarMutationSource;
			item?: EventCalendarItem<TItemFields>;
	  }
	| {
			type: 'cancel';
			source: EventCalendarMutationSource | 'drag-create';
			item?: EventCalendarItem<TItemFields>;
	  };

export type EventCalendarAssistedStep = {
	dayDelta?: number;
	minuteDelta?: number;
	resourceDirection?: -1 | 1;
};

export type EventCalendarDropTarget =
	| {
			key: string;
			view: EventCalendarView;
			allDay: true;
			day: EventCalendarDateOnly;
			resourceId?: string;
	  }
	| {
			key: string;
			view: EventCalendarView;
			allDay: false;
			start: Date;
			end: Date;
			resourceId?: string;
	  };

type EventCalendarItemGesture<TItemFields extends object> = {
	kind: EventCalendarItemOperation;
	initialKind: EventCalendarItemOperation;
	source: EventCalendarMutationSource;
	inputMode: 'pointer' | 'assisted';
	occurrence: EventCalendarOccurrence<TItemFields>;
	resolution: EventCalendarInteractionResolution<EventCalendarProposedUpdate<TItemFields>>;
	boundary: EventCalendarModelBoundary<TItemFields>;
	targetKey: string | null;
	grabOffsetMs: number;
	grabOffsetDays: number;
	pointerX: number;
	pointerY: number;
	sourceWidth?: number;
	sourceHeight?: number;
	sourceMinHeight?: number;
	isOverflowSource?: boolean;
	sourceResourceId?: string;
};

type EventCalendarSlotGesture<TItemFields extends object> = {
	kind: 'slot-create';
	source: 'drag-create' | 'keyboard' | 'single-pointer';
	inputMode: 'pointer' | 'assisted';
	anchor: EventCalendarSlot;
	resolution: EventCalendarInteractionResolution<EventCalendarSlot>;
	boundary: EventCalendarModelBoundary<TItemFields>;
	targetKey: string | null;
	pointerX: number;
	pointerY: number;
};

export type EventCalendarGesture<TItemFields extends object> =
	EventCalendarItemGesture<TItemFields> | EventCalendarSlotGesture<TItemFields> | null;

type InternalDragSource = {
	kind: 'internal';
	calendarInstanceId: string;
	occurrenceKey: string;
	operation: EventCalendarItemOperation;
	grabOffsetMs: number;
	grabOffsetDays: number;
	sourceWidth: number;
	sourceHeight: number;
	sourceMinHeight: number;
	isOverflowSource: boolean;
	view: EventCalendarView;
	sourceResourceId?: string;
};

type DragSource<TItemFields extends object> =
	InternalDragSource | EventCalendarExternalDragSource<TItemFields>;

export type EventCalendarDropIndicatorRect = Readonly<{
	left: number;
	top: number;
	width: number;
	height: number;
	clipPath?: string;
}>;

export type EventCalendarAllDayInsertion = Readonly<{
	occurrenceKey: string;
	start: EventCalendarDateOnly;
	end: EventCalendarDateOnly;
	sortStart: number;
	sortEnd: number;
	priority: number;
}>;

const SOURCE_MARK = 'svelai-event-calendar';
const EDGE_SCROLL_DISTANCE = 56;
const EDGE_SCROLL_MAX_PX = 18;
const MINUTE_MS = 60_000;

export class EventCalendarInteractionsController<
	TItemFields extends object,
	TResourceFields extends object
> {
	gesture = $state.raw<EventCalendarGesture<TItemFields>>(null);
	private monitorCleanup: (() => void) | null = null;
	private escapeCleanup: (() => void) | null = null;
	private nativeCancelCleanup: (() => void) | null = null;
	private didNativeCancel = false;
	private dragScrollElement: HTMLElement | null = null;
	private dragScrollMode: EventCalendarScrollMode = 'contained';
	private dragScrollFrame: number | null = null;
	private suppressedClickKey: string | null = null;
	private isSlotClickSuppressed = false;
	private targetElements = new Map<string, HTMLElement>();
	private itemDragFrame: number | null = null;
	private lastPublishedProposalKey: string | null = null;
	private pendingItemDrag: {
		fallbackTargetData: unknown;
		pointerX: number;
		pointerY: number;
	} | null = null;
	private externalGestureSequence = 0;

	constructor(private readonly calendar: EventCalendarState<TItemFields, TResourceFields>) {
		$effect.pre(() => {
			const nextBoundary = this.getBoundary();
			untrack(() => {
				if (this.gesture && this.hasBoundaryChanged(this.gesture.boundary, nextBoundary)) {
					this.cancel('stale');
				}
			});
		});
	}

	get instanceId(): string {
		return this.calendar.instanceId;
	}

	get proposal(): EventCalendarProposedUpdate<TItemFields> | null {
		return this.gesture && this.gesture.kind !== 'slot-create'
			? getResolutionProposal(this.gesture.resolution)
			: null;
	}

	get slot(): EventCalendarSlot | null {
		return this.gesture?.kind === 'slot-create'
			? getResolutionProposal(this.gesture.resolution)
			: null;
	}

	get isValid(): boolean | null {
		if (!this.gesture) return null;
		if (this.gesture.resolution.state === 'pending') return null;
		return this.gesture.resolution.state === 'accepted';
	}

	get status(): string {
		if (!this.gesture) return 'idle';
		return this.gesture.resolution.state === 'accepted'
			? `${this.gesture.kind}:valid`
			: this.gesture.resolution.state === 'rejected'
				? `${this.gesture.kind}:invalid`
				: `${this.gesture.kind}:pending`;
	}

	get isKeyboardSlotActive(): boolean {
		return (
			this.gesture?.kind === 'slot-create' &&
			this.gesture.source === 'keyboard' &&
			this.gesture.inputMode === 'assisted'
		);
	}

	mount(): void {
		if (this.monitorCleanup) return;
		this.monitorCleanup = monitorForElements({
			canMonitor: ({ source }) => this.readSource(source.data) !== null,
			onDragStart: (payload) => this.handleItemDragStart(payload),
			onDrag: (payload) => this.handleItemDrag(payload),
			onDropTargetChange: (payload) => this.handleItemDrag(payload),
			onDrop: (payload) => this.handleItemDrop(payload)
		});
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || !this.gesture) return;
			event.preventDefault();
			if (this.gesture) this.cancel();
			this.resetSinglePointerSlot();
		};
		document.addEventListener('keydown', handleKeydown);
		this.escapeCleanup = () => document.removeEventListener('keydown', handleKeydown);
		const handleDragEnd = (event: DragEvent) => {
			if (event.dataTransfer?.dropEffect === 'none') this.didNativeCancel = true;
		};
		window.addEventListener('dragend', handleDragEnd, true);
		this.nativeCancelCleanup = () => window.removeEventListener('dragend', handleDragEnd, true);
	}

	destroy(): void {
		this.cancel();
		this.cancelItemDragFrame();
		this.monitorCleanup?.();
		this.monitorCleanup = null;
		this.escapeCleanup?.();
		this.escapeCleanup = null;
		this.nativeCancelCleanup?.();
		this.nativeCancelCleanup = null;
	}

	cancel(reason?: 'stale'): void {
		const active = this.gesture;
		this.gesture = null;
		this.lastPublishedProposalKey = null;
		this.cancelItemDragFrame();
		this.stopDragAutoScroll();
		if (!active) return;
		if (!reason) {
			this.calendar.notifyInteractionStatus({
				type: 'cancel',
				source: active.source,
				item: active.kind === 'slot-create' ? undefined : active.occurrence.item
			});
			return;
		}
		this.reportBlocked({
			reason,
			source: active.source,
			proposal:
				active.kind === 'slot-create'
					? undefined
					: (getResolutionProposal(active.resolution) ?? undefined),
			slot:
				active.kind === 'slot-create'
					? (getResolutionProposal(active.resolution) ?? undefined)
					: undefined
		});
	}

	beginKeyboardSlot(target: EventCalendarDropTarget): boolean {
		if (
			this.calendar.disabled ||
			this.calendar.loading ||
			!this.calendar.interactions.selectSlot ||
			!this.calendar.interactions.keyboard
		) {
			return false;
		}
		this.resetSinglePointerSlot();
		if (this.gesture) this.cancel();
		const anchor = this.slotFromDropTarget(target);
		const reason = this.calendar.mutations.validateSlot(anchor);
		if (reason) {
			this.reportBlocked({ reason, source: 'keyboard', slot: anchor });
			return false;
		}
		this.gesture = {
			kind: 'slot-create',
			source: 'keyboard',
			inputMode: 'assisted',
			anchor,
			resolution: acceptEventCalendarInteraction(anchor),
			boundary: this.getBoundary(),
			targetKey: target.key,
			pointerX: 0,
			pointerY: 0
		};
		return true;
	}

	updateKeyboardSlot(target: EventCalendarDropTarget): boolean {
		const active = this.gesture;
		if (
			!active ||
			active.kind !== 'slot-create' ||
			active.source !== 'keyboard' ||
			target.allDay !== active.anchor.allDay
		) {
			return false;
		}
		const point = this.slotFromDropTarget(target);
		if (point.resourceId !== active.anchor.resourceId) {
			this.cancel();
			return true;
		}
		const slot = mergeSlots(active.anchor, point);
		const reason = this.calendar.mutations.validateSlot(slot);
		this.gesture = {
			...active,
			resolution: reason
				? rejectEventCalendarInteraction(reason, slot)
				: acceptEventCalendarInteraction(slot),
			targetKey: target.key
		};
		return true;
	}

	commitKeyboardSlot(): boolean {
		const active = this.gesture;
		if (!active || active.kind !== 'slot-create' || active.source !== 'keyboard') return false;
		if (this.isGestureStale()) {
			this.cancel('stale');
			return true;
		}
		this.gesture = null;
		const slot = getResolutionProposal(active.resolution);
		if (active.resolution.state !== 'accepted' || !slot) {
			this.reportBlocked({
				reason:
					active.resolution.state === 'rejected' ? active.resolution.reason : 'invalid-target',
				source: 'keyboard',
				slot: slot ?? active.anchor
			});
			return true;
		}
		this.calendar.select({ kind: 'slot', itemKey: null, slot });
		this.calendar.eventHandlers.onSelect?.({ slot, info: { source: 'keyboard' } });
		this.calendar.notifyInteractionStatus({ type: 'commit', source: 'keyboard' });
		return true;
	}

	selectSinglePointerSlot(slot: EventCalendarSlot): boolean {
		if (!this.calendar.interactions.singlePointer || !this.calendar.interactions.selectSlot) {
			this.resetSinglePointerSlot();
			return false;
		}
		const active = this.gesture;
		if (
			!active ||
			active.kind !== 'slot-create' ||
			active.source !== 'single-pointer' ||
			!areCompatibleSlots(active.anchor, slot)
		) {
			if (active) this.cancel();
			this.gesture = {
				kind: 'slot-create',
				source: 'single-pointer',
				inputMode: 'assisted',
				anchor: slot,
				resolution: acceptEventCalendarInteraction(slot),
				boundary: this.getBoundary(),
				targetKey: null,
				pointerX: 0,
				pointerY: 0
			};
			return false;
		}
		this.gesture = null;
		if (this.hasBoundaryChanged(active.boundary)) {
			this.reportBlocked({ reason: 'stale', source: 'single-pointer', slot });
			return true;
		}
		const range = mergeSlots(active.anchor, slot);
		const reason = this.calendar.mutations.validateSlot(range);
		if (reason) {
			this.reportBlocked({ reason, source: 'single-pointer', slot: range });
			return true;
		}
		this.calendar.select({ kind: 'slot', itemKey: null, slot: range });
		this.calendar.eventHandlers.onSelect?.({
			slot: range,
			info: { source: 'single-pointer' }
		});
		return true;
	}

	resetSinglePointerSlot(): void {
		if (this.gesture?.kind === 'slot-create' && this.gesture.source === 'single-pointer') {
			this.gesture = null;
		}
	}

	syncFocusedSlotSelection(target: EventCalendarDropTarget): void {
		this.syncFocusedSelection({
			kind: 'slot',
			itemKey: null,
			slot: this.slotFromDropTarget(target)
		});
	}

	syncFocusedItemSelection(itemKey: string): void {
		this.syncFocusedSelection({ kind: 'item', itemKey, slot: null });
	}

	clearFocusedSelection(): void {
		this.resetSinglePointerSlot();
		this.calendar.clearSelection();
	}

	private syncFocusedSelection(selection: EventCalendarSelection): void {
		if (this.calendar.selection.kind === null) return;
		this.resetSinglePointerSlot();
		this.calendar.select(selection);
	}

	shouldSuppressClick(occurrenceKey: string): boolean {
		return this.suppressedClickKey === occurrenceKey;
	}

	shouldSuppressSlotClick(): boolean {
		return this.isSlotClickSuppressed;
	}

	isDragging(occurrenceKey: string): boolean {
		return this.gesture?.kind !== 'slot-create' && this.gesture?.occurrence.key === occurrenceKey;
	}

	isDraggingFromOverflow(occurrenceKey: string): boolean {
		return (
			this.isDragging(occurrenceKey) &&
			this.gesture?.kind !== 'slot-create' &&
			this.gesture?.isOverflowSource === true
		);
	}

	canMove(occurrence: EventCalendarOccurrence<TItemFields>): boolean {
		return this.canBeginItemGesture(occurrence, 'move');
	}

	canResize(occurrence: EventCalendarOccurrence<TItemFields>): boolean {
		return this.canBeginItemGesture(occurrence, 'resize-start');
	}

	canBeginAssistedItem(
		occurrence: EventCalendarOccurrence<TItemFields>,
		operation: EventCalendarItemOperation,
		source: 'keyboard' | 'single-pointer'
	): boolean {
		const isModeEnabled =
			source === 'keyboard'
				? this.calendar.interactions.keyboard
				: this.calendar.interactions.singlePointer;
		return isModeEnabled && this.canBeginItemGesture(occurrence, operation);
	}

	beginAssistedItem(
		occurrence: EventCalendarOccurrence<TItemFields>,
		operation: EventCalendarItemOperation,
		source: 'keyboard' | 'single-pointer',
		sourceResourceId?: string
	): boolean {
		if (!this.canBeginAssistedItem(occurrence, operation, source)) return false;
		this.resetSinglePointerSlot();
		if (this.gesture) this.cancel();
		this.lastPublishedProposalKey = null;
		this.gesture = {
			kind: operation,
			initialKind: operation,
			source,
			inputMode: 'assisted',
			occurrence,
			resolution: pendingEventCalendarInteraction,
			boundary: this.getBoundary(),
			targetKey: null,
			grabOffsetMs: 0,
			grabOffsetDays: 0,
			pointerX: 0,
			pointerY: 0,
			sourceResourceId
		};
		this.calendar.notifyInteractionStatus({
			type: 'mode',
			source,
			operation,
			occurrence
		});
		return true;
	}

	stepAssistedItem(step: EventCalendarAssistedStep): boolean {
		const active = this.gesture;
		if (!active || active.kind === 'slot-create' || active.inputMode !== 'assisted') return false;
		if (this.isGestureStale()) {
			this.cancel('stale');
			return true;
		}
		const currentItem =
			getResolutionProposal(active.resolution)?.item ??
			this.calendar.mutations.getOccurrencePlacementItem(active.occurrence);
		const resourceTarget =
			active.kind === 'move' && step.resourceDirection
				? this.getAssistedResourceTarget(
						currentItem,
						active.sourceResourceId,
						step.resourceDirection
					)
				: null;
		let item: EventCalendarItem<TItemFields>;
		try {
			item = this.applyAssistedStep(currentItem, active.kind, step, active.sourceResourceId);
		} catch (error) {
			if (!isSupportedDateDomainError(error)) throw error;
			const next: EventCalendarItemGesture<TItemFields> = {
				...active,
				resolution:
					rejectEventCalendarInteraction<EventCalendarProposedUpdate<TItemFields>>('invalid-target')
			};
			this.gesture = next;
			this.publishProposal(next);
			return true;
		}
		const proposal: EventCalendarProposedUpdate<TItemFields> = {
			kind: active.kind,
			source: active.source,
			occurrence: active.occurrence,
			previousItem: active.occurrence.item,
			item
		};
		const reason = this.validateAssistedProposal(active, proposal);
		const next: EventCalendarItemGesture<TItemFields> = {
			...active,
			resolution: reason
				? rejectEventCalendarInteraction(reason, proposal)
				: acceptEventCalendarInteraction(proposal),
			...(resourceTarget ? { sourceResourceId: resourceTarget.resourceId } : {})
		};
		this.gesture = next;
		this.publishProposal(next);
		return true;
	}

	activateAssistedTarget(target: EventCalendarDropTarget): boolean {
		const active = this.gesture;
		if (
			!active ||
			active.kind === 'slot-create' ||
			active.inputMode !== 'assisted' ||
			active.source !== 'single-pointer'
		)
			return false;
		const proposal = this.deriveItemProposal(active, target, 0, Number.NaN);
		const reason = proposal ? this.validateAssistedProposal(active, proposal) : 'invalid-target';
		const next: EventCalendarItemGesture<TItemFields> = {
			...active,
			kind: proposal ? getProposalOperation(proposal, active.kind) : active.kind,
			resolution: proposal
				? reason
					? rejectEventCalendarInteraction(reason, proposal)
					: acceptEventCalendarInteraction(proposal)
				: rejectEventCalendarInteraction<EventCalendarProposedUpdate<TItemFields>>(
						'invalid-target'
					),
			targetKey: target.key
		};
		this.gesture = next;
		this.publishProposal(next);
		if (next.resolution.state === 'accepted') this.commitAssistedItem();
		return true;
	}

	activateAssistedPoint(pointerX: number, pointerY: number): boolean {
		const active = this.gesture;
		if (
			!active ||
			active.kind === 'slot-create' ||
			active.inputMode !== 'assisted' ||
			active.source !== 'single-pointer'
		)
			return false;
		const target = this.getTargetAt(pointerX, pointerY);
		if (target) return this.activateAssistedTarget(target);
		const next: EventCalendarItemGesture<TItemFields> = {
			...active,
			resolution:
				rejectEventCalendarInteraction<EventCalendarProposedUpdate<TItemFields>>('invalid-target'),
			targetKey: null,
			pointerX,
			pointerY
		};
		this.gesture = next;
		this.publishProposal(next);
		return true;
	}

	commitAssistedItem(): boolean {
		const active = this.gesture;
		if (!active || active.kind === 'slot-create' || active.inputMode !== 'assisted') return false;
		if (this.isGestureStale()) {
			this.cancel('stale');
			return true;
		}
		const proposal = getResolutionProposal(active.resolution);
		if (active.resolution.state !== 'accepted' || !proposal) {
			this.reportBlocked({
				reason:
					active.resolution.state === 'rejected' ? active.resolution.reason : 'invalid-target',
				source: active.source,
				proposal: proposal ?? undefined
			});
			return true;
		}
		const boundary = active.boundary;
		try {
			this.calendar.mutations.commitProposal(proposal, boundary);
		} finally {
			this.lastPublishedProposalKey = null;
			if (this.gesture?.boundary === boundary) {
				this.gesture = null;
			}
		}
		return true;
	}

	isInvalidTarget(key: string): boolean {
		return Boolean(
			this.gesture && this.gesture.resolution.state === 'rejected' && this.gesture.targetKey === key
		);
	}

	getDropIndicatorRect(): EventCalendarDropIndicatorRect | null {
		const gesture = this.gesture;
		if (
			typeof document === 'undefined' ||
			!gesture ||
			gesture.kind === 'slot-create' ||
			gesture.inputMode !== 'pointer' ||
			gesture.resolution.state !== 'accepted' ||
			!gesture.targetKey
		) {
			return null;
		}
		const targetElement = this.targetElements.get(gesture.targetKey);
		if (!targetElement?.isConnected) return null;
		const target = this.readElementTarget(targetElement);
		if (!target) return null;
		if (target.allDay && target.view !== 'resource' && gesture.kind === 'move') {
			return null;
		}
		const rect = target.allDay
			? this.getAllDayDropIndicatorRect(gesture, target, targetElement)
			: this.getTimedDropIndicatorRect(gesture, target, targetElement);
		return rect ? this.clipDropIndicatorRect(rect, targetElement) : null;
	}

	getAllDayInsertion(): EventCalendarAllDayInsertion | null {
		const gesture = this.gesture;
		if (
			typeof document === 'undefined' ||
			!gesture ||
			gesture.kind !== 'move' ||
			gesture.inputMode !== 'pointer' ||
			gesture.resolution.state !== 'accepted' ||
			!gesture.targetKey
		) {
			return null;
		}
		const targetElement = this.targetElements.get(gesture.targetKey);
		if (!targetElement?.isConnected) return null;
		const target = this.readElementTarget(targetElement);
		if (!target?.allDay || target.view === 'resource') return null;
		const item = gesture.resolution.proposal.item;
		const start =
			item.allDay === true ? item.start : getZonedDay(item.start, this.calendar.timeZone);
		const end =
			item.allDay === true
				? item.end
				: addCivilDays(
						getZonedDay(
							new Date(Math.max(item.start.getTime(), item.end.getTime() - 1)),
							this.calendar.timeZone
						),
						1
					);
		const sortStart =
			item.allDay === true
				? startOfZonedDay(item.start, this.calendar.timeZone).getTime()
				: item.start.getTime();
		const sortEnd =
			item.allDay === true
				? startOfZonedDay(item.end, this.calendar.timeZone).getTime()
				: item.end.getTime();
		return {
			occurrenceKey: gesture.occurrence.key,
			start,
			end,
			sortStart,
			sortEnd,
			priority: item.priority ?? 0
		};
	}

	isSlotDraftTarget(target: EventCalendarDropTarget): boolean {
		const slot = this.slot;
		if (!slot || slot.allDay !== target.allDay) return false;
		if (slot.resourceId !== target.resourceId) return false;
		if (slot.allDay && target.allDay) return target.day >= slot.start && target.day < slot.end;
		if (!slot.allDay && !target.allDay) {
			return target.start < slot.end && slot.start < target.end;
		}
		return false;
	}

	draggableItem(
		segment: EventCalendarSegment<TItemFields>,
		operation: EventCalendarItemOperation,
		view: EventCalendarView,
		sourceResourceId?: string
	): Attachment<HTMLElement> {
		const occurrence = segment.occurrence;
		return (element) =>
			untrack(() =>
				draggable({
					element,
					canDrag: () => this.canBeginItemGesture(occurrence, operation),
					onGenerateDragPreview: ({ nativeSetDragImage }) =>
						disableNativeDragPreview({ nativeSetDragImage }),
					getInitialData: ({ input }) => {
						const rect = element.getBoundingClientRect();
						const segmentDuration = segment.end.getTime() - segment.start.getTime();
						const segmentDayCount = occurrence.allDay
							? civilDayDifference(
									getZonedDay(segment.start, this.calendar.timeZone),
									getZonedDay(segment.end, this.calendar.timeZone)
								)
							: 0;
						const inlineRatio = Math.min(
							1,
							Math.max(0, (input.clientX - rect.left) / Math.max(1, rect.width))
						);
						const logicalRatio = this.calendar.direction === 'rtl' ? 1 - inlineRatio : inlineRatio;
						const segmentDayOffset = occurrence.allDay
							? civilDayDifference(
									getZonedDay(occurrence.start, this.calendar.timeZone),
									segment.day
								)
							: 0;
						return {
							mark: SOURCE_MARK,
							calendarInstanceId: this.instanceId,
							occurrenceKey: occurrence.key,
							operation,
							grabOffsetMs:
								operation === 'move' && !occurrence.allDay
									? segment.start.getTime() -
										occurrence.start.getTime() +
										Math.max(
											0,
											Math.min(
												segmentDuration,
												((input.clientY - rect.top) / Math.max(1, rect.height)) * segmentDuration
											)
										)
									: 0,
							grabOffsetDays:
								operation === 'move'
									? segmentDayOffset +
										Math.max(
											0,
											Math.min(
												Math.max(0, segmentDayCount - 1),
												Math.floor(logicalRatio * segmentDayCount)
											)
										)
									: 0,
							sourceWidth: rect.width,
							sourceHeight: rect.height,
							sourceMinHeight: Number.parseFloat(getComputedStyle(element).minHeight) || 0,
							isOverflowSource: Boolean(element.closest('[data-event-calendar-overflow-content]')),
							view,
							...(sourceResourceId === undefined ? {} : { sourceResourceId })
						};
					}
				})
			);
	}

	dropTarget(target: EventCalendarDropTarget): Attachment<HTMLElement> {
		return (element) =>
			untrack(() => {
				this.targetElements.set(target.key, element);
				const cleanup = dropTargetForElements({
					element,
					canDrop: ({ source }) =>
						this.readSource(source.data) !== null &&
						!this.calendar.disabled &&
						!this.calendar.loading,
					getData: () => ({
						mark: SOURCE_MARK,
						calendarInstanceId: this.instanceId,
						target
					})
				});
				return () => {
					cleanup();
					if (this.targetElements.get(target.key) === element)
						this.targetElements.delete(target.key);
				};
			});
	}

	slotDrag(target: EventCalendarDropTarget): Attachment<HTMLElement> {
		const pointerDrag = createPointerDrag({
			disabled: () =>
				this.calendar.disabled || this.calendar.loading || !this.calendar.interactions.selectSlot,
			activation: () => this.calendar.createActivation,
			frameCoalesced: true,
			stopPropagation: true,
			onStart: (payload) => {
				const origin = payload.startTarget;
				if (origin instanceof Element && origin.closest('[data-event-calendar-part="item"]')) {
					return false;
				}
				return this.beginSlotGesture(target, payload);
			},
			onMove: (payload) => this.updateSlotGesture(payload),
			onEnd: (payload) => this.finishSlotGesture(payload),
			onCancel: () => {
				if (
					this.gesture?.kind === 'slot-create' &&
					this.gesture.source === 'drag-create' &&
					this.gesture.inputMode === 'pointer'
				) {
					this.cancel();
				}
			}
		});
		return (element) =>
			untrack(() => {
				this.targetElements.set(target.key, element);
				const cleanup = pointerDrag(element);
				return () => {
					cleanup?.();
					if (this.targetElements.get(target.key) === element)
						this.targetElements.delete(target.key);
				};
			});
	}

	autoScroll(mode: EventCalendarScrollMode): Attachment<HTMLElement> {
		return (element) =>
			untrack(() => {
				this.dragScrollElement = element;
				this.dragScrollMode = mode;
				return () => {
					if (this.dragScrollElement !== element) return;
					this.dragScrollElement = null;
					this.stopDragAutoScroll();
				};
			});
	}

	private handleItemDragStart(payload: ElementEventPayloadMap['onDragStart']): void {
		const source = this.readSource(payload.source.data);
		if (!source) return;
		const isExternal = source.kind === 'external';
		if (isExternal) this.calendar.validateCandidateItems([source.item]);
		const occurrence = isExternal
			? this.createExternalOccurrence(source.item)
			: this.calendar.getOccurrence(source.occurrenceKey);
		const operation = isExternal ? 'move' : source.operation;
		if (!occurrence || (!isExternal && !this.canBeginItemGesture(occurrence, operation))) return;
		this.resetSinglePointerSlot();
		this.didNativeCancel = false;
		this.lastPublishedProposalKey = null;
		this.gesture = {
			kind: operation,
			initialKind: operation,
			source: isExternal ? 'external-drop' : this.operationSource(operation),
			inputMode: 'pointer',
			occurrence,
			resolution: pendingEventCalendarInteraction,
			boundary: this.getBoundary(),
			targetKey: null,
			grabOffsetMs: isExternal ? 0 : source.grabOffsetMs,
			grabOffsetDays: isExternal ? 0 : source.grabOffsetDays,
			pointerX: payload.location.current.input.clientX,
			pointerY: payload.location.current.input.clientY,
			...(isExternal
				? {}
				: {
						sourceWidth: source.sourceWidth,
						sourceHeight: source.sourceHeight,
						sourceMinHeight: source.sourceMinHeight,
						isOverflowSource: source.isOverflowSource,
						sourceResourceId: source.sourceResourceId
					})
		};
		if (!isExternal) this.startDragAutoScroll();
		this.updateItemGesture(payload);
	}

	private handleItemDrag(payload: ElementEventPayloadMap['onDrag']): void {
		const active = this.gesture;
		if (!active || active.kind === 'slot-create') return;
		const input = payload.location.current.input;
		const fallbackTargetData = this.findTargetData(payload.location.current.dropTargets);
		if (
			active.source === 'external-drop' &&
			!active.targetKey &&
			fallbackTargetData === undefined &&
			this.itemDragFrame === null
		)
			return;
		this.pendingItemDrag = {
			fallbackTargetData,
			pointerX: input.clientX,
			pointerY: input.clientY
		};
		if (this.itemDragFrame !== null) return;
		this.itemDragFrame = requestAnimationFrame(() => {
			this.itemDragFrame = null;
			const pending = this.pendingItemDrag;
			this.pendingItemDrag = null;
			if (!pending) return;
			const target =
				this.getTargetAt(pending.pointerX, pending.pointerY) ??
				deserializeTarget(pending.fallbackTargetData);
			this.updateItemGestureAt(target, pending.pointerX, pending.pointerY);
			const current = this.gesture;
			if (current && current.kind !== 'slot-create' && current.source !== 'external-drop') {
				this.startDragAutoScroll();
			}
		});
	}

	private handleItemDrop(payload: ElementEventPayloadMap['onDrop']): void {
		this.cancelItemDragFrame();
		this.stopDragAutoScroll();
		const active = this.gesture;
		if (!active || active.kind === 'slot-create') return;
		if (this.didNativeCancel) {
			this.lastPublishedProposalKey = null;
			if (active.source !== 'external-drop' || active.targetKey) {
				this.calendar.notifyInteractionStatus({
					type: 'cancel',
					source: active.source,
					item: active.occurrence.item
				});
			}
			this.gesture = null;
			this.suppressClick(active.occurrence.key);
			this.didNativeCancel = false;
			return;
		}
		this.updateItemGesture(payload);
		if (this.isGestureStale()) {
			this.cancel('stale');
			this.suppressClick(active.occurrence.key);
			return;
		}
		const current = this.gesture?.kind === 'slot-create' ? null : this.gesture;
		const proposal = current ? getResolutionProposal(current.resolution) : null;
		const isValid = current?.resolution.state === 'accepted';
		const reason =
			current?.resolution.state === 'rejected' ? current.resolution.reason : 'invalid-target';
		const targetKey = current?.targetKey ?? null;
		this.suppressClick(active.occurrence.key);
		if (!proposal || !isValid) {
			this.gesture = null;
			this.lastPublishedProposalKey = null;
			if (active.source === 'external-drop' && !targetKey) return;
			this.reportBlocked({
				reason,
				source: active.source,
				proposal: proposal ?? undefined
			});
			return;
		}
		const boundary = active.boundary;
		try {
			this.calendar.mutations.commitProposal(proposal, boundary);
		} finally {
			this.lastPublishedProposalKey = null;
			if (this.gesture?.boundary === boundary) {
				this.gesture = null;
			}
		}
	}

	private updateItemGesture(
		payload:
			| ElementEventPayloadMap['onDrag']
			| ElementEventPayloadMap['onDrop']
			| ElementEventPayloadMap['onDragStart']
	): void {
		const input = payload.location.current.input;
		const target =
			this.getTargetAt(input.clientX, input.clientY) ??
			this.readTarget(payload.location.current.dropTargets);
		this.updateItemGestureAt(target, input.clientX, input.clientY);
	}

	private updateItemGestureAt(
		target: EventCalendarDropTarget | null,
		pointerX: number,
		pointerY: number
	): void {
		const active = this.gesture;
		if (!active || active.kind === 'slot-create') return;
		if (active.source === 'external-drop') {
			if (target) this.startDragAutoScroll();
			else this.stopDragAutoScroll();
		}
		if (!target) {
			if (
				active.resolution.state === 'rejected' &&
				active.resolution.proposal === null &&
				active.targetKey === null &&
				active.resolution.reason === 'invalid-target'
			) {
				this.gesture = { ...active, pointerX, pointerY };
				return;
			}
			const next: EventCalendarItemGesture<TItemFields> = {
				...active,
				resolution:
					rejectEventCalendarInteraction<EventCalendarProposedUpdate<TItemFields>>(
						'invalid-target'
					),
				targetKey: null,
				pointerX,
				pointerY
			};
			this.gesture = next;
			if (active.source !== 'external-drop') this.publishProposal(next);
			return;
		}
		const proposal = this.deriveItemProposal(active, target, pointerX, pointerY);
		const operation = proposal ? getProposalOperation(proposal, active.kind) : active.kind;
		if (proposal && this.hasSameLiveProposal(active, proposal, operation)) {
			this.gesture = { ...active, pointerX, pointerY, targetKey: target.key };
			return;
		}
		const reason = proposal ? this.calendar.mutations.validateProposal(proposal) : 'invalid-target';
		this.gesture = {
			...active,
			kind: operation,
			source: proposal?.source ?? active.source,
			resolution: proposal
				? reason
					? rejectEventCalendarInteraction(reason, proposal)
					: acceptEventCalendarInteraction(proposal)
				: rejectEventCalendarInteraction('invalid-target'),
			targetKey: target.key,
			pointerX,
			pointerY
		};
		this.publishProposal(this.gesture);
	}

	private hasSameLiveProposal(
		active: EventCalendarItemGesture<TItemFields>,
		proposal: EventCalendarProposedUpdate<TItemFields>,
		operation: EventCalendarItemOperation
	): boolean {
		const current = getResolutionProposal(active.resolution);
		if (!current || active.kind !== operation || current.source !== proposal.source) return false;
		const currentItem = current.item;
		const nextItem = proposal.item;
		return (
			currentItem.id === nextItem.id &&
			(currentItem.allDay === true) === (nextItem.allDay === true) &&
			isSameEndpoint(currentItem.start, nextItem.start) &&
			isSameEndpoint(currentItem.end, nextItem.end) &&
			areStringArraysEqual(
				this.calendar.resourceModel.resolveItemLeafIds(currentItem),
				this.calendar.resourceModel.resolveItemLeafIds(nextItem)
			)
		);
	}

	private deriveItemProposal(
		gesture: EventCalendarItemGesture<TItemFields>,
		target: EventCalendarDropTarget,
		pointerX: number,
		pointerY: number
	): EventCalendarProposedUpdate<TItemFields> | null {
		const { occurrence } = gesture;
		const initialKind = gesture.initialKind;
		const sourceItem = occurrence.item;
		const sourceResourceIds = this.calendar.resourceModel.resolveItemLeafIds(sourceItem);
		if (
			initialKind !== 'move' &&
			target.view === 'resource' &&
			(target.resourceId === undefined
				? sourceResourceIds.length !== 0
				: !sourceResourceIds.includes(target.resourceId))
		) {
			return null;
		}
		const placementItem = this.calendar.mutations.getOccurrencePlacementItem(occurrence);
		if (
			gesture.source === 'external-drop' &&
			sourceItem.recurrence !== undefined &&
			target.allDay !== occurrence.allDay
		) {
			return null;
		}
		const isTimedMonthResize =
			initialKind !== 'move' && target.allDay && target.view === 'month' && !occurrence.allDay;
		if (initialKind !== 'move' && target.allDay !== occurrence.allDay && !isTimedMonthResize) {
			return null;
		}
		let operation = initialKind;
		let item: EventCalendarItem<TItemFields>;
		try {
			if (initialKind === 'move') {
				item =
					target.allDay && target.view === 'month' && !occurrence.allDay
						? this.moveTimedToMonthDay(placementItem, occurrence, target.day)
						: target.allDay
							? this.moveToAllDay(placementItem, occurrence, target.day, gesture.grabOffsetDays)
							: this.moveToTimed(placementItem, occurrence, target, pointerY, gesture.grabOffsetMs);
			} else if (isTimedMonthResize) {
				const sourceEndpoint = initialKind === 'resize-start' ? occurrence.start : occurrence.end;
				let endpoint = resolveZonedMinutesOnDay(
					target.day,
					getWallMinutes(sourceEndpoint, this.calendar.timeZone),
					this.calendar.timeZone
				);
				let resize = this.resizeTimedAcrossEdge(placementItem, initialKind, endpoint);
				if (resize.operation !== initialKind) {
					const oppositeEndpoint =
						resize.operation === 'resize-start' ? occurrence.start : occurrence.end;
					endpoint = resolveZonedMinutesOnDay(
						target.day,
						getWallMinutes(oppositeEndpoint, this.calendar.timeZone),
						this.calendar.timeZone
					);
					resize = this.resizeTimedAcrossEdge(placementItem, initialKind, endpoint);
				}
				operation = resize.operation;
				item = resize.item;
			} else if (target.allDay) {
				const resize = this.resizeAllDayAcrossEdge(placementItem, initialKind, target.day);
				operation = resize.operation;
				item = resize.item;
			} else {
				const endpoint = this.getTimedTargetInstant(target, pointerY);
				const resize = this.resizeTimedAcrossEdge(placementItem, initialKind, endpoint);
				operation = resize.operation;
				item = resize.item;
			}
		} catch (error) {
			if (isSupportedDateDomainError(error)) return null;
			throw error;
		}
		if (gesture.source === 'external-drop' && target.allDay === occurrence.allDay) {
			item = replaceEventCalendarPlacement(placementItem, {
				allDay: item.allDay === true,
				start: item.start,
				end: item.end
			});
		}
		if (initialKind === 'move') {
			item =
				gesture.source === 'external-drop' && target.view === 'resource'
					? setEventCalendarResourceIds(item, target.resourceId ? [target.resourceId] : [])
					: applyTargetResource(item, target, gesture.sourceResourceId);
		}
		return {
			kind: operation,
			source:
				gesture.source === 'external-drop'
					? gesture.source
					: gesture.inputMode === 'pointer'
						? this.operationSource(operation)
						: gesture.source,
			occurrence,
			previousItem: sourceItem,
			item
		};
	}

	private moveTimedToMonthDay(
		item: EventCalendarItem<TItemFields>,
		occurrence: EventCalendarOccurrence<TItemFields>,
		day: EventCalendarDateOnly
	): EventCalendarItem<TItemFields> {
		const start = resolveZonedMinutesOnDay(
			day,
			getWallMinutes(occurrence.start, this.calendar.timeZone),
			this.calendar.timeZone
		);
		return replaceEventCalendarSchedule(item, {
			allDay: false,
			start,
			end: new Date(start.getTime() + occurrence.end.getTime() - occurrence.start.getTime())
		});
	}

	private moveToAllDay(
		item: EventCalendarItem<TItemFields>,
		occurrence: EventCalendarOccurrence<TItemFields>,
		targetDay: EventCalendarDateOnly,
		grabOffsetDays: number
	): EventCalendarItem<TItemFields> {
		const start = addCivilDays(targetDay, -grabOffsetDays);
		const durationDays =
			occurrence.allDay && this.calendar.interactions.maintainDurationOnAllDayChange
				? Math.max(
						1,
						civilDayDifference(
							getZonedDay(occurrence.start, this.calendar.timeZone),
							getZonedDay(occurrence.end, this.calendar.timeZone)
						)
					)
				: occurrence.allDay
					? Math.max(
							1,
							civilDayDifference(
								item.start as EventCalendarDateOnly,
								item.end as EventCalendarDateOnly
							)
						)
					: this.calendar.interactions.maintainDurationOnAllDayChange
						? touchedCivilDayCount(
								occurrence,
								this.calendar.mutations.getConversionDurationTimeZone(occurrence)
							)
						: this.calendar.defaultAllDayItemDuration;
		return replaceEventCalendarSchedule(item, {
			allDay: true,
			start,
			end: addCivilDays(start, durationDays)
		});
	}

	private moveToTimed(
		item: EventCalendarItem<TItemFields>,
		occurrence: EventCalendarOccurrence<TItemFields>,
		target: Extract<EventCalendarDropTarget, { allDay: false }>,
		pointerY: number,
		grabOffsetMs: number
	): EventCalendarItem<TItemFields> {
		const pointer = this.getTimedTargetInstant(target, pointerY);
		const start = snapInstant(
			new Date(pointer.getTime() - grabOffsetMs),
			this.calendar.timeZone,
			this.calendar.snapDuration
		);
		let durationMs: number;
		if (!occurrence.allDay) durationMs = occurrence.end.getTime() - occurrence.start.getTime();
		else if (!this.calendar.interactions.maintainDurationOnAllDayChange) {
			durationMs = this.calendar.defaultTimedItemDuration * MINUTE_MS;
		} else {
			const conversionTimeZone = this.calendar.mutations.getConversionDurationTimeZone(occurrence);
			const days = Math.max(
				1,
				civilDayDifference(item.start as EventCalendarDateOnly, item.end as EventCalendarDateOnly)
			);
			const endDay = addCivilDays(getZonedDay(start, conversionTimeZone), days);
			const parts = getWallMinutes(start, conversionTimeZone);
			durationMs =
				resolveZonedMinutesOnDay(endDay, parts, conversionTimeZone).getTime() - start.getTime();
		}
		return replaceEventCalendarSchedule(item, {
			allDay: false,
			start,
			end: new Date(start.getTime() + durationMs)
		});
	}

	private resizeAllDayAcrossEdge(
		item: EventCalendarItem<TItemFields>,
		initialKind: Exclude<EventCalendarItemOperation, 'move'>,
		targetDay: EventCalendarDateOnly
	): {
		operation: Exclude<EventCalendarItemOperation, 'move'>;
		item: EventCalendarItem<TItemFields>;
	} {
		if (item.allDay !== true) return { operation: initialKind, item };
		const crossingBoundary = initialKind === 'resize-start' ? item.end : item.start;
		const operation = targetDay < crossingBoundary ? 'resize-start' : 'resize-end';
		const start = operation === 'resize-start' ? targetDay : item.start;
		const end = operation === 'resize-end' ? addCivilDays(targetDay, 1) : item.end;
		return {
			operation,
			item: replaceEventCalendarSchedule(item, { allDay: true, start, end })
		};
	}

	private resizeTimedAcrossEdge(
		item: EventCalendarItem<TItemFields>,
		initialKind: Exclude<EventCalendarItemOperation, 'move'>,
		endpoint: Date
	): {
		operation: Exclude<EventCalendarItemOperation, 'move'>;
		item: EventCalendarItem<TItemFields>;
	} {
		if (item.allDay === true) return { operation: initialKind, item };
		const crossingBoundary = initialKind === 'resize-start' ? item.end : item.start;
		const endpointTime = endpoint.getTime();
		const crossingTime = crossingBoundary.getTime();
		const operation =
			endpointTime < crossingTime
				? 'resize-start'
				: endpointTime > crossingTime
					? 'resize-end'
					: initialKind;
		return {
			operation,
			item: replaceEventCalendarSchedule(item, {
				allDay: false,
				start: operation === 'resize-start' ? endpoint : item.start,
				end: operation === 'resize-end' ? endpoint : item.end
			})
		};
	}

	private getTimedTargetInstant(
		target: Extract<EventCalendarDropTarget, { allDay: false }>,
		pointerY: number
	): Date {
		if (!Number.isFinite(pointerY)) return new Date(target.start);
		const element = this.targetElements.get(target.key);
		const rect = element?.getBoundingClientRect();
		const ratio = rect
			? Math.min(1, Math.max(0, (pointerY - rect.top) / Math.max(1, rect.height)))
			: 0;
		const instant = new Date(
			target.start.getTime() + (target.end.getTime() - target.start.getTime()) * ratio
		);
		return snapInstant(instant, this.calendar.timeZone, this.calendar.snapDuration);
	}

	private beginSlotGesture(target: EventCalendarDropTarget, payload: PointerDragPayload): boolean {
		this.resetSinglePointerSlot();
		const anchor = this.slotFromTarget(target, payload.y);
		const reason = this.calendar.mutations.validateSlot(anchor);
		this.gesture = {
			kind: 'slot-create',
			source: 'drag-create',
			inputMode: 'pointer',
			anchor,
			resolution: reason
				? rejectEventCalendarInteraction(reason, anchor)
				: acceptEventCalendarInteraction(anchor),
			boundary: this.getBoundary(),
			targetKey: target.key,
			pointerX: payload.x,
			pointerY: payload.y
		};
		if (this.isGestureStale()) {
			this.cancel('stale');
			return false;
		}
		this.startDragAutoScroll();
		return true;
	}

	private updateSlotGesture(payload: PointerDragPayload): void {
		this.updateSlotAtPointer(payload.x, payload.y);
		this.startDragAutoScroll();
	}

	private updateSlotAtPointer(pointerX: number, pointerY: number): void {
		const active = this.gesture;
		if (!active || active.kind !== 'slot-create') return;
		const target = this.getTargetAt(pointerX, pointerY);
		if (
			!target ||
			target.allDay !== active.anchor.allDay ||
			target.resourceId !== active.anchor.resourceId
		) {
			if (
				active.targetKey === null &&
				active.resolution.state === 'rejected' &&
				active.resolution.reason === 'invalid-target'
			) {
				this.gesture = { ...active, pointerX, pointerY };
				return;
			}
			this.gesture = {
				...active,
				targetKey: null,
				resolution: rejectEventCalendarInteraction<EventCalendarSlot>('invalid-target'),
				pointerX,
				pointerY
			};
			return;
		}
		const point = this.slotFromTarget(target, pointerY);
		const slot = mergeSlots(active.anchor, point);
		if (areSlotsEqual(getResolutionProposal(active.resolution) ?? active.anchor, slot)) {
			this.gesture = { ...active, pointerX, pointerY, targetKey: target.key };
			return;
		}
		const reason = this.calendar.mutations.validateSlot(slot);
		this.gesture = {
			...active,
			resolution: reason
				? rejectEventCalendarInteraction(reason, slot)
				: acceptEventCalendarInteraction(slot),
			targetKey: target.key,
			pointerX,
			pointerY
		};
	}

	private finishSlotGesture(payload: PointerDragPayload): void {
		this.suppressSlotClick();
		this.updateSlotAtPointer(payload.x, payload.y);
		if (this.isGestureStale()) {
			this.cancel('stale');
			return;
		}
		const active = this.gesture;
		this.gesture = null;
		this.stopDragAutoScroll();
		if (!active || active.kind !== 'slot-create') return;
		const slot = getResolutionProposal(active.resolution);
		if (active.resolution.state !== 'accepted' || !slot) {
			this.reportBlocked({
				reason:
					active.resolution.state === 'rejected' ? active.resolution.reason : 'invalid-target',
				source: active.source,
				slot: slot ?? active.anchor
			});
			return;
		}
		this.calendar.select({ kind: 'slot', itemKey: null, slot });
		this.calendar.eventHandlers.onSelect?.({ slot, info: { source: 'drag-create' } });
	}

	private slotFromDropTarget(target: EventCalendarDropTarget): EventCalendarSlot {
		return target.allDay
			? {
					view: target.view,
					allDay: true,
					start: target.day,
					end: addCivilDays(target.day, 1),
					resourceId: target.resourceId
				}
			: {
					view: target.view,
					allDay: false,
					start: new Date(target.start),
					end: new Date(target.end),
					resourceId: target.resourceId
				};
	}

	private slotFromTarget(target: EventCalendarDropTarget, pointerY: number): EventCalendarSlot {
		if (target.allDay) {
			return {
				view: target.view,
				allDay: true,
				start: target.day,
				end: addCivilDays(target.day, 1),
				resourceId: target.resourceId
			};
		}
		const minimumDuration = this.calendar.snapDuration * MINUTE_MS;
		const start = new Date(
			Math.max(
				target.start.getTime(),
				Math.min(
					this.getTimedTargetInstant(target, pointerY).getTime(),
					target.end.getTime() - minimumDuration
				)
			)
		);
		return {
			view: target.view,
			allDay: false,
			start,
			end: new Date(start.getTime() + minimumDuration),
			resourceId: target.resourceId
		};
	}

	private createExternalOccurrence(
		item: EventCalendarItem<TItemFields>
	): EventCalendarOccurrence<TItemFields> {
		this.externalGestureSequence += 1;
		return {
			key: `external:${this.instanceId}:${this.externalGestureSequence}:${item.id}`,
			item,
			start:
				item.allDay === true ? startOfZonedDay(item.start, this.calendar.timeZone) : item.start,
			end: item.allDay === true ? startOfZonedDay(item.end, this.calendar.timeZone) : item.end,
			allDay: item.allDay === true,
			isRecurring: item.recurrence !== undefined,
			originalStart: item.start instanceof Date ? new Date(item.start) : item.start
		};
	}

	private validateAssistedProposal(
		gesture: EventCalendarItemGesture<TItemFields>,
		proposal: EventCalendarProposedUpdate<TItemFields>
	): InvalidReason | null {
		const baseline = this.calendar.mutations.getOccurrencePlacementItem(gesture.occurrence);
		if (this.hasSamePlacement(baseline, proposal.item)) return 'invalid-target';
		return this.calendar.mutations.validateProposal(proposal);
	}

	private hasSamePlacement(
		baseline: EventCalendarItem<TItemFields>,
		candidate: EventCalendarItem<TItemFields>
	): boolean {
		return (
			(baseline.allDay === true) === (candidate.allDay === true) &&
			isSameEndpoint(baseline.start, candidate.start) &&
			isSameEndpoint(baseline.end, candidate.end) &&
			areStringArraysEqual(
				this.calendar.resourceModel.resolveItemLeafIds(baseline),
				this.calendar.resourceModel.resolveItemLeafIds(candidate)
			)
		);
	}

	private canBeginItemGesture(
		occurrence: EventCalendarOccurrence<TItemFields>,
		operation: EventCalendarItemOperation
	): boolean {
		const item = occurrence.item;
		if (
			this.calendar.disabled ||
			this.calendar.loading ||
			item.display === 'background' ||
			item.readOnly ||
			this.calendar.resourceModel
				.resolveItemLeafIds(item)
				.some((resourceId) => this.calendar.resourceModel.isReadOnly(resourceId))
		)
			return false;
		if (
			(occurrence.isRecurring || item.recurringItemId !== undefined) &&
			this.calendar.recurrenceEditScope === 'disabled'
		)
			return false;
		if (operation === 'move') return this.calendar.interactions.drag && item.draggable !== false;
		return this.calendar.interactions.resize && item.resizable !== false;
	}

	private applyAssistedStep(
		item: EventCalendarItem<TItemFields>,
		operation: EventCalendarItemOperation,
		step: EventCalendarAssistedStep,
		sourceResourceId?: string
	): EventCalendarItem<TItemFields> {
		let next = item;
		const dayDelta = step.dayDelta ?? 0;
		const minuteDelta = step.minuteDelta ?? 0;
		const shouldShiftStart = operation !== 'resize-end';
		const shouldShiftEnd = operation !== 'resize-start';
		if (next.allDay === true) {
			next = replaceEventCalendarPlacement(next, {
				allDay: true,
				start: shouldShiftStart ? addCivilDays(next.start, dayDelta) : next.start,
				end: shouldShiftEnd ? addCivilDays(next.end, dayDelta) : next.end
			});
		} else {
			if (operation === 'move') {
				const duration = next.end.getTime() - next.start.getTime();
				const start = this.shiftTimedEndpoint(next.start, dayDelta, minuteDelta);
				next = replaceEventCalendarPlacement(next, {
					allDay: false,
					start,
					end: new Date(start.getTime() + duration)
				});
			} else {
				next = replaceEventCalendarPlacement(next, {
					allDay: false,
					start: shouldShiftStart
						? this.shiftTimedEndpoint(next.start, dayDelta, minuteDelta)
						: next.start,
					end: shouldShiftEnd ? this.shiftTimedEndpoint(next.end, dayDelta, minuteDelta) : next.end
				});
			}
		}
		if (operation !== 'move' || !step.resourceDirection) return next;
		const columns = this.calendar.resourceModel.columns;
		const currentId =
			this.calendar.resourceModel.resolveLeafId(sourceResourceId) ??
			this.calendar.resourceModel.resolveItemLeafIds(next)[0];
		const currentIndex = columns.findIndex((column) => column.resourceId === currentId);
		const target = columns[currentIndex + step.resourceDirection];
		if (!target) return next;
		return replaceEventCalendarResourceAssignment(next, currentId, target.resourceId);
	}

	private getAssistedResourceTarget(
		item: EventCalendarItem<TItemFields>,
		sourceResourceId: string | undefined,
		direction: -1 | 1
	): { resourceId: string | undefined } | null {
		const columns = this.calendar.resourceModel.columns;
		const currentId =
			this.calendar.resourceModel.resolveLeafId(sourceResourceId) ??
			this.calendar.resourceModel.resolveItemLeafIds(item)[0];
		const currentIndex = columns.findIndex((column) => column.resourceId === currentId);
		const target = columns[currentIndex + direction];
		return target ? { resourceId: target.resourceId } : null;
	}

	private shiftTimedEndpoint(endpoint: Date, dayDelta: number, minuteDelta: number): Date {
		const shifted = new Date(endpoint.getTime() + minuteDelta * MINUTE_MS);
		if (dayDelta === 0) return shifted;
		return resolveZonedMinutesOnDay(
			addCivilDays(getZonedDay(shifted, this.calendar.timeZone), dayDelta),
			getWallMinutes(shifted, this.calendar.timeZone),
			this.calendar.timeZone
		);
	}

	private publishProposal(gesture: EventCalendarItemGesture<TItemFields>): void {
		const statusKey = this.getProposalStatusKey(gesture);
		if (statusKey === this.lastPublishedProposalKey) return;
		this.lastPublishedProposalKey = statusKey;
		const proposal = getResolutionProposal(gesture.resolution);
		if (gesture.resolution.state !== 'accepted' || !proposal) {
			this.calendar.notifyInteractionStatus({
				type: 'invalid',
				source: gesture.source,
				reason:
					gesture.resolution.state === 'rejected' ? gesture.resolution.reason : 'invalid-target',
				proposal: proposal ?? undefined
			});
			return;
		}
		this.calendar.notifyInteractionStatus({
			type: 'proposal',
			source: gesture.source,
			operation: gesture.kind,
			occurrence: gesture.occurrence,
			proposal
		});
	}

	private getProposalStatusKey(gesture: EventCalendarItemGesture<TItemFields>): string {
		const proposal = getResolutionProposal(gesture.resolution);
		if (gesture.resolution.state !== 'accepted' || !proposal) {
			return gesture.resolution.state === 'rejected'
				? `invalid:${gesture.resolution.reason}`
				: 'pending';
		}
		const item = proposal.item;
		return [
			'proposal',
			gesture.kind,
			item.allDay === true ? 'all-day' : 'timed',
			getEndpointKey(item.start),
			getEndpointKey(item.end),
			this.calendar.resourceModel.resolveItemLeafIds(item).join(',') || 'unassigned'
		].join(':');
	}

	private operationSource(operation: EventCalendarItemOperation): EventCalendarMutationSource {
		return operation === 'move' ? 'drag' : operation;
	}

	private readSource(data: Record<string, unknown>): DragSource<TItemFields> | null {
		const externalSource = readEventCalendarExternalDragSource<TItemFields>(data);
		if (externalSource) return externalSource;
		if (data.mark !== SOURCE_MARK || data.calendarInstanceId !== this.instanceId) return null;
		if (typeof data.occurrenceKey !== 'string') return null;
		if (
			data.operation !== 'move' &&
			data.operation !== 'resize-start' &&
			data.operation !== 'resize-end'
		)
			return null;
		return {
			kind: 'internal',
			calendarInstanceId: this.instanceId,
			occurrenceKey: data.occurrenceKey,
			operation: data.operation,
			grabOffsetMs: typeof data.grabOffsetMs === 'number' ? data.grabOffsetMs : 0,
			grabOffsetDays: typeof data.grabOffsetDays === 'number' ? data.grabOffsetDays : 0,
			sourceWidth: readPositiveNumber(data.sourceWidth, 1),
			sourceHeight: readPositiveNumber(data.sourceHeight, 1),
			sourceMinHeight: readPositiveNumber(data.sourceMinHeight, 0),
			isOverflowSource: data.isOverflowSource === true,
			view: isEventCalendarView(data.view) ? data.view : this.calendar.view,
			...(typeof data.sourceResourceId === 'string'
				? { sourceResourceId: data.sourceResourceId }
				: {})
		};
	}

	private readTarget(
		dropTargets: ElementEventPayloadMap['onDrag']['location']['current']['dropTargets']
	): EventCalendarDropTarget | null {
		return deserializeTarget(this.findTargetData(dropTargets));
	}

	private findTargetData(
		dropTargets: ElementEventPayloadMap['onDrag']['location']['current']['dropTargets']
	): unknown {
		for (const record of dropTargets) {
			if (record.data.mark !== SOURCE_MARK || record.data.calendarInstanceId !== this.instanceId)
				continue;
			return record.data.target;
		}
		return undefined;
	}

	private getTimedDropIndicatorRect(
		gesture: EventCalendarItemGesture<TItemFields>,
		target: Extract<EventCalendarDropTarget, { allDay: false }>,
		element: HTMLElement
	): EventCalendarDropIndicatorRect | null {
		const item = getResolutionProposal(gesture.resolution)?.item;
		if (!item || item.allDay === true) return null;
		const rect = element.getBoundingClientRect();
		const slotDuration = target.end.getTime() - target.start.getTime();
		const proposalDuration = item.end.getTime() - item.start.getTime();
		if (slotDuration <= 0 || proposalDuration <= 0 || rect.height <= 0 || rect.width <= 0) {
			return null;
		}
		const pixelsPerMillisecond = rect.height / slotDuration;
		const top = rect.top + (item.start.getTime() - target.start.getTime()) * pixelsPerMillisecond;
		const height = Math.max(
			gesture.sourceMinHeight ?? 0,
			proposalDuration * pixelsPerMillisecond,
			2
		);
		const width = Math.max(2, rect.width - 4);
		return {
			left: rect.left + (rect.width - width) / 2,
			top,
			width,
			height
		};
	}

	private getAllDayDropIndicatorRect(
		gesture: EventCalendarItemGesture<TItemFields>,
		target: Extract<EventCalendarDropTarget, { allDay: true }>,
		fallbackElement: HTMLElement
	): EventCalendarDropIndicatorRect | null {
		const item = getResolutionProposal(gesture.resolution)?.item;
		if (!item || (item.allDay !== true && target.view !== 'month')) return null;
		const anchorDay =
			item.allDay === true ? item.start : getZonedDay(item.start, this.calendar.timeZone);
		const anchorElement = this.findAllDayTargetElement(
			target.view,
			anchorDay,
			gesture.sourceResourceId ?? this.calendar.resourceModel.resolveItemLeafIds(item)[0]
		);
		const element = anchorElement ?? fallbackElement;
		const rect = element.getBoundingClientRect();
		if (rect.height <= 0 || rect.width <= 0) return null;
		const parentRect = element.parentElement?.getBoundingClientRect() ?? rect;
		const dayCount =
			item.allDay === true
				? Math.max(1, civilDayDifference(item.start, item.end))
				: touchedInstantDayCount(item.start, item.end, this.calendar.timeZone);
		const proposedWidth = Math.max(2, dayCount * rect.width - 4);
		const sourceWidth = gesture.sourceWidth ?? proposedWidth;
		const shouldPreserveSourceWidth = gesture.kind === 'move';
		const inlineInset = target.view === 'month' ? 6 : 2;
		const availableWidth = Math.max(2, parentRect.width - inlineInset * 2);
		const width = Math.min(shouldPreserveSourceWidth ? sourceWidth : proposedWidth, availableWidth);
		const height = Math.min(
			Math.max(2, gesture.sourceHeight ?? gesture.sourceMinHeight ?? 24),
			Math.max(2, rect.height - 4)
		);
		const logicalStart =
			this.calendar.direction === 'rtl'
				? rect.right - width - inlineInset
				: rect.left + inlineInset;
		const minimumLeft = parentRect.left + inlineInset;
		const maximumLeft = Math.max(minimumLeft, parentRect.right - width - inlineInset);
		const topOffset =
			target.view === 'month' ? Math.min(28, Math.max(2, rect.height - height - 2)) : 2;
		return {
			left: Math.min(maximumLeft, Math.max(minimumLeft, logicalStart)),
			top: rect.top + topOffset,
			width,
			height
		};
	}

	private clipDropIndicatorRect(
		rect: EventCalendarDropIndicatorRect,
		targetElement: HTMLElement
	): EventCalendarDropIndicatorRect {
		const root = targetElement.closest<HTMLElement>('[data-event-calendar-part="root"]');
		if (!root) return rect;
		const rootRect = root.getBoundingClientRect();
		let clipLeft = rootRect.left + root.clientLeft;
		let clipTop = rootRect.top + root.clientTop;
		let clipRight = clipLeft + root.clientWidth;
		let clipBottom = clipTop + root.clientHeight;
		const dayColumn = targetElement.closest<HTMLElement>('[data-event-calendar-part="day-column"]');
		if (dayColumn) {
			const columnRect = dayColumn.getBoundingClientRect();
			clipLeft = Math.max(clipLeft, columnRect.left);
			clipTop = Math.max(clipTop, columnRect.top);
			clipRight = Math.min(clipRight, columnRect.right);
			clipBottom = Math.min(clipBottom, columnRect.bottom);
			if (
				this.dragScrollMode === 'contained' &&
				this.dragScrollElement?.isConnected &&
				this.dragScrollElement.contains(targetElement)
			) {
				const viewportRect = this.dragScrollElement.getBoundingClientRect();
				clipLeft = Math.max(clipLeft, viewportRect.left);
				clipTop = Math.max(clipTop, viewportRect.top);
				clipRight = Math.min(clipRight, viewportRect.right);
				clipBottom = Math.min(clipBottom, viewportRect.bottom);
			}
		}
		const topInset = Math.max(0, clipTop - rect.top);
		const rightInset = Math.max(0, rect.left + rect.width - clipRight);
		const bottomInset = Math.max(0, rect.top + rect.height - clipBottom);
		const leftInset = Math.max(0, clipLeft - rect.left);
		return {
			...rect,
			clipPath: `inset(${topInset}px ${rightInset}px ${bottomInset}px ${leftInset}px)`
		};
	}

	private findAllDayTargetElement(
		view: EventCalendarView,
		day: EventCalendarDateOnly,
		resourceId?: string
	): HTMLElement | null {
		for (const element of this.targetElements.values()) {
			if (!element.isConnected) continue;
			const target = this.readElementTarget(element);
			if (
				target?.allDay &&
				target.view === view &&
				target.day === day &&
				(view !== 'resource' || target.resourceId === resourceId)
			) {
				return element;
			}
		}
		return null;
	}

	private readElementTarget(element: HTMLElement): EventCalendarDropTarget | null {
		const encoded = element.dataset.eventCalendarTarget;
		if (!encoded) return null;
		try {
			return deserializeTarget(JSON.parse(encoded));
		} catch {
			return null;
		}
	}

	private getTargetAt(x: number, y: number): EventCalendarDropTarget | null {
		for (const hit of document.elementsFromPoint(x, y)) {
			if (!(hit instanceof HTMLElement) || !hit.matches('[data-event-calendar-target]')) continue;
			const element = hit;
			if (element.dataset.calendarInstanceId !== this.instanceId) continue;
			const rect = element.getBoundingClientRect();
			if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) continue;
			const target = this.readElementTarget(element);
			if (target) return target;
		}
		return null;
	}

	private getBoundary(): EventCalendarModelBoundary<TItemFields> {
		return this.calendar.modelBoundary;
	}

	private hasBoundaryChanged(
		boundary: EventCalendarModelBoundary<TItemFields>,
		next = this.getBoundary()
	): boolean {
		return boundary !== next;
	}

	private isGestureStale(): boolean {
		return this.gesture !== null && this.hasBoundaryChanged(this.gesture.boundary);
	}

	private reportBlocked(info: EventCalendarInteractionBlockedInfo<TItemFields>): void {
		this.calendar.eventHandlers.onInteractionBlocked?.(info);
		this.calendar.notifyInteractionStatus({
			type: 'invalid',
			source: info.source,
			reason: info.reason,
			proposal: info.proposal
		});
	}

	private suppressClick(key: string): void {
		this.suppressedClickKey = key;
		window.setTimeout(() => {
			if (this.suppressedClickKey === key) this.suppressedClickKey = null;
		}, 0);
	}

	private suppressSlotClick(): void {
		this.isSlotClickSuppressed = true;
		window.setTimeout(() => {
			this.isSlotClickSuppressed = false;
		}, 0);
	}

	private cancelItemDragFrame(): void {
		if (this.itemDragFrame !== null) cancelAnimationFrame(this.itemDragFrame);
		this.itemDragFrame = null;
		this.pendingItemDrag = null;
	}

	private startDragAutoScroll(): void {
		if (this.dragScrollFrame !== null) return;
		const tick = () => {
			this.dragScrollFrame = null;
			const active = this.gesture;
			if (!active || active.inputMode !== 'pointer') return;
			const scroller =
				this.dragScrollMode === 'page' ? document.scrollingElement : this.dragScrollElement;
			if (!scroller) return;
			const rect =
				this.dragScrollMode === 'page'
					? { top: 0, right: window.innerWidth, bottom: window.innerHeight, left: 0 }
					: (scroller as HTMLElement).getBoundingClientRect();
			const topDistance = active.pointerY - rect.top;
			const bottomDistance = rect.bottom - active.pointerY;
			const leftDistance = active.pointerX - rect.left;
			const rightDistance = rect.right - active.pointerX;
			const verticalDelta =
				topDistance < EDGE_SCROLL_DISTANCE
					? -edgeScrollDelta(topDistance)
					: bottomDistance < EDGE_SCROLL_DISTANCE
						? edgeScrollDelta(bottomDistance)
						: 0;
			const horizontalDelta =
				leftDistance < EDGE_SCROLL_DISTANCE
					? -edgeScrollDelta(leftDistance)
					: rightDistance < EDGE_SCROLL_DISTANCE
						? edgeScrollDelta(rightDistance)
						: 0;
			if (verticalDelta === 0 && horizontalDelta === 0) return;
			const previousScrollTop = scroller.scrollTop;
			const previousScrollLeft = scroller.scrollLeft;
			scroller.scrollTop += verticalDelta;
			scroller.scrollLeft += horizontalDelta;
			if (scroller.scrollTop === previousScrollTop && scroller.scrollLeft === previousScrollLeft)
				return;
			if (active.kind === 'slot-create') {
				this.updateSlotAtPointer(active.pointerX, active.pointerY);
			} else {
				this.updateItemGestureAt(
					this.getTargetAt(active.pointerX, active.pointerY),
					active.pointerX,
					active.pointerY
				);
			}
			const current = this.gesture;
			if (
				!current ||
				(current.kind !== 'slot-create' && current.source === 'external-drop' && !current.targetKey)
			)
				return;
			if (this.dragScrollFrame === null) this.dragScrollFrame = requestAnimationFrame(tick);
		};
		this.dragScrollFrame = requestAnimationFrame(tick);
	}

	private stopDragAutoScroll(): void {
		if (this.dragScrollFrame === null) return;
		cancelAnimationFrame(this.dragScrollFrame);
		this.dragScrollFrame = null;
	}
}

export function serializeEventCalendarTarget(target: EventCalendarDropTarget): string {
	return JSON.stringify({
		...target,
		...(target.allDay ? {} : { start: target.start.toISOString(), end: target.end.toISOString() })
	});
}

function readPositiveNumber(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : fallback;
}

function deserializeTarget(value: unknown): EventCalendarDropTarget | null {
	if (!isRecord(value)) return null;
	if (typeof value.key !== 'string' || !isEventCalendarView(value.view)) return null;
	if (value.resourceId !== undefined && typeof value.resourceId !== 'string') return null;
	const resourceId = typeof value.resourceId === 'string' ? value.resourceId : undefined;
	if (value.allDay === true) {
		try {
			assertRenderableDateOnly(value.day, 'dropTarget.day');
		} catch (error) {
			if (error instanceof EventCalendarError) return null;
			throw error;
		}
		return {
			key: value.key,
			view: value.view,
			allDay: true,
			day: value.day,
			...(resourceId === undefined ? {} : { resourceId })
		};
	}
	if (value.allDay !== false) return null;
	const start = toValidTargetInstant(value.start);
	const end = toValidTargetInstant(value.end);
	if (!start || !end || end <= start) return null;
	return {
		key: value.key,
		view: value.view,
		allDay: false,
		start,
		end,
		...(resourceId === undefined ? {} : { resourceId })
	};
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function getResolutionProposal<TProposal>(
	resolution: EventCalendarInteractionResolution<TProposal>
): TProposal | null {
	return resolution.state === 'pending' ? null : resolution.proposal;
}

function isEventCalendarView(value: unknown): value is EventCalendarView {
	return (
		value === 'month' ||
		value === 'week' ||
		value === 'day' ||
		value === 'days' ||
		value === 'agenda' ||
		value === 'resource'
	);
}

function toValidTargetInstant(value: unknown): Date | null {
	const instant =
		value instanceof Date ? new Date(value) : typeof value === 'string' ? new Date(value) : null;
	return instant && Number.isFinite(instant.getTime()) ? instant : null;
}

function isSameEndpoint(
	left: Date | EventCalendarDateOnly,
	right: Date | EventCalendarDateOnly
): boolean {
	if (left instanceof Date && right instanceof Date) return left.getTime() === right.getTime();
	return left === right;
}

function getEndpointKey(endpoint: Date | EventCalendarDateOnly): string {
	return endpoint instanceof Date ? `instant:${endpoint.getTime()}` : `day:${endpoint}`;
}

function areStringArraysEqual(left: readonly string[], right: readonly string[]): boolean {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}

function getProposalOperation<TItemFields extends object>(
	proposal: EventCalendarProposedUpdate<TItemFields>,
	fallback: EventCalendarItemOperation
): EventCalendarItemOperation {
	return proposal.kind === 'update' ? fallback : proposal.kind;
}

function applyTargetResource<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	target: EventCalendarDropTarget,
	sourceResourceId?: string
): EventCalendarItem<TItemFields> {
	if (target.view !== 'resource') return item;
	return replaceEventCalendarResourceAssignment(item, sourceResourceId, target.resourceId);
}

function mergeSlots(anchor: EventCalendarSlot, point: EventCalendarSlot): EventCalendarSlot {
	if (anchor.allDay && point.allDay) {
		return {
			view: point.view,
			allDay: true,
			start: anchor.start < point.start ? anchor.start : point.start,
			end: anchor.end > point.end ? anchor.end : point.end,
			resourceId: point.resourceId
		};
	}
	if (!anchor.allDay && !point.allDay) {
		return {
			view: point.view,
			allDay: false,
			start: anchor.start < point.start ? anchor.start : point.start,
			end: anchor.end > point.end ? anchor.end : point.end,
			resourceId: point.resourceId
		};
	}
	return anchor;
}

function areCompatibleSlots(anchor: EventCalendarSlot, point: EventCalendarSlot): boolean {
	return (
		anchor.view === point.view &&
		anchor.allDay === point.allDay &&
		anchor.resourceId === point.resourceId
	);
}

function areSlotsEqual(left: EventCalendarSlot, right: EventCalendarSlot): boolean {
	return (
		left.view === right.view &&
		left.allDay === right.allDay &&
		left.resourceId === right.resourceId &&
		isSameEndpoint(left.start, right.start) &&
		isSameEndpoint(left.end, right.end)
	);
}

function touchedCivilDayCount<TItemFields extends object>(
	occurrence: EventCalendarOccurrence<TItemFields>,
	timeZone: string
): number {
	return touchedInstantDayCount(occurrence.start, occurrence.end, timeZone);
}

function touchedInstantDayCount(start: Date, end: Date, timeZone: string): number {
	const startDay = getZonedDay(start, timeZone);
	const inclusiveEndDay = getZonedDay(
		new Date(Math.max(start.getTime(), end.getTime() - 1)),
		timeZone
	);
	return Math.max(1, civilDayDifference(startDay, inclusiveEndDay) + 1);
}

function getWallMinutes(instant: Date, timeZone: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hour: 'numeric',
		minute: 'numeric',
		hourCycle: 'h23'
	}).formatToParts(instant);
	const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
	const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
	return hour * 60 + minute;
}

function edgeScrollDelta(distance: number): number {
	return Math.ceil(EDGE_SCROLL_MAX_PX * (1 - Math.max(0, distance) / EDGE_SCROLL_DISTANCE));
}
