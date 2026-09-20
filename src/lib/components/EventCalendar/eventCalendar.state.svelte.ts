/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unsafe-declaration-merging -- Descriptor binding follows the established Entasis state-class pattern. */
/* eslint-disable svelte/prefer-svelte-reactivity -- Dates are immutable snapshots; Maps and Sets are non-reactive local validation indexes. */
import { untrack } from 'svelte';
import type { Messages } from '$lib/i18n/en.js';
import type { Density } from '$lib/types/theme.js';
import { bind } from '$lib/utils/state.svelte.js';
import {
	addCivilDays,
	assertDateOnly,
	assertValidInstant,
	assertValidRange,
	assertValidTimeZone,
	createDateProfile,
	type EventCalendarDateProfile,
	getHiddenWeekdays,
	getNavigationDate,
	getZonedDay,
	isSupportedDateDomainError,
	MAX_EVENT_CALENDAR_DAY,
	normalizeLocale,
	parseDateOnly,
	reconcileAnchorDay,
	startOfZonedDay
} from './eventCalendar.date.js';
import { getLocaleWeekStartsOn } from './eventCalendar.dateJump.js';
import { EventCalendarError } from './eventCalendar.error.js';
import {
	EVENT_CALENDAR_ALL_WEEKDAYS,
	parseEventCalendarBusinessClock,
	type EventCalendarAdmittedBusinessHours
} from './eventCalendar.businessHours.js';
import { EventCalendarA11y } from './eventCalendar.a11y.svelte.js';
import {
	EventCalendarInteractionsController,
	type EventCalendarInteractionStatus
} from './eventCalendar.interactions.svelte.js';
import { EventCalendarMutations } from './eventCalendar.mutations.svelte.js';
import {
	admitEventCalendarItems,
	createEventCalendarItemIndex,
	createRecurringOccurrenceKey,
	decodeRecurringOccurrenceKey,
	projectEventCalendarOccurrences,
	type EventCalendarItemIndex
} from './eventCalendar.items.js';
import type {
	EventCalendarAllDayConversionOptions,
	EventCalendarAvailabilityOptions,
	EventCalendarCallbackProps,
	EventCalendarInteractionOptions,
	EventCalendarMonthOptions,
	EventCalendarRecurrenceOptions,
	EventCalendarSnapshot,
	EventCalendarSnippetProps,
	EventCalendarTimeGridOptions
} from './eventCalendar.props.js';
import {
	createEventCalendarResourceModel,
	type EventCalendarResourceModel
} from './eventCalendar.resources.js';
import type { EventCalendarTheme } from './eventCalendar.theme.js';
import type {
	EventCalendarApi,
	EventCalendarBusinessHours,
	EventCalendarCreateActivation,
	EventCalendarDateOnly,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarInteractions,
	EventCalendarOffDaysConfig,
	EventCalendarRange,
	EventCalendarRangeChangeInfo,
	EventCalendarRecurrenceExpander,
	EventCalendarResource,
	EventCalendarSelection,
	EventCalendarScrollMode,
	EventCalendarSlot,
	EventCalendarProposedUpdate,
	EventCalendarUpdateAdjustment,
	EventCalendarUpdateResult,
	EventCalendarOverlapPredicate,
	EventCalendarView,
	EventCalendarWeekday
} from './eventCalendar.types.js';

const EVENT_CALENDAR_VIEWS: readonly EventCalendarView[] = [
	'month',
	'week',
	'day',
	'days',
	'agenda',
	'resource'
];
const VIEW_SET = new Set<EventCalendarView>(EVENT_CALENDAR_VIEWS);

const DEFAULT_CREATE_ACTIVATION: EventCalendarCreateActivation = Object.freeze({
	distancePx: 5,
	touchDelayMs: 300,
	touchTolerancePx: 8
});

const DEFAULT_INTERACTIONS: EventCalendarInteractions = Object.freeze({
	drag: true,
	resize: true,
	selectSlot: true,
	keyboard: true,
	singlePointer: true,
	clipboard: true
});

const EMPTY_BUSINESS_HOURS: readonly EventCalendarBusinessHours[] = Object.freeze([]);

type EventCalendarRuntimeInteractions = EventCalendarInteractions & {
	maintainDurationOnAllDayChange: boolean;
};

export const EMPTY_EVENT_CALENDAR_SELECTION: EventCalendarSelection = Object.freeze({
	kind: null,
	itemKey: null,
	slot: null
});

export type EventCalendarStateOptions<
	TItemFields extends object,
	TResourceFields extends object
