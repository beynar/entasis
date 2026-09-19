/* eslint-disable svelte/prefer-svelte-reactivity -- DOM registries and immutable configuration snapshots are not reactive state. */
import { tick } from 'svelte';
import { useLiveAnnouncer, type LiveAnnouncer } from '$lib/utils/useLiveAnnouncer.svelte.js';
import {
	createRovingRestoreVersion,
	useRovingRegistry
} from '$lib/utils/useRovingRegistry.svelte.js';
import {
	addCivilMonths,
	getCachedDateTimeFormatter,
	isSupportedDateDomainError,
	parseDateOnly
} from './eventCalendar.date.js';
import type { EventCalendarItemIndex } from './eventCalendar.items.js';
import { eventCalendarMonthDayTarget } from './eventCalendar.targets.js';
import type { EventCalendarState } from './eventCalendar.state.svelte.js';
import type {
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarView
} from './eventCalendar.types.js';
import type {
	EventCalendarDropTarget,
	EventCalendarInteractionStatus,
	EventCalendarItemOperation
} from './eventCalendar.interactions.svelte.js';

type MonthGridConfiguration = {
	days: readonly EventCalendarDateOnly[];
	enabledDays: ReadonlySet<EventCalendarDateOnly>;
	columnCount: number;
	leadingEmptyCells: number;
	direction: 'ltr' | 'rtl';
	onPage: (direction: -1 | 1, targetDay: EventCalendarDateOnly) => boolean;
};

export type EventCalendarTimeTarget = Readonly<{
	key: string;
	day: EventCalendarDateOnly;
	column: number;
	row: number;
	verticalOrder: number;
	kind: 'day-header' | 'all-day' | 'time-slot' | 'item';
	dropTarget?: EventCalendarDropTarget;
	itemKey?: string;
}>;

type TimeGridConfiguration = {
	targets: readonly EventCalendarTimeTarget[];
	direction: 'ltr' | 'rtl';
	onPage: (direction: -1 | 1) => boolean;
};

type AgendaConfiguration = {
	days: readonly EventCalendarDateOnly[];
};

/** Calendar-owned roving focus and live announcements. Later views extend this same owner. */
export class EventCalendarA11y<
	TItemFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>
