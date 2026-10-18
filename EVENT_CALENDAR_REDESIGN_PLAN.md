# EventCalendar redesign — implementation and AI handoff plan

## 1. Status, objective, and authority

**Status:** implemented and adversarially reviewed on 2026-09-20. The compatibility and ownership
changes are complete; the quantitative LOC target was not achieved. See
`EVENT_CALENDAR_REDESIGN_EVIDENCE.md` for the verified architecture, checks, defects corrected, and
the final 15,455 LOC measurement.

**Objective:** preserve the current EventCalendar feature set and public behavior while replacing its internal architecture with a smaller system built around an admitted schedule, explicit view projections, and edit drafts. Improve organization by reducing independent meanings, representations, and synchronization rules.

**Working target:** the implementation attempted to reduce the audited 15,813 production LOC to
approximately 10,572–11,972 LOC, a net reduction of 3,841–5,241 LOC, or 24–33%. The reviewed result
is 15,455 LOC, a reduction of 358 LOC or 2.26%. Approximately 30% was a design target, not permission
to weaken behavior. All new adapters, internal types, and shared code are charged to the result.

**Why this is a redesign:** an earlier audit estimated 7–11% savings from local deduplication and extraction. Arnaud rejected that approach because it treated the existing architecture as fixed. Do not execute that smaller cleanup plan under the name of this redesign. The important experiment is whether rendering, input, focus, and previews can consume the same authoritative view projection, and whether mutations can consume admitted schedule values and one prepared commit batch.

**Execution authority:** when Arnaud asks an AI to implement this plan, that instruction authorizes the reversible implementation, characterization, experiments, and validation described here. Routine internal choices do not require repeated confirmation. A plan file alone does not authorize deployment, publishing, a new dependency, or public behavior changes. Ask only when a necessary choice crosses those boundaries or conflicts with a newer instruction.

**Done when:**

- The current public feature set, types, callbacks, error behavior, controlled state, accessibility, and relevant performance properties have behavioral evidence.
- The replacement has fewer independent authorities and removes the superseded mechanisms from the shipped graph.
- All replacement and newly shared production code is included in an honest LOC ledger.
- The package and documentation examples use the public entrypoint and pass their relevant checks.
- The final report distinguishes actual reduction, remaining uncertainty, failed checks, and any approved deviations.

The implementation is not complete merely because files are shorter, types compile, or a subset of views renders.

## 2. Read this before writing code

Repository paths in this document are relative to the project root. Function and type names are better navigation anchors than the line numbers from the audit, because implementation will move code.

Read these sources in order:

1. The active user instructions, root [AGENTS.md](AGENTS.md), and [memory.md](memory.md). Read any applicable nested instructions before editing their scope.
2. This complete plan, especially the compatibility contract, experiment gate, and unit dependencies.
3. [Public types](src/lib/components/EventCalendar/eventCalendar.types.ts), [props and payloads](src/lib/components/EventCalendar/eventCalendar.props.ts), [exports](src/lib/components/EventCalendar/index.ts), and the EventCalendar entries in [the component manifest](tooling/component-contract/manifest.ts).
4. [Current component documentation](src/lib/components/EventCalendar/eventCalendar.mcp.ts), then the source owners named in the relevant work unit.
5. Existing [focus tests](src/lib/components/EventCalendar/eventCalendar.focus.svelte.test.ts), [history tests](src/lib/components/EventCalendar/eventCalendar.history.svelte.test.ts), and the documentation examples under [the EventCalendar route](src/routes/components/event-calendar/+page.svelte).

The following references are useful but are not an authority for reconstructing the current API:

- [EVENT_CALENDAR_IMPLEMENTATION_PLAN.md](EVENT_CALENDAR_IMPLEMENTATION_PLAN.md) is historical. It contains retired names, an old instruction against adding automated tests, and broader gesture-staleness claims than the current implementation. Use it for context and test ideas, not to override current behavior or this plan.
- [EVENT_CALENDAR_FEATURE_MATRIX.md](EVENT_CALENDAR_FEATURE_MATRIX.md) describes breadth and product boundaries. Its competitor claims and roadmap are not implementation requirements for this task.
- [PERFORMANCE.md](src/lib/components/EventCalendar/PERFORMANCE.md) contains an old measurement and descriptions of caches that must be checked against current source. It is not proof of current performance.
- Existing screenshots under `output/playwright` are historical evidence, not current visual assertions.

Preserve public behavior observed in the baseline unless a current authoritative rule clearly resolves a contradiction. Record a contradiction before changing it. A legacy inconsistency is not permission to silently normalize behavior.

## 3. Baseline and worktree precautions

### 3.1 Audited identity

The audit was performed in `/Users/arnaud/code/ai2` with:

- Git HEAD: `ebf782fa469ea5240aea4514bca6c514dde55c13`.
- 36 production `.ts`/`.svelte` files in `src/lib/components/EventCalendar`, excluding tests and `eventCalendar.mcp.ts`.
- Production physical LOC: **15,813**.
- Production source digest: `821cfe320b713a5c8e64bd1e47a0bb64e91834e20e6127301185fe940aa1cfcb`.
- Additional MCP documentation: 157 LOC; including it gives 15,970 LOC.
- Existing tests and harness: 533 LOC, covering 23 tests concentrated in focus and history.
- Documentation-route source: 723 LOC.

The digest hashes sorted immediate production filenames, a null separator, their UTF-8 contents, and another null separator. The counting command in section 12 reproduces it for the audited structure.

The worktree was already substantially dirty. In particular, `package.json`, the lockfile, manifest, generated contract files, test setup, and unrelated components had user changes. EventCalendar production source was clean relative to HEAD at the audit. `memory.md` already contained a lesson from this review. Recheck everything at execution time; this paragraph does not establish ownership of later changes.

Before edits, record the actual HEAD, relevant source digest, status, environment, and existing failures. Preserve all unrelated work. Use an isolated worktree or source snapshot when concurrent work requires it, and include the necessary current source rather than assuming HEAD alone reproduces the workspace. Never reset, clean, or overwrite the shared checkout to obtain a convenient baseline.

### 3.2 Disjoint LOC budget

| Production area                         | Audited LOC | Replacement budget | What is charged here                                                                                             |
| --------------------------------------- | ----------: | -----------------: | ---------------------------------------------------------------------------------------------------------------- |
| Public contract                         |       1,172 |              1,172 | `index`, public types/props, error type, theme                                                                   |
| Dates, profiles, recurrence             |       2,436 |        1,900–2,100 | Existing date, date-jump and recurrence files; new temporal/profile schemas and adapters                         |
| Items and resources                     |       1,196 |            850–950 | Admission, definitions, occurrence projection, segmentation, identities, resource hierarchy                      |
| Mutations and transactions              |       1,880 |        1,200–1,350 | Mutation/recurrence mutation/record/resolution owners; batch schemas, policy, public changes, history and revert |
| Root and state                          |       1,712 |        1,050–1,150 | Root component, public bindings, coordinator, configuration, selection, mount and range notifications            |
| Views, layout, input, focus and preview |       7,417 |        4,400–5,250 | All other calendar production code; new surfaces, sensors, focus logic, renderers and integration                |
| **Total**                               |  **15,813** |  **10,572–11,972** | All new production machinery included                                                                            |

These are allocation budgets, not file-size quotas. If a responsibility moves to another row, transfer its cost rather than counting its disappearance twice. For perspective, the current Svelte files contain approximately 2,243 script LOC and 1,754 non-script LOC. Much of the markup is legitimate; the principal opportunity is removing repeated script-level interpretation and coordination.

### 3.3 Why the present system is expensive

Verified examples:

- [The item index](src/lib/components/EventCalendar/eventCalendar.items.ts) constructs `OccurrenceSchedule`/`SegmentSchedule` and immediately hydrates public-shaped occurrences and segments. The intermediate projection has no separate current consumer that justifies the round trip.
- Business hours are interpreted separately in state validation, resource validation, time-grid geometry, and mutation policy.
- [The interaction controller](src/lib/components/EventCalendar/eventCalendar.interactions.svelte.ts) combines gesture semantics, native drag payloads, target registration/serialization, placement math, preview geometry, scrolling, and input-specific lifecycles.
- `EventCalendarDropTarget.allDay` conflates a month date cell with an explicit all-day conversion target. `deriveItemProposal` recovers the lost distinction with view-name branches.
- [The time-grid component](src/lib/components/EventCalendar/EventCalendarTimeGrid.svelte) constructs separate columns, buckets, geometries, label maps, and accessibility targets that describe the same view.
- [Accessibility state](src/lib/components/EventCalendar/eventCalendar.a11y.svelte.ts) mirrors active mutation identity and operation already present in the interaction draft, and separately configures three DOM registry families.
- [All-day preview insertion](src/lib/components/EventCalendar/eventCalendar.allDayInsertion.ts) implements its own lane packing alongside normal placement.
- Normal and recurrence commit paths repeatedly materialize and validate candidate collections, then the publication boundary rebuilds the index again.
- The state owner couples item admission, resource construction, and profile projection into one derived model even though their lifetimes differ.

The recurrence engine, civil-date/zone rules, accessibility guarantees, and public payloads also contain necessary complexity. This plan does not assume that every long function or every branch is waste.

## 4. Scope and compatibility contract

The IDs below are used by work units and evidence records. Recheck the exact baseline code before pinning expectations. Preserve observable values, failure phase, error identity, callback order, and atomicity. Tests must state independently expected behavior, not merely copy the replacement's assumptions.

### C01 — Public package, types, and integration

- Keep the `entasis/event-calendar` entrypoint, its audited 69 exported symbols, component generics, native HTML attributes/events, attachment support, and `bind:this` API.
- Preserve the discriminated item, selection, change, expanded-occurrence, and adjustment types. Do not replace them with loosely related optional fields.
- Keep generic item/resource fields and their established projection/merge behavior; collisions with calendar-owned keys remain rejected by the public type contract. One baseline asymmetry needs an explicit decision: editing an existing occurrence exception rebuilds its custom fields from the series source, whereas a series transformation preserves exception fields. Do not silently claim universal field preservation; see section 11.3.
- Keep `externalEvent(createItem)` and its receiving-calendar validation boundary. The factory runs lazily when native drag starts, not at attachment installation or drop; its timing/errors remain observable. Preserve suppression of the browser's native drag preview.
- Preserve the 44 theme-part keys and the semantic/content wrappers consumers customize.
- `tooling/component-contract/manifest.ts` owns generated public metadata. Do not hand-edit generated aliases, registry, inventory, navigation, exports, or skill mirrors.

The imperative API remains: `next`, `previous`, `today`, `goTo`, `setView`, `scrollToTime`, `getVisibleRange`, `getActiveRange`, `getVisibleDays`, `getOccurrence`, `getOccurrences`, `getOccurrencesForDay`, `addItem`, `updateItem`, `updateOccurrence`, `removeItem`, `copySelection`, `paste`, `undo`, `redo`, `canUndo`, `canRedo`, `select`, `clearSelection`, and `cancelInteraction`. Preserve each method's actual return/throw contract; a missing query result and a missing mutation target are different cases.

### C02 — Configuration, defaults, and bound values

- `date` and explicit IANA/UTC `timeZone` remain required.
- Preserve bindable `items`, `view`, `date`, `dayCount`, `selection`, and root `ref`; defaults initialize according to the current Entasis binding rules.
- Calendar-originated changes invoke their callbacks at the existing time. Parent updates must not become new user actions or notifications.
- Locale defaults to the active message catalog; week start derives from locale unless supplied; direction inherits unless explicit.
- A narrow container does not silently select a different view.

Baseline defaults to retain:

| Option                                | Default                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------- |
| View / ordered views                  | `month`; month, week, day, days, agenda, resource                                                 |
| N-day / agenda counts                 | 3 / 30                                                                                            |
| Month                                 | Fixed six rows, outside days visible, week numbers hidden, overflow threshold `auto`              |
| Weekends                              | Visible; weekday values `[0, 6]`                                                                  |
| Time grid                             | Start 0, end 24, label interval 60 min, click duration 30 min, snap 15 min, initial scroll hour 7 |
| Clock refresh                         | 30,000 ms                                                                                         |
| Conversion                            | Preserve duration false; timed duration 60 min; all-day duration 1 civil day                      |
| Availability                          | No off-day override, no business windows, mutation constraint false                               |
| Interactions                          | Drag, resize, slot selection, keyboard, two-click selection, clipboard enabled                    |
| Empty-slot pointer activation         | 5 px movement; touch hold 300 ms; touch tolerance 8 px                                            |
| Recurrence edit scope / history limit | `occurrence` / 50; limit 0 disables history                                                       |
| Scroll / chrome                       | Contained scrolling; sticky header false; date picker false                                       |

