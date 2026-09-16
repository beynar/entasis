<script
	lang="ts"
	generics="TTaskFields extends object, TDependencyFields extends object, TResourceFields extends object, TAssignmentFields extends object"
>
	import type { GanttDependencyInteractionStatus } from './ganttChart.dependencyInteraction.svelte.js';
	import type { GanttChartState } from './ganttChart.state.svelte.js';

	let {
		chart,
		status,
		totalWidth,
		totalHeight
	}: {
		chart: GanttChartState<TTaskFields, TDependencyFields, TResourceFields, TAssignmentFields>;
		status: GanttDependencyInteractionStatus;
		totalWidth: number;
		totalHeight: number;
	} = $props();

	const middleX = $derived((status.fromX + status.toX) / 2);
	const isValid = $derived(status.resolution.state === 'accepted');
	const dependencyType = $derived(
		status.resolution.state === 'pending' ? null : status.resolution.proposal?.type
	);
	const markerId = $props.id();
	const path = $derived(
		`M ${status.fromX} ${status.fromY} C ${middleX} ${status.fromY}, ${middleX} ${status.toY}, ${status.toX} ${status.toY}`
	);
</script>

<svg
	data-gantt-chart-part="dependency-preview"
	data-dependency-type={dependencyType ?? undefined}
	data-valid={isValid || undefined}
	class="pointer-events-none absolute inset-0 z-40 overflow-visible"
	width={totalWidth}
	height={totalHeight}
	viewBox={`0 0 ${totalWidth} ${totalHeight}`}
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
			<path d="M 0 0 L 8 4 L 0 8 z" class="fill-[var(--color)]"></path>
		</marker>
	</defs>
	<path
		d={path}
		class={chart.classes.connector({
			...chart.themeVariants,
			class:
				'stroke-[color-mix(in_oklab,var(--color)_70%,transparent)] stroke-2 [stroke-dasharray:5_4]'
		})}
		marker-end={`url(#${markerId})`}
	></path>
	{#if isValid}
		<circle
			cx={status.toX}
			cy={status.toY}
			r="5"
			class="stroke-surface fill-[var(--color)] stroke-2"
		></circle>
	{/if}
</svg>
