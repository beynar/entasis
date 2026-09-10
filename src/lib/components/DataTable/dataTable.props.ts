import type { Slot } from '$lib/components/Slot/slot.js';
import type { WithAttachments } from '$lib/types/props.js';
import type { Density } from '$lib/types/theme.js';
import type { Snippet } from 'svelte';
import type { DataTableThemeProps } from './dataTable.theme.js';

export type DataTableInteractionMode = 'table' | 'grid';
export type DataTableProcessingMode = 'client' | 'manual';
export type DataTableSelectionMode = 'none' | 'single' | 'multiple';
export type DataTableAlignment = 'start' | 'center' | 'end';
export type DataTablePinning = 'left' | 'right' | false;

export type DataTableSorting = {
	id: string;
	desc: boolean;
};

export type DataTableColumnFilter = {
	id: string;
	value: unknown;
};

export type DataTablePaginationState = {
	/** Current page, one-based. */
	page: number;
	pageSize: number;
};

export type DataTableState = {
	sorting: DataTableSorting[];
	globalFilter: string;
	columnFilters: DataTableColumnFilter[];
	pagination: DataTablePaginationState;
	rowSelection: Record<string, boolean>;
	columnVisibility: Record<string, boolean>;
	columnOrder: string[];
	columnPinning: { left: string[]; right: string[] };
	columnSizing: Record<string, number>;
	grouping: string[];
	expanded: Record<string, boolean>;
};

export type DataTableOption = {
	value: string;
	label: string;
	disabled?: boolean;
};

export type DataTableTextFilter = {
	type: 'text';
	placeholder?: string;
};

export type DataTableNumberFilter = {
	type: 'number';
	min?: number;
	max?: number;
};

export type DataTableSelectFilter = {
	type: 'select' | 'multi-select';
	options: readonly DataTableOption[];
};

export type DataTableDateFilter = {
	type: 'date';
	min?: Date;
	max?: Date;
};

export type DataTableBooleanFilter = {
	type: 'boolean';
	trueLabel?: string;
	falseLabel?: string;
};

export type DataTableFilterPayload<TData> = {
	column: DataTableColumn<TData>;
	value: unknown;
	active: boolean;
	setValue: (value: unknown) => void;
	clear: () => void;
};

export type DataTableCustomFilter<TData> = {
	type: 'custom';
	render: Snippet<[DataTableFilterPayload<TData>]>;
	predicate: (row: TData, value: unknown, columnValue: unknown) => boolean;
};

export type DataTableFilter<TData = unknown> =
	| DataTableTextFilter
	| DataTableNumberFilter
	| DataTableSelectFilter
	| DataTableDateFilter
	| DataTableBooleanFilter
	| DataTableCustomFilter<TData>;

export type DataTableTextEditor = {
	type: 'text';
	placeholder?: string;
};

export type DataTableNumberEditor = {
	type: 'number';
	min?: number;
	max?: number;
	step?: number;
};

export type DataTableSelectEditor = {
	type: 'select';
	options: readonly DataTableOption[];
};

export type DataTableDateEditor = {
	type: 'date';
	min?: Date;
	max?: Date;
};

export type DataTableSwitchEditor = {
	type: 'switch';
};

export type DataTableBuiltInEditor =
	| DataTableTextEditor
	| DataTableNumberEditor
	| DataTableSelectEditor
	| DataTableDateEditor
	| DataTableSwitchEditor;

export type DataTableCellCommit<TData> = {
	row: TData;
	rowId: string;
	columnId: string;
	previousValue: unknown;
	value: unknown;
};

export type DataTableEditorPayload<TData> = DataTableCellCommit<TData> & {
	draft: unknown;
	pending: boolean;
	error: unknown;
	setDraft: (value: unknown) => void;
	commit: () => Promise<void>;
	cancel: () => void;
};

export type DataTableCustomEditor<TData> = {
	type: 'custom';
	render: Snippet<[DataTableEditorPayload<TData>]>;
};

