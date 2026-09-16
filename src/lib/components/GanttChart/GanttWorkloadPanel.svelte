<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import ScrollArea from '$lib/components/ScrollArea/ScrollArea.svelte';
	import type { Density } from '$lib/types/theme.js';
	import { createVirtualizer } from '@tanstack/svelte-virtual';
	import { get } from 'svelte/store';
	import GanttWorkloadCell from './GanttWorkloadCell.svelte';
	import { getGanttTaskColor } from './ganttChart.color.js';
	import type { GanttResolvedResourceView } from './ganttChart.resourceView.js';
	import {
		getGanttScaleCells,
		type GanttPositionedScaleCell,
		type GanttTimeScale
	} from './ganttChart.scale.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type { GanttResource, GanttWorkloadBucket } from './ganttChart.types.js';

	const WORKLOAD_METRICS: Record<Density, Readonly<{ headerHeight: number; rowHeight: number }>> = {
		compact: { headerHeight: 24, rowHeight: 28 },
		normal: { headerHeight: 28, rowHeight: 32 },
		comfortable: { headerHeight: 32, rowHeight: 40 }
	};

	let {
		chart,
		resourceView,
		scale,
		visiblePixels,
		viewportWidth,
		height
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		resourceView: GanttResolvedResourceView<TResourceFields>;
		scale: GanttTimeScale;
		visiblePixels: Readonly<{ start: number; end: number }>;
		viewportWidth: number;
		height: number;
	} = $props();

	let verticalViewport = $state<HTMLDivElement | null>(null);
	const headerHeight = $derived(WORKLOAD_METRICS[chart.density].headerHeight);
	const resourceRowHeight = $derived(WORKLOAD_METRICS[chart.density].rowHeight);
	const effectiveViewportWidth = $derived(Math.max(1, viewportWidth));
	const frameLeft = $derived(
		Math.max(0, Math.min(scale.totalWidth - effectiveViewportWidth, visiblePixels.start))
	);
	const bodyHeight = $derived(Math.max(resourceRowHeight, height - headerHeight));
	const visibleCells = $derived(
		getGanttScaleCells(scale, 'lower', visiblePixels, Math.max(120, effectiveViewportWidth / 3))
	);
	const bucketsByResourceId = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Rebuilt immutable lookup for one derived snapshot.
		const index = new Map<string, GanttWorkloadBucket[]>();
		for (const bucket of chart.schedule.workload) {
			const buckets = index.get(bucket.resourceId) ?? [];
			buckets.push(bucket);
			index.set(bucket.resourceId, buckets);
		}
		return index;
	});
	const numberFormatter = $derived(
		new Intl.NumberFormat(chart.messages.locale, { maximumFractionDigits: 2 })
	);
	const resourceVirtualizerStore = createVirtualizer<HTMLElement, HTMLElement>({
		count: 0,
		getScrollElement: () => null,
		estimateSize: () => resourceRowHeight,
		overscan: 3
	});

	$effect(() => {
		const resources = resourceView.resources;
		const viewport = verticalViewport;
		const viewportHeight = bodyHeight;
		void viewportHeight;
		get(resourceVirtualizerStore).setOptions({
			count: resources.length,
			getScrollElement: () => viewport,
			estimateSize: () => resourceRowHeight,
			overscan: 3,
			getItemKey: (index) => resources[index]?.id ?? index
		});
	});

	const virtualRows = $derived($resourceVirtualizerStore.getVirtualItems());
	const fallbackCount = $derived(
		Math.min(resourceView.resources.length, Math.ceil(bodyHeight / resourceRowHeight) + 3)
	);
	const renderedRows = $derived(
		virtualRows.length > 0
			? virtualRows
			: Array.from({ length: fallbackCount }, (_, index) => ({
					index,
					key: resourceView.resources[index]?.id ?? index,
					start: index * resourceRowHeight,
					end: (index + 1) * resourceRowHeight,
					size: resourceRowHeight,
					lane: 0
				}))
	);
	const totalRowsHeight = $derived(
		$resourceVirtualizerStore.getTotalSize() || resourceView.resources.length * resourceRowHeight
	);

	function resolveCellBucket(
		resource: GanttResource<TResourceFields>,
		positionedCell: GanttPositionedScaleCell
	): GanttWorkloadBucket {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- Ephemeral aggregation local to this calculation.
		const taskIds = new Set<string>();
		let assignedUnits = 0;
		let isOverAllocated = false;
		for (const bucket of bucketsByResourceId.get(resource.id) ?? []) {
			if (
				bucket.start.getTime() >= positionedCell.cell.end.getTime() ||
				bucket.end.getTime() <= positionedCell.cell.start.getTime()
			) {
				continue;
			}
			assignedUnits = Math.max(assignedUnits, bucket.assignedUnits);
			isOverAllocated ||= bucket.isOverAllocated;
			for (const taskId of bucket.taskIds) taskIds.add(taskId);
		}
		return {
			resourceId: resource.id,
			start: new Date(positionedCell.cell.start),
			end: new Date(positionedCell.cell.end),
			assignedUnits,
			capacity: resource.capacity ?? 1,
			isOverAllocated,
			taskIds: [...taskIds]
		};
	}

	function getCellLabel(
		resource: GanttResource<TResourceFields>,
		positionedCell: GanttPositionedScaleCell,
		bucket: GanttWorkloadBucket
	): string {
		const labels = [
			resource.title,
			positionedCell.label,
			chart.messages.ganttChartAssignedUnits(numberFormatter.format(bucket.assignedUnits)),
			chart.messages.ganttChartCapacity(numberFormatter.format(bucket.capacity))
		];
		if (bucket.isOverAllocated) {
			labels.push(chart.messages.ganttChartOverAllocated(resource.title));
		}
		return labels.join(', ');
	}
