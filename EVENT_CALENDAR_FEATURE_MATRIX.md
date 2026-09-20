# EventCalendar Feature-Completeness Matrix

**Assessment date:** 2026-07-27

**Entasis baseline:** repository implementation through `0517246c` plus the working-tree scheduler expansion assessed here

**Compared products:** FullCalendar, React Big Calendar, Mobiscroll Event Calendar, Syncfusion Scheduler, and Bryntum Calendar

## Verdict

Entasis EventCalendar is already a **feature-complete core event calendar**, not yet a **full enterprise scheduler suite**.

It covers the difficult calendar foundation: month/week/day/N-day/agenda/resource-day views, timed and all-day layout, background and multi-day events, recurrence expansion and exception mutation, named time zones, DST-safe civil-day math, drag/resize/range selection, touch, keyboard editing, RTL, accessible semantics, immutable controlled state, guarded rollback, clipboard operations, bounded history, multi-resource assignment, resource-local constraints, and Svelte-native composition. The implemented contract is documented in the [component description](src/lib/components/EventCalendar/eventCalendar.mcp.ts) and [public props](src/lib/components/EventCalendar/eventCalendar.props.ts).

The material gaps are concentrated in three areas:

1. Year and multi-month planning views.
2. Cross-calendar drag-and-drop.
3. Product adjacencies: built-in editors, print/export, ICS/provider connectors, and capacity/workload tooling.

That puts Entasis roughly at:

- **Core scheduling:** strong parity with FullCalendar Standard and materially ahead of React Big Calendar in recurrence integrity, time-zone explicitness, keyboard mutation, and transaction safety.
- **Resource scheduling:** strong first-class scheduler surface; enterprise suites remain broader in capacity planning, data adapters, and administrative tooling.
- **Enterprise breadth:** intentionally incomplete.

## Method

The matrix compares observable component capabilities, not marketing category names. A feature is counted only when it is present in the shipped Entasis implementation or documented by the vendor.

| Mark | Meaning                                                               |
| ---- | --------------------------------------------------------------------- |
| ✅   | Native, first-class capability                                        |
| ◐    | Partial, narrower, or intentionally consumer-owned                    |
| ⊕    | Available through a premium plugin, add-on, or sibling product/module |
| —    | Absent or not documented as a supported capability                    |

Vendor columns link to official documentation. Specialist claims use additional inline links.

## 1. Views and rendering

| Capability                                | Entasis                    | [FullCalendar][fc-docs]                        | [React Big Calendar][rbc-core] | [Mobiscroll][mb-overview]             | [Syncfusion][sf-views]                                     | [Bryntum][br-features]                          |
| ----------------------------------------- | ------------------------- | ---------------------------------------------- | ------------------------------ | ------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------- |
| Month grid                                | ✅                        | ✅                                             | ✅                             | ✅                                    | ✅                                                         | ✅                                              |
| Week and day time grids                   | ✅                        | ✅                                             | ✅                             | ✅                                    | ✅                                                         | ✅                                              |
| Configurable N-day/custom-duration view   | ✅                        | ✅                                             | ◐ custom view                  | ✅                                    | ✅ view interval                                           | ✅ dual-day/configurable time                   |
| Agenda/list view                          | ✅                        | ✅                                             | ✅                             | ✅                                    | ✅                                                         | ✅                                              |
| Year or multi-month planning              | —                         | ✅ day-grid year and multi-month               | —                              | ✅                                    | ✅ Year and Timeline Year                                  | ✅                                              |
| Vertical resource day/time-grid           | ✅ leaf-resource day      | ⊕ Premium resource views [plugins][fc-plugins] | ✅ basic resource columns      | ✅ scheduler                          | ✅ multi-level resource grouping [resources][sf-resources] | ✅ resource view                                |
| Horizontal resource timeline              | — dedicated Gantt planned | ⊕ Premium [plugins][fc-plugins]                | —                              | ✅                                    | ✅                                                         | ⊕ use Bryntum Scheduler for timeline scheduling |
| Arbitrary whole-view extension            | — deliberate non-goal     | ✅ custom-view API                             | ✅ custom views                | ◐ configurable/composable stock views | ◐ view-specific configuration                              | ◐ class/API extension                           |
| Background events and availability ranges | ✅                        | ✅                                             | ✅                             | ✅                                    | ✅                                                         | ✅ time ranges                                  |
| Month overflow and `+N more` disclosure   | ✅                        | ✅                                             | ✅                             | ✅                                    | ✅                                                         | ✅                                              |

