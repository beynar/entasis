<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		GanttChart,
		type GanttChartApi,
		type GanttDependency,
		type GanttDependencyCreationRequest,
		type GanttRangeProposal,
		type GanttTask,
		type GanttTasksChange
	} from '$lib/components/GanttChart/index.js';
	import { parisProjectCalendar } from './ganttChartDemoData.js';

	let nextDependencyId = 0;
	let chart = $state<GanttChartApi | null>(null);
	let status = $state('Drag a task, resize an edge, or focus a task and press M, S, E, or P.');
	let lastChange = $state.raw<GanttTasksChange | null>(null);
	let tasks = $state<GanttTask[]>([
		{
			id: 'prototype',
			title: 'Prototype',
			start: new Date('2026-08-03T07:00:00.000Z'),
			end: new Date('2026-08-06T15:00:00.000Z'),
			progress: 0.55
		},
		{
			id: 'validation',
			title: 'Validation',
			start: new Date('2026-08-07T07:00:00.000Z'),
			end: new Date('2026-08-12T15:00:00.000Z'),
			progress: 0.15
		}
	]);
	let dependencies = $state<GanttDependency[]>([]);

	function createDependency(request: GanttDependencyCreationRequest): GanttDependency {
		nextDependencyId += 1;
		return {
			id: `interaction-dependency-${nextDependencyId}`,
			fromTaskId: request.fromTaskId,
			toTaskId: request.toTaskId,
			type: request.type
		};
	}

	function handleTasksChange(change: GanttTasksChange): void {
		lastChange = change;
		status = `${change.kind} committed from ${change.source}; ${change.affectedTaskIds.length} task definition${change.affectedTaskIds.length === 1 ? '' : 's'} changed.`;
	}

	function handleRange(proposal: GanttRangeProposal): void {
		status = `Proposed empty range ${proposal.start.toLocaleString()} – ${proposal.end.toLocaleString()}.`;
	}

	function revertLastChange(): void {
		if (!lastChange) return;
		lastChange.revert();
		lastChange = null;
		status = 'The guarded revert restored the prior controlled array.';
	}
</script>

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/65 text-sm" aria-live="polite">{status}</p>
		<div class="flex flex-wrap gap-2">
			<Button size="small" variant="outline" onclick={() => chart?.copySelection()}>Copy</Button>
			<Button size="small" variant="outline" onclick={() => chart?.paste()}>Paste</Button>
			<Button
				size="small"
				variant="outline"
				disabled={!chart?.canUndo()}
				onclick={() => chart?.undo()}
			>
				Undo
			</Button>
			<Button
				size="small"
				variant="outline"
				disabled={!chart?.canRedo()}
				onclick={() => chart?.redo()}
			>
				Redo
			</Button>
			<Button size="small" variant="outline" disabled={!lastChange} onclick={revertLastChange}>
				Revert
			</Button>
		</div>
	</div>
	<GanttChart
		bind:this={chart}
		bind:tasks
		bind:dependencies
		calendars={[parisProjectCalendar]}
		timeZone="Europe/Paris"
		schedule={{ calendarId: parisProjectCalendar.id }}
		interactions={{
			dependencyCreation: { create: createDependency },
			clipboard: {
				getId: ({ kind, sourceId, copyIndex }) => `${kind}-${sourceId}-copy-${copyIndex}`
			},
			history: { limit: 20 }
		}}
		mutations={{ task: { onTasksChange: handleTasksChange } }}
		events={{
			onSelect: handleRange,
			onInteractionBlocked: (info) => (status = info.message)
		}}
		class="h-[31rem] w-full"
	/>
</div>
