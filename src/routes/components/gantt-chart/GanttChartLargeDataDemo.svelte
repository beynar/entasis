<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/Button/index.js';
	import {
		GanttChart,
		type GanttChartApi,
		type GanttTask
	} from '$lib/components/GanttChart/index.js';

	const taskCount = 5_000;
	let chart = $state<GanttChartApi | null>(null);
	let root = $state<HTMLElement | null>(null);
	let mountedRows = $state(0);
	let tasks = $state<GanttTask[]>(
		Array.from({ length: taskCount }, (_, index) => {
			const dayOffset = index % 90;
			const start = new Date(Date.UTC(2026, 0, 5 + dayOffset, 9));
			return {
				id: `large-task-${index + 1}`,
				title: `Work package ${String(index + 1).padStart(4, '0')}`,
				start,
				end: new Date(start.getTime() + 3 * 86_400_000),
				progress: (index % 10) / 10
			};
		})
	);

	onMount(() => {
		if (!root) return;
		const updateMountedRows = () => {
			mountedRows = root?.querySelectorAll('[data-gantt-chart-part="row"]').length ?? 0;
		};
		updateMountedRows();
		const observer = new MutationObserver(updateMountedRows);
		observer.observe(root, { childList: true, subtree: true });
		return () => observer.disconnect();
	});
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/65 text-sm" aria-live="polite">
			{taskCount.toLocaleString()} controlled tasks · {mountedRows} tree rows currently mounted
		</p>
		<div class="flex flex-wrap gap-2">
			<Button size="small" variant="outline" onclick={() => chart?.scrollToTask('large-task-1')}>
				First task
			</Button>
			<Button
				size="small"
				variant="outline"
				onclick={() => chart?.scrollToTask(`large-task-${taskCount}`)}
			>
				Last task
			</Button>
		</div>
	</div>
	<GanttChart
		bind:this={chart}
		bind:ref={root}
		bind:tasks
		timeZone="UTC"
		zoom="month"
		density="compact"
		class="h-[30rem] w-full"
	/>
</div>
