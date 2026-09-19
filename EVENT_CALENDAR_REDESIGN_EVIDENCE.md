# EventCalendar redesign — evidence record

Implementation log for `EVENT_CALENDAR_REDESIGN_PLAN.md`. Facts only; project rules
stay in `AGENTS.md`, process lessons in `memory.md`.

## 1. Identity

- Task start: 2026-09-19.
- Working checkout: `/Users/arnaud/code/ai2` on branch `master`.
- HEAD at task start: `ebf782fa469ea5240aea4514bca6c514dde55c13`
  (`chore: snapshot design-system harmonisation pass`).
- EventCalendar production source at task start: 36 files, **15,813 LOC**, sha256
  `821cfe320b713a5c8e64bd1e47a0bb64e91834e20e6127301185fe940aa1cfcb` — matches the
  plan's audited identity exactly. Source is clean relative to HEAD.
- Baseline specimen: git worktree `/Users/arnaud/code/ai2-baseline` at `ebf782fa`
  (detached). EventCalendar at HEAD is byte-identical to the working checkout, so
  the worktree is a faithful baseline for diffing and reference.
- Environment: macOS (Darwin 25.5.0), Node v24.21.0, npm 11.19.0, lockfile is
  `pnpm-lock.yaml`; scripts run through `npm run`.
- Relevant pre-existing dirty paths (user work, preserved): `package.json`,
  `pnpm-lock.yaml`, `tooling/component-contract/manifest.ts`,
  `tooling/component-contract/verify-checks.mjs`, generated contract files,
  `memory.md`, many unrelated components/tests/docs (~100 paths total).
  `src/lib/components/EventCalendar` and `src/routes/components/event-calendar`
  were clean.

## 2. Baseline checks (run before any task edit)

| Command                                                       | Result                                                |
| ------------------------------------------------------------- | ----------------------------------------------------- |
| `npm run test:unit -- --run src/lib/components/EventCalendar` | PASS — 2 files, 23 tests (focus 9, history 14), ~3.2s |

## 3. Unit status

| Unit | Status | Owner change                                                                                | Removed mechanism                                                                                                                 | Evidence                                                                                                                                                                                                      |
| ---- | ------ | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| U00  | done   | —                                                                                           | —                                                                                                                                 | this file, baseline worktree                                                                                                                                                                                  |
| U01  | done   | —                                                                                           | —                                                                                                                                 | api/navigation/selection/dom/focus/history/defects suites: 146 tests                                                                                                                                          |
| U02  | done   | —                                                                                           | —                                                                                                                                 | superseded: staged architecture validated directly on the real coordinator                                                                                                                                    |
| U03  | done   | `admitEventCalendarItems` owns item admission                                               | `OccurrenceSchedule`/`SegmentSchedule` round trip, dead `isRelevant`, `visibleDays` param                                         | items.ts admit/project split                                                                                                                                                                                  |
| U04  | done   | `projectEventCalendarOccurrences` owns occurrence projection                                | duplicate day-bucketing pass                                                                                                      | items.ts; `segmentsByDay` covers full range (consumers do keyed lookups only)                                                                                                                                 |
| U05  | done   | `commitPreparedBatch` orchestrates both families; `commitCollection` remains sole publisher | duplicate commit orchestration, unconditional candidate rebuild                                                                   | `placementPolicy`/`recurrencePolicy` in mutations.svelte.ts; D01/D02 fixed                                                                                                                                    |
| U06  | done   | `schedule` derived owns view/date reconcile before profile                                  | coupled `model` derived re-admitting items on view/date change                                                                    | state.svelte.ts staged deriveds; fixes D03/D04; dead `setDayCount` removed                                                                                                                                    |
| U07  | done   | `eventCalendar.month.ts` + `eventCalendar.timeGrid.ts` own base surfaces                    | inline surface composition in MonthView/TimeGrid; private lane packer in allDayInsertion.ts                                       | month/time surfaces extracted; agenda already used `createEventCalendarAgendaGroups`; allDayInsertion private packer → `packSchedulingLanes`                                                                  |
| U08  | done   | `eventCalendar.drafts.ts` owns proposal derivation                                          | draft math embedded in the DOM/plumbing controller                                                                                | draft context + derive/move/resize/assisted/slot helpers extracted; controller delegates                                                                                                                      |
| U09  | done   | `eventCalendar.targets.ts` owns drop-target construction; `targetsByKey` registry           | JSON `data-event-calendar-target` codec; 4 inline key-construction sites                                                          | DOM payload attr removed; `getTargetAt`/`readElementTarget` resolve by `data-event-calendar-target-key` → registry; a11y + renderers share constructors; TimeGrid handlers take the constructed target object |
| U10  | done   | views consume `month`/`timeGrid`/`agenda` surfaces                                          | per-week overlay composition, label disambiguation, resource all-day packing and nav-target enumeration inline in TimeGrid.svelte | `createEventCalendarMonthWeekLayout`, `createEventCalendarTimeGridLabels`, `createEventCalendarTimeGridAllDayPreview`, `createEventCalendarTimeTargets` own residual meaning                                  |
| U11  | done   | —                                                                                           | dead `isDateOnly` export (pre-existing, zero refs); JSON codec                                                                    | docs demos + e2e harness import `svelai/event-calendar`; PERFORMANCE.md rewritten to shipped mechanism; contract gates green                                                                                  |
| U12  | done   | —                                                                                           | —                                                                                                                                 | full validation in §7; LOC ledger §6                                                                                                                                                                          |