export type DataTableEditor<TData> = DataTableBuiltInEditor | DataTableCustomEditor<TData>;

export type DataTableAggregation<TData> =
	| 'count'
	| 'sum'
	| 'min'
	| 'max'
	| 'mean'
	| 'median'
	| 'uniqueCount'
	| ((values: unknown[], rows: TData[]) => unknown);

export type DataTableRowPayload<TData> = {
	row: TData;
	rowId: string;
	selected: boolean;
	expanded: boolean;
	depth: number;
	toggleSelected: () => void;
	toggleExpanded: () => void;
};

export type DataTableCellPayload<TData, TValue = unknown> = DataTableRowPayload<TData> & {
	columnId: string;
	value: TValue;
	aggregated: boolean;
	grouped: boolean;
	startEditing: () => void;
};

export type DataTableHeaderPayload<TData> = {
	column: DataTableColumn<TData>;
	sorted: false | 'asc' | 'desc';
	sortIndex: number;
	filtered: boolean;
	toggleSorting: (multi?: boolean) => void;
};

export type DataTableCellRenderPayload<TData> = DataTableCellPayload<TData> & {
	column: DataTableColumn<TData>;
	placeholder: boolean;
	renderDefault: Snippet;
};

export type DataTableHeaderRenderPayload<TData> = DataTableHeaderPayload<TData> & {
	renderDefault: Snippet;
};

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

export type DataTableToolbarPayload<TData> = {
	state: DataTableState;
	selectedRows: TData[];
	visibleRows: TData[];
	clearFilters: () => void;
	clearSelection: () => void;
};

export type DataTableColumn<TData, TValue = unknown> = {
	id: string;
	accessor: Extract<keyof TData, string> | ((row: TData, index: number) => TValue);
	header: Slot<DataTableHeaderPayload<TData>>;
	cell?: Slot<DataTableCellPayload<TData, TValue>>;
	aggregatedCell?: Slot<DataTableCellPayload<TData, TValue>>;
	sortable?: boolean | ((left: TData, right: TData, columnId: string) => number);
	filter?: DataTableFilter<TData>;
	groupable?: boolean;
	aggregation?: DataTableAggregation<TData>;
	editor?: DataTableEditor<TData>;
	hideable?: boolean;
	resizable?: boolean;
	reorderable?: boolean;
	pinnable?: boolean;
	align?: DataTableAlignment;
	width?: number;
	minWidth?: number;
	maxWidth?: number;
	class?: string;
	headerClass?: string;
};

export type DataTableSearchConfig = {
	placeholder?: string;
	debounce?: number;
};

export type DataTablePaginationConfig = {
	pageSize?: number;
	pageSizes?: readonly number[];
	/** Keeps pagination processing enabled while optionally hiding the built-in footer controls. */
	showControls?: boolean;
};

