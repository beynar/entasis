export const eventCalendarDescription = `
# EventCalendar

A typed scheduling calendar for Svelte 5. It renders month, week, day, configurable N-day, agenda, and resource-day views from one occurrence model. The consumer owns loading and persistence; EventCalendar owns range derivation, recurrence expansion, layout, selection, accessible interaction, validation, clipboard operations, bounded history, and immutable mutation transactions.

## Import

~~~svelte
<script lang="ts">
	import { EventCalendar, type EventCalendarItem } from 'entasis/event-calendar';

	let date = $state(new Date('2026-07-15T10:00:00.000Z'));
	let items = $state<EventCalendarItem[]>([]);
</script>

<EventCalendar bind:date bind:items timeZone="Europe/Paris" class="h-[42rem]" />
~~~

'date' and 'timeZone' are required. Contained scrolling also requires a definite height through 'class'. The display-zone name must be 'UTC' or an IANA zone; EventCalendar never infers a server/browser system zone.

## Data model

- Every range is half-open: [start, end). Timed boundaries are Date instants.
- All-day starts and exclusive ends are canonical YYYY-MM-DD strings. Valid civil dates span 0001-01-01 through 9999-12-31, but 9999-12-30 is the last selectable/renderable day because a rendered day needs an exclusive end. An all-day end may be 9999-12-31.
- Items need stable unique ids. Invalid items, resources, views, zones, recurrence, and stale transactions throw EventCalendarError with a public EventCalendarErrorCode.
- 'items' and 'resources' are immutable controlled collections: allocate a fresh outer array for every consumer update and replace changed definitions. EventCalendar never mutates consumer objects.
- EventCalendarItem<TItemFields> includes optional 'description' and 'color' fields and preserves custom fields through props, snippets, callbacks, and API methods. Item colors accept Entasis semantic tokens or CSS colors; omitted item colors render as neutral. Custom fields cannot redeclare calendar-owned keys.
- Foreground items can be timed, all-day, multi-day, or recurring. 'display: background' items are display-only and never interactive.
- Assign one leaf with 'resourceId' or several leaves with an ordered unique 'resourceIds' array. The two fields are mutually exclusive.
- Timed recurrence requires an explicit 'recurrenceTimeZone'. All-day recurrence remains floating civil dates.

## State and view props

- 'items': EventCalendarItem<TItemFields>[] = [] (bindable)
- 'view': 'month' | 'week' | 'day' | 'days' | 'agenda' | 'resource' = 'month' (bindable)
- 'views': ordered, unique enabled-view list = all six views. Resource is available only with at least one leaf resource.
- 'date': Date (required, bindable anchor instant)
- 'dayCount': positive integer = 3 (bindable; used by 'days')
- 'selection': EventCalendarSelection = empty (bindable)
- 'resources': EventCalendarResource<TResourceFields>[] = []
- 'loading': boolean = false. Marks content busy and blocks content interaction, not navigation.
- 'disabled': boolean = false. Blocks navigation, selection, and mutation.

The component never changes 'view' because its container becomes narrow. Previous/next/today, header controls, and the imperative API reassign bindable state and call matching change callbacks. External assignments do not echo the same callback. Navigation beyond the supported civil domain is a no-op; direct invalid anchors and jumps throw.

## Date, locale, and range props

- 'timeZone': required IANA name or 'UTC'
- 'locale': BCP-47 string; defaults to the active Entasis catalog locale
- 'i18n': per-instance Partial<Messages>
- 'dir': 'ltr' | 'rtl'; defaults to ambient direction
- 'weekStartsOn': 0..6; otherwise locale-derived
- 'validRange': half-open Date range
- 'onRangeChange(payload)': receives view, anchor date, time zone, current/render/active/fetch ranges, and exact visibleDays

'fetchRange' is the clipped active rendering/interaction envelope. The consumer must return overlapping non-recurring definitions, recurring sources that expand into the range, moved exception definitions selected by current or reconstructed original occurrence overlap, and every returned exception's source. EventCalendar performs no requests, caching, retries, or error substitution.

## View settings

- 'month': fixedWeeks=true, showOutsideDays=true, showWeekNumbers=false, and maxItemsPerCell="auto".
- Weekend columns remain controlled by 'showWeekends=true' and 'weekendDays=[0,6]' because the weekday classification is shared across views.
- 'timeGrid': startHour=0, endHour=24, labelIntervalMinutes=60, slotClickDurationMinutes=30, snapDurationMinutes=15, scrollToHour=7, and nowIndicatorRefreshMs=30000.
- 'allDayConversion': preserveDuration=false, timedDurationMinutes=60, and allDayDurationDays=1.
- Agenda: 'agendaDayCount=30'.
- 'availability': offDays=false, businessHours=[], and constrainMutations=false.
- 'nowIndicator' renders the built-in current-time line when omitted, accepts a replacement snippet, and disables the line when false.
- Scrolling/chrome: 'scrollMode="contained"' uses ScrollArea; 'stickyHeader=false' and 'showDatePicker=false'. 'header' and 'itemTooltip' use their built-ins when omitted, accept replacement snippets, and disable their regions when false.

Numeric and time settings are validated and never silently clamped. Hidden weekdays are removed from 'visibleDays'; day and agenda counts count rendered days.

## Interaction and persistence

Move, resize-start, resize-end, API updates, and keyboard mode share one proposal/validation/commit pipeline. Empty-slot drag creation and two-click selection produce a selected range; EventCalendar never fabricates a domain item.

'externalEvent(createItem)' is an attachment for draggable elements outside the calendar. 'createItem' runs once at drag start and should return a structurally valid item with a fresh unique id. A valid drop uses the same placement preview, resource assignment, constraints, resolveItemUpdate callback, immutable add transaction, guarded revert, and history pipeline as internal interaction. The resulting EventCalendarChange has kind 'add' and source 'external-drop'. Invalid or cancelled drops do not change 'items'.

~~~svelte
<script lang="ts">
	import { externalEvent, type EventCalendarItem } from 'entasis/event-calendar';

	let sequence = 0;
	const createExternalItem = (): EventCalendarItem => ({
		id: 'external-' + ++sequence,
		title: 'Focus block',
		start: new Date('2026-07-15T08:00:00.000Z'),
		end: new Date('2026-07-15T09:00:00.000Z')
	});
</script>

<div {@attach externalEvent(createExternalItem)}>Focus block</div>
~~~

A recurring external source can move inside its original timed or all-day domain. Cross-domain conversion is rejected because timed and all-day recurrence identities have different contracts.

- 'interactions': partial policy. Drag, resize, slot selection, keyboard controls, two-click range selection, and clipboard default on. interactions.createActivation controls drag-create and defaults to distancePx 5, touchDelayMs 300, touchTolerancePx 8.
- 'allowOverlap': boolean or predicate = true.
- 'validateItemUpdate(payload)': synchronous live item validation.
- 'resolveItemUpdate(payload)': accept, reject with false, or adjust placement/resource. Adjustments are fully revalidated.
- 'validateSlotSelection(slot)': synchronous slot validation.
- Validation order is structural/editability/range, business hours, overlap, then custom policy.

'onItemsChange({ items, change })' runs after one accepted immutable reassignment. Persist 'items' at the application boundary. On failure, call 'change.revert()' and then surface the original error. Revert is guarded and one-shot: it throws 'stale-transaction' rather than overwrite a newer calendar or consumer update.

'interactions.clipboard=true' enables internal occurrence copy/paste through the API and Mod+C/Mod+V. Paste creates a standalone item, targets a selected compatible slot when present, and never mutates the copied recurrence series. 'historyLimit=50' bounds immutable undo entries; 0 disables history. Mod+Z undoes, Mod+Shift+Z and Mod+Y redo. History refuses stale controlled collections instead of overwriting consumer state.

Item callbacks are 'onItemClick({ occurrence, event })', 'onItemDoubleClick({ occurrence, event })', 'onMoreClick({ day, occurrences, event })', and 'onInteractionBlocked'. Slot callbacks are 'onSlotClick({ slot, event })' and 'onSelect({ slot, info })'; info.source is 'drag-create', 'keyboard', or 'single-pointer'. Bound-state callbacks are 'onViewChange', 'onDateChange', 'onDayCountChange', and 'onSelectionChange'.

Selection-callback naming: 'onSelect({ slot, info })' is the pick event -- the user picked this slot -- and 'onSelectionChange(payload)' is the state change of the selection model, completed by the bindable 'selection' prop and its 'defaultSelection' initial value. Those two names are the only selection callbacks on the component.

## Recurrence

'recurrence.editScope' is 'occurrence' by default, creating or updating a persisted exception with recurringItemId plus immutable originalStart. 'disabled' blocks recurring mutations. 'series' transforms the source and all bound exceptions atomically and is an assertion that the current 'items' collection contains the complete exception set for that editable series. A windowed consumer that cannot guarantee completeness must use 'occurrence' or 'disabled'.

Structured recurrence supports daily, weekly, monthly, and yearly rules with interval, count, inclusive until, weekdays including ordinals, month days, months, week start, exclusions, and additions. Supported raw RRULE strings are accepted with explicit restrictions on series transformations. Expansion is finite and capped; unsupported rules and cap exhaustion throw. 'recurrence.expand' is the synchronous bounded escape hatch, and 'recurrence.getExceptionId' overrides exception identity generation.

## Resources

'resources' is a typed flat collection. 'parentId' creates groups; only leaves become resource-day columns and accept assignment. Unknown parents, cycles, and duplicate IDs throw. A leaf can define local 'businessHours' and 'readOnly'; those constraints feed the same proposal validator used by every view. Foreground/background occurrences without a resolvable leaf appear in the localized Unassigned projection. Multi-assigned events render once for every resolved leaf. Resource moves replace only the dragged projection's assignment. Parent and leaf input order is preserved.

## Snippet composition

Snippets replace content inside component-owned semantic and interactive wrappers:

- 'header': snapshot plus ready-made previous, today, next, title, viewSwitcher, datePicker, and actions snippets; false removes the header
- 'actions': calendar snapshot and API
- 'item': occurrence, segment, active view (including agenda), states, defaultContent, markerContent, titleContent, and timeContent
- 'itemTooltip': customizes the item HoverCard with occurrence, segment, view, defaultAccessibleLabel, and defaultContent; false removes it
- 'monthCell': day/state/segments/overflow and defaultContent
- 'dayHeader', 'timeGutter' with defaultContent, and 'allDay'
- 'overflow' and 'overflowContent'; both expose defaultContent, and the latter preserves the built-in interactive item list when rendered
- 'agendaDetails'
- 'resourceHeader'
- 'nowIndicator', 'dragPreview', 'empty', and 'loadingContent'; replacement state snippets expose defaultContent, and nowIndicator=false disables the line

Render 'defaultContent' or the ready-made header snippets when wrapping the built-ins. Snippet content cannot remove item focusability, labels, selection state, drag/resize wiring, disclosures, or live announcements.

EventCalendar does not own create/edit dialogs. Compose 'onSlotClick'/'onSelect'/'onItemClick' with Entasis Dialog, Form, DateInput, TimeInput, Select, and Switch, then publish a fresh 'items' array.

## Imperative API

'bind:this' exposes EventCalendarApi<TItemFields>:

- navigation: next, previous, today, goTo, setView
- scrolling/ranges: scrollToTime, getVisibleRange, getActiveRange, getVisibleDays
- queries: getOccurrence, getOccurrences, getOccurrencesForDay
- immutable mutations: addItem, updateItem, updateOccurrence, removeItem
- clipboard/history: copySelection, paste, undo, redo, canUndo, canRedo
- selection/interaction: select, clearSelection, cancelInteraction

Unknown IDs/keys and invalid operations throw EventCalendarError. API mutations use the same validation and transaction callbacks as pointer and keyboard input.

## Theme and accessibility

'density' defaults to 'normal'; 'theme' accepts EventCalendarThemeProps. Import 'eventCalendarTheme', 'setEventCalendarTheme', and 'useEventCalendarTheme' from 'entasis/event-calendar'. Stable parts cover chrome, month, time grid, items/interactions, agenda, and resources. CSS metrics include --event-calendar-slot-height, --event-calendar-time-gutter-width, --event-calendar-day-min-width, --event-calendar-resource-min-width, --event-calendar-item-min-height, and --event-calendar-sticky-offset.

The active view exposes grids/groups/buttons/disclosures, roving focus, keyboard move/resize, Escape cancellation, two-click range selection, 24px interaction targets, polite announcements, reduced-motion behavior, narrow-container wrapping/scrolling, and RTL-aware physical movement. Keyboard mutation starts from a focused item, uses arrows to propose, Enter to commit, and Escape to cancel.
`;
