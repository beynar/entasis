# EventCalendar redesign — implementation evidence

This record verifies the implementation of `EVENT_CALENDAR_REDESIGN_PLAN.md`. It records shipped
facts, observed compatibility, and the quantitative result. It does not turn the plan's targets
into claims.

## 1. Identity and comparison basis

- Audited baseline: Git commit `ebf782fa469ea5240aea4514bca6c514dde55c13`.
- Baseline production source: 36 immediate `.ts`/`.svelte` files under
  `src/lib/components/EventCalendar`, excluding tests and `eventCalendar.mcp.ts`; **15,813 physical
  LOC**; sha256 `821cfe320b713a5c8e64bd1e47a0bb64e91834e20e6127301185fe940aa1cfcb`.
- Verification date: 2026-09-20, Node v24.21.0 and npm 11.19.0 on macOS.
- A concurrent workspace snapshot moved `HEAD` to `d6bd67a3` during implementation. The LOC and
  behavior comparison still uses the audited `ebf782fa` EventCalendar source.
- Reviewed implementation: 39 production files, **15,455 physical LOC**; sha256
  `23c1acb3fb0cf4504587908488d09d52a3ebd9bc3de3cfc134613db3c9f59b60`.

The source digest hashes sorted immediate production basenames, a null byte, each UTF-8 file, and
another null byte. Documentation and tests are not charged to production LOC.

## 2. Implemented ownership model

### Admission and projection

- `admitEventCalendarItems` owns collection-shape and item admission. Occurrence projection is a
  separate range-dependent stage.
- Global and resource business hours share one strict clock parser and one admitted minute-based
  representation. The existing distinction remains: global range ends may use `24:00`; resource
  hours reject it.
- State derives date profile, resource model, admitted items, and occurrence index at their own
  dependency boundaries. Profile validation retains its baseline precedence over resource errors.
- Recurrence origin identity and date-selector semantics have one internal owner. Public diagnostic
  details retain their legacy dash encoding where that exact output is observable.

### View surfaces and rendering

- Month, time-grid, and agenda modules own view projections consumed by their Svelte renderers.
- Resource projections use resource-qualified navigation keys, so two projections of one
  occurrence cannot collapse in the accessibility registry.
- The former single-use `EventCalendarAgendaItem.svelte` component is folded into its view owner.

### Interaction and draft semantics

- Drop targets are discriminated semantic values: `date`, `all-day`, or `instant`, with optional
  resource context. Constructors live in `eventCalendar.targets.ts`.
- `eventCalendar.drafts.ts` derives proposals without `DOMRect`, `Element`, pointer events, or live
  element lookup. The interaction controller owns DOM hit testing and preview geometry.
- One root `slotDragHost` owns pointer-capture creation gestures. Individual slots register
  semantic targets; they do not create independent pointer runtimes.
- Target constructors clone mutable `Date` values. Timed slot callbacks receive fresh clones, so a
  consumer cannot mutate the target registry or the selected slot through callback payloads.
- Clock and visibility refreshes update the now indicator without rebuilding structural slot
  surfaces or cancelling an active drag.

### Mutation and accessibility authority

- Normal and recurrence edits converge on one prepared batch and one publication boundary.
- The normal resolver retains all three observable custom-expansion/validation phases, including
  the final policy pass when the resolver returns no adjustment.
- Publication checks the item/resource model boundary after final candidate validation. Reentrant
  item or resource replacement wins and the stale transaction does not publish.
- Existing occurrence exceptions preserve their own custom fields. New exceptions still inherit
  the series source.
- The accessibility controller derives active edit identity and operation from the interaction
  gesture. It does not mirror a second mutation state. Post-mutation focus fallback is restricted
  to keyboard and single-pointer sources.

## 3. Review findings fixed

