# GanttChart implementation contract

## Goal

Ship a production-grade, first-class Entasis package at `entasis/gantt-chart` and a documentation page at `/components/gantt-chart`. GanttChart is a dedicated project-scheduling component. It is not an EventCalendar view, a generic timeline, or a wrapper around a third-party Gantt library.

## Repository facts frozen before implementation

- The repository-level `AGENTS.md` requested by the mission is absent from `/Users/arnaud/code/ai2`; the full instructions supplied with the task remain binding.
- The starting branch is `form_inputs` at `fc3a0adc4eead2ab857c24611c8e74ce610bb311`, ahead of its upstream, with substantial unrelated tracked and untracked work.
- `package.json` already contains unrelated version, script, and DocumentViewer export edits. Gantt package-boundary edits must preserve them and cannot be included in an otherwise atomic commit without also staging their existing hunks.
- Baseline `npm run check` fails with 3,049 errors and 33 warnings in 15 pre-existing files. No GanttChart files existed at baseline.
- Baseline scoped EventCalendar ESLint passes. Baseline `npm run prepack` and Publint pass.
- Installed interfaces were verified from local source: Svelte 5.56.4, Tailwind 4.3.2, Pragmatic Drag and Drop 2.0.1, auto-scroll 3.0.0, `@tanstack/svelte-virtual` 3.13.32, the Entasis Resizable panels/snippet interface, the actual two-axis ScrollArea interface, and the shared pointer-drag attachment.

## Product boundary

GanttChart combines:

- A hierarchical, virtualized task tree/grid on the inline-start side.
- A synchronized, horizontally scrollable time axis on the inline-end side.
- Task, summary, milestone, baseline, deadline, progress, dependency, resource-assignment, critical-path, slack, and workload visualization.
- A single controlled immutable mutation pipeline used by pointer, keyboard, inline editing, clipboard, history, and imperative methods.
- A pure scheduling engine for dependency propagation, working calendars, constraints, critical path, and slack.
- Typed Svelte 5 snippets that customize content while GanttChart retains semantic ownership, focus, hit targets, interactions, and announcements.

The removed EventCalendar timeline view will not be restored. EventCalendar recurrence, view implementations, state, interaction controller, accessibility controller, occurrence expansion, and calendar layout remain private to EventCalendar.

## Public package surface

The package exports `GanttChart`, `GanttChartError`, the theme API, MCP description, props, API, domain definitions, resolved nodes, proposal/change types, snippet payloads, and callback types from `entasis/gantt-chart`.

Consumers import it as:

```ts
import { GanttChart, type GanttTask, type GanttDependency } from 'entasis/gantt-chart';
```

The component name is `GanttChart`; the public theme key is `ganttChart`.

## Frozen generic model

The component and every public type family use four generic object parameters in this order:

1. `TTaskFields`
2. `TDependencyFields`
3. `TResourceFields`
4. `TAssignmentFields`

Each defaults to `Record<never, never>`. Consumer keys are intersected into their definition and preserved through props, resolved nodes, snippets, proposals, callbacks, changes, queries, and API mutations. An index-signature custom object or any custom key that overlaps a component-owned key resolves to `never`; owned fields cannot be shadowed.

### Tasks

`GanttTask<TTaskFields>` owns:

- `id`, `title`, optional `parentId`.
- `type`: `task`, `summary`, or `milestone`; omitted means `task`.
- A normal task is either scheduled with valid Date `start < end`, or unscheduled with both endpoints absent.
- A milestone requires both Date endpoints and they must be equal.
- A summary forbids consumer-controlled `start` and `end`; its span and progress are derived from visible descendants.
- Optional progress and expected progress in the inclusive range 0 through 1.
- Optional semantic/custom color, read-only and per-interaction policies, calendar/resource references, priority, notes, baseline, deadline, constraint, and ordered non-overlapping segments.
- A baseline is a valid half-open range. Segments are contained by the task span and preserve one logical task identity.
- Expansion is never stored on a task definition.