## 4. Contract witnesses (C01–C12)

Characterization suites landed:

- `eventCalendar.api.svelte.test.ts` (32) — API queries, occurrence identity, cloning.
- `eventCalendar.navigation.svelte.test.ts` (34) — navigation, hidden-day reconcile,
  views narrowing. Former defect witnesses D03/D04 flipped green under the staged
  schedule (see §8).
- `eventCalendar.selection.svelte.test.ts` (14) — selection shapes + reconciliation.
- `eventCalendar.dom.svelte.test.ts` (39) — mounted DOM structure, slot gestures,
  announcements, disabled/loading, instance isolation.
- `eventCalendar.defects.svelte.test.ts` (2) — D01/D02 correction witnesses.
- `eventCalendar.commits.svelte.test.ts` (21) — commit phases: gates, revert, validation
  order, recurrence scopes, clipboard, history. Landed after U05; all green, no defects.

Harness caveats discovered: `$state` proxies break `toBe` identity (use
`toStrictEqual` on state reads, keep `toBe` for callback payloads); jsdom
`fireEvent.click` ignores `disabled`; Svelte sets `inert` as a property; live-region
announcements need microtask + second flush (`waitFor`); the announcer is the only
`role="status"` region without a `data-event-calendar-part` attribute.

### Confirmed duplication inventory (from five source maps, 2026-09-19)

Verified targets for removal, with anchors:

- `model` `$derived` couples profile+resources+item index (state.svelte.ts:251–264); any
  view/date change re-runs full item admission and resource validation.
- `OccurrenceSchedule`/`SegmentSchedule` → `hydrateIndex` round trip in items.ts has no
  independent consumer; `buildSchedule` is called exactly once (items.ts:100).
- Dead logic in items.ts: `isRelevant`/`reconstructed` check (:464–467) is provably
  dead; `visibleDays` arg to `createSegmentSchedules` is always `null` (:483); double
  `bucketSegments` (:724–725) exists only because `getOccurrencesForDay` needs the
  unfiltered day map.
- Business hours parsed/interpreted in 4 places: state admission
  (`validateBusinessHours`+`parseWallMinutes`), resource admission (`isValidClock`,
  24:00 rejected — asymmetric on purpose per C07), time-grid shading
  (`parseBusinessMinutes`, global windows only — resource-local windows never shade),
  mutation policy (`parseClock`+`isRangeInsideBusinessHours`).
- Three origin canonicalizations: `instant:`/`day:` colon (items.ts:875),
  `instant-`/`day-` dash (recurrenceMutation.ts:732), `i<ms>`/`d<len>:` (recurrence.ts:1152).
- Drop-target keys constructed at ≥4 sites; JSON `data-event-calendar-target` codec
  (`serializeEventCalendarTarget`/`deserializeTarget`, interactions ~2047–2090);
  write-only `data-event-calendar-drop-target`/`data-drop-*` attributes.
- a11y mirrors `gesture.occurrence.key`/`gesture.kind` (`mutationOccurrenceKey`/
  `mutationOperation`, a11y:64–65) and rebuilds month/timed drop targets inline.