> = {
	get items(): EventCalendarItem<TItemFields>[];
	set items(value: EventCalendarItem<TItemFields>[]);
	get view(): EventCalendarView;
	set view(value: EventCalendarView);
	views: EventCalendarView[];
	get date(): Date;
	set date(value: Date);
	get dayCount(): number;
	set dayCount(value: number);
	get selection(): EventCalendarSelection;
	set selection(value: EventCalendarSelection);
	resources: EventCalendarResource<TResourceFields>[];
	timeZone: string;
	messages: Messages;
	density: Density;
	classes: EventCalendarTheme;
	localeOption?: string;
	weekStartsOnOption?: EventCalendarWeekday;
	monthOptions?: EventCalendarMonthOptions;
	showWeekends: boolean;
	weekendDays: EventCalendarWeekday[];
	agendaDayCount: number;
	validRange?: EventCalendarRange;
	timeGridOptions?: EventCalendarTimeGridOptions;
	allDayConversionOptions?: EventCalendarAllDayConversionOptions;
	availabilityOptions?: EventCalendarAvailabilityOptions;
	disabled: boolean;
	loading: boolean;
	direction: 'ltr' | 'rtl';
	interactionOptions?: EventCalendarInteractionOptions;
	allowOverlap: boolean | EventCalendarOverlapPredicate<TItemFields>;
	canUpdateItem?: (payload: EventCalendarProposedUpdate<TItemFields>) => boolean;
	onItemUpdate?: (payload: EventCalendarProposedUpdate<TItemFields>) => EventCalendarUpdateResult;
	canSelectSlot?: (payload: EventCalendarSlot) => boolean;
	recurrenceOptions?: EventCalendarRecurrenceOptions<TItemFields>;
	historyLimit: number;
	renderers: EventCalendarSnippetProps<TItemFields, TResourceFields>;
	eventHandlers: EventCalendarCallbackProps<TItemFields>;
	scrollMode: EventCalendarScrollMode;
	stickyHeader: boolean;
	showDatePicker: boolean;
};

export interface EventCalendarState<
	TItemFields extends object,
	TResourceFields extends object
> extends EventCalendarStateOptions<TItemFields, TResourceFields> {}

export type EventCalendarModelBoundary<TItemFields extends object> = Readonly<{
	items: EventCalendarItem<TItemFields>[];
	resources: readonly unknown[];
}>;

export type EventCalendarModel<
	TItemFields extends object,
	TResourceFields extends object
> = Readonly<{
	dateProfile: EventCalendarDateProfile;
	itemIndex: EventCalendarItemIndex<TItemFields>;
	resourceModel: EventCalendarResourceModel<TResourceFields>;
}>;

/** Bindable calendar owner. Child owners keep DOM and interaction details out of this coordinator. */
export class EventCalendarState<
	TItemFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>