Consult current props for remaining defaults and validation. Do not extend `interactions.createActivation` to item drag merely because the replacement shares a pointer primitive: its current public meaning is empty-slot activation.

### C03 — Temporal values and intervals

- Ranges are half-open. Adjacent events do not overlap.
- Timed public values are `Date` instants; all-day item/slot values are canonical civil-date strings.
- A zero-length timed definition is valid and receives a visual minimum. Mutation placement rules are stricter; do not use one positivity check for both admission and editing.
- All-day definitions require a positive civil interval. Civil days are never advanced as a fixed number of milliseconds.
- All-day dates remain floating dates when the display zone changes. Timed recurring origins use the series' own `recurrenceTimeZone`.
- Repeated wall times resolve to the earliest matching instant. Gap resolution uses the pre-transition offset, as implemented by the current shared zone resolver.
- Time-grid slots and heights use elapsed instants; repeated labels must remain distinguishable. Do not identify a fall-back slot only by wall minutes.
- Preserve date-domain limits, minimum/maximum navigation behavior, supported minute bounds, and zero-duration visual overflow errors.

### C04 — Views, profiles, layout, and states

- Preserve month, week, day, configurable N-day, agenda, and resource-day views. Week/day/days/resource already share a time-grid renderer; merely grouping their names earns no claimed savings.
- Preserve fixed/natural month rows, hidden weekends, outside-day visibility, week numbers, off-day appearance, background events, multi-day segmentation, deterministic lanes, overflow disclosures, and timed overlap packing.
- Preserve day/resource header order, Unassigned columns, slot geometry, local/gutter time labels on DST days, now indication, and date-jump behavior.
- Preserve current/render/active/fetch public ranges. `fetchRange` has active-range values but is separately cloned at the boundary; it need not be independently maintained internally.
- Preserve `validRange` clipping, title formatting, enabled-view reconciliation, empty resource cases, and navigation at civil-domain boundaries.
- Empty grid views retain cells and interaction surfaces; empty agenda may replace its content. Loading and disabled states preserve their distinct navigation, selection, and mutation behavior.
- Preserve contained/page scrolling, sticky behavior, responsive overflow, RTL, and reduced-motion behavior.

### C05 — Definitions, occurrences, segments, and identities

- A definition ID is unique; invalid/duplicate definitions throw instead of being skipped.
- A singleton occurrence key remains the item ID. A recurring occurrence key remains the existing collision-safe encoding of source ID plus canonical original start.
- An exception replaces an occurrence's effective definition, not its original identity. Moving one occurrence does not rekey it to the displayed date.
- Preserve exception overlay when an exception moves into or out of the visible range, including suppression of its original placement.
- Preserve segment keys and public segment flags where observable; a multi-day/resource rendering is a projection of the same occurrence.
- Preserve input order and public source-object references where the baseline exposes them. Do not deep-clone the whole collection or reconstruct all consumer fields to simplify the internal model.

### C06 — Recurrence and series edits

- Preserve structured and raw supported rules: daily/weekly/monthly/yearly, interval, count, inclusive until, weekdays and ordinals, month days, months, week start, exclusions and additions.
- Preserve the 1,000 output limit and 250,000 complex-count work cap, their actual counting semantics, and explicit failures. Never silently truncate output.
- Keep efficient rank/count paths for old daily/weekly series; replacing them with a scan from the original start is not acceptable compression.
- Custom expansion remains a synchronous external boundary with validation of its returned occurrences. The expansion helper itself propagates consumer exceptions, but surrounding adjustment-validation phases can wrap them as `invalid-adjustment`; preserve the phase matrix in section 7.6.
- Expander availability affects admission of raw syntax; expander identity affects projection. Preserve the existing invocation sites, per-origin verification ranges and active-range expansion phases unless a callback-contract change is explicitly accepted. A pure built-in validation cache is not permission to suppress custom calls.
- Raw and structured rule provenance remains available. A custom expander does not imply that built-in raw parsing should suddenly reject previously admitted custom syntax.
- Preserve `occurrence`, `series`, and `disabled` edit scopes. Series edits require the complete exception set already promised by the consumer and change source plus exceptions atomically.
- Raw RRULE series currently support only end resize. Structured selectors restrict date-crossing moves/start resizes. Preserve these refusals unless explicitly changed by Arnaud.
- Preserve conversion of exceptions already in the target representation, transformation of rule dates/origins, origin-collision checks, and forward/backward occurrence-key remapping.
- End resize preserves occurrence keys. A series move/start resize/conversion may rekey origins and must remap selection/focus consistently.

### C07 — Resources and availability

- Preserve flat input hierarchy semantics: duplicate IDs, missing parents, and cycles throw; only leaves accept assignment; parent and leaf order is stable.
- Keep legacy `resourceId` and multi-assignment `resourceIds` contracts. They are mutually exclusive. Unchanged edits preserve the relevant public representation; reassignment follows the current canonicalizing setter.
- One occurrence may render in several leaf columns. An internal move replaces only the grabbed projection's assignment; external resource drops replace the assignment according to current behavior.
- Unknown/unresolvable assignments retain current Unassigned behavior; do not invent a new admission rejection.
- Resize does not change resources. Preserve read-only resource policy and the exact global/resource business-window selection rules.
- Admit business windows once per owning configuration/resource identity, with explicit boundary policy: global windows allow `24:00` only as an end and reject duplicate day/window combinations with `invalid-prop`; resource-local windows reject `24:00`, do not perform the same cross-window duplicate check, and fail as `invalid-resource`. A shared representation/parser can retain these admission differences. Preserve optional weekdays and no-window behavior; do not normalize the differences or permit overnight ranges silently.

### C08 — Drafts, gestures, and user actions

- Move, both resize edges, slot drag, keyboard editing, two-click slot selection, external drop, and cancellation remain available as currently reachable through the public component.
- Preview does not publish `items`. Selection creation emits a range; it does not fabricate an item or open an editor.
- Month date movement preserves timedness/wall time; the explicit all-day band invokes conversion; timed placement respects snapping and grab offsets.
- Preserve timed elapsed duration, default/preserved conversion durations, and the recurrence-zone basis for preserved recurring duration.
- Preserve grab offset across multi-day segments, RTL all-day bars, resource projections, and overflow origins.
- Preserve pointer edge-flip resize versus keyboard fixed-edge rejection, and pointer no-op commit versus assisted no-op rejection, unless an explicit behavior change is approved.
- Preserve the differing consequences of incompatible range destinations: pointer/keyboard/two-click flows must not accidentally gain a common but different cancellation/re-anchor rule.
- Keep one terminal blocked notification rather than emitting `onInteractionBlocked` on every invalid hover. External drops outside the calendar remain silent where the baseline is silent.
- Preserve Escape, pointer cancellation, source removal, final-pointer flushing, auto-scroll, post-scroll hit testing, and compatibility-click suppression.

### C09 — Validation, errors, and consumer hooks

Preserve the current public error class, name, code, message, details presence/content and failure phase. Distinguish throwing, blocked callbacks and false returns. The twelve codes are `invalid-prop`, `invalid-item`, `duplicate-item-id`, `invalid-resource`, `invalid-view`, `invalid-time-zone`, `invalid-recurrence`, `unsupported-recurrence`, `recurrence-limit`, `invalid-adjustment`, `missing-target`, and `stale-transaction`.

Keep current failure precedence. The validated state projection checks configuration, selection, profile, resources, then the item index. Index options/range/zone/visible-days precede definition checks; basic fields across all definitions precede identity/rule relationships. Internal helpers may trust admitted values only when the new owner demonstrably establishes the invariant. Separating reactive ownership must not inadvertently change which error wins when several inputs are invalid.

Live item policy order is structural/editability, placement/range, business hours, overlap, then `validateItemUpdate`. Preserve special source rules such as API versus direct interaction and duplicate external IDs. Slot policy has its own public payload and custom validator. Share the underlying rules without forcing every source through checks it did not previously execute.

`resolveItemUpdate` is commit-time. A returned adjustment is untrusted input and is fully revalidated. Preserve phase-specific `invalid-adjustment` translation: some consumer failures are currently wrapped inside adjusted-candidate/recurrence validation, while failures outside those catches propagate. Section 7.6 is authoritative for this distinction. Do not catch and return plausible empty output, delay an already-required error, or execute callbacks twice for comparison.

Callback invocation counts and phases require trace tests. In particular, current normal and recurrence commit paths differ in when they repeat custom policy after a resolver returns without adjustment. A shared transaction implementation must express these differences explicitly until a change is approved.

### C10 — Controlled publication, stale state, revert, and history

- The current stale token is a generation object derived from exact `items` and `resources` array references, and currency is token-object identity. Equal contents in a fresh array create a new boundary. An observed A→B→A reference cycle does not resurrect an old token; comparing only the final pair of references is insufficient. View/date/zone changes alone do not become history invalidators.
- Keep immutable collection semantics. In-place mutation and arbitrary reuse of previously published arrays are not made supported by this redesign.
- Preserve the existing stale checks before commit, immediately after a consumer resolver and at entry to publication. There is a source-confirmed gap: final candidate validation can invoke a custom expander after the last check but before assignment. Closing this gap is a bounded correctness decision, not an already-proven baseline guarantee; see section 11.3.
- Publication order: assign the collection; capture its committed token; remap/clear selection and focus; create the change/revert transaction; invoke `onItemsChange`; stop if synchronously reverted or superseded; then record history, announce commit, and publish applicable selection changes.
- Revert is one-shot and requires the current committed token. Selection equality is required only when that commit created a selection transaction. It restores a fresh outer item array and does not emit a second `onItemsChange`; applicable selection restoration/notification precedes the revert announcement. A failed/stale revert throws.
- Preserve history limit/zero, redo invalidation, stale refusal, revert/history interaction, reactive capability queries, and current selection behavior during undo/redo.
- Copy requires clipboard enabled, an item selection resolving in the active index and non-background display; it does not check disabled/loading/read-only. It snapshots occurrence placement, strips the four recurrence identity fields and retains custom fields shallowly. Paste allocates a unique ID and retargets only a selected slot of the same temporal kind; it changes resources only for a resource-view slot. It does not convert kinds to fit a selection.

### C11 — Focus, keyboard behavior, announcements, and native events

- Preserve the grid's roving tab stops, occurrence controls, view-specific Home/End/arrows/PageUp/PageDown behavior, and logical RTL direction.
- Agenda retains natural list/button/disclosure semantics; it is not converted into a time-grid keyboard model.
- Restore exact focus where possible, then a compatible projection of the occurrence, then the appropriate nearest day/slot, then root. Keep offscreen/page anchors and detached-node safety.
- A shared semantic node index does not imply that all independent focus-restoration lifetimes can use one cancellation token. Preserve the existing newest-restore and occurrence-restore guarantees.
- Keep keyboard mutation shortcuts, clipboard/history shortcuts, and the exclusion of editable controls. Do not intercept arbitrary keys inside consumer content.
- Keep live-region lifecycle, localized messages, invalid/mode/proposal/commit/cancel/revert announcements, and deduplication behavior.
- `onItemClick` and `onSlotClick` receive the native event before default selection; `preventDefault()` keeps its effect. `onMoreClick` can stop the built-in disclosure.
- Preserve native event target/currentTarget behavior. Delegating public click callbacks to a root element can change `currentTarget`; retain leaf handlers where required.

### C12 — Composition, SSR, lifecycle, and performance

The sixteen snippet hooks remain `header`, `actions`, `item`, `itemTooltip`, `monthCell`, `dayHeader`, `timeGutter`, `allDay`, `overflow`, `overflowContent`, `agendaDetails`, `resourceHeader`, `nowIndicator`, `dragPreview`, `empty`, and `loadingContent`. Preserve payload types, default-content snippets, false-valued options, ready-made header snippets, and calendar-owned semantic wrappers.

Keep root attributes/events and theme overrides. SSR does not read browser globals or start timers. Constructor reconciliation and mount-delayed notifications remain distinct. Preserve clock initialization/teardown, timer cadence, DOM observer cleanup, portal ownership, and pending-focus cancellation at unmount.

Pointer frames must not rebuild the whole admitted collection or expand all recurrence. Reobserve geometry after scrolling/resizing. Source LOC savings do not prove bundle-size, allocation, or latency improvements. Measure those separately before removing an existing cache or introducing a broader projection recomputation.

## 5. Engineering rules for this implementation

These rules incorporate the supplied “Elegance — fewer independent truths, more expressive composition” standard so the next AI does not need access to the original attachment.

