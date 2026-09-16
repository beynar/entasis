# DataTable Hardening Plan

## Goal

Bring `DataTable` from a strong feature-complete beta to a release-ready Svelai primitive that:

- preserves data and interaction correctness across editing, filtering, pagination, grouping, and virtualization;
- provides coherent table and ARIA-grid accessibility;
- compiles against the current project primitives;
- remains easy for simple cases;
- allows search, pagination, and other controls to be rendered outside the component without exposing TanStack internals or duplicating DataTable invariants.

## Current Verdict

The component fits the project structurally and visually, but it is not ready to be treated as a stable public primitive.

What is already strong:

- Configuration-first typed columns and named snippets follow Svelai conventions.
- TanStack Table remains private at the package boundary.
- Stable row identity is required through `getRowId`.
- Internal state transitions are immutable.
- Existing `ScrollArea`, `Pagination`, `PopupMenu`, form inputs, `Empty`, `Skeleton`, `Spinner`, and `NetworkIndicator` primitives are reused.
- Client and manual processing are separated by a discriminated prop contract.
- Row and column virtualization keep the 50,000-row example's mounted DOM bounded.
- Theme parts, MCP documentation, package exports, and the docs route use the expected project structure.

What prevents release:

- DataTable has current type-check failures.
- Several editing and ARIA-grid transitions are incorrect.
- Manual grouping is advertised without a representable server response contract.
- Controlled state exposes values but not invariant-preserving commands.
- Client-side pagination processing cannot be retained while rendering pagination elsewhere.

## Review Method

The current implementation was reviewed through four independent adversarial passes:

1. Public API ergonomics and ease of adoption.
2. Architecture and fit with Svelai conventions.
3. Correctness, accessibility, virtualization, and editing behavior.
4. External composition, especially search and pagination rendered around DataTable.

Reported findings were traced back to the current source before inclusion here. One proposed stale-prop finding was rejected because `model.updateOptions()` reads the live props getter inside the reactive effect and therefore establishes the required dependencies.

## Public API Direction

Keep `bind:state` for observation, persistence, and manual-server requests. Do not make direct state mutation the primary command interface because it can bypass page resets, size clamps, visibility guards, internal-column filtering, and selection-mode constraints.

Add a narrow public API object following the existing bindable `StepperState` pattern and the deliberately limited `SidebarApi` shape:

```ts
export type DataTableApi<TData> = {
	readonly state: DataTableState;
	readonly totalItems: number;
	readonly totalPages: number;
	readonly visibleRows: readonly TData[];
	readonly selectedRows: readonly TData[];
	readonly isSaving: boolean;
	setGlobalFilter: (value: string) => void;
	setColumnFilter: (columnId: string, value: unknown) => void;
	clearFilters: () => void;
	clearSelection: () => void;
	setPage: (page: number) => void;
	setPageSize: (pageSize: number) => void;
};
```

Expose it through the bindable `api` prop:

```svelte
<script lang="ts">
	let dataTable: DataTableApi<Person>;
</script>

<TextInput
	value={dataTable?.state.globalFilter ?? ''}
	onValueChange={(value) => dataTable?.setGlobalFilter(value ?? '')}
/>

<DataTable
	bind:api={dataTable}
	{items}
	{columns}
	getRowId={(person) => person.id}
	pagination={{ showControls: false }}
/>

<Pagination
	value={dataTable?.state.pagination.page ?? 1}
	totalPages={dataTable?.totalPages ?? 1}
	onValueChange={(page) => dataTable?.setPage(page)}
/>
```

Extend pagination configuration without changing processing semantics:

```ts
export type DataTablePaginationConfig = {
	pageSize?: number;
	pageSizes?: readonly number[];
	showControls?: boolean;
};
```

`pagination={false}` continues to mean no pagination. `pagination={{ showControls: false }}` retains client or manual pagination while suppressing only the built-in footer.

Export `createDataTableState(columns, initialState?, pageSize?)` so controlled consumers do not reproduce every state slice manually.

Do not export `DataTableModel` or TanStack types. The model owns engine adaptation, rendering state, editing transactions, and grid focus; exposing it would make the public contract too broad and couple consumers to implementation details.

## Phase 1: Restore The Compile Gate

