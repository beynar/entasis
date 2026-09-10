/* eslint-disable svelte/prefer-svelte-reactivity -- History and clipboard hold immutable session snapshots. */
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
import {
	createEventCalendarRecurrenceMutation,
	regenerateEventCalendarSeriesMutation,
	type CreateRecurrenceMutationOptions,
	type EventCalendarRecurrenceMutation
} from './eventCalendar.recurrenceMutation.js';
import {
	cloneEventCalendarItem,
	getEventCalendarOccurrenceSeriesId,
	replaceEventCalendarPlacement
} from './eventCalendar.records.js';
import { setEventCalendarResourceIds } from './eventCalendar.resources.js';
import type {
	EventCalendarModelBoundary,
	EventCalendarState
} from './eventCalendar.state.svelte.js';
import type {
	EventCalendarBusinessHours,
	EventCalendarChange,
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

const MINUTE_MS = 60_000;

/** Owns validation, immutable controlled writes, history, clipboard, and guarded revert. */
export class EventCalendarMutations<TItemFields extends object, TResourceFields extends object> {
	private clipboardItem: EventCalendarItem<TItemFields> | null = null;
	private historyPast: EventCalendarHistoryEntry<TItemFields>[] = [];
	private historyFuture: EventCalendarHistoryEntry<TItemFields>[] = [];
	private historyRevision = $state(0);

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
			const scope = options?.scope ?? this.calendar.recurrenceEditScope;
			if (scope === 'disabled') {
				this.reportBlocked({ reason: 'disabled', source: 'api', proposal });
				return;
			}
			this.commitRecurrenceProposal(proposal, scope, boundary);
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
		void this.historyRevision;
		const entry = this.historyPast.at(-1);
		return Boolean(entry && this.calendar.isModelBoundaryCurrent(entry.expectedBoundary));
	}

	canRedo(): boolean {
		void this.historyRevision;
		const entry = this.historyFuture.at(-1);
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
		if (!isValidPlacement(item, this.calendar.snapDuration)) return 'invalid-target';
		if (!this.isInsideValidRange(item)) return 'valid-range';
		if (this.calendar.constrainToBusinessHours && !this.isInsideBusinessHours(item)) {
			return 'business-hours';
		}
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
		if (!isValidSlot(slot, this.calendar.snapDuration)) return 'invalid-target';
		if (!this.isSlotInsideValidRange(slot)) return 'valid-range';
		if (this.calendar.constrainToBusinessHours && !this.isSlotInsideBusinessHours(slot)) {
			return 'business-hours';
		}
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
		boundary = this.calendar.modelBoundary
	): boolean {
		if (
			initialProposal.source !== 'external-drop' &&
			(initialProposal.occurrence?.isRecurring ||
				initialProposal.occurrence?.item.recurringItemId !== undefined)
		) {
			return this.commitRecurrenceProposal(
				initialProposal,
				this.calendar.recurrenceEditScope,
				boundary
			);
		}
		if (!this.assertBoundary(boundary, initialProposal)) return false;
		const initialCandidate = this.getCandidateItems(initialProposal, boundary.items);
		if (!initialCandidate) return this.rejectStaleProposal(initialProposal);
		this.calendar.validateCandidateItems(initialCandidate);
		const initialReason = this.validateProposal(initialProposal);
		if (initialReason) return this.rejectProposal(initialProposal, initialReason);

		const onItemUpdate = this.calendar.onItemUpdate;
		const updateResult = onItemUpdate?.(initialProposal);
		if (!this.assertBoundary(boundary, initialProposal)) return false;
		if (updateResult === false) return this.rejectProposal(initialProposal, 'custom-policy');
		const adjustment = updateResult && typeof updateResult === 'object' ? updateResult : null;
		const proposal = adjustment
			? { ...initialProposal, item: this.applyAdjustment(initialProposal.item, adjustment) }
			: initialProposal;
		const candidate = this.getCandidateItems(proposal, boundary.items);
		if (!candidate) return this.rejectStaleProposal(proposal);
		try {
			this.calendar.validateCandidateItems(candidate);
		} catch (error) {
			if (!adjustment) throw error;
			throw this.invalidAdjustmentError(error, proposal.item.id);
		}
		const finalReason = onItemUpdate ? this.validateProposal(proposal) : null;
		if (finalReason) {
			if (adjustment) {
				throw new EventCalendarError(
					'invalid-adjustment',
					'resolveItemUpdate returned an invalid adjustment.',
					{ reason: finalReason, id: proposal.item.id }
				);
			}
			return this.rejectProposal(proposal, finalReason);
		}
		if (!this.assertBoundary(boundary, proposal)) return false;
		const kind =
			proposal.kind === 'move' ? 'move' : proposal.kind.startsWith('resize') ? 'resize' : 'update';
		return Boolean(
			this.commitCollection({
				boundary,
				items: candidate,
				source: proposal.source,
				createChange: (revert, publishedItems) => {
					const committedItem =
						publishedItems.find((item) => item.id === proposal.item.id) ?? proposal.item;
					return proposal.source === 'external-drop' || proposal.source === 'clipboard'
						? { kind: 'add', source: proposal.source, item: committedItem, revert }
						: {
								kind,
								source: proposal.source,
								item: committedItem,
								previousItem: proposal.previousItem,
								revert
							};
				},
				clearMissingRecurringSeriesId:
					proposal.source === 'external-drop' ||
					proposal.source === 'clipboard' ||
					proposal.previousItem.recurrence === undefined
						? undefined
						: proposal.previousItem.id
			})
		);
	}

	getOccurrencePlacementItem(
		occurrence: EventCalendarOccurrence<TItemFields>
	): EventCalendarItem<TItemFields> {
		return replaceEventCalendarPlacement(occurrence.item, {
			allDay: occurrence.allDay,
			start: occurrence.allDay
				? getZonedDay(occurrence.start, this.calendar.timeZone)
				: new Date(occurrence.start),
			end: occurrence.allDay
				? getZonedDay(occurrence.end, this.calendar.timeZone)
				: new Date(occurrence.end)
		});
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

	private commitRecurrenceProposal(
		initialProposal: EventCalendarProposedUpdate<TItemFields>,
		scope: 'occurrence' | 'series' | 'disabled',
		boundary: EventCalendarModelBoundary<TItemFields>
	): boolean {
		if (scope === 'disabled') return this.rejectProposal(initialProposal, 'disabled');
		if (!this.assertBoundary(boundary, initialProposal)) return false;
		const mutationOptions = this.getRecurrenceMutationOptions(
			initialProposal,
			scope,
			boundary.items
		);
		let mutation = createEventCalendarRecurrenceMutation(mutationOptions);
		this.calendar.validateCandidateItems(mutation.committedItems);
		let reason = this.validateRecurrenceMutation(mutation);
		if (reason) return this.rejectProposal(mutation.proposal, reason);

		const updateResult = this.calendar.onItemUpdate?.(mutation.proposal);
		if (!this.assertBoundary(boundary, mutation.proposal)) return false;
		if (updateResult === false) return this.rejectProposal(mutation.proposal, 'custom-policy');
		const adjustment = updateResult && typeof updateResult === 'object' ? updateResult : null;
		if (adjustment) {
			const adjustedItem = this.applyAdjustment(mutation.proposal.item, adjustment);
			try {
				mutation =
					mutation.scope === 'series'
						? regenerateEventCalendarSeriesMutation(
								mutationOptions,
								adjustedItem,
								mutation.operation
							)
						: createEventCalendarRecurrenceMutation({
								...mutationOptions,
								exceptionId: mutation.exceptionId,
								proposal: { ...mutation.proposal, item: adjustedItem }
							});
				this.calendar.validateCandidateItems(mutation.committedItems);
				reason = this.validateRecurrenceMutation(mutation);
			} catch (error) {
				throw this.invalidAdjustmentError(error, adjustedItem.id);
			}
			if (reason) {
				throw new EventCalendarError(
					'invalid-adjustment',
					'resolveItemUpdate returned an invalid recurring adjustment.',
					{ reason, id: adjustedItem.id }
				);
			}
		}
		if (!this.assertBoundary(boundary, mutation.proposal)) return false;
		return Boolean(
			this.commitCollection({
				boundary,
				items: mutation.committedItems,
				source: initialProposal.source,
				createChange: (revert) =>
					mutation.scope === 'series'
						? {
								kind: 'recurrence-series-update',
								source: initialProposal.source,
								operation: mutation.operation,
								seriesItem: mutation.seriesItem,
								previousSeriesItem: mutation.previousSeriesItem,
								exceptionItems: mutation.exceptionItems,
								previousExceptionItems: mutation.previousExceptionItems,
								revert
							}
						: mutation.previousItem
							? {
									kind: 'recurrence-exception-update',
									source: initialProposal.source,
									seriesItem: mutation.seriesItem,
									item: mutation.item,
									previousItem: mutation.previousItem,
									revert
								}
							: {
									kind: 'recurrence-exception-add',
									source: initialProposal.source,
									seriesItem: mutation.seriesItem,
									item: mutation.item,
									revert
								},
				keyRemap:
					mutation.scope === 'series'
						? {
								forward: mutation.remapOccurrenceKey,
								backward: mutation.restoreOccurrenceKey
							}
						: undefined
			})
		);
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
			if (!isValidPlacement(item, this.calendar.snapDuration)) return 'invalid-target';
			if (!this.isInsideValidRange(item)) return 'valid-range';
			if (this.calendar.constrainToBusinessHours && !this.isInsideBusinessHours(item)) {
				return 'business-hours';
			}
			const proposal: EventCalendarProposedUpdate<TItemFields> = {
				...mutation.proposal,
				occurrence,
				item
			};
			for (const conflict of occurrences) {
				if (
					conflict.key === occurrence.key ||
					conflict.item.display === 'background' ||
					!this.itemsShareResource(conflict.item, item) ||
					!rangesIntersect(
						{ start: occurrence.start, end: occurrence.end },
						{ start: conflict.start, end: conflict.end }
					)
				) {
					continue;
				}
				if (!this.allowsConflict({ kind: 'item', proposal, conflictingOccurrence: conflict })) {
					return 'overlap';
				}
			}
		}
		if (this.calendar.canUpdateItem?.(mutation.proposal) === false) return 'custom-policy';
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
		if (adjustment.resourceIds !== undefined) {
			return setEventCalendarResourceIds(adjusted, adjustment.resourceIds ?? []);
		}
		if (adjustment.resourceId === null) return setEventCalendarResourceIds(adjusted, []);
		return adjustment.resourceId === undefined
			? adjusted
			: setEventCalendarResourceIds(adjusted, [adjustment.resourceId]);
	}

	private commitCollection(
		mutation: EventCalendarCollectionMutation<TItemFields>
	): EventCalendarModelBoundary<TItemFields> | null {
		if (!this.calendar.isModelBoundaryCurrent(mutation.boundary)) {
			this.reportBlocked({ reason: 'stale', source: mutation.source });
			return null;
		}
		const committedItems = [...mutation.items];
		this.calendar.validateCandidateItems(committedItems);
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
				if (historyEntry) {
					const index = this.historyPast.lastIndexOf(historyEntry);
					if (index >= 0) this.historyPast.splice(index, 1);
				}
				mutation.onRevert?.();
				this.synchronizeHistoryBoundary();
				this.historyRevision += 1;
				this.calendar.notifyInteractionStatus({ type: 'revert', ...committedStatus });
			}
		);
		const change = mutation.createChange(revert, publishedItems);
		committedStatus = { source: change.source, item: getChangeStatusItem(change) };
		this.calendar.eventHandlers.onItemsChange?.({ items: publishedItems, change });
		if (wasReverted) return null;
		if (!this.calendar.isModelBoundaryCurrent(committedBoundary)) {
			this.reportBlocked({ reason: 'stale', source: mutation.source });
			return null;
		}
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
		this.historyPast.push(entry);
		if (this.historyPast.length > limit) {
			this.historyPast.splice(0, this.historyPast.length - limit);
		}
		this.historyFuture = [];
		this.historyRevision += 1;
		return entry;
	}

	private applyHistory(direction: 'undo' | 'redo'): boolean {
		if (this.calendar.disabled) return false;
		const from = direction === 'undo' ? this.historyPast : this.historyFuture;
		const to = direction === 'undo' ? this.historyFuture : this.historyPast;
		const entry = from.at(-1);
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
			onRevert: () => {
				if (direction === 'undo' && this.historyFuture.at(-1) === entry) {
					this.historyFuture.pop();
					this.historyPast.push(entry);
				} else if (direction === 'redo' && this.historyPast.at(-1) === entry) {
					this.historyPast.pop();
					this.historyFuture.push(entry);
				}
			}
		});
		if (!committedBoundary) return false;
		from.pop();
		to.push(entry);
		this.synchronizeHistoryBoundary(committedBoundary);
		this.historyRevision += 1;
		return true;
	}

	private synchronizeHistoryBoundary(
		boundary: EventCalendarModelBoundary<TItemFields> = this.calendar.modelBoundary
	): void {
		const pastEntry = this.historyPast.at(-1);
		const futureEntry = this.historyFuture.at(-1);
		if (pastEntry) pastEntry.expectedBoundary = boundary;
		if (futureEntry) futureEntry.expectedBoundary = boundary;
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
		if (source.allDay === true && slot.allDay) {
			placed = replaceEventCalendarPlacement(next, {
				allDay: true,
				start: slot.start,
				end: addCivilDays(slot.start, civilDayDifference(source.start, source.end))
			});
		} else if (source.allDay !== true && !slot.allDay) {
			placed = replaceEventCalendarPlacement(next, {
				allDay: false,
				start: slot.start,
				end: new Date(slot.start.getTime() + source.end.getTime() - source.start.getTime())
			});
		} else {
			return next;
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

	private isInsideValidRange(item: EventCalendarItem<TItemFields>): boolean {
		if (!this.calendar.validRange) return true;
		const range = itemRange(item, this.calendar.timeZone);
		return (
			range.start >= this.calendar.validRange.start && range.end <= this.calendar.validRange.end
		);
	}

	private isSlotInsideValidRange(slot: EventCalendarSlot): boolean {
		if (!this.calendar.validRange) return true;
		const range = slotRange(slot, this.calendar.timeZone);
		return (
			range.start >= this.calendar.validRange.start && range.end <= this.calendar.validRange.end
		);
	}

	private isInsideBusinessHours(item: EventCalendarItem<TItemFields>): boolean {
		const range = itemRange(item, this.calendar.timeZone);
		const resourceIds = this.calendar.resourceModel.resolveItemLeafIds(item);
		if (resourceIds.length === 0) {
			return isRangeInsideBusinessHours(range, item.allDay === true, this.calendar);
		}
		return resourceIds.every((resourceId) =>
			isRangeInsideBusinessHours(
				range,
				item.allDay === true,
				this.calendar,
				this.calendar.resourceModel.getBusinessHours(resourceId) ?? this.calendar.businessHours
			)
		);
	}

	private isSlotInsideBusinessHours(slot: EventCalendarSlot): boolean {
		return isRangeInsideBusinessHours(
			slotRange(slot, this.calendar.timeZone),
			slot.allDay,
			this.calendar,
			this.calendar.resourceModel.getBusinessHours(slot.resourceId) ?? this.calendar.businessHours
		);
	}

	private findConflicts(
		item: EventCalendarItem<TItemFields>,
		ignoredOccurrenceKey?: string,
		ignoredSeriesId?: string
	) {
		if (item.display === 'background') return [];
		const range = itemRange(item, this.calendar.timeZone);
		return this.calendar.itemIndex.occurrences.filter(
			(occurrence) =>
				occurrence.key !== ignoredOccurrenceKey &&
				getEventCalendarOccurrenceSeriesId(occurrence) !== ignoredSeriesId &&
				occurrence.item.id !== item.id &&
				occurrence.item.display !== 'background' &&
				this.itemsShareResource(occurrence.item, item) &&
				rangesIntersect(range, { start: occurrence.start, end: occurrence.end })
		);
	}

	private findSlotConflicts(slot: EventCalendarSlot) {
		const range = slotRange(slot, this.calendar.timeZone);
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

	private assertBoundary(
		boundary: EventCalendarModelBoundary<TItemFields>,
		proposal: EventCalendarProposedUpdate<TItemFields>
	): boolean {
		if (this.calendar.isModelBoundaryCurrent(boundary)) return true;
		this.reportBlocked({ reason: 'stale', source: proposal.source, proposal });
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

function getChangeStatusItem<TItemFields extends object>(
	change: EventCalendarChange<TItemFields>
): EventCalendarItem<TItemFields> | undefined {
	if ('item' in change) return change.item;
	if ('seriesItem' in change) return change.seriesItem;
	return undefined;
}

function isValidPlacement<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	minimumMinutes: number
): boolean {
	if (item.allDay === true) return item.start < item.end;
	return (
		Number.isFinite(item.start.getTime()) &&
		item.end.getTime() - item.start.getTime() >= minimumMinutes * MINUTE_MS
	);
}

function isValidSlot(slot: EventCalendarSlot, minimumMinutes: number): boolean {
	return slot.allDay
		? slot.start < slot.end
		: slot.end.getTime() - slot.start.getTime() >= minimumMinutes * MINUTE_MS;
}

function itemRange<TItemFields extends object>(
	item: EventCalendarItem<TItemFields>,
	timeZone: string
): { start: Date; end: Date } {
	return item.allDay === true
		? { start: startOfZonedDay(item.start, timeZone), end: startOfZonedDay(item.end, timeZone) }
		: { start: item.start, end: item.end };
}

function slotRange(slot: EventCalendarSlot, timeZone: string): { start: Date; end: Date } {
	return slot.allDay
		? { start: startOfZonedDay(slot.start, timeZone), end: startOfZonedDay(slot.end, timeZone) }
		: { start: slot.start, end: slot.end };
}

function isRangeInsideBusinessHours<TItemFields extends object, TResourceFields extends object>(
	range: { start: Date; end: Date },
	isAllDay: boolean,
	calendar: EventCalendarState<TItemFields, TResourceFields>,
	businessHours: readonly EventCalendarBusinessHours[] = calendar.businessHours
): boolean {
	if (businessHours.length === 0) return false;
	const startDay = getZonedDay(range.start, calendar.timeZone);
	const inclusiveEnd = new Date(Math.max(range.start.getTime(), range.end.getTime() - 1));
	const endDay = getZonedDay(inclusiveEnd, calendar.timeZone);
	if (!isAllDay && startDay !== endDay) return false;
	if (!isAllDay) {
		return businessHours.some((window) => {
			if (window.daysOfWeek && !window.daysOfWeek.includes(getCivilWeekday(startDay))) return false;
			const start = resolveZonedMinutesOnDay(startDay, parseClock(window.start), calendar.timeZone);
			const end = resolveZonedMinutesOnDay(startDay, parseClock(window.end), calendar.timeZone);
			return range.start >= start && range.end <= end;
		});
	}
	for (let day = startDay; day <= endDay; day = addCivilDays(day, 1)) {
		if (
			!businessHours.some(
				(window) => !window.daysOfWeek || window.daysOfWeek.includes(getCivilWeekday(day))
			)
		) {
			return false;
		}
		if (day === endDay) break;
	}
	return true;
}

function parseClock(value: string): number {
	const [hours, minutes] = value.split(':').map(Number);
	return hours * 60 + minutes;
}