1. Start from required behavior and distinctions. Existing files and classes have no entitlement to survive.
2. Give each necessary fact one authority with a defined lifetime. Distinguish declared values, derived projections, current DOM observations, and committed state.
3. Resolve meaning once at the first boundary with enough information and authority. Consumers use admitted meaning rather than independently parsing public vocabulary.
4. Share structure when consumers must agree. Preserve different physical algorithms for month lanes, timed overlaps, and agenda rows.
5. Pass a cohesive owner when the consumer needs its invariant; otherwise pass the narrow immutable value. Do not replace parameter cascades with an implicit dependency bag. Keep DOM state, immutable model snapshots, and durable history in their own lifetimes.
6. Validate untrusted inputs at real boundaries. Revalidate callback adjustments and external results. Keep execution checks for existence, membership, staleness, and publication authority.
7. Treat DOM bounds, hit results, and attached elements as observations. Never turn one measurement into a permanent scheduling fact.
8. Keep identity, public payload shape, and atomicity independent of rendering pieces, batching, or internal record packaging.
9. Capability does not grant authority: a cell's enabled appearance is not final permission to commit, and a child does not own history, rollback, or another owner's cleanup.
10. Add an abstraction only when it removes conflicting ownership or repeated semantic rules for real consumers. No generic node interpreter, plugin system, event bus, command framework, or family of single-method wrapper classes.
11. Keep precise unions for temporal kind, draft kind, and accepted/rejected/pending resolution. Do not reduce types to unrelated nullable fields that permit impossible combinations.
12. Remove superseded code and unreachable private mechanisms after proving reachability. Keep required behavior witnesses and an external baseline specimen; do not ship a hidden fallback engine.
13. Count complete replacement costs. Moving code, changing formatting, shortening names, or hiding work in a shared directory is not a reduction.
14. Use the existing runtime, Svelte primitives, formatting, theme conventions, and validation/test tools. Verify installed signatures before changing their use. No new runtime dependency is assumed.
15. Stop expanding scope when the requested outcome is achieved. Record unrelated findings without repairing unrelated components.

For every extraction or new representation, write down the invariant it owns, the consumers that use it, the old mechanism removed, and a counterexample that would disprove the design. This explanation belongs in the implementation evidence, not in a new production framework.

## 6. Replacement architecture

### 6.1 The central pattern

Treat the calendar as an editable schedule projected onto one of three explicit surfaces. A surface describes what exists in the current view. A draft describes an uncommitted edit. A prepared batch describes an atomic committed change. These are different facts with different lifetimes.

```text
public inputs
    ↓ admission, with source identity retained
schedule + resources + configuration
    ↓ occurrence projection for the active profile
MonthSurface | TimeSurface | AgendaSurface
    ├─ renderers
    ├─ semantic hit destinations
    └─ navigation and focus identities

source + operation + destination
    ↓ pure edit projection and live policy
active draft
    ├─ local draft layout and cursor preview
    ├─ accessible announcements
    └─ commit request
          ↓ recurrence materialization where required
        prepared batch → resolver/revalidation → guarded publication
                                                   ├─ public change
                                                   ├─ history
                                                   └─ guarded revert
```

This is not a generic scene graph, command bus, or new calendar framework. The existing component remains the public owner. Month lanes, time overlaps, and agenda grouping keep their own concrete algorithms and markup. Shared code owns the facts those algorithms' consumers must agree on.

The expected reduction is realized only when repeated reconstruction disappears: a renderer no longer rebuilds accessibility meaning; a drag handler no longer encodes a target that another handler parses; preview no longer invents a second all-day layout; a mutation reuses admitted pure facts without suppressing required external validation phases. Moving those functions into new files is not evidence of savings.

### 6.2 Minimal internal vocabulary

The names below describe proposed responsibilities, not additional public exports. Reuse or rename existing files when that is smaller. Do not mechanically create one class or file per row.

| Internal value         | Meaning and invariants                                                                                                                                      | Explicitly not its job                                                            |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Admitted configuration | Validated view options, zone/locale context, canonical business windows and temporal conversion options                                                     | DOM size, history validity, consumer callback execution                           |
| Admitted collection    | Ordered definitions, ID lookup, source/exception relationships and normalized built-in recurrence; preserves consumer objects and resource-assignment shape | Current view, rendered segments, mutable shadow copy of `items`                   |
| Resource model         | Validated hierarchy, ordered leaves, assignment resolution, read-only and availability facts                                                                | Independent item validation or duplicate business-hour parser                     |
| Temporal span          | Either an instant interval or a civil-date interval; kind is explicit                                                                                       | Inferring all-day status from null fields or rendering height                     |
| Occurrence             | Definition/source identity, original start, effective span and effective definition                                                                         | One particular DOM element, month segment or resource column                      |
| View profile           | Navigation anchor, current/render/active ranges and visible civil days                                                                                      | Item admission or browser measurements                                            |
| Base surface           | One concrete view's rows/columns, occurrence placements, slot/destination identities and navigation coordinates                                             | Pointer coordinates, editing state, public notifications                          |
| Edit draft             | Frozen source facts, operation, original model token, candidate and pending/accepted/rejected resolution                                                    | `HTMLElement`, `DOMRect`, timers, history or full series expansion on every hover |
| Prepared batch         | Exact affected before/after definitions, candidate collection, identity remapping and public-change facts for one commit                                    | Owning consumer state or bypassing stale checks                                   |
| Model token            | Generation object derived from observed `items` and `resources` references; compared by object identity                                                     | A catch-all version incremented for date, view, locale or policy changes          |
| DOM lease              | A mounted element associated with a semantic identity and calendar instance                                                                                 | Scheduling truth or permanent geometry                                            |

Prefer a tagged internal temporal representation equivalent to `instant(startMs, endMs)` and `civil(startDate, endDate)`. The important property is that civil arithmetic cannot accidentally become millisecond arithmetic. This is a design hypothesis to test, not permission to rewrite every proven date helper. Use current zone/date helpers as the implementation core where they already own the correct rule.

This representation must replace an existing schedule/hydration layer, not sit beside the already-discriminated occurrence type as a third model. Likewise, evolve the current collection-mutation shape into the prepared batch rather than wrapping it, and reuse existing DOM registry mechanisms where they already express the required lease semantics.

Preserve the original public definition as the authority for custom fields and exposed source references. Adapt internal spans to public `Date`/date-string payloads at public boundaries. Clone public mutable dates where the current boundary does; do not create a public cache whose `Date` objects consumers can corrupt.

Definition identity, occurrence identity and projection identity remain distinct:

- Definition: the consumer's item ID.
- Occurrence: singleton ID, or source ID plus canonical original start. An exception's displayed start does not replace its origin.
- Projection: occurrence identity plus the relevant day/segment/resource/disclosure position, using collision-safe construction.
- Destination address: stable date/all-day/time-axis identity in the active surface, not a serialized public slot. A pointer-resolved instant on an axis is an ephemeral value.
- Navigation node: a header, activation slot or occurrence-control projection linked to the appropriate surface facts. It is not necessarily a drop destination.

### 6.3 Admit once, project as needed

Split the current large reactive model by actual invalidation dependencies, while preserving its ordered failure boundary:

1. Validate configuration and selection in the current order; derive reusable admitted configuration.
2. Build/validate the profile from navigation and profile options.
3. Admit resources from their owning input identity.
4. Validate index options, then admit definition fields and source/exception relationships. Reuse pure admission only when its inputs are unchanged, including custom-expander availability for raw rules.
5. Verify exception origins and expand/project occurrences for the requested profile, with custom-expander identity and all applicable zone/range inputs accounted for.
6. Build the active base surface from occurrences, profile, resources and relevant visual options.
7. Derive presentation visibility from measured capacity, and a small draft projection when an interaction changes.

Represent these as a few Svelte-derived values with precise dependencies, not a hand-built cache invalidation framework. The state boundary can evaluate separately owned values in the required error order; dependency separation does not require reordering failures. A policy callback changing may affect policy evaluation without invalidating unrelated pure item admission. A view change may rebuild projection without reparsing each built-in definition. Pointer movement must not invalidate steps 1–6.

Custom expansion is an external executable boundary, not a normalizable declaration. A raw string is admitted differently when a custom expander exists, so caching admission by `items` alone is wrong. Changing the expander function also changes projections. Exception-origin verification invokes expansion with per-origin ranges before active-range expansion; queries, selection verification and candidate validation can invoke fresh expansion too. Preserve these phases, output/error validation and callback traces. Reuse proven pure work; do not memoize away external execution or call a callback and ignore its new result merely to reproduce a count.

### 6.4 Surfaces are concrete data, not a renderer language

| Surface         | Owns                                                                                                                                        | Shared consumers                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `MonthSurface`  | Week rows, visible/enabled day cells, date destinations, segments, lane placements and week labels                                          | Month renderer, day navigation, pointer hits, range highlighting, draft lane layout                 |
| `TimeSurface`   | Actual day/resource columns, all-day lanes, instant windows and slots, labels, business windows, overlap placements and now-position inputs | Week/day/days/resource renderer, timed navigation, pointer hits, scrolling and timed/all-day drafts |
| `AgendaSurface` | Ordered day groups, occurrence rows, disclosure inputs and activation identities                                                            | Agenda renderer, natural focus/activation, public snippet payloads                                  |

Use existing layout packers first. The first change is ownership of their inputs and outputs, not an unproven new packing algorithm. Month auto-overflow depends on measured height: keep stable lanes in the base surface, then derive visible/hidden membership from those lanes and the current capacity observation. Preserve the baseline premeasurement fallback, overflow-row reservation and temporary draft lane allowance. This small presentation projection needs no new controller or independent schedule interpretation. A renderer must not reconstruct resource semantics, temporal placement, enabled destinations or navigation order from scratch.

Keep three destination meanings:

- **Date destination:** move to a civil day while preserving the source's timed/all-day nature; appropriate to month cells.
- **All-day destination:** explicitly place/convert into the all-day band.
- **Instant destination:** explicitly place/convert at an instant in a timed column.

Resource context belongs to the destination where applicable. An item edit consumes destination meaning, never `view === 'month'` as a repair for missing meaning. Public slot selection still produces its existing all-day/timed slot payload: a month date destination can yield an all-day selection without becoming a forced all-day item conversion.

Construct stable destination addresses, time-axis descriptions and navigation coordinates once per surface. Calendar-owned DOM wrappers expose opaque keys. Keep distinct destination IDs, navigation-node IDs and occurrence restore anchors, linked by the surface: headers and item controls can be focusable without being drop targets, and several controls can project one occurrence. Input and focus consume the same semantic authority, not necessarily the same key or registry.

For timed pointer hits, a column/axis address plus its current rectangle maps pointer Y continuously to an instant, then applies the current snap/clamp rule. Do not pre-enumerate every possible pointer destination. Keep discrete click/keyboard activation slots distinct: their click-duration interval is not necessarily the snap-duration interval used by pointer slot creation. Both consume the same axis and conversion authority.

Stable IDs must survive unrelated updates, distinguish both instants in a repeated DST hour, and remain isolated between two calendar instances. Do not use array position as durable occurrence identity.

### 6.5 Editing algebra and draft state

Keep pure edit projection for move, resize-start, resize-end and slot extension. Conversion, resource reassignment, grab offsets and placement equality are subordinate rules, not necessarily new operations or owners. A projector receives admitted source facts, an explicit command and a semantic destination. It returns a candidate or a typed refusal. It neither publishes nor invokes the commit resolver.

Some distinctions belong in commands because they express real behavior:

- Pointer resize permits crossing and changes the effective edge; keyboard resize retains the edge and rejects crossing.
- A pointer drop may commit an unchanged placement where assisted editing refuses a no-op.
- Slot extension has different pointer, keyboard and two-click transitions at incompatible destinations.

Do not erase these distinctions merely to make a single function signature shorter.

The coordinator needs only idle, item-draft and slot-draft states, with discriminated resolution: pending; accepted with candidate; rejected with reason and the candidate when one exists. Store the original source/projection and model token at begin. The source snapshot must survive a source element being unmounted or an overflow panel closing.

Input adapters request transitions: begin, point/step, commit, cancel and boundary changed. They never write draft internals. Derive preview validity and announcement inputs from the resolution. Do not mirror operation, active identity and validity into a second accessibility state machine.

Live recurrence editing projects the interacted occurrence and checks current policy. Full source/exception transformation and `getExceptionId` execution remain commit-time. A draft is not an eagerly materialized series batch.

### 6.6 Browser runtime and focus lifetimes

The preferred, experimentally gated transport is one shared pointer runtime per calendar and a small host per DOM island. If internal native-to-pointer parity fails, retain a thin native item sensor and the pointer slot sensor, both feeding the same semantic draft. The invariant is shared semantic ownership, not a mandatory transport count. Inspect and reuse the installed shared pointer primitive before extending it. A new dependency is not part of the plan.

The main surface and built-in overflow content are separate DOM islands; Popover content can portal outside the root. They share one active calendar session. A root-only listener is insufficient. There can be zero to many overflow host leases: a custom `overflowContent` can omit or invoke default content, potentially more than once. Detaching the source host must not by itself destroy a calendar-owned active continuation that should survive source unmount.