</script>

<div
	data-gantt-chart-part="workload-panel"
	class={chart.classes.workloadPanel({ ...chart.themeVariants, class: 'overflow-hidden' })}
	style:width={`${scale.totalWidth}px`}
	style:height={`${height}px`}
>
	<div
		class="bg-surface absolute top-0 overflow-hidden"
		style:left={`${frameLeft}px`}
		style:width={`${effectiveViewportWidth}px`}
		style:height={`${height}px`}
		dir={chart.direction}
		role="table"
		aria-label={chart.messages.ganttChartWorkload}
		aria-rowcount={resourceView.resources.length + 1}
	>
		<div
			class="border-neutral-muted bg-surface-raised/95 text-neutral/70 relative border-b font-semibold"
			style:height={`${headerHeight}px`}
			role="row"
		>
			{#each visibleCells as positionedCell (positionedCell.cell.index)}
				<div
					class={chart.classes.workloadCell({
						...chart.themeVariants,
						class: 'flex items-center justify-center'
					})}
					style:left={`${positionedCell.left - frameLeft}px`}
					style:width={`${positionedCell.width}px`}
					style:height={`${headerHeight}px`}
					role="columnheader"
				>
					<span class="truncate px-1">{positionedCell.label}</span>
				</div>
			{/each}
			<div
				class="border-neutral-muted bg-surface-raised/95 absolute inset-y-0 z-20 flex w-36 items-center border-e px-2"
				class:left-0={chart.direction === 'ltr'}
				class:right-0={chart.direction === 'rtl'}
				role="columnheader"
			>
				{chart.messages.ganttChartWorkload}
			</div>
		</div>
		<div class="relative" style:height={`${bodyHeight}px`}>
			<ScrollArea
				bind:viewportRef={verticalViewport}
				class="h-full min-w-0"
				label={chart.messages.ganttChartWorkload}
				type="hover"
			>
				<div class="relative" style:height={`${totalRowsHeight}px`} role="rowgroup">
					{#each renderedRows as virtualRow (virtualRow.key)}
						{@const resource = resourceView.resources[virtualRow.index]}
						{#if resource}
							<div
								data-gantt-chart-part="workload-row"
								data-resource-id={resource.id}
								data-resource-depth={resourceView.depthByResourceId.get(resource.id) ?? 0}
								class="border-neutral-muted/55 absolute inset-x-0 border-b"
								style:top={`${virtualRow.start}px`}
								style:height={`${resourceRowHeight}px`}
								role="row"
								aria-rowindex={virtualRow.index + 2}
							>
								{#each visibleCells as positionedCell (positionedCell.cell.index)}
									{@const bucket = resolveCellBucket(resource, positionedCell)}
									<GanttWorkloadCell
										{chart}
										{resource}
										{bucket}
										left={positionedCell.left - frameLeft}
										width={positionedCell.width}
										height={resourceRowHeight}
										accessibleLabel={getCellLabel(resource, positionedCell, bucket)}
									/>
								{/each}
								<div
									class="border-neutral-muted bg-surface/95 absolute inset-y-0 z-20 flex w-36 items-center gap-1.5 border-e px-2"
									class:left-0={chart.direction === 'ltr'}
									class:right-0={chart.direction === 'rtl'}
									style:padding-inline-start={`${8 + (resourceView.depthByResourceId.get(resource.id) ?? 0) * 14}px`}
									role="rowheader"
								>
									<span
										class="size-2 shrink-0 rounded-full"
										style:background-color={getGanttTaskColor(resource.color, chart.color)}
									></span>
									<span class="truncate">{resource.title}</span>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</ScrollArea>
		</div>
	</div>
</div>