### Dependencies

`GanttDependency<TDependencyFields>` owns stable `id`, `fromTaskId`, `toTaskId`, one of the four dependency types, optional signed lag with minute/hour/day/week unit, and optional read-only state. Validation rejects duplicate IDs, missing references, self-links, duplicate semantic links, and cycles with stable public error codes.

### Resources and assignments

`GanttResource<TResourceFields>` is a flat hierarchy with stable `id`, `title`, optional `parentId`, color, non-negative capacity, calendar reference, read-only state, and custom fields.

`GanttAssignment<TAssignmentFields>` owns stable `id`, `taskId`, `resourceId`, units in the inclusive range 0 through 1, and custom fields.

### Calendars

`GanttCalendar` owns `id`, `title`, explicit IANA `timeZone`, working weekdays, one or more same-day half-open working intervals, and date exceptions that either mark a civil date non-working or replace its intervals. The project calendar is the default; a task calendar overrides it; resource calendars affect workload only. System/server/browser zones are never inferred.

### Controlled and resolved state

Tasks, dependencies, and assignments are bindable immutable collections. Every accepted mutation publishes a fresh outer array and fresh changed objects. Resources and calendars are immutable inputs. `expandedTaskIds`, selection, and zoom are bindable controlled state.

Selection is exactly one of empty, task, dependency, or tree cell. Resolved task nodes are separate from definitions and expose hierarchy, WBS, derived summary span/progress, computed elapsed and working duration, total/free slack, critical state, violations, and visible order without mutating consumer objects.

## Scheduling decisions

All intervals are half-open. The pure engine is SSR-safe and never accesses Svelte state, the DOM, or browser globals.

Completed-task policy is frozen as follows:

- A leaf task is complete when `progress === 1`.
- Completed scheduled tasks remain vertices in dependency analysis, critical-path calculations, and slack calculations. Their actual dates constrain successors.
- Forward auto-scheduling never moves a completed task. If its dependencies or constraints would require a different date, the engine reports a typed schedule violation instead of fabricating a correction.
- Summary completion remains derived from visible descendants and does not independently suppress propagation.

The engine must:

- Build and validate task hierarchy and dependency DAG in O(V + E).
- Resolve deterministic WBS, summary values, visible flattening, schedule ordering, and project range.
- Compute elapsed/working duration with explicit IANA zones and calendar inheritance.
- Apply finish-start, start-start, finish-finish, and start-finish dependencies with positive or negative lag.
- Preserve working duration when forwarding successors.
- Detect every supported constraint violation without fake correction.
- Compute earliest/latest dates, total/free slack, critical tasks, and critical dependencies.
- Apply the selected propagation policy: `manual`, `move-successors`, or `auto`.
- Calculate capacity-aware resource workload diagnostically without automatic resource leveling.

## Public props

The frozen public surface keeps controlled state flat and groups configuration by owner:

- Bindable `tasks`, `dependencies`, `assignments`, `expandedTaskIds`, `selection`, `zoom`, and `gridWidth`.
- Immutable `resources` and `calendars`.
- Required `timeZone`; optional per-instance `i18n`, visual `size`, layout `density`, `class`, root `ref`, and `theme`.
- Standard `loading` and `disabled` state.
- `schedule` owns the project calendar, valid range, and one non-contradictory propagation value: `manual`, `move-successors`, or `auto`.
- `timeline` owns the ordered built-in/custom scales, today/weekend/holiday presentation, optional fixed snap duration, scheduling-display toggles, and resource view.
- `layout` owns row-height override, contained/page scroll mode, and optional tree-grid columns. Density supplies the default row geometry.
- `interactions` owns move, both resizes, progress, reorder, indent/outdent, range creation, keyboard, touch, dependency materialization, clipboard IDs, and bounded history.
- `mutations` owns synchronous proposal validation, accept/reject/adjust hooks, and immutable guarded-revert change callbacks for tasks, dependencies, assignments, and empty ranges. Persistence failures are never swallowed.
- `events` owns selection, expansion, zoom, visible-range, activation, empty-range, blocked-interaction, and schedule-violation notifications.
- `render` owns semantic Svelte 5 content customization. `render.header: false` removes the default header.

