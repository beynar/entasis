import {
	constructAggregationFn,
	constructTable,
	functionalUpdate,
	type ExpandedState,
	type RowSelectionState,
	type Updater
} from '@tanstack/table-core';
import { DataTableEditing } from './dataTable.editing.svelte.js';
import { DataTableFocus } from './dataTable.focus.svelte.js';
import type {
	DataTableColumn,
	DataTablePinning,
	DataTableProps,
	DataTableRowPayload,
	DataTableState
} from './dataTable.props.js';
import {
	dataTableFeatures,
	fromPinningPosition,
	type DataTableCellInstance,
	type DataTableColumnDef,
	type DataTableColumnInstance,
	type DataTableFeatures,
	type DataTableRowData,
	type DataTableRowInstance,
	type DataTableTableInstance
} from './dataTable.table.js';

export const DATA_TABLE_SELECTION_COLUMN = '__selection';
export const DATA_TABLE_ACTIONS_COLUMN = '__actions';
const INTERNAL_COLUMNS = new Set([DATA_TABLE_SELECTION_COLUMN, DATA_TABLE_ACTIONS_COLUMN]);

const DEFAULT_PAGE_SIZE = 25;

export function createDataTableState<TData>(
	columns: readonly DataTableColumn<TData>[],
	initialState: Partial<DataTableState> | undefined = undefined,
	pageSize = DEFAULT_PAGE_SIZE
): DataTableState {
	return {
		sorting: initialState?.sorting ?? [],
		globalFilter: initialState?.globalFilter ?? '',
		columnFilters: initialState?.columnFilters ?? [],
		pagination: initialState?.pagination ?? { page: 1, pageSize },
		rowSelection: initialState?.rowSelection ?? {},
		columnVisibility: initialState?.columnVisibility ?? {},
		columnOrder: initialState?.columnOrder ?? columns.map((column) => column.id),
		columnPinning: initialState?.columnPinning ?? { left: [], right: [] },
		columnSizing: initialState?.columnSizing ?? {},
		grouping: initialState?.grouping ?? [],
		expanded: initialState?.expanded ?? {}
	};
}

type DataTableModelOptions<TData> = {
	get props(): DataTableProps<TData>;
	get state(): DataTableState;
	set state(value: DataTableState);
};

const asRecord = (value: ExpandedState): Record<string, boolean> => {
	if (value === true) return {};
	return value;
};

const valuesEqual = (left: readonly string[], right: readonly string[]) =>
	left.length === right.length && left.every((value, index) => value === right[index]);

export class DataTableModel<TData> {
	readonly table: DataTableTableInstance<TData>;
	readonly editTransactions = new DataTableEditing(this);
	readonly focus = new DataTableFocus(this);
	private itemsSource: readonly TData[] | null = null;
	private itemsCache: DataTableRowData<TData>[] = [];
	private columnsSource: readonly DataTableColumn<TData>[] | null = null;
	private columnsSelectionMode: DataTableProps<TData>['selectionMode'] = undefined;
	private columnsHaveActions = false;
	private columnsProcessingMode: DataTableProps<TData>['processingMode'] = undefined;
	private columnDefsCache: DataTableColumnDef<TData>[] = [];

	constructor(private readonly options: DataTableModelOptions<TData>) {
		// v9 builds the instance with `constructTable` and takes its row-model stages and
		// function registries from the static `features` object instead of `get*RowModel`
		// options. The top-level `onStateChange` option is gone; every controlled slice below
		// pairs `state.<slice>` with its own `on<Slice>Change`.
		this.table = constructTable<DataTableFeatures, DataTableRowData<TData>>({
			features: dataTableFeatures,
			renderFallbackValue: null,
			data: [],
			columns: [],
			getRowId: (_, index) => String(index),
			state: {}
		});
	}

	get props() {
		return this.options.props;
	}

	get state() {
		return this.options.state;
	}

	get publicColumns() {
		return this.props.columns;
	}

	get pageRows() {
		return this.table.getRowModel().rows;
	}

	get filteredRows() {
		return this.table.getFilteredRowModel().flatRows;
	}

	get selectedRows() {
		return this.table
			.getCoreRowModel()
			.flatRows.filter((row) => this.state.rowSelection[row.id])
			.map((row) => row.original as TData);
	}