> implements EventCalendarApi<TItemFields> {
	readonly mutations: EventCalendarMutations<TItemFields, TResourceFields>;
	readonly interaction: EventCalendarInteractionsController<TItemFields, TResourceFields>;
	readonly a11y: EventCalendarA11y<TItemFields, TResourceFields>;
	isMounted = $state(false);
	todayInstant = $state<Date | null>(null);
	nowInstant = $state<Date | null>(null);
	private pendingViewChange: EventCalendarView | null = null;
	private pendingDateChange: Date | null = null;
	private pendingSelectionChange: EventCalendarSelection | null = null;
	private pendingMissingSelectionKey: string | null = null;
	private lastRangeSignature: string | null = null;
	private contentNavigation: {
		scrollToTime(dateOrMinutes: Date | number): boolean;
	} | null = null;

	readonly locale = $derived(this.localeOption ?? this.messages.locale);
	readonly weekStartsOn = $derived(this.weekStartsOnOption ?? getLocaleWeekStartsOn(this.locale));
	readonly fixedWeeks = $derived(this.monthOptions?.fixedWeeks ?? true);
	readonly showOutsideDays = $derived(this.monthOptions?.showOutsideDays ?? true);
	readonly showWeekNumbers = $derived(this.monthOptions?.showWeekNumbers ?? false);
	readonly maxItemsPerCell = $derived(this.monthOptions?.maxItemsPerCell ?? 'auto');
	readonly dayStartHour = $derived(this.timeGridOptions?.startHour ?? 0);
	readonly dayEndHour = $derived(this.timeGridOptions?.endHour ?? 24);
	readonly interval = $derived(this.timeGridOptions?.labelIntervalMinutes ?? 60);
	readonly slotDuration = $derived(this.timeGridOptions?.slotClickDurationMinutes ?? 30);
	readonly snapDuration = $derived(this.timeGridOptions?.snapDurationMinutes ?? 15);
	readonly scrollToHour = $derived(this.timeGridOptions?.scrollToHour ?? 7);
	readonly nowIndicatorInterval = $derived(this.timeGridOptions?.nowIndicatorRefreshMs ?? 30_000);
	readonly defaultTimedItemDuration = $derived(
		this.allDayConversionOptions?.timedDurationMinutes ?? 60
	);
	readonly defaultAllDayItemDuration = $derived(
		this.allDayConversionOptions?.allDayDurationDays ?? 1
	);
	readonly offDays = $derived(this.availabilityOptions?.offDays ?? false);
	readonly businessHours: readonly EventCalendarAdmittedBusinessHours[] = $derived(
		admitBusinessHours(this.availabilityOptions?.businessHours ?? EMPTY_BUSINESS_HOURS)
	);
	readonly constrainToBusinessHours = $derived(
		this.availabilityOptions?.constrainMutations ?? false
	);
	readonly recurrenceEditScope = $derived(this.recurrenceOptions?.editScope ?? 'occurrence');
	readonly getOccurrenceExceptionId = $derived(this.recurrenceOptions?.getExceptionId);
	readonly expandRecurrence: EventCalendarRecurrenceExpander<TItemFields> | undefined = $derived(
		this.recurrenceOptions?.expand
	);
	readonly createActivation: EventCalendarCreateActivation = $derived({
		...DEFAULT_CREATE_ACTIVATION,
		...this.interactionOptions?.createActivation
	});
	readonly interactions: EventCalendarRuntimeInteractions = $derived({
		drag: this.interactionOptions?.drag ?? DEFAULT_INTERACTIONS.drag,
		resize: this.interactionOptions?.resize ?? DEFAULT_INTERACTIONS.resize,
		selectSlot: this.interactionOptions?.selectSlot ?? DEFAULT_INTERACTIONS.selectSlot,
		keyboard: this.interactionOptions?.keyboard ?? DEFAULT_INTERACTIONS.keyboard,
		singlePointer: this.interactionOptions?.singlePointer ?? DEFAULT_INTERACTIONS.singlePointer,
		clipboard: this.interactionOptions?.clipboard ?? DEFAULT_INTERACTIONS.clipboard,
		maintainDurationOnAllDayChange: this.allDayConversionOptions?.preserveDuration ?? false
	});
	readonly clipboard = $derived(this.interactions.clipboard);
	readonly modelBoundary: EventCalendarModelBoundary<TItemFields> = $derived({
		items: this.items,
		resources: this.resources
	});
	readonly resourceModel: EventCalendarResourceModel<TResourceFields> = $derived(
		createEventCalendarResourceModel(this.resources)
	);
	/**
	 * Build the profile before resource admission. This preserves invalid-profile precedence while
	 * keeping the reconciled schedule in one derived value.
	 */
	readonly dateProfile: EventCalendarDateProfile = $derived.by(() => {
		const profile = this.createProfile(
			this.view,
			this.reconcileDateFor(this.date, this.view),
			this.dayCount
		);
		const enabledViews = getEnabledViews(
			this.views,
			this.resourceModel.structure.leaves.length > 0
		);
		const view = enabledViews.includes(this.view) ? this.view : enabledViews[0];
		if (view === profile.view) {
			return profile;
		}
		return this.createProfile(view, this.reconcileDateFor(this.date, view), this.dayCount);
	});
	private readonly admittedItems = $derived(
		admitEventCalendarItems(this.items, {
			hasCustomExpander: this.expandRecurrence !== undefined
		})
	);
	readonly itemIndex: EventCalendarItemIndex<TItemFields> = $derived(
		projectEventCalendarOccurrences(this.admittedItems, {
			range: this.dateProfile.activeRange,
			displayTimeZone: this.timeZone,
			expandRecurrence: this.expandRecurrence
		})
	);
	readonly model: EventCalendarModel<TItemFields, TResourceFields> = $derived.by(() => ({
		dateProfile: this.dateProfile,
		resourceModel: this.resourceModel,
		itemIndex: this.itemIndex
	}));
	readonly snapshot: EventCalendarSnapshot<TItemFields, TResourceFields> = $derived.by(() => ({
		items: this.items,
		resources: this.resources,
		view: this.view,
		date: this.date,
		range: this.dateProfile,
		selection: this.selection,
		loading: this.loading,
		disabled: this.disabled,
		api: this
	}));
	private readonly validatedProjection = $derived.by(() => {
		validateConfiguration(this);
		validateSelection(this.selection);
		return this.model;
	});
	get enabledViews(): readonly EventCalendarView[] {
		return getEnabledViews(this.views, this.resourceModel.structure.leaves.length > 0);
	}

	isModelBoundaryCurrent(boundary: EventCalendarModelBoundary<TItemFields>): boolean {
		return boundary === this.modelBoundary;
	}

	private createProfile(
		view: EventCalendarView,
		date: Date,
		dayCount: number
	): EventCalendarDateProfile {
		return createDateProfile({
			view,
			date,
			timeZone: this.timeZone,
			locale: this.locale,
			weekStartsOn: this.weekStartsOn,
			fixedWeeks: this.fixedWeeks,
			showOutsideDays: this.showOutsideDays,
			showWeekends: this.showWeekends,
			weekendDays: this.weekendDays,
			dayCount,
			agendaDayCount: this.agendaDayCount,
			validRange: this.validRange
		});
	}

	constructor(
		readonly instanceId: string,
		options: EventCalendarStateOptions<TItemFields, TResourceFields>
	) {
		bind(this, options);
		this.mutations = new EventCalendarMutations(this);
		this.interaction = new EventCalendarInteractionsController(this);
		this.a11y = new EventCalendarA11y(this);
		this.synchronize(false, this.validatedProjection);

		$effect.pre(() => {
			const projection = this.validatedProjection;
			const isMounted = this.isMounted;
			untrack(() => this.synchronize(isMounted, projection));
		});

		$effect(() => {
			const profile = this.dateProfile;
			const isMounted = this.isMounted;
			untrack(() => {
				if (isMounted) this.publishRange(profile);
			});
		});

		$effect.pre(() => {
			this.a11y.configureView(this.view);
		});

		$effect(() => {
			const focusContext = `${this.view}:${this.date.getTime()}:${this.dayCount}`;
			const itemIndex = this.itemIndex;
			untrack(() => this.a11y.reconcileControlledFocus(focusContext, itemIndex));
		});
	}

	/** Activates client-only clock data and publishes deferred SSR reconciliation callbacks. */
	mount(now = new Date()): void {
		assertValidInstant(now, 'now');
		if (this.isMounted) return;
		const pendingViewChange = this.pendingViewChange;
		const pendingDateChange = this.pendingDateChange;
		const pendingSelectionChange = this.pendingSelectionChange;
		const pendingMissingSelectionKey = this.pendingMissingSelectionKey;
		this.pendingViewChange = null;
		this.pendingDateChange = null;
		this.pendingSelectionChange = null;
		this.pendingMissingSelectionKey = null;
		this.todayInstant = new Date(now);
		this.nowInstant = new Date(now);
		this.isMounted = true;

		if (pendingViewChange) this.eventHandlers.onViewChange?.(pendingViewChange);
		if (pendingDateChange) this.eventHandlers.onDateChange?.(new Date(pendingDateChange));
		if (pendingSelectionChange) this.eventHandlers.onSelectionChange?.(pendingSelectionChange);
		if (pendingMissingSelectionKey) {
			this.a11y.restoreFocusAfterOccurrenceRemoval(pendingMissingSelectionKey);
		}
		this.publishRange(this.dateProfile);
	}

	unmount(): void {
		this.interaction.destroy();
		this.a11y.destroy();
		this.contentNavigation = null;
		this.isMounted = false;
		this.todayInstant = null;
		this.nowInstant = null;
		this.lastRangeSignature = null;
	}

	notifyInteractionStatus(status: EventCalendarInteractionStatus<TItemFields>): void {
		this.a11y.syncInteractionStatus(status);
	}

	validateCandidateItems(items: EventCalendarItem<TItemFields>[]): void {
		void this.getCandidateOccurrences(items);
	}

	getCandidateOccurrences(
		items: EventCalendarItem<TItemFields>[]
	): readonly EventCalendarOccurrence<TItemFields>[] {
		const profile = this.dateProfile;
		return createEventCalendarItemIndex({
			items,
			range: profile.activeRange,
			displayTimeZone: this.timeZone,
			expandRecurrence: this.expandRecurrence
		}).occurrences;
	}

	hasRecurringOccurrence(
		items: EventCalendarItem<TItemFields>[],
		key: string,
		seriesId: string
	): boolean {
		const decoded = decodeRecurringOccurrenceKey(key);
		if (!decoded || decoded.seriesId !== seriesId) return false;
		const source = items.find((item) => item.id === seriesId);
		if (!source || source.recurrence === undefined || source.recurringItemId !== undefined) {
			return false;
		}
		if (
			items.some(
				(item) =>
					item.recurringItemId === seriesId &&
					item.originalStart !== undefined &&
					createRecurringOccurrenceKey(seriesId, item.originalStart) === key
			)
		) {
			return true;
		}
		if (
			typeof decoded.originalStart === 'string' &&
			decoded.originalStart > MAX_EVENT_CALENDAR_DAY
		) {
			return false;
		}
		const range =
			typeof decoded.originalStart === 'string'
				? {
						start: startOfZonedDay(decoded.originalStart, this.timeZone),
						end: startOfZonedDay(addCivilDays(decoded.originalStart, 1), this.timeZone)
					}
				: {
						start: new Date(decoded.originalStart),
						end: new Date(decoded.originalStart.getTime() + 1)
					};
		return (
			createEventCalendarItemIndex({
				items,
				range,
				displayTimeZone: this.timeZone,
				expandRecurrence: this.expandRecurrence
			}).getOccurrence(key) !== null
		);
	}

	addItem(item: EventCalendarItem<TItemFields>): void {
		this.mutations.addItem(item);
	}

	updateItem(item: EventCalendarItem<TItemFields>): void {
		this.mutations.updateItem(item);
	}

	updateOccurrence(
		key: string,
		adjustment: EventCalendarUpdateAdjustment,
		options?: { scope?: 'occurrence' | 'series' }
	): void {
		this.mutations.updateOccurrence(key, adjustment, options);
	}

	removeItem(id: string): void {
		this.mutations.removeItem(id);
	}

	copySelection(): boolean {
		return this.mutations.copySelection();
	}

	paste(): boolean {
		return this.mutations.paste();
	}

	undo(): boolean {
		return this.mutations.undo();
	}

	redo(): boolean {
		return this.mutations.redo();
	}

	canUndo(): boolean {
		return this.mutations.canUndo();
	}

	canRedo(): boolean {
		return this.mutations.canRedo();
	}

	cancelInteraction(): void {
		this.interaction.cancel();
	}

	connectContentNavigation(navigation: {
		scrollToTime(dateOrMinutes: Date | number): boolean;
	}): () => void {
		this.contentNavigation = navigation;
		return () => {
			if (this.contentNavigation === navigation) this.contentNavigation = null;
		};
	}

	scrollToTime(dateOrMinutes: Date | number): boolean {
		if (this.view === 'month' || this.view === 'agenda') return false;
		return this.contentNavigation?.scrollToTime(dateOrMinutes) ?? false;
	}

	refreshNow(now = new Date()): void {
		assertValidInstant(now, 'now');
		if (!this.isMounted) return;
		this.todayInstant = new Date(now);
		this.nowInstant = new Date(now);
	}

	next(): void {
		this.navigate(1);
	}

	previous(): void {
		this.navigate(-1);
	}

	today(): void {
		if (this.disabled || !this.isMounted) return;
		const now = new Date();
		this.refreshNow(now);
		this.goTo(now);
	}

	goTo(value: Date | EventCalendarDateOnly): void {
		if (this.disabled) return;
		const target = typeof value === 'string' ? startOfZonedDay(value, this.timeZone) : value;
		assertValidInstant(target, 'date');
		this.commitDate(this.reconcileDateFor(target, this.view), true);
	}

	setView(view: EventCalendarView, options?: { dayCount?: number }): void {
		if (this.disabled) return;
		assertView(view);
		if (!this.enabledViews.includes(view)) {
			throw new EventCalendarError('invalid-view', `View is not enabled: ${view}.`, { view });
		}
		if (options?.dayCount !== undefined && view !== 'days') {
			throw new EventCalendarError(
				'invalid-view',
				'The setView dayCount option is valid only for the days view.',
				{ view }
			);
		}
		const nextDayCount = options?.dayCount ?? this.dayCount;
		assertPositiveInteger(nextDayCount, 'dayCount');
		const nextDate = this.reconcileDateFor(this.date, view);
		this.createProfile(view, nextDate, nextDayCount);
		const didDayCountChange = nextDayCount !== this.dayCount;
		const didViewChange = view !== this.view;
		const didDateChange = nextDate.getTime() !== this.date.getTime();
		if (!didDayCountChange && !didViewChange && !didDateChange) return;

		if (didDayCountChange) this.dayCount = nextDayCount;
		if (didViewChange) this.view = view;
		if (didDateChange) this.date = new Date(nextDate);
		if (didDayCountChange) this.eventHandlers.onDayCountChange?.(nextDayCount);
		if (didViewChange) this.eventHandlers.onViewChange?.(view);
		if (didDateChange) this.eventHandlers.onDateChange?.(new Date(nextDate));
	}

	select(selection: EventCalendarSelection): void {
		if (this.disabled) return;
		validateSelection(selection);
		if (selectionsEqual(this.selection, selection)) return;
		this.selection = selection;
		this.eventHandlers.onSelectionChange?.(selection);
	}

	hasSelection(selection: EventCalendarSelection): boolean {
		return selectionsEqual(this.selection, selection);
	}

	clearSelection(): void {
		this.select(EMPTY_EVENT_CALENDAR_SELECTION);
	}

	applyOccurrenceKeyRemap(remap: (key: string) => string): {
		previousSelection: EventCalendarSelection;
		committedSelection: EventCalendarSelection;
	} | null {
		this.a11y.remapOccurrenceKeys(remap);
		if (this.selection.kind !== 'item') return null;
		const itemKey = remap(this.selection.itemKey);
		if (itemKey === this.selection.itemKey) return null;
		const previousSelection = this.selection;
		const selection: EventCalendarSelection = { kind: 'item', itemKey, slot: null };
		this.selection = selection;
		return { previousSelection, committedSelection: this.selection };
	}

	clearMissingRecurringSelection(
		items: EventCalendarItem<TItemFields>[],
		seriesId: string
	): {
		previousSelection: EventCalendarSelection;
		committedSelection: EventCalendarSelection;
	} | null {
		if (
			this.selection.kind !== 'item' ||
			decodeRecurringOccurrenceKey(this.selection.itemKey)?.seriesId !== seriesId ||
			this.hasRecurringOccurrence(items, this.selection.itemKey, seriesId)
		) {
			return null;
		}
		const previousSelection = this.selection;
		this.selection = EMPTY_EVENT_CALENDAR_SELECTION;
		return { previousSelection, committedSelection: this.selection };
	}

	restoreOccurrenceKeyRemap(
		selectionTransaction: {
			previousSelection: EventCalendarSelection;
			committedSelection: EventCalendarSelection;
		} | null,
		remap?: (key: string) => string
	): void {
		if (selectionTransaction && !this.hasSelection(selectionTransaction.committedSelection)) {
			throw new EventCalendarError(
				'stale-transaction',
				'The EventCalendar selection changed after its recurrence transaction.'
			);
		}
		if (remap) this.a11y.remapOccurrenceKeys(remap);
		if (!selectionTransaction) return;
		this.selection = selectionTransaction.previousSelection;
		this.eventHandlers.onSelectionChange?.(selectionTransaction.previousSelection);
	}

	notifySelectionChange(selection: EventCalendarSelection): void {
		this.eventHandlers.onSelectionChange?.(selection);
	}

	getVisibleRange(): EventCalendarRange {
		return cloneRange(this.dateProfile.renderRange);
	}

	getActiveRange(): EventCalendarRange {
		return cloneRange(this.dateProfile.activeRange);
	}

	getVisibleDays(): readonly EventCalendarDateOnly[] {
		return [...this.dateProfile.visibleDays];
	}

	getOccurrence(key: string) {
		return this.itemIndex.getOccurrence(key);
	}

	getOccurrences(range?: EventCalendarRange) {
		if (!range) return this.itemIndex.occurrences;
		assertValidRange(range, 'occurrence query range');
		return createEventCalendarItemIndex({
			items: this.items,
			range,
			displayTimeZone: this.timeZone,
			expandRecurrence: this.expandRecurrence
		}).occurrences;
	}

	getOccurrencesForDay(day: EventCalendarDateOnly) {
		assertDateOnly(day, 'day');
		let endDay: EventCalendarDateOnly;
		try {
			endDay = addCivilDays(day, 1);
		} catch (error) {
			if (!isSupportedDateDomainError(error)) throw error;
			throw new EventCalendarError(
				'invalid-prop',
				`Cannot query ${day} because its exclusive day boundary exceeds the supported civil-date domain.`,
				{ ...error.details, method: 'getOccurrencesForDay', day }
			);
		}
		const range = {
			start: startOfZonedDay(day, this.timeZone),
			end: startOfZonedDay(endDay, this.timeZone)
		};
		return this.getOccurrences(range);
	}

	private navigate(direction: -1 | 1): void {
		if (this.disabled) return;
		const hiddenWeekdays = getHiddenWeekdays(this);
		const target = getNavigationDate(this.dateProfile, direction, hiddenWeekdays);
		if (!target) return;
		try {
			this.commitDate(this.reconcileDateFor(target, this.view), true);
		} catch (error) {
			if (isSupportedDateDomainError(error)) return;
			throw error;
		}
	}

	private synchronize(
		notify: boolean,
		projection: EventCalendarModel<TItemFields, TResourceFields>
	): void {
		const nextView = projection.dateProfile.view;
		const nextDate = projection.dateProfile.date;
		const didViewChange = nextView !== this.view;
		const didDateChange = nextDate.getTime() !== this.date.getTime();
		const didSelectionChange =
			this.selection.kind === 'item' && !this.hasItemSelection(this.items, this.selection.itemKey);
		if (!didViewChange && !didDateChange && !didSelectionChange) return;
		const missingSelectionKey = didSelectionChange ? this.selection.itemKey : null;

		if (didViewChange) this.view = nextView;
		if (didDateChange) this.date = new Date(nextDate);
		if (didSelectionChange) this.selection = EMPTY_EVENT_CALENDAR_SELECTION;
		if (notify) {
			if (didViewChange) this.eventHandlers.onViewChange?.(nextView);
			if (didDateChange) this.eventHandlers.onDateChange?.(new Date(nextDate));
			if (didSelectionChange)
				this.eventHandlers.onSelectionChange?.(EMPTY_EVENT_CALENDAR_SELECTION);
			if (missingSelectionKey) this.a11y.restoreFocusAfterOccurrenceRemoval(missingSelectionKey);
			return;
		}
		if (didViewChange) this.pendingViewChange = nextView;
		if (didDateChange) this.pendingDateChange = new Date(nextDate);
		if (didSelectionChange) this.pendingSelectionChange = EMPTY_EVENT_CALENDAR_SELECTION;
		if (missingSelectionKey) this.pendingMissingSelectionKey = missingSelectionKey;
	}

	private hasItemSelection(items: EventCalendarItem<TItemFields>[], key: string): boolean {
		if (
			items.some(
				(item) =>
					item.id === key && item.recurrence === undefined && item.recurringItemId === undefined
			)
		) {
			return true;
		}
		const recurring = decodeRecurringOccurrenceKey(key);
		return recurring ? this.hasRecurringOccurrence(items, key, recurring.seriesId) : false;
	}

	private reconcileDateFor(date: Date, view: EventCalendarView): Date {
		assertValidInstant(date);
		const shouldReconcileHiddenDay =
			view === 'day' || view === 'days' || view === 'agenda' || view === 'resource';
		if (!shouldReconcileHiddenDay && !this.validRange) return new Date(date);

		const hiddenWeekdays = shouldReconcileHiddenDay
			? getHiddenWeekdays(this)
			: new Set<EventCalendarWeekday>();
		const day = reconcileAnchorDay(
			getZonedDay(date, this.timeZone),
			this.timeZone,
			hiddenWeekdays,
			this.validRange
		);
		if (day === getZonedDay(date, this.timeZone)) return new Date(date);
		return startOfZonedDay(day, this.timeZone);
	}

	private commitDate(date: Date, notify: boolean): void {
		if (date.getTime() === this.date.getTime()) return;
		this.createProfile(this.view, date, this.dayCount);
		this.date = new Date(date);
		if (notify) this.eventHandlers.onDateChange?.(new Date(date));
	}

	private publishRange(profile: EventCalendarDateProfile): void {
		const signature = getRangeSignature(profile);
		if (signature === this.lastRangeSignature) return;
		this.lastRangeSignature = signature;
		this.eventHandlers.onRangeChange?.(cloneProfile(profile));
	}
}

