<script lang="ts" generics="TData extends object">
	import { useI18n } from '$lib/i18n/context.svelte.js';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { get } from 'svelte/store';
	import { untrack } from 'svelte';
	import type { Attachment } from 'svelte/attachments';
	import Empty from '../Empty/Empty.svelte';
	import Select from '../Form/Select/Select.svelte';
	import NetworkIndicator from '../NetworkIndicator/NetworkIndicator.svelte';
	import Pagination from '../Pagination/Pagination.svelte';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import Skeleton from '../Skeleton/Skeleton.svelte';
	import Slot from '../Slot/Slot.svelte';
	import DataTableHeader from './DataTableHeader.svelte';
	import DataTableRow from './DataTableRow.svelte';
	import DataTableToolbar from './DataTableToolbar.svelte';
	import { dataTableGridNavigation } from './dataTableGridNavigation.js';
	import { createDataTableState, DataTableModel } from './dataTable.model.svelte.js';
	import { dataTableRowFlip } from './dataTableRowFlip.js';
	import type {
		DataTableApi,
		DataTablePaginationConfig,
		DataTableProps,
		DataTableState,
		DataTableToolbarPayload
	} from './dataTable.props.js';
	import { useDataTableTheme } from './dataTable.theme.js';

	let {
		items,
		columns,
		getRowId,
		height,
		state: tableState = $bindable(),
		// eslint-disable-next-line no-useless-assignment -- The parent observes this bindable output.
		api = $bindable(),
		initialState,
		onStateChange,
		interactionMode = 'table',
		processingMode = 'client',
		rowCount,
		selectionMode = 'none',
		pagination = {},
		search = false,
		showColumnVisibilityControl = false,
		density = 'normal',
		stickyHeader = true,
		virtualize = true,
		overscan = 6,
		estimatedRowHeight,
		animateRows = false,
		disabled = false,
		getSubRows,
		canExpand,
		isRowSelectable,
		onCellCommit,
		class: className,
		ref = $bindable(null),
		theme,
		caption,
		cell,
		header,
		toolbarPrefix,
		toolbarSuffix,
		bulkActions,
		rowActions,
		expandedContent,
		loading = false,
		error,
		loadingContent,
		empty,
		noResults,
		errorContent,
		...attachments
	}: DataTableProps<TData> = $props();

	const pageSize = untrack(() => (pagination === false ? 25 : (pagination.pageSize ?? 25)));
	if (!tableState) {
		tableState = untrack(() => createDataTableState(columns, initialState, pageSize));
	}

	let viewportRef = $state<HTMLDivElement | null>(null);
	let modelRevision = $state(0);

	const model = new DataTableModel<TData>({
		get props() {
			return {
				items,
				columns,
				getRowId,
				height,
				state: tableState,
				initialState,
				onStateChange,
				interactionMode,
				processingMode,
				rowCount,
				selectionMode,
				pagination,
				search,
				showColumnVisibilityControl,
				density,
				stickyHeader,
				virtualize,
				overscan,
				estimatedRowHeight,
				animateRows,
				disabled,
				getSubRows,
				canExpand,
				isRowSelectable,
				onCellCommit,
				class: className,
				ref,
				theme,
				caption,
				cell,
				header,
				toolbarPrefix,
				toolbarSuffix,
				bulkActions,
				rowActions,
				expandedContent,
				loading,
				error,
				loadingContent,
				empty,
				noResults,
				errorContent
			} as DataTableProps<TData>;
		},
		get state() {
			return tableState!;
		},
		set state(value: DataTableState) {
			tableState = value;
		}
	});
	model.reconcileProcessingMode();
	model.reconcileColumns();
	model.updateOptions();
	model.reconcileFocusedCell();

	const classes = $derived(useDataTableTheme(theme));
	const t = $derived(useI18n());
	const fillsParent = $derived(virtualize && height === undefined);
	const rowHeight = $derived.by(() => {
		if (estimatedRowHeight !== undefined) return estimatedRowHeight;
		if (density === 'compact') return 32;
		if (density === 'comfortable') return 48;
		return 40;
	});
	const viewportHeight = $derived(typeof height === 'number' ? `${height}px` : height);
	const isSaving = $derived(model.pendingCommitCount > 0);
	const isBusy = $derived(loading || isSaving);
	const rowFlip = dataTableRowFlip(() => animateRows);

	$effect.pre(() => {
		void [
			items,
			columns,
			tableState,
			processingMode,
			rowCount,
			selectionMode,
			pagination,
			rowActions
		];
		model.reconcileProcessingMode();
		model.reconcileColumns();
		model.updateOptions();
		model.reconcileFocusedCell();
		modelRevision = untrack(() => modelRevision) + 1;
	});

	const rows = $derived.by(() => {
		void modelRevision;
		return model.pageRows;
	});
	const allColumns = $derived.by(() => {
		void modelRevision;
		return [
			...model.table.getStartVisibleLeafColumns(),
			...model.table.getCenterVisibleLeafColumns(),
			...model.table.getEndVisibleLeafColumns()
		];
	});
	const leftColumns = $derived.by(() => {
		void modelRevision;
		return model.table.getStartVisibleLeafColumns();
	});
	const centerColumns = $derived.by(() => {
		void modelRevision;
		return model.table.getCenterVisibleLeafColumns();
	});
	const rightColumns = $derived.by(() => {
		void modelRevision;
		return model.table.getEndVisibleLeafColumns();
	});
	const gridTemplate = $derived(
		[
			...leftColumns.map((column) => `${column.getSize()}px`),
			...centerColumns.map((column) => `${column.getSize()}px`),
			...(rightColumns.length ? ['minmax(0, 1fr)'] : []),
			...rightColumns.map((column) => `${column.getSize()}px`)
		].join(' ')
	);
	const tableWidth = $derived(allColumns.reduce((width, column) => width + column.getSize(), 0));

	const rowVirtualizerStore = createVirtualizer<HTMLElement, HTMLElement>({
		count: 0,
		getScrollElement: () => null,
		estimateSize: () => 40,
		overscan: 6
	});
	const columnVirtualizerStore = createVirtualizer<HTMLElement, HTMLElement>({
		horizontal: true,
		count: 0,
		getScrollElement: () => null,
		estimateSize: () => 180,
		overscan: 2
	});

	$effect(() => {
		const currentRows = rows;
		const scrollElement = viewportRef;
		const estimate = rowHeight;
		const extra = overscan;
		if (!virtualize) {
			get(rowVirtualizerStore).setOptions({
				count: 0,
				getScrollElement: () => null,
				estimateSize: () => estimate,
				overscan: extra
			});
			return;
		}
		get(rowVirtualizerStore).setOptions({
			count: currentRows.length,
			getScrollElement: () => scrollElement,
			estimateSize: () => estimate,
			overscan: extra,
			getItemKey: (index) => currentRows[index]?.id ?? index,
			measureElement: (element) => {
				const rowIndex = element.getAttribute('data-index');
				const detail = element.nextElementSibling;
				const detailHeight =
					detail instanceof HTMLElement && detail.dataset.detailFor === rowIndex
						? detail.getBoundingClientRect().height
						: 0;
				return element.getBoundingClientRect().height + detailHeight;
			}
		});
	});

	$effect(() => {
		const currentColumns = centerColumns;
		const scrollElement = viewportRef;
		const leftWidth = leftColumns.reduce((width, column) => width + column.getSize(), 0);
		const rightWidth = rightColumns.reduce((width, column) => width + column.getSize(), 0);
		get(columnVirtualizerStore).setOptions({
			horizontal: true,
			count: interactionMode === 'grid' ? currentColumns.length : 0,
			getScrollElement: () => scrollElement,
			estimateSize: (index) => currentColumns[index]?.getSize() ?? 180,
			getItemKey: (index) => currentColumns[index]?.id ?? index,
			overscan: 2,
			paddingStart: leftWidth,
			paddingEnd: rightWidth
		});
	});

	const rowVirtualItems = $derived($rowVirtualizerStore.getVirtualItems());
	const fallbackRowCount = $derived(
		Math.min(
			rows.length,
			Math.ceil((viewportRef?.clientHeight ?? rowHeight * 10) / rowHeight) + overscan
		)
	);
	const renderedRows = $derived.by(() => {
		// Non-virtual mode maps rows 1:1: zero offsets keep both spacer rows out of the DOM and
		// leave every row in normal grid flow at its natural height.
		if (!virtualize)
			return rows.map((row, index) => ({
				index,
				key: row.id,
				start: 0,
				end: 0,
				size: 0,
				lane: 0
			}));
		if (rowVirtualItems.length) return rowVirtualItems;
		return Array.from({ length: fallbackRowCount }, (_, index) => ({
			index,
			key: rows[index]?.id ?? index,
			start: index * rowHeight,
			end: (index + 1) * rowHeight,
			size: rowHeight,
			lane: 0
		}));
	});
	const totalRowsHeight = $derived(
		virtualize ? $rowVirtualizerStore.getTotalSize() || rows.length * rowHeight : 0
	);
	const topPadding = $derived(renderedRows[0]?.start ?? 0);
	const bottomPadding = $derived(Math.max(0, totalRowsHeight - (renderedRows.at(-1)?.end ?? 0)));

	const virtualCenterColumns = $derived.by(() => {
		const virtualItems = $columnVirtualizerStore.getVirtualItems();
		if (interactionMode !== 'grid') return centerColumns;
		if (!virtualItems.length) return centerColumns.slice(0, 8);
		return virtualItems
			.map((item) => centerColumns[item.index])
			.filter((column): column is (typeof centerColumns)[number] => !!column);
	});
	const renderedColumns = $derived.by(() => {
		if (interactionMode !== 'grid') return allColumns;
		const visibleIds = new Set([
			...leftColumns.map((column) => column.id),
			...virtualCenterColumns.map((column) => column.id),
			...rightColumns.map((column) => column.id)
		]);
		return allColumns.filter((column) => visibleIds.has(column.id));
	});

	const measureRow: Attachment<HTMLElement> = (element) => {
		if (!virtualize) return;
		get(rowVirtualizerStore).measureElement(element);
	};
	const measureDetailRow =
		(rowIndex: number): Attachment<HTMLElement> =>
		(element) => {
			if (!virtualize) return;
			const parent = element.parentElement;
			const measure = () => {
				const primaryRow = Array.from(parent?.children ?? []).find(
					(child) => child instanceof HTMLElement && child.dataset.index === String(rowIndex)
				);
				if (primaryRow instanceof HTMLElement) get(rowVirtualizerStore).measureElement(primaryRow);
			};
			const observer = new ResizeObserver(measure);
			observer.observe(element);
			queueMicrotask(measure);
			return () => {
				observer.disconnect();
				queueMicrotask(measure);
			};
		};

	const focusCell = (rowIndex: number, columnIndex: number) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				ref
					?.querySelector<HTMLElement>(
						`[data-grid-row="${rowIndex}"] [data-grid-column="${columnIndex}"]`
					)
					?.focus();
			});
		});
	};

	const navigateGrid = (rowIndex: number, columnIndex: number, event: KeyboardEvent) => {
		event.preventDefault();
		let nextRow = rowIndex;
		let nextColumn = columnIndex;
		const pageJump = Math.max(1, Math.floor((viewportRef?.clientHeight ?? rowHeight) / rowHeight));
		switch (event.key) {
			case 'Tab':
				nextColumn += event.shiftKey ? -1 : 1;
				break;
			case 'ArrowLeft':
				nextColumn -= 1;
				break;
			case 'ArrowRight':
				nextColumn += 1;
				break;
			case 'ArrowUp':
				nextRow -= 1;
				break;
			case 'ArrowDown':
				nextRow += 1;
				break;
			case 'Home':
				nextColumn = 0;
				if (event.ctrlKey) nextRow = 0;
				break;
			case 'End':
				nextColumn = allColumns.length - 1;
				if (event.ctrlKey) nextRow = rows.length - 1;
				break;
			case 'PageUp':
				nextRow -= pageJump;
				break;
			case 'PageDown':
				nextRow += pageJump;
				break;
		}
		model.moveFocusedCell(nextRow, nextColumn);
		const focused = model.focusedCell;
		if (virtualize) get(rowVirtualizerStore).scrollToIndex(focused.row, { align: 'auto' });
		const focusedColumn = allColumns[focused.column];
		const centerIndex = focusedColumn
			? centerColumns.findIndex((column) => column.id === focusedColumn.id)
			: -1;
		if (centerIndex >= 0 && interactionMode === 'grid') {
			get(columnVirtualizerStore).scrollToIndex(centerIndex, { align: 'auto' });
		}
		focusCell(focused.row, focused.column);
	};

	const totalItems = $derived.by(() => {
		void [modelRevision, tableState!.globalFilter, tableState!.columnFilters];
		return processingMode === 'manual' ? (rowCount ?? 0) : model.filteredRows.length;
	});
	const expandedDetailCount = $derived.by(() => {
		void tableState!.expanded;
		if (!expandedContent) return 0;
		return rows.filter((row) => tableState!.expanded[row.id] && !row.getIsGrouped()).length;
	});
	const rowAriaIndexes = $derived.by(() => {
		let nextIndex = 2;
		return rows.map((row) => {
			const currentIndex = nextIndex;
			nextIndex += 1;
			if (expandedContent && tableState!.expanded[row.id] && !row.getIsGrouped()) nextIndex += 1;
			return currentIndex;
		});
	});
	const totalPages = $derived(
		Math.max(1, Math.ceil(totalItems / Math.max(1, tableState!.pagination.pageSize)))
	);
	const pageStart = $derived(
		totalItems ? (tableState!.pagination.page - 1) * tableState!.pagination.pageSize + 1 : 0
	);
	const pageEnd = $derived(
		Math.min(totalItems, tableState!.pagination.page * tableState!.pagination.pageSize)
	);
	const paginationConfig = $derived.by((): DataTablePaginationConfig | null => {
		if (pagination === false) return null;
		return pagination;
	});
	const tableApi: DataTableApi<TData> = {
		get state() {
			return model.state;
		},
		get totalItems() {
			return totalItems;
		},
		get totalPages() {
			return totalPages;
		},
		get visibleRows() {
			return rows.map((row) => row.original);
		},
		get selectedRows() {
			return model.selectedRows;
		},
		get isSaving() {
			return isSaving;
		},
		setGlobalFilter: (value) => model.setGlobalFilter(value),
		setColumnFilter: (columnId, value) => model.setColumnFilter(columnId, value),
		clearFilters: () => model.clearFilters(),
		clearSelection: () => model.clearSelection(),
		setPage: (page) => model.setPage(page),
		setPageSize: (size) => model.setPageSize(size)
	};
	// eslint-disable-next-line no-useless-assignment -- Assignment publishes the table api to bind:api.
	api = tableApi;
	const statePayload = $derived<DataTableToolbarPayload<TData>>({
		state: tableApi.state,
		selectedRows: [...tableApi.selectedRows],
		visibleRows: [...tableApi.visibleRows],
		clearFilters: tableApi.clearFilters,
		clearSelection: tableApi.clearSelection
	});
	const hasActiveFilters = $derived(
		!!tableState!.globalFilter || tableState!.columnFilters.length > 0
	);