> {
	focusedDay = $state<EventCalendarDateOnly | null>(null);
	mutationOccurrenceKey = $state<string | null>(null);
	mutationOperation = $state<EventCalendarItemOperation | null>(null);
	readonly liveRegionId: string;
	private readonly announcer: LiveAnnouncer;
	/** Day and time-grid restores share a domain: the newest one wins the tab stop. */
	private readonly focusVersion = createRovingRestoreVersion();
	private readonly occurrenceFocusVersion = createRovingRestoreVersion();
	private readonly dayRegistry = useRovingRegistry<EventCalendarDateOnly>({
		version: this.focusVersion,
		releaseWhen: 'focused',
		onRelease: (day) => {
			this.pendingDay = day;
		},
		restoreTarget: () => (this.pendingDay ? this.resolveEnabledDay(this.pendingDay) : null),
		onRestore: (day) => {
			this.focusedDay = day;
			this.pendingDay = null;
		}
	});
	private days: readonly EventCalendarDateOnly[] = [];
	private enabledDays = $state.raw<ReadonlySet<EventCalendarDateOnly>>(new Set());
	private columnCount = 1;
	private leadingEmptyCells = 0;
	private direction: 'ltr' | 'rtl' = 'ltr';
	private onPage: (direction: -1 | 1, targetDay: EventCalendarDateOnly) => boolean = () => false;
	private pendingDay: EventCalendarDateOnly | null = null;
	private readonly timeRegistry = useRovingRegistry<string>({
		version: this.focusVersion,
		releaseWhen: 'focused',
		onRelease: (targetKey) => {
			const target = this.timeTargetByKey.get(targetKey);
			if (target) this.pendingTimeTarget = target;
		},
		restoreTarget: (targetKey) => (this.focusedTimeTarget === targetKey ? targetKey : null),
		onRestore: () => {
			this.pendingTimeTarget = null;
		}
	});
	private timeTargets: readonly EventCalendarTimeTarget[] = [];
	private timeTargetByKey = new Map<string, EventCalendarTimeTarget>();
	private focusedTimeTarget = $state<string | null>(null);
	private focusedTimeAnchor: EventCalendarTimeTarget | null = null;
	private pendingTimeTarget: Pick<EventCalendarTimeTarget, 'column' | 'row' | 'kind'> | null = null;
	private onTimePage: (direction: -1 | 1) => boolean = () => false;
	private lifecycleVersion = 0;
	/** An occurrence renders one control per segment, and the first of them takes the focus. */
	private readonly occurrenceRegistry = useRovingRegistry<string>({
		version: this.occurrenceFocusVersion,
		multiple: true,
		onRelease: (occurrenceKey) => {
			if (this.focusedOccurrenceKey === occurrenceKey) this.pendingOccurrenceKey = occurrenceKey;
		},
		restoreTarget: (occurrenceKey) =>
			this.pendingOccurrenceKey === occurrenceKey ? occurrenceKey : null,
		onRestore: (occurrenceKey) => {
			this.focusedOccurrenceKey = occurrenceKey;
			this.pendingOccurrenceKey = null;
		}
	});
	private focusedOccurrenceKey: string | null = null;
	private pendingOccurrenceKey: string | null = null;
	private activeView: EventCalendarView | null = null;
	private previousFocusContext = '';
	private announcedResourceTarget = '';

	constructor(private readonly calendar: EventCalendarState<TItemFields, TResourceFields>) {
		this.announcer = useLiveAnnouncer(calendar.instanceId, 'status');
		this.liveRegionId = this.announcer.regionId;
		$effect(() => this.syncResourceTargetAnnouncement());
	}

	configureView(view: EventCalendarView): void {
		if (this.activeView === view) return;
		this.activeView = view;
		this.focusVersion.bump();
		this.occurrenceFocusVersion.bump();
		this.dayRegistry.clear();
		this.days = [];
		this.enabledDays = new Set();
		this.pendingDay = null;
		this.timeRegistry.clear();
		this.timeTargets = [];
		this.timeTargetByKey.clear();
		this.focusedTimeTarget = null;
		this.pendingTimeTarget = null;
		this.occurrenceRegistry.clear();
		this.pendingOccurrenceKey = this.focusedOccurrenceKey;
	}

	canStartItemMutation(
		occurrence: EventCalendarOccurrence<TItemFields>,
		operation: EventCalendarItemOperation,
		source: 'keyboard' | 'single-pointer'
	): boolean {
		return this.calendar.interaction.canBeginAssistedItem(occurrence, operation, source);
	}

	startItemMutation(
		occurrence: EventCalendarOccurrence<TItemFields>,
		operation: EventCalendarItemOperation,
		source: 'keyboard' | 'single-pointer',
		sourceResourceId?: string
	): boolean {
		if (
			!this.calendar.interaction.beginAssistedItem(occurrence, operation, source, sourceResourceId)
		)
			return false;
		this.mutationOccurrenceKey = occurrence.key;
		this.mutationOperation = operation;
		this.focusedOccurrenceKey = occurrence.key;
		return true;
	}

	cancelItemMutation(): boolean {
		if (!this.mutationOccurrenceKey) return false;
		const occurrenceKey = this.mutationOccurrenceKey;
		this.calendar.interaction.cancel();
		this.clearMutation();
		this.restoreOccurrenceFocus(occurrenceKey);
		return true;
	}

	activateMutationTarget(target: EventCalendarDropTarget): boolean {
		if (!this.calendar.interaction.activateAssistedTarget(target)) return false;
		if (!this.calendar.interaction.gesture) {
			const occurrenceKey = this.mutationOccurrenceKey;
			this.clearMutation();
			if (occurrenceKey) this.restoreOccurrenceFocus(occurrenceKey);
		}
		return true;
	}

	handleItemKeydown(
		event: KeyboardEvent,
		occurrence: EventCalendarOccurrence<TItemFields>,
		allowResize = true,
		sourceResourceId?: string,
		allowMove = true
	): boolean {
		if (event.altKey || event.ctrlKey || event.metaKey) return false;
		if (!this.mutationOccurrenceKey) {
			const operation = getMutationShortcut(event.key);
			if (!allowMove && operation === 'move') return false;
			if (!allowResize && operation !== 'move') return false;
			if (
				!operation ||
				!this.startItemMutation(occurrence, operation, 'keyboard', sourceResourceId)
			)
				return false;
			event.preventDefault();
			return true;
		}
		if (this.mutationOccurrenceKey !== occurrence.key) return false;
		if (event.key === 'Escape') {
			event.preventDefault();
			this.cancelItemMutation();
			return true;
		}
		if (event.key === 'Enter') {
			event.preventDefault();
			const occurrenceKey = this.mutationOccurrenceKey;
			this.calendar.interaction.commitAssistedItem();
			if (!this.calendar.interaction.gesture) {
				this.clearMutation();
				this.restoreOccurrenceFocus(occurrenceKey);
			}
			return true;
		}
		if (!event.key.startsWith('Arrow')) return false;
		const proposal = this.calendar.interaction.proposal;
		event.preventDefault();
		const isAllDay = proposal ? proposal.item.allDay === true : occurrence.allDay;
		if (
			this.calendar.view === 'resource' &&
			this.mutationOperation === 'move' &&
			(event.key === 'ArrowLeft' || event.key === 'ArrowRight')
		) {
			this.calendar.interaction.stepAssistedItem({
				resourceDirection: getArrowDirection(event.key, this.calendar.direction)
			});
			return true;
		}
		if (isAllDay) {
			this.calendar.interaction.stepAssistedItem({
				dayDelta: getArrowDirection(event.key, this.calendar.direction)
			});
			return true;
		}
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			this.calendar.interaction.stepAssistedItem({
				minuteDelta:
					event.key === 'ArrowDown' ? this.calendar.snapDuration : -this.calendar.snapDuration
			});
			return true;
		}
		const direction = getArrowDirection(event.key, this.calendar.direction);
		this.calendar.interaction.stepAssistedItem({ dayDelta: direction });
		return true;
	}

	registerOccurrenceControl(occurrenceKey: string, node: HTMLElement): () => void {
		const release = this.occurrenceRegistry.register(occurrenceKey, node);
		if (this.pendingOccurrenceKey === occurrenceKey) {
			this.occurrenceRegistry.schedule(occurrenceKey);
		}
		return release;
	}

	handleOccurrenceFocus(occurrenceKey: string, day: EventCalendarDateOnly): void {
		this.focusedOccurrenceKey = occurrenceKey;
		this.pendingOccurrenceKey = null;
		this.focusedDay = day;
	}

	restoreOccurrenceFocus(occurrenceKey = this.focusedOccurrenceKey): void {
		if (!occurrenceKey) return;
		this.pendingOccurrenceKey = occurrenceKey;
		this.occurrenceRegistry.schedule(occurrenceKey);
	}

	finishItemMutation(): void {
		const occurrenceKey = this.mutationOccurrenceKey;
		this.clearMutation();
		if (occurrenceKey) this.restoreOccurrenceFocus(occurrenceKey);
	}

	getFocusedOccurrenceKey(): string | null {
		return this.focusedOccurrenceKey;
	}

	restoreFocusAfterOccurrenceRemoval(occurrenceKey: string): void {
		if (this.focusedOccurrenceKey !== occurrenceKey) return;
		const day = this.focusedDay;
		const timeTarget = this.focusedTimeAnchor ?? undefined;
		this.focusedOccurrenceKey = null;
		this.pendingOccurrenceKey = null;
		const version = this.lifecycleVersion;
		void this.restoreNearestCalendarFocusAfterRender(version, day, timeTarget);
	}

	configureMonth(configuration: MonthGridConfiguration): void {
		this.days = configuration.days;
		this.enabledDays = configuration.enabledDays;
		this.columnCount = Math.max(1, configuration.columnCount);
		this.leadingEmptyCells = Math.max(0, configuration.leadingEmptyCells);
		this.direction = configuration.direction;
		this.onPage = configuration.onPage;

		const requestedDay = this.pendingDay ?? this.focusedDay;
		const nextDay = this.resolveEnabledDay(requestedDay);
		if (nextDay) this.focusedDay = nextDay;
		if (this.pendingDay) {
			this.pendingDay = nextDay;
			this.dayRegistry.schedule();
		}
	}

	configureTimeGrid(configuration: TimeGridConfiguration): void {
		this.timeTargets = configuration.targets;
		this.timeTargetByKey = new Map(configuration.targets.map((target) => [target.key, target]));
		this.direction = configuration.direction;
		this.onTimePage = configuration.onPage;

		let nextTarget = this.focusedTimeTarget
			? this.timeTargetByKey.get(this.focusedTimeTarget)
			: undefined;
		if (!nextTarget && this.pendingTimeTarget) {
			nextTarget = this.findNearestTimeTarget(this.pendingTimeTarget);
		}
		nextTarget ??= this.timeTargets[0];
		this.focusedTimeTarget = nextTarget?.key ?? null;
		if (this.pendingTimeTarget && nextTarget) this.timeRegistry.schedule(nextTarget.key);
	}

	configureAgenda(configuration: AgendaConfiguration): void {
		this.days = configuration.days;
		this.enabledDays = new Set(configuration.days);
		const nextDay = this.resolveEnabledDay(this.focusedDay);
		if (nextDay) this.focusedDay = nextDay;
	}

	registerTimeTarget(targetKey: string, node: HTMLElement): () => void {
		const release = this.timeRegistry.register(targetKey, node);
		if (this.focusedTimeTarget === targetKey && this.pendingTimeTarget) {
			this.timeRegistry.schedule(targetKey);
		}
		return release;
	}

	getTimeTargetTabIndex(targetKey: string): 0 | -1 {
		return this.focusedTimeTarget === targetKey ? 0 : -1;
	}

	handleTimeTargetFocus(targetKey: string): void {
		const target = this.timeTargetByKey.get(targetKey);
		if (!target) return;
		if (target.kind !== 'item') this.clearOccurrenceFocus();
		this.focusedDay = target.day;
		this.focusedTimeTarget = targetKey;
		this.focusedTimeAnchor = target;
		this.pendingTimeTarget = null;
	}

	handleTimeTargetKeydown(event: KeyboardEvent, targetKey: string): boolean {
		if (event.altKey || event.ctrlKey || event.metaKey) return false;
		const current = this.timeTargetByKey.get(targetKey);
		if (!current) return false;
		if (event.key === 'Escape' && !this.calendar.interaction.isKeyboardSlotActive) {
			event.preventDefault();
			this.calendar.interaction.clearFocusedSelection();
			this.timeRegistry.get(targetKey)?.blur();
			return true;
		}
		if (this.calendar.interaction.isKeyboardSlotActive && event.key === 'Enter') {
			event.preventDefault();
			return this.calendar.interaction.commitKeyboardSlot();
		}
		if (event.key === ' ' && current.dropTarget) {
			event.preventDefault();
			return this.calendar.interaction.beginKeyboardSlot(current.dropTarget);
		}

		let target: EventCalendarTimeTarget | undefined;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			const physicalDirection: -1 | 1 = event.key === 'ArrowRight' ? 1 : -1;
			const direction: -1 | 1 =
				this.direction === 'rtl' ? (physicalDirection === 1 ? -1 : 1) : physicalDirection;
			target = this.findHorizontalTimeTarget(current, direction);
		} else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			target = this.findVerticalTimeTarget(current, event.key === 'ArrowDown' ? 1 : -1);
		} else if (event.key === 'Home' || event.key === 'End') {
			target = this.findEdgeTimeTarget(current, event.key === 'End');
		} else if (event.key === 'PageUp' || event.key === 'PageDown') {
			const direction = event.key === 'PageDown' ? 1 : -1;
			this.pendingTimeTarget = current;
			if (!this.onTimePage(direction)) this.pendingTimeTarget = null;
			event.preventDefault();
			return true;
		} else {
			return false;
		}

		event.preventDefault();
		if (target) {
			this.focusTimeTarget(target);
			if (this.calendar.interaction.isKeyboardSlotActive && target.dropTarget) {
				this.calendar.interaction.updateKeyboardSlot(target.dropTarget);
			} else if (target.dropTarget) {
				this.calendar.interaction.syncFocusedSlotSelection(target.dropTarget);
			} else if (target.itemKey) {
				this.calendar.interaction.syncFocusedItemSelection(target.itemKey);
			} else {
				this.calendar.interaction.clearFocusedSelection();
			}
		}
		return true;
	}

	registerDay(day: EventCalendarDateOnly, node: HTMLElement): () => void {
		const release = this.dayRegistry.register(day, node);
		if (this.pendingDay === day) this.dayRegistry.schedule();
		return release;
	}

	getDayTabIndex(day: EventCalendarDateOnly): 0 | -1 {
		if (!this.enabledDays.has(day)) return -1;
		const focusDay = this.resolveEnabledDay(this.focusedDay);
		return focusDay === day ? 0 : -1;
	}

	handleDayFocus(day: EventCalendarDateOnly): void {
		if (!this.enabledDays.has(day)) return;
		this.clearOccurrenceFocus();
		this.focusedDay = day;
		this.pendingDay = null;
	}

	handleDayKeydown(event: KeyboardEvent, day: EventCalendarDateOnly): boolean {
		if (event.altKey || event.ctrlKey || event.metaKey) return false;
		const dayIndex = this.days.indexOf(day);
		if (dayIndex < 0) return false;
		if (event.key === 'Escape' && !this.calendar.interaction.isKeyboardSlotActive) {
			event.preventDefault();
			this.calendar.interaction.clearFocusedSelection();
			this.dayRegistry.get(day)?.blur();
			return true;
		}
		if (this.calendar.interaction.isKeyboardSlotActive && event.key === 'Enter') {
			event.preventDefault();
			return this.calendar.interaction.commitKeyboardSlot();
		}
		if (event.key === ' ') {
			event.preventDefault();
			return this.calendar.interaction.beginKeyboardSlot(eventCalendarMonthDayTarget(day));
		}

		let target: EventCalendarDateOnly | null;
		if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
			const isNextPhysical = event.key === 'ArrowRight';
			const chronologicalDirection =
				this.direction === 'rtl' ? (isNextPhysical ? -1 : 1) : isNextPhysical ? 1 : -1;
			target = this.findEnabledByStep(dayIndex, chronologicalDirection);
		} else if (event.key === 'ArrowUp') {
			target = this.findEnabledByStep(dayIndex, -this.columnCount);
		} else if (event.key === 'ArrowDown') {
			target = this.findEnabledByStep(dayIndex, this.columnCount);
		} else if (event.key === 'Home') {
			target = this.findEnabledInRow(dayIndex, false);
		} else if (event.key === 'End') {
			target = this.findEnabledInRow(dayIndex, true);
		} else if (event.key === 'PageUp' || event.key === 'PageDown') {
			const direction = event.key === 'PageDown' ? 1 : -1;
			try {
				this.pendingDay = addCivilMonths(day, direction);
			} catch (error) {
				if (!isSupportedDateDomainError(error)) throw error;
				this.pendingDay = null;
				event.preventDefault();
				return true;
			}
			if (!this.onPage(direction, this.pendingDay)) this.pendingDay = null;
			this.dayRegistry.schedule();
			event.preventDefault();
			return true;
		} else {
			return false;
		}

		if (!target) return true;
		event.preventDefault();
		this.focusDay(target);
		if (this.calendar.interaction.isKeyboardSlotActive) {
			this.calendar.interaction.updateKeyboardSlot(eventCalendarMonthDayTarget(target));
		} else {
			this.calendar.interaction.syncFocusedSlotSelection(eventCalendarMonthDayTarget(target));
		}
		return true;
	}

	get announcement(): string {
		return this.announcer.message;
	}

	announce(message: string): void {
		this.announcer.announce(message);
	}

	remapOccurrenceKeys(remap: (key: string) => string): void {
		if (this.focusedOccurrenceKey) this.focusedOccurrenceKey = remap(this.focusedOccurrenceKey);
		if (this.pendingOccurrenceKey) this.pendingOccurrenceKey = remap(this.pendingOccurrenceKey);
		if (this.mutationOccurrenceKey) this.mutationOccurrenceKey = remap(this.mutationOccurrenceKey);
		if (typeof document === 'undefined') return;
		const root = document
			.getElementById(this.liveRegionId)
			?.closest<HTMLElement>('[data-event-calendar-part="root"]');
		if (!root) return;
		const activeElement = document.activeElement;
		if (!(activeElement instanceof HTMLElement) || !root.contains(activeElement)) return;
		const item = activeElement.closest<HTMLElement>('[data-occurrence-key]');
		const previousKey = item?.dataset.occurrenceKey;
		if (!previousKey) return;
		const nextKey = remap(previousKey);
		if (nextKey === previousKey) return;
		const version = this.focusVersion.bump();
		queueMicrotask(() => {
			if (!this.focusVersion.isCurrent(version)) return;
			for (const candidate of root.querySelectorAll<HTMLElement>('[data-occurrence-key]')) {
				if (candidate.dataset.occurrenceKey !== nextKey) continue;
				(candidate.querySelector<HTMLElement>('button') ?? candidate).focus();
				return;
			}
		});
	}

	reconcileControlledFocus(
		focusContext: string,
		itemIndex: EventCalendarItemIndex<TItemFields>
	): void {
		const occurrenceKey = this.focusedOccurrenceKey;
		if (this.previousFocusContext && this.previousFocusContext !== focusContext && occurrenceKey) {
			const occurrence = itemIndex.getOccurrence(occurrenceKey);
			if (occurrence) {
				this.restoreOccurrenceFocus(occurrence.key);
				this.announce(this.calendar.messages.eventCalendarFocusRestored(occurrence.item.title));
			} else {
				this.restoreFocusAfterOccurrenceRemoval(occurrenceKey);
			}
		}
		this.previousFocusContext = focusContext;
		if (occurrenceKey && !itemIndex.getOccurrence(occurrenceKey)) {
			this.restoreFocusAfterOccurrenceRemoval(occurrenceKey);
		}
	}

	syncInteractionStatus(status: EventCalendarInteractionStatus<TItemFields>): void {
		const messages = this.calendar.messages;
		if (status.type === 'mode') {
			const operation = this.getOperationLabel(status.operation);
			this.announce(
				status.source === 'keyboard'
					? messages.eventCalendarKeyboardMode(operation, status.occurrence.item.title)
					: messages.eventCalendarPointerMode(operation, status.occurrence.item.title)
			);
			return;
		}
		if (status.type === 'proposal') {
			this.announce(
				messages.eventCalendarProposedPlacement(this.getPlacementLabel(status.proposal.item))
			);
			return;
		}
		if (status.type === 'invalid') {
			this.announce(messages.eventCalendarMutationInvalid());
			return;
		}
		const title = status.item?.title ?? messages.eventCalendarLabel;
		if (status.type === 'commit') {
			this.finishItemMutation();
			this.announce(messages.eventCalendarMutationCommitted(title));
			return;
		}
		if (status.type === 'revert') {
			this.announce(messages.eventCalendarMutationReverted(title));
			return;
		}
		this.finishItemMutation();
		this.announce(messages.eventCalendarMutationCancelled(title));
	}

	get interactionStatus(): string {
		const gesture = this.calendar.interaction.gesture;
		if (!gesture) return '';
		const messages = this.calendar.messages;
		let gestureLabel = messages.eventCalendarSelectRangeGesture;
		if (gesture.kind === 'move') gestureLabel = messages.eventCalendarMoveGesture;
		if (gesture.kind === 'resize-start') gestureLabel = messages.eventCalendarResizeStartGesture;
		if (gesture.kind === 'resize-end') gestureLabel = messages.eventCalendarResizeEndGesture;
		const labels = [
			gestureLabel,
			this.calendar.interaction.isValid === true
				? messages.eventCalendarValidTarget
				: messages.eventCalendarInvalidTarget,
			messages.eventCalendarTimeZone(this.calendar.timeZone)
		];
		if (this.calendar.interaction.proposal?.occurrence?.isRecurring) {
			labels.unshift(messages.eventCalendarRecurringEvent);
		}
		if (
			this.calendar.view === 'resource' &&
			gesture.kind === 'move' &&
			this.calendar.interaction.isValid === true &&
			this.calendar.interaction.proposal
		) {
			labels.push(this.getResourceMoveAnnouncement(this.calendar.interaction.proposal.item));
		}
		return labels.join('. ');
	}

	destroy(): void {
		this.announcer.reset();
		this.lifecycleVersion += 1;
		this.focusVersion.bump();
		this.occurrenceFocusVersion.bump();
		this.dayRegistry.clear();
		this.days = [];
		this.enabledDays = new Set();
		this.pendingDay = null;
		this.timeRegistry.clear();
		this.timeTargets = [];
		this.timeTargetByKey.clear();
		this.focusedTimeTarget = null;
		this.focusedTimeAnchor = null;
		this.pendingTimeTarget = null;
		this.occurrenceRegistry.clear();
		this.focusedOccurrenceKey = null;
		this.pendingOccurrenceKey = null;
		this.activeView = null;
		this.previousFocusContext = '';
		this.announcedResourceTarget = '';
		this.clearMutation();
	}

	private syncResourceTargetAnnouncement(): void {
		const gesture = this.calendar.interaction.gesture;
		const proposal = this.calendar.interaction.proposal;
		if (
			this.calendar.view !== 'resource' ||
			!gesture ||
			gesture.kind !== 'move' ||
			this.calendar.interaction.isValid !== true ||
			!proposal
		) {
			this.announcedResourceTarget = '';
			return;
		}
		const resourceTarget =
			this.calendar.resourceModel.resolveItemLeafIds(proposal.item).join(',') || 'unassigned';
		if (resourceTarget === this.announcedResourceTarget) return;
		this.announcedResourceTarget = resourceTarget;
		this.announce(this.getResourceMoveAnnouncement(proposal.item));
	}

	private getOperationLabel(operation: EventCalendarItemOperation): string {
		const messages = this.calendar.messages;
		if (operation === 'move') return messages.eventCalendarMoveAction;
		if (operation === 'resize-start') return messages.eventCalendarResizeStartAction;
		return messages.eventCalendarResizeEndAction;
	}

	private getPlacementLabel(item: EventCalendarItem<TItemFields>): string {
		const formatter = getCachedDateTimeFormatter(this.calendar.locale, this.calendar.timeZone, {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			timeZoneName: 'shortOffset'
		});
		const placement =
			item.allDay === true
				? `${item.start} – ${item.end}`
				: formatter.formatRange(item.start, item.end);
		const resourceTitles = this.calendar.resourceModel
			.resolveItemLeafIds(item)
			.map((resourceId) => this.calendar.resourceModel.resolveLeaf(resourceId)?.title)
			.filter((title): title is string => Boolean(title));
		if (resourceTitles.length > 0) return `${placement}, ${resourceTitles.join(', ')}`;
		return this.calendar.view === 'resource'
			? `${placement}, ${this.calendar.messages.eventCalendarUnassignedResource}`
			: placement;
	}

	private getResourceMoveAnnouncement(item: EventCalendarItem<TItemFields>): string {
		const resources = this.calendar.resourceModel
			.resolveItemLeafIds(item)
			.map((resourceId) => this.calendar.resourceModel.resolveLeaf(resourceId)?.title)
			.filter((title): title is string => Boolean(title));
		return this.calendar.messages.eventCalendarResourceMoveAnnouncement(
			resources.join(', ') || this.calendar.messages.eventCalendarUnassignedResource
		);
	}

	private clearMutation(): void {
		this.mutationOccurrenceKey = null;
		this.mutationOperation = null;
	}

	private clearOccurrenceFocus(): void {
		this.occurrenceFocusVersion.bump();
		this.focusedOccurrenceKey = null;
		this.pendingOccurrenceKey = null;
	}

	private restoreNearestCalendarFocus(
		dayAnchor: EventCalendarDateOnly | null,
		timeAnchor?: EventCalendarTimeTarget
	): void {
		if (this.activeView === 'month' || this.activeView === 'agenda') {
			const day =
				this.activeView === 'agenda'
					? this.resolveAvailableDay(dayAnchor)
					: this.resolveEnabledDay(dayAnchor ?? this.days[0] ?? null);
			if (day) {
				this.focusDay(day);
				return;
			}
		}

		const availableTargets = this.timeTargets.filter((target) => this.timeRegistry.has(target.key));
		const target = timeAnchor
			? availableTargets.reduce<EventCalendarTimeTarget | undefined>((closest, candidate) => {
					if (!closest) return candidate;
					return getTimeTargetDistance(candidate, timeAnchor) <
						getTimeTargetDistance(closest, timeAnchor)
						? candidate
						: closest;
				}, undefined)
			: availableTargets[0];
		if (target) {
			this.focusTimeTarget(target);
			return;
		}
		this.focusCalendarRoot();
	}

	private async restoreNearestCalendarFocusAfterRender(
		version: number,
		dayAnchor: EventCalendarDateOnly | null,
		timeAnchor?: EventCalendarTimeTarget
	): Promise<void> {
		await tick();
		if (version !== this.lifecycleVersion) return;
		this.restoreNearestCalendarFocus(dayAnchor, timeAnchor);
	}

	private resolveAvailableDay(day: EventCalendarDateOnly | null): EventCalendarDateOnly | null {
		const availableDays = this.days.filter(
			(candidate) => this.enabledDays.has(candidate) && this.dayRegistry.has(candidate)
		);
		if (availableDays.length === 0) return null;
		if (!day) return availableDays[0];
		return availableDays.reduce((closest, candidate) => {
			const candidateDistance = Math.abs(compareDays(candidate, day));
			const closestDistance = Math.abs(compareDays(closest, day));
			return candidateDistance < closestDistance ? candidate : closest;
		});
	}

	private focusCalendarRoot(): void {
		if (typeof document === 'undefined') return;
		const root = document
			.getElementById(this.liveRegionId)
			?.closest<HTMLElement>('[data-event-calendar-part="root"]');
		if (!root) return;
		if (!root.hasAttribute('tabindex')) root.tabIndex = -1;
		root.focus();
	}

	private focusTimeTarget(target: EventCalendarTimeTarget): void {
		const element = this.timeRegistry.get(target.key);
		this.focusedTimeTarget = target.key;
		if (!element) {
			this.pendingTimeTarget = target;
			this.timeRegistry.schedule(target.key);
			return;
		}
		this.pendingTimeTarget = null;
		element.focus();
	}

	private findHorizontalTimeTarget(
		current: EventCalendarTimeTarget,
		direction: -1 | 1
	): EventCalendarTimeTarget | undefined {
		const columns = [...new Set(this.timeTargets.map((target) => target.column))].sort(
			(left, right) => left - right
		);
		const columnIndex = columns.indexOf(current.column);
		const nextColumn = columns[columnIndex + direction];
		if (nextColumn === undefined) return undefined;
		return this.findNearestTimeTarget({ ...current, column: nextColumn });
	}

	private findVerticalTimeTarget(
		current: EventCalendarTimeTarget,
		direction: -1 | 1
	): EventCalendarTimeTarget | undefined {
		return this.timeTargets
			.filter(
				(target) =>
					target.column === current.column &&
					(direction > 0
						? target.verticalOrder > current.verticalOrder
						: target.verticalOrder < current.verticalOrder)
			)
			.sort((left, right) =>
				direction > 0
					? left.verticalOrder - right.verticalOrder
					: right.verticalOrder - left.verticalOrder
			)[0];
	}

	private findEdgeTimeTarget(
		current: EventCalendarTimeTarget,
		fromEnd: boolean
	): EventCalendarTimeTarget | undefined {
		const columns = this.timeTargets.map((target) => target.column);
		if (columns.length === 0) return undefined;
		const column = fromEnd ? Math.max(...columns) : Math.min(...columns);
		return this.findNearestTimeTarget({ ...current, column });
	}

	private findNearestTimeTarget(
		anchor: Pick<EventCalendarTimeTarget, 'column' | 'row' | 'kind'>
	): EventCalendarTimeTarget | undefined {
		return this.timeTargets
			.filter((target) => target.column === anchor.column)
			.sort((left, right) => {
				const rowDistance = Math.abs(left.row - anchor.row) - Math.abs(right.row - anchor.row);
				if (rowDistance !== 0) return rowDistance;
				return (
					getTimeTargetKindRank(left.kind, anchor.kind) -
					getTimeTargetKindRank(right.kind, anchor.kind)
				);
			})[0];
	}

	private focusDay(day: EventCalendarDateOnly): void {
		const element = this.dayRegistry.get(day);
		if (!element) {
			this.pendingDay = day;
			this.dayRegistry.schedule();
			return;
		}
		this.focusedDay = day;
		this.pendingDay = null;
		element.focus();
	}

	private findEnabledByStep(index: number, step: number): EventCalendarDateOnly | null {
		for (
			let nextIndex = index + step;
			nextIndex >= 0 && nextIndex < this.days.length;
			nextIndex += step
		) {
			const day = this.days[nextIndex];
			if (this.enabledDays.has(day)) return day;
		}
		return null;
	}

	private findEnabledInRow(index: number, fromEnd: boolean): EventCalendarDateOnly | null {
		const visualIndex = index + this.leadingEmptyCells;
		const visualRowStart = Math.floor(visualIndex / this.columnCount) * this.columnCount;
		const rowStart = Math.max(0, visualRowStart - this.leadingEmptyCells);
		const rowEnd = Math.min(
			this.days.length,
			visualRowStart + this.columnCount - this.leadingEmptyCells
		);
		if (fromEnd) {
			for (let candidate = rowEnd - 1; candidate >= rowStart; candidate -= 1) {
				const day = this.days[candidate];
				if (this.enabledDays.has(day)) return day;
			}
			return null;
		}
		for (let candidate = rowStart; candidate < rowEnd; candidate += 1) {
			const day = this.days[candidate];
			if (this.enabledDays.has(day)) return day;
		}
		return null;
	}

	private resolveEnabledDay(day: EventCalendarDateOnly | null): EventCalendarDateOnly | null {
		if (day && this.enabledDays.has(day)) return day;
		const enabled = this.days.filter((candidate) => this.enabledDays.has(candidate));
		if (enabled.length === 0) return null;
		if (!day) return enabled[0];
		return enabled.reduce((closest, candidate) => {
			const closestDistance = Math.abs(compareDays(closest, day));
			const candidateDistance = Math.abs(compareDays(candidate, day));
			return candidateDistance < closestDistance ? candidate : closest;
		});
	}
}