Pointer runtime responsibilities are activation, pointer capture, latest-point scheduling, hit testing, compatibility-click suppression, auto-scroll and cleanup. Retain the existing native external-drag attachment/ingress contract. Migrating internal item dragging from native DnD to pointer handling is a hypothesis requiring browser proof; it is not an automatic consequence of inventing the draft state.

Keep a browser pointer session separate from the semantic draft: a candidate pointer press and touch-delay timer can exist before activation creates a draft. Store numeric source visual observations needed by preview width/height/min-height in that runtime, not in the schedule. These observations may outlive the source DOM element for the duration of a gesture; target geometry remains current and remeasured.

Preempt an existing keyboard/two-click edit only when the pointer candidate activates, not on an ordinary nonactivated press. A tap must not announce cancellation or suppress its click merely because a pointer listener observed it. A rejected hover remains nonterminal and may become accepted again. Capture must preserve the pressed item/resize-handle origin, stopped overflow-trigger events and snippet behavior; do not blindly capture on the island root.

Keep native leaf click/double-click handlers where they supply public events. Delegation must not change `currentTarget`, `preventDefault`, editable-control exclusions or consumer snippet behavior.

At most one scheduled pointer update is pending. Flush the final position before commit. While scrolling, recompute the hit even if the pointer has not moved. Preserve current auto-scroll edge/speed behavior unless measurement supports an approved change. Measure rectangles when needed; do not store them as semantic destinations. The cursor preview must not intercept pointer events.

When date/view/zone changes replace a surface during an edit, keep transaction currency separate from presentation lifetime. U01 must characterize whether each input mode re-resolves a destination, temporarily loses its presentation lease while retaining the semantic candidate, or cancels for a specific lifecycle reason. Implement that result explicitly; do not retain dangling DOM references, add a surface epoch to the model token, or report an unrelated surface change as stale.

| Lifetime                      | Owns                                                                                            | Ends or invalidates when                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Calendar instance             | Coordinator, history, occurrence-focus anchor, live-region owner, external ingress identity     | Unmount                                                                                    |
| Accepted collection/resources | Model generation plus admitted declarations                                                     | Observed owning references change; admission additionally depends on expander availability |
| Active profile/surface        | Concrete projection and navigation data                                                         | Relevant model/profile/visual inputs change                                                |
| DOM island/lease              | Mounted host, element association and current viewport observation                              | Element, panel or view unmounts                                                            |
| Navigation restore            | Newest day/time restoration revision and anchor; survives its requested paging/profile change   | Successful restore, supersession, unrelated transition as characterized, or unmount        |
| Occurrence restore            | Independent restoration revision and projection hint; multiple mounted controls allowed         | Superseded occurrence restoration or unmount                                               |
| Browser pointer session       | Pre-activation press/timer, pointer capture, source visual observations and current coordinates | Release, cancellation, rejected activation, terminal draft or calendar-instance unmount    |
| Semantic edit draft           | Frozen source, model token, operation and resolution                                            | Commit, terminal rejection, cancellation, invalidation or unmount                          |
| Animation frame               | Latest input point or auto-scroll work                                                          | Frame executes or owning session ends                                                      |

Also make these existing browser lifetimes explicit without creating a class for each: root focus-fallback lease; page/contained scroll-host lease; auto-overflow measurement observer; post-pointer compatibility-click token/timer; and pending announcer microtask revision. Their cleanup follows their actual owner. Click suppression can outlive pointerup and must be consumed, superseded, timed out or canceled at unmount.

A small lease registry is justified for asynchronous mounting, duplicate occurrence controls and portals. Removing semantic duplication does not mean pretending DOM lifetime can be removed. In particular, occurrence restoration and day/time restoration must not cancel each other simply because both consume the surface.

Coordinate calendar restoration with the existing Popover focus scope and overflow trigger restoration. Closing an overflow panel must not cause two scheduled owners to fight over the final focus. Keep selection and the periodic now position as cheap presentation overlays; neither should rebuild the structural timed placements solely because it changed.

### 6.7 Preview as a local projection

Use the normal geometry owners, with an explicit preview policy:

| Accepted pointer edit                          | Placement preview                                                                   |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Move into month or a non-resource all-day band | Local lane insertion in the affected row/band                                       |
| Move into a resource all-day band              | Overlay; do not repack ordinary lanes                                               |
| All-day resize                                 | Overlay; do not introduce move-style insertion                                      |
| Timed placement                                | Overlay from the target column's instant geometry; no ordinary timed-overlap reflow |

For lane insertion, exclude the source only from the affected row's packing, retain its original placement for the existing hidden/ghost behavior, and leave other rows' source placements alone. Preserve the temporary visible-lane/overflow allowance. Do not remove an occurrence globally just because one projection is being dragged.

For invalid drafts, retain the baseline invalid appearance and rejection feedback; there is no accepted placement indicator. A custom cursor preview may still show a rejected candidate. Keyboard/assisted highlighting retains its own baseline behavior; do not enable pointer-only insertion/overlays for every draft input mode.

The public `dragPreview` is a separate cursor-following composition hook. It retains its payload and customization; sharing drop-placement geometry does not eliminate it.

Do not rebuild the full surface per frame. A draft projection reads the stable surface and recomputes only the affected row/column placement. Any cache retained or introduced must have an identifiable owner, key and invalidation rule.

### 6.8 Recurrence: share meaning, retain efficient algorithms

Normalize built-in rule meaning once and let generation and counting use the same admitted selectors. Keep two justified operations: count/rank before an origin and enumerate candidates within a bounded range. Do not force efficient arithmetic ranking through a universal iterator starting at the series birth.

The recurrence budget includes parsing, normalization, recurrence-zone arithmetic, limits, raw provenance and adapters. It does not assume replacing all of this with a tiny third-party call. Preserve these easy-to-miss rules:

- The series anchor has special inclusion behavior even when selectors do not match it.
- COUNT is consumed before exclusions and visible-range clipping; exclusions do not refund it.
- Additional dates are not limited by the rule's COUNT/UNTIL, but still participate in exclusion and deduplication.
- Built-in order, inclusive UNTIL interpretation, exception suppression and origin identity remain stable.
- A custom expansion must return a valid array within the output bound, in the source's temporal kind; starts/origins, requested-range membership and uniqueness are validated at that boundary.

Read the current implementation to pin exact edge behavior before altering an algorithm. Compare pure fixtures for old series, sparse selectors, exclusions, moved exceptions and both DST transitions. Keep a slow small-range reference only in tests if useful, never as the production fallback for old series.

### 6.9 Atomic batches, not an event-sourcing framework

Keep one guarded publication owner for item-array assignment, public changes, history and revert. Normal edits and recurring edits prepare compatible batches but need not run identical prepublication policy phases. Add/remove/history may enter publication without invoking update hooks they do not currently use.

A prepared batch carries the complete candidate collection needed for admission and publication, the affected before/after facts needed for the exact public change variant, and any occurrence-key transform. Preserve whole-collection snapshots for undo/revert if that is the smallest correct use of the existing `useUndoStack`. Do not introduce patch replay or event sourcing solely to shorten a few mutation functions.

Share pure structural validation results only within the lifetime for which they are valid, including the current phase's profile/zone/expander dependencies. A consumer adjustment creates a replacement candidate/batch. Do not suppress the observable custom expansion performed by later validation phases. A consumer-controlled input replacement creates a new model token; never silently rebase a commit. Characterize and resolve the existing final-validation stale gap under section 11.3.

## 7. Behavior protocols the replacement must preserve

### 7.1 Admission and queries

Admission validates basic item fields before relationships/rules, preserves original source references, then creates indexes and projected occurrences. An explicit-range `getOccurrences` query projects that requested range; `getOccurrence` uses the active occurrence set. Public range/day queries return the current cloned boundary values. Preserve distinct date-limit errors, including a day query that cannot form a next-day exclusive bound.

`setView` validates the requested enabled view and any relevant N-day count, computes a valid next profile, and only then assigns. Preserve the current assignment order (`dayCount`, `view`, `date`) and notification order. `today` remains a no-op before mount or while disabled. `scrollToTime` remains unsuccessful in non-time views.

Disabled/loading behavior is method-specific. Do not add a global “disabled means every API is a no-op” rule. For example, current `copySelection` is governed by clipboard/selection/occurrence eligibility, not a blanket disabled guard. Verify each API at its own boundary.

| Operation                                 | Disabled                        | Loading                         | Other relevant boundary                                                           |
| ----------------------------------------- | ------------------------------- | ------------------------------- | --------------------------------------------------------------------------------- |
| `addItem`, `removeItem`                   | Blocked by API guard            | No loading-policy block         | Structural publication validation; no update resolver/policy                      |
| `updateItem`, `updateOccurrence`, `paste` | Blocked                         | Blocked by proposal policy      | Update resolver and source-specific policy apply                                  |
| `undo`, `redo`                            | Return false                    | Not blocked merely by loading   | Require current history generation                                                |
| `canUndo`, `canRedo`                      | Capability query remains active | Capability query remains active | Check stack and generation, not enabled state                                     |
| `copySelection`                           | No disabled guard               | No loading guard                | Clipboard enabled, active selected occurrence, non-background; no read-only guard |

Paste only retargets a same-kind selected slot and only reassigns resources for a resource-view slot. A different-kind or non-slot selection does not trigger an implicit conversion. Selection/navigation methods keep their separately characterized behavior; this table does not invent a common gate for them.

Preserve paste's short-circuit order: clipboard disabled returns false before the disabled guard; absence of a stored copy returns false before proposal/loading policy. Do not introduce blocked callbacks for a path that previously returned before reaching that boundary.

### 7.2 Normal edit commit

Preserve this observable ordering, expressing shared mechanics without erasing phases:

1. Check the original model token and, for replacement paths, exact source-object existence. Clipboard and external-drop proposals append a new definition and do not require `previousItem` to exist in the collection; they follow their duplicate-ID/admission rules.
2. Construct/admit the initial candidate and evaluate the applicable initial policy.
3. Invoke `resolveItemUpdate`, if supplied.
4. Check staleness immediately after the consumer callback, including a callback that returns false or an adjustment after replacing parent data.
5. Apply rejection or decode the adjustment through the existing `invalid-adjustment` boundary.
6. Prepare and structurally validate the candidate again, even when there was no adjustment. Only the adjusted case wraps failures from this validation as `invalid-adjustment`.
7. Run the normal path's final policy when its current resolver semantics require it, including the unadjusted-return case.
8. Check staleness and enter publication. Its current implementation checks the token, clones and structurally validates the collection once more, then assigns. The final-validation stale gap is an explicit decision in section 11.3.

Thus a successful ordinary path has three candidate-index validation phases, even with no adjustment. These can invoke custom expansion, in addition to other projection/selection work. Trace actual calls, ranges and failures before deduplicating: pure built-in work can be reused, but external execution and its results cannot be silently suppressed. Never invoke callbacks in both old and new implementations to compare them.

### 7.3 Recurring edit commit

1. Resolve source, original occurrence, scope and original token.
2. Materialize the occurrence exception or complete series transformation at commit-time.
3. Admit the candidate collection and evaluate recurring-policy constraints, including relevant resulting active-series occurrences.
4. Invoke the consumer resolver once at the existing phase, then check staleness.
5. If adjusted, regenerate/revalidate the batch and run the required policy again. If unchanged, preserve the recurrence path's current behavior instead of importing the normal path's extra final-policy invocation.
6. Enter common publication, which currently performs another candidate validation, then publish source and exceptions atomically with the proper change variant and key mapping. Recurring-policy evaluation can also create candidate projections; include those calls in the trace.

The custom item validator is not called once per transformed exception merely because a series batch has many records. Preserve its actual batch/proposal callback contract. Default exception IDs are exactly `${seriesId}--exception--${canonicalOrigin}`, where the origin is `instant-${milliseconds}` or `day-${YYYY-MM-DD}`. This is not the collision-safe public occurrence-key encoding. User-supplied exception-ID callbacks retain their phase and collision/error behavior.

### 7.4 Direct collection operations and history

Add, remove and history use the same publication guard, not necessarily the update-policy/resolver pipeline. Preserve existing admission and disabled checks for each. Removing a recurring source removes its exceptions; removing an exception removes that definition only. Undo/redo publish the established history change type and direction; they do not impersonate a new user move.

### 7.5 Publication, reentrancy and revert