The component infers initial timeline anchoring, zoom-specific snap duration, safe grid bounds, virtualization overscan, sticky behavior, reading direction, and task accent. Entasis I18n is the SSR direction owner; without it, the client reconciles the root's computed DOM direction after mount. It always uses Entasis ScrollArea; there is no native-scrollbar switch. `color`, `locale`, `dir`, `initialScrollDate`, `scrollbars`, `stickyHeader`, `minGridWidth`, `maxGridWidth`, `overscan`, and public touch thresholds do not exist.

A dependency-creation function remains required when dependency creation is enabled because a generic dependency can contain required consumer fields that GanttChart cannot fabricate. The function supplies the ID and custom fields; GanttChart preserves the gesture-owned endpoints and type, then runs the normal validation and mutation pipeline.

`allowOverlap` does not exist.

## Mutation contract

Every mutation source—pointer, keyboard, inline editor, clipboard, history, and API—uses this order:

1. Construct a typed proposal from the latest controlled collections.
2. Validate structural/domain invariants.
3. Call the corresponding synchronous `mutations.*.validate` function.
4. Call the corresponding synchronous `mutations.*.resolve` function.
5. Reject, accept, or apply the returned typed adjustment.
6. Revalidate the adjusted proposal.
7. Publish fresh controlled collections and a typed change record.
8. Permit one guarded revert only while the published collection signatures still match.

Errors propagate. A stale proposal, history entry, clipboard snapshot, or revert fails explicitly. No operation returns plausible fake data.

## Interaction contract

- One vertical scroll owner and one virtual row model align the tree and timeline.
- The inline splitter is resizable within frozen min/max bounds.
- Pointer task movement preserves working duration. Either resize edge can cross and continue as the opposite edge.
- Progress has an independent gesture. Empty timeline drag proposes a range and never fabricates a task.
- Row reorder, indent, outdent, and dependency creation use installed Pragmatic Drag and Drop primitives where their verified contracts fit; pointer ranges/progress use the shared pointer-drag attachment.
- Layout sampling is requestAnimationFrame-bounded and reuses prebuilt indexes.
- Valid previews preserve full geometry, are clipped by the timeline viewport, use task color, dashed border, exact duration and readable dates. Invalid targets show no red indicator and use a not-allowed cursor.
- Handles have at least 24px hit targets without consuming short bars.
- Every gesture has commit, cancel, cleanup, stale-state detection, lost-capture handling, and unmount safety.
- Dependency SVG paths have generous transparent selectable/focusable hit targets and accessible descriptions.

## Keyboard, clipboard, history, and accessibility

- Roving focus covers tree cells, task controls, milestones, and dependency controls across virtual mounting.
- Arrow behavior respects hierarchy, chronology, and RTL.
- Keyboard modes cover move, start/end resize, progress, dependency creation, row hierarchy, and range creation. Enter commits; Escape cancels and restores coherent focus.
- Delete and Backspace request deletion through the mutation pipeline.
- Mod+C/Mod+V copies only a structurally valid selected standalone task subtree, calls the consumer ID hook, remaps copied internal links, and omits external links explicitly.
- Mod+Z, Mod+Shift+Z, and Mod+Y use bounded immutable history with stale controlled-collection protection.
- Live announcements cover proposals, dates, progress, dependencies, invalid reasons, propagation, commits, and cancellation.
- The component owns treegrid/timeline semantics, ARIA relationships, expanded/selected/grabbed state, focusability, high contrast, reduced motion, RTL, touch activation, and semantic hit targets even when snippets replace visual content.

## Snippet contract

Typed Svelte 5 snippets are frozen for:

- `header`, `actions`
- `gridHeader`, `columnHeader`, `treeCell`, `taskRow`
- one `timeHeader`, whose payload identifies the upper or lower tier
- one `task`, whose payload identifies leaf, summary, or milestone tasks, plus `taskLabel`
- `taskTooltip`, `dependencyTooltip`
- `progress`, `baseline`, `deadline`, `nonWorkingTime`
- `resourceAssignments`, `workloadCell`
- `dragPreview`, `empty`, `loadingContent`

Payloads expose typed consumer fields and ready-made `defaultContent` snippets where replacement content is meaningful. Snippets cannot replace component-owned controls, hit targets, semantic roles/states, drag/resize wiring, selection, or live regions.

## Imperative API

`GanttChartApi` exposes only real behavior:

- Navigation: `fitProject`, `zoomIn`, `zoomOut`, `setZoom`, `scrollToDate`, `scrollToTask`, `getVisibleRange`.
- Queries: task definition/resolved node, dependency, assignment, visible resolved nodes, schedule analysis, workload.
- Hierarchy and selection: expand/collapse/toggle/all, select/clear.
- Mutations: add/update/remove task; add/update/remove dependency; add/update/remove assignment.
- Clipboard/history: copy, paste, undo, redo, `canUndo`, `canRedo`.
- `cancelInteraction`.

Until a capability is implemented, it is not exposed by a runtime object that pretends success.

## Theme contract

One `ganttChartTheme` object owns stable parts for the shell, header/actions, split panes, splitter, scroll viewport, grid headers/cells/rows, timeline headers/cells, task/summary/milestone/segment/progress/baseline/deadline/labels, connectors and hit targets, non-working/today/project/constraint/critical/workload markers, previews, handles, focus/live/loading/empty states, and optional workload panel. It exports `setGanttChartTheme`, `useGanttChartTheme`, size/density/color/state variants, and CSS metric variables.

## Deliberate reuse

Shared scheduling primitives will be extracted only where both consumers have the exact invariant:

- `civilDate.ts`: canonical civil-date parsing/formatting and arithmetic.
- `zonedTime.ts`: explicit-zone parts, wall-time resolution, day boundaries, cached Intl formatters, and working-minute support.
- `scheduleRange.ts`: half-open range assertions/intersection and instant snapping.
- `scheduleOrder.ts`: stable start/duration/priority/key ordering.
- A named flat-hierarchy module only if EventCalendar and GanttChart use identical parent, cycle, and preorder semantics.

EventCalendar public errors, types, names, and behavior remain unchanged while its private imports move to shared owners. A shared transaction/history abstraction will be introduced only if both components are migrated to identical stale/revert invariants; otherwise each component retains its own owner.

Direct reuse includes pointerDrag, installed Pragmatic Drag and Drop and auto-scroll, TanStack Svelte Virtual, and existing Entasis primitives. No external Gantt dependency will be added.

### EventCalendar source map

The complete EventCalendar module has distinct owners: the root composition component; bindable state; pointer/keyboard transaction controller; accessibility controller; date profile and zoned-time module; item/occurrence index; resource hierarchy/index; recurrence and recurrence mutation; month, time-grid, agenda, and resource view renderers; layout; props/types/error/theme/MCP; and documentation examples.

The verified import graph makes `eventCalendar.date.ts` a shared-candidate source used by the root, state, interactions, a11y, items, recurrence, recurrence mutation, date jump, month insertion/layout/view/row, time-grid/layout/day/all-day, agenda, resource header, item tooltip, and header. Extraction therefore keeps the EventCalendar-named module as a compatibility facade while those consumers migrate in one phase.

Exact shared-date candidates are `assertValidInstant`, IANA validation, locale normalization, canonical civil parsing/formatting, zoned parts/day, wall-time resolution (earliest repeated instant and pre-transition gap offset), zoned day boundaries, civil day/month/week arithmetic, weekday and civil-day difference, half-open range assertion/intersection, instant snapping, cached Intl formatters, same-day zoned-minute resolution, and the internal Gregorian/transition primitives they require. EventCalendar-only visible-day profiles, navigation ranges, off-day policy, view/title logic, domain boundary messages, and occurrence slots remain in its facade.

