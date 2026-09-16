<script lang="ts" module>
	const TREE_CELL_PADDING: Record<
		'compact' | 'normal' | 'comfortable',
		Readonly<{ base: number; indent: number }>
	> = {
		compact: { base: 4, indent: 10 },
		normal: { base: 6, indent: 12 },
		comfortable: { base: 8, indent: 14 }
	};

	function focusEditor(element: HTMLInputElement): void {
		queueMicrotask(() => {
			element.focus();
			element.select();
		});
	}
</script>

<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import { caretDownIcon } from '$lib/components/Icons/caretDown.js';
	import { caretRightIcon } from '$lib/components/Icons/caretRight.js';
	import { arrowLineLeftIcon } from '$lib/components/Icons/arrowLineLeft.js';
	import { arrowLineRightIcon } from '$lib/components/Icons/arrowLineRight.js';
	import { dotsSixVerticalIcon } from '$lib/components/Icons/dotsSixVertical.js';
	import Slot from '$lib/components/Slot/Slot.svelte';
	import {
		formatGanttColumnValue,
		getGanttColumnLabel,
		getGanttColumnValue
	} from './ganttChart.columns.js';
	import { getGanttTaskColor } from './ganttChart.color.js';
	import type { GanttTreeCellPayload } from './ganttChart.props.js';
	import { createGanttColumnContext } from './ganttChart.rows.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type {
		GanttColumnDefinition,
		GanttResolvedTaskNode,
		GanttResource
	} from './ganttChart.types.js';

	let {
		chart,
		node,
		column,
		rowIndex,
		columnIndex,
		resourceGroup,
		showResourceGroupLabel,
		showDragHandle,
		canIndent,
		canOutdent,
		onFocus,
		onIndent,
		onOutdent,
		onNavigate
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		node: GanttResolvedTaskNode<TTaskFields>;
		column: GanttColumnDefinition<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>;
		rowIndex: number;
		columnIndex: number;
		resourceGroup: GanttResource<TResourceFields> | null;
		showResourceGroupLabel: boolean;
		showDragHandle: boolean;
		canIndent: boolean;
		canOutdent: boolean;
		onFocus: () => void;
		onIndent: () => void;
		onOutdent: () => void;
		onNavigate: (event: KeyboardEvent) => void;
	} = $props();

	let isEditing = $state(false);
	let editValue = $state('');
	const messages = $derived(chart.messages);
	const locale = $derived(chart.messages.locale);
	const timeZone = $derived(chart.timeZone);
	const isSelected = $derived(chart.selectedRowTaskId === node.taskId);
	const isFocused = $derived(chart.a11y.isCellTabStop(node.taskId, column.id));
	const context = $derived(
		createGanttColumnContext(
			node,
			chart.schedule.model.dependencies,
			chart.schedule.model.resources,
			chart.schedule.model.assignments
		)
	);
	const value = $derived(getGanttColumnValue(column, context));
	const formattedValue = $derived(
		formatGanttColumnValue(column.id, value, locale, timeZone, messages)
	);
	const isEditable = $derived(
		column.editable === true && !chart.disabled && !chart.loading && !node.task.readOnly
	);
	const label = $derived(column.title ?? getGanttColumnLabel(column.id, messages));
	const payload = $derived<
		GanttTreeCellPayload<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>
	>({ node, column, value, isSelected, isFocused, isEditing, defaultContent });
	const titlePadding = $derived(
		TREE_CELL_PADDING[chart.density].base + node.depth * TREE_CELL_PADDING[chart.density].indent
	);

	function beginEdit(): void {
		if (!isEditable) return;
		editValue = value instanceof Date ? value.toISOString() : String(value ?? '');
		isEditing = true;
	}

	function commitEdit(): void {
		if (!isEditing) return;
		if (chart.updateTaskFromColumn(node, column, editValue)) isEditing = false;
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (isEditing) {
			if (event.key === 'Enter') {
				event.preventDefault();
				commitEdit();
			} else if (event.key === 'Escape') {
				event.preventDefault();
				isEditing = false;
			}
			return;
		}
		if ((event.key === 'Enter' || event.key === 'F2') && isEditable) {
			event.preventDefault();
			beginEdit();
			return;
		}
		onNavigate(event);
	}
</script>

