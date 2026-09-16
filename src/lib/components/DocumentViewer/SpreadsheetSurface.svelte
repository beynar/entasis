<script lang="ts">
	import { createVirtualizer, type VirtualItem } from '@tanstack/svelte-virtual';
	import { get } from 'svelte/store';
	import ScrollArea from '../ScrollArea/ScrollArea.svelte';
	import type { SpreadsheetMerge } from './spreadsheetAdapter.js';
	import { documentViewerScrollAreaTheme } from './documentViewer.theme.js';
	import type { DocumentViewerState } from './documentViewer.state.svelte.js';
	import { useI18n } from '$lib/i18n/context.svelte.js';

	type Classes = {
		grid: () => string;
		gridCell: (options?: { className?: string }) => string;
		gridHeader: () => string;
	};

	let { viewer, classes }: { viewer: DocumentViewerState; classes: Classes } = $props();
	const t = $derived(useI18n());
	let viewport = $state<HTMLDivElement | null>(null);
	let scrollLeft = $state(0);
	let scrollTop = $state(0);
	const rowHeaderWidth = 48;
	const columnHeaderHeight = 28;

	const model = $derived(viewer.model?.kind === 'spreadsheet' ? viewer.model : null);
	const spreadsheet = $derived(model?.sheets[viewer.sheet - 1]);
	const columnDimensions = $derived(
		new Map(spreadsheet?.columns.map((dimension) => [dimension.index, dimension]) ?? [])
	);
	const rowDimensions = $derived(
		new Map(spreadsheet?.rows.map((dimension) => [dimension.index, dimension]) ?? [])
	);
	const columnSize = (index: number) => {
		const dimension = columnDimensions.get(index);
		return Math.max(1, (dimension?.hidden ? 1 : (dimension?.size ?? 110)) * viewer.scale);
	};
	const rowSize = (index: number) => {
		const dimension = rowDimensions.get(index);
		return Math.max(1, (dimension?.hidden ? 1 : (dimension?.size ?? 30)) * viewer.scale);
	};

	const rowVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		count: 0,
		getScrollElement: () => null,
		estimateSize: () => 30,
		overscan: 8
	});
	const columnVirtualizer = createVirtualizer<HTMLDivElement, HTMLDivElement>({
		horizontal: true,
		count: 0,
		getScrollElement: () => null,
		estimateSize: () => 110,
		overscan: 3
	});

	$effect(() => {
		const currentSheet = spreadsheet;
		const scrollElement = viewport;
		void viewer.scale;
		get(rowVirtualizer).setOptions({
			count: currentSheet?.rowCount ?? 0,
			getScrollElement: () => scrollElement,
			estimateSize: rowSize,
			overscan: 8
		});
		get(columnVirtualizer).setOptions({
			horizontal: true,
			count: currentSheet?.columnCount ?? 0,
			getScrollElement: () => scrollElement,
			estimateSize: columnSize,
			overscan: 3
		});
	});

	const fallbackItems = (count: number, size: (index: number) => number): VirtualItem[] => {
		let start = 0;
		return Array.from({ length: count }, (_, index) => {
			const itemSize = size(index);
			const item = { index, key: index, start, end: start + itemSize, size: itemSize, lane: 0 };
			start += itemSize;
			return item;
		});
	};
	const rows = $derived(
		$rowVirtualizer.getVirtualItems().length
			? $rowVirtualizer.getVirtualItems()
			: fallbackItems(Math.min(spreadsheet?.rowCount ?? 0, 20), rowSize)
	);
	const columns = $derived(
		$columnVirtualizer.getVirtualItems().length
			? $columnVirtualizer.getVirtualItems()
			: fallbackItems(Math.min(spreadsheet?.columnCount ?? 0, 10), columnSize)
	);
	const totalHeight = $derived($rowVirtualizer.getTotalSize());
	const totalWidth = $derived($columnVirtualizer.getTotalSize());
	const activeMatch = $derived(viewer.matches[viewer.activeMatch]);

	$effect(() => {
		const match = activeMatch;
		const activeSheet = viewer.sheet;
		if (
			!match ||
			match.unit !== activeSheet ||
			match.row === undefined ||
			match.column === undefined
		) {
			return;
		}
		get(rowVirtualizer).scrollToIndex(match.row, { align: 'center' });
		get(columnVirtualizer).scrollToIndex(match.column, { align: 'center' });
	});

	const mergeAt = (row: number, column: number): SpreadsheetMerge | undefined =>
		spreadsheet?.merges.find(
			(merge) =>
				row >= merge.startRow &&
				row <= merge.endRow &&
				column >= merge.startColumn &&
				column <= merge.endColumn
		);
	const mergedSize = (merge: SpreadsheetMerge) => ({
		width: Array.from({ length: merge.endColumn - merge.startColumn + 1 }, (_, offset) =>
			columnSize(merge.startColumn + offset)
		).reduce((sum, value) => sum + value, 0),
		height: Array.from({ length: merge.endRow - merge.startRow + 1 }, (_, offset) =>
			rowSize(merge.startRow + offset)
		).reduce((sum, value) => sum + value, 0)
	});
	const columnLabel = (index: number) => {
		let label = '';
		for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
			label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
		}
		return label;
	};
	const onScroll = () => {
		scrollLeft = viewport?.scrollLeft ?? 0;
		scrollTop = viewport?.scrollTop ?? 0;
	};
