<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import GanttDependencyControl from './GanttDependencyControl.svelte';
	import { positionGanttDependency } from './ganttChart.layout.js';
	import type { GanttTimeScale } from './ganttChart.scale.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';
	import type { GanttResolvedDependency } from './ganttChart.types.js';

	let {
		chart,
		rowIndexByTaskId,
		totalHeight,
		scale,
		visiblePixels,
		visibleRows
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		rowIndexByTaskId: ReadonlyMap<string, number>;
		totalHeight: number;
		scale: GanttTimeScale;
		visiblePixels: Readonly<{ start: number; end: number }>;
		visibleRows: Readonly<{ start: number; end: number }>;
	} = $props();

	const markerId = $props.id();
	const positionedDependencies = $derived(
		chart.schedule.analysis.dependencies.flatMap((dependency) => {
			const geometry = positionGanttDependency({
				dependency,
				rowIndexByTaskId,
				rowHeight: chart.rowHeight,
				scale,
				visiblePixels,
				visibleRows
			});
			return geometry?.visible ? [{ dependency, geometry }] : [];
		})
	);

	function activate(
		dependency: GanttResolvedDependency<TTaskFields, TDependencyFields>,
		event: MouseEvent
	): void {
		event.stopPropagation();
		if (chart.disabled) return;
		chart.a11y.setDependencyTarget(dependency.dependency.id);
		chart.eventHandlers?.onDependencyClick?.({ dependency, event });
	}
</script>

<svg
	data-gantt-chart-part="connector-layer"
	class={chart.classes.connectorLayer(chart.themeVariants)}
	width={scale.totalWidth}
	height={totalHeight}
	viewBox={`0 0 ${scale.totalWidth} ${totalHeight}`}
	aria-hidden="true"
>
	<defs>
		<marker
			id={markerId}
			viewBox="0 0 8 8"
			refX="7"
			refY="4"
			markerWidth="6"
			markerHeight="6"
			orient="auto-start-reverse"
		>
			<path d="M 0 0 L 8 4 L 0 8 z" class="fill-neutral/55"></path>
		</marker>
	</defs>
	{#each positionedDependencies as positioned (positioned.dependency.dependency.id)}
		{@const isSelected =
			chart.selection.kind === 'dependency' &&
			chart.selection.dependencyId === positioned.dependency.dependency.id}
		{@const isCritical = chart.display.criticalPath && positioned.dependency.isCritical}
		<path
			d={positioned.geometry.path}
			data-gantt-chart-part="connector"
			data-dependency-id={positioned.dependency.dependency.id}
			data-critical={isCritical || undefined}
			data-selected={isSelected || undefined}
			class={chart.classes.connector({
				...chart.themeVariants,
				critical: isCritical,
				class: [isCritical ? 'stroke-danger' : undefined, isSelected ? 'stroke-[2.5]' : undefined]
			})}
			marker-end={`url(#${markerId})`}
			aria-hidden="true"
		></path>
		<path
			d={positioned.geometry.path}
			data-gantt-chart-part="connector-hit-target"
			data-dependency-id={positioned.dependency.dependency.id}
			class={chart.classes.connectorHitTarget(chart.themeVariants)}
			pointer-events="stroke"
			aria-hidden="true"
			onclick={(event) => activate(positioned.dependency, event)}
		></path>
	{/each}
</svg>

<div
	class="pointer-events-none absolute inset-0"
	style:width={`${scale.totalWidth}px`}
	style:height={`${totalHeight}px`}
>
	{#each positionedDependencies as positioned (positioned.dependency.dependency.id)}
		<GanttDependencyControl
			{chart}
			dependency={positioned.dependency}
			geometry={positioned.geometry}
			onActivate={(event) => activate(positioned.dependency, event)}
		/>
	{/each}
</div>
