<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import Slot from '$lib/components/Slot/Slot.svelte';
	import { getDateTimeFormatter } from '$lib/scheduling/zonedTime.js';
	import { getGanttTaskColor, isGanttSemanticColor } from './ganttChart.color.js';
	import type { GanttTimelineInteractionStatus } from './ganttChart.interactions.svelte.js';
	import { positionGanttTask } from './ganttChart.layout.js';
	import type { GanttDragPreviewPayload } from './ganttChart.props.js';
	import type { GanttRowModel } from './ganttChart.rows.js';
	import { getGanttScalePixel, type GanttTimeScale } from './ganttChart.scale.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type {
		GanttRange,
		GanttResolvedTaskNode,
		GanttTask,
		GanttTaskGeometry
	} from './ganttChart.types.js';

	let {
		chart,
		status,
		rowModel,
		scale,
		visibleRange,
		visiblePixels,
		totalHeight
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		status: GanttTimelineInteractionStatus<TTaskFields>;
		rowModel: GanttRowModel<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		scale: GanttTimeScale;
		visibleRange: GanttRange;
		visiblePixels: Readonly<{ start: number; end: number }>;
		totalHeight: number;
	} = $props();
	let labelWidth = $state(0);
	let labelHeight = $state(0);
	const LABEL_GAP = 8;
	const LABEL_EDGE_INSET = 8;

	const proposal = $derived(
		status.resolution.state === 'pending' ? null : status.resolution.proposal
	);
	const taskProposal = $derived(
		status.kind === 'task' && status.resolution.state !== 'pending'
			? status.resolution.proposal
			: null
	);
	const rangeProposal = $derived(
		status.kind === 'range' && status.resolution.state !== 'pending'
			? status.resolution.proposal
			: null
	);
	const isValid = $derived(status.resolution.state === 'accepted');
	const invalidReason = $derived(
		status.resolution.state === 'rejected' ? status.resolution.reason : null
	);
	const proposedTask = $derived(taskProposal?.task ?? null);
	const sourceNode = $derived.by(() => {
		if (status.kind !== 'task') return null;
		const rowIndex = rowModel.rowIndexByTaskId.get(status.taskId);
		return rowIndex === undefined ? null : (rowModel.rows[rowIndex] ?? null);
	});
	const previewNode = $derived(
		proposedTask && sourceNode ? createPreviewNode(sourceNode, proposedTask) : null
	);
	const positioned = $derived(
		previewNode
			? positionGanttTask({
					node: previewNode,
					rowTop: status.rowTop,
					rowHeight: chart.rowHeight,
					size: chart.size,
					scale,
					visibleRange,
					visiblePixels
				})
			: null
	);
	const rangeGeometry = $derived(
		rangeProposal
			? createRangeGeometry(rangeProposal, status.rowTop, chart.rowHeight, scale, visiblePixels)
			: null
	);
	const geometry = $derived(positioned?.geometry ?? rangeGeometry);
	const range = $derived(
		proposedTask?.start && proposedTask.end
			? { start: proposedTask.start, end: proposedTask.end }
			: rangeProposal
	);
	const semanticColor = $derived(
		proposedTask && isGanttSemanticColor(proposedTask.color) ? proposedTask.color : chart.color
	);
	const taskColor = $derived(getGanttTaskColor(proposedTask?.color, chart.color));
	const dateFormatter = $derived(
		getDateTimeFormatter(chart.messages.locale, chart.timeZone, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})
	);
	const rangeLabel = $derived(
		range
			? range.start.getTime() === range.end.getTime()
				? dateFormatter.format(range.start)
				: dateFormatter.formatRange(range.start, range.end)
			: ''
	);
	const durationLabel = $derived(
		`${new Intl.NumberFormat(chart.messages.locale, { maximumFractionDigits: 2 }).format(status.workingDurationMinutes)} min`
	);
	const isProgressOperation = $derived(status.kind === 'task' && status.operation === 'progress');
	const progressLabel = $derived(
		new Intl.NumberFormat(chart.messages.locale, {
			style: 'percent',
			maximumFractionDigits: 0
		}).format(proposedTask?.progress ?? 0)
	);
	const labelPlacement = $derived.by(() => {
		const minimumLeft = visiblePixels.start + LABEL_EDGE_INSET;
		const maximumLeft = Math.max(minimumLeft, visiblePixels.end - labelWidth - LABEL_EDGE_INSET);
		const left = Math.max(
			minimumLeft,
			Math.min(maximumLeft, status.pointerCanvasX - labelWidth / 2)
		);
		const previewTop = geometry?.top ?? status.rowTop;
		const previewBottom = geometry
			? geometry.top + geometry.height
			: status.rowTop + chart.rowHeight;
		const above = previewTop - labelHeight - LABEL_GAP;
		const below = previewBottom + LABEL_GAP;
		const maximumTop = Math.max(LABEL_EDGE_INSET, totalHeight - labelHeight - LABEL_EDGE_INSET);
		const side = above >= LABEL_EDGE_INSET ? 'top' : 'bottom';
		return {
			left,
			top: Math.max(LABEL_EDGE_INSET, Math.min(maximumTop, side === 'top' ? above : below)),
			side
		};
	});
	const payload = $derived(
		proposal && geometry
			? ({
					proposal,
					geometry,
					isValid,
					invalidReason,
					defaultContent
				} satisfies GanttDragPreviewPayload<TTaskFields>)
			: null
	);

	function createPreviewNode(
		node: GanttResolvedTaskNode<TTaskFields>,
		task: GanttTask<TTaskFields>
	): GanttResolvedTaskNode<TTaskFields> {
		return {
			...node,
			task,
			resolvedStart: task.start ? new Date(task.start) : null,
			resolvedEnd: task.end ? new Date(task.end) : null,
			progress: task.progress ?? 0
		};
	}

	function createRangeGeometry(
		proposal: GanttRange,
		rowTop: number,
		logicalRowHeight: number,
		currentScale: GanttTimeScale,
		currentVisiblePixels: Readonly<{ start: number; end: number }>
	): GanttTaskGeometry {
		const start = getGanttScalePixel(currentScale, proposal.start);
		const end = getGanttScalePixel(currentScale, proposal.end);
		const left = Math.min(start, end);
		const width = Math.max(1, Math.abs(end - start));
		const visibleLeft = Math.max(left, currentVisiblePixels.start);
		const visibleEnd = Math.min(left + width, currentVisiblePixels.end);
		return {
			left,
			top: rowTop + 5,
			width,
			height: Math.max(8, logicalRowHeight - 10),
			visibleLeft,
			visibleWidth: Math.max(0, visibleEnd - visibleLeft),
			continuesBefore: proposal.start.getTime() < visibleRange.start.getTime(),
			continuesAfter: proposal.end.getTime() > visibleRange.end.getTime()
		};
	}