1. Verify authority against the input token, clone and validate the candidate collection, then assign it. The baseline has no additional token check between that final validation and assignment; resolve the section 11.3 correctness decision before claiming stronger protection.
2. Capture the committed token; reconcile selection/focus and prepare the exact public change plus one-shot revert.
3. Call `onItemsChange` synchronously at its established point.
4. If the callback synchronously reverts, stop: do not record the reverted transaction or announce a successful commit.
5. If it replaces `items` or `resources`, report stale and stop the remaining transaction work instead of overwriting that replacement.
6. Otherwise record history and announce commit. If a selection transaction exists, notify it only while the current selection still equals its committed selection. A selection-only replacement by `onItemsChange` does not stop history or the commit announcement.

A valid revert restores a fresh array containing the prior item objects; it does not restore the exact prior outer array reference. It is conditional on the committed model generation and, only if this commit created a selection transaction, the committed selection. It is one-shot. It does not emit another `onItemsChange`; applicable selection/focus restoration and selection notification precede the revert announcement. Test synchronous and delayed use separately.

If `onItemsChange` throws, the baseline has already assigned items and performed its selection/focus remap; history, commit announcement and the final selection notification do not run. The error escapes. Do not invent rollback or catch it as “interaction blocked.” Characterize this partial-publication outcome explicitly.

### 7.6 Error translation is phase-specific

| Phase                                                                                 | Current consumer-failure behavior                                                                      |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Initial candidate expansion/policy; resolver itself                                   | Propagates the consumer exception outside any adjustment wrapper                                       |
| Normal second candidate validation without adjustment                                 | Propagates                                                                                             |
| Normal second candidate validation with adjustment                                    | Wraps as `invalid-adjustment`                                                                          |
| Normal final policy callback, including after adjustment                              | Thrown callback exception propagates; a returned refusal has the explicit adjusted/unadjusted handling |
| Adjusted recurring regeneration, candidate validation and recurring-policy evaluation | Failures inside the enclosing catch are wrapped as `invalid-adjustment`                                |
| Final publication candidate validation                                                | Propagates, including after an earlier adjustment                                                      |
| `onItemsChange`                                                                       | Propagates after assignment, with later publication steps skipped                                      |

Capture the exact messages/details and channels from each relevant source path in tests. A broad catch around the unified pipeline would change this matrix. Conversely, “consumer exceptions always propagate unchanged” is not the current whole-feature behavior.

### 7.7 Custom expansion is an observable boundary

Trace both per-origin exception verification and active/requested-range expansion. Include normal/recurring candidate phases, explicit queries, selected-occurrence verification, add/remove/history publication and parent-driven reprojection. Log callback inputs/results only in deterministic test fixtures, never user data in production.

Cacheability is not the same as transaction currency. A view/zone/profile/expander change can require fresh validation/projection in a later phase without making the items/resources generation stale. Use the inputs actually observed in that phase. If a proposed optimization needs a new purity or callback-count contract, identify that as a behavior decision rather than presenting repeated external execution as certainly redundant.

## 8. Dependency-ordered implementation units

### 8.1 Execution rules

Each unit ends with a coherent artifact and evidence. Update a task evidence file with status, changed ownership, deleted mechanisms, checks and deviations. Do not mark a unit complete based on an agent's summary alone.

The table gives dependencies, not a mandate to run every row serially. Parallel work is useful only after shared interfaces are settled and file ownership is disjoint. One integrating agent owns the active public component, transaction semantics and final validation.

| Unit | Outcome                                                      | Depends on                          |
| ---- | ------------------------------------------------------------ | ----------------------------------- |
| U00  | Reproducible baseline and preserved worktree                 | None                                |
| U01  | Behavior witnesses and callback traces                       | U00                                 |
| U02  | Falsifiable small architectural proof                        | U01                                 |
| U03  | Canonical admission and temporal/resource boundaries         | U02                                 |
| U04  | Single occurrence projection and recurrence rule authority   | U03                                 |
| U05  | Shared prepared-batch publication with exact source policies | U03, U04                            |
| U06  | Thin root/coordinator with separated reactive lifetimes      | U03, U05                            |
| U07  | Three concrete base surfaces                                 | U03, U04; interface agreed with U06 |
| U08  | Pure edit drafts and shared browser input runtime            | U05, U07                            |
| U09  | Surface-based focus, keyboard editing and announcements      | U06, U07, U08                       |
| U10  | Renderers and previews consume the replacement               | U07, U08, U09                       |
| U11  | Legacy deletion, documentation and public-package cutover    | U04–U10                             |
| U12  | Integrated behavior, browser, performance and LOC evidence   | U11                                 |

### U00 — Establish the reproducible starting point

**Scope:** read-only source/environment inspection and task-specific baseline evidence. No production changes.

**Work:**

1. Read applicable instructions and section 2. Record current HEAD, relevant dirty paths and the section 12 source count/digest.
2. Compare EventCalendar source to the audited identity. If it changed, identify the relevant deltas and update the working baseline; do not force it back to this document's snapshot.
3. Record installed Node/package-manager and framework versions from the workspace. Use the existing lockfile and dependencies; do not update them for this rewrite.
4. Run the current targeted calendar tests. Capture the exact command, exit status and any existing failure. Inspect public contract/package fixtures to know what they actually prove.
5. Preserve an external baseline specimen for pure differential tests and browser/performance comparison. Use an isolated source copy or worktree when necessary, accounting for relevant dirty source. Do not leave a second engine in the shipped calendar directory.
6. Create `EVENT_CALENDAR_REDESIGN_EVIDENCE.md` during implementation. Record the baseline and initially mark U01–U12 pending. Keep secrets, environment-file contents and unrelated diffs out of it.

**Done when:** the next agent can reproduce the baseline, distinguish task changes from user work, and state which existing checks were actually run. The current plan's measurements are not a substitute for this step.

### U01 — Pin contracts with feature-level characterization

**Scope:** tests and fixtures for C01–C12, primarily beside the existing EventCalendar tests, with browser cases in the established `e2e` suite. Preserve the existing framework.

**Work:**

1. Keep the existing focus/history cases and add the missing high-risk behaviors from section 9 before rewriting their owner.
2. Establish independent expected fixtures for temporal rules, occurrence identity, resource policy and transaction changes. Tests should exercise feature boundaries, not freeze private class or helper names.
3. Add deterministic trace recording for callback name, order, count, proposal values, array/object identity where contractual, thrown error and selection/focus outcome. Compare old and replacement runs separately; do not execute a consumer callback twice in a live component.
4. Cover normal and recurrence resolver paths, synchronous parent replacement, synchronous revert, delayed stale revert and consumer exceptions. Pin direct add/remove/history behavior separately from update behavior.
5. Add actual-DOM/browser witnesses for native event cancellation/currentTarget, overflow portals, slot selection, drag/resize and keyboard focus. JSDOM-only tests cannot prove native drag or layout behavior.
6. Add SSR and public generic/snippet/bind-this witnesses using the repository's existing patterns. Make a component fixture fail if custom item/resource data types are lost.

**Keep scope bounded:** use representative equivalence classes and explicit high-risk combinations, not the full Cartesian product of every option. Grow coverage when a changed owner exposes a previously untested rule. Do not build a generic test-scenario framework for this task.

**Done when:** every unit has named contract witnesses to preserve, critical timing/order differences are explicit, and new tests pass against the baseline or have a documented pre-existing discrepancy awaiting a decision. Do not change production behavior to make a guessed expectation pass.

### U02 — Prove the replacement can remove machinery

**Scope:** a reversible, isolated vertical experiment. It is not a second production implementation and does not change the public component by default.

**Work:**

1. Build the minimum month/time surfaces needed to represent one timed and one all-day source, a multi-assigned resource projection, and a date/all-day/instant destination.
2. Drive one pure edit draft through pointer and keyboard commands. Use its candidate for a normal-layout-derived preview and its surface identity for focus restoration.
3. Include a month-overflow source, a repeated-hour instant, pointer edge crossing, a keyboard rejected crossing, and one native external-drop ingress. These cases challenge the architectural boundary, not just a happy-path drag.
4. Use the existing lane/overlap and zone helpers. Do not rewrite recurrence or the full rendering system to make this experiment appear self-contained.
5. Compare semantic results, callback traces and browser interaction to the baseline. Count the complete experimental replacement perimeter, including types, adapters and any new shared utility.
6. Write the exact old mechanisms that become removable and the remaining counterexamples. Estimate the full-system cost from demonstrated boundaries, not by multiplying a trivial example's percentage.

**Proceed gate:** one destination authority works for rendering/hits/navigation; a draft contains no DOM geometry; previews reuse layout meaning; portal and resource identity survive; input differences remain explicit; and the replacement removes more mechanisms than it introduces.

**Revise gate:** view-name repair branches remain in edit math; a renderer rebuilds semantic targets; focus depends on pointer leases; the pointer change breaks native public behavior; or a generic surface interpreter is required. Revise the smallest responsible boundary and repeat the relevant proof. A thin DOM lease is allowed; serialized trusted domain payloads are not the intended fallback.

**Failure handling:** if pointer transport replacement does not preserve behavior, retain a minimal native internal transport while keeping semantic surfaces and drafts, count its full cost and revise the estimate. If the central ownership simplification itself fails, report the evidence and a revised proposal before committing to a broad rewrite. Do not quietly revert to the rejected 7–11% cleanup while claiming this plan succeeded.

**Done when:** the architecture is supported by a concrete specimen and counterexample tests. Transfer only justified production pieces into later units, then delete the throwaway code or keep it strictly outside the production graph as evidence.

### U03 — Own temporal, definition, resource and availability admission

**Scope:** existing `eventCalendar.date.ts`, `eventCalendar.items.ts`, `eventCalendar.resources.ts`, relevant configuration code in `eventCalendar.state.svelte.ts`, and narrowly named internal representation/availability files only where justified.

**Work:**

1. Introduce the smallest explicit instant/civil-span representation needed by real consumers. Retain proven civil/zone operations and public adapters.
2. Separate source admission from active-profile projection. Retain ordered consumer objects, unique-ID lookup, recurrence/exception relationships and assignment provenance.
3. Give business-hour meaning one owner, retaining the two admission policies in C07. State admission, resources, visible shading and mutation policy consume admitted windows rather than parsing independently.
4. Build the resource hierarchy once per relevant input identity. Preserve leaf order, Unassigned semantics, read-only policy and multi-resource projection behavior.
5. Keep validation order and error boundaries. Remove downstream guards only when the upstream invariant is now demonstrated by tests.
6. Document invalidation inputs for each derived value. Do not turn the new temporal model into a second editable collection.

**Expected deletions:** repeated business-hour interpretation, redundant public/internal schedule round trips, repeated item/assignment field admission and profile-triggered re-admission where unnecessary. Charge every new adapter to this unit's budget.

**Validation:** C02, C03, C05, C07 and C09; invalid data precedence; zero-length timed versus positive all-day spans; resource cycles/parents/leaves; source/custom-field reference behavior; civil boundaries; DST gap/repetition; shading/policy agreement.

**Done when:** admitted values have one authority and real consumers use them. No downstream consumer reparses an already-admitted time, rule or business window without a new boundary.

### U04 — Unify occurrence projection and recurrence rule meaning

**Scope:** `eventCalendar.items.ts`, `eventCalendar.recurrence.ts`, related date helpers and exception indexing. Do not change consumer expansion APIs.

**Work:**

1. Project directly from admitted definitions to one internal occurrence representation. Adapt to public occurrences/segments only where needed, keeping identity and source references intact.
2. Normalize supported built-in rule meaning once; preserve raw versus structured provenance and custom-expander admission semantics.
3. Make candidate enumeration and rank/count share selectors and civil arithmetic without collapsing their efficient algorithms into one scan.
4. Build source/exception lookup once. Correctly suppress original positions and include exceptions moved into the requested range even when the source occurrence was outside it.
5. Keep active and explicit-query projection paths consistent without caching mutable public payloads or changing custom callback timing.
6. Preserve deterministic sorting, segment identity, range clipping, caps and errors. Test distant series before altering count optimization.

**Expected deletions:** ephemeral schedule-to-public hydration layers with no independent consumer, duplicate selector interpretation, repeated exception search/overlay and independently recomputed origin keys. Do not claim the recurrence parser or safety caps can disappear.

**Validation:** C03, C05, C06 and C09; count/exclusion/addition order; selectors and raw rules; custom output validation and thrown exceptions; moved exceptions; all-day and timed recurrence zones; old daily/weekly series; complex cap boundaries; explicit-range queries.

**Done when:** each occurrence/origin has one authority, efficient old-series behavior is preserved, and the same projection supplies active rendering, queries and commit validation without observable extra expansion calls.

### U05 — Replace duplicate commit paths with prepared batches

**Scope:** `eventCalendar.mutations.svelte.ts`, `eventCalendar.recurrenceMutation.ts`, `eventCalendar.records.ts`, `eventCalendar.interactionResolution.ts`, and their state/history integration.

**Work:**