	get pendingCommitCount() {
		return this.editTransactions.pendingCommitCount;
	}

	get editing() {
		return this.editTransactions.editing;
	}

	get focusedCell() {
		return this.focus.focusedCell;
	}

	get hasFocusedCell() {
		return this.focus.hasFocusedCell;
	}

	getColumnConfig(columnId: string) {
		return this.publicColumns.find((column) => column.id === columnId);
	}

	getCellValue(row: DataTableRowInstance<TData>, columnId: string) {
		return this.editTransactions.getCellValue(row, columnId);
	}

	/** Logical `start`/`end` pinning read back in DataTable's public `left`/`right` spelling. */
	getColumnPinning(column: DataTableColumnInstance<TData>): DataTablePinning {
		return fromPinningPosition(column.getIsPinned());
	}

	/** Distance from the pinned edge for a sticky header or cell, in pixels. */
	getColumnPinnedOffset(column: DataTableColumnInstance<TData>) {
		const side = this.getColumnPinning(column);
		if (side === 'left') return column.getStart('start');
		if (side === 'right') return column.getAfter('end');
		return 0;
	}

	get startPinnedColumns() {
		return this.table.getStartVisibleLeafColumns();
	}

	get endPinnedColumns() {
		return this.table.getEndVisibleLeafColumns();
	}

	/**
	 * v9 narrowed `cell.getIsAggregated()` to "this column has an aggregation function and the
	 * row groups a different column". DataTable's `aggregated` payload has always meant v8's
	 * broader "this cell stands for the rows underneath it", which also covers hierarchical
	 * parent rows and columns with no aggregation, so it is computed here instead.
	 */
	isCellAggregated(cell: DataTableCellInstance<TData>) {
		return !cell.getIsGrouped() && !cell.getIsPlaceholder() && !!cell.row.subRows.length;
	}

	getRowPayload(row: DataTableRowInstance<TData>): DataTableRowPayload<TData> {
		return {
			row: row.original as TData,
			rowId: row.id,
			selected: !!this.state.rowSelection[row.id],
			expanded: !!this.state.expanded[row.id],
			depth: row.depth,
			toggleSelected: () => {
				if (!this.props.disabled) row.toggleSelected();
			},
			toggleExpanded: () => {
				if (!this.props.disabled) row.toggleExpanded();
			}
		};
	}

	getEditorPayload() {
		return this.editTransactions.getPayload();
	}