### Assessment

Entasis's ordinary calendar and resource-scheduling view surface is mature. The remaining view gap is **planning scale**: year and multi-month rendering.

## 2. Interaction and mutation

| Capability                                      | Entasis                                     | [FullCalendar][fc-dnd]                   | [React Big Calendar][rbc-dnd]                   | [Mobiscroll][mb-dnd]                                            | [Syncfusion][sf-events]        | [Bryntum][br-features]       |
| ----------------------------------------------- | ------------------------------------------ | ---------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------- | ------------------------------ | ---------------------------- |
| Event drag-to-move                              | ✅                                         | ✅                                       | ⊕ drag-and-drop add-on                          | ✅                                                              | ✅                             | ✅                           |
| Resize from start and end edges                 | ✅                                         | ✅                                       | ✅ add-on                                       | ✅                                                              | ✅                             | ✅                           |
| Empty-range drag selection                      | ✅                                         | ✅ selection callback                    | ✅ slot selection                               | ✅                                                              | ✅ cell selection              | ✅                           |
| Direct event creation gesture                   | ◐ emits typed range; consumer creates item | ◐ selection/external-drop callback       | ◐ consumer callback                             | ✅ drag/click creation                                          | ✅ editor/cell workflow        | ✅ double-click creation     |
| External DOM drag into calendar                 | ✅ typed attachment and add transaction    | ✅ [external dragging][fc-external]      | ✅ inbound callback [add-on docs][rbc-external] | ✅                                                              | ✅ external drag integration   | ✅ feature/example support   |
| Drag between calendar instances                 | —                                          | ✅                                       | ◐ consumer-managed outside drop                 | ✅                                                              | ◐ integration code required    | ◐ integration code required  |
| Touch/long-press interaction                    | ✅                                         | ✅ [touch support][fc-a11y]              | ◐ backend/browser dependent                     | ✅ mouse/touch                                                  | ✅ tap-and-hold                | ✅                           |
| Keyboard event move and resize                  | ✅                                         | — no documented keyboard mutation        | —                                               | ◐ keyboard navigation; no equivalent mutation contract verified | ◐ keyboard CRUD/navigation     | ◐ keyboard navigation/editor |
| Non-drag pointer alternative                    | ✅ two-click and single-pointer modes      | ◐ date click/select                      | ◐ click/select                                  | ✅ click creation/editor                                        | ✅ quick editor                | ✅ editor                    |
| Live overlap/range/business policy              | ✅ one proposal pipeline                   | ✅ overlap, constraint, and `eventAllow` | ◐ consumer callbacks                            | ✅ event/resource policies                                      | ✅ action hooks and work hours | ✅ programmatic validation   |
| Auto-scroll during manipulation                 | ✅                                         | ✅                                       | ◐ add-on behavior                               | ✅                                                              | ✅ drag scroll controls        | ✅                           |
| Reversible accepted mutation                    | ✅ guarded one-shot `revert()`             | ✅ callback `revert()`                   | ◐ consumer-owned                                | ◐ consumer-owned callbacks                                      | ◐ cancellation/action hooks    | ✅ undo/redo                 |
| Stale-state protection during async persistence | ✅ identity-guarded revert                 | ◐ unguarded callback revert              | —                                               | —                                                               | —                              | ◐ store/history model        |

### Assessment

Entasis is unusually strong here. Its main interaction deficit is **ecosystem drag-and-drop**. Keyboard move/resize, a unified validation pipeline, immutable transactions, and stale-revert protection are differentiators rather than catch-up work.

## 3. Recurrence, dates, and time zones

