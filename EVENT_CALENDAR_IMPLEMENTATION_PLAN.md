# EventCalendar Implementation Plan

## Status

Planning only. This document defines the contract and phased implementation; it does not implement the component.

## Goal

Build a first-class Svelai `EventCalendar` that feels native to this library rather than like a React calendar port. The final component must support the ordinary scheduling surface expected from a complete event calendar: month, week, day, configurable N-day, agenda, and resource views; timed, all-day, multi-day, and recurring items; date navigation; overflow handling; drag-to-move, edge resize, and drag-to-create; touch, keyboard, and non-drag alternatives; named time zones; localization and RTL; responsive layouts; and consumer-owned persistence.

The public API will be one high-level component imported from `svelai/event-calendar`. Internal view components remain private. Composition is provided through Svelte snippets, ready-made default-content snippets, theme parts, bindable state, callbacks, and a small imperative handle.

## Context

- Svelai components use Svelte 5 runes, bindable props, callback props, `Slot`, attachments, CVA theme parts, package subpath exports, MCP documentation, and a documentation route. See `COMPONENT_CREATION_PROMPT.md` and `src/routes/docs/conventions/+page.svelte`.
- The existing `Form/Calendar` is a date-selection control. Its state and event type do not own scheduling concerns such as stable item identity, timed layout, all-day bars, recurrence, resource assignment, or mutations. `EventCalendar` therefore belongs in a new top-level `src/lib/components/EventCalendar/` module.
- The repository already contains the right UI and interaction primitives: `Button`, `ButtonGroup`, `SegmentedControl`, `PopupMenu`, `Popover`, `CalendarPrimitive`, `ScrollArea`, `Tooltip`, `Empty`, `Spinner`, icons, `Slot`, `useResizeObserver`, `createPointerDrag`, and Pragmatic Drag and Drop with auto-scroll.
- The worktree is already dirty, including files that the eventual integration must touch (`package.json`, `src/hooks.server.ts`, and `src/routes/appNavigation.ts`). Implementation must preserve all unrelated changes.
- Per repository instruction, this plan does not add automated test files. Every phase still has explicit static, browser, accessibility, and packaging verification gates.

## Research conclusions