	updateOptions() {
		const props = this.props;
		const state = this.state;
		const isManual = props.processingMode === 'manual';
		const columnOrder = [
			...(props.selectionMode !== 'none' ? [DATA_TABLE_SELECTION_COLUMN] : []),
			...state.columnOrder,
			...(props.rowActions ? [DATA_TABLE_ACTIONS_COLUMN] : [])
		];
		const startPinning = [
			...(props.selectionMode !== 'none' ? [DATA_TABLE_SELECTION_COLUMN] : []),
			...state.columnPinning.left
		];
		const endPinning = [
			...state.columnPinning.right,
			...(props.rowActions ? [DATA_TABLE_ACTIONS_COLUMN] : [])
		];

		this.table.setOptions((previous) => ({
			...previous,
			data: this.getTableItems(),
			columns: this.getColumnDefs(),
			getRowId: (row, index, parent) => props.getRowId(row as TData, index, parent?.original),
			getSubRows: props.getSubRows
				? (row, index) =>
						[...(props.getSubRows?.(row as TData, index) ?? [])] as DataTableRowData<TData>[]
				: undefined,
			getRowCanExpand: (row) =>
				props.canExpand?.(row.original as TData) ??
				(row.subRows.length > 0 || !!props.expandedContent),
			enableRowSelection: (row) =>
				!props.disabled &&
				props.selectionMode !== 'none' &&
				(props.isRowSelectable?.(row.original as TData) ?? true),
			enableMultiRowSelection: props.selectionMode === 'multiple',
			manualFiltering: isManual,
			manualSorting: isManual,
			manualGrouping: isManual,
			manualPagination: isManual || props.pagination === false,
			rowCount: isManual ? props.rowCount : undefined,
			pageCount:
				isManual && props.rowCount !== undefined
					? Math.ceil(props.rowCount / state.pagination.pageSize)
					: undefined,
			autoResetPageIndex: false,
			autoResetAll: false,
			columnResizeMode: 'onChange',
			state: {
				sorting: state.sorting,
				globalFilter: state.globalFilter,
				columnFilters: state.columnFilters,
				pagination: {
					pageIndex: Math.max(0, state.pagination.page - 1),
					pageSize: state.pagination.pageSize
				},
				// v9 narrowed the slice to the selected ids only (`Record<string, true>`). The public
				// `DataTableState.rowSelection` keeps `Record<string, boolean>`; `false` entries read
				// as unselected in both versions.
				rowSelection: state.rowSelection as RowSelectionState,
				columnVisibility: state.columnVisibility,
				columnOrder,
				// v9 pins into logical regions; the public state stays physical left/right.
				columnPinning: { start: startPinning, end: endPinning },
				columnSizing: state.columnSizing,
				grouping: isManual ? [] : state.grouping,
				expanded: state.expanded
			},
			onSortingChange: (updater) => this.updateSlice('sorting', updater, { resetPage: true }),
			onGlobalFilterChange: (updater) =>
				this.updateSlice('globalFilter', updater, { resetPage: true }),
			onColumnFiltersChange: (updater) =>
				this.updateSlice('columnFilters', updater, { resetPage: true }),
			onPaginationChange: (updater) => {
				const current = {
					pageIndex: Math.max(0, this.state.pagination.page - 1),
					pageSize: this.state.pagination.pageSize
				};
				const next = functionalUpdate(updater, current);
				this.setState({
					...this.state,
					pagination: { page: next.pageIndex + 1, pageSize: next.pageSize }
				});
			},
			onRowSelectionChange: (updater) =>
				this.updateSlice('rowSelection', updater as Updater<Record<string, boolean>>),
			onColumnVisibilityChange: (updater) => this.updateSlice('columnVisibility', updater),
			onColumnOrderChange: (updater) => {
				const next = functionalUpdate(updater, columnOrder).filter(
					(columnId) => !INTERNAL_COLUMNS.has(columnId)
				);
				this.setState({ ...this.state, columnOrder: next });
			},
			onColumnPinningChange: (updater) => {
				const next = functionalUpdate(updater, { start: startPinning, end: endPinning });
				this.setState({
					...this.state,
					columnPinning: {
						left: (next.start ?? []).filter((columnId) => !INTERNAL_COLUMNS.has(columnId)),
						right: (next.end ?? []).filter((columnId) => !INTERNAL_COLUMNS.has(columnId))
					}
				});
			},
			onColumnSizingChange: (updater) => this.updateSlice('columnSizing', updater),
			onGroupingChange: (updater) => this.updateSlice('grouping', updater, { resetPage: true }),
			onExpandedChange: (updater: Updater<ExpandedState>) => {
				const next = functionalUpdate(updater, this.state.expanded);
				this.setState({ ...this.state, expanded: asRecord(next) });
			}
		}));
	}

	reconcileProcessingMode() {
		if (this.props.processingMode !== 'manual' || this.state.grouping.length === 0) return;
		this.setState({ ...this.state, grouping: [], expanded: {} });
	}

	reconcileColumns() {
		const available = this.publicColumns.map((column) => column.id);
		const next = [
			...this.state.columnOrder.filter((columnId) => available.includes(columnId)),
			...available.filter((columnId) => !this.state.columnOrder.includes(columnId))
		];
		if (valuesEqual(next, this.state.columnOrder)) return;
		this.setState({ ...this.state, columnOrder: next });
	}

	setState(state: DataTableState) {
		this.options.state = state;
		this.props.onStateChange?.(state);
	}

	setColumnFilter(columnId: string, value: unknown) {
		const column = this.table.getColumn(columnId);
		column?.setFilterValue(value);
	}

	clearFilters() {
		this.setState({
			...this.state,
			globalFilter: '',
			columnFilters: [],
			pagination: { ...this.state.pagination, page: 1 }
		});
	}

	clearSelection() {
		this.setState({ ...this.state, rowSelection: {} });
	}

	setGlobalFilter(value: string) {
		this.table.setGlobalFilter(value);
	}

	setPage(page: number) {
		this.table.setPageIndex(Math.max(0, page - 1));
	}

	setPageSize(pageSize: number) {
		this.table.setPageSize(pageSize);
	}