- Fix the `CheckboxesInput` theme type used by `DataTableFilter` so its component-specific theme parts are accepted through the primitive's public props.
- Align DataTable's `viewportRef` with `ScrollArea`'s `HTMLDivElement | null` contract.
- Verify `DataTableSelectionCheckbox` uses the same supported theme contract.
- Run focused Svelte diagnostics for every DataTable file.
- Run `git diff --check`.

Gate: no DataTable-local TypeScript or Svelte diagnostics remain. Repository-wide unrelated diagnostics may be reported separately but cannot hide DataTable failures.

## Phase 2: Fix Data And Editing Correctness

### Calendar commits

- Change calendar selection handling to synchronously set the selected date as the editor draft before committing.
- Confirm typed date entry still allows multiple keystrokes and commits only on the established editor boundaries.

### Missing commit handler

- Prevent editor activation when a column declares `editor` but `onCellCommit` is absent.
- Emit a development-only warning identifying the affected column.
- Document `onCellCommit` as required whenever any column is editable.
- Do not allow an edit to appear successful and then silently revert.

### Concurrent optimistic failures

- Prevent another edit from replacing the recoverable editor while an asynchronous commit is pending, or store recoverable errors per cell.
- Prefer the smaller rule: one active or recoverable edit transaction at a time.
- A rejected commit must roll back the optimistic value, restore the failed editor, retain the draft, and expose the error.

### Typed edit values

- Add a keyed column helper or mapped column type that preserves the accessor value type.
- Constrain built-in editor types where practical: number editors for numeric values, date editors for dates, and switch editors for booleans.
- Make commit payloads discriminate by column ID so consumers do not assign arbitrary `unknown` values through computed properties.
- Preserve the existing escape hatch for computed accessors and custom editors.

Gate: unchanged edits emit nothing; successful edits remain optimistic until consumer data catches up; rejected edits recover visibly; calendar edits persist the selected date; incompatible common editor/value combinations fail at compile time.

## Phase 3: Repair Grid Accessibility

### Roving focus reconciliation

- Reconcile the focused cell whenever page rows or visible columns change.
- Preserve row and column IDs when they still exist.
- Otherwise clamp to the nearest valid cell.
- If the grid has no rows, move the tab stop to an appropriate state surface instead of leaving the grid with no reachable stop.

### Empty, loading, no-results, and error states

- Give state rows correct native `colspan` in table mode and `aria-colspan` in grid mode.
- Exempt state controls from the attachment that removes nested controls from tab order, or define an explicit state-cell navigation mode.
- Ensure the default Clear filters action and custom state controls are keyboard reachable.

### Grouped row metadata

- Calculate grid `aria-rowcount` and row indexes from the final expanded/grouped logical row model rather than the pre-grouping filtered leaf count.
- Include detail rows consistently in both the declared count and generated indexes.

### Disabled and DnD behavior

- Block Space-based row selection when DataTable is disabled or the row cannot be selected.
- Make TanStack's selection gate return false while the table is disabled.
- Give the reorder button an actual keyboard interaction, with move-left and move-right commands constrained to the current pin region.

Gate: grid mode always has a coherent tab stop, state recovery controls remain reachable, declared row counts match indexes, disabled tables cannot mutate, and column reordering has a keyboard path.

## Phase 4: Add The External Composition Seam

- Add and export `DataTableApi<TData>`.
- Add the bindable `dataTable?: DataTableApi<TData>` prop.
- Construct the API as a narrow facade over existing model methods and component-derived metadata.
- Keep API object identity stable across renders.
- Add `pagination.showControls`, defaulting to `true`.
- Keep `pagination={false}` as the only switch that disables pagination processing.
- Export `createDataTableState`.
- Expand `DataTableToolbarPayload` with the same safe command methods and pagination metadata where useful; do not expose the internal model.
- Correct MCP wording: `onStateChange` runs for DataTable-originated transitions, not arbitrary parent mutations of bound state.

Gate: a consumer can place search above DataTable and pagination below it while preserving client filtering, page resets, filtered totals, local pagination, and all internal guards.

## Phase 5: Make Processing Contracts Honest

### Manual grouping

The current manual input is `readonly TData[]`, which cannot represent TanStack-generated group-row metadata. Choose one explicit contract before release:

