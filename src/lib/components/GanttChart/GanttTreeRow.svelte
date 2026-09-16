<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import GanttTreeCell from './GanttTreeCell.svelte';
	import type { GanttTaskRowPayload } from './ganttChart.props.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type {
		GanttColumnDefinition,
		GanttResolvedTaskNode,
		GanttResource
	} from './ganttChart.types.js';
	import type { Attachment } from 'svelte/attachments';

	let {
		chart,
		node,
		rowIndex,
		start,
		columns,
		resourceGroup,
		showResourceGroupLabel,
		isDropParent,
		showDragHandle,
		canIndent,
		canOutdent,
		rowAttachment,
		onIndent,
		onOutdent,
		onNavigate
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		node: GanttResolvedTaskNode<TTaskFields>;
		rowIndex: number;
		start: number;
		columns: readonly GanttColumnDefinition<
			TTaskFields,
			TDependencyFields,
			TResourceFields,
			TAssignmentFields
		>[];
		resourceGroup: GanttResource<TResourceFields> | null;
		showResourceGroupLabel: boolean;
		isDropParent: boolean;
		showDragHandle: boolean;
		canIndent: boolean;
		canOutdent: boolean;
		rowAttachment: Attachment<HTMLElement>;
		onIndent: () => void;
		onOutdent: () => void;
		onNavigate: (event: KeyboardEvent, columnIndex: number) => void;
	} = $props();

	const isSelected = $derived(chart.selectedRowTaskId === node.taskId);
	const isFocused = $derived(
		columns.some((column) => chart.a11y.isCellTabStop(node.taskId, column.id))
	);
	const rowPayload = $derived<GanttTaskRowPayload<TTaskFields>>({
		node,
		isSelected,
		isFocused,
		defaultContent: defaultRowContent
	});
</script>

<div
	data-gantt-chart-part="row"
	data-task-id={node.taskId}
	data-index={rowIndex}
	data-grid-row={rowIndex}
	data-resource-group={resourceGroup?.id}
	data-resource-group-start={showResourceGroupLabel || undefined}
	data-gantt-reorder-parent={isDropParent || undefined}
	class={chart.classes.row({
		...chart.themeVariants,
		class: isSelected ? 'bg-selected/6' : undefined
	})}
	style:top={`${start}px`}
	role="row"
	aria-rowindex={rowIndex + 2}
	aria-level={node.depth + 1}
	aria-expanded={node.type === 'summary' ? node.isExpanded : undefined}
	{@attach rowAttachment}
>
	{#if chart.renderers?.taskRow}
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<Slot render={chart.renderers.taskRow} payload={rowPayload} />
		</div>
	{/if}
	{#each columns as column, columnIndex (column.id)}
		<GanttTreeCell
			{chart}
			{node}
			{column}
			{rowIndex}
			{columnIndex}
			{resourceGroup}
			showResourceGroupLabel={showResourceGroupLabel && column.id === 'title'}
			showDragHandle={showDragHandle && column.id === 'title'}
			canIndent={canIndent && column.id === 'title'}
			canOutdent={canOutdent && column.id === 'title'}
			onFocus={() => chart.a11y.setCellTarget(node.taskId, column.id)}
			{onIndent}
			{onOutdent}
			onNavigate={(event) => onNavigate(event, columnIndex)}
		/>
	{/each}
</div>

{#snippet defaultRowContent()}{/snippet}