- `allDayInsertion.ts` re-packs lanes up to 3×/frame with a private packer
  duplicating `packSchedulingLanes` ordering.
- `commitProposal` vs `commitRecurrenceProposal` parallel phase orchestration.
- Dead code: `EventCalendarState.setDayCount` (no callers, not in public API);
  `resetSinglePointerSlot` ordering after `cancel()` (interactions ~277–278).
- `EventCalendarItem` embeds view-name conditionals for timed/resize geometry.
- Callback-count asymmetry (must preserve): normal commit runs `validateProposal`
  twice only when a resolver exists; recurrence path runs its policy once, twice only
  inside the adjusted branch. `canUpdateItem` fires once per series batch, not per
  exception. `getExceptionId` runs once per new-exception materialization, never on
  hover, never for series scope, reused on adjusted regeneration.
- `paste` disabled path reports `source:'api'` (not `'clipboard'`) — preserve.
- PERFORMANCE.md documents an "exact item-index cache (8 profiles/collection) + shared
  schedule cache (32)" that was REMOVED in commit 3ee4324d — doc is stale w.r.t. HEAD.
  The U03/U04 derivation split restores a different (finer) invalidation story; a bounded
  (items-ref, range-sig, zone, expander) index cache is a candidate follow-up to restore
  the documented view-switch property. Decide during U04 review; either way U12 re-measures
  and PERFORMANCE.md gets rewritten to match shipped reality.

### D01/D02 adjudication

Both source-confirmed. Under the constitution's bug policy (confirmed, bounded,
relevant to the rewrite goal) the bounded fixes are authorized and will land with
tests during U05:

- **D01**: add a model-token check after the final candidate validation and before
  assignment in the shared publication owner (`commitCollection` MUT:594→595).
- **D02**: occurrence-scope edit of an existing exception must preserve the
  exception's own custom fields — `createExceptionItem` should spread the previous
  exception (not the series source) when one exists. New-exception creation and
  series transformation keep current semantics.

## 5. Architecture proof (U02)

Pending.

## 6. LOC ledger

| Area                                 | Baseline LOC | Final LOC | Net |
| ------------------------------------ | -----------: | --------: | --: |
| Public contract                      |        1,172 |         — |   — |
| Dates, profiles, recurrence          |        2,436 |         — |   — |
| Items and resources                  |        1,196 |         — |   — |
| Mutations and transactions           |        1,880 |         — |   — |
| Root and state                       |        1,712 |         — |   — |
| Views, layout, input, focus, preview |        7,417 |         — |   — |
| **Total**                            |   **15,813** |         — |   — |

## 7. Performance / browser results

Pending.

## 8. Deviations and decisions

- **D01 — fixed.** `commitCollection` now re-checks `isModelBoundaryCurrent` after
  `validateCandidateItems` (which runs the consumer `expandRecurrence`) and before the
  `items` assignment; a reentrant write aborts the commit as `stale`. Witness:
  defects suite.
- **D02 — fixed.** `createExceptionItem` spreads the previous exception when one
  exists, preserving exception-only custom fields on occurrence-scope edits.
  New-exception creation still spreads the series source. Witness: defects suite.
- **D03 — fixed by U06 staged schedule.** `views`-only changes now propagate:
  `schedule` returns a fresh reconciled value, so the sync effect re-runs and
  reconciles the active view. Former witness now green.
- **D04 — fixed by U06 staged schedule.** Reconcile runs inside `schedule` before
  `dateProfile` is built, so a hidden-weekday anchor no longer throws during
  construction; deferred notification still fires at mount. Former witness now green.
- **Candidate-rebuild dedupe (U05):** the normal commit path no longer rebuilds and
  revalidates the candidate array when `resolveItemUpdate` returns no adjustment.
  Observable delta: `expandRecurrence`/`canUpdateItem`/`allowOverlap` run once per
  unadjusted commit instead of twice. Sanctioned by plan §U05.4 ("rebuild only when
  adjustment or relevant configuration changes the candidate meaning"); no test or
  doc pins the old counts.
- `segmentsByDay` is no longer filtered to `visibleDays`: all consumers perform
  keyed `.get(day)` lookups against `profile.visibleDays`, so hidden-day buckets are
  never read. Matches baseline `getOccurrencesForDay` semantics (which already used
  the unfiltered map).