1. Define the minimal prepared-batch shape carrying affected facts, the candidate array, key transforms and precise public-change information. Keep direct collection publication distinct from update policy.
2. Turn recurrence transformation into a commit-time batch producer. Keep exception IDs, source/exceptions atomicity, raw/structured restrictions and origin mapping.
3. Share candidate admission, adjustment decoding, boundary checks and publication. Express the normal/recurrence callback-phase difference as a small explicit policy difference, not two near-identical orchestration trees.
4. Reuse pure validated candidate work inside one safe phase, with complete cache dependencies. Preserve custom expansion/validation execution and its returned evidence at every required phase. Rebuild when adjustment or relevant configuration changes the candidate meaning; apply generation guards and the resolved final-validation-gap decision.
5. Keep existing undo-stack semantics, full-snapshot safety, reactive capabilities, one-shot revert and selection/focus remapping. Do not implement a new history storage model.
6. Retain every public change variant and source, including recurrence exception add/update, series before/after source and exception sets, and history direction.

**Expected deletions:** repeated full candidate rebuilding in the same phase, duplicate publication/revert/history code, duplicate recurrence transaction plumbing and public-record conversions no longer needed. Do not remove required callback invocations to meet a line budget.

**Validation:** C06, C08, C09 and C10 plus section 7 traces. Test every public change family, false/unchanged/adjusted/throwing resolver, parent replacement during resolver/publication, history limit zero, stale resources, one-shot and synchronous revert, exception-ID collision and key remapping.

**Done when:** one owner publishes a collection, histories/reverts are guarded, and live drafts have not acquired full-series materialization or commit-time callbacks.

### U06 — Reduce the root to bindings, lifecycle and coordination

**Scope:** `EventCalendar.svelte`, `eventCalendar.state.svelte.ts`, root/context wiring and header/navigation integration. Do not alter public types to accommodate implementation convenience.

**Work:**

1. Replace the coupled model derivation with configuration/admission/profile/occurrence dependencies from section 6.3.
2. Keep bound state, root attributes, native handlers, public methods, default initialization and parent-versus-user notification semantics in their established public owner.
3. Delegate domain work to the admitted model, surfaces and transaction owner; remove repeated getters that reinterpret already-derived facts.
4. Preserve constructor versus mount notification phases, navigation assignment order, ready-made header snippets, selection reconciliation, clock lifecycle and `scrollToTime` behavior.
5. Keep cleanup explicit. Browser hosts, timers, observers and pending focus work must not be created during SSR.

**Expected deletions:** item/resource admission coupled to view changes, duplicate range/label construction, coordination wrappers with no invariant, and root script that recreates child-owned projection facts. Do not just move the full old state object behind a new name.

**Validation:** C01, C02, C04, C10 and C12; all 25 API methods; controlled/uncontrolled changes; initialization callbacks; enabled-view reconciliation; minimum/maximum date navigation; SSR and mount/unmount.

**Done when:** the root coordinates independently meaningful owners, source admission does not rerun for pointer changes, and every public method retains its result/error/notification behavior.

### U07 — Construct the three base surfaces

**Scope:** `eventCalendar.layout.ts`, `eventCalendar.timeGrid.ts`, `eventCalendar.agenda.ts`, and relevant scripts currently in month/time/agenda components. A narrowly scoped `eventCalendar.surface.ts` may own shared identities/types; avoid a large universal optional-field record.

**Work:**

1. Agree the minimal destination/projection identity contracts with input and focus consumers before parallel implementation.
2. Build pure month rows/cells/lanes; time columns/all-day bands/actual-instant axes/activation slots/overlap placements; and agenda groups. Derive month visible/overflow sets from lanes plus current measured capacity, not as immutable admission facts.
3. Include navigation coordinates, public-slot boundary facts and enabled-state inputs consumers currently reconstruct. Keep destination addresses, navigation IDs and occurrence anchors distinct but linked. Keep now/selection/measurement overlays separate from structural layout.
4. Distinguish date/all-day/instant destination meaning. Construct stable time axes once, then resolve ephemeral pointer instants through current geometry. Preserve different click versus snap durations, repeated-hour instants and resource-projection identities.
5. Reuse current packers and tie-break ordering first. Compare output and performance before removing caches or changing algorithms.
6. Introduce at most one temporary private bridge to legacy target consumers where migration requires it. Record its deletion in U11.

**Expected deletions:** renderer-local columns/buckets/target maps describing the same thing, duplicate focus-target construction and repeated label/slot interpretation. The three real layout algorithms remain.

**Validation:** C03–C07; SSR surface construction; fixed/natural month grids; hidden/outside days; cross-week segments; deterministic overlaps/lanes; overflow membership; actual 23/24/25-hour day geometry; resource order; unrelated-update ID stability.

**Done when:** each destination meaning/time-axis mapping has one authority and rendering, focus and input consume it without rebuilding temporal/resource meaning. Dynamic pointer instants are resolved, not pre-enumerated. Base surfaces have no browser globals or pointer-state dependency.

### U08 — Introduce edit drafts and cut over input ownership

**Scope:** `eventCalendar.interactions.svelte.ts`, `eventCalendar.externalEvent.ts`, local item/slot attachments, narrowly scoped pure-edit and pointer-runtime files if the experiment justified them. The public external attachment remains available.

**Work:**

1. Extract pure edit operations and make current callers consume them before replacing transport. Pin source snapshot, grab offset, destination meaning and command-specific crossing/no-op behavior.
2. Implement idle/item/slot draft transitions and the existing discriminated resolution. All preview, policy and announcement consumers read this draft rather than mutating parallel status fields.
3. Introduce shared input hosts for the main surface and zero-to-many built-in overflow leases. Follow the transport branch proven in U02. Use opaque destination/source identities and current DOM observation; remove internal JSON domain round trips.
4. Preserve slot-only activation options, touch delay/tolerance, native external ingress and consumer-created external item validation. Do not claim new item touch coverage from API choice alone.
5. Implement pre-activation versus active-session arbitration, one latest-point scheduler, final-point flush, stationary-pointer re-hit during auto-scroll, Escape/cancellation and post-gesture click suppression. Keep two calendars isolated and preserve input-specific behavior during surface replacement.
6. Cut over input sources incrementally behind one private migration seam. Only one path may invoke real policy/resolver/publication callbacks at a time.

**Expected deletions:** repeated per-cell internal gesture orchestration, target codecs, pointer-specific placement math, parallel assisted interaction state and verified unreachable private branches. Recheck reachability before removing the unstarted assisted item mode or timed-month resize path.

**Validation:** C08–C12; pointer/keyboard proposal parity with documented differences; external invalid/duplicate items; source unmount and portal close; drag out/back; Escape and native cancellation; view replacement mid-gesture; resource reassignment; page/contained scroll; no callbacks per invalid hover beyond the current contract.

**Done when:** draft state contains no DOM geometry, browser resources have explicit cleanup, input never publishes directly, and pointer updates do not rebuild admission/recurrence/base surfaces. If a native internal transport remains for parity, it is thin, explicit and counted.

### U09 — Make focus and announcements consume semantic identities

**Scope:** `eventCalendar.a11y.svelte.ts`, occurrence-control registrations, navigation leases and keyboard entrypoints. Preserve localized message keys and public semantics.

**Work:**

1. Derive navigation from the active surface; delete duplicated day/time target construction.
2. Preserve separate navigation and occurrence restore revisions, including navigation anchors across the profile transition they request. Keep multiple controls for the same occurrence, projection hints, portaled ownership and pending nearest-target fallback; coordinate with Popover/overflow-trigger restoration.
3. Route keyboard edit commands through the draft coordinator. Keep normal navigation, clipboard/history shortcuts and editable descendants distinct.
4. Derive proposal/invalid/mode announcements from draft transitions and semantic placements. Retain commit/cancel/revert announcement timing and deduplication.
5. Keep minimal DOM leases where needed for mount/unmount and duplicate nodes. Invalidate all pending restoration at teardown.

**Expected deletions:** mirrored active operation/occurrence/status, independently constructed navigation targets and repeated registry setup without distinct semantics. Do not merge independent restore lifetimes to save a counter.

**Validation:** C08, C10 and C11; all existing focus tests; simultaneous navigation/occurrence restoration; paging/view switches; recurrence rekey; selected occurrence removal; overflow open/close; multi-resource duplicate projections; stale detached elements; unmount before scheduled restore; announcement trace deduplication.

**Done when:** month/time have the intended roving tab stops, agenda remains a natural list/disclosure, focus does not depend on pointer registries, and no second edit-state authority remains.

### U10 — Make renderers and previews thin consumers

**Scope:** all existing EventCalendar `.svelte` renderers plus `eventCalendar.allDayInsertion.ts` and layout integration. Prefer replacing component scripts over inventing parallel component families.

**Work:**

1. Migrate agenda, then month, then week/day/days, then resource-day rendering to their surfaces. Keep semantic wrappers, native leaf events and all sixteen snippet payloads/default content.
2. Keep visual sizing/measurement in the renderer or its DOM owner; keep meaning in the surface. Preserve auto overflow, scroll containers, sticky layout, geometry and disabled/empty/loading differences.
3. Replace the separate insertion algorithm with local draft layout using the normal lane owner, only for the move cases in section 6.7. Preserve resource/all-day-resize/timed overlays, target-row source ghost behavior and temporary overflow allowance. Do not reflow other rows or ordinary timed overlaps.
4. Keep custom cursor `dragPreview`, tooltip closure during editing, invalid appearance, range highlighting and reduced-motion behavior.
5. Remove remaining script-local semantic reconstruction immediately after each renderer switches. Avoid converting clear small markup branches into a generic component renderer.

**Expected deletions:** duplicated view scripts, separate preview lane interpretation, fixed indicator geometry derived independently of the target layout, and obsolete local target registrations. Legitimate markup and accessibility attributes are not savings targets by themselves.

**Validation:** C01, C04, C07, C08, C11 and C12; per-view browser cases from section 10; public snippet composition including omission of default overflow content; layout before/during/after edit; narrow container/RTL/resource overflow; current theme keys.

**Done when:** all six public views use the three surfaces, preview and normal layout agree on geometry, and DOM/render code no longer interprets schedule or mutation semantics.

### U11 — Delete legacy paths and verify the package surface

**Scope:** the complete EventCalendar production import graph, its MCP/documentation page, narrowly relevant consumer/type fixtures and generated contract outputs only through the generator.

**Work:**

1. Delete the old target union/codec, duplicate destination constructors, duplicate navigation data, superseded preview engine, inactive controllers, migration seam, throwaway production files and temporary compatibility adapters.
2. Search imports and production reachability. There must be one live owner for each semantic fact and one publication path, not a hidden old implementation retained for confidence.
3. Compare exports, public props/types, error codes, API methods, snippet payloads and 44 theme parts with C01–C12. Test generic custom item/resource fields and `bind:this` through the public package, not just source aliases.
4. Change calendar examples to `entasis/event-calendar` where they currently use private source paths. Make example/type validation actually exercise the EventCalendar examples; the current doc-fence checker does not automatically validate tilde-fenced MCP examples.
5. Resolve calendar documentation's CSS-variable guidance against the current theme ownership rules. Preserve the public theme parts; do not promote private `--event-calendar-*` variables into a new public API merely because older prose advertised them.
6. Run the manifest generator only when public entrypoint documentation/metadata changes require it. Inspect generated deltas and preserve pre-existing user edits to the manifest/contract files. Do not manually patch generated inventories, aliases, navigation, exports or skill mirrors.
7. Update applicable project documentation only for durable architectural or operational changes. Do not rewrite the constitution or turn `AGENTS.md` into a task diary.

**Expected deletions:** every temporary compatibility layer and superseded owner. Old comparison specimens may remain outside the shipped graph as test evidence, not as runtime fallbacks.

**Validation:** public-surface comparison, focused type/snippet fixtures, doc/example checks, component contract, package consumer and actual packed-library checks. A manifest symbol-import test alone does not prove generic/snippet/instance typing.

**Done when:** no old/new engine pair remains, the packed public component is exercised, and documentation describes the implementation's actual contract.

### U12 — Qualify, count and hand off the completed redesign

**Scope:** validation and evidence; bounded fixes in the changed calendar path only.

**Work:**

1. Run the targeted calendar suite, integration/browser cases, SSR/type checks and relevant package gates in section 10. Run broader checks sequentially, respecting generated-file/build concurrency restrictions.
2. Repeat baseline performance scenarios on the same environment with warm-up and multiple samples. Compare construction, navigation, recurrence projection and sustained input separately.
3. Exercise all public views, main/overflow sources, native external ingress, controlled reentrancy, DST, multi-resources, RTL, contained/page scrolling and teardown. Record unverified physical/mobile behavior honestly.
4. Produce the final LOC ledger from section 12, including all new shared production code and any remaining adapters. Explain each ownership deletion and any budget overrun.
5. Review the changed scope against the engineering rules. Remove dead code, unused exports, temporary logging and untracked task TODOs created by this work.
6. Record final commands/results, before/after source identity, remaining risks and any user-approved deviations. Give the actual measured reduction, not the planned range as an achievement.