	reorderColumns(columns: readonly DataTableColumn<TData>[]) {
		const reorderedIds = columns.map((column) => column.id);
		let nextIndex = 0;
		const columnOrder = this.state.columnOrder.map((columnId) => {
			if (!reorderedIds.includes(columnId)) return columnId;
			return reorderedIds[nextIndex++] ?? columnId;
		});
		this.setState({ ...this.state, columnOrder });
	}

	moveColumn(columnId: string, offset: -1 | 1) {
		let region = this.state.columnOrder.filter(
			(id) =>
				!this.state.columnPinning.left.includes(id) && !this.state.columnPinning.right.includes(id)
		);
		if (this.state.columnPinning.left.includes(columnId)) region = this.state.columnPinning.left;
		if (this.state.columnPinning.right.includes(columnId)) region = this.state.columnPinning.right;
		const currentIndex = region.indexOf(columnId);
		const targetId = region[currentIndex + offset];
		if (currentIndex < 0 || !targetId) return;
		const columnOrder = [...this.state.columnOrder];
		const sourceOrderIndex = columnOrder.indexOf(columnId);
		const targetOrderIndex = columnOrder.indexOf(targetId);
		if (sourceOrderIndex < 0 || targetOrderIndex < 0) return;
		[columnOrder[sourceOrderIndex], columnOrder[targetOrderIndex]] = [
			columnOrder[targetOrderIndex],
			columnOrder[sourceOrderIndex]
		];
		this.setState({ ...this.state, columnOrder });
	}

	setColumnSize(columnId: string, size: number) {
		const column = this.table.getColumn(columnId);
		if (!column) return;
		const nextSize = Math.max(
			column.columnDef.minSize ?? 80,
			Math.min(size, column.columnDef.maxSize ?? 640)
		);
		this.setState({
			...this.state,
			columnSizing: { ...this.state.columnSizing, [columnId]: nextSize }
		});
	}

	startEditing(row: DataTableRowInstance<TData>, columnId: string) {
		this.editTransactions.start(row, columnId);
	}

	setDraft(value: unknown) {
		this.editTransactions.setDraft(value);
	}

	async commitEditing(): Promise<boolean> {
		return this.editTransactions.commit();
	}

	cancelEditing() {
		this.editTransactions.cancel();
	}

	moveFocusedCell(row: number, column: number) {
		this.focus.move(row, column);
	}

	reconcileFocusedCell() {
		this.focus.reconcile();
	}

	clearFocusedCell() {
		this.focus.clear();
	}

	private updateSlice<Key extends keyof DataTableState>(
		key: Key,
		updater: Updater<DataTableState[Key]>,
		options: { resetPage?: boolean } = {}
	) {
		const nextValue = functionalUpdate(updater, this.state[key]);
		this.setState({
			...this.state,
			[key]: nextValue,
			pagination: options.resetPage ? { ...this.state.pagination, page: 1 } : this.state.pagination
		});
	}

	private getTableItems() {
		if (this.itemsSource === this.props.items) return this.itemsCache;
		this.itemsSource = this.props.items;
		this.itemsCache = [...this.props.items] as DataTableRowData<TData>[];
		return this.itemsCache;
	}

	private getColumnDefs() {
		const hasRowActions = !!this.props.rowActions;
		if (
			this.columnsSource === this.publicColumns &&
			this.columnsSelectionMode === this.props.selectionMode &&
			this.columnsHaveActions === hasRowActions &&
			this.columnsProcessingMode === this.props.processingMode
		) {
			return this.columnDefsCache;
		}
		this.columnsSource = this.publicColumns;
		this.columnsSelectionMode = this.props.selectionMode;
		this.columnsHaveActions = hasRowActions;
		this.columnsProcessingMode = this.props.processingMode;
		this.columnDefsCache = this.createColumnDefs();
		return this.columnDefsCache;
	}

