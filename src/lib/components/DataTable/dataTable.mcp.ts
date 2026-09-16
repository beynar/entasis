export const dataTableDescription = `
# DataTable

DataTable is the typed, interactive, virtualized table for application data. Its public API is
Svelai-native; TanStack Table Core remains private. Use Table for static tabular content.

## Basic usage

\`\`\`svelte
<script lang="ts">
  import {
    createDataTableColumnHelper,
    DataTable
  } from 'svelai/data-table';

  type Person = { id: string; name: string; role: string; active: boolean };
  const column = createDataTableColumnHelper<Person>();
  const columns = [
    column.accessor('name', {
      id: 'name',
      header: 'Name',
      sortable: true,
      filter: { type: 'text' }
    }),
    column.accessor('role', { id: 'role', header: 'Role' }),
    column.accessor('active', {
      id: 'active',
      header: 'Active',
      filter: { type: 'boolean' }
    })
  ];
</script>

<DataTable
  {items}
  {columns}
  getRowId={(person) => person.id}
  height={420}
  search
  pagination={{ pageSize: 25, pageSizes: [25, 50, 100] }}
/>
\`\`\`

\`items\`, \`columns\`, and \`getRowId\` are required. Without \`height\`, DataTable fills a
parent with a definite height so the virtual viewport remains bounded. Pass \`virtualize={false}\`
instead to drop the table into normal document flow at its natural height:

\`\`\`svelte
<DataTable {items} {columns} {getRowId} virtualize={false} />
\`\`\`

## Core props

- **items**: \`readonly TData[]\`.
- **columns**: \`readonly DataTableColumn<TData>[]\`.
- **getRowId**: stable row identity used by selection, expansion, virtualization, and focus.
- **height**: optional \`string | number\`; otherwise fills a definite-height parent. Only read
  while virtualizing.
- **virtualize**: default true. False renders every row in normal flow, so the table needs no
  height and no definite-height parent.
- **density**: \`compact | normal | comfortable\`, default \`normal\`.
- **interactionMode**: \`table | grid\`, default \`table\`.
- **processingMode**: \`client | manual\`, default \`client\`.
- **selectionMode**: \`none | single | multiple\`, default \`none\`.
- **pagination**: \`false | DataTablePaginationConfig\`. False disables pagination processing.
  \`showControls: false\` keeps processing active while hiding the built-in footer.
- **search**: false, true, or placeholder/debounce configuration.
- **showColumnVisibilityControl**: default false.
- **stickyHeader**, **overscan**, **estimatedRowHeight**, and **animateRows** control rendering.
- **disabled** blocks sorting controls, selection paths, editing, and column manipulation.
- **loading** and **error** drive table states and the NetworkIndicator.
- **api**: bindable narrow external-control instance handle (\`DataTableApi<TData>\`).
- **cell** and **header**: table-level renderer snippets with \`renderDefault\` delegates.
- **class**, **theme**, **ref**, and Svelte attachments follow Svelai conventions.

## Column definitions

\`DataTableColumn<TData, TValue>\` supports \`id\`, \`accessor\`, required \`header\`, optional
\`cell\` and \`aggregatedCell\`, sorting, filtering, grouping, aggregation, editing, visibility,
resizing, reordering, pinning, alignment, \`width\` / \`minWidth\` / \`maxWidth\`, and column
classes.

Use \`createDataTableColumnHelper<TData>()\` to infer accessor values inside cell and editor
configuration. Raw DataTableColumn definitions remain available as an escape hatch.

## Rendering

Column-level renderers are part of the default rendering chain. A table-level \`cell\` renderer
wraps every public ordinary, grouped, aggregated, and placeholder cell. It does not wrap selection
cells, action cells, detail rows, or active editors. A table-level \`header\` renderer wraps only
configured public header content; sorting, menus, dragging, resizing, focus, and ARIA remain owned
by DataTable.

\`DataTableCellRenderPayload<TData>\` contains the normal cell payload plus \`column\`,
\`placeholder\`, and \`renderDefault\`. \`DataTableHeaderRenderPayload<TData>\` contains the normal
header payload plus \`renderDefault\`.

\`\`\`svelte
{#snippet cell({ columnId, value, renderDefault })}
  {#if columnId === 'status'}
    <Chip>{value}</Chip>
  {:else}
    {@render renderDefault()}
  {/if}
{/snippet}
\`\`\`

Precedence is structural rendering or an active editor, then the table-level renderer, then
\`renderDefault\`, which resolves the column renderer before the built-in fallback.

## Filters

Built-in filters are text, number range, select, multi-select, date range, and boolean.
A custom filter is \`{ type: 'custom', render, predicate }\`. Its renderer receives the column,
current value, active state, \`setValue(value)\`, and \`clear()\`; \`predicate(row, value,
columnValue)\` owns client matching. Filtering, searching, sorting, and grouping reset page one.

## State and external composition

Use \`createDataTableState(columns, initialState?, pageSize?)\` for controlled state. The bindable
state contains sorting, globalFilter, columnFilters, one-based pagination, rowSelection,
columnVisibility, columnOrder, columnPinning, columnSizing, grouping, and expanded.

DataTable updates replace slices immutably and call \`onStateChange(nextState)\`. Parent-originated
mutations through \`bind:state\` are observed without calling that callback again.

\`bind:api\` exposes a stable \`DataTableApi<TData>\` with reactive state, totals, visible
rows, selected loaded rows, save status, and commands for global/column filters, selection clearing,
page, and page size. Commands use the same guards and reset rules as built-in controls.

\`\`\`svelte
<DataTable
  bind:state
  bind:api
  pagination={{ pageSize: 25, showControls: false }}
  {...props}
/>
\`\`\`

## Client and manual processing

Client mode runs filtering, sorting, grouping, aggregation, expansion, and pagination locally.

Manual mode delegates filtering, sorting, and pagination together. It requires \`rowCount\`, and
\`items\` must contain the already processed current page. Grouping and aggregation are client-only
in this release: grouping commands are hidden and unsupported manual grouping state is normalized
away. Abort stale requests when state changes. In manual mode, \`dataTable.selectedRows\` includes
only loaded row objects; all selected IDs remain in \`state.rowSelection\`.

## Editing

Built-in editors are text, number, select, date, and switch. A custom editor snippet receives row
metadata, draft, pending/error state, \`setDraft\`, \`commit\`, and \`cancel\`. DataTable never
mutates rows; changed values call \`onCellCommit\` and render optimistically while the
NetworkIndicator tracks the request. Unchanged drafts close without a commit. Rejection rolls back,
restores the editor and draft, and exposes the error. Only one asynchronous transaction can be
active or recoverable. Columns with editors do not enter edit mode without \`onCellCommit\` and
issue a development warning.

Enter and outside clicks commit, Escape cancels, and Tab commits without leaving the edited cell.
Calendar selection synchronizes its draft before commit. Arrow keys remain owned by editor controls.

## Slots

- **caption**, **toolbarPrefix**, **toolbarSuffix**, **bulkActions**, **rowActions**,
  **expandedContent**, **loadingContent**, **empty**, **noResults**, and **errorContent**.
- Toolbar slots receive state, selected loaded rows, visible rows, clearFilters, and clearSelection.
- Row slots receive row identity, selection/expansion state, depth, and guarded toggle actions.

## Accessibility and virtualization

Table mode preserves native table semantics. Grid mode uses one roving cell tab stop with arrows,
Tab/Shift+Tab, Home/End, Ctrl+Home/Ctrl+End, and PageUp/PageDown. Focus is reconciled by row and
column identity after data, pagination, filtering, grouping, and visibility changes. State rows use
complete column spans and keep recovery controls keyboard reachable. Logical row indices derive
from the final grouped/expanded row model.

Rows are virtualized by default; \`virtualize={false}\` renders all of them in normal flow at
their natural height, keeping the same selection, keyboard navigation, and editing paths. Use it for
small datasets that belong in document flow, not for large ones. Semantic table mode keeps all
columns mounted; grid mode additionally virtualizes center columns while pinned columns stay
mounted. Resize handles support pointer and
keyboard resizing. Reorder handles support left/right keyboard movement and pointer movement within
their current pin region. Logical inset positioning preserves RTL pinning.
`;