**Done when:** the completion checklist in section 13 is satisfied. If a gate remains blocked by an unrelated baseline failure or unavailable browser/device, identify the exact gap; do not report unconditional completion or silently repair unrelated code.

## 9. Required behavior witnesses

This matrix defines coverage obligations, not one test per cell or a required new test-file taxonomy. Use concise table-driven tests where cases express the same rule, component tests for reactive/public behavior, and real browser tests for geometry and native input. Keep errors, callback traces and ownership boundaries visible in failures.

| Area                   | Minimum representative witnesses                                                                                                                                                                                                                 | Units / contracts        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Admission              | Duplicate IDs; invalid field before invalid relationship; malformed dates; zero timed duration; nonpositive all-day duration; exception/source kind mismatch; custom-field/source-reference preservation                                         | U01/U03; C03/C05/C09     |
| Temporal arithmetic    | Ordinary day; spring gap; repeated hour with distinct instants; display zone differs from recurrence zone; multi-day civil move; minimum/maximum civil date; next-day query bound failure                                                        | U03/U04/U07; C03/C06     |
| Recurrence rules       | Daily/weekly efficient distant query; sparse monthly/yearly selector; ordinal weekday; COUNT with excluded origins; inclusive UNTIL; additions beyond rule count/until; anchor exception; output/work caps                                       | U04; C06                 |
| Custom expansion       | Valid sorted projection; invalid output container; too many results; wrong temporal kind; duplicate origins; start/origin mismatch; outside requested range; consumer throw identity; invocation phase                                           | U04; C06/C09             |
| Exception projection   | Exception moved into view; moved out of view; original position suppression; preserved origin key; source removal; exception removal                                                                                                             | U04/U05; C05/C06         |
| Resources              | Parent cycle/missing parent/duplicate ID; stable leaf ordering; single/multi/unknown assignment; mutually exclusive assignment fields; grabbed resource replacement; resize leaves assignments unchanged; read-only target                       | U03/U07/U08; C07         |
| Availability           | Global versus resource windows; weekday omission; empty windows; 24:00; invalid overnight window; overlapping/adjacent events; half-open boundaries; visible shading matches policy                                                              | U03/U05/U07; C03/C07/C09 |
| Profiles/navigation    | Six views; N-day count; allowed-view reconciliation; fixed/natural month; hidden weekends; outside days; valid-range clipping; boundary navigation; setter/notification order                                                                    | U06/U07; C02/C04         |
| Layout                 | Cross-week bar; equal-start tie order; lane overflow; timed overlap; zero-duration visual minimum; background event; clipped interval; repeated-hour labels; multiple resource projections                                                       | U07/U10; C04/C05         |
| Move/conversion        | Timed/all-day source to date/all-day/instant destinations; preserve-duration true/false; non-default conversion durations; grabbed segment/resource offset; recurrence-zone duration                                                             | U08; C03/C07/C08         |
| Resize                 | Both edges; pointer crossing flips; keyboard crossing rejects; snap boundary; no-op input differences; raw-rule end resize allowed versus unsupported operation; resource unchanged                                                              | U05/U08; C06/C08         |
| Slot selection         | Click, drag, keyboard and two-click; snapping; incompatible target transitions; custom validator; createActivation threshold/delay/cancel; native click preventDefault                                                                           | U08/U09; C08/C09/C11     |
| Input lifecycle        | Main and overflow source; nested snippet controls; pointer leaves/returns; scroll while pointer stationary; Escape/pointercancel; external outside silent; source/view unmount; sibling calendar isolation                                       | U08/U10; C08/C12         |
| Resolver/policy traces | Absent/false/unchanged/adjusted/invalid/throwing resolver; normal versus recurrence count/order; synchronous model replacement; no exception-ID work during hover; one blocked notification on terminal rejection                                | U05/U08; C06/C09/C10     |
| Publication            | Add/remove/update/move/resize and every recurrence change family; correct source; array/custom-field identity; selection key remap; `onItemsChange` ordering; consumer throw                                                                     | U05/U06; C01/C10         |
| Revert/history         | Synchronous revert prevents history/commit notice; delayed valid revert; one-shot refusal; fresh equal array makes stale; resources reference makes stale; view-only change does not; selection guard; undo/redo; history limit 0 and truncation | U05/U06; C10             |
| Clipboard/API          | Occurrence copy strips recurrence when pasted; unique ID; custom fields; target resource/date/instant semantics; method-specific disabled/loading behavior; explicit-range queries and cloned public dates                                       | U05/U06; C01/C05/C10     |
| Focus/keyboard         | One intended roving tab stop; logical RTL; Home/End/Page keys; view/page navigation; removed/rekeyed occurrence; duplicate resource/overflow controls; simultaneous independent restores; unmount pending restore; editable controls excluded    | U09; C11                 |
| Announcements          | Start/proposal/rejection/commit/cancel/revert; repeated semantic proposal deduplication; invalid keyboard commit remaining in edit mode where required; localized labels                                                                         | U09; C08/C11             |
| Composition/package    | All sixteen snippets; default-content omission/replacement; 44 theme parts; native event currentTarget/preventDefault; root attrs/ref; generic fields and instance API via packed public import                                                  | U10/U11; C01/C12         |
| SSR/reactivity         | Render without browser globals; no pre-mount timer; mount notifications; parent changes remain silent; unrelated pointer frames do not expand recurrence; timers/observers/leases canceled on teardown                                           | U06/U08/U12; C02/C12     |

Differential comparison is useful for pure values and deterministic traces, but an old implementation is not an oracle for a newly discovered bug. If source, public documentation and intended contract disagree, record the concrete counterexample, identify the controlling instruction, and ask only if a material behavior decision remains unresolved. Keep approved behavior changes separate from parity claims.

## 10. Validation commands and real-browser qualification

### 10.1 Repository execution constraints

- Use the installed tooling and the existing lockfile. Do not install or upgrade a dependency to make the plan easier.
- Read the current `package.json` before executing commands; the recorded scripts may evolve.
- Do not run `svelte-kit sync`, `check` or `prepack` concurrently with a Vite build in the same checkout. They share `.svelte-kit/generated` and can produce mismatched server/client output.
- The current `build` script runs `vite build` and then `prepack`; `prepack` already includes packaging and several contract checks. Avoid running the same heavyweight sequence repeatedly without a reason.
- The Playwright configuration currently starts `npm run build && npm run preview` on port 4173 when it needs a server. Check server ownership before starting another build. Use a deliberate isolated checkout when parallel qualification is needed.
- Never run a whole-repository formatter over the dirty shared worktree. Format only task-owned files.
- Record a failing command's exact relevant error and whether it predates the task. Repair only task-caused or bounded relevant blockers, preserving unrelated work.

### 10.2 Fast loop during each unit

The existing calendar tests can be selected with:

```sh
npm run test:unit -- --run src/lib/components/EventCalendar
```

Select individual newly added files while iterating. Once a unit changes shared public/reactive behavior, rerun the whole calendar selection rather than just the last failing case.

Run formatting, lint and type checks appropriate to the edited files. For a TypeScript/Svelte architectural cutover, `npm run check` is a relevant integration gate even when focused tests pass. It is not safe to run concurrently with a build in the same checkout.

### 10.3 Integration gates

Use these existing commands at the appropriate integration point, sequentially where generated/build state is shared:

```sh
npm run check
npm run check:component-contract
npm run check:semantic-theme-tokens
npm run check:public-api-contract
npm run test:unit -- --run
npm run test:contracts
npm run lint
npm run build
```

The current `prepack` invoked by `build` also runs the feature-chip, template-purity, packed-library, package-consumer, doc-fence and package metadata checks. Capture their individual failures from that run. Do not claim a manually listed command ran separately when only the aggregate script ran.

If qualifying packaging without a full documentation build, run the existing packaging prerequisite before its consumer checks:

```sh
./node_modules/.bin/svelte-package
npm run check:packed-library
npm run check:package-consumer
npm run check:doc-fences
```

Regenerate public contract artifacts when required by U11, then check them:

```sh
npm run generate:component-contract
npm run check:component-contract
```

Do not run regeneration simply to erase an unexplained dirty generated diff. Understand the source manifest change first.

Add a focused browser suite using the existing runner, for example `e2e/event-calendar.test.ts`. After that file exists, select it with:

```sh
npm run test:e2e -- e2e/event-calendar.test.ts
```

The filename is proposed, not an existing test claimed by this plan. Full `npm run test:e2e` is the final broader browser check when the required environment is available. Use existing or explicitly configured browser projects; do not invent project names. Obtain Chromium and WebKit evidence for the replaced drag transport where available, and state any unavailable coverage.

### 10.4 Visual and interaction qualification

Use the live application in a real browser. Follow the applicable browser skill when executing this work; the project prefers the in-app Browser for interactive inspection and screenshots. Automated Playwright cases complement this inspection.

Use deterministic fixtures and the same viewport, zone, locale, data and clock for before/after comparisons. Capture normal, active-edit and completed/canceled states for the changed path.

Required scenarios:

1. Month with multi-week bars, auto overflow, a portaled overflow source, hidden weekends and an invalid target.
2. Time grid on ordinary, spring-forward and fall-back dates, including repeated-hour slots and overlapping/zero-duration events.
3. Resource-day with parents, several leaves, Unassigned, a multi-assigned event, a read-only leaf and horizontal overflow.
4. Agenda with empty/loading behavior, disclosure and custom details content.
5. Move and both resize edges; all-day/timed conversion; slot drag/two-click/keyboard creation; external drop; cancellation and rejected commit.
6. LTR and RTL; narrow and wide containers; contained and page scrolling; reduced motion.
7. Custom item/month-cell/resource/overflow/drag-preview snippets, including nested focusable content and omitted default overflow content.
8. Keyboard-only navigation/editing, focus restoration after removal/rekey/view switch, and live-region messages.
9. Two mounted calendars; unmount or view replacement during interaction; repeated mount/unmount with no leaked handlers, timers, frames or pointer capture.

Do not claim physical touch parity based only on dispatching synthetic pointer events. Test the existing slot touch hold/cancel contract in a touch-capable environment; label any item-drag mobile behavior not exercised. A new pointer transport is not permission to expand advertised input support without evidence.

### 10.5 Performance protocol

The current `PERFORMANCE.md` is a starting reference, not a current result. Reproduce or replace its scenario with a documented baseline from U00. Keep browser/runtime, machine conditions, dataset and viewport comparable.

Measure these separately with warm-up and repeated samples:

- Initial admission and first active projection.
- Month/week/resource navigation over a fixed representative collection.
- Old daily/weekly recurrence viewed far from the original start, plus a bounded complex-rule case.
- Sustained internal move/resize and slot-range updates with and without auto-scroll.
- Repeated updates/unmounts for allocation/retained-node symptoms where the browser tools support it.

Report a representative central value and tail/spread where enough samples exist; record sample count and environment. Investigate repeatable degradation instead of dismissing it as a trade for fewer lines. Do not invent a universal performance threshold from the old audit.

Two architecture checks are direct requirements: pointer movement does not rebuild item admission or expand the collection's recurrence, and base-surface construction is not tied to every pointer frame. Add test-only counters/probes if needed; remove diagnostic production logging afterward.

If existing caching is removed, prove the affected scenario remains acceptable before claiming completion. If new caching is required, count it and document its authority/invalidation; do not bury a regression under unexplained memoization.

## 11. Risk decisions, migration discipline and delegation

### 11.1 Decisions already made by this plan

- Preserve the six-view public product and existing integration surface.
- Use admitted schedule values, three concrete surfaces, semantic drafts and guarded batch publication as the replacement hypothesis.
- Keep month/time/agenda layout algorithms explicit, not one generalized renderer.
- Preserve callback phases, error visibility, controlled-state identity and input-specific behavior.
- Keep external native drag ingress and public customization. No new runtime dependency or recurrence library is assumed.
- Use temporary private bridges only for incremental migration; delete them before final qualification.
- Prefer reducing independent representations over file-count or function-size quotas.

The next AI does not need to ask Arnaud to reapprove these internal planning choices before trying the bounded experiment, once implementation is requested.

### 11.2 Hypotheses that require evidence

