import type { Messages } from '$lib/i18n/en.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { EventCalendarThemeProps } from './eventCalendar.theme.js';
import type {
	EventCalendarApi,
	EventCalendarBusinessHours,
	EventCalendarChange,
	EventCalendarCreateActivation,
	EventCalendarDateOnly,
	EventCalendarInteractionBlockedInfo,
	EventCalendarInteractions,
	EventCalendarItem,
	EventCalendarOccurrence,
	EventCalendarOffDaysConfig,
	EventCalendarOverlapPredicate,
	EventCalendarProposedUpdate,
	EventCalendarRange,
	EventCalendarRangeChangeInfo,
	EventCalendarRecurrenceExpander,
	EventCalendarResource,
	EventCalendarScrollMode,
	EventCalendarSegment,
	EventCalendarSelection,
	EventCalendarSlot,
	EventCalendarSlotSelectInfo,
	EventCalendarUpdateResult,
	EventCalendarView,
	EventCalendarWeekday
} from './eventCalendar.types.js';

export type { EventCalendarThemeProps } from './eventCalendar.theme.js';

export type EventCalendarMonthOptions = Readonly<{
	/** Renders six month rows. Defaults to `true`. */
	fixedWeeks?: boolean;
	/** Shows leading and trailing month dates. Defaults to `true`. */
	showOutsideDays?: boolean;
	/** Shows the month week-number gutter. Defaults to `false`. */
	showWeekNumbers?: boolean;
	/** Month overflow threshold. Defaults to `auto`. */
	maxItemsPerCell?: number | 'auto';
}>;

export type EventCalendarTimeGridOptions = Readonly<{
	/** First displayed wall hour. Defaults to `0`. */
	startHour?: number;
	/** Exclusive last displayed wall hour. Defaults to `24`. */
	endHour?: number;
	/** Time-gutter label interval in minutes. Defaults to `60`. */
	labelIntervalMinutes?: number;
	/** Empty-slot click duration in minutes. Defaults to `30`. */
	slotClickDurationMinutes?: number;
	/** Move, resize, and selection granularity in minutes. Defaults to `15`. */
	snapDurationMinutes?: number;
	/** Initial wall-hour scroll target. Defaults to `7`. */
	scrollToHour?: number;
	/** Current-time refresh cadence in milliseconds. Defaults to `30000`. */
	nowIndicatorRefreshMs?: number;
}>;

export type EventCalendarAvailabilityOptions = Readonly<{
	/** Non-working-day appearance policy. Defaults to `false`. */
	offDays?: boolean | EventCalendarOffDaysConfig;
	/** Same-day display-zone availability windows. Defaults to `[]`. */
	businessHours?: EventCalendarBusinessHours[];
	/** Restricts mutations to `businessHours`. Defaults to `false`. */
	constrainMutations?: boolean;
}>;

export type EventCalendarAllDayConversionOptions = Readonly<{
	/** Preserves the source duration when crossing timed/all-day regions. Defaults to `false`. */
	preserveDuration?: boolean;
	/** Timed duration used when converting an all-day item. Defaults to `60`. */
	timedDurationMinutes?: number;
	/** Civil-day duration used when converting a timed item. Defaults to `1`. */
	allDayDurationDays?: number;
}>;

export type EventCalendarInteractionOptions = Readonly<
	Partial<EventCalendarInteractions> & {
		/** Empty-slot drag-create thresholds. */
		createActivation?: Partial<EventCalendarCreateActivation>;
	}
>;

export type EventCalendarRecurrenceOptions<TItemFields extends object = Record<never, never>> =
	Readonly<{
		/** Recurring mutation scope. Defaults to `occurrence`. */
		editScope?: 'occurrence' | 'series' | 'disabled';
		/** Produces a new exception ID. Defaults to the built-in origin-based strategy. */
		getExceptionId?: (
			seriesItem: EventCalendarItem<TItemFields>,
			occurrence: EventCalendarOccurrence<TItemFields>
		) => string;
		/** Synchronous bounded recurrence expansion escape hatch. */
		expand?: EventCalendarRecurrenceExpander<TItemFields>;
	}>;

export type EventCalendarSnapshot<
	TItemFields extends object,
	TResourceFields extends object
> = Readonly<{
	items: readonly EventCalendarItem<TItemFields>[];
	resources: readonly EventCalendarResource<TResourceFields>[];
	view: EventCalendarView;
	date: Date;
	range: EventCalendarRangeChangeInfo;
	selection: EventCalendarSelection;
	loading: boolean;
	disabled: boolean;
	api: EventCalendarApi<TItemFields>;
}>;

export type EventCalendarHeaderPayload<
	TItemFields extends object,
	TResourceFields extends object