| Finding                                                         | Resolution and witness                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Resolver with no adjustment skipped final policy                | Final prepare/policy pass restored; commit-suite rejection witness added.                  |
| Normal custom expander ran two phases instead of three          | Baseline callback count restored and pinned in the commit suite.                           |
| Clock refresh cancelled slot drag                               | Structural surface no longer depends on the clock; browser visibility-refresh drag passes. |
| Callback `Date` values could corrupt registered targets         | Constructors and public payloads clone endpoints; DOM isolation witness added.             |
| Draft owner still depended on DOM geometry and view-name repair | Draft input is semantic target data; DOM work remains in the controller.                   |
| Each slot owned a pointer runtime                               | Replaced by one root slot-drag host.                                                       |
| Multi-resource projections reused navigation keys               | Projection resource identity is included in time-grid item keys.                           |
| Accessibility mirrored mutation state                           | Mirror fields removed; gesture is the authority.                                           |
| Admission lost the exact array guard                            | Shared admission again throws `invalid-item: items must be an array.`                      |
| Resource errors could precede invalid-profile errors            | Profile preflight order restored.                                                          |
| Reentrant item replacement lacked a resource equivalent         | Item and resource replacement tests both abort as stale.                                   |
| Existing exception edits lost exception-only fields             | Exception source is preserved and tested.                                                  |
| Recurrence conversion changed `details.target` punctuation      | Legacy `day-…`/`instant-…` diagnostic form restored and tested.                            |

## 4. Contract and browser evidence

| Check                                                                               | Result                                              |
| ----------------------------------------------------------------------------------- | --------------------------------------------------- |
| `npm run test:unit -- --run --no-file-parallelism src/lib/components/EventCalendar` | PASS — 10 files, 185 tests                          |
| Focused pointer selection repeated five times, one worker                           | PASS — 5/5                                          |
| `npm run test:e2e -- e2e/event-calendar.test.ts --workers=1`                        | PASS — 9/9                                          |
| Direct `npx svelte-check --tsconfig ./tsconfig.json`                                | PASS — 0 errors; 13 unrelated warnings in 6 files   |
| `npm run check:component-contract`                                                  | PASS                                                |
| `npm run check:public-api-contract`                                                 | PASS — 2,296 source files                           |
| `npm run check:semantic-theme-tokens`                                               | PASS — 139 theme owners                             |
| `npm run check:package-consumer`                                                    | PASS — 288 Blocks plus typed EventCalendar consumer |
| Playwright CLI snapshot of `/__event-calendar-e2e`                                  | Hydrated calendar present; 0 console errors         |

The package-consumer fixture imports `entasis/event-calendar`, binds the public API and item
collection, uses generic item/resource fields, supplies snippets, and exercises native root
attributes and handlers. It does not import source aliases.

The browser performance invariant installs a counting custom recurrence expander, begins a slot
drag, sends 30 pointer steps, and asserts that pointer movement does not re-expand the admitted
recurrence collection. A second browser witness refreshes visibility during an active drag and
then commits it.

## 5. LOC ledger

| Production area                      | Baseline LOC | Reviewed LOC |      Net |
| ------------------------------------ | -----------: | -----------: | -------: |
| Public contract                      |        1,172 |        1,172 |        0 |
| Dates, profiles, recurrence          |        2,436 |        2,290 |     -146 |
| Items and resources                  |        1,196 |        1,028 |     -168 |
| Mutations and transactions           |        1,880 |        1,848 |      -32 |
| Root and state                       |        1,712 |        1,677 |      -35 |
| Views, layout, input, focus, preview |        7,417 |        7,440 |      +23 |
| **Total**                            |   **15,813** |   **15,455** | **-358** |

The measured reduction is **358 LOC, or 2.26%**. The plan targeted 3,841–5,241 LOC (24–33%), so
the quantitative target was not achieved. The projection, semantic-target, draft, and contract
witnesses added code to the view/input area; safe removal elsewhere did not offset that cost.

## 6. Performance and limitations

- No new end-to-end timing benchmark was recorded. The July 2026 timing table in `PERFORMANCE.md`
  remains historical and must not be presented as a measurement of this implementation.
- Current evidence proves invalidation behavior during pointer movement and clock refresh; it does
  not prove a general render-time improvement.
- Compatibility and error integrity were kept when they conflicted with LOC removal. The missed
  LOC target is an open architectural result, not hidden debt or an implied future task.
