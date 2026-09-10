<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import GanttColumnHeader from './GanttColumnHeader.svelte';
	import GanttTreeRow from './GanttTreeRow.svelte';
	import type { GanttGridHeaderPayload } from './ganttChart.props.js';
	import { GanttRowReorder } from './ganttChart.rowReorder.svelte.js';
	import type { GanttRowModel, GanttVirtualRow } from './ganttChart.rows.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';

	let {
		chart,
		rowModel,
		renderedRows,
		totalHeight,
		onToggleSort,
		scrollToRow
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		rowModel: GanttRowModel<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		renderedRows: readonly GanttVirtualRow[];
		totalHeight: number;
		onToggleSort: (columnId: string, additive: boolean) => void;
		scrollToRow: (rowIndex: number) => void;
	} = $props();

	let horizontalViewport = $state<HTMLDivElement | null>(null);
	let horizontalScrollLeft = $state(0);
	const gridId = $props.id();
	// The chart state owner has stable identity for this component lifetime.
	// svelte-ignore state_referenced_locally
	const rowReorder = new GanttRowReorder(
		chart,
		() => rowModel,
		(rowIndex) => scrollToRow(rowIndex),
		gridId
	);
	const renderedGridRows = $derived.by((): readonly GanttVirtualRow[] => {
		const taskId = rowReorder.status?.taskId;
		const sourceIndex = taskId ? rowModel.rowIndexByTaskId.get(taskId) : undefined;
		if (
			sourceIndex === undefined ||
			renderedRows.some((virtualRow) => virtualRow.index === sourceIndex)
		) {
			return renderedRows;
		}
		const start = sourceIndex * chart.rowHeight;
		return [
			...renderedRows,
			{
				key: rowModel.rows[sourceIndex]?.taskId ?? sourceIndex,
				index: sourceIndex,
				start,
				end: start + chart.rowHeight,
				size: chart.rowHeight
			}
		].sort((first, second) => first.index - second.index);
	});
	const gridWidth = $derived(
		rowModel.visibleColumns.reduce((total, column) => total + (column.width ?? 160), 0)
	);
	const canReorder = $derived(rowReorder.canReorder);
	const canChangeHierarchy = $derived(!chart.disabled && !chart.loading && rowModel.isOrderStable);
	const headerPayload = $derived<
		GanttGridHeaderPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>
	>({ columns: rowModel.visibleColumns, defaultContent: defaultGridHeader });

	const rowDropPreview = $derived.by(() => {
		const proposal = rowReorder.preview;
		if (!proposal) return null;
		const targetIndex = rowModel.rowIndexByTaskId.get(proposal.targetTaskId);
		if (targetIndex === undefined) return null;
		let titleOffset = 0;
		let hasTitle = false;
		for (const column of rowModel.visibleColumns) {
			if (column.id === 'title') {
				hasTitle = true;
				break;
			}
			titleOffset += column.width ?? 160;
		}
		return {
			parentId: proposal.parentId,
			intent: proposal.intent,
			top: (targetIndex + (proposal.position === 'after' ? 1 : 0)) * chart.rowHeight,
			inlineStart: (hasTitle ? titleOffset : 0) + 8 + proposal.depth * 16
		};
	});
	const isRowInteractionInvalid = $derived(rowReorder.isInvalid);

	function navigateCell(event: KeyboardEvent, rowIndex: number, columnIndex: number): void {
		if (!chart.interactions.keyboard) return;
		const node = rowModel.rows[rowIndex];
		const column = rowModel.visibleColumns[columnIndex];
		if (!node || !column) return;
		const isHierarchyForward =
			column.id === 'title' &&
			!event.altKey &&
			!event.shiftKey &&
			event.key === (chart.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
		const isHierarchyBackward =
			column.id === 'title' &&
			!event.altKey &&
			!event.shiftKey &&
			event.key === (chart.direction === 'rtl' ? 'ArrowRight' : 'ArrowLeft');
		if (isHierarchyForward && node.type === 'summary') {
			event.preventDefault();
			if (!node.isExpanded) {
				chart.expandTask(node.taskId);
				return;
			}
			const childIndex = rowIndex + 1;
			const child = rowModel.rows[childIndex];
			if (child?.parentId === node.taskId) {
				chart.a11y.focusCell(child.taskId, column.id);
			}
			return;
		}
		if (isHierarchyBackward) {
			if (node.type === 'summary' && node.isExpanded) {
				event.preventDefault();
				chart.collapseTask(node.taskId);
				return;
			}
			if (node.parentId) {
				event.preventDefault();
				chart.a11y.focusCell(node.parentId, column.id);
				return;
			}
		}
		if (
			event.altKey &&
			event.shiftKey &&
			(event.key === 'ArrowLeft' || event.key === 'ArrowRight')
		) {
			event.preventDefault();
			const logicalIndent = event.key === (chart.direction === 'rtl' ? 'ArrowLeft' : 'ArrowRight');
			const indentTargetIndex = findIndentTargetRowIndex(rowIndex);
			const accepted = logicalIndent
				? chart.indentTask(node.taskId, rowModel.rows[indentTargetIndex]?.taskId ?? null)
				: chart.outdentTask(node.taskId);
			if (!accepted) blockHierarchyOperation(node.taskId);
			return;
		}
		if (event.altKey && event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
			event.preventDefault();
			const siblingIndex = findSiblingRowIndex(
				rowIndex,
				event.key === 'ArrowUp' ? -1 : 1,
				node.parentId
			);
			const target = rowModel.rows[siblingIndex];
			const accepted = Boolean(
				target &&
				chart.reorderTask(
					{
						taskId: node.taskId,
						targetTaskId: target.taskId,
						position: event.key === 'ArrowUp' ? 'before' : 'after'
					},
					'keyboard'
				)
			);
			if (!accepted) blockHierarchyOperation(node.taskId);
			return;
		}
		let nextRow = rowIndex;
		let nextColumn = columnIndex;
		switch (event.key) {
			case 'ArrowUp':
				nextRow -= 1;
				break;
			case 'ArrowDown':
				nextRow += 1;
				break;
			case 'ArrowLeft':
				nextColumn += chart.direction === 'rtl' ? 1 : -1;
				break;
			case 'ArrowRight':
				nextColumn += chart.direction === 'rtl' ? -1 : 1;
				break;
			case 'Home':
				nextColumn = 0;
				if (event.ctrlKey || event.metaKey) nextRow = 0;
				break;
			case 'End':
				nextColumn = rowModel.visibleColumns.length - 1;
				if (event.ctrlKey || event.metaKey) nextRow = rowModel.rows.length - 1;
				break;
			default:
				return;
		}
		event.preventDefault();
		const inlineEndOverflow =
			(event.key === 'ArrowRight' &&
				chart.direction === 'ltr' &&
				nextColumn >= rowModel.visibleColumns.length) ||
			(event.key === 'ArrowLeft' &&
				chart.direction === 'rtl' &&
				nextColumn >= rowModel.visibleColumns.length);
		if (inlineEndOverflow && chart.a11y.focusTask(node.taskId)) return;
		nextRow = Math.max(0, Math.min(rowModel.rows.length - 1, nextRow));
		nextColumn = Math.max(0, Math.min(rowModel.visibleColumns.length - 1, nextColumn));
		const nextTask = rowModel.rows[nextRow];
		const nextColumnDefinition = rowModel.visibleColumns[nextColumn];
		if (!nextTask || !nextColumnDefinition) return;
		chart.a11y.focusCell(nextTask.taskId, nextColumnDefinition.id);
	}

	function findSiblingRowIndex(rowIndex: number, delta: -1 | 1, parentId: string | null): number {
		for (let index = rowIndex + delta; index >= 0 && index < rowModel.rows.length; index += delta) {
			if (rowModel.rows[index]?.parentId === parentId) return index;
		}
		return -1;
	}

	function canIndentRow(rowIndex: number): boolean {
		if (!canChangeHierarchy || !chart.interactions.indent) return false;
		const node = rowModel.rows[rowIndex];
		const previousNode = rowModel.rows[findIndentTargetRowIndex(rowIndex)];
		return Boolean(
			node &&
			previousNode &&
			!node.task.readOnly &&
			!previousNode.task.readOnly &&
			previousNode.type === 'summary' &&
			(node.parentId ?? null) === (previousNode.parentId ?? null)
		);
	}

	function canOutdentRow(rowIndex: number): boolean {
		if (!canChangeHierarchy || !chart.interactions.outdent) return false;
		const node = rowModel.rows[rowIndex];
		return Boolean(node && node.parentId && !node.task.readOnly);
	}

	function indentRow(rowIndex: number): void {
		const node = rowModel.rows[rowIndex];
		const previousNode = rowModel.rows[findIndentTargetRowIndex(rowIndex)];
		if (
			!node ||
			!previousNode ||
			!canIndentRow(rowIndex) ||
			!chart.indentTask(node.taskId, previousNode.taskId, 'pointer')
		) {
			if (node) blockHierarchyOperation(node.taskId, 'pointer');
		}
	}

	function findIndentTargetRowIndex(rowIndex: number): number {
		const node = rowModel.rows[rowIndex];
		return node ? findSiblingRowIndex(rowIndex, -1, node.parentId) : -1;
	}

	function outdentRow(rowIndex: number): void {
		const node = rowModel.rows[rowIndex];
		if (!node || !canOutdentRow(rowIndex) || !chart.outdentTask(node.taskId, 'pointer')) {
			if (node) blockHierarchyOperation(node.taskId, 'pointer');
		}
	}

	function blockHierarchyOperation(
		taskId: string,
		source: 'keyboard' | 'pointer' = 'keyboard'
	): void {
		chart.blockInteraction({
			reason: 'invalid-target',
			source,
			taskId,
			message: 'Hierarchy operations require a compatible sibling summary target.'
		});
	}

	function handleHorizontalScroll(): void {
		if (!horizontalViewport) return;
		horizontalScrollLeft = horizontalViewport.scrollLeft;
	}
</script>

<div
	data-gantt-chart-part="grid-pane"
	data-interaction-invalid={isRowInteractionInvalid || undefined}
	class={chart.classes.gridPane({
		...chart.themeVariants,
		invalid: isRowInteractionInvalid,
		class: isRowInteractionInvalid ? '[&_[data-dnd-handle]]:!cursor-not-allowed' : undefined
	})}
	role="treegrid"
	aria-label={chart.messages.ganttChartGrid}
	aria-rowcount={rowModel.rows.length + 1}
	aria-colcount={rowModel.visibleColumns.length}
>
	<div
		class="sticky top-0 z-30 h-[var(--gantt-header-height)] overflow-x-clip bg-surface-raised/95 backdrop-blur"
		dir={chart.direction}
	>
		<div
			style:width={`${gridWidth}px`}
			style:min-width="100%"
			style:transform={`translate3d(${-horizontalScrollLeft}px, 0, 0)`}
		>
			<div
				data-gantt-chart-part="grid-header"
				class={chart.classes.gridHeader(chart.themeVariants)}
				role="row"
				aria-rowindex="1"
			>
				{#if chart.renderers?.gridHeader}
					<div class="pointer-events-none absolute inset-0" aria-hidden="true">
						<Slot render={chart.renderers.gridHeader} payload={headerPayload} />
					</div>
				{/if}
				{#each rowModel.visibleColumns as column, columnIndex (column.id)}
					<GanttColumnHeader {chart} {column} {columnIndex} {onToggleSort} />
				{/each}
			</div>
		</div>
	</div>
	<div
		dir="ltr"
		data-gantt-chart-part="grid-viewport"
		class="min-w-0"
		style:height={`${totalHeight}px`}
	>
		<ScrollArea
			bind:viewportRef={horizontalViewport}
			class="h-full min-w-0"
			ariaLabel={chart.messages.ganttChartGrid}
			type="hover"
			onscroll={handleHorizontalScroll}
		>
			<div style:width={`${gridWidth}px`} style:min-width="100%" dir={chart.direction}>
				<div
					data-gantt-chart-part="rows"
					class={chart.classes.rows(chart.themeVariants)}
					style:height={`${totalHeight}px`}
					{@attach rowReorder.list}
				>
					{#each renderedGridRows as virtualRow (virtualRow.key)}
						{@const node = rowModel.rows[virtualRow.index]}
						{#if node}
							<GanttTreeRow
								{chart}
								{node}
								rowIndex={virtualRow.index}
								start={virtualRow.start}
								columns={rowModel.visibleColumns}
								resourceGroup={rowModel.resourceGroupByTaskId.get(node.taskId) ?? null}
								showResourceGroupLabel={rowModel.resourceGroupStartTaskIds.has(node.taskId)}
								isDropParent={rowDropPreview?.parentId === node.taskId &&
									rowDropPreview.intent !== 'reorder'}
								showDragHandle={canReorder}
								canIndent={canIndentRow(virtualRow.index)}
								canOutdent={canOutdentRow(virtualRow.index)}
								rowAttachment={rowReorder.item(node)}
								onIndent={() => indentRow(virtualRow.index)}
								onOutdent={() => outdentRow(virtualRow.index)}
								onNavigate={(event, columnIndex) =>
									navigateCell(event, virtualRow.index, columnIndex)}
							/>
						{/if}
					{/each}
					{#if rowDropPreview}
						<div
							data-gantt-row-drop-indicator
							data-gantt-reorder-intent={rowDropPreview.intent}
							class={chart.classes.rowDropIndicator(chart.themeVariants)}
							style:top={`${rowDropPreview.top}px`}
							style:inset-inline-start={`${rowDropPreview.inlineStart}px`}
							aria-hidden="true"
						>
							<span
								class="absolute -start-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full border-2 border-color bg-surface"
							></span>
						</div>
					{/if}
				</div>
			</div>
		</ScrollArea>
	</div>
</div>

{#snippet defaultGridHeader()}{/snippet}