function validateConfiguration<TItemFields extends object, TResourceFields extends object>(
	state: EventCalendarState<TItemFields, TResourceFields>
): void {
	assertValidInstant(state.date);
	assertValidTimeZone(state.timeZone);
	normalizeLocale(state.locale);
	assertView(state.view);
	validateViews(state.views);
	assertWeekday(state.weekStartsOn, 'weekStartsOn');
	validateWeekdays(state.weekendDays, 'weekendDays');
	assertPositiveInteger(state.dayCount, 'dayCount');
	assertPositiveInteger(state.agendaDayCount, 'agendaDayCount');
	assertPositiveInteger(state.interval, 'timeGrid.labelIntervalMinutes');
	assertPositiveInteger(state.slotDuration, 'timeGrid.slotClickDurationMinutes');
	assertPositiveInteger(state.snapDuration, 'timeGrid.snapDurationMinutes');
	assertPositiveInteger(state.defaultTimedItemDuration, 'allDayConversion.timedDurationMinutes');
	assertPositiveInteger(state.defaultAllDayItemDuration, 'allDayConversion.allDayDurationDays');
	assertPositiveInteger(state.nowIndicatorInterval, 'timeGrid.nowIndicatorRefreshMs');
	assertNonNegativeInteger(state.historyLimit, 'historyLimit');
	validateHourRange(state.dayStartHour, state.dayEndHour, state.scrollToHour);
	if (state.maxItemsPerCell !== 'auto') {
		assertNonNegativeInteger(state.maxItemsPerCell, 'month.maxItemsPerCell');
	}
	validateCreateActivation(state.createActivation);
	void state.businessHours;
	validateOffDays(state.offDays);
	if (state.validRange) assertValidRange(state.validRange, 'validRange');
	if (!state.showWeekends && state.weekendDays.length === 7) {
		throw new EventCalendarError('invalid-prop', 'At least one weekday must remain visible.');
	}
}