| Hypothesis                                                        | Evidence needed                                                           | If disproved                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Shared surface removes independent target/navigation construction | Actual render/input/focus consumers use the same IDs and admitted facts   | Correct the surface boundary; do not keep three representations behind new names                     |
| Shared pointer runtime can replace internal native item transport | Portal, cancellation, native-event, scroll, browser and activation parity | Keep a thin necessary native transport; retain semantic redesign and revise cost                     |
| Local draft projection replaces separate insertion geometry       | Same affected lane placement/indicator without unwanted timed reflow      | Preserve the necessary specialized calculation inside the owning layout, not a second semantic model |
| Admission can be split from profile changes                       | Correct error/callback phases and improved dependency behavior            | Keep the smallest phase-specific admission step required by the contract                             |
| Prepared batches eliminate repeated candidate work                | Exact callback trace and stale/revert/history parity                      | Retain explicitly necessary revalidation; remove only duplicated work within a safe phase            |
| Rule normalization compresses recurrence safely                   | Selector parity, custom syntax boundary and distant-series performance    | Keep proven specialized algorithms; reduce only duplicated interpretation                            |
| Approximately 24–33% net reduction is achievable                  | Full-perimeter final ledger including every new helper/adapter            | Report the actual result and cause; do not weaken behavior or disguise code movement                 |

### 11.3 What requires a new user decision

Ask when the necessary next step would change a public contract or callback behavior, add/replace a runtime dependency, reduce feature/accessibility/SSR/performance guarantees, change the stated product scope, or cause deployment/publishing/external effects not already authorized. Present a concrete choice with consequences.

Do not ask just because an internal file needs renaming, a test fixture needs adding, a temporary seam needs deleting or a bounded experiment disproves one representation. Those are implementation work. A missed LOC target requires honest evidence and a revised conclusion, not removal of a guarantee without approval.

Two source-confirmed behaviors need an explicit correctness/compatibility disposition in U01. They are not reasons to halt writing this plan, nor permission to conceal a behavior change inside a refactor:

| Decision                                                      | Source evidence and risk                                                                                                                                                                                                                                                           | Recommended treatment                                                                                                                                                                                                                                          |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D01 — Reentrant expansion during final publication validation | `commitCollection` checks the generation, then validates, then assigns without another check. A custom expander's `items` replacement is overwritten. A `resources` replacement is not overwritten, but the item commit silently proceeds against the changed resource generation. | Reproduce both cases; add a generation check immediately after final external validation and before assignment if correction is authorized. Record it as a bounded correctness fix, not baseline parity. Preserve error/blocked-channel behavior deliberately. |
| D02 — Existing exception-specific custom fields               | `createOccurrenceMutation` finds the existing exception, but `createExceptionItem` spreads the series source and copies placement/resources. Exception-only custom fields are lost or replaced on an occurrence-scope edit.                                                        | Reproduce with distinct series/exception custom fields. Prefer retaining the existing exception's fields for an existing-exception edit if correction is authorized; keep new-exception creation and series transformation semantics explicit.                 |

Resolve the authority under the active implementation instructions: if the requested implementation and bug policy already authorize the bounded fix, make and report it with its test; if a public behavior decision still requires approval, ask a concise choice. This planning task implements neither fix. Do not silently preserve a correctness hole as an architectural requirement, and do not silently claim the baseline already has the stronger guarantee.

A separate optional decision is whether custom expansion is guaranteed pure and whether its invocation counts are contractual. The current plan assumes no new purity guarantee. If changing that contract is necessary for a larger optimization, present the proposed guarantee and its consumer impact. The LOC target does not itself grant that authority.

### 11.4 Safe incremental cutover

- Keep the currently accepted path authoritative until the replacement passes its focused gate.
- Compare pure outputs or run isolated fixtures against the baseline. Never shadow-run real mutation hooks or public notifications.
- Use at most one explicit migration seam per responsibility; give each seam an owner and U11 deletion record.
- Do not expose migration flags publicly or make consumers understand old/new internals.
- Preserve source-level recoverability through normal version control or the isolated baseline specimen. Do not leave a production fallback because deletion feels risky.
- Re-run the relevant contract witnesses after crossing each owner boundary, not only at the end.

### 11.5 Delegation contract

The integrating AI may delegate bounded independent work after reading the instructions and agreeing the relevant internal shape. Good parallel boundaries are admission/recurrence tests, a source contract review, or surface work versus batch publication after their interfaces are settled. Input/focus/rendering remain coupled enough to require one coordinating owner and frequent integration.

Every delegated task must state:

1. One outcome and the unit/contract IDs it owns.
2. Exact writable paths; all other paths are read-only unless reassigned.
3. The authoritative baseline and minimal shared interface.
4. Required before/after witnesses and expected deletions.
5. Prohibited public changes and no-new-dependency rule.
6. A verifiable done condition and a concise return of changed files, checks, remaining assumptions and LOC charges.

The integrating AI must inspect artifacts/diffs and rerun decisive tests. Conflicting summaries are not resolved by majority vote; inspect source and observable behavior. Do not delegate reading or interpretation of a skill that the main agent is required to read itself.

## 12. LOC measurement and evidence accounting

### 12.1 Reproduce the audited count

From the repository root, the following read-only command reproduces the immediate-file baseline count and digest. It also prints per-file counts. It is deliberately tied to the audited flat layout; use the recursive rule below for a reorganized implementation.

```sh
node --input-type=module <<'NODE'
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const calendarDirectory = 'src/lib/components/EventCalendar';
const filenames = readdirSync(calendarDirectory)
  .filter((name) => /\.(ts|svelte)$/.test(name))
  .filter((name) => !name.includes('.test.'))
  .filter((name) => name !== 'eventCalendar.mcp.ts')
  .sort();
const digest = createHash('sha256');
let totalLines = 0;

for (const filename of filenames) {
  const source = readFileSync(join(calendarDirectory, filename), 'utf8');
  const lines = (source.match(/\n/g) ?? []).length;
  totalLines += lines;
  digest.update(filename).update('\0').update(source).update('\0');
  console.log(`${String(lines).padStart(5)} ${filename}`);
}

console.log(JSON.stringify({
  files: filenames.length,
  productionLOC: totalLines,
  sha256: digest.digest('hex')
}, null, 2));
NODE
```

Expected audit output: 36 files, 15,813 LOC and digest `821cfe320b713a5c8e64bd1e47a0bb64e91834e20e6127301185fe940aa1cfcb`. If the digest differs, inspect the changed source and establish the actual execution baseline rather than assuming the old number is still valid.

### 12.2 Final accounting rule

Physical LOC is newline count in normally formatted source with a trailing newline. Do not obtain savings by minifying, compressing imports/statements onto one line or changing formatter settings.

At completion:

1. Recursively enumerate all production `.ts`/`.svelte` files in the calendar's final directory, including new subdirectories.
2. Classify tests, test-only harnesses, MCP prose, generated output and documentation explicitly; report those separately. Do not relabel runtime code as a fixture to exclude it.
3. Add the full cost of new calendar-required shared files outside the directory. For additions to existing shared files, record the task-attributable added/replacement cost and its baseline, without crediting deletion of unrelated lines absent from the original denominator.
4. If a whole existing shared responsibility is legitimately included in the redesign's perimeter, report an expanded before/after perimeter separately and consistently. Keep the original 15,813-line comparison visible.
5. Include all adapters, internal schemas, pointer primitives, retained transport code and temporary code still in the production graph. Temporary code cannot disappear from the ledger merely because it is scheduled for deletion.
6. Report package/bundle measurements separately. Source reduction and tree-shaken output are different metrics.

The core calculation is:

```text
charged final LOC = final calendar production LOC + charged new shared production LOC
net reduction    = verified starting calendar LOC - charged final LOC
reduction %      = 100 × net reduction / verified starting calendar LOC
```

The budget in section 3.2 already includes replacement scaffolding; do not deduct added surface/draft types a second time. Do not sum overlapping agent “savings” estimates. One disjoint whole-system ledger is authoritative.

### 12.3 Required final ledger

Record for each of the six budget areas:

- Verified baseline files and LOC.
- Final files and LOC, including renamed/reallocated responsibilities.
- Added shared-code charge.
- Net reduction and percentage.
- Removed authorities/mechanisms, not just removed filenames.
- Necessary retained complexity and explanation of a material budget difference.

Also report tests added, docs/generated deltas and any remaining migration code separately. Intermediate LOC can rise while tests and replacement coexist; only the final cutover number answers the user's question.

### 12.4 Evidence record structure

Use `EVENT_CALENDAR_REDESIGN_EVIDENCE.md` as the implementation handoff record. Keep it compact enough to inspect but concrete enough to reproduce:

1. **Identity:** dates, HEAD/source digest, relevant starting dirty files, environment and baseline specimen location.
2. **Unit status:** U00–U12, pending/in progress/complete, changed owner, removed mechanism and evidence links.
3. **Contract witnesses:** C01–C12 mapped to actual test cases/browser evidence; mark unverified cases explicitly.
4. **Commands:** exact command, working directory, result, relevant failure, and baseline-versus-task attribution. No credentials or secret environment values.
5. **Architecture proof:** U02 result, counterexamples, chosen corrections and which hypotheses remain conditional.
6. **LOC ledger:** disjoint before/after accounting, external shared charges and actual reduction.
7. **Performance/browser results:** scenario, environment, samples and findings; screenshots/traces where useful.
8. **Deviations/decisions:** approved public changes if any, unresolved limits and why a gate cannot be claimed complete.

Record facts and procedural handoff here. Durable project rules belong in applicable project documentation; reusable process lessons belong in `memory.md`. Do not turn either file into a copy of this task log.

## 13. Completion checklist and prompt for the next AI

### 13.1 Architecture acceptance

- [ ] Admitted declarations, current projections, DOM observations and committed history have explicit, separate owners.
- [ ] Business windows and built-in recurrence meaning are not independently parsed by downstream consumers.
- [ ] A definition, occurrence and rendered projection are not confused with one another.
- [ ] Month date destinations differ from all-day conversion destinations; edit math does not repair missing meaning with view-name branches.
- [ ] Rendering, input and focus consume the same base-surface facts and stable identities.
- [ ] Pointer frames update a draft projection, not the full collection/profile/recurrence model.
- [ ] Draft state has no DOM geometry and does not run full-series/exception-ID commit work.
- [ ] Focus keeps independent restore lifetimes and handles portaled/duplicate controls.
- [ ] Preview uses the owning layout's geometry without changing ordinary timed layout behavior.
- [ ] One publication owner governs atomic changes, controlled-state staleness, history and revert.
- [ ] Old target codecs, duplicate constructors, preview engines, migration seams and dormant controllers are gone.
- [ ] Every new abstraction names the invariant/consumers it serves and the mechanism it removed.

### 13.2 Product and evidence acceptance

- [ ] C01–C12 have passing relevant witnesses, or an explicit user-approved deviation/gap that prevents an unconditional parity claim.
- [ ] Public exports, generics, instance methods, callbacks, change/error variants, snippets and theme keys are preserved.
- [ ] Native public event and controlled-state callback timing/counts are preserved.
- [ ] Civil/DST, recurrence performance/limits and resource assignment semantics are preserved.
- [ ] SSR, unmount cleanup, overflow portals, keyboard/focus and reduced motion are verified.
- [ ] The packed public import and actual examples are exercised, not just source aliases or symbol names.
- [ ] Relevant unit/type/contract/package/browser checks have recorded results; unrelated failures remain accurately attributed.
- [ ] Before/after performance evidence exists for affected paths; untested devices/browsers are not advertised as proven.
- [ ] Whole-perimeter LOC accounting includes every new shared helper and remaining adapter.
- [ ] The final percentage is measured from the verified baseline. The 24–33% estimate is not reported as an achieved result.
- [ ] User/concurrent changes are preserved, generated files follow their source owner, and only relevant durable documentation is updated.

### 13.3 Ready-to-use implementation prompt

> Implement `EVENT_CALENDAR_REDESIGN_PLAN.md` in this repository. Preserve the current public feature set and behavior; the objective is fewer independent authorities and approximately 24–33% net production LOC reduction, not cosmetic file splitting. Read the active instructions and the whole plan first. Start with U00 to verify the working baseline and protect existing changes, then add the missing characterization evidence and prove the U02 vertical slice before expanding the rewrite. Execute the dependency-ordered units, preserving the C01–C12 contracts, callback phases, resource/recurrence behavior, controlled-state identity, focus lifetimes and browser cleanup. Keep one live commit owner, charge every new helper/adapter to the LOC ledger, and delete superseded production mechanisms before completion. Use the existing dependencies and tooling. Do not change public behavior, add a runtime dependency or reduce a guarantee without an explicit decision. Keep `EVENT_CALENDAR_REDESIGN_EVIDENCE.md` current with actual checks, deletions, measurements, deviations and remaining gaps. Finish with the measured before/after LOC, relevant validation results and only the risks that affect correctness, safety or the requested outcome. Do not commit, push, publish or deploy unless separately requested.