type DataTableBaseProps<TData> = {
	/** Rows to display; provide only the current server page in manual mode. */
	items: readonly TData[];
	/** Column accessors, headers, rendering, and interaction policies. */
	columns: readonly DataTableColumn<TData>[];
	/** Returns a stable row identifier that persists across sorting and pagination. */
	getRowId: (row: TData, index: number, parent?: TData) => string;
	/** Scroll viewport height. Defaults to filling a parent with a definite height. */
	height?: string | number;
	/** Bindable table state, including filters, sorting, pagination, and selection. */
	state?: DataTableState;
	/** Narrow bindable facade for composing search, filters, and pagination outside the table. */
	dataTable?: DataTableApi<TData>;
	/** Initial values for uncontrolled table state slices. */
	initialState?: Partial<DataTableState>;
	/** Called after a table interaction changes the public table state. */
	onStateChange?: (state: DataTableState) => void;
	/** Keyboard interaction model for the table or editable grid. */
	interactionMode?: DataTableInteractionMode;
	/** Whether users may select no rows, one row, or multiple rows. */
	selectionMode?: DataTableSelectionMode;
	/** Enable and configure pagination, or disable it with false. */
	pagination?: false | DataTablePaginationConfig;
	/** Enable global search or configure its placeholder and debounce. */
	search?: boolean | DataTableSearchConfig;
	/** Shows the toolbar menu for toggling column visibility. */
	showColumnVisibilityControl?: boolean;
	/** Internal row and cell whitespace scale. */
	density?: Density;
	/** Keep the column header visible while the body scrolls. */
	stickyHeader?: boolean;
	/** Additional virtual rows rendered outside the visible viewport. */
	overscan?: number;
	/** Estimated row height in pixels before measurement. */
	estimatedRowHeight?: number;
	/** Animates stable rows into their new positions after sorting or filtering. */
	animateRows?: boolean;
	/** Disable table interactions while retaining the displayed rows. */
	disabled?: boolean;
	/** Returns child rows for hierarchical data. */
	getSubRows?: (row: TData, index: number) => readonly TData[] | undefined;
	/** Whether a row can reveal nested rows or expanded content. */
	canExpand?: (row: TData) => boolean;
	/** Whether a particular row may be selected. */
	isRowSelectable?: (row: TData) => boolean;
	/** Persists an edited cell; rejection leaves the edit error visible. */
	onCellCommit?: (commit: DataTableCellCommit<TData>) => void | Promise<void>;
	/** Additional classes on the table root. */
	class?: string;
	/** Bindable reference to the table root element. */
	ref?: HTMLElement | null;
	/** Overrides for the table theme parts. */
	theme?: DataTableThemeProps;
	/** Accessible caption for the table. */
	caption?: Slot;
	/** Table-level renderer for public data cells. Call renderDefault to retain built-in behavior. */
	cell?: Snippet<[DataTableCellRenderPayload<TData>]>;
	/** Table-level renderer for public header content. Structural controls remain DataTable-owned. */
	header?: Snippet<[DataTableHeaderRenderPayload<TData>]>;
	/** Content before the built-in toolbar controls. */
	toolbarPrefix?: Slot<DataTableToolbarPayload<TData>>;
	/** Content after the built-in toolbar controls. */
	toolbarSuffix?: Slot<DataTableToolbarPayload<TData>>;
	/** Actions available for the selected rows. */
	bulkActions?: Slot<DataTableToolbarPayload<TData>>;
	/** Actions rendered for an individual row. */
	rowActions?: Slot<DataTableRowPayload<TData>>;
	/** Additional content displayed below an expanded row. */
	expandedContent?: Slot<DataTableRowPayload<TData>>;
	/** Display the loading state while rows are being fetched. */
	loading?: boolean;
	/** Load failure exposed to the error content snippet. */
	error?: unknown;
	/** Custom content for the loading state. */
	loadingContent?: Slot<DataTableToolbarPayload<TData>>;
	/** Content when the data collection has no rows. */
	empty?: Slot<DataTableToolbarPayload<TData>>;
	/** Content when filters match no rows. */
	noResults?: Slot<DataTableToolbarPayload<TData>>;
	/** Custom content for the failed loading state. */
	errorContent?: Slot<DataTableToolbarPayload<TData> & { error: unknown }>;
};

type DataTableClientProps = {
	/** Process rows locally in client mode or use server-processed rows in manual mode. */
	processingMode?: 'client';
	/** Total matching server row count for manual pagination; omitted in client mode. */
	rowCount?: never;
};

type DataTableManualProps = {
	/** Process rows locally in client mode or use server-processed rows in manual mode. */
	processingMode: 'manual';
	/** Total matching server row count for manual pagination; omitted in client mode. */
	rowCount: number;
};

export type DataTableProps<TData> = WithAttachments<
	DataTableBaseProps<TData> & (DataTableClientProps | DataTableManualProps)
>;