| Capability                                              | Entasis                                        | [FullCalendar][fc-rrule]                                | [React Big Calendar][rbc-core] | [Mobiscroll][mb-timezones]            | [Syncfusion][sf-recurrence]     | [Bryntum][br-core]              |
| ------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------ | ------------------------------------- | ------------------------------- | ------------------------------- |
| Daily/weekly/monthly/yearly recurrence                  | ✅                                            | ⊕ built-in simple recurrence plus RRule plugin          | —                              | ✅                                    | ✅                              | ✅                              |
| RRULE-style advanced rules                              | ✅ structured rules plus restricted raw RRULE | ⊕ RRule plugin                                          | —                              | ✅ rule strings/objects               | ✅ iCalendar recurrence rules   | ◐ product recurrence model      |
| Exclusions, additions, and persisted exceptions         | ✅                                            | ✅ through RRule/event data; persistence consumer-owned | —                              | ✅ recurrence exceptions              | ✅ recurrence exception model   | ✅                              |
| Edit one occurrence                                     | ✅ immutable exception transaction            | ◐ application must model the changed occurrence         | —                              | ✅                                    | ✅                              | ✅                              |
| Edit whole series                                       | ✅ atomic series transform                    | ◐ application-managed                                   | —                              | ✅                                    | ✅                              | ✅                              |
| Built-in recurrence editor UI                           | —                                             | —                                                       | —                              | ✅                                    | ✅ integrated recurrence editor | ✅ event editor                 |
| Explicit named IANA display zone                        | ✅ required                                   | ✅                                                      | ◐ localizer/application-owned  | ✅ display/data zones                 | ✅ scheduler timezone           | ✅ configurable date/time zones |
| Per-series scheduling zone                              | ✅ required for timed recurrence              | ◐ calendar/event-source oriented                        | —                              | ✅ per-event timezone                 | ✅ start/end timezone fields    | ◐                               |
| DST-safe civil-day handling                             | ✅ explicit invariant                         | ✅                                                      | ◐ delegated to localizer       | ✅ documented recurring-zone behavior | ✅                              | ✅                              |
| Exclusive-end range model                               | ✅ universal contract                         | ✅                                                      | ◐ conventional event end       | ✅ automatic with time zones          | ✅ appointment end              | ✅                              |
| Bounded expansion with explicit unsupported-rule errors | ✅                                            | ◐ RRule library behavior                                | —                              | ◐                                     | ◐                               | ◐                               |

### Assessment

Recurrence and time-zone correctness are Entasis strengths. The missing feature is the **authoring UI**, not the recurrence engine. React Big Calendar has no comparable built-in recurrence model; FullCalendar delegates advanced rules to its RRule connector and leaves persistence semantics to the application.

## 4. Resources, data, and scale

| Capability                              | Entasis                                         | [FullCalendar][fc-plugins]                                           | [React Big Calendar][rbc-core] | [Mobiscroll][mb-resources]               | [Syncfusion][sf-resources]                                                        | [Bryntum][br-product]                                             |
| --------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------- | ------------------------------ | ---------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Resource hierarchy/grouping             | ✅ parent/leaf tree                            | ⊕ Premium hierarchy/grouping                                         | — flat columns                 | ✅ grouping/resource controls            | ✅ multi-level hierarchy                                                          | ◐ resource view/grouping                                          |
| Multiple resources on one event         | ✅ `resourceIds` with legacy single assignment | ⊕ Premium resource arrays                                            | —                              | ✅ resource arrays                       | ✅ multiple selection                                                             | ◐ documented resource assignment, exact multiplicity not verified |
| Resource-specific hours and edit policy | ✅ local business hours and read-only leaves   | ⊕ Premium resource business hours                                    | ◐ consumer-owned               | ✅ per-resource controls                 | ✅ per-resource hours/workdays                                                    | ◐                                                                 |
| Move between resources                  | ✅                                             | ⊕ Premium                                                            | ✅                             | ✅                                       | ✅                                                                                | ✅                                                                |
| Virtualized large-resource rendering    | —                                              | — no general virtualization documented                               | —                              | ◐ optimized timeline/scheduler scrolling | ✅ virtual scrolling and lazy resource/event loading [virtualization][sf-virtual] | ◐ vendor claims massive-data performance                          |
| Exact visible/fetch range callback      | ✅                                             | ✅ event-source range fetching                                       | ◐ consumer derives range       | ✅ data loading lifecycle                | ✅ remote data/DataManager                                                        | ✅ Store/CrudManager                                              |
| Immutable controlled collection         | ✅ explicit contract                           | ◐ internal mutable Event API plus callbacks                          | ✅ controlled events           | ◐ component data APIs                    | ◐ DataManager/store model                                                         | ◐ Store model                                                     |
| Built-in remote/provider adapters       | — deliberate consumer boundary                 | ⊕ JSON, Google Calendar, and iCalendar sources [plugins][fc-plugins] | —                              | ✅ calendar integrations                 | ✅ remote DataManager and ICS import/export                                       | ◐ JSON Store/CrudManager                                          |

