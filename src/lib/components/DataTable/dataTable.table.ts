// TanStack Table v9 wiring for DataTable. v9 ships no ambient feature set: every API the
// component reaches for (sorting, filtering, faceting, grouping, aggregation, expansion,
// pagination, selection, ordering, pinning, sizing, resizing, visibility) exists only when its
// feature module is registered here, and each row-model stage is a `create*RowModel()` slot
// instead of a `get*RowModel` table option.
import {
	aggregationFn_count,
	aggregationFn_max,
	aggregationFn_mean,
	aggregationFn_median,
	aggregationFn_min,
	aggregationFn_sum,
	aggregationFn_uniqueCount,
	columnFacetingFeature,
	columnFilteringFeature,
	columnGroupingFeature,
	columnOrderingFeature,
	columnPinningFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createExpandedRowModel,
	createFacetedMinMaxValues,
	createFacetedRowModel,
	createFacetedUniqueValues,
	createFilteredRowModel,
	createGroupedRowModel,
	createPaginatedRowModel,
	createSortedRowModel,
	filterFn_arrIncludes,
	filterFn_equals,
	filterFn_inDateRange,
	filterFn_includesString,
	filterFn_inNumberRange,
	filterFn_weakEquals,
	globalFilteringFeature,
	rowAggregationFeature,
	rowExpandingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	sortFn_alphanumeric,
	sortFn_basic,
	sortFn_datetime,
	sortFn_text,
	tableFeatures,
	type Cell,
	type Column,
	type ColumnDef,
	type ColumnPinningPosition,
	type Row,
	type Table
} from '@tanstack/table-core';
import { storeReactivityBindings } from '@tanstack/table-core/store-reactivity-bindings';
import type { DataTablePinning } from './dataTable.props.js';

// The bindings are stateless factories over TanStack Store atoms, so one instance is shared by
// every DataTable. They give v9 the pull-based reads DataTable already relies on: the component
// pushes controlled state through `table.setOptions` and reads row models back synchronously.
export const dataTableFeatures = tableFeatures({
	coreReactivityFeature: storeReactivityBindings(),
	// Column filtering is the prerequisite for global filtering and for faceting.
	columnFilteringFeature,
	globalFilteringFeature,
	columnFacetingFeature,
	columnGroupingFeature,
	rowAggregationFeature,
	columnOrderingFeature,
	columnPinningFeature,
	// Resizing cannot stand alone: it builds on the sizing state and offsets.
	columnSizingFeature,
	columnResizingFeature,
	columnVisibilityFeature,
	rowExpandingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowSortingFeature,
	// Row-model stages. The core model is built in and needs no slot.
	filteredRowModel: createFilteredRowModel(),
	facetedRowModel: createFacetedRowModel(),
	facetedMinMaxValues: createFacetedMinMaxValues(),
	facetedUniqueValues: createFacetedUniqueValues(),
	groupedRowModel: createGroupedRowModel(),
	sortedRowModel: createSortedRowModel(),
	expandedRowModel: createExpandedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	// Named function registries. Only the names v8 could resolve for these columns are
	// registered: the six `filterFn: 'auto'` inferences, the four `sortFn: 'auto'` inferences,
	// and the aggregation names `DataTableAggregation` accepts.
	filterFns: {
		arrIncludes: filterFn_arrIncludes,
		equals: filterFn_equals,
		inDateRange: filterFn_inDateRange,
		includesString: filterFn_includesString,
		inNumberRange: filterFn_inNumberRange,
		weakEquals: filterFn_weakEquals
	},
	sortFns: {
		alphanumeric: sortFn_alphanumeric,
		basic: sortFn_basic,
		datetime: sortFn_datetime,
		text: sortFn_text
	},
	aggregationFns: {
		count: aggregationFn_count,
		max: aggregationFn_max,
		mean: aggregationFn_mean,
		median: aggregationFn_median,
		min: aggregationFn_min,
		sum: aggregationFn_sum,
		uniqueCount: aggregationFn_uniqueCount
	}
});

export type DataTableFeatures = typeof dataTableFeatures;

/**
 * v9 narrowed `RowData` from `unknown` to `Record<string, any> | Array<any>`, which an
 * `interface`-typed row does not satisfy (interfaces carry no implicit index signature). The
 * intersection keeps DataTable's public `TData extends object` generic untouched while giving
 * table-core the row shape it now demands.
 */
export type DataTableRowData<TData> = TData & Record<string, unknown>;

export type DataTableTableInstance<TData> = Table<DataTableFeatures, DataTableRowData<TData>>;
export type DataTableRowInstance<TData> = Row<DataTableFeatures, DataTableRowData<TData>>;
export type DataTableCellInstance<TData> = Cell<
	DataTableFeatures,
	DataTableRowData<TData>,
	unknown
>;
export type DataTableColumnInstance<TData> = Column<
	DataTableFeatures,
	DataTableRowData<TData>,
	unknown
>;
export type DataTableColumnDef<TData> = ColumnDef<
	DataTableFeatures,
	DataTableRowData<TData>,
	unknown
>;

/**
 * v9 replaced physical `left`/`right` column pinning with logical `start`/`end`. DataTable's
 * public `DataTableState.columnPinning` and `DataTablePinning` keep the physical names, so the
 * two spellings are translated at the table boundary and nowhere else.
 */
export const fromPinningPosition = (position: ColumnPinningPosition): DataTablePinning =>
	position === 'start' ? 'left' : position === 'end' ? 'right' : false;