function validateViews(views: readonly EventCalendarView[]): void {
	if (!Array.isArray(views) || views.length === 0) {
		throw new EventCalendarError('invalid-view', 'views must be a non-empty array.');
	}
	const seen = new Set<EventCalendarView>();
	for (const view of views) {
		assertView(view);
		if (seen.has(view)) {
			throw new EventCalendarError('invalid-view', `views contains a duplicate: ${view}.`, {
				view
			});
		}
		seen.add(view);
	}
}

function getEnabledViews(
	views: readonly EventCalendarView[],
	hasResourceLeaf: boolean
): readonly EventCalendarView[] {
	validateViews(views);
	const enabled = views.filter((view) => view !== 'resource' || hasResourceLeaf);
	if (enabled.length === 0) {
		throw new EventCalendarError(
			'invalid-view',
			'No configured view is currently enabled. The resource view requires a resource leaf.'
		);
	}
	return enabled;
}

function validateSelection(selection: EventCalendarSelection): void {
	if (!selection || typeof selection !== 'object')
		throw new EventCalendarError('invalid-prop', 'selection must be a discriminated selection.');
	if (selection.kind === null && selection.itemKey === null && selection.slot === null) return;
	if (
		selection.kind === 'item' &&
		typeof selection.itemKey === 'string' &&
		selection.itemKey.length > 0 &&
		selection.slot === null
	)
		return;
	if (selection.kind === 'slot' && selection.itemKey === null && selection.slot) {
		validateSlot(selection.slot);
		return;
	}
	throw new EventCalendarError('invalid-prop', 'selection has an invalid discriminated shape.');
}