### Assessment

Entasis owns coherent calendar resource scheduling through resource-day columns, multi-assignment, and resource-local availability. Horizontal planning, capacity engines, lazy remote loading, and bulk workforce operations remain outside EventCalendar.

## 5. Accessibility, composition, and product features

| Capability                                    | Entasis                                               | [FullCalendar][fc-a11y]                                      | [React Big Calendar][rbc-core]                    | [Mobiscroll][mb-templates]                                  | [Syncfusion][sf-overview]                                       | [Bryntum][br-core]                       |
| --------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Event/cell/header/resource render composition | ✅ Svelte snippets inside owned semantics            | ✅ content/class/mount hooks                                 | ✅ component/getter overrides                     | ✅ templates                                                | ✅ templates                                                    | ✅ renderers/class overrides             |
| Per-instance and global theme contract        | ✅ CVA theme parts/tokens                            | ✅ theme and render hooks                                    | ◐ CSS/SASS customization                          | ✅ themes/templates                                         | ✅ theme packages/templates                                     | ✅ SASS/CSS themes                       |
| Locale and RTL                                | ✅                                                   | ✅                                                           | ✅ localizers/RTL                                 | ✅                                                          | ✅                                                              | ✅ localization                          |
| Keyboard and screen-reader structure          | ✅ including keyboard mutation/live regions          | ✅ WAI-ARIA and focusability                                 | ◐ no equivalent documented accessibility contract | ✅ accessibility support                                    | ✅ keyboard/accessibility support                               | ✅ keyboard navigation                   |
| Reduced motion and 200% reflow contract       | ✅                                                   | ◐                                                            | —                                                 | ◐ responsive                                                | ◐ responsive/adaptive                                           | ✅ responsive                            |
| Svelte-native and SSR-safe package            | ✅                                                   | — framework-agnostic core plus React/Vue/Angular connectors  | — React only                                      | — JS/jQuery/React/Vue/Angular                               | — JS/React/Vue/Angular wrappers                                 | — JS/React/Vue/Angular wrappers          |
| Built-in event editor                         | — deliberate composition boundary                    | —                                                            | —                                                 | ✅                                                          | ✅                                                              | ✅                                       |
| Built-in recurrence editor                    | —                                                    | —                                                            | —                                                 | ✅                                                          | ✅                                                              | ✅                                       |
| Print-optimized rendering                     | —                                                    | ⊕ Premium adaptive print                                     | —                                                 | ✅                                                          | ✅                                                              | ✅                                       |
| ICS import/export                             | —                                                    | ⊕ iCalendar event-source import; no first-class export       | —                                                 | ◐ integrations, not verified as symmetric ICS import/export | ✅                                                              | ✅ export                                |
| Excel/CSV export                              | —                                                    | —                                                            | —                                                 | —                                                           | ✅ including recurrence occurrences [export options][sf-export] | ✅                                       |
| Google/Outlook connectors                     | —                                                    | ⊕ Google Calendar/iCalendar feeds [Google source][fc-google] | —                                                 | ✅                                                          | — generic remote data                                           | — generic server integration             |
| Copy/paste and undo/redo history              | ✅ selected-occurrence clipboard and bounded history | —                                                            | —                                                 | ◐                                                           | ◐ clipboard/action support                                      | ✅                                       |
| Capacity/workload visualization               | ◐ overlap predicate only                             | ◐ constraints only                                           | —                                                 | ◐ resource controls                                         | ◐ resource grouping/work hours                                  | ◐ stronger in sibling Scheduler products |