> = Readonly<
	EventCalendarSnapshot<TItemFields, TResourceFields> & {
		previous: Snippet;
		today: Snippet;
		next: Snippet;
		title: Snippet;
		viewSwitcher: Snippet;
		datePicker: Snippet;
		actions: Snippet;
	}
>;

export type EventCalendarItemPayload<TItemFields extends object> = Readonly<{
	occurrence: EventCalendarOccurrence<TItemFields>;
	segment: EventCalendarSegment<TItemFields>;
	view: EventCalendarView;
	isSelected: boolean;
	isDragging: boolean;
	defaultContent: Snippet;
	markerContent: Snippet;
	titleContent: Snippet;
	timeContent: Snippet;
}>;

export type EventCalendarItemTooltipPayload<TItemFields extends object> = Readonly<{
	occurrence: EventCalendarOccurrence<TItemFields>;
	segment: EventCalendarSegment<TItemFields>;
	view: EventCalendarView;
	defaultAccessibleLabel: string;
	defaultContent: Snippet;
}>;

export type EventCalendarMonthCellPayload<TItemFields extends object> = Readonly<{
	day: EventCalendarDateOnly;
	segments: readonly EventCalendarSegment<TItemFields>[];
	isToday: boolean;
	isOutside: boolean;
	isOffDay: boolean;
	isDisabled: boolean;
	overflowCount: number;
	defaultContent: Snippet;
}>;

export type EventCalendarDayHeaderPayload = Readonly<{
	day: EventCalendarDateOnly;
	view: EventCalendarView;
	isToday: boolean;
	defaultLabel: string;
	defaultContent: Snippet;
}>;

export type EventCalendarTimeGutterPayload = Readonly<{
	instant: Date;
	defaultLabel: string;
	defaultContent: Snippet;
}>;

export type EventCalendarAllDayPayload<TItemFields extends object> = Readonly<{
	visibleDays: readonly EventCalendarDateOnly[];
	segments: readonly EventCalendarSegment<TItemFields>[];
	defaultContent: Snippet;
}>;

export type EventCalendarOverflowPayload<TItemFields extends object> = Readonly<{
	day: EventCalendarDateOnly;
	hiddenOccurrences: readonly EventCalendarOccurrence<TItemFields>[];
	count: number;
	defaultContent: Snippet;
}>;

export type EventCalendarOverflowContentPayload<TItemFields extends object> = Readonly<{
	day: EventCalendarDateOnly;
	hiddenOccurrences: readonly EventCalendarOccurrence<TItemFields>[];
	close: () => void;
	defaultContent: Snippet;
}>;

export type EventCalendarAgendaDetailsPayload<TItemFields extends object> = Readonly<{
	occurrence: EventCalendarOccurrence<TItemFields>;
}>;

export type EventCalendarResourceHeaderPayload<TResourceFields extends object> = Readonly<{
	resource: EventCalendarResource<TResourceFields> | null;
	depth: number;
	isUnassigned: boolean;
	defaultContent: Snippet;
}>;

export type EventCalendarNowIndicatorPayload = Readonly<{
	now: Date;
	defaultContent: Snippet;
}>;

export type EventCalendarDragPreviewPayload<TItemFields extends object> = Readonly<{
	proposal: EventCalendarProposedUpdate<TItemFields>;
	isValid: boolean;
	defaultContent: Snippet;
}>;

export type EventCalendarViewPayload = Readonly<{
	view: EventCalendarView;
	visibleRange: EventCalendarRange;
	visibleDays: readonly EventCalendarDateOnly[];
}>;

export type EventCalendarEmptyPayload = Readonly<
	EventCalendarViewPayload & {
		mode: 'grid-status' | 'agenda-replacement';
		defaultContent: Snippet;
	}
>;

export type EventCalendarLoadingPayload = Readonly<
	EventCalendarViewPayload & {
		defaultContent: Snippet;
	}
>;

export type EventCalendarSnippetProps<
	TItemFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>