function validateSlot(slot: EventCalendarSlot): void {
	assertView(slot.view);
	if (slot.allDay === true) {
		assertDateOnly(slot.start, 'selection.slot.start');
		assertDateOnly(slot.end, 'selection.slot.end');
		if (slot.end <= slot.start)
			throw new EventCalendarError('invalid-prop', 'An all-day slot must have positive length.');
		return;
	}
	if (slot.allDay !== false)
		throw new EventCalendarError('invalid-prop', 'A slot requires a boolean allDay discriminator.');
	assertValidInstant(slot.start, 'selection.slot.start');
	assertValidInstant(slot.end, 'selection.slot.end');
	if (slot.end.getTime() < slot.start.getTime())
		throw new EventCalendarError('invalid-prop', 'A timed slot cannot end before it starts.');
}

function validateHourRange(dayStartHour: number, dayEndHour: number, scrollToHour: number): void {
	for (const [name, value] of [
		['timeGrid.startHour', dayStartHour],
		['timeGrid.endHour', dayEndHour],
		['timeGrid.scrollToHour', scrollToHour]
	] as const) {
		if (!Number.isFinite(value) || !Number.isInteger(value * 60))
			throw new EventCalendarError('invalid-prop', `${name} must resolve to whole minutes.`, {
				prop: name,
				value
			});
	}
	if (dayStartHour < 0 || dayStartHour >= dayEndHour || dayEndHour > 24)
		throw new EventCalendarError(
			'invalid-prop',
			'timeGrid.startHour and timeGrid.endHour must form a non-empty interval within 0..24.',
			{ dayStartHour, dayEndHour }
		);
	if (scrollToHour < dayStartHour || scrollToHour >= dayEndHour)
		throw new EventCalendarError(
			'invalid-prop',
			'timeGrid.scrollToHour must fall inside displayed hours.',
			{
				scrollToHour,
				dayStartHour,
				dayEndHour
			}
		);
}