1. Recommended first release: manual mode supports server filtering, sorting, and pagination, but grouping and aggregation remain client-only. Document and enforce that limit.
2. Later extension: define a public recursive grouped-row response type containing group column, group value, depth, child count, aggregate values, and child rows.

Do not continue advertising server grouping and aggregation without implementing option 2.

### Selection across unloaded pages

- Keep row-selection state keyed by stable IDs.
- Document that `selectedRows` can only contain currently loaded row objects in manual mode.
- If bulk actions need unloaded selections, expose selected IDs separately rather than fabricating unavailable rows.

### Custom filters

- Add a custom filter renderer mirroring the existing custom editor escape hatch.
- Provide current value, `setValue`, `clear`, active state, and column metadata.
- Keep built-in text, number, select, multi-select, date, and boolean filters as the concise default path.

Gate: every advertised processing feature has a representable input/output contract, and domain-specific filters do not require forking DataTable.

## Phase 6: Documentation And Maintainability

### Documentation

- Add a controlled-state example using exported `createDataTableState`.
- Add an external search and external pagination example using `bind:api` and `showControls: false`.
- Add complete Svelte 5 examples for custom cells, headers, filters, editors, and toolbar snippets.
- Replace the race-prone manual request example with an abortable or sequence-guarded request that handles errors and cleanup.
- Explain the difference between observing `state`, invoking `DataTableApi`, and handling `onStateChange`.
- Document loaded-row limitations for manual selection.

### Internal cohesion

After correctness and API behavior are stable:

- Extract editing transactions from `DataTableModel` into a private cohesive owner.
- Extract row/column virtualization and focus restoration from `DataTable.svelte` if the resulting interface is smaller than the current coupling.
- Move duplicated pinned-column layout queries from header and row components behind model-owned selectors.
- Remove inactive inherited `tableTheme` parts or deliberately map DataTable rendering parts onto the shared Table vocabulary.

Do not perform this decomposition before behavior is fixed; otherwise the work moves defects across new boundaries.

Gate: docs examples are copyable, public claims match behavior, and any extracted module has one independently meaningful responsibility.

## Verification Matrix

### Static verification

- Run Prettier only on touched DataTable, supporting primitive, docs, export, and MCP files.
- Run focused Svelte diagnostics and confirm zero DataTable-local errors.
- Run `npm run check`; separate unrelated repository diagnostics explicitly.
- Run `npm run prepack` once the focused gate passes.
- Run `git diff --check`.

### Browser verification

- Client and manual search, sorting, filtering, pagination, grouping, expansion, visibility, ordering, sizing, and pinning.
- External search and pagination composed around DataTable.
- Successful, unchanged, rejected, calendar, select, switch, and custom editing flows.
- Multiple rapid manual requests resolving out of order.
- Pagination and filtering after focusing the last visible grid row.
- Empty, no-results, loading, and error controls in table and grid modes.
- Disabled keyboard and pointer interactions.
- Keyboard column reordering and resizing.
- RTL left/right pinning.
- Light and dark themes across all densities.
- Narrow mobile viewport and wide horizontally scrollable datasets.
- At least 50,000 rows with mounted DOM bounded by viewport plus overscan.

### Accessibility verification

- Inspect the accessibility tree in table and grid modes.
- Confirm one coherent roving cell tab stop whenever rows exist.
- Confirm logical `aria-rowcount`, `aria-rowindex`, `aria-colcount`, and `aria-colindex` under grouping, expansion, pagination, and virtualization.
- Confirm empty/error recovery controls are reachable.
- Confirm resize separators and reorder controls have working keyboard interactions and accurate labels.

No new automated test files are part of this plan unless explicitly requested. The required gates are focused diagnostics, packaging, and deliberate browser/accessibility smoke checks.

## Done When

- DataTable contributes no compile diagnostics.
- No edit can silently disappear or commit a stale value.
- Grid navigation remains valid after every row/column model change.
- Disabled mode blocks every mutation path.
- Manual processing claims match the data contract.
- External search and pagination compose around DataTable without direct state surgery or duplicated processing.
- Public helpers remove controlled-state boilerplate.
- Documentation includes copyable examples for every major extension point.
- TanStack remains private and the public API remains smaller than `DataTableModel`.
