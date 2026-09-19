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

/**
 * One validated commit attempt: the proposal that identifies it, the candidate collection to
 * publish, and family-specific commit state (a recurrence mutation, or none for placements).
 */
type EventCalendarPreparedBatch<TItemFields extends object, TMutation> = {
	proposal: EventCalendarProposedUpdate<TItemFields>;
	candidateItems: EventCalendarItem<TItemFields>[];
	mutation: TMutation;
};

/**
 * The per-family policy the shared commit orchestration drives. `reprepare` returns null only
 * after reporting the failure itself (a stale proposal target); structural and semantic
 * failures of an adjusted batch throw 'invalid-adjustment'.
 */
type EventCalendarCommitPolicy<TItemFields extends object, TMutation> = {
	prepare(): EventCalendarPreparedBatch<TItemFields, TMutation> | null;
	validate(batch: EventCalendarPreparedBatch<TItemFields, TMutation>): InvalidReason | null;
	/** Rebuild the normal candidate after the resolver; recurring edits keep their baseline phases. */
	revalidateAfterResolver?: (
		batch: EventCalendarPreparedBatch<TItemFields, TMutation>,
		validatePolicy: boolean
	) => EventCalendarPreparedBatch<TItemFields, TMutation> | null;
	reprepare(
		batch: EventCalendarPreparedBatch<TItemFields, TMutation>,
		adjustedItem: EventCalendarItem<TItemFields>
	): EventCalendarPreparedBatch<TItemFields, TMutation> | null;
	publish(
		batch: EventCalendarPreparedBatch<TItemFields, TMutation>
	): Pick<
		EventCalendarCollectionMutation<TItemFields>,
		'createChange' | 'keyRemap' | 'clearMissingRecurringSeriesId'
	>;
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
		return this.commitPreparedBatch(
			initialProposal,
			boundary,
			this.placementPolicy(initialProposal, boundary)
		);
	}

	/**
	 * The single commit orchestration: prepare a validated candidate, offer it to the resolve
	 * callback, revalidate the normal candidate after every resolver result, reprepare adjusted
	 * candidates, then hand the batch to the publication owner.
	 */
	private commitPreparedBatch<TMutation>(
		initialProposal: EventCalendarProposedUpdate<TItemFields>,
		boundary: EventCalendarModelBoundary<TItemFields>,
		policy: EventCalendarCommitPolicy<TItemFields, TMutation>
	): boolean {
		if (!this.assertBoundary(boundary, initialProposal)) return false;
		let batch = policy.prepare();
		if (!batch) return this.rejectStaleProposal(initialProposal);
		this.calendar.validateCandidateItems(batch.candidateItems);
		const initialReason = policy.validate(batch);
		if (initialReason) return this.rejectProposal(batch.proposal, initialReason);

		const onItemUpdate = this.calendar.onItemUpdate;
		const updateResult = onItemUpdate?.(batch.proposal);
		if (!this.assertBoundary(boundary, batch.proposal)) return false;
		if (updateResult === false) return this.rejectProposal(batch.proposal, 'custom-policy');
		const adjustment = updateResult && typeof updateResult === 'object' ? updateResult : null;
		if (adjustment) {
			const adjustedItem = this.applyAdjustment(batch.proposal.item, adjustment);
			const adjustedBatch = policy.reprepare(batch, adjustedItem);
			if (!adjustedBatch) return false;
			batch = adjustedBatch;
		} else if (policy.revalidateAfterResolver) {
			const revalidatedBatch = policy.revalidateAfterResolver(
				batch,
				onItemUpdate !== undefined
			);
			if (!revalidatedBatch) return false;
			batch = revalidatedBatch;
		}
		if (!this.assertBoundary(boundary, batch.proposal)) return false;
		return Boolean(
			this.commitCollection({
				boundary,
				items: batch.candidateItems,
				source: initialProposal.source,
				...policy.publish(batch)
			})
		);
	}

	private placementPolicy(
		initialProposal: EventCalendarProposedUpdate<TItemFields>,
		boundary: EventCalendarModelBoundary<TItemFields>
	): EventCalendarCommitPolicy<TItemFields, undefined> {
		return {
			prepare: () => {
				const candidateItems = this.getCandidateItems(initialProposal, boundary.items);
				return candidateItems
					? { proposal: initialProposal, candidateItems, mutation: undefined }
					: null;
			},
			validate: (batch) => this.validateProposal(batch.proposal),
			revalidateAfterResolver: (batch, validatePolicy) => {
				const candidateItems = this.getCandidateItems(batch.proposal, boundary.items);
				if (!candidateItems) {
					this.rejectStaleProposal(batch.proposal);
					return null;
				}
				this.calendar.validateCandidateItems(candidateItems);
				if (validatePolicy) {
					const reason = this.validateProposal(batch.proposal);
					if (reason) {
						this.rejectProposal(batch.proposal, reason);
						return null;
					}
				}
				return { proposal: batch.proposal, candidateItems, mutation: undefined };
			},
			reprepare: (batch, adjustedItem) => {
				const proposal = { ...batch.proposal, item: adjustedItem };
				const candidateItems = this.getCandidateItems(proposal, boundary.items);
				if (!candidateItems) {
					this.rejectStaleProposal(proposal);
					return null;
				}
				try {
					this.calendar.validateCandidateItems(candidateItems);
				} catch (error) {
					throw this.invalidAdjustmentError(error, proposal.item.id);
				}
				const reason = this.validateProposal(proposal);
				if (reason) {
					throw new EventCalendarError(
						'invalid-adjustment',
						'resolveItemUpdate returned an invalid adjustment.',
						{ reason, id: proposal.item.id }
					);
				}
				return { proposal, candidateItems, mutation: undefined };
			},
			publish: (batch) => ({
				createChange: (revert, publishedItems) => {
					const committedItem =
						publishedItems.find((item) => item.id === batch.proposal.item.id) ??
						batch.proposal.item;
					const kind =
						batch.proposal.kind === 'move'
							? 'move'
							: batch.proposal.kind.startsWith('resize')
								? 'resize'
								: 'update';
					return batch.proposal.source === 'external-drop' || batch.proposal.source === 'clipboard'
						? { kind: 'add', source: batch.proposal.source, item: committedItem, revert }
						: {
								kind,
								source: batch.proposal.source,
								item: committedItem,
								previousItem: batch.proposal.previousItem,
								revert
							};
				},
				clearMissingRecurringSeriesId:
					batch.proposal.source === 'external-drop' ||
					batch.proposal.source === 'clipboard' ||
					batch.proposal.previousItem.recurrence === undefined
						? undefined
						: batch.proposal.previousItem.id
			})
		};
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
		return this.commitPreparedBatch(
			initialProposal,
			boundary,
			this.recurrencePolicy(
				this.getRecurrenceMutationOptions(initialProposal, scope, boundary.items)
			)
		);
	}

	private recurrencePolicy(
		mutationOptions: CreateRecurrenceMutationOptions<TItemFields>
	): EventCalendarCommitPolicy<TItemFields, EventCalendarRecurrenceMutation<TItemFields>> {
		const toBatch = (mutation: EventCalendarRecurrenceMutation<TItemFields>) => ({
			proposal: mutation.proposal,
			candidateItems: mutation.committedItems,
			mutation
		});
		return {
			prepare: () => toBatch(createEventCalendarRecurrenceMutation(mutationOptions)),
			validate: (batch) => this.validateRecurrenceMutation(batch.mutation),
			reprepare: (batch, adjustedItem) => {
				try {
					const mutation =
						batch.mutation.scope === 'series'
							? regenerateEventCalendarSeriesMutation(
									mutationOptions,
									adjustedItem,
									batch.mutation.operation
								)
							: createEventCalendarRecurrenceMutation({
									...mutationOptions,
									exceptionId: batch.mutation.exceptionId,
									proposal: { ...batch.mutation.proposal, item: adjustedItem }
								});
					this.calendar.validateCandidateItems(mutation.committedItems);
					const reason = this.validateRecurrenceMutation(mutation);
					if (reason) {
						throw new EventCalendarError(
							'invalid-adjustment',
							'resolveItemUpdate returned an invalid recurring adjustment.',
							{ reason, id: adjustedItem.id }
						);
					}
					return toBatch(mutation);
				} catch (error) {
					throw this.invalidAdjustmentError(error, adjustedItem.id);
				}
			},
			publish: (batch) => {
				const mutation = batch.mutation;
				return {
					createChange: (revert) =>
						mutation.scope === 'series'
							? {
									kind: 'recurrence-series-update',
									source: mutationOptions.proposal.source,
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
										source: mutationOptions.proposal.source,
										seriesItem: mutation.seriesItem,
										item: mutation.item,
										previousItem: mutation.previousItem,
										revert
									}
								: {
										kind: 'recurrence-exception-add',
										source: mutationOptions.proposal.source,
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
				};
			}
		};
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
		// Validation runs consumer expansion code; a reentrant write must not be overwritten.
		if (!this.calendar.isModelBoundaryCurrent(mutation.boundary)) {
			this.reportBlocked({ reason: 'stale', source: mutation.source });
			return null;
		}
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
		const pastEntry = this.history.peekPast();
		const futureEntry = this.history.peekFuture();
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