function validateCreateActivation(activation: EventCalendarCreateActivation): void {
	if (!activation || typeof activation !== 'object' || Array.isArray(activation))
		throw new EventCalendarError(
			'invalid-prop',
			'interactions.createActivation must be a configuration object.',
			{
				prop: 'interactions.createActivation'
			}
		);
	for (const name of ['distancePx', 'touchDelayMs', 'touchTolerancePx'] as const) {
		const value = activation[name];
		if (Number.isFinite(value) && value > 0) continue;
		throw new EventCalendarError(
			'invalid-prop',
			`interactions.createActivation.${name} must be finite and positive.`,
			{
				prop: `interactions.createActivation.${name}`,
				value
			}
		);
	}
}

function admitBusinessHours(
	entries: readonly EventCalendarBusinessHours[]
): readonly EventCalendarAdmittedBusinessHours[] {
	if (!Array.isArray(entries))
		throw new EventCalendarError('invalid-prop', 'availability.businessHours must be an array.');
	const windows = new Set<string>();
	return entries.map((entry) => {
		if (!entry || typeof entry !== 'object' || Array.isArray(entry))
			throw new EventCalendarError(
				'invalid-prop',
				'Every availability.businessHours entry must be an object.',
				{
					prop: 'availability.businessHours'
				}
			);
		const days = entry.daysOfWeek ?? EVENT_CALENDAR_ALL_WEEKDAYS;
		validateWeekdays(days, 'availability.businessHours.daysOfWeek');
		const startMinutes = admitBusinessClock(entry.start, false, 'availability.businessHours.start');
		const endMinutes = admitBusinessClock(entry.end, true, 'availability.businessHours.end');
		if (startMinutes >= endMinutes)
			throw new EventCalendarError('invalid-prop', 'Business hours must be a same-day range.', {
				start: entry.start,
				end: entry.end
			});
		for (const day of days) {
			const key = `${day}:${entry.start}-${entry.end}`;
			if (windows.has(key))
				throw new EventCalendarError(
					'invalid-prop',
					'availability.businessHours contains a duplicate window.',
					{
						day,
						start: entry.start,
						end: entry.end
					}
				);
			windows.add(key);
		}
		return { daysOfWeek: days, startMinutes, endMinutes };
	});
}

