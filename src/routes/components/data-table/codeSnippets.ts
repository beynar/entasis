export const basicDataTableCode = `<script lang="ts">
  import { DataTable, type DataTableCellPayload, type DataTableColumn } from 'entasis/data-table';

  type Person = {
    id: string;
    name: string;
    department: string;
    salary: number;
  };

  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  const columns: DataTableColumn<Person>[] = [
    {
      id: 'name',
      accessor: 'name',
      header: 'Name',
      sortable: true,
      filter: { type: 'text' }
    },
    {
      id: 'department',
      accessor: 'department',
      header: 'Department',
      filter: {
        type: 'select',
        options: departments.map((value) => ({ value, label: value }))
      }
    },
    {
      id: 'salary',
      accessor: 'salary',
      header: 'Salary',
      sortable: true,
      filter: { type: 'number', min: 0 },
      cell: salaryCell,
      align: 'end'
    }
  ];
</script>

{#snippet salaryCell(payload: DataTableCellPayload<Person>)}
  {currency.format(Number(payload.value))}
{/snippet}

<div class="h-[440px]">
  <DataTable
    {items}
    {columns}
    getRowId={(person) => person.id}
    search={{ placeholder: 'Search the directory', debounce: 120 }}
    pagination={{ pageSize: 25, pageSizes: [25, 50, 100] }}
  />
</div>`;

export const editingDataTableCode = `<script lang="ts">
  import {
    DataTable,
    type DataTableCellCommit,
    type DataTableColumn,
    type DataTableEditorPayload
  } from 'entasis/data-table';
  import { Select } from 'entasis/select';

  let items = $state<Person[]>(initialPeople);

  const columns: DataTableColumn<Person>[] = [
    { id: 'name', accessor: 'name', header: 'Name', editor: { type: 'text' } },
    {
      id: 'role',
      accessor: 'role',
      header: 'Role',
      editor: { type: 'select', options: roleOptions }
    },
    {
      id: 'salary',
      accessor: 'salary',
      header: 'Salary',
      editor: { type: 'number', min: 0, step: 1000 }
    }
  ];

  async function commitCell(commit: DataTableCellCommit<Person>) {
    await api.people.update(commit.rowId, commit.columnId, commit.value);
    items = items.map((person) =>
      person.id === commit.rowId
        ? { ...person, [commit.columnId]: commit.value }
        : person
    );
  }
</script>

{#snippet roleEditor(editor: DataTableEditorPayload<Person>)}
  <Select
    items={roleOptions}
    value={editor.draft == null ? null : String(editor.draft)}
    disabled={editor.pending}
    onValueChange={editor.setDraft}
  />
{/snippet}

<DataTable
  {items}
  columns={columns.map((column) =>
    column.id === 'role'
      ? { ...column, editor: { type: 'custom', render: roleEditor } as const }
      : column
  )}
  getRowId={(person) => person.id}
  height={420}
  density="comfortable"
  interactionMode="grid"
  selectionMode="multiple"
  pagination={{ pageSize: 10, pageSizes: [10, 18] }}
  onCellCommit={commitCell}
/>`;

export const groupingDataTableCode = `<script lang="ts">
  import { DataTable, type DataTableColumn } from 'entasis/data-table';

  const columns: DataTableColumn<Person>[] = [
    {
      id: 'department',
      accessor: 'department',
      header: 'Department',
      groupable: true
    },
    {
      id: 'headcount',
      accessor: () => 1,
      header: 'Headcount',
      aggregation: 'sum'
    },
    {
      id: 'salary',
      accessor: 'salary',
      header: 'Average salary',
      aggregation: 'mean'
    }
  ];
</script>

<DataTable
  {items}
  {columns}
  getRowId={(person) => person.id}
  height={430}
  pagination={false}
  showColumnVisibilityControl
  initialState={{ grouping: ['department'] }}
/>`;