function getTimeTargetKindRank(
	kind: EventCalendarTimeTarget['kind'],
	preferred: EventCalendarTimeTarget['kind']
): number {
	if (kind === preferred) return 0;
	if (kind === 'time-slot') return 1;
	if (kind === 'item') return 2;
	return 3;
}

function getTimeTargetDistance(
	candidate: EventCalendarTimeTarget,
	reference: EventCalendarTimeTarget
): number {
	return (
		Math.abs(candidate.column - reference.column) * 10_000 +
		Math.abs(candidate.row - reference.row) * 100 +
		getTimeTargetKindRank(candidate.kind, 'time-slot')
	);
}

function compareDays(left: EventCalendarDateOnly, right: EventCalendarDateOnly): number {
	const leftDate = parseDateOnly(left);
	const rightDate = parseDateOnly(right);
	return (
		(leftDate.year - rightDate.year) * 372 +
		(leftDate.month - rightDate.month) * 31 +
		leftDate.day -
		rightDate.day
	);
}

function getMutationShortcut(key: string): EventCalendarItemOperation | null {
	if (key.toLowerCase() === 'm') return 'move';
	if (key.toLowerCase() === 's') return 'resize-start';
	if (key.toLowerCase() === 'e') return 'resize-end';
	return null;
}

function getArrowDirection(key: string, direction: 'ltr' | 'rtl'): -1 | 1 {
	if (key === 'ArrowUp') return -1;
	if (key === 'ArrowDown') return 1;
	const physicalDirection: -1 | 1 = key === 'ArrowRight' ? 1 : -1;
	return direction === 'rtl' ? (physicalDirection === 1 ? -1 : 1) : physicalDirection;
}