<div
	data-gantt-chart-part="tree-cell"
	data-column-id={column.id}
	data-grid-row={rowIndex}
	data-grid-column={columnIndex}
	class={chart.classes.treeCell(chart.themeVariants)}
	class:justify-center={column.align === 'center'}
	class:justify-end={column.align === 'end'}
	style:width={`${column.width}px`}
	style:min-width={`${column.minWidth}px`}
	style:max-width={`${column.maxWidth}px`}
	style:padding-inline-start={column.id === 'title' ? `${titlePadding}px` : undefined}
	role="gridcell"
	aria-colindex={columnIndex + 1}
	aria-selected={isSelected}
	aria-label={`${label}: ${formattedValue}`}
	aria-describedby={chart.a11y.instructionsId}
	aria-keyshortcuts="Enter F2 Delete Backspace Alt+Shift+ArrowLeft Alt+Shift+ArrowRight Alt+Shift+ArrowUp Alt+Shift+ArrowDown"
	tabindex={isFocused && !chart.disabled ? 0 : -1}
	onfocus={onFocus}
	ondblclick={beginEdit}
	onkeydown={handleKeydown}
>
	{#if column.id === 'title'}
		{#if showDragHandle}
			<button
				type="button"
				data-dnd-handle
				class="text-neutral/45 hover:bg-neutral-muted/50 focus-visible:ring-focus/50 grid size-6 shrink-0 cursor-grab touch-none place-items-center rounded outline-none focus-visible:ring-2 active:cursor-grabbing"
				aria-label={messages.ganttChartReorderAction}
				tabindex="-1"
				onclick={(event) => event.stopPropagation()}
			>
				{@render dotsSixVerticalIcon({ size: 12 })}
			</button>
		{/if}
		{#if node.type === 'summary'}
			<button
				type="button"
				class={chart.classes.expander(chart.themeVariants)}
				aria-label={node.isExpanded
					? messages.ganttChartCollapseTask(node.task.title)
					: messages.ganttChartExpandTask(node.task.title)}
				aria-expanded={node.isExpanded}
				disabled={chart.disabled}
				tabindex="-1"
				onclick={(event) => {
					event.stopPropagation();
					chart.toggleTask(node.taskId);
				}}
			>
				{@render (node.isExpanded ? caretDownIcon : caretRightIcon)({ size: 12 })}
			</button>
		{:else}
			<span
				class={chart.classes.expander({
					...chart.themeVariants,
					class: 'pointer-events-none invisible'
				})}
				aria-hidden="true"
			></span>
		{/if}
	{/if}

	{#if isEditing}
		<input
			bind:value={editValue}
			class="border-color/45 bg-surface focus:ring-focus/50 min-w-0 flex-1 rounded border px-1 outline-none focus:ring-2"
			class:h-5={chart.size === 'small'}
			class:h-6={chart.size === 'normal'}
			class:h-7={chart.size === 'large'}
			aria-label={`${label}: ${formattedValue}`}
			onblur={commitEdit}
			onkeydown={(event) => {
				event.stopPropagation();
				handleKeydown(event);
			}}
			use:focusEditor
		/>
	{:else}
		{#if showResourceGroupLabel && resourceGroup}
			<span
				data-gantt-chart-part="resource-group-label"
				data-resource-id={resourceGroup.id}
				class="bg-surface-recessed text-neutral/65 inline-flex max-w-28 shrink-0 items-center gap-1 rounded px-1.5 py-0.5 font-medium"
				title={resourceGroup.title}
			>
				<span
					class="size-1.5 shrink-0 rounded-full"
					style:background-color={getGanttTaskColor(resourceGroup.color, chart.color)}
				></span>
				<span class="truncate">{resourceGroup.title}</span>
			</span>
		{/if}
		<Slot render={chart.renderers?.treeCell ?? defaultContent} {payload} />
		{#if column.id === 'title' && canOutdent}
			<button
				type="button"
				class="text-neutral/55 hover:bg-neutral-muted/50 focus-visible:ring-focus/50 grid size-6 shrink-0 place-items-center rounded outline-none focus-visible:ring-2"
				aria-label={messages.ganttChartOutdentAction}
				tabindex="-1"
				onclick={(event) => {
					event.stopPropagation();
					onOutdent();
				}}
			>
				{@render (chart.direction === 'rtl' ? arrowLineRightIcon : arrowLineLeftIcon)({ size: 12 })}
			</button>
		{/if}
		{#if column.id === 'title' && canIndent}
			<button
				type="button"
				class="text-neutral/55 hover:bg-neutral-muted/50 focus-visible:ring-focus/50 grid size-6 shrink-0 place-items-center rounded outline-none focus-visible:ring-2"
				aria-label={messages.ganttChartIndentAction}
				tabindex="-1"
				onclick={(event) => {
					event.stopPropagation();
					onIndent();
				}}
			>
				{@render (chart.direction === 'rtl' ? arrowLineLeftIcon : arrowLineRightIcon)({ size: 12 })}
			</button>
		{/if}
	{/if}
</div>

{#snippet defaultContent()}
	<span class="min-w-0 flex-1 truncate">{formattedValue}</span>
{/snippet}