</script>

<div bind:this={ref} class={classes.root({ fill: fillsParent, className })} {...attachments}>
	<DataTableToolbar {model} {classes} revision={modelRevision} {tableApi} />

	<div class={classes.viewport({ fill: fillsParent })} style:height={viewportHeight}>
		<NetworkIndicator
			loading={isBusy}
			color="primary"
			height={2}
			theme={{ motion: { duration: 120 } }}
			label={isSaving ? t.dataTableSaving : t.dataTableLoading}
			class={classes.savingIndicator()}
		/>
		<ScrollArea bind:viewportRef class={classes.scrollArea()} type="auto" label={t.dataTableLabel}>
			<table
				{@attach dataTableGridNavigation({
					enabled: interactionMode === 'grid',
					onPointerOutsideCell: () => model.clearFocusedCell()
				})}
				aria-busy={isBusy}
				role={interactionMode === 'grid' ? 'grid' : undefined}
				aria-rowcount={interactionMode === 'grid'
					? rows.length + expandedDetailCount + 1
					: undefined}
				aria-colcount={interactionMode === 'grid' ? allColumns.length : undefined}
				class={classes.virtualTable()}
				style:width={`${Math.max(tableWidth, viewportRef?.clientWidth ?? 0)}px`}
			>
				<Slot render={caption} as="caption" class={classes.caption({ density })} />
				<DataTableHeader
					columns={renderedColumns}
					{allColumns}
					{gridTemplate}
					{model}
					{classes}
					{density}
					revision={modelRevision}
					sticky={stickyHeader}
				/>

				<tbody class={classes.body()} {@attach rowFlip}>
					{#if error || (!loading && rows.length === 0)}
						<tr class={classes.stateRow()} style:grid-template-columns={gridTemplate}>
							<td
								role={interactionMode === 'grid' ? 'gridcell' : undefined}
								class={classes.stateCell()}
								colspan={allColumns.length}
								aria-colspan={interactionMode === 'grid' ? allColumns.length : undefined}
								data-grid-state
								style:grid-column="1 / -1"
							>
								<div class={classes.stateContent()}>
									{#if error}
										{#if errorContent}
											<Slot render={errorContent} payload={{ ...statePayload, error }} />
										{:else}
											<Empty
												size="small"
												title={t.dataTableErrorTitle}
												description={error instanceof Error
													? error.message
													: t.dataTableErrorDescription}
											/>
										{/if}
									{:else if hasActiveFilters}
										{#if noResults}
											<Slot render={noResults} payload={statePayload} />
										{:else}
											<Empty
												size="small"
												title={t.dataTableNoMatchesTitle}
												description={t.dataTableNoMatchesDescription}
												actions={[
													{ content: t.dataTableClearFilters, onclick: () => model.clearFilters() }
												]}
											/>
										{/if}
									{:else if empty}
										<Slot render={empty} payload={statePayload} />
									{:else}
										<Empty
											size="small"
											title={t.dataTableEmptyTitle}
											description={t.dataTableEmptyDescription}
										/>
									{/if}
								</div>
							</td>
						</tr>
					{:else if loading && rows.length === 0}
						<tr class={classes.stateRow()} style:grid-template-columns={gridTemplate}>
							<td
								role={interactionMode === 'grid' ? 'gridcell' : undefined}
								class={classes.stateCell()}
								colspan={allColumns.length}
								aria-colspan={interactionMode === 'grid' ? allColumns.length : undefined}
								data-grid-state
								style:grid-column="1 / -1"
							>
								<div class={classes.stateContent()}>
									{#if loadingContent}
										<Slot render={loadingContent} payload={statePayload} />
									{:else}
										<div class={classes.skeletonList()} aria-label={t.dataTableLoadingRows}>
											{#each [...Array(6).keys()] as skeletonIndex (skeletonIndex)}
												<Skeleton class={classes.skeletonBar()} />
											{/each}
										</div>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						{#if topPadding > 0}
							<tr aria-hidden="true" class={classes.spacer()} style:height={`${topPadding}px`}>
								<td style:grid-column="1 / -1"></td>
							</tr>
						{/if}

						{#each renderedRows as virtualRow (virtualRow.key)}
							{@const row = rows[virtualRow.index]}
							{#if row}
								<DataTableRow
									{row}
									rowIndex={virtualRow.index}
									ariaRowIndex={rowAriaIndexes[virtualRow.index] ?? virtualRow.index + 2}
									columns={renderedColumns}
									{allColumns}
									{gridTemplate}
									{model}
									{classes}
									{density}
									{interactionMode}
									revision={modelRevision}
									measureAttachment={measureRow}
									detailMeasureAttachment={measureDetailRow(virtualRow.index)}
									onNavigate={navigateGrid}
								/>
							{/if}
						{/each}

						{#if bottomPadding > 0}
							<tr aria-hidden="true" class={classes.spacer()} style:height={`${bottomPadding}px`}>
								<td style:grid-column="1 / -1"></td>
							</tr>
						{/if}
					{/if}
				</tbody>
			</table>
		</ScrollArea>
	</div>

	{#if paginationConfig && paginationConfig.showControls !== false}
		<div class={classes.footer()}>
			<div class={classes.toolbarGroup()}>
				<span class={classes.summary()}>{pageStart}–{pageEnd} of {totalItems}</span>
				<span class={classes.summary()}>{t.dataTableRowsPerPage}</span>
				<Select
					size="small"
					label={t.dataTableRowsPerPage}
					items={(paginationConfig.pageSizes ?? [25, 50, 100]).map((value) => ({
						value: String(value),
						label: String(value)
					}))}
					value={String(tableState!.pagination.pageSize)}
					{disabled}
					onValueChange={(value) => model.setPageSize(Number(value))}
				/>
			</div>
			<Pagination
				{totalPages}
				value={Math.min(tableState!.pagination.page, totalPages)}
				variant="pages"
				controlVariant="ghost"
				size="small"
				{disabled}
				onValueChange={(page) => model.setPage(page)}
			/>
		</div>
	{/if}
</div>