</script>

<ScrollArea
	bind:viewportRef={viewport}
	class={classes.grid()}
	type="hover"
	label={t.spreadsheetGrid}
	onscroll={onScroll}
	theme={documentViewerScrollAreaTheme}
>
	<div
		class="relative"
		role="grid"
		aria-rowcount={spreadsheet?.rowCount ?? 0}
		aria-colcount={spreadsheet?.columnCount ?? 0}
		style="width: {rowHeaderWidth + totalWidth}px; height: {columnHeaderHeight + totalHeight}px;"
	>
		{#each rows as row (row.key)}
			{#each columns as column (column.key)}
				{@const merge = mergeAt(row.index, column.index)}
				{#if !merge || (merge.startRow === row.index && merge.startColumn === column.index)}
					{@const size = merge ? mergedSize(merge) : { width: column.size, height: row.size }}
					{@const cell = spreadsheet?.cells.get(`${row.index}:${column.index}`)}
					{@const isMatch =
						activeMatch?.unit === viewer.sheet &&
						activeMatch.row === row.index &&
						activeMatch.column === column.index}
					<div
						role="gridcell"
						class={classes.gridCell({
							className: isMatch ? 'ring-warning ring-2 ring-inset' : undefined
						})}
						style="left: {rowHeaderWidth + column.start}px; top: {columnHeaderHeight +
							row.start}px; width: {size.width}px; height: {size.height}px;"
						title={cell?.formula ? `=${cell.formula}` : cell?.text}
					>
						{cell?.text ?? ''}
					</div>
				{/if}
			{/each}
		{/each}

		{#each columns as column (column.key)}
			<div
				class={classes.gridHeader()}
				style="left: {rowHeaderWidth +
					column.start}px; top: {scrollTop}px; width: {column.size}px; height: {columnHeaderHeight}px;"
			>
				{columnLabel(column.index)}
			</div>
		{/each}
		{#each rows as row (row.key)}
			<div
				class={classes.gridHeader()}
				style="left: {scrollLeft}px; top: {columnHeaderHeight +
					row.start}px; width: {rowHeaderWidth}px; height: {row.size}px;"
			>
				{row.index + 1}
			</div>
		{/each}
		<div
			class={classes.gridHeader()}
			style="left: {scrollLeft}px; top: {scrollTop}px; width: {rowHeaderWidth}px; height: {columnHeaderHeight}px; z-index: 20;"
		></div>
	</div>
</ScrollArea>
