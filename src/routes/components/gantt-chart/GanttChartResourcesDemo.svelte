<script lang="ts">
	import { Button } from '$lib/components/Button/index.js';
	import {
		GanttChart,
		type GanttAssignment,
		type GanttResource,
		type GanttResourceAssignmentsPayload,
		type GanttTask,
		type GanttWorkloadCellPayload
	} from '$lib/components/GanttChart/index.js';
	import { parisFourDayCalendar, parisProjectCalendar } from './ganttChartDemoData.js';

	type ResourceFields = { role: string };
	type AssignmentFields = { booking: 'confirmed' | 'tentative' };
	type ResourceAssignmentsPayload = GanttResourceAssignmentsPayload<
		Record<never, never>,
		ResourceFields,
		AssignmentFields
	>;
	type WorkloadCellPayload = GanttWorkloadCellPayload<ResourceFields>;

	let activeResourceId = $state<string | null>(null);
	let tasks = $state<GanttTask[]>([
		{
			id: 'design-system',
			title: 'Design system',
			start: new Date('2026-08-03T07:00:00.000Z'),
			end: new Date('2026-08-07T15:00:00.000Z'),
			progress: 0.45
		},
		{
			id: 'checkout',
			title: 'Checkout flow',
			start: new Date('2026-08-04T07:00:00.000Z'),
			end: new Date('2026-08-10T15:00:00.000Z'),
			progress: 0.2
		},
		{
			id: 'qa',
			title: 'Release QA',
			start: new Date('2026-08-10T07:00:00.000Z'),
			end: new Date('2026-08-13T15:00:00.000Z'),
			progress: 0.05
		}
	]);
	const resources: GanttResource<ResourceFields>[] = [
		{ id: 'product', title: 'Product team', role: 'Group' },
		{
			id: 'ada',
			parentId: 'product',
			title: 'Ada',
			role: 'Product designer',
			capacity: 1,
			color: 'purple'
		},
		{
			id: 'lin',
			parentId: 'product',
			title: 'Lin',
			role: 'Frontend engineer',
			capacity: 1,
			calendarId: parisFourDayCalendar.id,
			color: 'blue'
		},
		{
			id: 'sam',
			parentId: 'product',
			title: 'Sam',
			role: 'QA engineer',
			capacity: 0.75,
			color: 'green'
		}
	];
	let assignments = $state<GanttAssignment<AssignmentFields>[]>([
		{
			id: 'ada-design',
			taskId: 'design-system',
			resourceId: 'ada',
			units: 0.75,
			booking: 'confirmed'
		},
		{
			id: 'ada-checkout',
			taskId: 'checkout',
			resourceId: 'ada',
			units: 0.75,
			booking: 'tentative'
		},
		{
			id: 'lin-checkout',
			taskId: 'checkout',
			resourceId: 'lin',
			units: 0.8,
			booking: 'confirmed'
		},
		{
			id: 'sam-qa',
			taskId: 'qa',
			resourceId: 'sam',
			units: 0.75,
			booking: 'confirmed'
		}
	]);
</script>

{#snippet customResourceAssignments(payload: ResourceAssignmentsPayload)}
	{@render payload.defaultContent()}
	{#if payload.isOverAllocated}<span class="sr-only">Over allocated</span>{/if}
	{#if payload.assignments.some((assignment) => assignment.booking === 'tentative')}
		<span class="text-warning text-[0.65rem]">tentative</span>
	{/if}
	<span class="sr-only">{payload.resources.map((resource) => resource.role).join(', ')}</span>
{/snippet}

{#snippet customWorkloadCell(payload: WorkloadCellPayload)}
	{@render payload.defaultContent()}
	<span class="sr-only">{payload.resource.role}; {payload.bucket.taskIds.length} tasks</span>
{/snippet}

<div class="grid w-full gap-3">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<p class="text-neutral/65 text-sm">
			Ada is deliberately over-allocated; Lin uses a four-day resource calendar.
		</p>
		<div class="flex flex-wrap gap-2">
			<Button size="small" variant="outline" onclick={() => (activeResourceId = null)}>All</Button>
			{#each resources.filter((resource) => resource.parentId) as resource (resource.id)}
				<Button
					size="small"
					variant={activeResourceId === resource.id ? 'solid' : 'outline'}
					onclick={() => (activeResourceId = resource.id)}>{resource.title}</Button
				>
			{/each}
		</div>
	</div>
	<GanttChart
		bind:tasks
		bind:assignments
		{resources}
		calendars={[parisProjectCalendar, parisFourDayCalendar]}
		timeZone="Europe/Paris"
		schedule={{ calendarId: parisProjectCalendar.id }}
		timeline={{
			display: { workload: true },
			resourceView: {
				filterResourceIds: activeResourceId ? [activeResourceId] : [],
				groupByResource: true,
				workloadHeight: 120
			}
		}}
		render={{
			resourceAssignments: customResourceAssignments,
			workloadCell: customWorkloadCell
		}}
		class="h-[37rem] w-full"
	/>
</div>