ReUI establishes the target feature surface: month, week, day, N-day, agenda, and resource views; move, resize, and drag-create interactions; recurrence; named time zones; display settings; range loading callbacks; and granular render overrides. Its useful architectural lesson is the separation of state/date/event logic from view rendering, not its React compound-component API. [ReUI component overview](https://reui.io/components/event-calendar), [ReUI API](https://reui.io/docs/components/base/event-calendar), [ReUI registry](https://reui.io/r/event-calendar.json).

FullCalendar independently validates four boundaries that matter here: date profiles, event definitions versus concrete occurrences, view-specific segments, and reversible interaction mutations. It also treats every event and selection end as exclusive. [FullCalendar event model](https://fullcalendar.io/docs/event-object), [FullCalendar drag/resize](https://fullcalendar.io/docs/event-dragging-resizing), [FullCalendar date selection](https://fullcalendar.io/docs/date-clicking-selecting).

Pragmatic Drag and Drop is already installed, is view-library agnostic, and exposes low-level element draggables, drop targets, monitors, and auto-scroll. The existing `useDndList` is intentionally not reused because it models ordered before/after insertion, while a calendar needs two-dimensional date/time hit testing. The underlying package will be reused directly. [Pragmatic Drag and Drop core](https://atlassian.design/components/pragmatic-drag-and-drop/core-package), [drop targets](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/drop-targets).

### Chosen pattern

One public Svelte component owns an internal reactive state object. That state composes pure date-profile, recurrence, indexing, segmentation, and packing modules plus one calendar-specific interaction controller. Private Svelte view components render from the same state. Snippets customize owned regions without taking away semantics, focusability, or interaction wiring.

### Deliberate departures from ReUI and FullCalendar

- The main collection is `items`, not `events`, because Svelai’s public convention names the top-level rendered collection `items` and carries domain meaning in `EventCalendarItem`.
- There is no public provider/compound API (`EventCalendarNav`, `EventCalendarMonthView`, and so on). Svelai translates source compound parts into props, snippets, and theme parts.
- There is no public plugin system or whole-view replacement prop. Built-in view adapters stay static and internal; named region snippets customize their content without replacing the date, layout, interaction, or accessibility owners. A custom-view contract waits for a real second consumer.
- There is no React-style `defaultDate`/`date` or `defaultView`/`view` duplication. The explicit `date` and defaulted `view` are each single bindable sources with matching component-originated callbacks.
- There is no built-in event loader or persistence layer. Consumers fetch from `onRangeChange`, pass `items` and `loading`, and persist from `onItemsChange`. This keeps network errors at the application boundary and prevents the component from silently converting failures into empty calendars.
- The component does not own create/edit dialogs. `onSlotClick`, `onSlotSelect`, and `onItemClick` compose with the existing `Dialog`, `Form`, `DateInput`, `TimeInput`, `Select`, and `Switch` components.
- `timeZone` is required instead of defaulting to “system.” A Cloudflare server and browser can resolve different system zones, so an inferred default would make SSR output semantically unstable. Browser-only consumers can explicitly pass `Intl.DateTimeFormat().resolvedOptions().timeZone`; SSR applications must choose the user/application zone at their own boundary.
- Pragmatic Drag and Drop owns item move/resize activation and uses its installed standard auto-scroll behavior. The public API does not pretend those package internals are pixel-tunable; `createActivation` applies only to the calendar-owned empty-slot range gesture.

## Scope boundary

### Included in the final component

- Month, week, day, configurable N-day, agenda, and resource-day views.
- Timed, all-day, multi-day, background, and recurring items.
- Fixed or natural month rows, outside days, optional weekends, week numbers, off-day marking, business hours, now indicator, and visible-range reporting.
- Month overflow with `+N more`, deterministic bar lanes, timed overlap packing, and all-day lanes.
- Bindable `items`, `view`, `date`, `dayCount`, and `selection` with matching change callbacks.
- Click, double-click, slot click, range selection, move, start/end resize, all-day/timed conversion, resource transfer, and drag-created ranges.
- Live validation, overlap policy, valid-range/business-hour constraints, snap intervals, invalid-drop feedback, immutable commits, and `revert()`.
- Mouse, touch long-press, keyboard move/resize mode, Escape cancellation, auto-scroll, reduced motion, and a single-pointer alternative to dragging.
- Explicit IANA named time zones (including the browser’s resolved local zone), UTC, DST-safe civil-day math, BCP-47 locales, all shipped Svelai catalogs, and RTL.
- Per-instance and global Svelai theming, semantic item colors, data-state attributes, CSS metric variables, and named snippets.
- SSR-safe rendering and package-safe ESM exports.

### Explicit non-goals

- Calendar-owned HTTP requests, caching, retries, optimistic server mutations, or backend adapters.
- Event-title/details forms, domain validation, notifications, or database persistence.
- Multi-month, year, timeline/Gantt, print, PDF, ICS import/export, or email/calendar-provider integration.
- Dragging between separate calendar instances or accepting arbitrary external DOM/file drags in the first release.
- Virtualizing normal month/week/day views. The index and render boundaries must leave room for later resource virtualization without exposing a speculative public API.
- Copying ReUI or FullCalendar source. The implementation is Svelte-native and uses those libraries only as behavioral and architectural references.

## Correctness invariants

These are contracts, not implementation details.

1. Every range is half-open: `[start, end)`. Adjacent items do not overlap; an all-day item ending on 15 July renders through 14 July.
2. `EventCalendarItem.id` is stable and unique. Duplicate IDs, invalid dates, `end < start`, or a zero-length all-day range surface an `EventCalendarError`; they are never skipped silently. Zero-length timed items remain valid.
3. Timed values and visible ranges use `Date` instants. All-day item/slot boundaries use canonical `YYYY-MM-DD` strings, which remain floating civil dates when the display zone changes. Timed series require their own IANA `recurrenceTimeZone`, so changing the calendar’s display zone never reschedules the series or invalidates exception origins. Recurrence `UNTIL`, exclusion/addition dates, and exception origins use the same representation as their source item, even when an exception’s current placement has been converted between all-day and timed. Civil days are never advanced with `86_400_000` milliseconds.
4. The component never mutates consumer item objects. Accepted changes replace `items` immutably while preserving the consumer’s generic subtype fields.
5. One proposal pipeline owns API updates, pointer moves, pointer resizes, keyboard changes, and resource transfers. Validation and commit behavior cannot diverge by input method.
6. A live preview never mutates `items`. An accepted drop creates one atomic reassignment; a rejected or cancelled gesture leaves the collection untouched.
7. Persistence errors are not swallowed. Consumers can call the change transaction’s `revert()` after an async save failure and then propagate or display the original error.
8. Snippets customize content inside component-owned semantic and interactive wrappers. An item snippet cannot remove focusability, accessible naming, selection state, drag wiring, resize handles, or live announcements.
9. The component never changes view merely because its container became narrow. Responsive behavior compresses, wraps, truncates, overflows, or scrolls while preserving the requested view.
10. Recurrence expansion is range-bounded and capped. Unsupported RRULE parts and cap exhaustion throw explicit recurrence errors instead of truncating plausible-looking data.
11. `revert()` cannot overwrite a newer consumer or calendar mutation. It restores the captured array only while the committed array is still current; otherwise it throws a stale-transaction `EventCalendarError` so the application can reconcile explicitly.
12. `items` and `resources` are immutable controlled collections: every consumer update allocates a fresh outer array that has never previously been published and replaces every changed definition object. Reassigning an old array, in-place property writes, and `Date` mutators are outside the contract. The component’s guarded one-shot `revert()` is the sole intentional reuse of a captured prior array. This rules out ABA identity reuse and makes cache invalidation and stale detection deterministic.
13. A change to the item/resource collections, date-profile inputs, loading/disabled state, or mutation-policy inputs during an active gesture cancels that gesture and tears down its monitor before deriving new state. A stale proposal never commits.
14. Occurrence identity never depends on its current displayed start. A non-recurring occurrence uses its item ID; a recurring occurrence and its exception use a collision-safe encoding of series ID plus canonical original start, so moving, start-resizing, or converting one occurrence does not remount or orphan selection. A series-wide move, start-resize, or representation conversion deliberately changes canonical origins and therefore rekeys generated occurrences while atomically remapping selection/focus; end-resize remains key-stable, and persisted item IDs always remain stable.
15. An empty month, week, day, N-day, or resource view still renders its cells and drop surfaces so the first item can be selected or drag-created. Empty UI is a sibling status region for grids and replacement content only for agenda.

## Proposed public model

```ts
import type { Colors, Density } from '$lib/types/theme.js';

export type EventCalendarColor = Colors | (string & {});
export type EventCalendarWeekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type EventCalendarDateOnly = `${number}-${number}-${number}`; // runtime-validated YYYY-MM-DD

export type EventCalendarErrorCode =
	| 'invalid-prop'
	| 'invalid-item'
	| 'duplicate-item-id'
	| 'invalid-resource'
	| 'invalid-view'
	| 'invalid-time-zone'
	| 'invalid-recurrence'
	| 'unsupported-recurrence'
	| 'recurrence-limit'
	| 'invalid-adjustment'
	| 'missing-target'
	| 'stale-transaction';

export class EventCalendarError extends Error {
	readonly name = 'EventCalendarError';
	constructor(
		readonly code: EventCalendarErrorCode,
		message: string,
		readonly details?: Readonly<Record<string, unknown>>
	) {
		super(message);
	}
}

export type EventCalendarView = 'month' | 'week' | 'day' | 'days' | 'agenda' | 'resource';

export type EventCalendarRange = {
	start: Date;
	end: Date; // exclusive instants
};

type EventCalendarSlotBase = {
	view: EventCalendarView;
	resourceId?: string;
};

export type EventCalendarSlot =
	| (EventCalendarSlotBase & { allDay: false; start: Date; end: Date })
	| (EventCalendarSlotBase & {
			allDay: true;
			start: EventCalendarDateOnly;
			end: EventCalendarDateOnly;
	  });

export type EventCalendarSlotSelectInfo = Readonly<{
	source: 'drag-create' | 'keyboard' | 'single-pointer';
}>;

export type EventCalendarBusinessHours = {
	daysOfWeek?: EventCalendarWeekday[];
	start: string; // HH:mm wall time in the display zone
	end: string; // HH:mm wall time in the display zone
};

export type EventCalendarOffDaysConfig = {
	weekdays?: EventCalendarWeekday[];
	dates?: EventCalendarDateOnly[];
	isOffDay?: (date: EventCalendarDateOnly) => boolean;
};

export type EventCalendarCreateActivation = {
	distancePx: number;
	touchDelayMs: number;
	touchTolerancePx: number;
};

export type EventCalendarRecurrenceRule<
	TDate extends Date | EventCalendarDateOnly = Date | EventCalendarDateOnly
> = {
	freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
	interval?: number;
	count?: number;
	until?: TDate;
	byWeekday?: Array<
		| 'MO'
		| 'TU'
		| 'WE'
		| 'TH'
		| 'FR'
		| 'SA'
		| 'SU'
		| { day: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU'; ordinal: number }
	>;
	byMonthDay?: number[];
	byMonth?: number[];
	weekStart?: 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';
	exDates?: TDate[];
	rDates?: TDate[];
};

type EventCalendarItemBase = {
	id: string;
	title: string;
	display?: 'auto' | 'background';
	color?: EventCalendarColor;
	readOnly?: boolean;
	draggable?: boolean;
	resizable?: boolean;
	priority?: number;
	resourceId?: string;
};

type EventCalendarResourceBase = {
	id: string;
	title: string;
	parentId?: string;
	color?: EventCalendarColor;
};

type EventCalendarOwnedItemKey =
	| keyof EventCalendarItemBase
	| 'start'
	| 'end'
	| 'allDay'
	| 'recurrence'
	| 'recurrenceTimeZone'
	| 'recurringItemId'
	| 'originalStart';

type EventCalendarOwnedResourceKey = keyof EventCalendarResourceBase;

type EventCalendarCustomFields<
	TFields extends object,
	TOwnedKey extends PropertyKey
> = TFields extends unknown
	? string extends keyof TFields
		? never
		: Extract<keyof TFields, TOwnedKey> extends never
			? TFields
			: never
	: never;

type EventCalendarTimedPlacement = {
	start: Date;
	end: Date;
	allDay?: false;
};

type EventCalendarAllDayPlacement = {
	start: EventCalendarDateOnly;
	end: EventCalendarDateOnly;
	allDay: true;
};

type EventCalendarTimedSourceIdentity =
	| {
			recurrence?: never;
			recurrenceTimeZone?: never;
			recurringItemId?: never;
			originalStart?: never;
	  }
	| {
			recurrence: EventCalendarRecurrenceRule<Date> | string;
			recurrenceTimeZone: string;
			recurringItemId?: never;
			originalStart?: never;
	  };

type EventCalendarAllDaySourceIdentity = {
	recurrence?: EventCalendarRecurrenceRule<EventCalendarDateOnly> | string;
	recurrenceTimeZone?: never;
	recurringItemId?: never;
	originalStart?: never;
};

type EventCalendarExceptionIdentity = {
	recurrence?: never;
	recurrenceTimeZone?: never;
	recurringItemId: string;
	// Representation follows the referenced source series, not the exception's current placement.
	originalStart: Date | EventCalendarDateOnly;
};

type EventCalendarSchedule =
	| (EventCalendarTimedPlacement & EventCalendarTimedSourceIdentity)
	| (EventCalendarAllDayPlacement & EventCalendarAllDaySourceIdentity)
	| ((EventCalendarTimedPlacement | EventCalendarAllDayPlacement) & EventCalendarExceptionIdentity);

export type EventCalendarItem<TItemFields extends object = Record<never, never>> =
	EventCalendarCustomFields<TItemFields, EventCalendarOwnedItemKey> &
		EventCalendarItemBase &
		EventCalendarSchedule;

export type EventCalendarResource<TResourceFields extends object = Record<never, never>> =
	EventCalendarCustomFields<TResourceFields, EventCalendarOwnedResourceKey> &
		EventCalendarResourceBase;

export type EventCalendarOccurrence<TItemFields extends object = Record<never, never>> = {
	key: string; // item id, or collision-safe (series id, canonical original start)
	item: EventCalendarItem<TItemFields>;
	start: Date;
	end: Date;
	allDay: boolean;
	isRecurring: boolean;
	originalStart: Date | EventCalendarDateOnly;
};

export type EventCalendarSegment<TItemFields extends object = Record<never, never>> = {
	key: string;
	occurrence: EventCalendarOccurrence<TItemFields>;
	day: EventCalendarDateOnly;
	start: Date;
	end: Date;
	isStart: boolean;
	isEnd: boolean;
	continuesBefore: boolean;
	continuesAfter: boolean;
};

export type EventCalendarSelection =
	| { kind: null; itemKey: null; slot: null }
	| { kind: 'item'; itemKey: string; slot: null }
	| { kind: 'slot'; itemKey: null; slot: EventCalendarSlot };

export type EventCalendarMutationSource =
	'drag' | 'resize-start' | 'resize-end' | 'keyboard' | 'single-pointer' | 'api';

export type EventCalendarProposedUpdate<TItemFields extends object = Record<never, never>> = {
	kind: 'move' | 'resize-start' | 'resize-end' | 'update';
	source: EventCalendarMutationSource;
	occurrence?: EventCalendarOccurrence<TItemFields>; // present for occurrence-originated interactions
	previousItem: EventCalendarItem<TItemFields>;
	item: EventCalendarItem<TItemFields>;
};

export type EventCalendarInteractions = {
	drag: boolean;
	resize: boolean;
	selectSlot: boolean;
	keyboard: boolean;
	singlePointer: boolean;
	maintainDurationOnAllDayChange: boolean;
};

export type EventCalendarRangeChangeInfo = {
	view: EventCalendarView;
	date: Date;
	timeZone: string;
	currentRange: EventCalendarRange;
	renderRange: EventCalendarRange;
	activeRange: EventCalendarRange;
	fetchRange: EventCalendarRange;
	visibleDays: readonly EventCalendarDateOnly[];
};

export type EventCalendarExpandedOccurrence =
	| { allDay: false; start: Date; end: Date; originalStart: Date }
	| {
			allDay: true;
			start: EventCalendarDateOnly;
			end: EventCalendarDateOnly;
			originalStart: EventCalendarDateOnly;
	  };

export type EventCalendarOverlapPredicate<TItemFields extends object = Record<never, never>> = (
	info:
		| {
				kind: 'item';
				proposal: EventCalendarProposedUpdate<TItemFields>;
				conflictingOccurrence: EventCalendarOccurrence<TItemFields>;
		  }
		| {
				kind: 'slot';
				slot: EventCalendarSlot;
				conflictingOccurrence: EventCalendarOccurrence<TItemFields>;
		  }
) => boolean;

export type EventCalendarRecurrenceExpander<TItemFields extends object = Record<never, never>> =
	(info: {
		item: EventCalendarItem<TItemFields>;
		range: EventCalendarRange;
		displayTimeZone: string;
		recurrenceTimeZone: string | null;
	}) => readonly EventCalendarExpandedOccurrence[];

export type EventCalendarInteractionBlockedInfo<TItemFields extends object = Record<never, never>> =
	{
		reason:
			| 'disabled'
			| 'read-only'
			| 'invalid-target'
			| 'valid-range'
			| 'business-hours'
			| 'overlap'
			| 'custom-policy'
			| 'stale';
		source: EventCalendarMutationSource | 'drag-create' | 'slot-click';
		proposal?: EventCalendarProposedUpdate<TItemFields>;
		slot?: EventCalendarSlot;
	};
```

`EventCalendarDateOnly` is a readable compile-time hint, not sufficient validation by itself. The state boundary accepts only zero-padded, real Gregorian dates in `YYYY-MM-DD` form and parses them without `Date.parse`. Every public payload described as a “day” uses this date-only representation. Concrete `EventCalendarOccurrence.start/end` values remain display-zone boundary instants for layout and formatting.

The supported civil-display domain is capped without widening that public representation. `0001-01-01` is the first renderable day, `9999-12-30` is the last renderable/selectable day, and `9999-12-31` remains valid only as the maximum exclusive civil boundary (including an all-day item end). A direct anchor, profile, or date-jump request whose required half-open end would exceed that boundary throws a coded `invalid-prop` error; it is never truncated or clamped. Previous/next navigation candidates outside the supported domain are deterministic no-ops with no state mutation or callback. Timed `Date` semantics are unchanged.

Item/slot `end` remains exclusive, but recurrence `until` follows RRULE semantics and is inclusive. `exDates`, `rDates`, and exception `originalStart` identify canonical occurrence starts—instants for timed series, date-only keys for all-day series—not arbitrary overlapping ranges.

`EventCalendarError` reports only component-owned validation/state failures. Errors thrown by consumer policies, snippets, persistence handlers, or recurrence expanders retain their original identity and propagate unchanged.

`readOnly` overrides `draggable` and `resizable`; explicit per-item `false` overrides the global interaction policy. Background items participate in display only, never selection, overlap rejection, drag, resize, tooltips, or the action menu. Timed source definitions with `recurrence` also require `recurrenceTimeZone`; all-day recurrence remains floating and forbids it. Persisted exceptions carry `recurringItemId` + `originalStart`. Their placement union is independent from their origin union: a timed exception may retain an all-day source’s date-only origin, and an all-day exception may retain a timed source’s instant origin. The runtime validator resolves the referenced source and rejects mixed identities, orphaned references, source/origin representation mismatches, and duplicate exceptions for one canonical origin.

Concretely, every exception must have its own unique `id`, reference a distinct non-exception item with a recurrence rule in the same bound collection, use an origin representation matching that source, and be the only exception for the `(recurringItemId, originalStart)` tuple. Expansion verifies that the origin belongs to the source rule before suppression; a missing generated origin is an invalid recurrence definition rather than an ignored no-op.

Consumer fields are the generic parameter rather than the schedule subtype itself. This guarantees that timed ↔ all-day conversion can switch the discriminated schedule branch while retaining the same typed fields. Resource fields use the same pattern, and the flat `parentId` model preserves them through hierarchy construction:

```ts
type MeetingFields = {
	attendees: User[];
	conferenceUrl?: string;
};

type RoomFields = {
	capacity: number;
	floor: string;
};

let items = $state<EventCalendarItem<MeetingFields>[]>([]);
let resources = $state<EventCalendarResource<RoomFields>[]>([]);
```

`EventCalendarCustomFields` distributes across union branches and removes any branch that collides with an owned key; this is a compiler-enforced prohibition, not a documentation convention. A broad string-index signature is rejected because the compiler cannot prove that it excludes owned names. `TItemFields` therefore cannot redeclare item identity, schedule, recurrence, or resource-assignment keys, and `TResourceFields` cannot redeclare resource identity/hierarchy keys. `EventCalendarProps<TItemFields, TResourceFields>` carries both generics through callbacks, snippet payloads, and hierarchy construction; item fields also flow through the imperative mutation/query API without casts or side lookups.

## Proposed prop contract

Defaults below are part of the intended contract and must be documented in JSDoc and MCP docs.

The concrete `EventCalendarProps<TItemFields, TResourceFields>` is one `WithAttachments<HTMLAttributes<HTMLDivElement> & EventCalendarSnippetProps<...> & EventCalendarCallbackProps<...> & { ...table props }>` composition. It does not introduce a parallel options/context object or a `children` escape hatch.

### Core state

| Prop        | Type                                       | Default                             | Contract                                                                         |
| ----------- | ------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------- |
| `items`     | `EventCalendarItem<TItemFields>[]`         | `[]`                                | Main bindable collection; component and consumer changes replace the array.      |
| `view`      | `EventCalendarView`                        | `'month'`                           | Active bindable view.                                                            |
| `views`     | `EventCalendarView[]`                      | month/week/day/days/agenda/resource | Ordered configured set; unavailable resource view is filtered from the switcher. |
| `date`      | `Date`                                     | required                            | Bindable anchor instant; explicit input keeps SSR and hydration on one profile.  |
| `dayCount`  | `number`                                   | `3`                                 | Positive-integer count of rendered visible days; hidden weekdays are skipped.    |
| `selection` | `EventCalendarSelection`                   | empty                               | Bindable selected occurrence or slot range; committing one clears the other.     |
| `resources` | `EventCalendarResource<TResourceFields>[]` | `[]`                                | Immutable flat resources; `parentId` builds groups and leaves become columns.    |
| `loading`   | `boolean`                                  | `false`                             | Marks content busy and blocks content interaction without disabling navigation.  |
| `disabled`  | `boolean`                                  | `false`                             | Disables navigation, selection, and mutations.                                   |

`views` is validated as a non-empty, duplicate-free ordered list. The resource view is available only while the normalized resource tree has at least one leaf; unavailable resource entries remain configured but are removed from the current enabled set. If `view` is absent from that set on initialization, after an external assignment, after `views` changes, or after the last resource leaf disappears, state reconciles to the first enabled configured view, reassigns the binding, and reports exactly one `onViewChange`. It does not automatically restore a formerly active resource view when resources return. If filtering leaves no enabled view—for example `views={['resource']}` with no resource leaf—the state throws a coded invalid-view error instead of silently adding an unrequested fallback. The switcher renders only the enabled set, and `setView` rejects any other value.

### Style and root integration

| Prop                 | Type                             | Default    | Contract                                                                       |
| -------------------- | -------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| `density`            | `Density`                        | `'normal'` | Controls chrome, grid, and item spacing without changing the time scale.       |
| `class`              | `string`                         | none       | Root class; contained mode receives its explicit height here.                  |
| `ref`                | `HTMLElement \| null`            | none       | Bindable root element reference.                                               |
| `theme`              | `EventCalendarThemeProps`        | none       | Per-instance overrides for stable theme parts and variants.                    |
| root HTML attributes | `HTMLAttributes<HTMLDivElement>` | none       | Forwarded to the first DOM element; attachment props follow `WithAttachments`. |

### Date, locale, and visible range

| Prop            | Type                                           | Default                      | Contract                                                                                      |
| --------------- | ---------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------- |
| `timeZone`      | `string`                                       | required                     | Explicit display-zone IANA name or `'UTC'`; prevents server/browser inference from diverging. |
| `locale`        | `string`                                       | active Svelai catalog locale | BCP-47 locale for date/time formatting.                                                       |
| `i18n`          | `Partial<Messages>`                            | none                         | Per-instance Svelai message overrides.                                                        |
| `dir`           | `'ltr' \| 'rtl'`                               | ambient direction            | Mirrors navigation and horizontal interaction semantics.                                      |
| `weekStartsOn`  | `EventCalendarWeekday`                         | locale-derived               | Explicit value wins over locale week information.                                             |
| `validRange`    | `EventCalendarRange`                           | unbounded                    | Half-open navigation, selection, and mutation boundary.                                       |
| `onRangeChange` | `(info: EventCalendarRangeChangeInfo) => void` | none                         | Fires after mount for the initial client range and every later derived `fetchRange`.          |

### View configuration

| Prop                        | Type                                    | Default       | Contract                                                                                             |
| --------------------------- | --------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| `fixedWeeks`                | `boolean`                               | `true`        | Month renders six rows when true.                                                                    |
| `showOutsideDays`           | `boolean`                               | `true`        | Shows leading/trailing month days.                                                                   |
| `showWeekends`              | `boolean`                               | `true`        | Removes configured weekend columns when false; at least one visible weekday is required.             |
| `weekendDays`               | `EventCalendarWeekday[]`                | `[0, 6]`      | Weekend/off-day weekday numbers.                                                                     |
| `showWeekNumbers`           | `boolean`                               | `false`       | Adds the month week-number gutter.                                                                   |
| `maxItemsPerCell`           | `number \| 'auto'`                      | `'auto'`      | Month overflow threshold.                                                                            |
| `dayStartHour`              | `number`                                | `0`           | First displayed wall hour; must satisfy `0 <= start < 24`.                                           |
| `dayEndHour`                | `number`                                | `24`          | Exclusive final wall hour; must exceed start and be at most 24.                                      |
| `interval`                  | `number`                                | `60`          | Positive-integer time-grid line/gutter interval in minutes.                                          |
| `slotDuration`              | `number`                                | `30`          | Positive-integer empty-slot click duration in minutes.                                               |
| `snapDuration`              | `number`                                | `15`          | Positive-integer move/resize/keyboard/range-selection granularity in minutes.                        |
| `defaultTimedItemDuration`  | `number`                                | `60`          | Positive-integer elapsed minutes used when an all-day item becomes timed without span preservation.  |
| `defaultAllDayItemDuration` | `number`                                | `1`           | Positive-integer consecutive civil days used for the inverse conversion without span preservation.   |
| `scrollToHour`              | `number`                                | `7`           | Initial wall-hour target inside the displayed interval.                                              |
| `agendaDayCount`            | `number`                                | `30`          | Positive-integer count of visible agenda days; hidden weekdays are skipped.                          |
| `nowIndicator`              | `boolean`                               | `true`        | Enables the current-time line.                                                                       |
| `nowIndicatorInterval`      | `number`                                | `30_000`      | Refresh cadence, paused while the page is hidden.                                                    |
| `offDays`                   | `boolean \| EventCalendarOffDaysConfig` | `false`       | Non-working-day appearance.                                                                          |
| `businessHours`             | `EventCalendarBusinessHours[]`          | `[]`          | Display and optional mutation constraint windows.                                                    |
| `scrollMode`                | `'contained' \| 'page'`                 | `'contained'` | `ScrollArea` internal scrolling versus document flow.                                                |
| `stickyHeader`              | `boolean`                               | `false`       | Sticky default header in page-scroll mode.                                                           |
| `showHeader`                | `boolean`                               | `true`        | Removes the default header while retaining imperative navigation.                                    |
| `showDatePicker`            | `boolean`                               | `false`       | Adds the `Popover` + `CalendarPrimitive` date jump to the default header.                            |
| `showItemTooltip`           | `boolean`                               | `false`       | Enables the accessible default item tooltip; a supplied `itemTooltip` snippet replaces its contents. |

Numeric configuration rejects `NaN`, infinities, fractional counts/durations where integers are required, and out-of-range combinations with a coded error. It never silently clamps a contract violation. `dayCount`, `agendaDayCount`, minute durations, and `nowIndicatorInterval` are positive integers; `maxItemsPerCell` is a non-negative integer; drag-create pixel/time values are finite and positive. Hour values are finite, must resolve to whole minutes, satisfy `0 <= dayStartHour < dayEndHour <= 24`, and keep `scrollToHour` inside that half-open display interval.

Business-hour strings are strict `HH:mm`; `24:00` is valid only as an end. Each entry is a same-day half-open interval with `start < end`, and multiple entries form a union. Overnight availability is represented by two explicit day entries rather than an ambiguous wrapped interval. Duplicate weekday/config entries are rejected instead of normalized silently.

`currentRange`, `renderRange`, `activeRange`, and `fetchRange` remain continuous half-open envelopes. `currentRange` is the semantic navigation period. `renderRange` expands a month to its complete configured week rows and otherwise equals `currentRange`. `activeRange` clips the interaction/item-rendering envelope to `validRange`; in month view its unclipped input is `renderRange` when outside days are shown and `currentRange` when they are suppressed, while every other view uses `currentRange`. `fetchRange` equals that clipped `activeRange`: overlap queries, rather than arbitrary time padding, retrieve items that continue into the visible surface. `visibleDays` is the authoritative ordered list when hidden weekdays create holes inside those envelopes. Week/month views remove hidden columns; `dayCount` and `agendaDayCount` count rendered days and advance over hidden weekdays rather than counting then hiding them.

If a day/day-count/resource anchor is hidden or falls outside a changed `validRange`, reconciliation chooses the next valid visible day, then the previous one if no next day exists, and reports one `onDateChange`. A configuration with no valid visible day throws instead of rendering an empty lie.

An `onRangeChange` consumer must return: non-recurring definitions whose current half-open ranges overlap `fetchRange`; recurring source definitions that can expand into it; exception definitions whose current range overlaps `fetchRange` **or** whose source-generated original occurrence range overlaps `fetchRange`; and the source definition referenced by every returned exception even when that source has no other generated origin in the range. The original range is reconstructed from `originalStart` plus the source duration/zone; testing origin-start membership alone would miss an exception moved away from a long occurrence that began before the range and leave a ghost continuation. These predicates also ensure an occurrence moved in from an outside origin renders and remains source-validatable. Filtering only by `item.start >= fetchRange.start` would incorrectly drop ordinary continuations as well.

Contained mode requires an explicit height through `class`, for example `class="h-[42rem]"`. It must not guess a viewport height.

### Interaction and mutation policy

| Prop                       | Type                                                                                                       | Default                                | Contract                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| `interactions`             | `Partial<EventCalendarInteractions>`                                                                       | features on; duration preservation off | Fine-grained move, resize, slot-create, keyboard, single-pointer, and conversion controls. |
| `createActivation`         | `Partial<EventCalendarCreateActivation>`                                                                   | documented constants                   | Distance and delayed-touch policy for empty-slot drag-create only.                         |
| `allowOverlap`             | `boolean \| EventCalendarOverlapPredicate<TItemFields>`                                                    | `true`                                 | Applied once per conflicting foreground occurrence before custom validation.               |
| `constrainToBusinessHours` | `boolean`                                                                                                  | `false`                                | Applies `businessHours` as a move/resize/selection constraint.                             |
| `canUpdateItem`            | `(proposal: EventCalendarProposedUpdate<TItemFields>) => boolean`                                          | allow                                  | Synchronous live validation for move/resize/API proposals.                                 |
| `onItemUpdate`             | `(proposal: EventCalendarProposedUpdate<TItemFields>) => EventCalendarUpdateResult`                        | accept                                 | One synchronous commit funnel; can reject or adjust schedule/resource fields.              |
| `canSelectSlot`            | `(slot: EventCalendarSlot) => boolean`                                                                     | allow                                  | Synchronous live validation of drag-created or keyboard-created ranges.                    |
| `recurrenceEditScope`      | `'occurrence' \| 'series' \| 'disabled'`                                                                   | `'occurrence'`                         | Defines recurring-item edits; series scope asserts every exception is bound.               |
| `getOccurrenceExceptionId` | `(seriesItem: EventCalendarItem<TItemFields>, occurrence: EventCalendarOccurrence<TItemFields>) => string` | origin-based                           | Called once for a new exception; empty or duplicate returned IDs throw.                    |
| `expandRecurrence`         | `EventCalendarRecurrenceExpander<TItemFields>`                                                             | built-in                               | Synchronous bounded escape hatch for recurrence outside the supported subset.              |

Validation order is fixed: structural representation/editability/valid range → business-hour constraint → overlap policy → `canUpdateItem`/`canSelectSlot`. For an item mutation, `onItemUpdate` then rejects, accepts, or adjusts the proposal. Any adjustment is normalized and run through the complete validation sequence again—without recursively calling `onItemUpdate`—before commit. A callback cannot adjust an item into an invalid range or overlap and bypass policy.

All-day/timed conversion has one deterministic duration contract. With `maintainDurationOnAllDayChange: false`, timed → all-day uses `defaultAllDayItemDuration` consecutive civil days and all-day → timed uses `defaultTimedItemDuration` elapsed minutes. With it enabled, timed → all-day preserves the count of civil dates touched by the exclusive source range (minimum one), using the referenced source’s `recurrenceTimeZone` when it is a timed recurring series and the calendar display zone for non-recurring items or items whose source is all-day. All-day → timed preserves that civil-day count by advancing from the proposed target wall time with zoned civil-day arithmetic in that same per-source zone rule. This is intentionally a logical-span guarantee, not a claim that arbitrary minutes can survive a date-only representation; a preserved span can therefore be 23 or 25 elapsed hours across DST.

### Callbacks

```ts
export type EventCalendarCallbackProps<TItemFields extends object = Record<never, never>> = {
	onRangeChange?: (info: EventCalendarRangeChangeInfo) => void;
	onItemsChange?: (payload: {
		items: EventCalendarItem<TItemFields>[];
		change: EventCalendarChange<TItemFields>;
	}) => void;
	onViewChange?: (view: EventCalendarView) => void;
	onDateChange?: (date: Date) => void;
	onDayCountChange?: (dayCount: number) => void;
	onSelectionChange?: (selection: EventCalendarSelection) => void;
	onItemClick?: (payload: { occurrence: EventCalendarOccurrence<TItemFields>; event: MouseEvent }) => void;
	onItemDoubleClick?: (payload: { occurrence: EventCalendarOccurrence<TItemFields>; event: MouseEvent }) => void;
	onSlotClick?: (payload: { slot: EventCalendarSlot; event: MouseEvent }) => void;
	onSlotSelect?: (payload: { slot: EventCalendarSlot; info: EventCalendarSlotSelectInfo }) => void;
	onMoreClick?: (payload: {
		day: EventCalendarDateOnly,
		occurrences: readonly EventCalendarOccurrence<TItemFields>[],
		event: MouseEvent
	) => false | void;
	onInteractionBlocked?: (info: EventCalendarInteractionBlockedInfo<TItemFields>) => void;
};
```

| Callback                               | Purpose                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `onItemsChange({ items, change })`     | Carries the current item collection and guarded mutation transaction; fires after one accepted reassignment.               |
| `onViewChange(view)`                   | Reports component-originated view changes.                                                                                  |
| `onDateChange(date)`                   | Reports component-originated anchor changes.                                                                                |
| `onDayCountChange(dayCount)`           | Reports N-day changes.                                                                                                      |
| `onSelectionChange(selection)`         | Reports event or slot selection changes.                                                                                    |
| `onItemClick({ occurrence, event })`   | Event-chip click before built-in selection; `event.preventDefault()` suppresses that selection.                             |
| `onItemDoubleClick({ occurrence, event })` | Event-chip double click.                                                                                                |
| `onSlotClick({ slot, event })`         | Empty point click before built-in slot selection; `event.preventDefault()` suppresses that selection.                       |
| `onSlotSelect({ slot, info })`         | Completed range; `info.source` identifies drag-create, keyboard, or single-pointer input.                                   |
| `onMoreClick({ day, occurrences, event })` | Month overflow trigger; returning `false` suppresses the built-in popover.                                             |
| `onInteractionBlocked(info)`           | Receives `EventCalendarInteractionBlockedInfo<TItemFields>` once per rejected attempted gesture.                            |

`EventCalendarProposedUpdate.source` is a discriminated value: `'drag'`, `'resize-start'`, `'resize-end'`, `'keyboard'`, `'single-pointer'`, or `'api'`.

The matching `onItemsChange`, `onViewChange`, `onDateChange`, `onDayCountChange`, and `onSelectionChange` callbacks report calendar/API-originated changes and do not echo the same external binding assignment. Explicit reconciliation may change a different bound state and reports that change once. `onRangeChange` is deliberately different: it reports every newly derived range, including ranges caused by external `date`, `view`, or settings changes.

Pure view/date reconciliation participates in SSR so server and browser derive the same rendered snapshot, but callbacks are not invoked as server-render side effects. After mount, the component publishes any reconciled binding once and emits the initial `onRangeChange`; subsequent client derivations follow the rules above. An SSR application that fetches initial items computes/passes that range at its own data-loading boundary rather than relying on a component callback during render.

Navigation and view changes preserve an absolute item/slot selection even when it is temporarily off-screen. A collection or recurrence change that removes the selected item/occurrence clears it and fires `onSelectionChange` once; focus falls back to the nearest visible day without inventing a replacement selection.

## Mutation transaction

```ts
type EventCalendarChangeBase<TItemFields extends object> = {
	source: EventCalendarMutationSource;
	revert: () => void;
};

export type EventCalendarChange<TItemFields extends object = Record<never, never>> =
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'add';
			item: EventCalendarItem<TItemFields>;
	  })
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'remove';
			previousItems: EventCalendarItem<TItemFields>[];
	  })
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'update' | 'move' | 'resize';
			item: EventCalendarItem<TItemFields>;
			previousItem: EventCalendarItem<TItemFields>;
	  })
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'recurrence-series-update';
			operation: 'move' | 'resize-start' | 'resize-end' | 'convert';
			seriesItem: EventCalendarItem<TItemFields>;
			previousSeriesItem: EventCalendarItem<TItemFields>;
			exceptionItems: EventCalendarItem<TItemFields>[];
			previousExceptionItems: EventCalendarItem<TItemFields>[];
	  })
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'recurrence-exception-add';
			seriesItem: EventCalendarItem<TItemFields>;
			item: EventCalendarItem<TItemFields>;
	  })
	| (EventCalendarChangeBase<TItemFields> & {
			kind: 'recurrence-exception-update';
			seriesItem: EventCalendarItem<TItemFields>;
			item: EventCalendarItem<TItemFields>;
			previousItem: EventCalendarItem<TItemFields>;
	  });

type EventCalendarResourceAdjustment = { resourceId?: string | null };

export type EventCalendarUpdateAdjustment = EventCalendarResourceAdjustment &
	(
		| { allDay?: never; start?: Date; end?: Date }
		| { allDay: false; start: Date; end: Date }
		| {
				allDay?: never;
				start?: EventCalendarDateOnly;
				end?: EventCalendarDateOnly;
		  }
		| {
				allDay: true;
				start: EventCalendarDateOnly;
				end: EventCalendarDateOnly;
		  }
	);

export type EventCalendarUpdateResult = false | true | void | EventCalendarUpdateAdjustment;
```

The component previews a proposal, validates it, lets `onItemUpdate` reject or adjust it, performs one immutable `items` reassignment, then invokes `onItemsChange`. A thrown validator or update callback error propagates before commit. `revert()` captures both the previous array and the exact committed array reference; it restores the former only if the current binding still strictly equals the latter, then marks itself consumed. Any compliant consumer update publishes a never-before-used array reference and therefore makes the transaction stale; assigning `A → B → A` is explicitly invalid consumer input, not an ABA case the component pretends it can detect. A stale or repeated revert throws explicitly instead of erasing later work, and a successful revert does not recursively fire another mutation transaction.

In an adjustment, `resourceId: null` explicitly clears the assignment; committed items retain the simpler optional-string field and never store `null`.

For `recurrenceEditScope="occurrence"`, the engine creates or updates an exception item carrying `recurringItemId` and the immutable `originalStart`, while the recurrence index suppresses the original occurrence. A first edit emits `recurrence-exception-add` with the untouched `seriesItem`; a later edit emits `recurrence-exception-update` with the series, previous exception, and replacement, so persistence can distinguish insert from update. The engine spreads the source generic fields first, then explicitly replaces every calendar-owned identity, timing, all-day, resource, recurrence, and exception field; an exception never inherits the series ID or recurrence rule accidentally. Converting only that occurrence changes its current placement branch but retains the source-shaped `originalStart`, so its occurrence key is unchanged.

Series mode constructs one finite immutable batch containing the source and every bound exception. Choosing `recurrenceEditScope="series"` is an explicit assertion that `items` contains the complete exception set for any editable series; a range-windowed consumer that cannot satisfy that contract must keep occurrence or disabled scope rather than let the component claim a partial series update. Structural, source-link, origin, uniqueness, and range-shape validation covers that whole definition batch. Valid-range, business-hour, overlap, and built-in interaction policies cover the interacted proposal plus transformed occurrences that intersect the current `fetchRange`; the component does not claim to validate an infinite or unloaded future. `canUpdateItem`/`onItemUpdate` run once with the transformed source as `item` and the concrete interacted occurrence attached, leaving truly global scheduling policy at the consumer boundary. If `onItemUpdate` adjusts that source proposal, the engine regenerates the entire exception batch from the prior definitions and adjusted transform before the mandatory second validation pass; it never commits a source-only adjustment beside stale exceptions.

A series move derives one explicit transform from the interacted occurrence: all-day definitions move by civil-day delta, while timed definitions move by recurrence-zone wall delta resolved back to instants. For a structured rule it shifts both placement endpoints, the source anchor, applicable `until`/`exDates`/`rDates`, every exception origin, and bound exception placements while retaining their exceptional offsets. Series `resize-start` shifts only current starts plus the same anchor/origin metadata, leaving current ends fixed; `resize-end` shifts only current ends and changes no canonical origin. A move or start resize that crosses a civil date is supported only when the structured rule has no `byWeekday`, `byMonthDay`, or `byMonth` selector; otherwise it throws `unsupported-recurrence` rather than pretending a DTSTART shift rewrote the pattern. Time-only structured transforms leave those selectors intact. Raw-RRULE series move/start-resize/representation-conversion reject because embedded bounds/selectors cannot be rewritten losslessly; raw series end-resize remains valid because it changes duration only. Arbitrary rule-shape edits use a consumer-supplied full `updateItem`, not an inferred drag mutation.

For a series-wide all-day/timed conversion, the source and exception placements that still match the source’s old kind convert through the shared duration contract: the transform derives target start and the contract derives target end, never independent endpoint mapping. An exception already in the target kind preserves its edited kind and duration and receives only the common move component. Every exception origin still converts with the source. A structured all-day → timed conversion uses the proposed target wall time and current display zone as the new explicit recurrence zone, then converts `until`, `exDates`, `rDates`, and immutable origins to instants in that zone; timed → all-day extracts civil dates for that metadata in the old series recurrence zone. A conversion that would collapse two canonical origins, invert a range, or create duplicate exception origins is rejected. Raw-RRULE representation conversion throws `unsupported-recurrence` and requires a coherent consumer replacement. Every series move, start-resize, or representation conversion that changes canonical origins deterministically rekeys generated occurrences and remaps selection/focus in the same transaction; end-resize remains key-stable, and persisted exception item IDs always stay stable. The change emits `recurrence-series-update` with before/after series and exception arrays. Disabled mode blocks the mutation explicitly.

## Snippet composition contract

All ordinary content is rendered through `Slot`. Payloads include owned ready-made snippets when consumers need to wrap or rearrange default behavior.

Content-prop names avoid state-prop collisions and follow the existing `DataTable` precedent: `loadingContent` customizes the `loading` state, and `nowIndicatorContent` customizes the `nowIndicator` feature.

The props file exports every payload and the exact generic mapping below; payload objects are readonly snapshots, and every `defaultContent`/ready-made control is a Svelte `Snippet`:

```ts
import type { Snippet } from 'svelte';

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
	header?: Snippet<[EventCalendarHeaderPayload<TItemFields, TResourceFields>]>;
	actions?: Snippet<[EventCalendarSnapshot<TItemFields, TResourceFields>]>;
	item?: Snippet<[EventCalendarItemPayload<TItemFields>]>;
	itemTooltip?: Snippet<[EventCalendarItemTooltipPayload<TItemFields>]>;
	monthCell?: Snippet<[EventCalendarMonthCellPayload<TItemFields>]>;
	dayHeader?: Snippet<[EventCalendarDayHeaderPayload]>;
	timeGutter?: Snippet<[EventCalendarTimeGutterPayload]>;
	allDay?: Snippet<[EventCalendarAllDayPayload<TItemFields>]>;
	overflow?: Snippet<[EventCalendarOverflowPayload<TItemFields>]>;
	overflowContent?: Snippet<[EventCalendarOverflowContentPayload<TItemFields>]>;
	agendaDetails?: Snippet<[EventCalendarAgendaDetailsPayload<TItemFields>]>;
	resourceHeader?: Snippet<[EventCalendarResourceHeaderPayload<TResourceFields>]>;
	nowIndicatorContent?: Snippet<[EventCalendarNowIndicatorPayload]>;
	dragPreview?: Snippet<[EventCalendarDragPreviewPayload<TItemFields>]>;
	empty?: Snippet<[EventCalendarEmptyPayload]>;
	loadingContent?: Snippet<[EventCalendarLoadingPayload]>;
};
```

| Snippet               | Payload and ownership                                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`              | Snapshot plus ready-made `previous`, `today`, `next`, `title`, `viewSwitcher`, `datePicker`, and `actions` snippets. Replaces header contents, not the themed semantic wrapper.                |
| `actions`             | Snapshot and API; appended to the default header.                                                                                                                                              |
| `item`                | Occurrence, segment, active view, selected/dragging state, and ready-made `defaultContent`, `markerContent`, `titleContent`, and `timeContent`. It renders inside the owned activation button. |
| `itemTooltip`         | Occurrence, segment, view, default accessible label, and `defaultContent`.                                                                                                                     |
| `monthCell`           | Day, day segments, today/outside/off state, overflow count, and `defaultContent`.                                                                                                              |
| `dayHeader`           | Day, active view, today state, and default label/content.                                                                                                                                      |
| `timeGutter`          | Instant, localized default label, and `defaultContent`.                                                                                                                                        |
| `allDay`              | Visible days, all-day segments, and `defaultContent`.                                                                                                                                          |
| `overflow`            | Day, hidden occurrences, count, and default `+N more` content.                                                                                                                                 |
| `overflowContent`     | Day, hidden occurrences, a `close` function, and the default interactive hidden-item list as `defaultContent`.                                                                                 |
| `agendaDetails`       | Occurrence; rendering content enables the row’s disclosure behavior.                                                                                                                           |
| `resourceHeader`      | Typed resource or `null` for the localized Unassigned column, `isUnassigned`, hierarchy depth, and default content.                                                                            |
| `nowIndicatorContent` | Current display-zone time and default content.                                                                                                                                                 |
| `dragPreview`         | Active proposal, validity, and default preview.                                                                                                                                                |
| `empty`               | Active view, visible range, mode, and `defaultContent`; grid surfaces remain mounted.                                                                                                          |
| `loadingContent`      | Active view, visible range, and `defaultContent`.                                                                                                                                              |

`actions` and `agendaDetails` are additive regions and therefore do not expose artificial default renderers. `dayHeader` and `monthCell` remain focused content seams; there is no whole-day or whole-view replacement that could bypass calendar-owned layout and semantics.

`EventCalendarItem.svelte` owns a non-interactive segment container with a primary activation button plus sibling resize handles and a sibling action-menu trigger. Drag registration targets the container or explicit handle, `Tooltip` targets the primary button, and snippet content never nests one interactive control inside another.

No internal `EventCalendarMonthView`, `EventCalendarItem`, or navigation child is exported from `index.ts`.

## Imperative handle

`bind:this` exposes a typed handle following the existing `VideoPlayer`/`AudioPlayer` pattern:

```ts
export type EventCalendarApi<TItemFields extends object = Record<never, never>> = {
	next(): void;
	previous(): void;
	today(): void;
	goTo(date: Date | EventCalendarDateOnly): void;
	setView(view: EventCalendarView, options?: { dayCount?: number }): void;
	scrollToTime(dateOrMinutes: Date | number): boolean;
	getVisibleRange(): EventCalendarRange;
	getActiveRange(): EventCalendarRange;
	getVisibleDays(): readonly EventCalendarDateOnly[];
	getOccurrence(key: string): EventCalendarOccurrence<TItemFields> | null;
	getOccurrences(range?: EventCalendarRange): readonly EventCalendarOccurrence<TItemFields>[];
	getOccurrencesForDay(day: EventCalendarDateOnly): readonly EventCalendarOccurrence<TItemFields>[];
	addItem(item: EventCalendarItem<TItemFields>): void;
	updateItem(item: EventCalendarItem<TItemFields>): void;
	updateOccurrence(
		key: string,
		adjustment: EventCalendarUpdateAdjustment,
		options?: { scope?: 'occurrence' | 'series' }
	): void;
	removeItem(id: string): void;
	select(selection: EventCalendarSelection): void;
	clearSelection(): void;
	cancelInteraction(): void;
};
```

`getVisibleRange` returns `renderRange`; `getActiveRange` returns its valid-range-clipped interaction envelope; `getVisibleDays` preserves hidden-day holes explicitly. `setView` rejects disabled views, and its `dayCount` option is valid only with `view="days"`. `scrollToTime` returns `false` outside time-grid/resource views and `true` when it scrolls. `updateItem` replaces one full definition or persisted exception by its own ID; it never guesses which recurrence occurrence a patch means. `updateOccurrence` is the occurrence-keyed path and uses the same scope/validation pipeline as drag and keyboard edits. Removing a recurring series also removes its persisted exceptions in one `remove` transaction whose `previousItems` lists every removed definition. Unknown item IDs or occurrence keys throw a coded `EventCalendarError`; mutation methods never pretend a missing target was updated.

The handle delegates to the existing state owner; it does not create a second source of truth.

## Theme contract

Public exports:

```ts
export const eventCalendarTheme = {/* CVA parts */};
export type EventCalendarTheme = typeof eventCalendarTheme;
export type EventCalendarThemeProps = InferComponentTheme<EventCalendarTheme>;
export const setEventCalendarTheme = setComponentTheme<EventCalendarTheme>('eventCalendar');
export const useEventCalendarTheme = useComponentTheme('eventCalendar', eventCalendarTheme);
```

Stable parts are grouped by real visual responsibility:

- Chrome: `root`, `header`, `navigation`, `title`, `viewSwitcher`, `actions`, `content`, `viewport`, `loading`, `empty`.
- Month: `month`, `monthHeader`, `dayHeader`, `monthGrid`, `weekRow`, `weekNumber`, `monthCell`, `dayNumber`, `barLayer`.
- Time grid: `timeGrid`, `timeHeader`, `timeGutter`, `timeLabel`, `allDayRow`, `allDayCell`, `dayColumn`, `timeSlot`, `nowIndicator`.
- Items and interaction: `item`, `itemControl`, `itemContent`, `itemTitle`, `itemTime`, `overflow`, `overflowPopover`, `dragPreview`, `dropIndicator`, `slotSelection`, `resizeHandle`, `actionTrigger`.
- Agenda and resources: `agenda`, `agendaDay`, `agendaItem`, `agendaDetails`, `resourceHeader`.

Theme variants include `density`, `color`, `view`, selected/dragging/invalid/disabled states, today/outside/off-day states, item display type, and segment start/end/continuation states. The internal `color` variant resolves per-item semantic colors through the Svelai color map; items without a color use `neutral`, while calendar chrome uses the primary theme context. Arbitrary CSS item colors flow through `--event-calendar-item-color` without inventing Tailwind class names.

Metric CSS variables keep layout tunable without turning every measurement into a prop:

- `--event-calendar-slot-height`
- `--event-calendar-time-gutter-width`
- `--event-calendar-day-min-width`
- `--event-calendar-resource-min-width`
- `--event-calendar-item-min-height`
- `--event-calendar-sticky-offset`
- `--event-calendar-item-color`

The public theme remains one object. If the implementation crosses the repository’s cohesion threshold, internal per-view theme fragments may be composed into `eventCalendarTheme`; consumers still see one theme contract.

## Existing components and utilities to reuse

| Existing owner           | EventCalendar use                                                                                                              |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `Button` / `ButtonGroup` | Today and previous/next navigation.                                                                                            |
| `SegmentedControl`       | Wide-container view switcher with existing radiogroup and roving-focus behavior.                                               |
| `PopupMenu`              | Narrow-container view switcher and the non-drag item action menu.                                                              |
| `Popover`                | Date jump and month overflow.                                                                                                  |
| `CalendarPrimitive`      | Date-jump popover through the explicit civil-date adapter and compatible prop extension below; scheduling state is not reused. |
| `ScrollArea`             | Contained time-grid, agenda, and resource scrolling.                                                                           |
| `Tooltip`                | Labelled icon controls and optional item content.                                                                              |
| `Empty` / `Spinner`      | Agenda replacement empty state and the blocking loading overlay; grid emptiness keeps the active surface mounted.              |
| `Slot`                   | Every public content region and ready-made default-content composition.                                                        |
| Icons                    | Calendar, carets, clock, list, grid, plus, resize, and overflow affordances.                                                   |
| `useResizeObserver`      | `maxItemsPerCell="auto"`, overflow recalculation, and responsive header behavior.                                              |
| `createPointerDrag`      | Drag-created slot ranges after a backwards-compatible delayed-touch activation extension.                                      |
| Pragmatic Drag and Drop  | Item move and start/end resize, central monitoring, drop targets, previews, and auto-scroll.                                   |

`useNavigation` is intentionally not used for calendar grids: it owns one-dimensional ±1 navigation, while a calendar needs row strides, row Home/End, Page navigation, hidden-day awareness, and restoration by civil-day/occurrence key. `eventCalendar.a11y.svelte.ts` owns that behavior. `useDndList` likewise remains unchanged; its list insertion semantics are not generalized into a misleading calendar abstraction.

## Internal module shape

The exact split is earned by independent responsibilities, not line-count theater:

```text
src/lib/components/EventCalendar/
├── EventCalendar.svelte
├── EventCalendarHeader.svelte
├── EventCalendarContent.svelte
├── EventCalendarItem.svelte
├── EventCalendarMonthView.svelte
├── EventCalendarTimeGrid.svelte
├── EventCalendarAgendaView.svelte
├── EventCalendarResourceView.svelte
├── eventCalendar.error.ts
├── eventCalendar.types.ts
├── eventCalendar.props.ts
├── eventCalendar.state.svelte.ts
├── eventCalendar.date.ts
├── eventCalendar.recurrence.ts
├── eventCalendar.items.ts
├── eventCalendar.layout.ts
├── eventCalendar.interactions.svelte.ts
├── eventCalendar.a11y.svelte.ts
├── eventCalendar.theme.ts
├── eventCalendar.mcp.ts
└── index.ts
```

- `EventCalendar.svelte` is the composition root: props, state construction, header/content composition, attachments, and public methods.
- `eventCalendar.state.svelte.ts` is the single coordinator for bindable state and APIs. It delegates date, recurrence, index, layout, and interaction rules to their owners.
- `eventCalendar.date.ts` owns display-zone conversion, civil-date arithmetic, date profiles, navigation increments, day keys, and formatter caching.
- `eventCalendar.recurrence.ts` owns structured/RRULE parsing and bounded occurrence expansion.
- `eventCalendar.items.ts` owns normalization, occurrence exceptions, segmentation, and the per-range occurrence index.
- `eventCalendar.layout.ts` owns deterministic month/all-day lane packing and timed interval-column packing.
- `eventCalendar.interactions.svelte.ts` owns gesture state, hit testing, validation, previews, commit/cancel, and auto-scroll coordination.
- `eventCalendar.a11y.svelte.ts` owns roving focus, keyboard interaction mode, focus restoration, and live announcements.
- View components only render their view-specific state and forward user intent. They do not reimplement date or mutation rules.

No file named `utils.ts`, `helpers.ts`, `manager.ts`, or generic public plugin interface is introduced.

## Date, time-zone, recurrence, and layout strategy

Add `@date-fns/tz` as the only new date runtime dependency. Use `TZDateMini` internally for IANA-zone getters/setters and native `Intl.DateTimeFormat` for formatting. Public instants remain native `Date`; floating all-day values remain canonical date-only strings. This avoids a broad `date-fns` dependency without conflating instants and civil dates. [`@date-fns/tz`](https://github.com/date-fns/tz).

Time-grid slots enumerate real instants between zoned day boundaries: a spring-forward wall slot does not exist, while a repeated fall-back wall label appears twice and includes its offset in accessible text. Pointer targets therefore already identify an unambiguous instant. Recurrence wall-time construction follows RFC 5545’s corrected DATE-TIME rule: an ambiguous wall time uses its first occurrence, a nonexistent wall time is interpreted with the offset before the gap, and an invalid calendar date is omitted. Phase 0 verifies that the installed `TZDateMini` behavior matches this contract or adds an explicit resolver rather than inheriting undocumented normalization. [RFC 5545 §3.3.5](https://www.rfc-editor.org/rfc/rfc5545.html#section-3.3.5), [verified erratum 4271](https://www.rfc-editor.org/errata/eid4271).

The date layer produces an `EventCalendarDateProfile` with:

- `currentRange`: semantic month/week/day/N-day/agenda period.
- `renderRange`: the configured complete month rows, including padded cells, or `currentRange` for every other view.
- `activeRange`: the item/interaction envelope—month `renderRange` when outside days are shown, otherwise `currentRange`—clipped by `validRange`; it does not pretend to encode hidden-day holes.
- `fetchRange`: exactly `activeRange`, reported to `onRangeChange`; consumers query overlapping definitions, exceptions whose current or reconstructed source-occurrence ranges overlap, and every returned exception’s source rather than relying on hidden prefetch padding.
- `visibleDays`: ordered civil-day keys actually rendered after hidden-weekday policy; this represents holes that a range cannot.
- `title` and `navigationIncrement`.

The event pipeline is definition → occurrence → segment:

1. Validate and normalize item definitions without changing consumer objects.
2. Expand recurrence only for the render/fetch range and apply occurrence exceptions.
3. Split occurrences at display-zone day boundaries into segments with `isStart`, `isEnd`, `continuesBefore`, and `continuesAfter` flags.
4. Bucket segments by stable civil-day key.
5. Pack month/all-day bars greedily by week row.
6. Pack timed intervals by sorted start/end using active columns, then allow safe column expansion. Avoid pairwise scans.

The built-in RRULE subset follows the reference surface: `FREQ`, `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` including ordinals, `BYMONTHDAY`, `BYMONTH`, and `WKST`, plus exclusion/additional dates. Timed rules iterate wall time in their required `recurrenceTimeZone`; all-day rules iterate date-only values. A default cap of 1,000 occurrences per item prevents unbounded work. ReUI uses the same safety boundary; FullCalendar likewise separates simple recurrence from richer adapters. [ReUI recurrence API](https://reui.io/docs/components/base/event-calendar), [FullCalendar recurrence](https://fullcalendar.io/docs/recurring-events).

## Phase-by-phase implementation

Each phase is a coherent review boundary containing one or more atomic Conventional Commits. Do not bundle unrelated checklist items merely because they share a phase, and do not begin the next phase until its exit gate is clean or its unrelated baseline failures are recorded.

### Phase 0 — Freeze the contract and baseline

**Outcome:** no production behavior is built against an ambiguous API.

- [ ] Review this plan and freeze included views, generic field model, immutable/never-reused collection contract, instant-versus-date-only representation, required `date`/`timeZone`, visible-day semantics, mutation/exception transactions, recurrence edit scope, exact callback/snippet/API payloads, and the non-goals.
- [ ] Capture the existing outputs of `pnpm check`, `pnpm lint`, and `pnpm prepack` so later work distinguishes new failures from dirty-worktree failures.
- [ ] Confirm installed Svelte, Tailwind, Pragmatic Drag and Drop, and auto-scroll signatures against `node_modules` before importing them.
- [ ] Compile a temporary consumer of the proposed two-generic Svelte component shape to prove installed Svelte preserves custom item/resource fields and the timed/all-day union without casts; include negative checks for direct, union-branch, and broad string-index owned-key collisions, then delete the probe after the contract check.
- [ ] Add `@date-fns/tz` only; verify ESM, SSR import safety, packaged type resolution, and the frozen gap/repeat disambiguation against the installed version before writing the date engine.

**Exit gate:** approved public contract, dependency resolves in SSR and browser builds, baseline failures documented.

### Phase 1 — Domain types, date environment, and state core

**Outcome:** navigation and state are correct before any complex view exists.

- [ ] Add `eventCalendar.error.ts` with one exported error class and stable codes for invalid input, unsupported recurrence, expansion limits, and stale transactions.
- [ ] Add `eventCalendar.types.ts` with generic consumer fields, items, occurrences, segments, flat resources, ranges, recurrence, selection, proposals, transactions, interaction settings, and API types.
- [ ] Add `eventCalendar.props.ts` with `TItemFields`/`TResourceFields` generics, snippet payloads, `WithAttachments`, root HTML attributes, JSDoc, `class`, `ref`, `density`, and `theme`.
- [ ] Add `eventCalendar.date.ts` with time-zone/date-only validation, civil day keys, zoned start/end-of-day, explicit gap/repeat resolution, DST-aware instant slot enumeration, range intersection, visible-day generation, snapping, week-number calculation, cached `Intl` formatters, and date profiles for every view.
- [ ] Add `eventCalendar.state.svelte.ts` with bindable `items`, `view`, `date`, `dayCount`, and `selection`; derived date profile; navigation methods; deterministic enabled-view reconciliation; and range-change notification.
- [ ] Enforce duplicate ID, invalid instant/date-only/range/zone/hour/view, empty or duplicate `views`, an empty enabled-view set, an empty visible-day set, and malformed recurrence-versus-exception field errors at the state boundary.
- [ ] Derive `currentRange`, `renderRange`, `activeRange`, `fetchRange`, and `visibleDays` by the frozen rules above; prove month outside-day, `validRange`, agenda, hidden-day, and resource profiles report the exact query envelope.
- [ ] Keep DOM/layout access out of the date and state core so SSR construction is safe.
- [ ] Render the required `date` + `timeZone` profile during SSR, but initialize clock-dependent “today” state and the now indicator only after mount so server and browser clocks cannot create hydration differences.

**Exit gate:** a temporary minimal root can navigate every date profile across month/year/DST boundaries with correct half-open ranges and no DOM dependency.

### Phase 2 — Shell, default header, snippets, theme, and i18n

**Outcome:** a recognizably Svelai calendar shell with working navigation and composition.

- [ ] Add `EventCalendar.svelte`, `EventCalendarHeader.svelte`, and `EventCalendarContent.svelte`.
- [ ] Reuse `Button`/`ButtonGroup` for Today and previous/next, `SegmentedControl` for wide view selection, `PopupMenu` for narrow view selection, and `Popover` + `CalendarPrimitive` for optional date jump.
- [ ] Extend `CalendarPrimitive`/`CalendarInput` compatibly with their own `weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6` and `today?: Date`; an explicit numeric start wins, while `weekStartsOnMonday` remains the fallback for existing consumers. Do not import the higher-level EventCalendar type or fork a second date-picker grid.
- [ ] Add a private date-jump adapter that maps canonical date-only keys to the primitive’s existing host-local noon `Date`, maps selections back without `Date.parse`, converts half-open `validRange` to the first/last intersecting inclusive picker days, maps hidden weekdays to disabled dates, and supplies display-zone “today.”
- [ ] Re-run the existing CalendarPrimitive/Input demos for legacy Sunday/Monday behavior, min/max bounds, keyboard navigation, and today state before relying on the extension.
- [ ] Implement `showHeader`, `showDatePicker`, `header`, and `actions` composition with ready-made snippets; do not export header/content children.
- [ ] Add `eventCalendar.theme.ts` with the stable public parts, density/color/state variants, data attributes, and metric variables.
- [ ] Add required calendar labels and parameterized announcements to `en.ts`, then update every shipped locale with the exact `Messages` shape.
- [ ] Resolve locale from `locale ?? useI18n(i18n).locale`; resolve direction from explicit prop then ambient computed style after mount.
- [ ] Add the consumer-controlled loading overlay and the shared empty-status contract. `Empty` is reserved for agenda replacement; grid views keep their creation surfaces mounted.
- [ ] Expose the imperative navigation/range API through `bind:this`.

**Exit gate:** header navigation, view selection, date jump, theme setter/local override, locale switching, RTL mirroring, loading, empty state, and custom header/actions snippets work in SSR and hydration.

### Phase 3 — Recurrence, occurrence indexing, segmentation, and packing

**Outcome:** every view reads one deterministic occurrence model, including recurrence, instead of filtering, expanding, and laying out independently.

- [ ] Add `eventCalendar.recurrence.ts` with structured rule validation, supported RRULE parsing, per-series recurrence-zone wall-time iteration, floating all-day iteration, exclusions, additions, custom `expandRecurrence`, and a 1,000-occurrence safety cap.
- [ ] Add `eventCalendar.items.ts` for item validation, source-linked exception-origin validation, occurrence identity, exception suppression, day segmentation, and `Map<dayKey, bucket>` indexing.
- [ ] Add `eventCalendar.layout.ts` for month/all-day greedy lanes and time-grid overlap columns/spans.
- [ ] Key non-recurring occurrences by item ID and recurring occurrences/exceptions by a collision-safe series-ID/original-start tuple; derive separate segment keys without using a moved start as identity or an unescaped delimiter.
- [ ] Index persisted exceptions by current overlap and reconstructed source-occurrence overlap—not origin-start membership—so moved long continuations are suppressed and inward moves still render.
- [ ] Define one deterministic order: earlier start, then longer duration, then priority, then occurrence key.
- [ ] Preserve zero-duration timed items with a visual minimum while keeping their true range unchanged.
- [ ] Separate background items from foreground items without maintaining two source collections.
- [ ] Cache expansion/index results by immutable collection identity, date-profile key, display/recurrence zones, and relevant settings; document the controlled-collection replacement contract rather than pretending in-place `Date` mutation is observable.
- [ ] Keep cached schedule/layout data separate from the current generic item reference so an immutable replacement that changes only consumer fields updates snippet payloads without serving a stale object or forcing recurrence/layout recomputation.
- [ ] Ensure hidden weekends and outside-day policy affect rendering, not source item semantics.

**Exit gate:** the active date profile produces stable occurrences and segments for timed, all-day, multi-day, recurring, excluded, exceptional, overlapping, adjacent, outside-range, and zero-duration inputs without O(days × items) cell filtering.

### Phase 4 — Month view

**Outcome:** a complete month surface before timed-grid complexity is introduced.

- [ ] Add `EventCalendarMonthView.svelte` with `role="grid"`, weekday headers, week rows, day cells, outside/today/off/disabled states, optional week numbers, and fixed/natural week counts.
- [ ] Introduce `eventCalendar.a11y.svelte.ts` with the grid focus registry, row/column navigation, Home/End/Page behavior, date-key restoration, and a stable live-region host; later phases extend this owner rather than replace it.
- [ ] Add the private `EventCalendarItem.svelte` semantic wrapper shared by foreground segments: non-interactive container, primary activation button, sibling resize handles, and sibling action trigger. Snippets own only non-interactive button content.
- [ ] Render single-day chips and continuous multi-day/all-day bars from the shared index and lane packer.
- [ ] Implement `maxItemsPerCell` number and `'auto'` using `useResizeObserver`, with stable `+N more` calculation.
- [ ] Reuse `Popover` for overflow; support `overflow`, `overflowContent`, and cancellable `onMoreClick`.
- [ ] Add `monthCell`, `dayHeader`, and `item` snippet payloads with default content.
- [ ] Reuse `Tooltip` when `showItemTooltip` is enabled and support custom `itemTooltip` content without nesting an interactive wrapper inside another interactive element.
- [ ] Implement day/item click, double-click, selection, and focus restoration after month navigation.
- [ ] Render empty-grid status as a sibling/non-blocking region while retaining every day cell and drop target.
- [ ] Add month drop-target metadata, but defer mutation behavior to the interaction phase.

**Exit gate:** dense and sparse months, multi-week bars, hidden weekends, outside days, week numbers, auto overflow, custom snippets, RTL, and keyboard day navigation render correctly at narrow and wide container widths.

### Phase 5 — Shared time grid: week, day, and N-day views

**Outcome:** one engine renders every timed view without clone-army wrappers.

- [ ] Add `EventCalendarTimeGrid.svelte`; pass `view="week" | "day" | "days"` internally rather than create three independent engines.
- [ ] Extend the Phase 4 focus registry for day headers, all-day cells, timed slots, and item activation without delegating two-dimensional traversal to `useNavigation`.
- [ ] Render day headers, time gutter, grid lines, all-day row, day columns, background/business-hour layers, timed items, overlap packing, and the now indicator.
- [ ] Calculate each civil day’s true minute count so 23-hour and 25-hour DST days position items correctly.
- [ ] Implement `dayStartHour`, `dayEndHour`, `interval`, `slotDuration`, `snapDuration`, and `scrollToHour` validation and rendering.
- [ ] Reuse `ScrollArea` in contained mode and native/document scrolling when configured; synchronize the header/all-day row with the timed body horizontally.
- [ ] Implement compact event content based on actual available height without changing the source item.
- [ ] Preserve time/all-day slot hit areas and selection when the occurrence list is empty; never replace the time grid with `Empty`.
- [ ] Add `timeGutter`, `allDay`, `dayHeader`, `nowIndicatorContent`, and `item` composition points.
- [ ] Expose `scrollToTime` through the public handle.

**Exit gate:** week/day/N-day layouts place, clip, pack, scroll, and label all-day, multi-day, overlapping, short, cross-midnight, and DST-transition items correctly.

### Phase 6 — Agenda view and shared content states

**Outcome:** a non-grid view of the same occurrences with no duplicate event rules.

- [ ] Add `EventCalendarAgendaView.svelte` grouped chronologically by display-zone day for `agendaDayCount` days.
- [ ] Add sticky date gutters in page/contained modes, collapsible day groups, summary colors/counts, and optional details disclosure.
- [ ] Reuse the same occurrence formatting, item click/selection, color, and loading rules; agenda alone may replace its list with the existing `Empty` component.
- [ ] Reuse the shared `item` snippet with `view: 'agenda'` and add `agendaDetails`; the component retains button/disclosure semantics.
- [ ] Confirm agenda navigation steps by its configured window and reports the correct fetch range.

**Exit gate:** agenda output stays consistent with grid views for recurrence, all-day ranges, time zones, selection, colors, and empty/loading states.

### Phase 7 — Move, resize, select, touch, validation, and transactions

**Outcome:** all pointer mutations use one reversible and policy-aware engine.

- [ ] Add `eventCalendar.interactions.svelte.ts` with one discriminated gesture state for move, resize-start, resize-end, and slot-create.
- [ ] Register item move and resize handles with Pragmatic Drag and Drop; register view surfaces as metadata-bearing drop targets; use one monitor filtered by a stable calendar-instance ID so sibling calendars cannot observe or accept one another’s gestures.
- [ ] Derive proposed day/time/resource from pointer coordinates and the active view adapter; preserve the original pointer grab offset.
- [ ] Reuse Pragmatic’s installed standard auto-scroll for move/resize in contained and page modes, targeting the actual `ScrollArea` viewport or document scroller; do not expose unsupported edge/speed tuning.
- [ ] Add controller-owned rAF edge scrolling for drag-created ranges in contained and page modes, using internal edge constants without turning `createPointerDrag` into a calendar-specific abstraction.
- [ ] Extend `createPointerDrag` backwards-compatibly for delayed touch activation and cancellation, preserving existing defaults for current consumers; use it for drag-created slot ranges.
- [ ] Apply `createActivation` distance, touch long-press, and tolerance only to drag-create. Pragmatic owns item move/resize activation; the calendar handles its monitor cancellation, reduced-motion preview, and click-after-drop suppression without calling nonexistent adapter options.
- [ ] Cancel and tear down the active proposal when its owning collection, date profile, loading/disabled state, constraint/policy inputs, resource model, or component instance becomes stale.
- [ ] Implement snapping, duration preservation, all-day/timed conversion, start/end minimums, valid-range checks, business-hour constraints, overlap rules, live `can*` validation, and invalid feedback.
- [ ] Normalize and re-run the complete structural/range/business/overlap/custom validation sequence after an `onItemUpdate` adjustment; never treat the callback as authority to bypass constraints.
- [ ] Route every accepted move/resize item mutation through `onItemUpdate`, one immutable reassignment, `onItemsChange`, and a captured `revert()` transaction; slot selection ends at `onSlotSelect` and never fabricates an item.
- [ ] Keep event-index recomputation out of pointer-move frames; previews derive from the proposal and commit once on drop.
- [ ] Add themed drag preview, drop indicator, invalid state, slot draft, resize handles, and interaction status data consumed by the accessibility phase.

**Exit gate:** move, both-edge resize, all-day/timed transfer, month/time-grid transfer, slot creation, cancellation, rejection, adjustment, auto-scroll, touch, RTL, and revert all produce identical proposal/commit semantics.

### Phase 8 — Recurrence editing, named-zone, and locale hardening

**Outcome:** recurring and zoned schedules are correct rather than cosmetically formatted.

- [ ] Implement occurrence/series/disabled mutation scopes using the Phase 3 exception model. Occurrence conversion changes placement while retaining the source-shaped origin and key. Structured series conversion transforms source/rule/exception origins atomically, rekeys generated occurrences, remaps focus/selection, and records the current display zone when all-day becomes timed; raw-RRULE series conversion rejects explicitly.
- [ ] Revalidate structured and raw recurrence across mutations; an exception’s own `id` must differ from the source, `recurringItemId` must reference it, recurrence fields must be absent, its origin representation must match that source independently of current placement, and `expandRecurrence` results must preserve canonical origins.
- [ ] Implement the frozen series transform matrix: civil versus recurrence-zone wall delta, move/start-resize origin shifting and rekey, end-resize key stability, structured-selector rejection, raw-rule move/start-resize/conversion rejection with end-resize support, old-kind placement conversion, target-kind exception preservation, complete-bound-exception assertion, and finite `fetchRange` policy horizon.
- [ ] Harden the Phase 1 IANA-zone conversion using `TZDateMini` and native `Intl`; never expose `TZDateMini` in the public API.
- [ ] Verify spring-forward gap normalization for recurrence, omitted grid slots, doubled/offset-labelled fall-back slots, UTC, non-hour offsets, cross-zone all-day items, display-zone changes that preserve series instants/keys, month navigation, and recurrence across DST.
- [ ] Add the recurrence/time-zone/gesture labels and announcements introduced by this phase to every shipped catalog with the exact `Messages` shape.
- [ ] Mirror physical movement and navigation correctly in RTL while retaining chronological previous/next semantics.

**Exit gate:** daily/weekly/monthly/yearly rules, raw supported RRULEs, exclusions/additions, edited occurrences, IANA zones, DST days, locale switches, and RTL all use the same occurrence keys and half-open semantics.

### Phase 9 — Resource-day view

**Outcome:** bookable people/rooms/equipment reuse the time grid rather than fork it.

- [ ] Add `EventCalendarResourceView.svelte` as a day time grid with one shared time axis and one column per leaf resource.
- [ ] Build the resource hierarchy from the flat typed `parentId` model, preserving input sibling order and consumer fields; parents group but only leaves accept items.
- [ ] Separate cached parent/leaf structure from current resource objects so custom header-field changes reach snippets without unsafe casts or stale metadata.
- [ ] Reject duplicate IDs, unknown parents, and parent cycles. Occurrences without a resolvable leaf assignment render in one localized Unassigned column so incomplete item metadata never makes foreground or background content disappear silently.
- [ ] Add the localized Unassigned resource label and resource-move announcements to every shipped catalog.
- [ ] Reuse timed packing per resource, all-day lanes, business hours, now indicator, scrolling, selection, and item rendering.
- [ ] Extend hit testing and proposals with `resourceId`; moving across columns updates resource assignment through the same validation/transaction pipeline.
- [ ] Add `resourceHeader` snippet and theme part.
- [ ] Feed resource-leaf availability into the Phase 1 enabled-view reconciler: switch once to the first configured enabled view when possible, throw for a resource-only configuration with no leaf, and do not auto-restore the resource view later.

**Exit gate:** flat resources with parent chains, typed custom resource fields, empty columns, cross-resource moves, resize, drag-create, all-day items, horizontal overflow, keyboard focus, and narrow containers remain correct.

### Phase 10 — Accessibility, non-drag alternatives, responsiveness, and performance

**Outcome:** “supports DnD” does not mean “pointer users only.”

- [ ] Complete `eventCalendar.a11y.svelte.ts` with keyboard mutation modes, resource-grid traversal, scoped shortcuts, interaction announcements, and cross-view focus restoration.
- [ ] Implement keyboard move/resize mode: activate from a focused item, adjust by day/snap with arrows, Enter to commit, Escape to cancel, using the same proposal pipeline.
- [ ] Add a `PopupMenu`-based item action trigger for Move, Resize start, Resize end, and Cancel; choosing an action then a destination provides a single-pointer alternative to path-based dragging.
- [ ] Add the action-menu, keyboard-mode, focus, and status-message keys introduced by this phase to every shipped catalog.
- [ ] Announce mode, proposed date/time/resource, invalid targets, commit, cancel, and revert through a polite status region without stealing focus.
- [ ] Ensure month grid roles, labelled day/resource groups, event buttons, disclosures, busy states, focus rings, 24px minimum interaction targets, and reduced motion.
- [ ] Use container queries/observation to wrap the header, switch the view control representation, shorten weekday labels, and increase overflow; never mutate `view` for responsiveness.
- [ ] Keep month at the exact `visibleDays` column count—seven normally, fewer only through explicit hidden-weekday policy—use truncation/overflow for chips, and horizontally scroll time/resource grids when minimum columns no longer fit.
- [ ] Profile large visible ranges; cache formatters/date profiles/indexes, key by occurrence, mount only the active view, and rAF-throttle pointer visual state.
- [ ] Document a practical performance envelope from measured browser behavior instead of claiming arbitrary item limits.

**Exit gate:** all core operations are available by keyboard and by a non-drag pointer path, screen-reader announcements are coherent, focus survives changes, narrow containers preserve view, and interaction frames do not rebuild the event index.

### Phase 11 — Documentation, package surface, and release verification

**Outcome:** the component is discoverable, importable, documented, and packaged like the rest of Svelai.

- [ ] Add `index.ts` exporting only `EventCalendar`, `EventCalendarError`, public props/domain/API/snippet types, and theme helpers.
- [ ] Add `./event-calendar` to `package.json` exports and the legacy type-resolution map if it remains authoritative at implementation time.
- [ ] Add `eventCalendar.mcp.ts`; import and register `eventCalendarDescription` in `src/hooks.server.ts`.
- [ ] Add `/components/event-calendar` navigation under Data display.
- [ ] Add `src/routes/components/event-calendar/+page.svelte` with focused sibling demos instead of one monolithic route.
- [ ] Remove any temporary phase harness once the documentation route covers its verification purpose; no dead demo component remains.
- [ ] Document: immutable binding/navigation; all views/settings; move/resize/create and validation; custom item/header/cell snippets; create/edit dialog composition; recurrence/time zones and complete-series scope; resources; loading/range fetching; theme overrides; RTL; accessibility controls.
- [ ] Ensure generated props and structure docs discover the conventional filenames and public export.
- [ ] Run the full static, lint, packaging, and browser verification matrix below; compare any failures with the Phase 0 baseline.
- [ ] Run the seven-part repository self-review: form, failure handling, convention, scope, DRY, correctness, and architecture. Fix and repeat until clean.

**Exit gate:** `import { EventCalendar } from 'svelai/event-calendar'` works from the packed artifact; docs and MCP surfaces agree with types; no internal child leaks; no new diagnostic, SSR, hydration, lint, or publint failures remain.

## Verification matrix

No new automated test files are part of the authorized scope. The implementation still must be exercised systematically.

### Static and package verification

- `pnpm check`
- `pnpm lint`
- `pnpm prepack`
- Inspect `dist/components/EventCalendar/` declarations and `package.json` subpath resolution.
- Import the packed component and public types from a clean consumer fixture.
- Prove item/resource custom fields flow through props, snippets, callbacks, and APIs; prove redeclaring any calendar-owned key is a compile error.
- Confirm no browser-only global is read during SSR/module evaluation.

### View verification

- Month: 4/5/6-week months, Sunday/Monday/custom week starts, outside days, hidden weekends, week numbers, overflow, cross-week bars.
- Time grid: day/week/N-day, all-day row, cross-midnight items, overlap packing, short items, background items, now line, scrolling.
- Agenda: empty range, dense days, collapsed/expanded groups, multi-day and recurring occurrences.
- Resource: flat resources with parent chains, custom fields, unassigned/empty columns, cross-resource moves, and horizontal overflow.
- View reconciliation: empty/duplicate `views`, missing initial/external view, dynamic active-view removal, resource disappearance/return, and resource-only configuration.
- Range profiles: month outside days on/off, fixed weeks, valid-range clipping, hidden-day holes, agenda/N-day windows, and exact `fetchRange` derivation.

### Interaction verification

- Click/double-click, slot click, drag-created selection.
- Move and both-edge resize in each compatible view.
- Accepted, adjusted, rejected, cancelled, reverted, and locked mutations.
- Fresh and stale reverts after intervening calendar and consumer-owned collection updates.
- All-day ↔ timed conversion, valid range, overlap, business hours, snapping.
- All-day-source occurrence → timed exception and timed-source occurrence → all-day exception, preserving the source-shaped origin and occurrence key in both directions.
- Mouse, touch long-press, auto-scroll, keyboard mode, and single-pointer action mode.
- Escape, blur, pointer cancellation, unmount during interaction, and reduced motion.
- External item/profile/resource changes during a gesture, plus two simultaneously mounted calendar instances with isolated monitors.

### Date and locale verification

- UTC, an explicitly passed browser-local zone, `Europe/Paris`, `America/New_York`, and a non-hour-offset IANA zone.
- Spring-forward 23-hour day and fall-back 25-hour day.
- All-day exclusive ends, midnight endings, adjacent ranges, leap day, month/year rollover.
- Daily/weekly/monthly/yearly recurrence, ordinals, exclusions, additions, exceptions, and cap error.
- Structured series all-day/timed placement conversion through the shared duration contract, plus `until`, `exDates`, `rDates`, and exception-origin conversion; collision rejection, deterministic rekey/focus remap, and explicit raw-RRULE conversion rejection.
- Series transforms with an exception already in the target placement kind, structured time-only selector rules, rejected date-changing selector rules, raw-rule end-resize acceptance with move/start-resize rejection, move/start-resize rekey, end-resize key stability, and policies evaluated over the interacted/`fetchRange` horizon without claiming infinite validation.
- Complete-bound-series precondition for series edits; a windowed consumer uses occurrence/disabled scope and never emits a plausible partial-series transaction.
- Range loading for a long exception moved out after its original start fell before the range, and one moved in from an origin outside it; suppression/rendering remain correct, and every otherwise-out-of-range source is present for validation.
- English plus representative long-label, non-Latin, and RTL catalogs; then every shipped locale for key completeness.

### Accessibility verification

- Keyboard-only navigation, selection, move, resize, cancel, and view switching.
- Single-pointer alternative for every drag operation.
- Focus order/restoration, visible focus, semantic grids/groups/buttons/disclosures.
- Screen-reader labels and polite announcements for title, loading, proposals, invalid states, commits, and reverts.
- Zoom/reflow at 200% and narrow component containers without silent view changes.

### Performance verification

- No per-cell scan of the full collection.
- No event-index rebuild during pointer-move frames.
- Stable keyed DOM for unchanged occurrences.
- Only the active view is mounted.
- Formatter, date-profile, recurrence, and index caches invalidate on the exact owning inputs.
- Browser profile of a realistically dense month, week, agenda window, and resource day before documenting an envelope.

## Done when

- `EventCalendar` imports from `svelai/event-calendar` with complete public declarations.
- The component implements every included view and item shape from the shared date/occurrence model.
- Move, resize, drag-create, keyboard, touch, and non-drag alternatives share one validation/commit pipeline.
- Named zones, DST, recurrence, all-day semantics, and exclusive ends are correct and documented.
- All default visual regions are themed through the Svelai global/per-instance system and composable through named snippets.
- Existing Svelai primitives are reused where they own the responsibility; `useDndList` and `Form/Calendar` are not stretched into false abstractions.
- Remote loading and persistence remain consumer-owned, with visible-range callbacks, loading state, immutable change callbacks, and explicit revert.
- Docs, MCP, navigation, package exports, generated props/structure docs, SSR, hydration, lint, check, and publint integration are complete.
- No unrelated dirty-worktree changes are reverted or overwritten.

## Sources

- [ReUI Event Calendar overview](https://reui.io/components/event-calendar)
- [ReUI Event Calendar API](https://reui.io/docs/components/base/event-calendar)
- [ReUI Event Calendar registry](https://reui.io/r/event-calendar.json)
- [FullCalendar documentation](https://fullcalendar.io/docs)
- [FullCalendar event object and exclusive-end model](https://fullcalendar.io/docs/event-object)
- [FullCalendar event dragging and resizing](https://fullcalendar.io/docs/event-dragging-resizing)
- [FullCalendar date clicking and selecting](https://fullcalendar.io/docs/date-clicking-selecting)
- [FullCalendar time zones](https://fullcalendar.io/docs/timeZone)
- [FullCalendar recurring events](https://fullcalendar.io/docs/recurring-events)
- [RFC 5545 iCalendar](https://www.rfc-editor.org/rfc/rfc5545.html)
- [RFC 5545 verified recurrence-time erratum 4271](https://www.rfc-editor.org/errata/eid4271)
- [Pragmatic Drag and Drop core](https://atlassian.design/components/pragmatic-drag-and-drop/core-package)
- [Pragmatic Drag and Drop drop targets](https://atlassian.design/components/pragmatic-drag-and-drop/core-package/drop-targets)
- [`@date-fns/tz`](https://github.com/date-fns/tz)
- [WAI-ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [WCAG 2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)
- [WCAG Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)

Temporary research artifacts: `/tmp/reui-event-calendar.md`, `/tmp/reui-event-calendar-docs.md`, `/tmp/fullcalendar-api-research.json`, `/tmp/fullcalendar-architecture.json`, `/tmp/fullcalendar-data-model.json`, `/tmp/calendar-accessibility.json`, and `/tmp/pragmatic-dnd-calendar-research.json`.