</script>

{#if isValid && proposal && geometry && payload && range}
	<div
		data-gantt-chart-part={status.kind === 'range' ? 'range-selection' : 'drag-preview'}
		data-operation={status.kind === 'task' ? status.operation : 'range'}
		class={(status.kind === 'range' ? chart.classes.rangeSelection : chart.classes.dragPreview)({
			size: chart.size,
			density: chart.density,
			color: semanticColor,
			disabled: chart.disabled
		})}
		style:--gantt-task-color={taskColor}
		style:left={`${geometry.left}px`}
		style:top={`${geometry.top}px`}
		style:width={`${geometry.width}px`}
		style:height={`${geometry.height}px`}
		aria-hidden="true"
	>
		<Slot render={chart.renderers?.dragPreview ?? defaultContent} {payload} />
	</div>
	<div
		bind:offsetWidth={labelWidth}
		bind:offsetHeight={labelHeight}
		data-gantt-chart-part="drag-preview-label"
		data-side={labelPlacement.side}
		class="bg-surface-raised/95 text-neutral raised-4 pointer-events-none absolute z-50 grid max-w-72 gap-0.5 rounded-md px-2 py-1 text-xs backdrop-blur"
		style:left={`${labelPlacement.left}px`}
		style:top={`${labelPlacement.top}px`}
		aria-hidden="true"
	>
		{#if isProgressOperation}
			<strong class="tabular-nums">{progressLabel}</strong>
		{:else}
			{#if proposedTask}<strong class="truncate">{proposedTask.title}</strong>{/if}
			<span class="whitespace-nowrap">{rangeLabel}</span>
			<span class="text-neutral/70 tabular-nums">{durationLabel}</span>
		{/if}
	</div>
{/if}

{#snippet defaultContent()}
	<span class="absolute inset-0 rounded-[inherit] bg-[var(--gantt-task-color)]/10"></span>
{/snippet}