function admitBusinessClock(value: unknown, allowEnd: boolean, name: string): number {
	const parsed = parseEventCalendarBusinessClock(value, allowEnd);
	if (parsed === 'format')
		throw new EventCalendarError('invalid-prop', `${name} must use strict HH:mm form.`, {
			prop: name,
			value
		});
	if (parsed === 'range')
		throw new EventCalendarError('invalid-prop', `${name} is outside its valid wall-time range.`, {
			prop: name,
			value
		});
	return parsed;
}

function validateOffDays(offDays: boolean | EventCalendarOffDaysConfig): void {
	if (typeof offDays === 'boolean') return;
	if (!offDays || typeof offDays !== 'object' || Array.isArray(offDays))
		throw new EventCalendarError(
			'invalid-prop',
			'availability.offDays must be a boolean or configuration.'
		);
	if (offDays.weekdays !== undefined)
		validateWeekdays(offDays.weekdays, 'availability.offDays.weekdays');
	if (offDays.dates !== undefined && !Array.isArray(offDays.dates))
		throw new EventCalendarError('invalid-prop', 'availability.offDays.dates must be an array.', {
			prop: 'availability.offDays.dates'
		});
	if (offDays.isOffDay !== undefined && typeof offDays.isOffDay !== 'function')
		throw new EventCalendarError(
			'invalid-prop',
			'availability.offDays.isOffDay must be a function.',
			{
				prop: 'availability.offDays.isOffDay'
			}
		);
	const dates = new Set<EventCalendarDateOnly>();
	for (const date of offDays.dates ?? []) {
		if (typeof date !== 'string')
			throw new EventCalendarError(
				'invalid-prop',
				'availability.offDays.dates must contain date strings.',
				{
					prop: 'availability.offDays.dates',
					date
				}
			);
		parseDateOnly(date, 'availability.offDays.dates');
		if (dates.has(date))
			throw new EventCalendarError(
				'invalid-prop',
				'availability.offDays.dates must not contain duplicates.',
				{
					date
				}
			);
		dates.add(date);
	}
}

function validateWeekdays(weekdays: readonly number[], name: string): void {
	if (!Array.isArray(weekdays))
		throw new EventCalendarError('invalid-prop', `${name} must be an array.`, { prop: name });
	const seen = new Set<number>();
	for (const weekday of weekdays) {
		assertWeekday(weekday, name);
		if (seen.has(weekday))
			throw new EventCalendarError('invalid-prop', `${name} must not contain duplicates.`, {
				prop: name,
				weekday
			});
		seen.add(weekday);
	}
}

function assertView(value: EventCalendarView): void {
	if (VIEW_SET.has(value)) return;
	throw new EventCalendarError('invalid-view', `Unsupported calendar view: ${String(value)}.`, {
		view: value
	});
}

function assertWeekday(value: number, name: string): asserts value is EventCalendarWeekday {
	if (Number.isInteger(value) && value >= 0 && value <= 6) return;
	throw new EventCalendarError('invalid-prop', `${name} must contain values from 0 through 6.`, {
		prop: name,
		value
	});
}

function assertPositiveInteger(value: number, name: string): void {
	if (Number.isInteger(value) && value > 0) return;
	throw new EventCalendarError('invalid-prop', `${name} must be a positive integer.`, {
		prop: name,
		value
	});
}

function assertNonNegativeInteger(value: number, name: string): void {
	if (Number.isInteger(value) && value >= 0) return;
	throw new EventCalendarError('invalid-prop', `${name} must be a non-negative integer.`, {
		prop: name,
		value
	});
}

function selectionsEqual(left: EventCalendarSelection, right: EventCalendarSelection): boolean {
	if (left.kind !== right.kind) return false;
	if (left.kind === null && right.kind === null) return true;
	if (left.kind === 'item' && right.kind === 'item') return left.itemKey === right.itemKey;
	if (left.kind !== 'slot' || right.kind !== 'slot') return false;
	if (
		left.slot.allDay !== right.slot.allDay ||
		left.slot.view !== right.slot.view ||
		left.slot.resourceId !== right.slot.resourceId
	)
		return false;
	if (left.slot.allDay && right.slot.allDay) {
		return left.slot.start === right.slot.start && left.slot.end === right.slot.end;
	}
	if (!left.slot.allDay && !right.slot.allDay) {
		return (
			left.slot.start.getTime() === right.slot.start.getTime() &&
			left.slot.end.getTime() === right.slot.end.getTime()
		);
	}
	return false;
}

function getRangeSignature(profile: EventCalendarDateProfile): string {
	return JSON.stringify([
		profile.view,
		profile.date.getTime(),
		profile.timeZone,
		profile.currentRange.start.getTime(),
		profile.currentRange.end.getTime(),
		profile.renderRange.start.getTime(),
		profile.renderRange.end.getTime(),
		profile.activeRange.start.getTime(),
		profile.activeRange.end.getTime(),
		profile.visibleDays
	]);
}

function cloneProfile(profile: EventCalendarDateProfile): EventCalendarRangeChangeInfo {
	return {
		view: profile.view,
		date: new Date(profile.date),
		timeZone: profile.timeZone,
		currentRange: cloneRange(profile.currentRange),
		renderRange: cloneRange(profile.renderRange),
		activeRange: cloneRange(profile.activeRange),
		fetchRange: cloneRange(profile.fetchRange),
		visibleDays: [...profile.visibleDays]
	};
}

function cloneRange(range: EventCalendarRange): EventCalendarRange {
	return { start: new Date(range.start), end: new Date(range.end) };
}