### Assessment

Entasis's accessibility and composition architecture is competitive. The absent rows are mostly **application/product conveniences**. They should not all move into the calendar core.

## Completeness by market

| Target market                                            | Entasis readiness              | Reason                                                                                                      |
| -------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Product calendar, meeting planner, booking UI            | **High**                      | Core views, recurrence, time zones, resource day, interactions, accessibility, and composition are present. |
| Team calendar similar to Google Calendar basics          | **High with companion forms** | Needs an application-owned event/recurrence editor and persistence, which are deliberate boundaries.        |
| Room or small-resource booking                           | **High**                      | Resource day, multi-assignment, and local availability policies are present.                                |
| Dispatch, workforce, equipment, or operations scheduling | **Medium**                    | Resource-day scheduling is present; horizontal planning, capacity, and bulk operations belong in Gantt.     |
| Enterprise calendaring suite                             | **Medium**                    | Editors, exports, provider integrations, print, and administration workflows remain outside the component.  |

## Prioritized gap backlog

### Completed — coherent scheduling expansion

1. **Multiple resource assignment**

   Implemented as one occurrence with multiple resource projections. Dragging a projection replaces that assignment while preserving the others; legacy `resourceId` remains supported.

2. **Per-resource availability and constraints**

   Implemented through the existing validation owner with resource-local business hours and read-only leaves.

3. **Copy/paste and undo/redo history**

   Implemented as selected-occurrence clipboard operations and bounded immutable history. Keyboard shortcuts use <kbd>Mod+C</kbd>, <kbd>Mod+V</kbd>, <kbd>Mod+Z</kbd>, <kbd>Mod+Shift+Z</kbd>, and <kbd>Mod+Y</kbd> without intercepting editable controls.

### Separate component track — GanttChart

Horizontal task/resource planning is intentionally not an EventCalendar view. A dedicated GanttChart should own task hierarchy, dependencies, milestones, progress, and project-scale virtualization while reusing the neutral interval lane and overlap packing module under `src/lib/utils/scheduling`.

### Priority 2 — broad calendar parity

4. **Year and multi-month views**

   Reuse the occurrence index and month segmentation. This is much smaller than timeline work and closes the most visible FullCalendar/Mobiscroll/Syncfusion/Bryntum view gap.

5. **Cross-calendar drag-and-drop**

   External DOM sources now use the typed 'externalEvent' attachment and guarded add transactions. Calendar-to-calendar moves still need source ownership, acceptance policy, copy-versus-move semantics, and coordinated rollback.

6. **Multi-select and bulk mutation**

   Extend the selection model only when a concrete bulk-operation contract exists. Single-selection copy/paste and history are already implemented.

### Priority 3 — companion product surface

8. **Entasis event and recurrence editor recipe/component**

   Compose `Dialog`, `Form`, `DateInput`, `TimeInput`, `Select`, and recurrence controls. Keep domain persistence outside EventCalendar.

9. **ICS import/export and print adapter**

   Implement as separate packages or utilities over the public item model. Avoid coupling file/network I/O to rendering.

10. **Google/Outlook adapters**

Keep authentication, caching, sync tokens, retries, and provider errors outside the component.

### Defer

- Arbitrary whole-view plugins: current snippets cover real customization needs; add a view API only for a proven second consumer.
- Capacity/workload engines: this changes the product from calendar to workforce scheduler and needs its own domain model.
- Calendar-owned persistence: this would weaken current error ownership and transaction clarity.

## Recommended next milestone

Choose based on intended market:

- **General-purpose calendar:** ship year/multi-month plus cross-calendar drag-and-drop.
- **Serious scheduler:** add capacity/workload semantics and a lazy remote-resource contract without weakening the current mutation pipeline.
- **Application completeness:** build the companion event/recurrence editor before adding more rendering views.

The strongest next path is application completeness. The resource scheduler foundation now exists; an event/recurrence editor makes the calendar usable as a complete product surface without coupling persistence to rendering.

## Sources

### Entasis

- [EventCalendar implementation contract](src/lib/components/EventCalendar/eventCalendar.mcp.ts)
- [EventCalendar public props](src/lib/components/EventCalendar/eventCalendar.props.ts)
- [Original implementation scope and explicit non-goals](EVENT_CALENDAR_IMPLEMENTATION_PLAN.md)

### FullCalendar

- [Documentation index][fc-docs]
- [Plugin index][fc-plugins]
- [Event dragging and resizing][fc-dnd]
- [External event dragging][fc-external]
- [RRule plugin][fc-rrule]
- [Accessibility][fc-a11y]
- [Google Calendar event source][fc-google]

### React Big Calendar

- [Official repository and localization contract][rbc-core]
- [Drag-and-drop add-on][rbc-dnd]
- [External drop callback][rbc-external]

### Mobiscroll

- [Event Calendar overview][mb-overview]
- [Drag-and-drop][mb-dnd]
- [Time zones][mb-timezones]
- [Resources][mb-resources]
- [Templating][mb-templates]

### Syncfusion

- [Scheduler overview][sf-overview]
- [Views][sf-views]
- [Appointments and drag/drop][sf-events]
- [Resources][sf-resources]
- [Virtual scrolling][sf-virtual]
- [Recurrence editor][sf-recurrence]
- [Excel/CSV export options][sf-export]

### Bryntum

- [Calendar product overview][br-product]
- [Feature list][br-features]
- [Built-in Calendar features][br-core]

[fc-docs]: https://fullcalendar.io/docs
[fc-plugins]: https://fullcalendar.io/docs/plugin-index
[fc-dnd]: https://fullcalendar.io/docs/event-dragging-resizing
[fc-external]: https://fullcalendar.io/docs/external-dragging
[fc-rrule]: https://fullcalendar.io/docs/rrule-plugin
[fc-a11y]: https://fullcalendar.io/docs/accessibility
[fc-google]: https://fullcalendar.io/docs/google-calendar
[rbc-core]: https://github.com/jquense/react-big-calendar
[rbc-dnd]: https://github.com/bigcalendar/react-big-calendar/tree/master/src/addons/dragAndDrop
[rbc-external]: https://github.com/bigcalendar/react-big-calendar/blob/master/src/addons/dragAndDrop/README.md
[mb-overview]: https://demo.mobiscroll.com/javascript/eventcalendar
[mb-dnd]: https://mobiscroll.com/docs/javascript/eventcalendar/drag-and-drop
[mb-timezones]: https://mobiscroll.com/docs/javascript/eventcalendar/timezones
[mb-resources]: https://mobiscroll.com/docs/react/eventcalendar/resources
[mb-templates]: https://mobiscroll.com/docs/javascript/eventcalendar/templating
[sf-overview]: https://ej2.syncfusion.com/documentation/schedule
[sf-views]: https://ej2.syncfusion.com/javascript/documentation/schedule/views
[sf-events]: https://ej2.syncfusion.com/documentation/schedule/appointments
[sf-resources]: https://ej2.syncfusion.com/documentation/schedule/resources
[sf-virtual]: https://ej2.syncfusion.com/javascript/documentation/schedule/virtual-scrolling
[sf-recurrence]: https://ej2.syncfusion.com/documentation/schedule/recurrence-editor
[sf-export]: https://ej2.syncfusion.com/documentation/api/schedule/exportoptions
[br-product]: https://bryntum.com/products/calendar/
[br-features]: https://bryntum.com/products/calendar/features/
[br-core]: https://bryntum.com/products/calendar/docs/guide/Calendar/basics/features
