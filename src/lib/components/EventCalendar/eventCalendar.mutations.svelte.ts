/* eslint-disable svelte/prefer-svelte-reactivity -- History and clipboard hold immutable session snapshots. */
import { useUndoStack } from '$lib/utils/useUndoStack.svelte.js';
import {
	addCivilDays,
	civilDayDifference,
	getCivilWeekday,
	getZonedDay,
	rangesIntersect,
	resolveZonedMinutesOnDay,
	startOfZonedDay
} from './eventCalendar.date.js';
import { EventCalendarError } from './eventCalendar.error.js';
import type { EventCalendarAdmittedBusinessHours } from './eventCalendar.businessHours.js';
import {
	createEventCalendarRecurrenceMutation,
	type CreateRecurrenceMutationOptions,
	type EventCalendarRecurrenceMutation
} from './eventCalendar.recurrenceMutation.js';
import {
	cloneEventCalendarItem,
	getEventCalendarOccurrencePlacementItem,
	getEventCalendarOccurrenceSeriesId,
	replaceEventCalendarPlacement
} from './eventCalendar.records.js';
import { setEventCalendarResourceIds } from './eventCalendar.resources.js';
import type {
	EventCalendarModelBoundary,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import type {
	EventCalendarChange,
	EventCalendarDateOnly,
	EventCalendarInteractionBlockedInfo,
	EventCalendarItem,
	EventCalendarMutationSource,
	EventCalendarOccurrence,
	EventCalendarProposedUpdate,
	EventCalendarSelection,
	EventCalendarSlot,
	EventCalendarUpdateAdjustment
} from './eventCalendar.types.js';

type InvalidReason = EventCalendarInteractionBlockedInfo['reason'];
type EventCalendarScheduleLike = {
	allDay?: boolean;
	start: Date | EventCalendarDateOnly;
	end: Date | EventCalendarDateOnly;
	resourceId?: string;
	resourceIds?: string[];
};

type EventCalendarHistoryEntry<TItemFields extends object> = {
	beforeItems: EventCalendarItem<TItemFields>[];
	afterItems: EventCalendarItem<TItemFields>[];
	expectedBoundary: EventCalendarModelBoundary<TItemFields>;
};

type EventCalendarCollectionMutation<TItemFields extends object> = {
	boundary: EventCalendarModelBoundary<TItemFields>;
	items: readonly EventCalendarItem<TItemFields>[];
	source: EventCalendarMutationSource;
	createChange: (
		revert: () => void,
		items: EventCalendarItem<TItemFields>[]
	) => EventCalendarChange<TItemFields>;
	keyRemap?: {
		forward: (key: string) => string;
		backward: (key: string) => string;
	};
	clearMissingRecurringSeriesId?: string;
	recordHistory?: boolean;
	onRevert?: () => void;
};

/** The one prepared transaction shared by normal and recurring edits. */
type EventCalendarPreparedBatch<TItemFields extends object> = {
	proposal: EventCalendarProposedUpdate<TItemFields>;
	candidateItems: EventCalendarItem<TItemFields>[];
	recurrence: {
		mutation: EventCalendarRecurrenceMutation<TItemFields>;
		options: CreateRecurrenceMutationOptions<TItemFields>;
	} | null;
};

const MINUTE_MS = 60_000;

/** Owns validation, immutable controlled writes, history, clipboard, and guarded revert. */
export class EventCalendarMutations<TItemFields extends object, TResourceFields extends object> {
	private clipboardItem: EventCalendarItem<TItemFields> | null = null;
	/** No signature dedupe here: entries are identified by object, staleness by model boundary. */
	private readonly history = useUndoStack<EventCalendarHistoryEntry<TItemFields>>({
		limit: () => this.calendar.historyLimit
	});

	constructor(private readonly calendar: EventCalendarState<TItemFields, TResourceFields>) {}

	addItem(item: EventCalendarItem<TItemFields>): void {
		if (this.blockDisabledApiMutation()) return;
		const boundary = this.calendar.modelBoundary;
		if (boundary.items.some((candidate) => candidate.id === item.id)) {
			throw new EventCalendarError('duplicate-item-id', `Duplicate item id: ${item.id}.`, {
				id: item.id
			});
		}
		const nextItem = cloneEventCalendarItem(item);
		this.commitCollection({
			boundary,
			items: [...boundary.items, nextItem],
			source: 'api',
			createChange: (revert) => ({ kind: 'add', source: 'api', item: nextItem, revert })
		});
	}

	updateItem(item: EventCalendarItem<TItemFields>): void {
		if (this.blockDisabledApiMutation()) return;
		const boundary = this.calendar.modelBoundary;
		const previousItem = boundary.items.find((candidate) => candidate.id === item.id);
		if (!previousItem) this.missingTarget('item', item.id);
		this.commitProposal(
			{ kind: 'update', source: 'api', previousItem, item: cloneEventCalendarItem(item) },
			boundary
		);
	}

	updateOccurrence(
		key: string,
		adjustment: EventCalendarUpdateAdjustment,
		options?: { scope?: 'occurrence' | 'series' }
	): void {
		if (this.blockDisabledApiMutation()) return;
		const boundary = this.calendar.modelBoundary;
		const occurrence = this.calendar.getOccurrence(key);
		if (!occurrence) this.missingTarget('occurrence', key);
		const item = this.applyAdjustment(this.getOccurrencePlacementItem(occurrence), adjustment);
		const proposal: EventCalendarProposedUpdate<TItemFields> = {
			kind: 'update',
			source: 'api',
			occurrence,
			previousItem: occurrence.item,
			item
		};
		if (occurrence.isRecurring || occurrence.item.recurringItemId !== undefined) {
			this.commitProposal(proposal, boundary, options?.scope);
			return;
		}
		this.commitProposal(proposal, boundary);
	}

	removeItem(id: string): void {
		if (this.blockDisabledApiMutation()) return;
		const boundary = this.calendar.modelBoundary;
		const previousItem = boundary.items.find((candidate) => candidate.id === id);
		if (!previousItem) this.missingTarget('item', id);
		const removedItems =
			previousItem.recurrence === undefined
				? [previousItem]
				: boundary.items.filter(
						(candidate) => candidate === previousItem || candidate.recurringItemId === id
					);
		const removedIds = new Set(removedItems.map((item) => item.id));
		this.commitCollection({
			boundary,
			items: boundary.items.filter((candidate) => !removedIds.has(candidate.id)),
			source: 'api',
			createChange: (revert) => ({
				kind: 'remove',
				source: 'api',
				previousItems: [...removedItems],
				revert
			}),
			clearMissingRecurringSeriesId:
				previousItem.recurrence === undefined ? undefined : previousItem.id
		});
	}

	copySelection(): boolean {
		if (!this.calendar.clipboard || this.calendar.selection.kind !== 'item') return false;
		const occurrence = this.calendar.getOccurrence(this.calendar.selection.itemKey);
		if (!occurrence || occurrence.item.display === 'background') return false;
		const copy = cloneEventCalendarItem(
			this.getOccurrencePlacementItem(occurrence)
		) as EventCalendarItem<TItemFields> & Record<string, unknown>;
		delete copy.recurrence;
		delete copy.recurrenceTimeZone;
		delete copy.recurringItemId;
		delete copy.originalStart;
		this.clipboardItem = copy;
		return true;
	}

	paste(): boolean {
		if (!this.calendar.clipboard || this.blockDisabledApiMutation() || !this.clipboardItem) {
			return false;
		}
		const boundary = this.calendar.modelBoundary;
		const source = this.clipboardItem;
		const item = this.createPastedItem(source, boundary.items);
		const proposal: EventCalendarProposedUpdate<TItemFields> = {
			kind: 'update',
			source: 'clipboard',
			previousItem: source,
			item
		};
		if (!this.commitProposal(proposal, boundary)) return false;
		const occurrence = this.calendar.itemIndex.occurrences.find(
			(candidate) => candidate.item.id === item.id
		);
		if (occurrence) this.calendar.select({ kind: 'item', itemKey: occurrence.key, slot: null });
		return true;
	}

	canUndo(): boolean {
		const entry = this.history.peekPast();
		return Boolean(entry && this.calendar.isModelBoundaryCurrent(entry.expectedBoundary));
	}

	canRedo(): boolean {
		const entry = this.history.peekFuture();
		return Boolean(entry && this.calendar.isModelBoundaryCurrent(entry.expectedBoundary));
	}

	undo(): boolean {
		return this.applyHistory('undo');
	}

	redo(): boolean {
		return this.applyHistory('redo');
	}

	validateProposal(
		proposal: EventCalendarProposedUpdate<TItemFields>,
		ignoredSeriesId?: string,
		skipCustomPolicy = false
	): InvalidReason | null {
		if (this.calendar.disabled || this.calendar.loading) return 'disabled';
		const item = proposal.item;
		if (
			proposal.source === 'external-drop' &&
			this.calendar.modelBoundary.items.some((candidate) => candidate.id === item.id)
		) {
			return 'invalid-target';
		}
		if (proposal.source !== 'api' && (item.display === 'background' || item.readOnly)) {
			return 'read-only';
		}
		if (
			proposal.source !== 'api' &&
			this.calendar.resourceModel
				.resolveItemLeafIds(item)
				.some((resourceId) => this.calendar.resourceModel.isReadOnly(resourceId))
		) {
			return 'read-only';
		}
		const placementReason = this.validatePlacement(item);
		if (placementReason) return placementReason;
		for (const conflict of this.findConflicts(item, proposal.occurrence?.key, ignoredSeriesId)) {
			if (!this.allowsConflict({ kind: 'item', proposal, conflictingOccurrence: conflict })) {
				return 'overlap';
			}
		}
		if (!skipCustomPolicy && this.calendar.canUpdateItem?.(proposal) === false) {
			return 'custom-policy';
		}
		return null;
	}

	validateSlot(slot: EventCalendarSlot): InvalidReason | null {
		if (this.calendar.disabled || this.calendar.loading) return 'disabled';
		if (this.calendar.resourceModel.isReadOnly(slot.resourceId)) return 'read-only';
		const placementReason = this.validatePlacement(slot);
		if (placementReason) return placementReason;
		for (const conflict of this.findSlotConflicts(slot)) {
			if (!this.allowsConflict({ kind: 'slot', slot, conflictingOccurrence: conflict })) {
				return 'overlap';
			}
		}
		if (this.calendar.canSelectSlot?.(slot) === false) return 'custom-policy';
		return null;
	}

	commitProposal(
		initialProposal: EventCalendarProposedUpdate<TItemFields>,
		boundary = this.calendar.modelBoundary,
		scopeOverride?: 'occurrence' | 'series'
	): boolean {
		if (
			initialProposal.source !== 'external-drop' &&
			(initialProposal.occurrence?.isRecurring ||
				initialProposal.occurrence?.item.recurringItemId !== undefined)
		) {
			const scope = scopeOverride ?? this.calendar.recurrenceEditScope;
			return scope === 'disabled'
				? this.rejectProposal(initialProposal, 'disabled')
				: this.commitPreparedBatch(initialProposal, boundary, scope);
		}
		return this.commitPreparedBatch(initialProposal, boundary);
	}

	/** Prepare, resolve, validate, and publish one concrete transaction. */
	private commitPreparedBatch(
		initialProposal: EventCalendarProposedUpdate<TItemFields>,
		boundary: EventCalendarModelBoundary<TItemFields>,
		scope?: 'occurrence' | 'series'
	): boolean {
		if (!this.assertCurrent(boundary, initialProposal.source, initialProposal)) return false;
		let batch = scope
			? this.prepareRecurrenceBatch(
					this.getRecurrenceMutationOptions(initialProposal, scope, boundary.items)
				)
			: this.preparePlacementBatch(initialProposal, boundary.items);
		if (!batch) return this.rejectStaleProposal(initialProposal);
		this.calendar.validateCandidateItems(batch.candidateItems);
		const initialReason = batch.recurrence
			? this.validateRecurrenceMutation(batch.recurrence.mutation)
			: this.validateProposal(batch.proposal);
		if (initialReason) return this.rejectProposal(batch.proposal, initialReason);

		const onItemUpdate = this.calendar.onItemUpdate;
		const updateResult = onItemUpdate?.(batch.proposal);
		if (!this.assertCurrent(boundary, batch.proposal.source, batch.proposal)) return false;
		if (updateResult === false) return this.rejectProposal(batch.proposal, 'custom-policy');
		const adjustment = updateResult && typeof updateResult === 'object' ? updateResult : null;
		if (adjustment) {
			const adjustedItem = this.applyAdjustment(batch.proposal.item, adjustment);
			const adjustedBatch = batch.recurrence
				? this.prepareAdjustedRecurrenceBatch(batch.recurrence, adjustedItem)
				: this.preparePlacementBatch(
						{ ...batch.proposal, item: adjustedItem },
						boundary.items,
						'adjustment',
						true
					);
			if (!adjustedBatch) return false;
			batch = adjustedBatch;
		} else if (!batch.recurrence) {
			const revalidatedBatch = this.preparePlacementBatch(
				batch.proposal,
				boundary.items,
				'resolver',
				onItemUpdate !== undefined
			);
			if (!revalidatedBatch) return false;
			batch = revalidatedBatch;
		}
		if (!this.assertCurrent(boundary, batch.proposal.source, batch.proposal)) return false;
		const recurrence = batch.recurrence?.mutation;
		return Boolean(
			this.commitCollection({
				boundary,
				items: batch.candidateItems,
				source: initialProposal.source,
				createChange: (revert, publishedItems) =>
					this.createPreparedChange(batch, revert, publishedItems),
				keyRemap:
					recurrence?.scope === 'series'
						? {
								forward: recurrence.remapOccurrenceKey,
								backward: recurrence.restoreOccurrenceKey
							}
						: undefined,
				clearMissingRecurringSeriesId:
					batch.recurrence ||
					batch.proposal.source === 'external-drop' ||
					batch.proposal.source === 'clipboard' ||
					batch.proposal.previousItem.recurrence === undefined
						? undefined
						: batch.proposal.previousItem.id
			})
		);
	}

	private preparePlacementBatch(
		proposal: EventCalendarProposedUpdate<TItemFields>,
		items: EventCalendarItem<TItemFields>[],
		phase?: 'resolver' | 'adjustment',
		validatePolicy = false
	): EventCalendarPreparedBatch<TItemFields> | null {
		const candidateItems = this.getCandidateItems(proposal, items);
		if (!candidateItems) {
			if (phase) this.rejectStaleProposal(proposal);
			return null;
		}
		const batch = { proposal, candidateItems, recurrence: null } as const;
		if (!phase) return batch;
		try {
			this.calendar.validateCandidateItems(candidateItems);
		} catch (error) {
			if (phase === 'adjustment') {
				throw this.invalidAdjustmentError(error, proposal.item.id);
			}
			throw error;
		}
		if (!validatePolicy) return batch;
		const reason = this.validateProposal(proposal);
		if (!reason) return batch;
		if (phase === 'adjustment') {
			throw new EventCalendarError(
				'invalid-adjustment',
				'resolveItemUpdate returned an invalid adjustment.',
				{ reason, id: proposal.item.id }
			);
		}
		this.rejectProposal(proposal, reason);
		return null;
	}

	private prepareRecurrenceBatch(
		options: CreateRecurrenceMutationOptions<TItemFields>,
		adjustedId?: string
	): EventCalendarPreparedBatch<TItemFields> {
		try {
			const mutation = createEventCalendarRecurrenceMutation(options);
			if (adjustedId) {
				this.calendar.validateCandidateItems(mutation.committedItems);
				const reason = this.validateRecurrenceMutation(mutation);
				if (reason) {
					throw new EventCalendarError(
						'invalid-adjustment',
						'resolveItemUpdate returned an invalid recurring adjustment.',
						{ reason, id: adjustedId }
					);
				}
			}
			return {
				proposal: mutation.proposal,
				candidateItems: mutation.committedItems,
				recurrence: { mutation, options }
			};
		} catch (error) {
			if (adjustedId) throw this.invalidAdjustmentError(error, adjustedId);
			throw error;
		}
	}

	private prepareAdjustedRecurrenceBatch(
		recurrence: NonNullable<EventCalendarPreparedBatch<TItemFields>['recurrence']>,
		adjustedItem: EventCalendarItem<TItemFields>
	): EventCalendarPreparedBatch<TItemFields> {
		const options =
			recurrence.mutation.scope === 'series'
				? {
						...recurrence.options,
						adjustedSeriesItem: adjustedItem,
						operation: recurrence.mutation.operation
					}
				: {
						...recurrence.options,
						exceptionId: recurrence.mutation.exceptionId,
						proposal: { ...recurrence.mutation.proposal, item: adjustedItem }
					};
		return this.prepareRecurrenceBatch(options, adjustedItem.id);
	}

	private createPreparedChange(
		batch: EventCalendarPreparedBatch<TItemFields>,
		revert: () => void,
		publishedItems: EventCalendarItem<TItemFields>[]
	): EventCalendarChange<TItemFields> {
		const recurrence = batch.recurrence?.mutation;
		if (recurrence) {
			if (recurrence.scope === 'series') {
				return {
					kind: 'recurrence-series-update',
					source: batch.proposal.source,
					operation: recurrence.operation,
					seriesItem: recurrence.seriesItem,
					previousSeriesItem: recurrence.previousSeriesItem,
					exceptionItems: recurrence.exceptionItems,
					previousExceptionItems: recurrence.previousExceptionItems,
					revert
				};
			}
			const exception = {
				source: batch.proposal.source,
				seriesItem: recurrence.seriesItem,
				item: recurrence.item,
				revert
			};
			return recurrence.previousItem
				? {
						kind: 'recurrence-exception-update',
						...exception,
						previousItem: recurrence.previousItem
					}
				: {
						kind: 'recurrence-exception-add',
						...exception
					};
		}
		const { proposal } = batch;
		const committedItem =
			publishedItems.find((item) => item.id === proposal.item.id) ?? proposal.item;
		const kind =
			proposal.kind === 'move' ? 'move' : proposal.kind.startsWith('resize') ? 'resize' : 'update';
		return proposal.source === 'external-drop' || proposal.source === 'clipboard'
			? { kind: 'add', source: proposal.source, item: committedItem, revert }
			: {
					kind,
					source: proposal.source,
					item: committedItem,
					previousItem: proposal.previousItem,
					revert
				};
	}

	getOccurrencePlacementItem(
		occurrence: EventCalendarOccurrence<TItemFields>
	): EventCalendarItem<TItemFields> {
		return getEventCalendarOccurrencePlacementItem(occurrence, this.calendar.timeZone);
	}

	getConversionDurationTimeZone(occurrence: EventCalendarOccurrence<TItemFields>): string {
		const seriesId = getEventCalendarOccurrenceSeriesId(occurrence);
		if (!seriesId) return this.calendar.timeZone;
		const seriesItem = this.calendar.modelBoundary.items.find((item) => item.id === seriesId);
		if (
			!seriesItem ||
			seriesItem.recurrence === undefined ||
			seriesItem.recurringItemId !== undefined
		) {
			throw new EventCalendarError(
				'invalid-recurrence',
				'The occurrence has no bound recurring source.',
				{ key: occurrence.key, seriesId }
			);
		}
		if (seriesItem.allDay === true) return this.calendar.timeZone;
		if (typeof seriesItem.recurrenceTimeZone !== 'string') {
			throw new EventCalendarError(
				'invalid-recurrence',
				'A timed recurring source requires recurrenceTimeZone.',
				{ key: occurrence.key, seriesId }
			);
		}
		return seriesItem.recurrenceTimeZone;
	}

	private getRecurrenceMutationOptions(
		proposal: EventCalendarProposedUpdate<TItemFields>,
		scope: 'occurrence' | 'series',
		items: EventCalendarItem<TItemFields>[]
	): CreateRecurrenceMutationOptions<TItemFields> {
		return {
			items,
			proposal,
			scope,
			displayTimeZone: this.calendar.timeZone,
			maintainDurationOnAllDayChange: this.calendar.interactions.maintainDurationOnAllDayChange,
			defaultTimedItemDuration: this.calendar.defaultTimedItemDuration,
			defaultAllDayItemDuration: this.calendar.defaultAllDayItemDuration,
			getOccurrenceExceptionId: this.calendar.getOccurrenceExceptionId
		};
	}

	private validateRecurrenceMutation(
		mutation: EventCalendarRecurrenceMutation<TItemFields>
	): InvalidReason | null {
		if (mutation.scope === 'occurrence') return this.validateProposal(mutation.proposal);
		const seriesId = mutation.previousSeriesItem.id;
		const interactionReason = this.validateProposal(mutation.interactedProposal, seriesId, true);
		if (interactionReason) return interactionReason;
		const occurrences = this.calendar.getCandidateOccurrences(mutation.committedItems);
		const seriesOccurrences = occurrences.filter(
			(occurrence) => getEventCalendarOccurrenceSeriesId(occurrence) === seriesId
		);
		for (const occurrence of seriesOccurrences) {
			const item = this.getOccurrencePlacementItem(occurrence);
			const placementReason = this.validatePlacement(item);
			if (placementReason) return placementReason;
			const proposal: EventCalendarProposedUpdate<TItemFields> = {
				...mutation.proposal,
				occurrence,
				item
			};
			for (const conflict of this.findConflicts(
				item,
				occurrence.key,
				undefined,
				occurrences,
				false,
				false
			)) {
				if (!this.allowsConflict({ kind: 'item', proposal, conflictingOccurrence: conflict })) {
					return 'overlap';
				}
			}
		}
		if (this.calendar.canUpdateItem?.(mutation.proposal) === false) return 'custom-policy';
		return null;
	}

	private validatePlacement(item: EventCalendarScheduleLike): InvalidReason | null {
		if (!isValidPlacement(item, this.calendar.snapDuration)) return 'invalid-target';
		if (!this.isInsideValidRange(item)) return 'valid-range';
		if (this.calendar.constrainToBusinessHours && !this.isInsideBusinessHours(item)) {
			return 'business-hours';
		}
		return null;
	}

	private getCandidateItems(
		proposal: EventCalendarProposedUpdate<TItemFields>,
		items: EventCalendarItem<TItemFields>[]
	): EventCalendarItem<TItemFields>[] | null {
		const nextItem = cloneEventCalendarItem(proposal.item);
		if (proposal.source === 'external-drop' || proposal.source === 'clipboard') {
			return [...items, nextItem];
		}
		const index = items.findIndex((item) => item.id === proposal.previousItem.id);
		if (index < 0 || items[index] !== proposal.previousItem) return null;
		return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
	}

	private applyAdjustment(
		item: EventCalendarItem<TItemFields>,
		adjustment: EventCalendarUpdateAdjustment
	): EventCalendarItem<TItemFields> {
		if (adjustment.resourceId !== undefined && adjustment.resourceIds !== undefined) {
			throw new EventCalendarError(
				'invalid-adjustment',
				'An adjustment cannot define both resourceId and resourceIds.'
			);
		}
		const adjusted = replaceEventCalendarPlacement(item, {
			allDay: adjustment.allDay ?? item.allDay === true,
			start: adjustment.start ?? item.start,
			end: adjustment.end ?? item.end
		});
		let resourceIds: readonly string[] | undefined;
		if (adjustment.resourceIds !== undefined) resourceIds = adjustment.resourceIds ?? [];
		else if (adjustment.resourceId === null) resourceIds = [];
		else if (adjustment.resourceId !== undefined) resourceIds = [adjustment.resourceId];
		return resourceIds === undefined
			? adjusted
			: setEventCalendarResourceIds(adjusted, resourceIds);
	}

	private commitCollection(
		mutation: EventCalendarCollectionMutation<TItemFields>
	): EventCalendarModelBoundary<TItemFields> | null {
		if (!this.assertCurrent(mutation.boundary, mutation.source)) return null;
		const committedItems = [...mutation.items];
		this.calendar.validateCandidateItems(committedItems);
		// Validation runs consumer expansion code; a reentrant write must not be overwritten.
		if (!this.assertCurrent(mutation.boundary, mutation.source)) return null;
		this.calendar.items = committedItems;
		const committedBoundary = this.calendar.modelBoundary;
		const publishedItems = committedBoundary.items;
		const selectionTransaction = mutation.keyRemap
			? this.calendar.applyOccurrenceKeyRemap(mutation.keyRemap.forward)
			: mutation.clearMissingRecurringSeriesId
				? this.calendar.clearMissingRecurringSelection(
						publishedItems,
						mutation.clearMissingRecurringSeriesId
					)
				: null;
		let committedStatus: {
			source: EventCalendarMutationSource;
			item?: EventCalendarItem<TItemFields>;
		} | null = null;
		let wasReverted = false;
		let historyEntry: EventCalendarHistoryEntry<TItemFields> | null = null;
		const revert = this.createRevert(
			mutation.boundary,
			committedBoundary,
			selectionTransaction,
			mutation.keyRemap?.backward,
			() => {
				if (!committedStatus) {
					throw new EventCalendarError(
						'stale-transaction',
						'This EventCalendar transaction was not published before revert.'
					);
				}
				wasReverted = true;
				if (historyEntry) this.history.remove(historyEntry);
				mutation.onRevert?.();
				this.synchronizeHistoryBoundary();
				this.history.touch();
				this.calendar.notifyInteractionStatus({ type: 'revert', ...committedStatus });
			}
		);
		const change = mutation.createChange(revert, publishedItems);
		committedStatus = {
			source: change.source,
			item: 'item' in change ? change.item : 'seriesItem' in change ? change.seriesItem : undefined
		};
		this.calendar.eventHandlers.onItemsChange?.({ items: publishedItems, change });
		if (wasReverted) return null;
		if (!this.assertCurrent(committedBoundary, mutation.source)) return null;
		if (mutation.recordHistory !== false) {
			historyEntry = this.recordHistory(mutation.boundary.items, publishedItems, committedBoundary);
		}
		this.calendar.notifyInteractionStatus({ type: 'commit', ...committedStatus });
		if (
			selectionTransaction &&
			this.calendar.hasSelection(selectionTransaction.committedSelection)
		) {
			this.calendar.notifySelectionChange(selectionTransaction.committedSelection);
		}
		return committedBoundary;
	}

	private createRevert(
		previousBoundary: EventCalendarModelBoundary<TItemFields>,
		committedBoundary: EventCalendarModelBoundary<TItemFields>,
		selectionTransaction: {
			previousSelection: EventCalendarSelection;
			committedSelection: EventCalendarSelection;
		} | null,
		restoreOccurrenceKey?: (key: string) => string,
		onRevert?: () => void
	): () => void {
		let isConsumed = false;
		return () => {
			if (
				isConsumed ||
				!this.calendar.isModelBoundaryCurrent(committedBoundary) ||
				(selectionTransaction !== null &&
					!this.calendar.hasSelection(selectionTransaction.committedSelection))
			) {
				throw new EventCalendarError(
					'stale-transaction',
					'This EventCalendar transaction can no longer be reverted.'
				);
			}
			isConsumed = true;
			this.calendar.items = [...previousBoundary.items];
			if (selectionTransaction || restoreOccurrenceKey) {
				this.calendar.restoreOccurrenceKeyRemap(selectionTransaction, restoreOccurrenceKey);
			}
			onRevert?.();
		};
	}

	private recordHistory(
		beforeItems: EventCalendarItem<TItemFields>[],
		afterItems: EventCalendarItem<TItemFields>[],
		expectedBoundary: EventCalendarModelBoundary<TItemFields>
	): EventCalendarHistoryEntry<TItemFields> | null {
		const limit = this.calendar.historyLimit;
		if (limit === 0 || beforeItems === afterItems) return null;
		const entry = { beforeItems, afterItems, expectedBoundary };
		this.history.push(entry);
		return entry;
	}

	private applyHistory(direction: 'undo' | 'redo'): boolean {
		if (this.calendar.disabled) return false;
		const entry = direction === 'undo' ? this.history.peekPast() : this.history.peekFuture();
		if (!entry) return false;
		if (!this.calendar.isModelBoundaryCurrent(entry.expectedBoundary)) {
			this.reportBlocked({ reason: 'stale', source: 'history' });
			return false;
		}
		const targetItems = direction === 'undo' ? entry.beforeItems : entry.afterItems;
		const committedBoundary = this.commitCollection({
			boundary: entry.expectedBoundary,
			items: targetItems,
			source: 'history',
			createChange: (revert) => ({ kind: 'history', source: 'history', direction, revert }),
			recordHistory: false,
			// Reverting a published undo/redo puts the entry back on the stack it came from.
			onRevert: () => {
				if (direction === 'undo' && this.history.peekFuture() === entry) this.history.redo();
				else if (direction === 'redo' && this.history.peekPast() === entry) this.history.undo();
			}
		});
		if (!committedBoundary) return false;
		if (direction === 'undo') this.history.undo();
		else this.history.redo();
		this.synchronizeHistoryBoundary(committedBoundary);
		this.history.touch();
		return true;
	}

	private synchronizeHistoryBoundary(
		boundary: EventCalendarModelBoundary<TItemFields> = this.calendar.modelBoundary
	): void {
		for (const entry of [this.history.peekPast(), this.history.peekFuture()]) {
			if (entry) entry.expectedBoundary = boundary;
		}
	}

	private createPastedItem(
		source: EventCalendarItem<TItemFields>,
		items: readonly EventCalendarItem<TItemFields>[]
	): EventCalendarItem<TItemFields> {
		const next = cloneEventCalendarItem(source);
		next.id = this.getPastedItemId(source.id, items);
		const selection = this.calendar.selection;
		if (selection.kind !== 'slot' || selection.slot.allDay !== (source.allDay === true)) {
			return next;
		}
		const slot = selection.slot;
		let placed: EventCalendarItem<TItemFields>;
		if (source.allDay === true) {
			if (slot.allDay !== true) return next;
			placed = replaceEventCalendarPlacement(next, {
				allDay: true,
				start: slot.start,
				end: addCivilDays(slot.start, civilDayDifference(source.start, source.end))
			});
		} else {
			if (slot.allDay === true) return next;
			placed = replaceEventCalendarPlacement(next, {
				allDay: false,
				start: slot.start,
				end: new Date(slot.start.getTime() + source.end.getTime() - source.start.getTime())
			});
		}
		if (slot.view !== 'resource') return placed;
		return setEventCalendarResourceIds(placed, slot.resourceId ? [slot.resourceId] : []);
	}

	private getPastedItemId(
		sourceId: string,
		items: readonly EventCalendarItem<TItemFields>[]
	): string {
		let suffix = 1;
		let id = `${sourceId}-copy`;
		const ids = new Set(items.map((item) => item.id));
		while (ids.has(id)) {
			suffix += 1;
			id = `${sourceId}-copy-${suffix}`;
		}
		return id;
	}

	private isInsideValidRange(schedule: EventCalendarScheduleLike): boolean {
		if (!this.calendar.validRange) return true;
		const range = scheduleRange(schedule, this.calendar.timeZone);
		return (
			range.start >= this.calendar.validRange.start && range.end <= this.calendar.validRange.end
		);
	}

	private isInsideBusinessHours(schedule: EventCalendarScheduleLike): boolean {
		const range = scheduleRange(schedule, this.calendar.timeZone);
		const resourceIds = this.calendar.resourceModel.resolveItemLeafIds(schedule);
		if (resourceIds.length === 0) {
			return isRangeInsideBusinessHours(range, schedule.allDay === true, this.calendar);
		}
		return resourceIds.every((resourceId) =>
			isRangeInsideBusinessHours(
				range,
				schedule.allDay === true,
				this.calendar,
				this.calendar.resourceModel.getBusinessHours(resourceId) ?? this.calendar.businessHours
			)
		);
	}

	private findConflicts(
		item: EventCalendarItem<TItemFields>,
		ignoredOccurrenceKey?: string,
		ignoredSeriesId?: string,
		occurrences: readonly EventCalendarOccurrence<TItemFields>[] = this.calendar.itemIndex
			.occurrences,
		excludeSameItem = true,
		excludeSeries = true
	) {
		if (item.display === 'background') return [];
		const range = scheduleRange(item, this.calendar.timeZone);
		return occurrences.filter(
			(occurrence) =>
				occurrence.key !== ignoredOccurrenceKey &&
				(!excludeSeries || getEventCalendarOccurrenceSeriesId(occurrence) !== ignoredSeriesId) &&
				(!excludeSameItem || occurrence.item.id !== item.id) &&
				occurrence.item.display !== 'background' &&
				this.itemsShareResource(occurrence.item, item) &&
				rangesIntersect(range, { start: occurrence.start, end: occurrence.end })
		);
	}

	private findSlotConflicts(slot: EventCalendarSlot) {
		const range = scheduleRange(slot, this.calendar.timeZone);
		return this.calendar.itemIndex.occurrences.filter(
			(occurrence) =>
				occurrence.item.display !== 'background' &&
				(slot.view !== 'resource' || this.itemUsesResource(occurrence.item, slot.resourceId)) &&
				rangesIntersect(range, { start: occurrence.start, end: occurrence.end })
		);
	}

	private itemUsesResource(item: EventCalendarItem<TItemFields>, resourceId?: string): boolean {
		const ids = this.calendar.resourceModel.resolveItemLeafIds(item);
		return resourceId === undefined ? ids.length === 0 : ids.includes(resourceId);
	}

	private itemsShareResource(
		left: EventCalendarItem<TItemFields>,
		right: EventCalendarItem<TItemFields>
	): boolean {
		const leftIds = this.calendar.resourceModel.resolveItemLeafIds(left);
		const rightIds = this.calendar.resourceModel.resolveItemLeafIds(right);
		if (leftIds.length === 0 || rightIds.length === 0) return leftIds.length === rightIds.length;
		return leftIds.some((resourceId) => rightIds.includes(resourceId));
	}

	private allowsConflict(
		info: Parameters<Exclude<typeof this.calendar.allowOverlap, boolean>>[0]
	): boolean {
		if (this.calendar.allowOverlap === true) return true;
		if (this.calendar.allowOverlap === false) return false;
		return this.calendar.allowOverlap(info);
	}

	private assertCurrent(
		boundary: EventCalendarModelBoundary<TItemFields>,
		source: EventCalendarMutationSource,
		proposal?: EventCalendarProposedUpdate<TItemFields>
	): boolean {
		if (this.calendar.isModelBoundaryCurrent(boundary)) return true;
		this.reportBlocked({ reason: 'stale', source, ...(proposal ? { proposal } : {}) });
		return false;
	}

	private rejectProposal(
		proposal: EventCalendarProposedUpdate<TItemFields>,
		reason: InvalidReason
	): false {
		this.reportBlocked({ reason, source: proposal.source, proposal });
		return false;
	}

	private rejectStaleProposal(proposal: EventCalendarProposedUpdate<TItemFields>): false {
		return this.rejectProposal(proposal, 'stale');
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

	private blockDisabledApiMutation(): boolean {
		if (!this.calendar.disabled) return false;
		this.reportBlocked({ reason: 'disabled', source: 'api' });
		return true;
	}

	private invalidAdjustmentError(error: unknown, id: string): EventCalendarError {
		if (error instanceof EventCalendarError && error.code === 'invalid-adjustment') return error;
		return new EventCalendarError(
			'invalid-adjustment',
			'resolveItemUpdate returned a structurally invalid adjustment.',
			{
				id,
				underlyingCode: error instanceof EventCalendarError ? error.code : 'structural-validation',
				underlyingMessage: error instanceof Error ? error.message : String(error)
			}
		);
	}

	private missingTarget(kind: string, value: string): never {
		throw new EventCalendarError('missing-target', `Unknown EventCalendar ${kind}: ${value}.`, {
			kind,
			value
		});
	}
}

function isValidPlacement(item: EventCalendarScheduleLike, minimumMinutes: number): boolean {
	if (item.allDay === true) return item.start < item.end;
	const start = item.start as Date;
	const end = item.end as Date;
	return (
		Number.isFinite(start.getTime()) &&
		end.getTime() - start.getTime() >= minimumMinutes * MINUTE_MS
	);
}

function scheduleRange(
	schedule: EventCalendarScheduleLike,
	timeZone: string
): { start: Date; end: Date } {
	return schedule.allDay === true
		? {
				start: startOfZonedDay(schedule.start as EventCalendarDateOnly, timeZone),
				end: startOfZonedDay(schedule.end as EventCalendarDateOnly, timeZone)
			}
		: { start: schedule.start as Date, end: schedule.end as Date };
}

function isRangeInsideBusinessHours<TItemFields extends object, TResourceFields extends object>(
	range: { start: Date; end: Date },
	isAllDay: boolean,
	calendar: EventCalendarState<TItemFields, TResourceFields>,
	businessHours: readonly EventCalendarAdmittedBusinessHours[] = calendar.businessHours
): boolean {
	if (businessHours.length === 0) return false;
	const startDay = getZonedDay(range.start, calendar.timeZone);
	const inclusiveEnd = new Date(Math.max(range.start.getTime(), range.end.getTime() - 1));
	const endDay = getZonedDay(inclusiveEnd, calendar.timeZone);
	if (!isAllDay && startDay !== endDay) return false;
	if (!isAllDay) {
		return businessHours.some((window) => {
			if (!window.daysOfWeek.includes(getCivilWeekday(startDay))) return false;
			const start = resolveZonedMinutesOnDay(startDay, window.startMinutes, calendar.timeZone);
			const end = resolveZonedMinutesOnDay(startDay, window.endMinutes, calendar.timeZone);
			return range.start >= start && range.end <= end;
		});
	}
	for (let day = startDay; day <= endDay; day = addCivilDays(day, 1)) {
		if (!businessHours.some((window) => window.daysOfWeek.includes(getCivilWeekday(day)))) {
			return false;
		}
		if (day === endDay) break;
	}
	return true;
}