`compareEventCalendarScheduleValues` has the exact shared ordering rule—start ascending, duration descending, priority descending, stable key ascending—and is consumed by item indexing and month insertion. It moves to `scheduleOrder.ts`; the EventCalendar export remains as a named delegation so public/private behavior is unchanged.

The resource hierarchy uses input-order siblings, validates unique non-empty IDs, existing non-self parents and cycles, emits deterministic preorder/depth/leaf ranges, and is structurally identical to the Gantt resource hierarchy. Those structural operations move to a generic `flatHierarchy.ts` result that carries no component error type. EventCalendar and GanttChart retain separate definition validation and translate structural failures to their own stable errors. EventCalendar assignment/business-hours/leaf-column behavior and Gantt capacity/calendar/workload behavior remain separate.

## Phase ledger and exit gates

1. **Phase 0 — baseline/source map/contract.** Public generics, unions, props, snippets, callbacks, errors, API, installed interfaces, completed-task policy, baseline failures, and extraction map are frozen and type-probed.
2. **Phase 1 — pure engine.** Shared primitives and Gantt validation/hierarchy/DAG/calendar/propagation/constraints/CPM/workload are deterministic and SSR-safe; EventCalendar behavior/package checks remain clean.
3. **Phase 2 — package shell.** Package import, SSR/hydration, controlled coordinator, theme, i18n, split shell, docs skeleton, empty/loading states, and one scroll owner pass.
4. **Phase 3 — tree/grid.** Hierarchy, columns, editing, selection, synchronized virtual rows, splitter, reorder/indent/outdent, and 5,000-row bounded DOM pass.
5. **Phase 4 — static timeline.** All scales, horizontal windowing, anchored zoom, project elements, every task shape, connectors, tooltips, RTL and SSR rendering pass.
6. **Phase 5 — task/hierarchy pointer operations.** Unified validated transactions, previews, snapping, auto-scroll, edge crossing, cancellation, stale/revert safety, and cleanup pass.
7. **Phase 6 — dependency editing/scheduling.** All link types, lag, selection/deletion, cycle protection, previews, and every propagation policy pass.
8. **Phase 7 — scheduling analysis.** Calendars, constraints, completed-task policy, slack, critical path, violations, recomputation, and visualization pass.
9. **Phase 8 — resources.** Assignment editing/display, resource filter/group, calendar-aware capacity/workload, over-allocation, and aligned bounded panel pass without leveling.
10. **Phase 9 — input/accessibility.** Keyboard-only operations, virtual focus restoration, touch, clipboard, history, announcements, reduced motion, high contrast, and RTL pass.
11. **Phase 10 — composition/API.** Every snippet, built-in editor, typed custom column, and imperative method uses real shared behavior; custom fields survive end-to-end.
12. **Phase 11 — release surface.** Polished docs examples, MCP description, exports/types mapping, packed consumer, Publint, and measured `PERFORMANCE.md` agree with implementation.
13. **Phase 12 — whole-system audit.** Owned formatting/lint/diff, baseline-vs-new check, prepack/pack, SSR/hydration, browser matrices, 5,000 tasks/10,000 links, complete diff, and unrelated-work preservation are clean.

No phase begins until the preceding exit gate is demonstrably clean. Temporary probes and fixtures are removed before a phase commit.

## Non-goals

No recurrence; EventCalendar views; provider sync; fetching; persistence; retries; collaboration; comments; CRDTs; server scheduling; automatic resource leveling; portfolio optimization; proprietary/PDF/image/Excel/MS Project import/export; generic plugin system; Canvas-only rendering; built-in task editor dialog; deployment; or publication.

The documentation composes creation/editing with existing Entasis Dialog and Form inputs. Print-friendly CSS is allowed. JSON/CSV snapshot helpers are not part of the frozen interface.