> = {
	/** Replaces the built-in header; `false` removes it. */
	header?: Snippet<[EventCalendarHeaderPayload<TItemFields, TResourceFields>]> | false;
	/** Renders additional header actions from the current calendar snapshot. */
	actions?: Snippet<[EventCalendarSnapshot<TItemFields, TResourceFields>]>;
	/** Replaces an occurrence segment's content with its view, selection, and drag state. */
	item?: Snippet<[EventCalendarItemPayload<TItemFields>]>;
	/** Replaces the built-in item HoverCard; `false` removes it. */
	itemTooltip?: Snippet<[EventCalendarItemTooltipPayload<TItemFields>]> | false;
	/** Replaces a month cell's content with its day, segments, states, and overflow count. */
	monthCell?: Snippet<[EventCalendarMonthCellPayload<TItemFields>]>;
	/** Replaces a visible-day header with its day, view, today state, and built-in content. */
	dayHeader?: Snippet<[EventCalendarDayHeaderPayload]>;
	/** Replaces a time-gutter label with its instant, formatted label, and built-in content. */
	timeGutter?: Snippet<[EventCalendarTimeGutterPayload]>;
	/** Replaces the all-day row with its visible days, segments, and built-in content. */
	allDay?: Snippet<[EventCalendarAllDayPayload<TItemFields>]>;
	/** Replaces a month-cell overflow trigger with its day and hidden occurrences. */
	overflow?: Snippet<[EventCalendarOverflowPayload<TItemFields>]>;
	/** Replaces the overflow popover body with its hidden occurrences and close action. */
	overflowContent?: Snippet<[EventCalendarOverflowContentPayload<TItemFields>]>;
	/** Renders additional details for an agenda occurrence. */
	agendaDetails?: Snippet<[EventCalendarAgendaDetailsPayload<TItemFields>]>;
	/** Replaces a resource header with its resource, hierarchy depth, and assignment state. */
	resourceHeader?: Snippet<[EventCalendarResourceHeaderPayload<TResourceFields>]>;
	/** Replaces the built-in current-time line; `false` removes it. */
	nowIndicator?: Snippet<[EventCalendarNowIndicatorPayload]> | false;
	/** Replaces the pointer-drag preview with its item proposal and validity state. */
	dragPreview?: Snippet<[EventCalendarDragPreviewPayload<TItemFields>]>;
	/** Replaces empty-state content with its visible range, days, and display mode. */
	empty?: Snippet<[EventCalendarEmptyPayload]>;
	/** Replaces loading-state content with its visible range and days. */
	loadingContent?: Snippet<[EventCalendarLoadingPayload]>;
};

export type EventCalendarCallbackProps<TItemFields extends object = Record<never, never>> = {
	/** Reports the view, anchor, zone, current/render/active/fetch ranges, and visible days. */
	onRangeChange?: (info: EventCalendarRangeChangeInfo) => void;
	/** Reports an accepted immutable item mutation with updated items and its guarded transaction. */
	onItemsChange?: (payload: EventCalendarItemsChangePayload<TItemFields>) => void;
	/** Reports a calendar-driven reassignment of the active view. */
	onViewChange?: (view: EventCalendarView) => void;
	/** Reports a calendar-driven reassignment of the anchor instant. */
	onDateChange?: (date: Date) => void;
	/** Reports a calendar-driven reassignment of the visible-day count. */
	onDayCountChange?: (dayCount: number) => void;
	/** Reports a calendar-driven reassignment of the selected item or slot. */
	onSelectionChange?: (selection: EventCalendarSelection) => void;
	/** Reports an activated occurrence and its native pointer event. */
	onItemClick?: (payload: EventCalendarItemClickPayload<TItemFields>) => void;
	/** Reports a double-activated occurrence and its native pointer event. */
	onItemDoubleClick?: (payload: EventCalendarItemClickPayload<TItemFields>) => void;
	/** Reports an activated calendar slot and its native pointer event. */
	onSlotClick?: (payload: EventCalendarSlotClickPayload) => void;
	/** Reports a selected slot and the interaction source that selected it. */
	onSlotSelect?: (payload: EventCalendarSlotSelectPayload) => void;
	/** Reports a month's hidden occurrences and pointer event; return `false` to prevent its popover. */
	onMoreClick?: (payload: EventCalendarMoreClickPayload<TItemFields>) => false | void;
	/** Reports a rejected item or slot interaction with its reason and interaction source. */
	onInteractionBlocked?: (info: EventCalendarInteractionBlockedInfo<TItemFields>) => void;
};

/** Immutable collection and guarded transaction reported after an item mutation. */
export type EventCalendarItemsChangePayload<TItemFields extends object = Record<never, never>> =
	Readonly<{
		items: EventCalendarItem<TItemFields>[];
		change: EventCalendarChange<TItemFields>;
	}>;

/** Occurrence and native pointer event reported by item click callbacks. */
export type EventCalendarItemClickPayload<TItemFields extends object = Record<never, never>> =
	Readonly<{
		occurrence: EventCalendarOccurrence<TItemFields>;
		event: MouseEvent;
	}>;

/** Calendar slot and native pointer event reported by `onSlotClick`. */
export type EventCalendarSlotClickPayload = Readonly<{
	slot: EventCalendarSlot;
	event: MouseEvent;
}>;

/** Selected slot and interaction source reported by `onSlotSelect`. */
export type EventCalendarSlotSelectPayload = Readonly<{
	slot: EventCalendarSlot;
	info: EventCalendarSlotSelectInfo;
}>;

/** Hidden occurrences and native pointer event reported by `onMoreClick`. */
export type EventCalendarMoreClickPayload<TItemFields extends object = Record<never, never>> =
	Readonly<{
		day: EventCalendarDateOnly;
		occurrences: readonly EventCalendarOccurrence<TItemFields>[];
		event: MouseEvent;
	}>;