	private createColumnDefs(): DataTableColumnDef<TData>[] {
		const definitions: DataTableColumnDef<TData>[] = [];
		if (this.props.selectionMode !== 'none') {
			definitions.push({
				id: DATA_TABLE_SELECTION_COLUMN,
				size: 36,
				minSize: 36,
				maxSize: 36,
				enableHiding: false,
				enablePinning: false,
				enableResizing: false,
				enableSorting: false,
				enableGrouping: false
			});
		}

		for (const column of this.publicColumns) {
			const sorting = typeof column.sortable === 'function' ? column.sortable : null;
			const accessor = column.accessor;
			const accessorFn =
				typeof accessor === 'function'
					? (row: DataTableRowData<TData>, index: number) => accessor(row as TData, index)
					: (row: DataTableRowData<TData>) => row[accessor];
			definitions.push({
				id: column.id,
				accessorFn,
				size: column.width ?? 180,
				minSize: column.minWidth ?? 80,
				maxSize: column.maxWidth ?? 640,
				enableHiding: column.hideable !== false,
				enablePinning: column.pinnable !== false,
				enableResizing: column.resizable !== false,
				enableSorting: !!column.sortable,
				enableColumnFilter: !!column.filter,
				enableGlobalFilter: true,
				enableGrouping: this.props.processingMode !== 'manual' && !!column.groupable,
				// v9 renamed the column-def sorting slot from `sortingFn` to `sortFn`.
				sortFn: sorting
					? (left, right) => sorting(left.original as TData, right.original as TData, column.id)
					: 'auto',
				filterFn: this.createFilterFn(column),
				aggregationFn: this.createAggregationFn(column),
				// v8 handed every aggregation the group's terminal leaf rows. v9 selects rows by
				// depth and defaults to 0 (the group's direct rows), so ask for the full descent.
				maxAggregationDepth: Number.POSITIVE_INFINITY
			});
		}

		if (this.props.rowActions) {
			definitions.push({
				id: DATA_TABLE_ACTIONS_COLUMN,
				size: 36,
				minSize: 36,
				maxSize: 36,
				enableHiding: false,
				enablePinning: false,
				enableResizing: false,
				enableSorting: false,
				enableGrouping: false
			});
		}
		return definitions;
	}

	private createFilterFn(column: DataTableColumn<TData>): DataTableColumnDef<TData>['filterFn'] {
		const filter = column.filter;
		if (!filter) return 'auto';
		return (row, columnId, filterValue) => {
			const value = row.getValue(columnId);
			switch (filter.type) {
				case 'text':
					return String(value ?? '')
						.toLocaleLowerCase()
						.includes(String(filterValue ?? '').toLocaleLowerCase());
				case 'number': {
					const numericValue = Number(value);
					const range = filterValue as { min?: number; max?: number } | undefined;
					if (!Number.isFinite(numericValue)) return false;
					if (range?.min !== undefined && numericValue < range.min) return false;
					if (range?.max !== undefined && numericValue > range.max) return false;
					return true;
				}
				case 'select':
					return !filterValue || String(value) === String(filterValue);
				case 'multi-select':
					return !Array.isArray(filterValue) || filterValue.length === 0
						? true
						: filterValue.map(String).includes(String(value));
				case 'date': {
					if (!filterValue) return true;
					// `new Date(string)` and `Date.parse` share the same parsing algorithm, so working with
					// timestamps keeps the comparisons identical without allocating a Date per row.
					const candidateTime = value instanceof Date ? value.getTime() : Date.parse(String(value));
					const range = filterValue as { start?: Date; end?: Date };
					if (Number.isNaN(candidateTime)) return false;
					if (range.start && candidateTime < range.start.getTime()) return false;
					if (range.end) {
						// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Local end-of-day clone, never read reactively; SvelteDate would create/mutate state inside a derived filter.
						const end = new Date(range.end);
						end.setHours(23, 59, 59, 999);
						if (candidateTime > end.getTime()) return false;
					}
					return true;
				}
				case 'boolean':
					return filterValue === undefined || filterValue === null || value === filterValue;
				case 'custom':
					return filter.predicate(row.original as TData, filterValue, value);
			}
		};
	}

	private createAggregationFn(
		column: DataTableColumn<TData>
	): DataTableColumnDef<TData>['aggregationFn'] {
		if (!column.aggregation) return undefined;
		if (typeof column.aggregation === 'string') return column.aggregation;
		const aggregate = column.aggregation;
		// v9 replaced the `(columnId, leafRows, childRows)` callable with a context object. No
		// `merge` is supplied, so a nested group re-aggregates its terminal rows exactly as v8 did.
		return constructAggregationFn({
			aggregate: (context) =>
				aggregate(
					context.rows.map((row) => context.getValue(row)),
					context.rows.map((row) => row.original as TData)
				)
		});
	}
}