export const manualDataTableCode = `<script lang="ts">
  import { createDataTableState, DataTable } from 'entasis/data-table';

  let state = $state(createDataTableState(columns));
  let items = $state<Person[]>([]);
  let rowCount = $state(0);
  let loading = $state(false);
  let error = $state<unknown>(null);

  $effect(() => {
    const controller = new AbortController();
    const request = $state.snapshot(state);
    loading = true;
    error = null;

    void api.people
      .list(request, { signal: controller.signal })
      .then((response) => {
        items = response.items;
        rowCount = response.rowCount;
      })
      .catch((reason) => {
        if (reason instanceof DOMException && reason.name === 'AbortError') return;
        error = reason;
      })
      .finally(() => {
        if (!controller.signal.aborted) loading = false;
      });

    return () => controller.abort();
  });
</script>

<DataTable
  processingMode="manual"
  {rowCount}
  {items}
  {columns}
  bind:state
  getRowId={(person) => person.id}
  height={410}
  search
  {loading}
  {error}
  animateRows
/>`;

export const renderingDataTableCode = `<script lang="ts">
  import { Chip } from 'entasis/chip';
  import {
    createDataTableColumnHelper,
    DataTable,
    type DataTableCellRenderPayload,
    type DataTableFilterPayload,
    type DataTableHeaderRenderPayload
  } from 'entasis/data-table';
  import { Select } from 'entasis/select';

  const column = createDataTableColumnHelper<Person>();
  const columns = [
    column.accessor('name', { id: 'name', header: 'Name', sortable: true }),
    column.accessor('status', { id: 'status', header: 'Status' })
  ];
</script>

{#snippet statusFilter(filter: DataTableFilterPayload<Person>)}
  <Select
    items={statusOptions}
    value={typeof filter.value === 'string' ? filter.value : null}
    onValueChange={(value) => filter.setValue(value || undefined)}
  />
{/snippet}

{#snippet cell(payload: DataTableCellRenderPayload<Person>)}
  {#if payload.columnId === 'status'}
    <Chip size="small" variant="soft">{String(payload.value)}</Chip>
  {:else}
    {@render payload.renderDefault()}
  {/if}
{/snippet}

{#snippet header(payload: DataTableHeaderRenderPayload<Person>)}
  <div class="flex items-center gap-1.5">
    {@render payload.renderDefault()}
    {#if payload.filtered}<span aria-label="Filter active">•</span>{/if}
  </div>
{/snippet}

<DataTable
  {items}
  columns={columns.map((column) =>
    column.id === 'status'
      ? {
          ...column,
          filter: {
            type: 'custom',
            render: statusFilter,
            predicate: (row, value) => !value || row.status === value
          }
        }
      : column
  )}
  getRowId={(row) => row.id}
  {cell}
  {header}
/>`;

export const externalControlsDataTableCode = `<script lang="ts">
  import {
    createDataTableState,
    DataTable,
    type DataTableApi
  } from 'entasis/data-table';
  import { Pagination } from 'entasis/pagination';
  import { TextInput } from 'entasis/text-input';

  let state = $state(createDataTableState(columns, {
    pagination: { page: 1, pageSize: 10 }
  }));
  let dataTable = $state<DataTableApi<Person>>();
</script>

<TextInput
  value={dataTable?.state.globalFilter ?? ''}
  onValueChange={(value) => dataTable?.setGlobalFilter(value ?? '')}
/>

{#if dataTable}
  <Pagination
    totalPages={dataTable.totalPages}
    value={dataTable.state.pagination.page}
    onValueChange={dataTable.setPage}
  />
{/if}

<DataTable
  {items}
  {columns}
  getRowId={(row) => row.id}
  bind:state
  bind:api={dataTable}
  pagination={{ pageSize: 10, showControls: false }}
/>`;

export const gridDataTableCode = `<DataTable
  {items}
  {columns}
  getRowId={(person) => person.id}
  height={520}
  interactionMode="grid"
  density="compact"
  pagination={false}
  overscan={8}
  initialState={{
    columnPinning: { left: ['name'], right: ['status'] }
  }}
/>`;

export const inFlowDataTableCode = `<DataTable
  {items}
  {columns}
  getRowId={(person) => person.id}
  virtualize={false}
  pagination={false}
  search={false}
/>`;