type EventCalendarOwnProps<
	TItemFields extends object,
	TResourceFields extends object
> = EventCalendarSnippetProps<TItemFields, TResourceFields> &
	EventCalendarCallbackProps<TItemFields> & {
		/** Bindable immutable item definitions. Defaults to `[]`. */
		items?: EventCalendarItem<TItemFields>[];
		/** Bindable active view. Defaults to `month`. */
		view?: EventCalendarView;
		/** Ordered, unique views. Defaults to `['month', 'week', 'day', 'days', 'agenda', 'resource']`. */
		views?: EventCalendarView[];
		/** Required bindable anchor instant. */
		date: Date;
		/** Bindable visible-day count for the `days` view. Defaults to `3`. */
		dayCount?: number;
		/** Bindable item or slot selection. Defaults to the empty selection. */
		selection?: EventCalendarSelection;
		/** Immutable flat resources whose `parentId` values form groups. Defaults to `[]`. */
		resources?: EventCalendarResource<TResourceFields>[];
		/** Marks content busy and blocks content interactions. Defaults to `false`. */
		loading?: boolean;
		/** Disables navigation, selection, and mutations. Defaults to `false`. */
		disabled?: boolean;
		/** Chrome and item spacing, independent of the time scale. Defaults to `normal`. */
		density?: Density;
		/** Root classes; contained scrolling requires an explicit height here. Defaults to none. */
		class?: string;
		/** Bindable root element reference. Defaults to none. */
		ref?: HTMLElement | null;
		/** Per-instance stable-part CVA overrides. Defaults to none. */
		theme?: EventCalendarThemeProps;
		/** Required IANA display time zone or `UTC`. */
		timeZone: string;
		/** BCP-47 formatting locale. Defaults to the active Svelai catalog locale. */
		locale?: string;
		/** Per-instance Svelai message overrides. Defaults to none. */
		i18n?: Partial<Messages>;
		/** Explicit reading direction; otherwise inherits the ambient direction. */
		dir?: 'ltr' | 'rtl';
		/** Explicit first weekday; otherwise derives from the active locale. */
		weekStartsOn?: EventCalendarWeekday;
		/** Half-open navigation, selection, and mutation boundary. Defaults to unbounded. */
		validRange?: EventCalendarRange;
		/** Month-only layout and overflow options. */
		month?: EventCalendarMonthOptions;
		/** Includes configured weekend columns. Defaults to `true`. */
		showWeekends?: boolean;
		/** Weekend weekday numbers. Defaults to `[0, 6]`. */
		weekendDays?: EventCalendarWeekday[];
		/** Time-grid geometry, selection intervals, initial scroll, and clock refresh. */
		timeGrid?: EventCalendarTimeGridOptions;
		/** Timed/all-day conversion policy. */
		allDayConversion?: EventCalendarAllDayConversionOptions;
		/** Count of rendered agenda days. Defaults to `30`. */
		agendaDayCount?: number;
		/** Non-working days, business windows, and mutation constraints. */
		availability?: EventCalendarAvailabilityOptions;
		/** Internal or document scrolling. Defaults to `contained`. */
		scrollMode?: EventCalendarScrollMode;
		/** Makes the default header sticky in page-scroll mode. Defaults to `false`. */
		stickyHeader?: boolean;
		/** Adds the default date-jump popover. Defaults to `false`. */
		showDatePicker?: boolean;
		/** Fine-grained interaction and empty-slot activation policy. */
		interactions?: EventCalendarInteractionOptions;
		/** Foreground overlap policy. Defaults to `true`. */
		allowOverlap?: boolean | EventCalendarOverlapPredicate<TItemFields>;
		/** Synchronous live item-proposal validator. Defaults to allowing proposals. */
		validateItemUpdate?: (proposal: EventCalendarProposedUpdate<TItemFields>) => boolean;
		/** Synchronous item-proposal commit policy and adjustment hook. Defaults to accept. */
		resolveItemUpdate?: (
			proposal: EventCalendarProposedUpdate<TItemFields>
		) => EventCalendarUpdateResult;
		/** Synchronous slot-range validator. Defaults to allowing slots. */
		validateSlotSelection?: (slot: EventCalendarSlot) => boolean;
		/** Recurrence mutation and expansion policy. */
		recurrence?: EventCalendarRecurrenceOptions<TItemFields>;
		/** Maximum undo entries; `0` disables history. Defaults to `50`. */
		historyLimit?: number;
	};

/** Public props for the two-generic EventCalendar component. */
export type EventCalendarProps<
	TItemFields extends object = Record<never, never>,
	TResourceFields extends object = Record<never, never>
> = WithAttachments<
	Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'color'> &
		EventCalendarOwnProps<TItemFields, TResourceFields>
>;
